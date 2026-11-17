import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Constitution §4 — Button rules.
 * Primary: bg-accent-fill / on-accent. Secondary: transparent + border.
 * Ghost: transparent, muted label. Radius 10px, 200ms transitions.
 * Focus ring: 2px accent outline with 3px offset (never a Tailwind ring utility).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-fill)] text-[var(--on-accent)] hover:scale-[1.02] hover:bg-[var(--accent-fill-hover)]",
        destructive:
          "bg-[var(--danger)] text-[var(--on-accent)] hover:bg-[var(--danger-hover)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--accent)]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]",
        ghost:
          "bg-transparent text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]",
        link: "bg-transparent text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "px-6 py-3 text-sm",
        sm: "px-3 py-2 text-xs",
        lg: "px-8 py-4 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
