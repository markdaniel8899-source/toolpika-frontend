import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { adminMessages } from "@/lib/admin/messages";
import { MagicLinkForm } from "@/components/admin/magic-link-form";
import { AdminSetupNotice } from "@/components/admin/admin-setup-notice";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ code?: string; error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  if (!isSupabaseConfigured()) {
    return <AdminSetupNotice />;
  }

  const { code, error } = await searchParams;

  // Supabase sends the user back with ?code=... (PKCE). Exchange it for a
  // session cookie, then send them to the dashboard.
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      redirect("/admin");
    }
  }

  const t = adminMessages.login;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t.eyebrow}
        </p>
        <h1 className="font-display text-[30px] font-bold tracking-[-0.02em] sm:text-[34px]">
          {t.title}
        </h1>
        <p className="mt-3 leading-[1.6] text-[var(--muted)]">{t.description}</p>
      </div>

      {error === "forbidden" ? (
        <p
          role="alert"
          className="mb-5 rounded-[10px] border border-[var(--danger)] bg-[var(--danger)]/5 px-4 py-3 text-sm text-[var(--text)]"
        >
          {t.errorForbidden}
        </p>
      ) : null}

      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <MagicLinkForm
          copy={{
            emailLabel: t.emailLabel,
            emailPlaceholder: t.emailPlaceholder,
            submit: t.submit,
            sending: t.sending,
            sentTitle: t.sentTitle,
            sentBody: t.sentBody,
            sentAnother: t.sentAnother,
            errorInvalid: t.errorInvalid,
            errorGeneric: t.errorGeneric,
            errorRateLimit: t.errorRateLimit,
            errorNotConfigured: t.errorMissingConfig,
          }}
        />
      </div>

      <p className="mt-6 text-center text-sm">
        <Link
          href="/en"
          className="text-[var(--accent)] underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
        >
          {t.backToSite}
        </Link>
      </p>
    </main>
  );
}
