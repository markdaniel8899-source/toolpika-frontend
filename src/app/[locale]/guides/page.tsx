import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function GuidesPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });

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

      <Card className="mx-auto max-w-2xl">
        <CardContent className="p-6">
          <p className="text-[15px] leading-[1.6] text-[var(--muted)]">{t("empty")}</p>
          <Link
            href="/request"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline underline-offset-4 hover:opacity-80"
          >
            {t("requestInstead")}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
