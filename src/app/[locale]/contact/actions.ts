"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string };

/** Contact messages land in the same admin inbox as tool requests. */
export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name || !email || !message) {
    return { ok: false, error: "All fields are required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Messaging is unavailable. Email hafizmzain786@gmail.com instead.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("tool_requests").insert({
      tool_name: `Contact: ${name}`,
      description: message,
      email,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Something went wrong. Email hafizmzain786@gmail.com instead.",
    };
  }
}
