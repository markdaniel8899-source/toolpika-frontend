import * as React from "react";

import { cn } from "@/lib/utils";

/** Inputs use the themed field surface and a soft focus shadow, never a solid border. */
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { invalid?: boolean }
>(({ className, type = "text", invalid, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "tp-field-input",
        invalid && "border-[var(--danger)] focus:border-[var(--danger)]",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
