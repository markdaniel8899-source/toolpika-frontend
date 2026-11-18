import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { adminMessages } from "@/lib/admin/messages";

export const metadata = {
  title: adminMessages.meta.title,
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const t = adminMessages.login;

  return (
    <main
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 24,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(50% 40% at 20% 0%, var(--accent-soft), transparent 62%), radial-gradient(45% 40% at 85% 15%, var(--accent-wash), transparent 62%)",
        }}
      />

      <div
        className="tp-atlas-card"
        style={{ position: "relative", width: "100%", maxWidth: 420, padding: 32 }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span
            className="tp-icon-tile"
            style={{ width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px" }}
          >
            <ShieldCheck className="tp-icon" style={{ width: 20, height: 20 }} aria-hidden="true" />
          </span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.03em" }}>
            {t.title}
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
            {t.description}
          </p>
        </div>

        <AdminLoginForm
          errorMessage={error}
          copy={{
            emailLabel: t.emailLabel,
            emailPlaceholder: t.emailPlaceholder,
            passwordLabel: t.passwordLabel,
            passwordPlaceholder: t.passwordPlaceholder,
            submit: t.submit,
            sending: t.sending,
            errorGeneric: t.errorGeneric,
            errorInvalid: t.errorInvalid,
            errorForbidden: t.errorForbidden,
            errorMissingConfig: t.errorMissingConfig,
          }}
        />
      </div>
    </main>
  );
}
