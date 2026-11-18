import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/tools/tool-card";
import { getLiveTools } from "@/lib/tools/registry";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "new" });
  return { title: t("title"), description: t("description") };
}

export default async function NewToolsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "new" });
  const tools = getLiveTools().slice(-4).reverse();

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
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

      <div className="tp-tabs" aria-label="Tool navigation">
        <Link href="/all-tools" className="tp-tab">All tools</Link>
        <Link href="/popular" className="tp-tab">Popular</Link>
        <Link href="/new" className="tp-tab" data-active="true">New</Link>
        <Link href="/request" className="tp-tab">Request a tool</Link>
      </div>

      <div className="tp-tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </main>
  );
}
