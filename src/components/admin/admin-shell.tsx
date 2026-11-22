"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import {
  BarChart3,
  Bot,
  FileText,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Workflow,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Wordmark shared by the mobile header and desktop sidebar. */
function AdminBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="tp-brand" aria-label="Toolpika admin home">
      <Zap className="tp-brand-mark" aria-hidden="true" />
      <span className={compact ? "text-[21px]" : "text-[24px]"}>Toolpika</span>
    </Link>
  );
}

/**
 * Nav icons are referenced by a plain string key, never by component value.
 * Server Components cannot serialize functions across the RSC -> client
 * boundary (React error #130), so the icon map lives here on the client.
 */
export type AdminIconName =
  | "overview"
  | "tools"
  | "requests"
  | "blog"
  | "analytics"
  | "pipeline"
  | "studio"
  | "settings"
  | "editor";

const ADMIN_ICON_MAP: Record<AdminIconName, LucideIcon> = {
  overview: LayoutGrid,
  tools: Wrench,
  requests: Inbox,
  blog: FileText,
  analytics: BarChart3,
  pipeline: Workflow,
  studio: Bot,
  settings: Settings,
  editor: PenLine,
};

export interface AdminNavItem {
  href: string;
  label: string;
  iconName: AdminIconName;
}

/**
 * Admin shell: sidebar navigation on desktop, a disclosure panel on mobile.
 *
 * The nav is a plain list of links so it works without JavaScript too - the
 * panel is only a layout convenience.
 */
export function AdminShell({
  nav,
  userEmail,
  signOutLabel,
  dashboardLabel,
  navLabel,
  themeToggleLabel,
  children,
}: {
  nav: AdminNavItem[];
  userEmail: string;
  signOutLabel: string;
  dashboardLabel: string;
  navLabel: string;
  themeToggleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div data-ui data-admin="true" className="min-h-dvh bg-[var(--bg)] lg:grid lg:grid-cols-[260px_1fr]">
      {/* Top bar (mobile) */}
      <header data-ui className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-3 lg:hidden">
        <AdminBrand compact />
        <div className="flex items-center gap-2">
          <AdminThemeToggle label={themeToggleLabel} />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="admin-nav"
            className="tp-admin-icon"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="sr-only">{dashboardLabel}</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        id="admin-nav"
        className={`${
          open ? "block" : "hidden"
        } bg-[var(--surface)] lg:sticky lg:top-0 lg:block lg:h-dvh`}
      >
        <div className="flex h-full flex-col gap-6 px-5 py-6">
          <div className="hidden lg:block">
            <AdminBrand />
            <p className="mt-2 pl-[34px] text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {dashboardLabel}
            </p>
          </div>

          <nav aria-label={navLabel}>
            <ul className="flex flex-col gap-1">
              {nav.map((item) => {
                const active = isActive(item.href);
                const Icon = ADMIN_ICON_MAP[item.iconName] ?? LayoutGrid;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className="tp-admin-nav"
                    >
                      <Icon
                        className="h-[18px] w-[18px] shrink-0"
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-3 rounded-[10px] bg-[var(--surface-2)] p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs text-[var(--muted)]" title={userEmail}>
                {userEmail}
              </p>
              <AdminThemeToggle label={themeToggleLabel} />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="tp-admin-nav w-full"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signOutLabel}
            </button>
          </div>
        </div>
      </aside>

      <main className="tp-admin-page min-w-0 px-6 py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}

