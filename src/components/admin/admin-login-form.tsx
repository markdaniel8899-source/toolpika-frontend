"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_UNAVAILABLE, isSupabaseConfigured } from "@/lib/supabase/config";

export interface AdminLoginCopy {
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submit: string;
  sending: string;
  errorGeneric: string;
  errorInvalid: string;
  errorForbidden: string;
  errorMissingConfig: string;
}

export function AdminLoginForm({
  copy,
  errorMessage,
}: {
  copy: AdminLoginCopy;
  errorMessage?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(() => {
    if (errorMessage === "forbidden") return copy.errorForbidden;
    if (errorMessage === "not_configured") return copy.errorMissingConfig;
    return "";
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!isSupabaseConfigured()) {
      setError(copy.errorMissingConfig);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(copy.errorInvalid);
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);

    if (authError) {
      setError(copy.errorGeneric);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  const message = error || (isSupabaseConfigured() ? "" : SUPABASE_UNAVAILABLE);

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
      noValidate
    >
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
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.emailPlaceholder}
            className="tp-atlas-input"
            style={{ paddingLeft: 38 }}
            required
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
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={copy.passwordPlaceholder}
            className="tp-atlas-input"
            style={{ paddingLeft: 38 }}
            required
          />
        </div>
      </div>

      {message && (
        <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12.5, lineHeight: 1.5 }}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="tp-btn tp-btn-primary"
        style={{ width: "100%", height: 46 }}
      >
        {pending ? copy.sending : copy.submit}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </button>
    </form>
  );
}
