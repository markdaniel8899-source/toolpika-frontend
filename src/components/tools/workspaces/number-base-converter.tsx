"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty, selectClassName, ToolField } from "../workspace-ui";

const SAMPLE = "255";

/** Keeps a single conversion well below a screen-filling string. */
const MAX_BITS = 1024;

export type Base = 2 | 8 | 10 | 16;

export interface BaseConversion {
  binary: string;
  octal: string;
  decimal: string;
  hexadecimal: string;
}

export type ConvertBaseResult =
  | { ok: true; value: bigint; outputs: BaseConversion }
  | { ok: false; reason: "invalidNumber" | "overflow" };

const BASES: readonly Base[] = [2, 8, 10, 16];

const DIGIT_PATTERNS: Record<Base, RegExp> = {
  2: /^[01]+$/u,
  8: /^[0-7]+$/u,
  10: /^[0-9]+$/u,
  16: /^[0-9a-f]+$/iu,
};

function formatBase(value: bigint, base: Base) {
  const negative = value < BigInt(0);
  const magnitude = negative ? -value : value;
  const digits = magnitude.toString(base);
  const text = base === 16 ? digits.toUpperCase() : digits;

  return negative ? `-${text}` : text;
}

/**
 * Pure: parse a signed integer from any of the four bases and convert it to
 * all of them. `0x`, `0b` and `0o` prefixes are case-insensitive and take
 * precedence over `fromBase`. BigInt keeps large values exact; anything over
 * MAX_BITS is reported as overflow instead of producing a huge string.
 */
export function convertBase(input: string, fromBase: Base): ConvertBaseResult {
  let text = input.trim();
  if (!text) return { ok: false, reason: "invalidNumber" };

  let negative = false;
  if (text.startsWith("-") || text.startsWith("+")) {
    negative = text.startsWith("-");
    text = text.slice(1);
  }

  let base = fromBase;
  const prefix = text.slice(0, 2).toLowerCase();
  if (prefix === "0x") {
    base = 16;
    text = text.slice(2);
  } else if (prefix === "0b") {
    base = 2;
    text = text.slice(2);
  } else if (prefix === "0o") {
    base = 8;
    text = text.slice(2);
  }

  if (!text || !DIGIT_PATTERNS[base].test(text)) {
    return { ok: false, reason: "invalidNumber" };
  }
  if (text.length > MAX_BITS) return { ok: false, reason: "overflow" };

  let magnitude = BigInt(0);
  for (const digit of text) {
    magnitude = magnitude * BigInt(base) + BigInt(parseInt(digit, base));
  }
  const value = negative ? -magnitude : magnitude;

  if (magnitude.toString(2).length > MAX_BITS) {
    return { ok: false, reason: "overflow" };
  }

  return {
    ok: true,
    value,
    outputs: {
      binary: formatBase(value, 2),
      octal: formatBase(value, 8),
      decimal: formatBase(value, 10),
      hexadecimal: formatBase(value, 16),
    },
  };
}

function BaseRow({
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
      <div className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
          {label}
        </span>
        <output className="mt-1 block break-all font-mono text-[13px] text-[var(--text)]">
          {value}
        </output>
      </div>
      <CopyButton text={value} label={copyLabel} copiedLabel={copiedLabel} />
    </div>
  );
}

export default function NumberBaseConverter() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const [value, setValue] = useState("");
  const [fromBase, setFromBase] = useState<Base>(10);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const baseLabels: Record<Base, string> = {
    2: t("number-base-converter.binary"),
    8: t("number-base-converter.octal"),
    10: t("number-base-converter.decimal"),
    16: t("number-base-converter.hexadecimal"),
  };

  const parsed = useMemo(() => convertBase(value, fromBase), [value, fromBase]);
  const hasInput = value.trim().length > 0;
  const error = !parsed.ok && hasInput ? parsed.reason : null;

  const handleSample = () => {
    setValue(SAMPLE);
    setFromBase(10);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setValue("");
    setFromBase(10);
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setValue(clip.trim());
        inputRef.current?.focus();
      }
    } catch {
      // Clipboard permission can be denied; the field stays editable.
    }
  };

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <WorkspaceLayout
      title={t("number-base-converter.title")}
      icon="LayoutGrid"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={
        error
          ? t("statusError")
          : parsed.ok && hasInput
            ? t("statusReady")
            : t("statusIdle")
      }
      input={
        <div className="flex flex-col gap-4">
          <ToolField label={tu("value")} htmlFor="number-base-value">
            <input
              id="number-base-value"
              ref={inputRef}
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="255, 0xFF, 0b11111111 or -42"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "number-base-error" : undefined}
              spellCheck={false}
              className="tp-field-input font-mono text-[13px]"
            />
          </ToolField>

          <ToolField label={tu("from")} htmlFor="number-base-from">
            <select
              id="number-base-from"
              value={fromBase}
              onChange={(event) => setFromBase(Number(event.target.value) as Base)}
              className={selectClassName}
            >
              {BASES.map((base) => (
                <option key={base} value={base}>
                  {baseLabels[base]}
                </option>
              ))}
            </select>
          </ToolField>

          {error ? (
            <p id="number-base-error" role="alert" className="tp-workspace-error">
              {error === "overflow"
                ? t("number-base-converter.overflow")
                : t("number-base-converter.invalidNumber")}
            </p>
          ) : null}

          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handlePaste()}
            >
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              {t("paste")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value}
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
        </div>
      }
      output={
        parsed.ok && hasInput ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <BaseRow
              label={t("number-base-converter.binary")}
              value={parsed.outputs.binary}
              copyLabel={tu("copy")}
              copiedLabel={tu("copied")}
            />
            <BaseRow
              label={t("number-base-converter.octal")}
              value={parsed.outputs.octal}
              copyLabel={tu("copy")}
              copiedLabel={tu("copied")}
            />
            <BaseRow
              label={t("number-base-converter.decimal")}
              value={parsed.outputs.decimal}
              copyLabel={tu("copy")}
              copiedLabel={tu("copied")}
            />
            <BaseRow
              label={t("number-base-converter.hexadecimal")}
              value={parsed.outputs.hexadecimal}
              copyLabel={tu("copy")}
              copiedLabel={tu("copied")}
            />
          </div>
        ) : (
          <OutputEmpty message={t("resultEmpty")} className="min-h-[200px]" />
        )
      }
    />
  );
}
