/**
 * Client for the autonomous FastAPI backend.
 *
 * CORS: the backend must allow https://toolpika.vercel.app (and localhost:3000)
 * in its CORS_ORIGINS list. This module only reads the public URL from the
 * environment and never sends credentials.
 */

export const BACKEND_URL_ENV = "NEXT_PUBLIC_BACKEND_API_URL";

export interface PipelineRun {
  stage?: string;
  status?: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

export interface PipelineStatus {
  queue_depth: number;
  recent_runs: PipelineRun[];
}

export interface BackendTool {
  slug: string;
  status?: string;
  tier?: number;
  category?: string;
  translation_status?: string;
  source_hash?: string;
  updated_at?: string;
}

export interface PipelineResult {
  success: boolean;
  slug?: string | null;
  stage: string;
  logs: string[];
}

export interface TranslationResult {
  success: boolean;
  translated_locales: string[];
  failed_locales: string[];
}

export interface BackendConfig {
  pipeline_enabled: boolean;
  available_locales: string[];
  max_retries: number;
}

export class BackendError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}

/** Read and normalise the backend base URL, failing loudly when misconfigured. */
export function getBackendUrl(): string {
  const raw = process.env[BACKEND_URL_ENV];
  if (!raw || !raw.trim()) {
    throw new Error(
      `${BACKEND_URL_ENV} is missing. Add it to .env.local and to the Vercel project environment.`,
    );
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`${BACKEND_URL_ENV} is not a valid URL: "${raw}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${BACKEND_URL_ENV} must use http or https.`);
  }
  return url.toString().replace(/\/$/, "");
}

async function request<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new BackendError(`Backend unreachable: ${reason}`, 0);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new BackendError(
      `Backend returned ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
      response.status,
    );
  }

  return (await response.json()) as T;
}

/** Start a full research → generate → QA → publish pipeline run. */
export function triggerPipeline(topic?: string): Promise<PipelineResult> {
  return request<PipelineResult>("/api/pipeline/research-and-build", {
    method: "POST",
    body: JSON.stringify({ topic: topic?.trim() || null }),
  });
}

/** Fetch queue depth and the most recent pipeline runs. */
export function getPipelineStatus(): Promise<PipelineStatus> {
  return request<PipelineStatus>("/api/admin/pipeline-status");
}

/** List tools and their publication / translation status. */
export function listBackendTools(): Promise<BackendTool[]> {
  return request<BackendTool[]>("/api/tools");
}

/** Force chunked translation for one tool. */
export function translateTool(
  slug: string,
  locales?: string[],
): Promise<TranslationResult> {
  return request<TranslationResult>("/api/pipeline/translate", {
    method: "POST",
    body: JSON.stringify({ slug, locales: locales?.length ? locales : undefined }),
  });
}

/** Read safe pipeline configuration exposed by the backend. */
export function getBackendConfig(): Promise<BackendConfig> {
  return request<BackendConfig>("/api/admin/config");
}

/* -------------------------------------------------------------------------- */
/* Tool Studio                                                                */
/* -------------------------------------------------------------------------- */

const STUDIO_TIMEOUT = 240_000;

export interface StudioConfig {
  enabled: boolean;
  model: string;
  translation_model: string;
  locales: string[];
  qa_max_retries: number;
  frontend_path_configured: boolean;
  github_configured: boolean;
  github_repo?: string | null;
  github_base_branch: string;
  auto_merge_pr: boolean;
}

export interface StudioContextDigest {
  tool_count?: number;
  published_count?: number;
  locales?: string[];
  tools?: { slug: string; name: string }[];
  relevant_slugs?: string[];
}

export interface StudioSession {
  id: string;
  title: string;
  idea?: string | null;
  source_url?: string | null;
  stage: string;
  status: string;
  context: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface StudioMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  artifacts: Record<string, unknown>;
  created_at?: string;
}

export interface StudioCodeFile {
  path: string;
  content: string;
  kind: "module" | "manifest" | "registry" | "content";
}

export interface StudioDraft {
  id: string;
  session_id: string;
  slug: string;
  blueprint: Record<string, unknown>;
  spec?: Record<string, unknown> | null;
  code_files?: StudioCodeFile[];
  qa?: Record<string, unknown>;
  status: string;
  preview_url?: string | null;
  pr_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudioPipelineStep {
  key: string;
  stage: string;
  label: string;
  status: "pending" | "running" | "done" | "error" | "skipped";
  logs: string[];
  started_at?: string | null;
  finished_at?: string | null;
}

export interface StudioPipelineState {
  running: boolean;
  idea?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  steps: StudioPipelineStep[];
}

export interface StudioBundle {
  session: StudioSession;
  messages: StudioMessage[];
  draft: StudioDraft | null;
  context: StudioContextDigest;
  pipeline: StudioPipelineState;
}

export interface StudioAutoRunInput {
  idea?: string;
  source_url?: string;
  locales?: string[];
}

export interface StudioSessionInput {
  title?: string;
  idea?: string;
  source_url?: string;
}

/** Read Studio configuration and live provider settings. */
export function getStudioConfig(): Promise<StudioConfig> {
  return request<StudioConfig>("/api/studio/config", undefined, 30_000);
}

/** List recent Studio chat sessions. */
export function listStudioSessions(): Promise<StudioSession[]> {
  return request<StudioSession[]>("/api/studio/sessions", undefined, 30_000);
}

/** Create a new Studio chat session. */
export function createStudioSession(
  payload: StudioSessionInput,
): Promise<StudioBundle> {
  return request<StudioBundle>(
    "/api/studio/sessions",
    { method: "POST", body: JSON.stringify(payload) },
    STUDIO_TIMEOUT,
  );
}

/** Load one Studio session with its messages and current draft. */
export function getStudioSession(sessionId: string): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}`,
    undefined,
    30_000,
  );
}

