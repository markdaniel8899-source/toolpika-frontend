import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getPopularTools } from "@/lib/tools/registry";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "popular" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PopularPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "popular" });
  const popular = getPopularTools(8);

  return (
    <main className="mx-auto w-full max-w-page px-6 py-12">
      <header className="mb-12">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="font-sans text-[30px] font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-2xl text-[16px] leading-[1.6] text-[var(--muted)]">
          {t("description")}
        </p>
      </header>

      <ol className="mx-auto flex max-w-3xl flex-col gap-3">
        {popular.map((tool, index) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${tool.slug}`}
              className={cn(
                "group flex items-center gap-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)]",
                "hover:border-[var(--accent)] hover:-translate-y-[2px] hover:shadow-[var(--shadow-md)]",
                "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
              )}
            >
              <span className="w-8 shrink-0 text-[14px] font-semibold tabular-nums text-[var(--muted)] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:text-[var(--accent)]">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[var(--text)]">{tool.title}</span>
                <span className="mt-1 block text-[15px] leading-[1.6] text-[var(--muted)]">
                  {tool.description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted)] transition-[transform,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:translate-x-2 group-hover:text-[var(--accent)]" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
