"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import { cn } from "@/lib/utils";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty, ToolField, selectClassName } from "../workspace-ui";

export type StorageSystem = "si" | "iec";
export type StorageUnit = "B" | "KB" | "MB" | "GB" | "TB" | "KiB" | "MiB" | "GiB" | "TiB";

export const STORAGE_UNITS: Record<StorageSystem, readonly StorageUnit[]> = {
  si: ["B", "KB", "MB", "GB", "TB"],
  iec: ["B", "KiB", "MiB", "GiB", "TiB"],
};

/** The unit itself defines the factor, so no ambiguous conversions are possible. */
const UNIT_FACTORS: Record<StorageUnit, number> = {
  B: 1,
  KB: 1000,
  MB: 1000 ** 2,
  GB: 1000 ** 3,
  TB: 1000 ** 4,
  KiB: 1024,
  MiB: 1024 ** 2,
  GiB: 1024 ** 3,
  TiB: 1024 ** 4,
};

/** Accept plain non-negative decimals; reject negatives and other text. */
export function parseStorageValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(?:\.\d+)?$/u.test(trimmed)) return null;

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

/** Pure SI (1000) / IEC (1024) byte conversion. */
export function convertStorage(
  value: number,
  from: StorageUnit,
  to: StorageUnit,
): number | null {
  if (!Number.isFinite(value) || value < 0) return null;

  const bytes = value * UNIT_FACTORS[from];
  if (!Number.isFinite(bytes)) return null;

  const converted = bytes / UNIT_FACTORS[to];
  return Number.isFinite(converted) ? converted : null;
}

export default function DataStorageConverter() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const locale = useLocale();

  const [system, setSystem] = useState<StorageSystem>("si");
  const [value, setValue] = useState("");
  const [from, setFrom] = useState<StorageUnit>("B");
  const [to, setTo] = useState<StorageUnit>("KB");
  const [error, setError] = useState("");

  const numeric = parseStorageValue(value);
  const converted = numeric === null ? null : convertStorage(numeric, from, to);

  const formatted = useMemo(() => {
    if (converted === null) return null;
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(converted);
  }, [converted, locale]);

  const unitOptions = useMemo(
    () => STORAGE_UNITS[system].map((unit) => ({ value: unit, label: unit })),
    [system],
  );

  const handleSystem = (next: StorageSystem) => {
    setSystem(next);
    setFrom("B");
    setTo(next === "si" ? "KB" : "KiB");
    setError("");
  };

  const handleValue = (raw: string) => {
    setValue(raw);
    setError(raw.trim() && parseStorageValue(raw) === null ? t("data-storage-converter.invalidValue") : "");
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSample = () => {
    setSystem("si");
    setValue("1.5");
    setFrom("GB");
    setTo("MB");
    setError("");
  };

  const handleReset = () => {
    setSystem("si");
    setValue("");
    setFrom("B");
    setTo("KB");
    setError("");
  };

  return (
    <WorkspaceLayout
      title={t("data-storage-converter.title")}
      icon="LayoutGrid"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={
        error ? t("statusError") : converted === null ? t("statusIdle") : t("statusReady")
      }
      input={
        <div className="flex flex-col gap-5">
          <ToolField label={t("data-storage-converter.system")}>
            <div
              role="group"
              aria-label={t("data-storage-converter.system")}
              className="grid grid-cols-2 gap-1 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--field-bg)] p-1"
            >
              {(["si", "iec"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={system === option}
                  onClick={() => handleSystem(option)}
                  className={cn(
                    "min-w-0 truncate rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]",
                    system === option
                      ? "bg-[var(--accent-fill)] text-[var(--on-accent)] shadow-[var(--soft-shadow)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
                  )}
                >
                  {t(`data-storage-converter.${option}`)}
                </button>
              ))}
            </div>
          </ToolField>

          <ToolField label={tu("value")} htmlFor="storage-value">
            <input
              id="storage-value"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={value}
              onChange={(event) => handleValue(event.target.value)}
              placeholder="1024"
              className={selectClassName}
              aria-invalid={Boolean(error)}
            />
          </ToolField>

          <div className="tp-convert-card grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <ToolField label={tu("from")}>
              <ThemedSelect
                value={from}
                onValueChange={(next) => {
                  setFrom(next as StorageUnit);
                  setError("");
                }}
                options={unitOptions}
                ariaLabel={tu("from")}
              />
            </ToolField>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="tp-swap-button"
              aria-label={tu("swap")}
              onClick={handleSwap}
            >
              <ArrowLeftRight aria-hidden="true" />
            </Button>

            <ToolField label={tu("to")}>
              <ThemedSelect
                value={to}
                onValueChange={(next) => {
                  setTo(next as StorageUnit);
                  setError("");
                }}
                options={unitOptions}
                ariaLabel={tu("to")}
              />
            </ToolField>
          </div>

          {error ? (
            <p role="alert" aria-live="assertive" className="tp-workspace-error">
              {error}
            </p>
          ) : null}
        </div>
      }
      output={
        formatted !== null ? (
          <div
            className="tp-result-card flex h-full min-w-0 flex-col justify-center gap-3 overflow-hidden"
            aria-live="polite"
          >
            <p className="break-words text-sm text-[var(--muted)] [overflow-wrap:anywhere]">
              {t("data-storage-converter.system")}: {t(system)} · {from} → {to}
            </p>
            <output className="block min-w-0 break-words font-sans text-base font-semibold leading-relaxed tabular-nums text-[var(--text)] [overflow-wrap:anywhere]">
              {formatted}
              <span className="ml-2 inline-block rounded-[99px] bg-[var(--surface)] px-2.5 py-1 text-sm font-semibold text-[var(--accent)]">
                {to}
              </span>
            </output>
            <CopyButton
              text={`${formatted} ${to}`}
              label={tu("copy")}
              copiedLabel={tu("copied")}
              className="self-start"
            />
          </div>
        ) : (
          <OutputEmpty message={t("resultEmpty")} className="min-h-[200px]" />
        )
      }
    />
  );
}
