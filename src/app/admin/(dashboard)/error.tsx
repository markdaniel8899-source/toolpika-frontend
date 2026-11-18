"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { SUPABASE_UNAVAILABLE } from "@/lib/supabase/config";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] dashboard error:", error);
  }, [error]);

  const isConfigIssue = error.message === SUPABASE_UNAVAILABLE;

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-page flex-col items-center justify-center px-6 text-center">
      <span className="tp-icon-tile" style={{ width: 48, height: 48, borderRadius: 14 }}>
        <AlertCircle className="tp-icon" style={{ width: 20, height: 20 }} aria-hidden="true" />
      </span>
      <h1 style={{ margin: "18px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em" }}>
        Dashboard unavailable
      </h1>
      <p style={{ maxWidth: 520, margin: "10px 0 0", color: "var(--muted)", fontSize: 14.5, lineHeight: 1.7 }}>
        {isConfigIssue
          ? SUPABASE_UNAVAILABLE
          : "The dashboard could not load its data. Check the Supabase project and try again."}
      </p>
      <button type="button" onClick={reset} className="tp-btn tp-btn-primary" style={{ marginTop: 24 }}>
        <RefreshCw className="tp-icon" aria-hidden="true" />
        Try again
      </button>
    </main>
  );
}
