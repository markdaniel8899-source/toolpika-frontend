import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/admin";
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
  // requireAdmin() redirects to /admin/login when there is no session, when
  // the profile role is not admin, or when Supabase is not configured.
  const session = await requireAdmin();
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
