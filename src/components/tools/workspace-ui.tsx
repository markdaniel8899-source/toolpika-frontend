"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, ChevronDown, ChevronUp, Copy, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { tokenizeCode, type CodeLanguage } from "@/lib/tools/code-highlight";
import { cn } from "@/lib/utils";

/** A single labelled number in the result pane. */
export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="tp-stat">
      <dt className="tp-stat-label">{label}</dt>
      <dd className="tp-stat-value">{value}</dd>
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
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-[var(--text)]"
        >
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      )}
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

/** Shared native select styling - same tokens as the shadcn input. */
export const selectClassName = "tp-field-input";

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
    <div className="tp-check-row">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="tp-checkbox"
      />
      <label htmlFor={id} className="tp-check-label">{label}</label>
    </div>
  );
}

/** Theme-aware switch with a visible track and knob in both themes. */
export function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn("tp-tool-switch", checked && "is-checked")}
    >
      <span className="tp-tool-switch-knob" aria-hidden="true" />
    </button>
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

/* --------------------------------------------------------------------------
 * Shared tool-box kit. Labels are passed in so every string stays in messages.
 * -------------------------------------------------------------------------- */

/** Single elevated card: header, two panes, optional options tray, ribbon. */
export function ToolShell({
  title,
  subtitle,
  icon,
  sampleLabel,
  resetLabel,
  privacyLabel,
  onSample,
  onReset,
  notice,
  noticeTone = "warning",
  input,
  result,
  options,
  ribbonRight,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  sampleLabel: string;
  resetLabel: string;
  privacyLabel: string;
  onSample: () => void;
  onReset: () => void;
  notice?: string;
  noticeTone?: "warning" | "danger";
  input: React.ReactNode;
  result: React.ReactNode;
  options?: React.ReactNode;
  ribbonRight?: React.ReactNode;
}) {
  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name={icon} />
          </span>
          <span>
            <span className="tp-tool-name">{title}</span>
            {subtitle ? <span className="tp-tool-subtitle">{subtitle}</span> : null}
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={onSample}>
            {sampleLabel}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {resetLabel}
          </Button>
        </div>
      </div>

      {notice ? (
        <p className="tp-tool-notice" data-tone={noticeTone} role="status" aria-live="polite" style={{ margin: "12px 22px 0" }}>
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      <div className="tp-tool-body">{input}{result}</div>
      {options ? <div className="tp-tool-options">{options}</div> : null}

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {privacyLabel}
        </span>
        {ribbonRight}
      </div>
    </div>
  );
}

/** One panel with a labelled head, action cluster and footer counters. */
export function ToolPane({
  id,
  title,
  hint,
  actions,
  footer,
  result,
  className,
  children,
}: {
  id?: string;
  title: string;
  hint?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  result?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("tp-tool-pane", result && "tp-tool-pane--result", className)}
      aria-labelledby={id}
    >
      <div className="tp-tool-pane-head">
        <div className="tp-tool-pane-title">
          <h3 id={id}>{title}</h3>
          {hint ? <p className="tp-tool-pane-hint">{hint}</p> : null}
        </div>
        {actions ? <div className="tp-tool-pane-actions">{actions}</div> : null}
      </div>
      <div className="tp-tool-pane-body">{children}</div>
      {footer ? <div className="tp-tool-pane-foot">{footer}</div> : null}
    </section>
  );
}

/** Friendly empty state with a call to action — never a blank white box. */
export function ToolEmpty({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="tp-tool-empty">
      <span className="tp-tool-empty-icon" aria-hidden="true">{icon}</span>
      <span className="tp-tool-empty-title">{title}</span>
      <p className="tp-tool-empty-hint">{hint}</p>
    </div>
  );
}

export function ToolBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  return <span className="tp-tool-badge" data-tone={tone}>{children}</span>;
}

