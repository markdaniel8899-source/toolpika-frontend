import { AlertTriangle } from "lucide-react";
import { adminMessages } from "@/lib/admin/messages";

/**
 * Shown when Supabase environment variables are missing.
 *
 * The dashboard stays reachable so a fresh clone explains what to do instead
 * of crashing with an opaque error. Every string lives in messages/admin.json.
 */
export function AdminSetupNotice() {
  const t = adminMessages.setup;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-16">
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="mb-4 flex items-center gap-2 text-[var(--danger)]">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <h1 className="font-sans text-[26px] tracking-[-0.02em] text-[var(--text)]">
            {t.title}
          </h1>
        </div>
        <p className="mb-4 leading-[1.6] text-[var(--muted)]">{t.body}</p>
        <pre className="mb-4 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4 text-[13px] leading-[1.6] text-[var(--text)]">
          {t.command}
        </pre>
        <p className="mb-3 leading-[1.6] text-[var(--muted)]">{t.after}</p>
        <pre className="overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4 text-[13px] leading-[1.6] text-[var(--text)]">
          {t.promote}
        </pre>
      </div>
    </main>
  );
}
