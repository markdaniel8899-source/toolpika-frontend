import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
      <header className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="font-sans text-[32px] tracking-[-0.02em] text-[var(--text)] sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">{t("description")}</p>
      </header>

      <ol className="grid gap-3">
        {popular.map((tool, index) => (
          <li key={tool.slug}>
            <Link
              href={`/tools/${tool.slug}`}
              className="flex items-center gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-200 hover:-translate-y-[2px] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            >
              <span className="w-6 shrink-0 text-[13px] font-bold text-[var(--muted)]">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-[var(--text)]">
                  {tool.title}
                </span>
                <span className="mt-0.5 block text-sm text-[var(--muted)]">
                  {tool.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
