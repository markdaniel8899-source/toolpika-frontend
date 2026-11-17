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
  const t = await getTranslations({ locale, namespace: "request" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RequestPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "request" });

  return (
    <main className="mx-auto w-full max-w-page px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            {t("eyebrow")}
          </p>
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em] text-[var(--text)] sm:text-[40px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[var(--muted)]">{t("description")}</p>
        </header>

        <Card>
          <CardContent className="p-6">
            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-name"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {t("toolNameLabel")}
                </label>
                <input
                  id="tool-name"
                  name="toolName"
                  type="text"
                  required
                  placeholder={t("toolNamePlaceholder")}
                  className="flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-description"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {t("descriptionLabel")}
                </label>
                <textarea
                  id="tool-description"
                  name="description"
                  rows={5}
                  required
                  placeholder={t("descriptionPlaceholder")}
                  className="flex min-h-[120px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-[1.6] text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-email"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {t("emailLabel")}
                </label>
                <input
                  id="tool-email"
                  name="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className="flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
                />
                <p className="text-xs text-[var(--muted)]">{t("emailHint")}</p>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-[10px] bg-[var(--accent-fill)] px-6 py-3 font-bold text-[var(--on-accent)] transition-all duration-200 hover:scale-[1.02] hover:bg-[var(--accent-fill-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
              >
                {t("submit")}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          <Link
            href="/"
            className="text-[var(--accent)] underline underline-offset-4 hover:opacity-80"
          >
            {t("backHome")}
          </Link>
        </p>
      </div>
    </main>
  );
}
