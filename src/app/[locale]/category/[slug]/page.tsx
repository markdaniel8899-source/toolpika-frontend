import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
    <main className="mx-auto w-full max-w-page px-6 py-12">
      <header className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="font-heading text-[32px] tracking-[-0.02em] text-[var(--text)] sm:text-[40px]">
          {category.label}
        </h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">
          {t("description", { name: category.label })}
        </p>
      </header>

      {tools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="flex flex-col gap-2 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:-translate-y-[2px] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            >
              <span className="font-bold text-[var(--text)]">{tool.title}</span>
              <span className="text-sm leading-[1.6] text-[var(--muted)]">
                {tool.description}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[var(--muted)]">{t("empty")}</p>
      )}
    </main>
  );
}
