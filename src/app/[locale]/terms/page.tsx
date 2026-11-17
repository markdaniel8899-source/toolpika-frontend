import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TermsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return (
    <main className="mx-auto w-full max-w-page px-6 py-12">
      <article className="mx-auto max-w-2xl">
        <header className="mb-12">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("eyebrow")}
          </p>
          <h1 className="font-sans text-[30px] font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[40px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-[var(--muted)]">{t("updated")}</p>
        </header>

        <div className="flex flex-col gap-8 text-[15px] leading-[1.65] text-[var(--muted)]">
          <section>
            <h2 className="mb-2 font-semibold text-[var(--text)]">
              {t("useTitle")}
            </h2>
            <p>{t("useBody")}</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text)]">
              {t("liabilityTitle")}
            </h2>
            <p>{t("liabilityBody")}</p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-[var(--text)]">
              {t("changesTitle")}
            </h2>
            <p>{t("changesBody")}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
