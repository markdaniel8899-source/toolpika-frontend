import { ShieldCheck, Zap } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { adminMessages } from "@/lib/admin/messages";

export const metadata = {
  title: adminMessages.meta.title,
};

export default function AdminLoginPage() {
  const t = adminMessages.login;

  return (
    <main className="tp-admin-login">
      <div aria-hidden="true" className="tp-admin-login-wash" />

      <div className="tp-admin-login-card tp-admin-page">
        <div className="tp-admin-login-head">
          <span className="tp-admin-login-mark">
            <Zap className="tp-brand-mark" aria-hidden="true" />
            <ShieldCheck className="tp-icon" aria-hidden="true" />
          </span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>

        <AdminLoginForm
          copy={{
            emailLabel: t.emailLabel,
            emailPlaceholder: t.emailPlaceholder,
            passwordLabel: t.passwordLabel,
            passwordPlaceholder: t.passwordPlaceholder,
            submit: t.submit,
            sending: t.sending,
          }}
        />
      </div>
    </main>
  );
}
