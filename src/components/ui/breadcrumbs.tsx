import * as React from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Home > Category > Current page, themed and localized. */
export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("tp-breadcrumbs", className)}>
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
