import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Section 7 — Inputs.
 * --surface background, 1px --border, radius --radius-md (12px), min height 44px.
 * Focus: border --accent plus 3px --ring. Invalid: border --danger.
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { invalid?: boolean }
>(({ className, type = "text", invalid, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex w-full min-h-[44px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] placeholder:text-[var(--muted)]",
        "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
        invalid
          ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[3px] focus:ring-[var(--danger)]/30"
          : "focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
