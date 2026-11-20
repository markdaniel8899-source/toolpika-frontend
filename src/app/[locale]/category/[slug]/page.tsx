import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/tools/tool-card";
import { categories, getToolsByCategory } from "@/lib/tools/registry";

type LocalePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) return { title: "Category not found" };
  const t = await getTranslations({ locale, namespace: "category" });
  return {
    title: t("title", { name: category.label }),
    description: t("description", { name: category.label }),
  };
}

export default async function CategoryPage({ params }: LocalePageProps) {
  const { locale, slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const t = await getTranslations({ locale, namespace: "category" });
  const tools = getToolsByCategory(category.slug);

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{t("eyebrow")}</p>
            <h1>{category.label}</h1>
            <p>{t("description", { name: category.label })}</p>
          </div>
          <span className="tp-page-count">
            {tools.length} {tools.length === 1 ? "TOOL" : "TOOLS"}
          </span>
        </div>
      </section>

      <div className="tp-tabs tp-tabs-page" aria-label="Categories">
        {categories.map((item) => {
          const isActive = item.slug === category.slug;
          return (
            <Link
              key={item.slug}
              href={`/category/${item.slug}`}
              className={`tp-tab${isActive ? " is-active" : ""}`}
              data-active={isActive ? "true" : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && <span className="tp-tab-highlight" aria-hidden="true" />}
              <span className="tp-tab-label">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {tools.length > 0 ? (
        <div className="tp-tool-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 15 }}>{t("empty")}</p>
      )}
    </main>
  );
}
