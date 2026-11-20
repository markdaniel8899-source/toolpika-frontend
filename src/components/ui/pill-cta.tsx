import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type PillCtaProps = Omit<ComponentProps<typeof Link>, "href" | "children" | "className"> & {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  size?: "md" | "lg";
};

/** Shared CTA markup: label + nested icon island, same language as the header pill. */
export function PillCtaContent({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <>
      <span className="tp-pill-label">{children}</span>
      <span className="tp-pill-icon" aria-hidden="true">
        {icon ?? <ArrowRight className="tp-icon" />}
      </span>
    </>
  );
}

export function PillCta({
  href,
  children,
  className,
  icon,
  size = "md",
  ...props
}: PillCtaProps) {
  return (
    <Link
      href={href}
      className={cn("tp-pill-cta", size === "lg" && "tp-pill-cta-lg", className)}
      {...props}
    >
      <PillCtaContent icon={icon}>{children}</PillCtaContent>
    </Link>
  );
}
