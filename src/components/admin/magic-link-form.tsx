"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";
import { requestMagicLink } from "@/app/admin/actions";

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--accent-fill)] px-6 py-3 font-bold text-[var(--on-accent)] transition-all duration-200 hover:bg-[var(--accent-fill-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-60"
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {pending ? pendingLabel : label}
    </button>
  );
}

export interface MagicLinkCopy {
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  sending: string;
  sentTitle: string;
  sentBody: string;
  sentAnother: string;
  errorInvalid: string;
  errorGeneric: string;
  errorRateLimit: string;
  errorNotConfigured: string;
}

/**
 * Email-only sign-in. Supabase sends a one-time link, so no password is
 * ever created, stored or forgotten.
 */
export function MagicLinkForm({ copy }: { copy: MagicLinkCopy }) {
  const [state, formAction] = useActionState(requestMagicLink, {
    status: "idle" as const,
  });

  if (state.status === "sent") {
    return (
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-6 text-center">
        <h2 className="mb-2 font-display text-[22px] font-bold tracking-[-0.02em]">
          {copy.sentTitle}
        </h2>
        <p className="mb-5 leading-[1.6] text-[var(--muted)]">{copy.sentBody}</p>
        <form action={formAction}>
          <input type="hidden" name="intent" value="another" />
          <input type="hidden" name="email" value={state.email ?? ""} />
          <button
            type="submit"
            className="text-sm font-medium text-[var(--accent)] underline underline-offset-4 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
          >
            {copy.sentAnother}
          </button>
        </form>
      </div>
    );
  }

  const errorMessage =
    state.status === "error"
      ? state.message === "invalid_email"
        ? copy.errorInvalid
        : state.message === "rate_limited"
          ? copy.errorRateLimit
          : state.message === "not_configured"
            ? copy.errorNotConfigured
            : copy.errorGeneric
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="admin-email"
          className="text-sm font-medium text-[var(--text)]"
        >
          {copy.emailLabel}
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email ?? ""}
          placeholder={copy.emailPlaceholder}
          aria-describedby={errorMessage ? "admin-email-error" : undefined}
          aria-invalid={errorMessage ? true : undefined}
          className="flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
        />
      </div>

      {errorMessage ? (
        <p
          id="admin-email-error"
          role="alert"
          className="text-sm text-[var(--danger)]"
        >
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton label={copy.submit} pendingLabel={copy.sending} />
    </form>
  );
}
