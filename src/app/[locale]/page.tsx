import type { ComponentType, SVGProps } from "react";
import React from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { getToolsByCategory, categories, getLiveTools } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/** Icon tile used inside category cards - simple icon, no background. */
function IconTile({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return (
    <Icon className="h-8 w-8 text-[var(--accent)]" />
  );
}

/** Category card - uniform boxes, same height/width, simple icon + heading + description. */
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
        "flex flex-col items-start gap-2 h-[160px] w-full rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5",
        "transition-all duration-300 ease-out hover:border-[var(--accent)] hover:-translate-y-[4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]",
        "focus-visible:ring-0 focus-visible:outline-0",
      )}
    >
      <IconTile icon={category.Icon} />
      <h3 className="font-sans text-[15px] font-normal leading-[1.15] tracking-tight text-[var(--text)]">
        {category.label}
      </h3>
      <p className="text-[12px] text-[var(--muted)] leading-[1.5] mt-auto">
        {tools.slice(0, 3).map((tool, i) => (i > 0 ? ", " : "") + tool.title)}
      </p>
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
        {/* Radial accent glow at the top, fading out. */}
        <div
          className="pointer-events-none absolute -top-[20%] left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-[var(--accent-soft)] blur-[100px] opacity-40 md:w-[700px] md:h-[350px]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[560px] px-6 text-center">
          <Reveal delay={80} className="mb-4">
            <h1 className="text-balance font-sans text-[72px] font-bold leading-[1.1] tracking-tight text-[var(--text)] sm:text-[80px]">
              {t.rich("title", {
                display: (chunks) => (
                  <>
                    {React.Children.map(chunks, (chunk, i) =>
                      React.isValidElement(chunk) ? (
                        <span key={i} className="font-display font-bold italic text-[var(--accent)]">
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
            <p className="max-w-[560px] mx-auto text-[15px] leading-[1.6] text-[var(--muted)] sm:text-[16px]">
              {t("subtitle")}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 md:mt-16">
          <Reveal delay={220}>
            <SearchBar />
          </Reveal>
        </div>

        {/* Quick access chips - wide pills with light colors */}
        <div className="mt-10 md:mt-12 flex flex-wrap justify-center gap-2">
          {["word-counter", "case-converter", "image-compressor", "json-formatter", "unit-converter", "password-generator"].map((slug, index) => {
            const tool = getLiveTools().find((t) => t.slug === slug);
            if (!tool) return null;
            const chipColors = [
              "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30",
              "bg-[#fdf2f8] text-[#be185d] border-[#f9a8d4]/30",
              "bg-[#fefce8] text-[#a16207] border-[#fde047]/30",
              "bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]/30",
              "bg-[#f0fdf4] text-[#059669] border-[#bbf7d0]/30",
              "bg-[#faf5ff] text-[#7e22ce] border-[#e9d5ff]/30",
            ];
            return (
              <Reveal key={slug} delay={280 + index * 40} stagger index={index}>
                <Link
                  href={`/tools/${slug}`}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-[13px] font-normal transition-all duration-300 ease-out",
                    chipColors[index % chipColors.length],
                    "hover:bg-[var(--accent)] hover:text-[var(--on-accent)] hover:border-[var(--accent)]",
                    "focus-visible:ring-0 focus-visible:outline-0",
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
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--bg)] p-[48px] text-center lg:p-[64px]">
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
                  "inline-flex items-center justify-center mt-[32px] rounded-[12px] bg-[var(--accent-fill)] px-[32px] py-3 font-medium text-[var(--on-accent)] text-[16px]",
                  "transition-all duration-300 ease-out hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02]",
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
