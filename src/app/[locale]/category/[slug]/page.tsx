import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo/alternates";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CategoryBrowser } from "@/components/tools/category-browser";
import { categories, getToolsByCategory, categoryKey } from "@/lib/tools/registry";

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
  };
}

export default async function CategoryPage({ params }: LocalePageProps) {
  const { locale, slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const t = await getTranslations({ locale, namespace: "category" });
  const tTools = await getTranslations({ locale, namespace: "tools" });

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
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <CategoryBrowser views={views} activeSlug={slug} />
    </main>
  );
}
