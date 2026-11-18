"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type RequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitToolRequest(input: {
  toolName: string;
  description: string;
  email: string;
}): Promise<RequestResult> {
  const toolName = input.toolName.trim();
  const description = input.description.trim();
  const email = input.email.trim();

  if (!toolName || !description) {
    return { ok: false, error: "A tool name and description are required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Requests are unavailable right now. Email hafizmzain786@gmail.com instead.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tool_requests").insert({
      tool_name: toolName,
      description,
      email: email || null,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Something went wrong. Please try again or email hafizmzain786@gmail.com.",
    };
  }
}
