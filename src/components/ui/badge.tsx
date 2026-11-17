import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent-fill)] text-[var(--on-accent)]",
        secondary:
          "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
        destructive:
          "border-transparent bg-[var(--danger)] text-[var(--on-accent)]",
        success:
          "border-transparent bg-[var(--success)] text-[var(--on-accent)]",
        outline:
          "border-[var(--border)] bg-transparent text-[var(--text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
