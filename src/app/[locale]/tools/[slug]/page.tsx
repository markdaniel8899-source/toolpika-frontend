import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { getTool, getLiveTools, getToolsByCategory } from "@/lib/tools/registry";

const LOCALES = [
  "en", "de", "fr", "es", "pt-BR", "ru", "tr", "it", "ar", "hi",
] as const;

type LocalePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return getLiveTools().flatMap((tool) =>
    LOCALES.map((locale) => ({ locale, slug: tool.slug }))
  );
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };

  const t = await getTranslations({ locale, namespace: "tools" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolpika.site";

  return {
    title: `${tool.title} | ${t("online")}`,
    description: tool.description,
    alternates: {
      canonical: `${siteUrl}/${locale}/tools/${tool.slug}`,
      languages: {
        ...Object.fromEntries(
          LOCALES.map((alt) => [alt, `${siteUrl}/${alt}/tools/${tool.slug}`])
        ),
        "x-default": `${siteUrl}/en/tools/${tool.slug}`,
      },
    },
    openGraph: {
      title: `${tool.title} — Toolpika`,
      description: tool.description,
      type: "website",
      url: `${siteUrl}/${locale}/tools/${tool.slug}`,
    },
  };
}

export default async function ToolPage({ params }: LocalePageProps) {
  const { slug, locale } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const t = await getTranslations({ locale, namespace: "tools" });
  const tHow = await getTranslations({ locale, namespace: "toolPage" });

  const categoryLabel = (() => {
    const map: Record<string, string> = {
      text: t("catText"),
      image: t("catImage"),
      code: t("catCode"),
      converter: t("catConverter"),
      security: t("catSecurity"),
    };
    return map[tool.category] ?? tool.category;
  })();

  const related = getToolsByCategory(tool.category)
    .filter((item) => item.slug !== tool.slug)
    .slice(0, 4);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://toolpika.site";
  const pageUrl = `${siteUrl}/${locale}/tools/${tool.slug}`;

  // Honest structured data only: a free tool that runs in the browser.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: tool.title,
        description: tool.description,
        url: pageUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        inLanguage: locale,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("home"),
            item: `${siteUrl}/${locale}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabel,
            item: `${siteUrl}/${locale}/category/${tool.category}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.title,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <main className="mx-auto w-full max-w-page px-6 py-8">
        <Reveal className="mb-8">
          <Breadcrumbs
            items={[
              { label: t("home"), href: "/" },
              { label: categoryLabel, href: `/category/${tool.category}` },
              { label: tool.title, href: pageUrl },
            ]}
          />
        </Reveal>

      <header className="mb-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-[28px] tracking-[-0.02em] text-[var(--text)] sm:text-[32px]">
            {tool.title}
          </h1>
          <Badge>{t("live")}</Badge>
        </div>
        <p className="max-w-2xl leading-[1.6] text-[var(--muted)]">
          {tool.description}
        </p>
      </header>

        <Reveal className="mb-8">
          <Card className="p-0">
            <ToolWorkspace slug={tool.slug} />
          </Card>
        </Reveal>

        <p className="mt-4 flex items-start gap-2 text-xs leading-[1.6] text-[var(--muted)]">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
          aria-hidden="true"
        />
        <span>{t("runsInBrowser")}</span>
      </p>

      {/* SEO content */}
      <div className="mt-12 flex flex-col gap-12">
        <Reveal className="mb-8">
          <section>
            <h2 className="mb-4 font-heading text-[20px] tracking-[-0.02em] text-[var(--text)]">
              {tHow("howToTitle")}
            </h2>
            <ol className="flex flex-col gap-3">
              {[1, 2, 3].map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-fill)] text-xs font-bold text-[var(--on-accent)]">
                    {step}
                  </span>
                  <span className="leading-[1.6] text-[var(--muted)]">
                    {tHow(`step${step}`)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal className="mb-8">
          <section>
            <h2 className="mb-4 font-heading text-[20px] tracking-[-0.02em] text-[var(--text)]">
              {tHow("faqTitle")}
            </h2>
            <Accordion type="single" collapsible className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
              {[1, 2, 3].map((item) => (
                <AccordionItem key={item} value={`faq-${item}`}>
                  <AccordionTrigger>{tHow(`faqQuestion${item}`)}</AccordionTrigger>
                  <AccordionContent>{tHow(`faqAnswer${item}`)}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </Reveal>

        {related.length > 0 && (
          <Reveal className="mb-8">
            <section>
              <h2 className="mb-4 font-heading text-[20px] tracking-[-0.02em] text-[var(--text)]">
                {tHow("relatedTitle")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/tools/${item.slug}`}
                    className="flex flex-col gap-1 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-[transform,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-[2px] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                  >
                    <span className="font-medium text-[var(--text)]">
                      {item.title}
                    </span>
                    <span className="text-sm leading-[1.6] text-[var(--muted)]">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        <Reveal className="mb-8">
          <section>
            <h2 className="mb-4 font-heading text-[20px] tracking-[-0.02em] text-[var(--text)]">
              {t("about", { title: tool.title })}
            </h2>
            <p className="leading-[1.6] text-[var(--muted)]">{tool.description}</p>
          </section>
        </Reveal>
      </div>
      </main>
    </>
  );
}
