"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Mail } from "lucide-react";
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
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--accent-fill),var(--accent))] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] shadow-[0_10px_30px_-10px_var(--focus-ring)] transition-[filter,transform] duration-200 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
    >
      <Mail className="h-4 w-4" aria-hidden="true" />
      {pending ? pendingLabel : label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
      <div className="tp-atlas-card" style={{ textAlign: "center" }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em" }}>
          {copy.sentTitle}
        </h2>
        <p style={{ margin: "10px 0 18px", color: "var(--muted)", fontSize: 14, lineHeight: 1.65 }}>
          {copy.sentBody}
        </p>
        <form action={formAction}>
          <input type="hidden" name="intent" value="another" />
          <input type="hidden" name="email" value={state.email ?? ""} />
          <button
            type="submit"
            className="text-sm font-medium text-[var(--accent)] underline underline-offset-4"
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
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-2)]"
        >
          {copy.emailLabel}
        </label>
        <div style={{ position: "relative" }}>
          <Mail
            className="tp-icon"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--muted-2)" }}
            aria-hidden="true"
          />
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
            className="tp-atlas-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {errorMessage ? (
        <p id="admin-email-error" role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12.5 }}>
          {errorMessage}
        </p>
      ) : null}

      <SubmitButton label={copy.submit} pendingLabel={copy.sending} />
    </form>
  );
}
