import type { ComponentType, SVGProps } from "react";
import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { getToolsByCategory, categories, getLiveTools } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/** Icon tile used inside category cards - soft accent surface, no border. */
function IconTile({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent)]">
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

/** Category card - soft icon tile, title, covered tool list. */
function CategoryCard({
  category,
  tools,
}: {
  category: (typeof categories)[number];
  tools: ReturnType<typeof getToolsByCategory>;
}) {
  const Icon = category.Icon;
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group flex h-full min-h-[176px] flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5",
        "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        "hover:border-[var(--accent)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <IconTile icon={Icon} />
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {`${tools.length} ${tools.length === 1 ? "tool" : "tools"}`}
        </span>
      </div>
      <div className="mt-auto">
        <h3 className="font-sans text-[17px] font-semibold leading-[1.2] tracking-tight text-[var(--text)]">
          {category.label}
        </h3>
        <p className="mt-1 text-[13px] leading-[1.55] text-[var(--muted)]">
          {tools.slice(0, 3).map((tool) => tool.title).join(", ")}
          {tools.length > 3 ? `, +${tools.length - 3} more` : ""}
        </p>
      </div>
    </Link>
  );
}

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <main className="mx-auto flex w-full max-w-page flex-col px-6">
      {/* Hero */}
      <section className="flex-1 flex flex-col relative py-8 md:py-16 overflow-hidden">
        {/* Soft accent glow at the top, fading out. */}
        <div
          className="pointer-events-none absolute -top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-[var(--accent-soft)] blur-[100px] opacity-40 md:w-[700px] md:h-[350px]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto w-full max-w-[620px] px-6 text-center">
          <Reveal delay={80}>
            <h1 className="text-balance font-display text-[56px] font-normal leading-[1.1] tracking-[0.01em] text-[var(--text)] sm:text-[64px] lg:text-[80px]">
              {t.rich("title", {
                display: (chunks) => (
                  <>
                    {React.Children.map(chunks, (chunk, i) =>
                      React.isValidElement(chunk) ? (
                        <span key={i} className="font-display italic text-[var(--accent)]">
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
            <p className="mt-6 text-[16px] leading-[1.6] text-[var(--muted)]">
              {t("subtitle")}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 md:mt-16">
          <Reveal delay={220}>
            <SearchBar />
          </Reveal>
        </div>

        {/* Quick access chips - quiet pills */}
        <div className="mt-10 md:mt-12 flex flex-wrap justify-center gap-2">
          {["word-counter", "case-converter", "image-compressor", "json-formatter", "unit-converter", "password-generator"].map((slug, index) => {
            const tool = getLiveTools().find((t) => t.slug === slug);
            if (!tool) return null;
            return (
              <Reveal key={slug} delay={280 + index * 40} stagger index={index}>
                <Link
                  href={`/tools/${slug}`}
                  className={cn(
                    "rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--muted)]",
                    "transition-[color,border-color,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                    "hover:border-[var(--accent)] hover:text-[var(--accent)]",
                    "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
                  )}
                >
                  {tool.title}
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-page px-6">
          <Reveal className="mb-12">
            <h2 className="font-sans text-[28px] font-bold leading-[1.15] tracking-tight text-[var(--text)]">
              {t("categories")}
            </h2>
          </Reveal>
          <div className={cn(
            "grid gap-4",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
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
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 md:py-20">
        <div className="mx-auto max-w-page px-6">
          <Reveal>
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] px-6 py-12 text-center md:px-16 md:py-16">
              <Reveal className="mb-4">
                <h2 className="font-sans text-[28px] font-bold leading-[1.15] tracking-tight text-[var(--text)]">
                  {t("requestTitle")}
                </h2>
              </Reveal>
              <Reveal delay={80}>
                <p className="mt-[12px] max-w-md mx-auto text-[15px] text-[var(--muted)]">
                  {t("requestSubtitle")}
                </p>
              </Reveal>
              <Reveal delay={160}>
                <Link
                  href="/request"
                  className={cn(
                    "group inline-flex items-center justify-center mt-[32px] rounded-[var(--radius-md)] bg-[var(--accent-fill)] px-[32px] py-3 font-semibold text-[var(--on-accent)] text-[16px]",
                    "transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                    "hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02]",
                    "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
                    "active:scale-[0.98]",
                  )}
                >
                  {t("requestCTA")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
