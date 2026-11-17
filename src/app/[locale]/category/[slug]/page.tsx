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
      <header className="mb-12">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="font-sans text-[30px] font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[40px]">
          {category.label}
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-[var(--muted)]">
          {t("description", { name: category.label })}
        </p>
      </header>

      {tools.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="group flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:border-[var(--accent)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            >
              <span className="font-semibold text-[var(--text)]">{tool.title}</span>
              <span className="text-[15px] leading-[1.6] text-[var(--muted)]">
                {tool.description}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-[15px] text-[var(--muted)]">{t("empty")}</p>
      )}
    </main>
  );
}
