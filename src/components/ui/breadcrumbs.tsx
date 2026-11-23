import * as React from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Home > Category > Current page, themed and localized. */
export async function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  const t = await getTranslations("nav");
  return (
    <nav aria-label={t("breadcrumb")} className={cn("tp-breadcrumbs", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {item.href && !isLast ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span style={{ color: isLast ? "var(--text)" : undefined }}>{item.label}</span>
            )}
            {!isLast && <span className="sep" aria-hidden="true">/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
