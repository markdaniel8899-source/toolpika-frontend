import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-page flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        404
      </p>
      <h1 className="mt-3 font-sans text-[30px] font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-[40px]">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-[1.6] text-[var(--muted)]">{t("description")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-fill)] px-6 font-semibold text-[var(--on-accent)] transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-[var(--accent-fill-hover)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 active:scale-[0.98]"
      >
        {t("back")}
      </Link>
    </main>
  );
}
