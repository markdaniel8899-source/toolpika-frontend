"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "hafizmzain786@gmail.com";

export default async function AdminLoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const supabase = await createClient();
    await supabase.auth.signInWithOtp({
      email: ADMIN_EMAIL,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    setLoading(false);
  };

  return (
    <main className="mx-auto w-full max-w-md px-6 py-24 text-center">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-[var(--accent-fill)] px-8 py-3 font-medium text-[var(--on-accent)] transition-all duration-200 hover:bg-[var(--accent-fill-hover)] disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Login"}
      </button>
      <p className="mt-4 text-sm text-[var(--muted)]">
        {ADMIN_EMAIL}
      </p>
    </main>
  );
}
