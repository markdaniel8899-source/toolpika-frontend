import { createServerClient } from "@supabase/ssr";

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * Used ONLY for reliable admin profile reads. Never import this in a client
 * component or middleware. The service role key bypasses RLS and must stay on
 * the server.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Set them in the Vercel project environment and redeploy.",
    );
  }

  // No cookies are needed for a service-role client; it does not carry a user session.
  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
    },
  });
}
