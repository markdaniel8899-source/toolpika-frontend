"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, ChevronDown, ChevronUp, Copy, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { tokenizeCode, type CodeLanguage } from "@/lib/tools/code-highlight";
import { filterCurrencies, findCurrency } from "@/lib/tools/currencies";
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
          <span className="tp-tool-identity-text">
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
        <p className="tp-tool-notice" data-tone={noticeTone} role="status" aria-live="polite">
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

/** Large, calm primary result card. One hero value per tool pane. */
export function HeroValue({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="tp-hero-value">
      <span className="tp-tool-label">{label}</span>
      <output dir="ltr" className="tp-hero-value-text">{value}</output>
      {note ? <span className="tp-hero-value-note">{note}</span> : null}
    </div>
  );
}

function isoParts(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value.trim());
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/**
 * Day, month and year selects in that reading order. A month change clamps the
 * day to the last valid date, and the optional Today action keeps a reference
 * date on the current day without a native date input.
 */
export function DatePartsPicker({
  id,
  label,
  value,
  onChange,
  locale,
  hint,
  ariaDescribedBy,
  minYear = 1900,
  maxYear = 2100,
  todayLabel,
  onToday,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: string;
  hint?: string;
  ariaDescribedBy?: string;
  minYear?: number;
  maxYear?: number;
  todayLabel?: string;
  onToday?: () => void;
}) {
  const t = useTranslations("toolUi");
  const parts = isoParts(value);
  // Keep partial selections visible without an effect: a local draft is used
  // only while it belongs to the current parent value. A sample or reset
  // changes that value, so the draft is replaced by the new complete date.
  const [local, setLocal] = useState<{
    source: string;
    draft: { year: string; month: string; day: string };
  } | null>(null);
  const draft = local && local.source === value
    ? local.draft
    : parts
      ? { year: String(parts.year), month: String(parts.month), day: String(parts.day) }
      : { year: "", month: "", day: "" };

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }),
    [locale],
  );
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, index) => ({
      value: index + 1,
      label: monthFormatter.format(new Date(Date.UTC(2024, index, 1))),
    })),
    [monthFormatter],
  );
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index),
    [minYear, maxYear],
  );

  const update = (patch: Partial<{ year: string; month: string; day: string }>) => {
    const next = { ...draft, ...patch };
    const year = Number(next.year);
    const month = Number(next.month);
    const day = Number(next.day);
    let emitted = "";
    if (next.year && next.month && next.day && year && month && day) {
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      emitted = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
    }
    setLocal({ source: emitted, draft: next });
    onChange(emitted);
  };

  return (
    <div className="tp-tool-group tp-tool-group--flush">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="tp-tool-group-title">{label}</span>
        {todayLabel && onToday ? (
          <button type="button" className="tp-date-today" onClick={onToday}>
            {todayLabel}
          </button>
        ) : null}
      </div>
      <div className="tp-date-parts">
        <label className="tp-date-part" htmlFor={`${id}-day`}>
          <span>{t("day")}</span>
          <select
            id={`${id}-day`}
            value={draft.day}
            aria-label={`${label} ${t("day")}`}
            aria-describedby={ariaDescribedBy}
            onChange={(event) => update({ day: event.target.value })}
          >
            <option value="">{t("dayPlaceholder")}</option>
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </label>
        <label className="tp-date-part" htmlFor={`${id}-month`}>
          <span>{t("month")}</span>
          <select
            id={`${id}-month`}
            value={draft.month}
            aria-label={`${label} ${t("month")}`}
            aria-describedby={ariaDescribedBy}
            onChange={(event) => update({ month: event.target.value })}
          >
            <option value="">{t("monthPlaceholder")}</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </label>
        <label className="tp-date-part" htmlFor={`${id}-year`}>
          <span>{t("year")}</span>
          <select
            id={`${id}-year`}
            value={draft.year}
            aria-label={`${label} ${t("year")}`}
            aria-describedby={ariaDescribedBy}
            onChange={(event) => update({ year: event.target.value })}
          >
            <option value="">{t("yearPlaceholder")}</option>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </div>
      {hint ? <p className="tp-tool-hint">{hint}</p> : null}
    </div>
  );
}

/** Searchable currency combobox. Typing a letter filters code and name. */
export function CurrencyPicker({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (code: string) => void;
  hint?: string;
}) {
  const t = useTranslations("toolUi");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = findCurrency(value);
  const options = useMemo(() => filterCurrencies(query), [query]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div className="tp-tool-group tp-tool-group--flush tp-currency" ref={rootRef}>
      <span className="tp-tool-group-title">{label}</span>
      <div className="tp-currency-control">
        <input
          id={id}
          type="text"
          className="tp-currency-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-label={label}
          aria-autocomplete="list"
          autoComplete="off"
          value={open ? query : `${selected.code} · ${selected.name}`}
          placeholder={t("currencySearchPlaceholder")}
          onFocus={() => { setQuery(""); setOpen(true); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && options.length > 0) {
              event.preventDefault();
              onChange(options[0].code);
              setOpen(false);
            }
          }}
        />
        {open ? (
          <div className="tp-currency-list" id={`${id}-list`} role="listbox" aria-label={t("currencySearchLabel")}>
            {options.length === 0 ? (
              <p className="tp-tool-hint" style={{ padding: "8px 9px", margin: 0 }}>
                {t("currencyNoResults")}
              </p>
            ) : options.map((option) => (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={option.code === value}
                className="tp-currency-option"
                onClick={() => { onChange(option.code); setOpen(false); }}
              >
                <span className="tp-currency-code">{option.code}</span>
                <span className="tp-currency-hint">{option.name}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {hint ? <p className="tp-tool-hint">{hint}</p> : null}
    </div>
  );
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
  variant = "secondary",
}: {
  content: string | Blob | null;
  fileName: string;
  mimeType?: string;
  label: string;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "secondary" | "ghost";
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
    <Button type="button" variant={variant} size="sm" onClick={download} disabled={disabled || !content} className={className}>
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
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          bump(event.key === "ArrowUp" ? 1 : -1);
        }}
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
 * Clean read-only code editor: fixed 13.5px, always-on line numbers and
 * language-aware syntax colours. Copy and Download work in every browser.
 */
export function CodeOutput({
  code,
  language,
  label,
  fileName,
  mimeType,
  className,
  wrap = false,
}: {
  code: string;
  language: CodeLanguage;
  /** Kept for call-site compatibility; the editor has no persisted options. */
  storageKey?: string;
  label: string;
  fileName: string;
  mimeType?: string;
  className?: string;
  /** Wrap long lines instead of horizontal scrolling. Useful for minified output. */
  wrap?: boolean;
}) {
  const t = useTranslations("toolUi");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lines = useMemo(() => tokenizeCode(code, language), [code, language]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = code;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: mimeType ?? "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className={cn("tp-code-editor", className)}>
      <div className="tp-code-editor-bar">
        <span className="tp-tool-group-title tp-code-editor-label">{label}</span>
        <div className="tp-code-editor-actions">
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopy()} disabled={!code}>
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? t("copied") : t("copy")}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleDownload} disabled={!code}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t("download")}
          </Button>
        </div>
      </div>
      <div
        className={cn("tp-code-editor-body", wrap && "tp-code-editor-body--wrap")}
        role="region"
        aria-label={label}
        dir="ltr"
      >
        {lines.map((line, index) => (
          <div className="tp-code-line" key={index}>
            <span className="tp-code-line-num" aria-hidden="true">{index + 1}</span>
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
