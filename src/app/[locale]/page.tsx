import type { ComponentType, SVGProps } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Flame } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { getPopularTools, getToolsByCategory, categories } from "@/lib/tools/registry";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Trust pill shown above the hero H1. */
function TrustPill() {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] text-[11px] font-semibold uppercase tracking-[0.15em] shadow-sm">
      100% free
      <span className="w-px h-3 bg-[var(--border)] mx-1" aria-hidden="true" />
      No signup
      <span className="w-px h-3 bg-[var(--border)] mx-1" aria-hidden="true" />
      Files never leave your browser
    </div>
  );
}

/** Icon tile used inside category cards. */
function IconTile({ icon: Icon }: { icon: ComponentType<SVGProps<SVGSVGElement>> }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--bg)] p-2.5">
      <Icon className="h-5 w-5 text-[var(--accent)]" />
    </div>
  );
}

/** Category card — identical structure, no orphan risk handled by grid below. */
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
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-1.5",
        "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        "hover:border-[var(--accent)] hover:-translate-y-[4px] hover:shadow-[var(--shadow-md)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
      )}
    >
      <div className={cn("flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5", "transition-[border-color] duration-[var(--dur-base)] group-hover:border-[var(--accent)]")}>
        <IconTile icon={category.Icon} />
        <h3 className="font-heading text-[20px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
          {category.label}
        </h3>
        <p className="text-[13px] text-[var(--muted)]">
          {tools.length} tools
        </p>
        <ul className="flex flex-wrap gap-2 mt-3">
          {tools.slice(0, 5).map((tool) => (
            <li key={tool.slug} className="text-[12px] text-[var(--muted)]">
              {tool.title}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}

/** Popular tools card. */
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
        "flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4",
        "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        "hover:border-[var(--accent)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-sm)]",
        "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
      )}
    >
      <span className="flex shrink-0 items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent-soft)] text-[18px] font-bold text-[var(--accent)]">
        {rank}
      </span>
      <Link
        href={`/tools/${tool.slug}`}
        className="flex-1 text-[16px] font-medium text-[var(--text)] hover:text-[var(--accent)] transition-colors duration-[var(--dur-fast)]"
      >
        {tool.title}
      </Link>
      <Badge>{tool.category}</Badge>
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

  const whyToolpika = [
    ["Private by design", "Everything runs in your browser. Nothing is uploaded."],
    ["Free and fast", "No signup, no paywall — tools open instantly."],
    ["Any device", "Works on desktop, tablet and phone."],
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-page flex-col px-6">
      {/* Hero */}
      <section
        className={cn(
          "flex-1 flex flex-col relative",
          "py-20 md:py-32",
          "overflow-hidden",
        )}
      >
        {/* Radial accent glow at the top, fading out. */}
        <div
          className="pointer-events-none absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[var(--accent-soft)] blur-[120px] opacity-40 md:w-[900px] md:h-[450px]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto max-w-[560px] px-6 text-center">
          <Reveal delay={0} className="mb-8">
            <TrustPill />
          </Reveal>
          <Reveal delay={80} className="mb-6">
            <h1 className="text-balance font-heading text-[40px] font-bold leading-[1.15] tracking-[-0.03em] text-[var(--text)] sm:text-[60px]">
              {t.rich("title", {
                display: (chunks) => (
                  <span className="text-[var(--accent)]">
                    {chunks}
                  </span>
                ),
              })}
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="max-w-[560px] mx-auto text-[18px] leading-[1.6] text-[var(--muted)] sm:text-[20px]">
              {t("subtitle")}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 md:mt-24">
          <Reveal delay={220}>
            <SearchBar />
          </Reveal>
        </div>

        <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-3">
          {popular.slice(0, 6).map((tool, index) => (
            <Reveal key={tool.slug} delay={280 + index * 60} stagger index={index}>
              <Link
                href={`/tools/${tool.slug}`}
                className={cn(
                  "rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)]",
                  "transition-colors duration-[var(--dur-fast)]",
                  "hover:border-[var(--accent)] hover:text-[var(--text)]",
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
              <h2 className="font-heading text-[32px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
                {t("popular")}
              </h2>
            </div>
            <Link
              href="/popular"
              className="text-sm font-medium text-[var(--accent)] hover:underline transition-colors duration-[var(--dur-fast)]"
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
            <h2 className="font-heading text-[32px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
              {t("categories")}
            </h2>
          </Reveal>
          <div className={cn(
            "grid gap-4",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            "auto-cols-[minmax(0,1fr)]", // no orphan row
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

      {/* Why Toolpika */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-page px-6">
          <Reveal className="flex items-center justify-between mb-12">
            <h2 className="font-heading text-[32px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
              Why Toolpika
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {whyToolpika.map(([title, body], index) => (
              <Reveal key={index} stagger index={index}>
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle className="text-[18px]">{title}</CardTitle>
                  </CardHeader>
                  <CardDescription>{body}</CardDescription>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Request section */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-20 md:py-28">
        <div className="mx-auto max-w-page px-6">
          <div className={cn(
            "rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(to_bottom,var(--accent-soft),var(--surface))] p-[48px] text-center lg:p-[64px]",
          )}>
            <Reveal className="mb-4">
              <h2 className="font-heading text-[28px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
                {t("requestTitle")}
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mb-8 max-w-md mx-auto text-[var(--muted)]">
                {t("requestSubtitle")}
              </p>
            </Reveal>
            <Reveal delay={160}>
              <Link
                href="/request"
                className={cn(
                  "inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-fill)] px-[32px] py-3 font-semibold text-[var(--accent-fg)]",
                  "transition-all duration-[var(--dur-fast)]",
                  "hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02]",
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
