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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBackendUrl()}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
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
