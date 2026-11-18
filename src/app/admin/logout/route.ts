import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Sign-out endpoint.
 *
 * A plain POST route handler keeps the sign-out button working without
 * JavaScript. It clears the Supabase Auth session cookies on the way out.
 */
export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });
}
