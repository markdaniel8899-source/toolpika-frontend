import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import { ThemeScript } from "@/components/theme-script";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Toolpika Admin",
    template: "%s | Toolpika Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: [
    {
      rel: "icon",
      type: "image/svg+xml",
      url: "/favicon.svg",
      sizes: "32x32",
    },
    {
      rel: "apple-touch-icon",
      type: "image/svg+xml",
      url: "/favicon.svg",
      sizes: "180x180",
    },
  ],
};

/**
 * Root layout for the admin area.
 *
 * The public site uses app/[locale]/layout.tsx as its own root layout, so
 * Next.js renders this as a second root layout. That is intentional: admin
 * has no locale prefix (admin.md §1) and must not inherit the public shell.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body data-cursor="default" className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)] antialiased">
        {children}
      </body>
    </html>
  );
}