/** Send one chat message to the RAG-enabled Studio assistant. */
export function chatStudio(
  sessionId: string,
  message: string,
  autoPlan = true,
): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ message, auto_plan: autoPlan }),
    },
    STUDIO_TIMEOUT,
  );
}

/** Explicitly research an idea or competitor URL and build a blueprint. */
export function planStudio(
  sessionId: string,
  idea?: string,
  sourceUrl?: string,
): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/plan`,
    {
      method: "POST",
      body: JSON.stringify({ idea: idea || null, source_url: sourceUrl || null }),
    },
    STUDIO_TIMEOUT,
  );
}

/** Generate and QA the ToolSpec plus the runnable TypeScript module. */
export function generateStudio(sessionId: string): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/generate`,
    { method: "POST" },
    STUDIO_TIMEOUT,
  );
}

/** Write the generated files into the frontend checkout. */
export function applyStudio(sessionId: string): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/apply`,
    { method: "POST" },
    STUDIO_TIMEOUT,
  );
}

/** Translate the current draft's ToolSpec with Groq. */
export function translateStudio(
  sessionId: string,
  locales?: string[],
): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/translate`,
    {
      method: "POST",
      body: JSON.stringify({ locales: locales?.length ? locales : null }),
    },
    STUDIO_TIMEOUT,
  );
}

/** Publish the current draft to Supabase. */
export function publishStudio(sessionId: string): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/publish`,
    { method: "POST" },
    STUDIO_TIMEOUT,
  );
}

/** Run the complete pipeline for a tool already decided in chat. */
export function autoRunStudio(
  sessionId: string,
  payload: StudioAutoRunInput = {},
): Promise<StudioBundle> {
  return request<StudioBundle>(
    `/api/studio/sessions/${encodeURIComponent(sessionId)}/auto-run`,
    { method: "POST", body: JSON.stringify(payload) },
    STUDIO_TIMEOUT,
  );
}
