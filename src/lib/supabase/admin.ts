import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AdminProfile {
  id: string;
  email: string;
  role: "user" | "admin";
}

export interface AdminSession {
  user: User;
  profile: AdminProfile | null;
}

/**
 * Reads the signed-in user and their profile row.
 *
 * Returns null when nobody is signed in. `profile` is null when the row is
 * missing — the auth trigger in backend/database/001_initial_schema.sql
 * creates it on sign-up, so a missing row means the account was made before
 * the trigger existed.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile: profile
      ? {
          id: profile.id,
          email: profile.email,
          role: profile.role === "admin" ? "admin" : "user",
        }
      : null,
  };
}

/**
 * Server-side guard for every admin dashboard page.
 *
 * The proxy already redirects unauthenticated traffic. This second check is
 * what actually protects the data: it runs in the page, on the server, with
 * the session cookies — it cannot be bypassed by hiding a link.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.profile?.role !== "admin") {
    redirect("/admin/login?error=forbidden");
  }

  return session;
}