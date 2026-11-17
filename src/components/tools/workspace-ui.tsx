"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A single labelled number in the result pane. */
export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
      <dt className="text-xs font-medium text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 font-sans text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export function ToolField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-[var(--text)]"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-xs leading-[1.5] text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

/** Copy-to-clipboard button with a short "Copied" confirmation. */
export function CopyButton({
  text,
  label,
  copiedLabel,
  className,
}: {
  text: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be blocked; the text stays selectable.
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={copy}
      disabled={!text}
      className={className}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {copied ? copiedLabel : label}
    </Button>
  );
}

/** Shared native select styling — same tokens as the shadcn input. */
export const selectClassName =
  "flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20";

export function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--text)] transition-colors hover:border-[var(--accent)]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--accent-fill)]"
      />
      {label}
    </label>
  );
}

/** Empty output block shared by the text tools. */
export function OutputEmpty({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4 text-center text-sm text-[var(--muted)]",
        className
      )}
    >
      {message}
    </div>
  );
}
