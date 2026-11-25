"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
            <div role="group" aria-label={t("data-storage-converter.system")} className="grid grid-cols-2 gap-2">
              {(["si", "iec"] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={system === option ? "default" : "secondary"}
                  aria-pressed={system === option}
                  onClick={() => handleSystem(option)}
                >
                  {t(`data-storage-converter.${option}`)}
                </Button>
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
              <select
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value as StorageUnit);
                  setError("");
                }}
                className={selectClassName}
                aria-label={tu("from")}
              >
                {STORAGE_UNITS[system].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
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
              <select
                value={to}
                onChange={(event) => {
                  setTo(event.target.value as StorageUnit);
                  setError("");
                }}
                className={selectClassName}
                aria-label={tu("to")}
              >
                {STORAGE_UNITS[system].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
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
            className="tp-result-card flex h-full flex-col justify-center gap-3"
            aria-live="polite"
          >
            <p className="text-sm text-[var(--muted)]">
              {t("data-storage-converter.system")}: {t(system)} · {from} → {to}
            </p>
            <output className="break-words font-sans text-[40px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {formatted}
              <span className="tp-unit-chip">{to}</span>
            </output>
            <CopyButton
              text={`${formatted} ${to}`}
              label={tu("copy")}
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
