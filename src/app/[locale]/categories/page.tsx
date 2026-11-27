import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { getTranslations } from "next-intl/server";
import { ToolCard } from "@/components/tools/tool-card";
import { categories, getToolsByCategory, categoryKey } from "@/lib/tools/registry";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { buildToolListSchemas } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const category = await getTranslations({ locale, namespace: "category" });
  return {
    title: category("allTitle"),
    description: category("allDescription"),
    alternates: localizedAlternates(locale, "/categories"),
  };
}

export default async function CategoriesPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const category = await getTranslations({ locale, namespace: "category" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  const siteUrl = getSiteUrl();
  const schemas = buildToolListSchemas({
    locale,
    siteUrl,
    path: "/categories",
    name: category("allTitle"),
    description: category("allDescription"),
    items: categories.map((item) => ({
      name: tTools(categoryKey(item.slug)),
      url: `${siteUrl}/${locale}/category/${item.slug}`,
    })),
  });

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <JsonLdScripts schemas={schemas} />
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{category("allEyebrow")}</p>
            <h1>{category("allTitle")}</h1>
            <p>{category("allDescription")}</p>
          </div>
          <span className="tp-page-count">{category("browseByCategory")}</span>
        </div>
      </section>

      <div className="tp-category-sections">
        {categories.map((item) => {
          const tools = getToolsByCategory(item.slug);
          return (
            <section key={item.slug} className="tp-category-section">
              <div className="tp-category-section-head">
                <h2>{tTools(categoryKey(item.slug))}</h2>
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
