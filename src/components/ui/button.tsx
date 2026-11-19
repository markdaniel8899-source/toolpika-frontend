import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Section 7 - Buttons.
 * Primary: bg --accent-fill / text --accent-fg.
 * Secondary: transparent, 1px --border, text --text, hover border --accent.
 * Ghost: transparent, hover --surface-2.
 * Height 44px (36px small), radius --radius-md, font weight 600.
 * Focus ring --ring, active scale 0.98, transition --dur-fast --ease-out.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-[var(--ring)] focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "tp-ui-primary bg-[var(--accent-fill)] text-[var(--accent-fg)] hover:bg-[var(--accent-fill-hover)]",
        destructive:
          "bg-[var(--danger)] text-[var(--on-accent)] hover:bg-[var(--danger-hover)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--accent)]",
        secondary:
          "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)]",
        ghost:
          "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
        link: "bg-transparent text-[var(--accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 text-sm",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
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
