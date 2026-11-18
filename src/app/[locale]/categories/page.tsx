import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/tools/tool-card";
import { categories, getToolsByCategory } from "@/lib/tools/registry";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const category = await getTranslations({ locale, namespace: "category" });
  return {
    title: category("allTitle"),
    description: category("allDescription"),
  };
}

export default async function CategoriesPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const category = await getTranslations({ locale, namespace: "category" });

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{category("allEyebrow")}</p>
            <h1>{category("allTitle")}</h1>
            <p>{category("allDescription")}</p>
          </div>
          <span className="tp-page-count">BROWSE · BY CATEGORY</span>
        </div>
      </section>

      <div className="tp-category-sections">
        {categories.map((item) => {
          const tools = getToolsByCategory(item.slug);
          return (
            <section key={item.slug} className="tp-category-section">
              <div className="tp-category-section-head">
                <h2>{item.label}</h2>
                <Link href={`/category/${item.slug}`} className="tp-text-link">
                  {category("viewCategory")}
                  <ArrowRight className="tp-icon" aria-hidden="true" />
                </Link>
              </div>
              <div className="tp-tool-grid">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
