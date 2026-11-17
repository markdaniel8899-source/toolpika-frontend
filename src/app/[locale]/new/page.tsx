import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLiveTools } from "@/lib/tools/registry";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "new" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function NewToolsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "new" });
  const tools = getLiveTools().slice(-4).reverse();

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

      <div className="grid gap-4 sm:grid-cols-2">
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
    </main>
  );
}
