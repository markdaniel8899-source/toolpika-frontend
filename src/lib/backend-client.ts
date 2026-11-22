/**
 * Client for the lightweight research-scout backend.
 *
 * The backend only researches ideas and stores them for manual review. There
 * are no pipeline, translation, generation or Studio endpoints any more.
 */

export const BACKEND_URL_ENV = "NEXT_PUBLIC_BACKEND_API_URL";

export type IdeaStatus = "new" | "reviewed" | "rejected" | "building";

export interface ToolIdea {
  id: string;
  tool_name: string;
  category: string;
  why_trending: string;
  short_description: string;
  estimated_difficulty: "Easy" | "Medium" | "Hard" | string;
  status: IdeaStatus | string;
  created_at?: string | null;
}

export interface ResearchResult {
  success: boolean;
  ideas: ToolIdea[];
  sources_count: number;
  queries_run: number;
  detail?: string;
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

async function request<T>(path: string, init?: RequestInit, timeoutMs = 15_000): Promise<T> {
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

/** Trigger one research scout run. */
export function runResearch(): Promise<ResearchResult> {
  return request<ResearchResult>("/api/pipeline/research", { method: "POST" }, 180_000);
}

/** Fetch all scouted ideas, newest first. */
export function listIdeas(): Promise<ToolIdea[]> {
  return request<ToolIdea[]>("/api/admin/ideas");
}

/** Update an idea's review status. */
export function updateIdeaStatus(id: string, status: IdeaStatus): Promise<ToolIdea> {
  return request<ToolIdea>(`/api/admin/ideas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
