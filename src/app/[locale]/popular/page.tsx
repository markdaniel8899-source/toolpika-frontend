import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/tools/tool-card";
import { getPopularTools } from "@/lib/tools/registry";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "popular" });
  return { title: t("title"), description: t("description") };
}

export default async function PopularPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "popular" });
  const tools = getPopularTools(8);

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p>{t("description")}</p>
          </div>
          <span className="tp-page-count">CURATED · LOCAL · PRIVATE</span>
        </div>
      </section>

      <div className="tp-tabs" aria-label="Tool navigation">
        <Link href="/" className="tp-tab">All tools</Link>
        <Link href="/popular" className="tp-tab" data-active="true">Popular</Link>
        <Link href="/new" className="tp-tab">New</Link>
        <Link href="/request" className="tp-tab">Request a tool</Link>
      </div>

      <div className="tp-tool-grid">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <Link href="/request" className="tp-text-link">
          Missing something? Request it
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
