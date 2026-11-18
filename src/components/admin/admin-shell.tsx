"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  FileText,
  Inbox,
  LayoutGrid,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

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
  | "settings"
  | "editor";

const ADMIN_ICON_MAP: Record<AdminIconName, LucideIcon> = {
  overview: LayoutGrid,
  tools: Wrench,
  requests: Inbox,
  blog: FileText,
  analytics: BarChart3,
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
 * The nav is a plain list of links so it works without JavaScript too — the
 * panel is only a layout convenience.
 */
export function AdminShell({
  nav,
  userEmail,
  signOutLabel,
  dashboardLabel,
  navLabel,
  children,
}: {
  nav: AdminNavItem[];
  userEmail: string;
  signOutLabel: string;
  dashboardLabel: string;
  navLabel: string;
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
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/90 px-6 py-3 backdrop-blur-[8px] lg:hidden">
        <Link
          href="/admin"
          className="font-display text-[26px] leading-none tracking-[0.01em]"
        >
          Toolpika
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-nav"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--muted)] transition-colors duration-200 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="sr-only">{dashboardLabel}</span>
        </button>
      </header>

      {/* Sidebar */}
      <aside
        id="admin-nav"
        className={`${
          open ? "block" : "hidden"
        } border-b border-[var(--border)] bg-[var(--surface)] lg:sticky lg:top-0 lg:block lg:h-screen lg:border-b-0 lg:border-r`}
      >
        <div className="flex h-full flex-col gap-6 px-5 py-6">
          <Link
            href="/admin"
            className="hidden font-display text-[30px] leading-none tracking-[0.01em] lg:block"
          >
            Toolpika
          </Link>

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
                      className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 ${
                        active
                          ? "bg-[var(--bg)] text-[var(--text)]"
                          : "text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] ${
                          active ? "text-[var(--accent)]" : ""
                        }`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-[var(--border)] pt-4">
            <p className="truncate text-xs text-[var(--muted)]" title={userEmail}>
              {userEmail}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--bg)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {signOutLabel}
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-6 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

