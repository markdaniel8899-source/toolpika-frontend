import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminMessages } from "@/lib/admin/messages";
import { AdminShell, type AdminNavItem } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email?: string } | null = null;
  let authError: string | null = null;
  let envUrlStatus: string | null = null;

  try {
    envUrlStatus = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "NEXT_PUBLIC_SUPABASE_URL: EXISTS"
      : "NEXT_PUBLIC_SUPABASE_URL: MISSING";
    const supabase = await createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error: unknown) {
    console.error("[admin] auth check failed:", error);
    authError = error instanceof Error ? error.message : String(error);
  }

  // RENDER ERROR ON SCREEN - do not let Vercel show a generic 500 page
  if (authError) {
    return (
      <html lang="en">
        <body className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-6 font-sans text-[var(--text)]">
          <div className="max-w-2xl rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--danger)]">
            <h1 className="font-sans text-[22px] font-semibold tracking-[-0.03em]">
              Admin Dashboard Error
            </h1>
            <p className="mt-3 text-[var(--muted)]">{envUrlStatus}</p>
            <pre className="mt-4 w-full overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] p-4 text-left text-[13px] text-[var(--text)]">
              {authError}
            </pre>
            <p className="mt-4 text-[var(--muted)] text-sm">
              Fix: Check Vercel Environment Variables → NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.
            </p>
          </div>
        </body>
      </html>
    );
  }

  if (!user) {
    redirect("/admin/login");
  }

  const t = adminMessages.nav;

  // Only serializable data (strings) crosses the server -> client boundary.
  const nav: AdminNavItem[] = [
    { href: "/admin", label: t.overview, iconName: "overview" },
    { href: "/admin/tools", label: t.tools, iconName: "tools" },
    { href: "/admin/requests", label: t.requests, iconName: "requests" },
    { href: "/admin/blog", label: t.blog, iconName: "blog" },
    { href: "/admin/analytics", label: t.analytics, iconName: "analytics" },
    { href: "/admin/ideas", label: t.ideas, iconName: "ideas" },
    { href: "/admin/settings", label: t.settings, iconName: "settings" },
  ];

  return (
    <AdminShell
      nav={nav}
      userEmail={user.email ?? ""}
      signOutLabel={t.signOut}
      dashboardLabel={t.dashboard}
      navLabel={t.navLabel}
      themeToggleLabel={t.themeToggle}
    >
      {children}
    </AdminShell>
  );
}
