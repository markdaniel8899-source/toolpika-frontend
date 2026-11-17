import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Constitution §4 — Inputs.
 * surface bg, border border, 10px radius.
 * Focus: accent border + 2px accent ring at 20% opacity.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
