"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("errors");
  const digest =
    error && typeof error === "object" && "digest" in error
      ? String((error as { digest?: unknown }).digest ?? "")
      : "";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="tp-container" style={{ paddingBlock: 80 }}>
      <div className="tp-error-card">
        <span className="tp-error-icon" aria-hidden="true">
          <AlertTriangle />
        </span>
        <h1>{t("title")}</h1>
        <p>{t("body")}</p>
        {digest ? <p className="tp-error-detail">{t("detail", { digest })}</p> : null}
        <div className="tp-error-actions">
          <Button type="button" onClick={retry}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {t("retry")}
          </Button>
          <Link href="/all-tools" className="tp-text-link">
            {t("home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
