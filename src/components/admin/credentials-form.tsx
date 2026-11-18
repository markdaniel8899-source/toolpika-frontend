"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { adminLogin, type AdminLoginState } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--accent-fill),var(--accent))] px-6 py-3 text-sm font-semibold text-[var(--on-accent)] shadow-[0_10px_30px_-10px_var(--focus-ring)] transition-[filter] duration-200 hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? "Signing in..." : "Sign in"}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

const initialState: AdminLoginState = { status: "idle" };

export function CredentialsForm() {
  const [state, formAction] = useActionState(adminLogin, initialState);
  const error =
    state.status === "error"
      ? state.message === "empty"
        ? "Enter both email and password."
        : "Those credentials do not match."
      : null;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label
          htmlFor="admin-email"
          style={{ display: "block", marginBottom: 6, color: "var(--muted-2)", fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" }}
        >
          Email
        </label>
        <div style={{ position: "relative" }}>
          <Mail className="tp-icon" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--muted-2)" }} aria-hidden="true" />
          <input
            id="admin-email"
            name="email"
            type="email"
            required
            autoComplete="username"
            placeholder="admin@example.com"
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
          Password
        </label>
        <div style={{ position: "relative" }}>
          <LockKeyhole className="tp-icon" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--muted-2)" }} aria-hidden="true" />
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            className="tp-atlas-input"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12.5 }}>
          {error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
