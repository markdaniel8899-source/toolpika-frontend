import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
      userEmail={user.email ?? ""}
      signOutLabel={t.signOut}
      dashboardLabel={t.dashboard}
      navLabel={t.navLabel}
    >
      {children}
    </AdminShell>
  );
}
