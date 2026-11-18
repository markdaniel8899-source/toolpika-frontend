"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { adminLogin, type AdminLoginState } from "@/app/admin/actions";

export interface AdminLoginCopy {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  sending: string;
}

function SubmitButton({ copy }: { copy: AdminLoginCopy }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="tp-btn tp-btn-primary"
      style={{ width: "100%", height: 46 }}
    >
      {pending ? copy.sending : copy.submit}
      <ArrowRight className="tp-icon" aria-hidden="true" />
    </button>
  );
}

const initialState: AdminLoginState = { status: "idle" };

export function AdminLoginForm({ copy }: { copy: AdminLoginCopy }) {
  const [state, formAction] = useActionState(adminLogin, initialState);
  const error = state.status === "error" ? state.message : undefined;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label
          htmlFor="admin-email"
          style={{ display: "block", marginBottom: 6, color: "var(--muted-2)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" }}
        >
          {copy.emailLabel}
        </label>
        <div style={{ position: "relative" }}>
          <Mail className="tp-icon" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--muted-2)" }} aria-hidden="true" />
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder={copy.emailPlaceholder}
            className="tp-atlas-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="admin-password"
          style={{ display: "block", marginBottom: 6, color: "var(--muted-2)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" }}
        >
          {copy.passwordLabel}
        </label>
        <div style={{ position: "relative" }}>
          <LockKeyhole className="tp-icon" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--muted-2)" }} aria-hidden="true" />
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={copy.passwordPlaceholder}
            className="tp-atlas-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12.5, lineHeight: 1.5 }}>
          {error}
        </p>
      ) : null}

      <SubmitButton copy={copy} />
    </form>
  );
}
