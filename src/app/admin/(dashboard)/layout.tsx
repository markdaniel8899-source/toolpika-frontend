import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/supabase/admin";
import { adminMessages } from "@/lib/admin/messages";
import {
  ADMIN_ICONS,
  AdminShell,
  type AdminNavItem,
} from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: Awaited<ReturnType<typeof getAdminSession>> = null;

  try {
    session = await getAdminSession();
  } catch (error) {
    console.error("Admin session error:", error);
    return (
      <div style={{ padding: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>
          Profile query failed.
        </h1>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 14 }}>
          Check SUPABASE_SERVICE_ROLE_KEY in Vercel env vars. Visit /admin/debug for details.
        </p>
      </div>
    );
  }

  if (!session || session.profile?.role !== "admin") {
    redirect("/admin/login");
  }

  const t = adminMessages.nav;

  const nav: AdminNavItem[] = [
    { href: "/admin", label: t.overview, Icon: ADMIN_ICONS.overview },
    { href: "/admin/tools", label: t.tools, Icon: ADMIN_ICONS.tools },
    { href: "/admin/requests", label: t.requests, Icon: ADMIN_ICONS.requests },
    { href: "/admin/blog", label: t.blog, Icon: ADMIN_ICONS.blog },
    {
      href: "/admin/analytics",
      label: t.analytics,
      Icon: ADMIN_ICONS.analytics,
    },
    { href: "/admin/settings", label: t.settings, Icon: ADMIN_ICONS.settings },
  ];

  return (
    <AdminShell
      nav={nav}
      userEmail={session.profile?.email ?? session.user.email ?? ""}
      signOutLabel={t.signOut}
      dashboardLabel={t.dashboard}
      navLabel={t.navLabel}
    >
      {children}
    </AdminShell>
  );
}
