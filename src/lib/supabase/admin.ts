import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
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
 * Reads the signed-in user, then the profile row with the SERVICE ROLE client.
 *
 * The anon client cannot reliably read public.profiles from a Server Component
 * (PostgREST "Database error querying schema"). The service role key bypasses
 * RLS and is server-only. Full errors are logged for diagnosis.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let profile: AdminProfile | null = null;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      // Full Supabase/PostgREST error for Vercel logs.
      console.error("SUPABASE DEBUG ERROR:", JSON.stringify(error, null, 2));
    } else if (data) {
      profile = {
        id: data.id,
        email: data.email,
        role: data.role === "admin" ? "admin" : "user",
      };
    }
  } catch (error) {
    console.error("SUPABASE DEBUG ERROR:", JSON.stringify(error, null, 2));
  }

  return { user, profile };
}

/** Server-side guard for every admin dashboard page. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.profile?.role !== "admin") {
    redirect("/admin/login");
  }

  return session;
}
