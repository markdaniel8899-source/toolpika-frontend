import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AboutPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <main className="mx-auto w-full max-w-page px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("eyebrow")}
          </p>
          <h1 className="font-sans text-[32px] tracking-[-0.02em] text-[var(--text)] sm:text-[40px]">
            {t("title")}
          </h1>
        </header>

        <div className="flex flex-col gap-6 text-[var(--muted)]">
          <p className="leading-[1.6]">{t("intro")}</p>

          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 font-bold text-[var(--text)]">
                {t("privacyTitle")}
              </h2>
              <p className="leading-[1.6]">{t("privacyBody")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="mb-3 font-bold text-[var(--text)]">
                {t("contactTitle")}
              </h2>
              <p className="leading-[1.6]">
                <a
                  href="mailto:hello@toolpika.site"
                  className="text-[var(--accent)] underline underline-offset-4 hover:opacity-80"
                >
                  hello@toolpika.site
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
