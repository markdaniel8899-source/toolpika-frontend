import { ShieldCheck } from "lucide-react";
import { MagicLinkForm } from "@/components/admin/magic-link-form";

const copy = {
  emailLabel: "Email",
  emailPlaceholder: "admin@example.com",
  submit: "Send magic link",
  sending: "Sending...",
  sentTitle: "Check your inbox",
  sentBody: "We sent a one-time sign-in link. Open it on this device to continue.",
  sentAnother: "Use another email",
  errorInvalid: "Enter a valid email address.",
  errorGeneric: "Something went wrong. Please try again.",
  errorRateLimit: "Too many attempts. Try again in a moment.",
  errorNotConfigured: "Supabase is not configured for this deployment.",
};

export default function AdminLoginPage() {
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
            Toolpika Admin
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
            Restricted area. Sign in with a magic link.
          </p>
        </div>

        <MagicLinkForm copy={copy} />
      </div>
    </main>
  );
}
