import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/tools/tool-card";
import { getNewTools, toolTitleKey } from "@/lib/tools/registry";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { buildToolListSchemas } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "new" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates(locale, "/new"),
  };
}

export default async function NewToolsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "new" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const tools = getNewTools();
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const siteUrl = getSiteUrl();
  const schemas = buildToolListSchemas({
    locale,
    siteUrl,
    path: "/new",
    name: t("title"),
    description: t("description"),
    items: tools.map((tool) => ({
      name: tTools(toolTitleKey(tool)),
      url: `${siteUrl}/${locale}/tools/${tool.slug}`,
    })),
  });

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <JsonLdScripts schemas={schemas} />
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
          <span className="tp-page-count">FRESH · LOCAL · PRIVATE</span>
        </div>
      </section>

      <div className="tp-tabs" aria-label={nav("toolNavigation")}>
        <Link href="/all-tools" className="tp-tab">{nav("tools")}</Link>
        <Link href="/popular" className="tp-tab">{nav("popular")}</Link>
        <Link href="/new" className="tp-tab" data-active="true">{nav("new")}</Link>
        <Link href="/request" className="tp-tab">{nav("request")}</Link>
      </div>

      <div className="tp-tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  );
}
