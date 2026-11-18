import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  SUPABASE_UNAVAILABLE,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type IncomingBody = {
  type?: unknown;
  name?: unknown;
  email?: unknown;
  toolName?: unknown;
  description?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Single write path for the Request a Tool and Contact Us forms. */
export async function POST(request: Request) {
  let body: IncomingBody;
  try {
    body = (await request.json()) as IncomingBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const type = body.type;
  const description = text(body.description, 5000);

  if (type !== "tool_request" && type !== "contact") {
    return NextResponse.json({ ok: false, error: "Invalid message type." }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json({ ok: false, error: "A message is required." }, { status: 400 });
  }

  const email = text(body.email, 254);
  if (email && !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  let name: string | null = null;
  let toolName: string | null = null;

  if (type === "tool_request") {
    toolName = text(body.toolName, 160);
    if (!toolName) {
      return NextResponse.json(
        { ok: false, error: "A tool name is required." },
        { status: 400 },
      );
    }
  } else {
    name = text(body.name, 120);
    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required." },
        { status: 400 },
      );
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: SUPABASE_UNAVAILABLE },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inbox_messages").insert({
    type,
    name,
    email: email || null,
    tool_name: toolName,
    description,
    status: "new",
  });

  if (error) {
    console.error("[inbox] insert failed:", error.message);
    return NextResponse.json(
      { ok: false, error: "Could not save your message. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
