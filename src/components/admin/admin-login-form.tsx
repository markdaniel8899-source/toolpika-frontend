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
    <button type="submit" disabled={pending} className="tp-admin-btn tp-admin-login-submit">
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
    <form action={formAction} className="tp-admin-login-form">
      <div className="tp-admin-login-field">
        <label htmlFor="admin-email" className="tp-admin-login-label">
          {copy.emailLabel}
        </label>
        <span className="tp-admin-login-input-wrap">
          <Mail className="tp-icon" aria-hidden="true" />
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder={copy.emailPlaceholder}
            className="tp-atlas-input"
          />
        </span>
      </div>

      <div className="tp-admin-login-field">
        <label htmlFor="admin-password" className="tp-admin-login-label">
          {copy.passwordLabel}
        </label>
        <span className="tp-admin-login-input-wrap">
          <LockKeyhole className="tp-icon" aria-hidden="true" />
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={copy.passwordPlaceholder}
            className="tp-atlas-input"
          />
        </span>
      </div>

      {error ? (
        <p role="alert" className="tp-admin-login-error">
          {error}
        </p>
      ) : null}

      <SubmitButton copy={copy} />
    </form>
  );
}
