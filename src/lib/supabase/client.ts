import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Throws loudly when env vars are missing rather than failing silently later.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy frontend/.env.example to frontend/.env.local and fill it in."
    );
  }

  return createBrowserClient(url, anonKey);
}