/** Accessible 2-4 choice segmented control with arrow-key navigation. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="tp-tool-segment" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            const index = options.findIndex((item) => item.value === value);
            const step = event.key === "ArrowRight" ? 1 : -1;
            const next = options[(index + step + options.length) % options.length];
            if (next) {
              onChange(next.value);
              (event.currentTarget.parentElement?.children[
                (index + step + options.length) % options.length
              ] as HTMLButtonElement | undefined)?.focus();
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Saves a Blob or string with a correct name and always revokes its URL. */
export function DownloadButton({
  content,
  fileName,
  mimeType = "text/plain;charset=utf-8",
  label,
  className,
  disabled,
}: {
  content: string | Blob | null;
  fileName: string;
  mimeType?: string;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const download = () => {
    if (!content) return;
    const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
    const url = URL.createObjectURL(blob);
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Button type="button" variant="secondary" size="sm" onClick={download} disabled={disabled || !content} className={className}>
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Button>
  );
}

/**
 * Number field with small themed up/down controls. OS spin buttons are hidden
 * in CSS so the arrows look identical in every theme and on every device.
 */
export function NumberStepper({
  id,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  inputMode = "numeric",
  ariaLabel,
  increaseLabel,
  decreaseLabel,
  describedBy,
  className,
  inputRef,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: "numeric" | "decimal";
  ariaLabel?: string;
  increaseLabel: string;
  decreaseLabel: string;
  describedBy?: string;
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const clamp = (next: number) => {
    let result = next;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  };

  const bump = (direction: 1 | -1) => {
    const parsed = Number(value);
    const base = Number.isFinite(parsed) ? parsed : (min ?? 0);
    const next = clamp(Math.round((base + direction * step) * 1000) / 1000);
    onValueChange(String(next));
  };

  const atMin = min !== undefined && Number(value) <= min;
  const atMax = max !== undefined && Number(value) >= max;

  return (
    <div className={cn("tp-stepper", className)}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <span className="tp-stepper-controls" aria-hidden="false">
        <button
          type="button"
          onClick={() => bump(1)}
          disabled={atMax}
          aria-label={`${increaseLabel} ${ariaLabel ?? ""}`.trim()}
        >
          <ChevronUp aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={atMin}
          aria-label={`${decreaseLabel} ${ariaLabel ?? ""}`.trim()}
        >
          <ChevronDown aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

/**
 * Read-only code editor for code outputs: line numbers, theme-aware syntax
 * colours, wrapping and font size. Options persist; user input never does.
 */
export function CodeOutput({
  code,
  language,
  storageKey,
  label,
  fileName,
  mimeType,
  className,
}: {
  code: string;
  language: CodeLanguage;
  storageKey: string;
  label: string;
  fileName: string;
  mimeType?: string;
  className?: string;
}) {
  const t = useTranslations("toolUi");
  const { options, update } = usePersistedOptions<{
    lineNumbers: boolean;
    wrap: boolean;
    size: "12" | "13" | "14";
  }>(storageKey, { lineNumbers: true, wrap: true, size: "13" });
  const lines = useMemo(() => tokenizeCode(code, language), [code, language]);

  return (
    <div
      className={cn("tp-code-editor", className)}
      style={{ "--tp-code-size": `${options.size}px` } as CSSProperties}
    >
      <div className="tp-code-editor-bar">
        <span className="tp-tool-group-title">{label}</span>
        <div className="tp-tool-inline-actions">
          <CopyButton text={code} label={t("copy")} copiedLabel={t("copied")} />
          <DownloadButton content={code} fileName={fileName} mimeType={mimeType} label={t("download")} />
        </div>
      </div>
      <div className="tp-code-editor-options">
        <CheckboxRow
          id={`${storageKey}-numbers`}
          label={t("lineNumbers")}
          checked={options.lineNumbers}
          onChange={(lineNumbers) => update({ lineNumbers })}
        />
        <CheckboxRow
          id={`${storageKey}-wrap`}
          label={t("wordWrap")}
          checked={options.wrap}
          onChange={(wrap) => update({ wrap })}
        />
        <div className="tp-code-editor-size">
          <span className="tp-tool-label">{t("fontSize")}</span>
          <SegmentedControl
            label={t("fontSize")}
            value={options.size}
            options={[
              { value: "12", label: "12" },
              { value: "13", label: "13" },
              { value: "14", label: "14" },
            ]}
            onChange={(size) => update({ size: size as "12" | "13" | "14" })}
          />
        </div>
      </div>
      <div className="tp-code-editor-body" data-wrap={options.wrap ? "true" : undefined} aria-live="polite">
        {lines.map((line, index) => (
          <div className="tp-code-line" key={index}>
            {options.lineNumbers ? (
              <span className="tp-code-line-num" aria-hidden="true">{index + 1}</span>
            ) : null}
            <span className="tp-code-line-text">
              {line.tokens.map((token, tokenIndex) => (
                <span key={tokenIndex} className={`tp-code-token tp-code-token--${token.type}`}>
                  {token.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Short, auto-dismissing status message for inline feedback. */
export function useToolNotice(duration = 3200) {
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), duration);
  }, [duration]);

  const clearNotice = useCallback(() => {
    setNotice("");
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { notice, showNotice, clearNotice };
}

/** Clipboard feedback with the shared "Copied" state and cleanup. */
export function useCopyFeedback(duration = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), duration);
      return true;
    } catch {
      return false;
    }
  }, [duration]);

  const reset = useCallback(() => setCopied(false), []);

  return { copied, copy, reset };
}

/** Options persist across visits; user input never does. Storage is optional. */
export function usePersistedOptions<T extends object>(
  key: string,
  defaults: T,
) {
  const [options, setOptions] = useState<T>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) return { ...defaults, ...(JSON.parse(stored) as Partial<T>) };
    } catch {
      // Storage can be disabled; defaults still work.
    }
    return defaults;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(options));
    } catch {
      // Ignore quota and privacy-mode failures.
    }
  }, [key, options]);

  const update = useCallback((patch: Partial<T>) => {
    setOptions((previous) => ({ ...previous, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setOptions(defaults);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  }, [defaults, key]);

  return { options, update, reset };
}

/** Debounce light live processing so typing stays responsive. */
export function useDebounced<T>(value: T, delay = 220) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/** Ctrl/Cmd + Shift + C copies the result from anywhere in the tool. */
export function useCopyShortcut(onCopy: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        onCopy();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCopy]);
}
