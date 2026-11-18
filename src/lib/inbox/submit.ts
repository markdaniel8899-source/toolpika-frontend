/**
 * Shared client helper for both public forms.
 *
 * All submissions go through POST /api/inbox. No client-side Supabase key or
 * direct table insert is used, so the browser never talks to the database.
 */

export type InboxPayload =
  | {
      type: "tool_request";
      toolName: string;
      email?: string;
      description: string;
    }
  | {
      type: "contact";
      name: string;
      email: string;
      description: string;
    };

export interface InboxResult {
  ok: boolean;
  error?: string;
}

export async function submitInbox(payload: InboxPayload): Promise<InboxResult> {
  try {
    const response = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.error ?? "Could not send your message. Please try again.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }
}
