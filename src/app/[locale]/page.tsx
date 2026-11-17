import type { ComponentType, SVGProps } from "react";
import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Flame } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { getPopularTools, getToolsByCategory, categories } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Icon tile used inside category cards. */
function IconTile({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return (
    <div className="rounded-lg bg-[rgba(91,75,255,0.08)] p-2.5">
      <Icon className="h-6 w-6 text-[var(--accent)]" />
    </div>
  );
}

/** Category card per spec: 48x48 icon container, 16px border-radius, hover lift -4px. */
function CategoryCard({
  category,
  tools,
}: {
  category: (typeof categories)[number];
  tools: ReturnType<typeof getToolsByCategory>;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "flex flex-col gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6",
        "transition-all duration-200 hover:border-[var(--accent)] hover:-translate-y-[4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
      )}
    >
      <IconTile icon={category.Icon} />
      <h3 className="font-sans text-[18px] font-bold leading-[1.15] tracking-tight text-[var(--text)]">
        {category.label}
      </h3>
      <p className="mt-[8px] text-[14px] text-[var(--muted)] leading-[1.6]">
        {tools.slice(0, 5).map((tool, i) => (i > 0 ? ", " : "") + tool.title)}
      </p>
    </Link>
  );
}

/** Popular tools card per spec: 12px border-radius, padding 20px, number badge, hover lift -2px. */
function PopularCard({
  tool,
  rank,
}: {
  tool: ReturnType<typeof getPopularTools>[number];
  rank: number;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-5",
        "transition-all duration-200 hover:border-[var(--accent)] hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(91,75,255,0.08)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
      )}
    >
      <span className="flex shrink-0 items-center justify-center w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[14px] font-bold text-[var(--accent)]">
        {String(rank).padStart(2, "0")}
      </span>
      <Link
        href={`/tools/${tool.slug}`}
        className="flex-1 text-[16px] font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors duration-200"
      >
        {tool.title}
      </Link>
    </li>
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
      {/* Hero */}
      <section className="flex-1 flex flex-col relative py-20 md:py-32 overflow-hidden">
        {/* Radial accent glow at the top, fading out. */}
        <div
          className="pointer-events-none absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[var(--accent-soft)] blur-[120px] opacity-40 md:w-[900px] md:h-[450px]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[560px] px-6 text-center">
          <Reveal delay={0} className="mb-6">
            <p className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] text-[11px] font-semibold uppercase tracking-[0.1em] shadow-sm">
              TOOLPIKA
            </p>
          </Reveal>
          <Reveal delay={80} className="mb-6">
            <h1 className="text-balance font-sans text-[60px] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--text)] sm:text-[60px]">
              {t.rich("title", {
                display: (chunks) => (
                  <>
                    {React.Children.map(chunks, (chunk, i) =>
                      React.isValidElement(chunk) ? (
                        <span key={i} className="font-bold italic text-[var(--accent)]">
                          {chunk}
                        </span>
                      ) : (
                        <span key={i}>{chunk}</span>
                      )
                    )}
                  </>
                ),
              })}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="max-w-[600px] mx-auto text-[18px] leading-[1.6] text-[var(--muted)] sm:text-[20px]">
              {t("subtitle")}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 md:mt-24">
          <Reveal delay={220}>
            <SearchBar />
          </Reveal>
        </div>

        <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-2">
          {popular.slice(0, 6).map((tool, index) => (
            <Reveal key={tool.slug} delay={280 + index * 60} stagger index={index}>
              <Link
                href={`/tools/${tool.slug}`}
                className={cn(
                  "rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[14px] font-medium text-[var(--text)]",
                  "transition-colors duration-200 hover:border-[var(--accent)] hover:bg-[var(--bg)]",
                  "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
                )}
              >
                {tool.title}
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Popular tools */}
      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-20 md:py-28">
        <div className="mx-auto max-w-page px-6">
          <Reveal className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="font-sans text-[32px] font-bold leading-[1.15] tracking-tight text-[var(--text)]">
                {t("popular")}
              </h2>
            </div>
            <Link
              href="/popular"
              className="text-[14px] font-medium text-[var(--accent)] hover:text-[var(--accent-fill-hover)] transition-colors duration-200"
            >
              {t("viewAll")}
            </Link>
          </Reveal>

          <ol className={cn(
            "grid gap-4",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          )}>
            {popular.map((tool, index) => (
              <Reveal key={tool.slug} stagger index={index}>
                <PopularCard tool={tool} rank={index + 1} />
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-page px-6">
          <Reveal className="mb-12">
            <h2 className="font-sans text-[32px] font-bold leading-[1.15] tracking-tight text-[var(--text)]">
              {t("categories")}
            </h2>
          </Reveal>
          <div className={cn(
            "grid gap-5",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
          )}>
            {categories.map((category, i) => {
              const tools = getToolsByCategory(category.slug);
              return (
                <Reveal key={category.slug} stagger index={i}>
                  <CategoryCard category={category} tools={tools} />
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Request section */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-20 md:py-28">
        <div className="mx-auto max-w-page px-6">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-[64px] text-center lg:p-[64px]">
            <Reveal className="mb-4">
              <h2 className="font-sans text-[32px] font-bold leading-[1.15] tracking-tight text-[var(--text)]">
                {t("requestTitle")}
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-[12px] max-w-md mx-auto text-[16px] text-[var(--muted)]">
                {t("requestSubtitle")}
              </p>
            </Reveal>
            <Reveal delay={160}>
              <Link
                href="/request"
                className={cn(
                  "inline-flex items-center justify-center mt-[32px] rounded-[12px] bg-[var(--accent-fill)] px-[32px] py-3 font-medium text-[var(--accent-fg)] text-[16px]",
                  "transition-all duration-200 hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02]",
                  "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
                )}
              >
                {t("requestCTA")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
