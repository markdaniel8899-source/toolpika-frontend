import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site-url";
import { buildSiteSchemas } from "@/lib/seo/json-ld";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { inter, display, jakarta } from "@/lib/fonts";
import { ThemeScript } from "@/components/theme-script";
import { SiteMotion } from "@/components/site-motion";
import { SiteTransitions } from "@/components/site-transitions";
import { CookieBanner } from "@/components/ui/CookieBanner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "@/app/globals.css";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0f" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: t("title"),
      template: "%s | Toolpika",
    },
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      siteName: "Toolpika",
      type: "website",
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
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const siteSchemas = buildSiteSchemas({ locale, siteUrl: getSiteUrl() });

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${inter.variable} ${jakarta.variable} ${display.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <JsonLdScripts schemas={siteSchemas} />
      </head>
      <body className="min-h-screen bg-[var(--bg)] font-sans text-base leading-[1.6] text-[var(--text)] antialiased">
        <NextIntlClientProvider messages={messages}>
          <SiteMotion />
          <SiteTransitions />
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <CookieBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
