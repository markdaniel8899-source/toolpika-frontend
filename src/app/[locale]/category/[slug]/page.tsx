import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { buildCategorySchemas } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/site-url";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JsonLdScripts } from "@/components/seo/json-ld";
import { CategoryBrowser } from "@/components/tools/category-browser";
import {
  categories,
  getToolsByCategory,
  isCategoryIndexable,
  categoryKey,
  toolTitleKey,
} from "@/lib/tools/registry";

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
  const t = await getTranslations({ locale, namespace: "category" });
  const tTools = await getTranslations({ locale, namespace: "tools" });
  if (!category) return { title: t("notFound") };
  const label = tTools(categoryKey(slug));
  return {
    title: t("title", { name: label }),
    description: t("description", { name: label }),
    alternates: localizedAlternates(locale, `/category/${slug}`),
    robots: {
      index: isCategoryIndexable(slug),
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: LocalePageProps) {
  const { locale, slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const t = await getTranslations({ locale, namespace: "category" });
  const tTools = await getTranslations({ locale, namespace: "tools" });

  const siteUrl = getSiteUrl();
  const label = tTools(categoryKey(slug));
  const tools = getToolsByCategory(category.slug);
  const categorySchemas = buildCategorySchemas({
    locale,
    siteUrl,
    slug,
    label,
    description: t("description", { name: label }),
    homeLabel: tTools("home"),
    items: tools.map((tool) => ({
      name: tTools(toolTitleKey(tool)),
      url: `${siteUrl}/${locale}/tools/${tool.slug}`,
    })),
  });

  // All category data is sent once; tab clicks swap it client-side so only
  // the pill highlight moves instead of reloading the whole route.
  const views = categories.map((item) => ({
    slug: item.slug,
    label: tTools(categoryKey(item.slug)),
    eyebrow: t("eyebrow"),
    description: t("description", { name: tTools(categoryKey(item.slug)) }),
    empty: t("empty"),
    tools: getToolsByCategory(item.slug),
  }));

  return (
    <>
      <JsonLdScripts schemas={categorySchemas} />
      <main className="tp-container" style={{ paddingBottom: 64 }}>
        <CategoryBrowser views={views} activeSlug={slug} />
      </main>
    </>
  );
}
