import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PrivacyPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <main className="mx-auto w-full max-w-page px-6 py-12">
      <article className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em] text-[var(--text)] sm:text-[40px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[var(--muted)]">{t("updated")}</p>
        </header>

        <div className="flex flex-col gap-8 text-[var(--muted)]">
          <section>
            <h2 className="mb-2 font-bold text-[var(--text)]">
              {t("filesTitle")}
            </h2>
            <p className="leading-[1.6]">{t("filesBody")}</p>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-[var(--text)]">
              {t("dataTitle")}
            </h2>
            <p className="leading-[1.6]">{t("dataBody")}</p>
          </section>

          <section>
            <h2 className="mb-2 font-bold text-[var(--text)]">
              {t("cookiesTitle")}
            </h2>
            <p className="leading-[1.6]">{t("cookiesBody")}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
