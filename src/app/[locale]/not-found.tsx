import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-page flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        404
      </p>
      <h1 className="mt-3 font-sans text-3xl tracking-display sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-[var(--muted)]">{t("description")}</p>
      <Link
        href="/"
        className="mt-7 inline-flex rounded-[10px] bg-[var(--accent-fill)] px-6 py-3 font-bold text-[var(--on-accent)] transition-all duration-200 hover:bg-[var(--accent-fill-hover)]"
      >
        {t("back")}
      </Link>
    </main>
  );
}
