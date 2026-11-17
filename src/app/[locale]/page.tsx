import type { ComponentType, SVGProps } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Flame } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { getPopularTools, getToolsByCategory, categories } from "@/lib/tools/registry";

function CategoryIcon({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return (
    <div className="rounded-[10px] bg-[var(--bg)] p-3">
      <Icon className="h-[32px] w-[32px] text-[var(--accent)]" aria-hidden="true" />
    </div>
  );
}

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  const popular = getPopularTools(8);

  return (
    <main className="mx-auto flex w-full max-w-page flex-col px-6">
      <section className="flex-1 flex flex-col py-16">
        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center lg:py-24">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Toolpika
          </p>
          <h1 className="max-w-[60ch] text-balance font-sans text-[60px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text)]">
            {t.rich("title", {
              display: (chunks) => (
                <span className="font-display text-[60px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--accent)] font-italic">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="mt-6 max-w-[600px] mx-auto text-[18px] leading-[1.6] text-[var(--muted)]">
            {t("subtitle")}
          </p>
        </div>

        {/* Mega search */}
        <div className="mt-12">
          <SearchBar />
        </div>

        {/* Chips */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {popular.slice(0, 6).map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            >
              {tool.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Popular tools */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="mx-auto max-w-page px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="font-display text-[32px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
                {t("popular")}
              </h2>
            </div>
            <Link
              href="/popular"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {t("viewAll")}
            </Link>
          </div>

          <ol className="grid gap-4">
            {popular.map((tool, index) => (
              <li
                key={tool.slug}
                className="flex items-center gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-6 py-4 hover:border-[var(--accent)] hover:-translate-y-[2px] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
              >
                <span className="w-6 text-[18px] font-bold text-[var(--accent)]">
                  {index + 1}
                </span>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="flex-1 text-[16px] font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors"
                >
                  {tool.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-12">
        <div className="mx-auto max-w-page px-6">
          <h2 className="mb-8 font-display text-[32px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
            {t("categories")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const tools = getToolsByCategory(category.slug);
              return (
                <Link
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  className="flex flex-col gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-[var(--accent)] hover:-translate-y-[4px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                >
                  <CategoryIcon icon={category.Icon} />
                  <h3 className="font-display text-[20px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
                    {category.label}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {tools.slice(0, 5).map((tool) => (
                      <li key={tool.slug} className="text-[14px] text-[var(--muted)]">
                        {tool.title}
                      </li>
                    ))}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Request section */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="mx-auto max-w-page px-6">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-[48px] text-center lg:p-[64px]">
            <h2 className="mb-3 font-display text-[28px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
              {t("requestTitle")}
            </h2>
            <p className="mb-6 max-w-md mx-auto text-[var(--muted)]">
              {t("requestSubtitle")}
            </p>
            <Link
              href="/request"
              className="inline-flex items-center justify-center rounded-[12px] bg-[var(--accent-fill)] px-[32px] py-3 font-bold text-[var(--on-accent)] transition-all duration-200 hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            >
              {t("requestCTA")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
