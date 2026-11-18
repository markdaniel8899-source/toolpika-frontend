import * as React from "react";

import { cn } from "@/lib/utils";

/** Textareas share the themed field surface and focus shadow. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn("tp-field-input min-h-[120px] leading-[1.6]", className)}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
