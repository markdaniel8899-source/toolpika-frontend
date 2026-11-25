"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty, ToolField, selectClassName } from "../workspace-ui";

export type TimestampUnit = "seconds" | "milliseconds";

/** JS Date supports ±8.64e15 ms from the epoch. */
const MAX_DATE_MS = 8.64e15;
/** Seconds are ~1e9 today, milliseconds ~1e12; 1e11 separates the two ranges. */
const AUTO_DETECT_THRESHOLD = 1e11;
const SAMPLE_MS = Date.UTC(2026, 0, 15, 12, 30, 45, 123);
const DATETIME_LOCAL =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/u;

/** Guess the unit from magnitude so a pasted timestamp just works. */
export function detectTimestampUnit(raw: string): TimestampUnit {
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return "seconds";
  return Math.abs(numeric) >= AUTO_DETECT_THRESHOLD ? "milliseconds" : "seconds";
}

/** Parse a Unix timestamp into epoch milliseconds, or null when unusable. */
export function parseTimestamp(raw: string, unit: TimestampUnit): number | null {
  const trimmed = raw.trim();
  if (!/^-?\d+(?:\.\d+)?$/u.test(trimmed)) return null;

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;

  const milliseconds = unit === "milliseconds" ? numeric : numeric * 1000;
  if (!Number.isFinite(milliseconds) || Math.abs(milliseconds) > MAX_DATE_MS) return null;

  // Precision is limited to whole milliseconds; anything finer is truncated.
  const truncated = Math.trunc(milliseconds);
  return Number.isNaN(new Date(truncated).getTime()) ? null : truncated;
}

/** Plain, parseable digits for the editable field (not locale-formatted). */
export function toTimestampInput(milliseconds: number, unit: TimestampUnit): string {
  return String(unit === "milliseconds" ? milliseconds : milliseconds / 1000);
}

/** Format a point in time for datetime-local, using the browser's local zone. */
export function toDateTimeLocal(milliseconds: number): string {
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 0) return "";

  const pad = (part: number, length = 2) => String(part).padStart(length, "0");
  const datePart = [
    pad(date.getFullYear(), 4),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
  return `${datePart}T${timePart}`;
}

/** Parse a datetime-local value into epoch milliseconds, rejecting invalid dates. */
export function parseDateTimeLocal(value: string): number | null {
  const match = DATETIME_LOCAL.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = "0", fractionText = ""] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const millisecond = Number(`${fractionText}000`.slice(0, 3));

  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, second, millisecond);

  // Round-trip check rejects values such as 2026-02-30 or 25:00 that roll over.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second ||
    date.getMilliseconds() !== millisecond
  ) {
    return null;
  }

  const result = date.getTime();
  return Number.isNaN(result) || Math.abs(result) > MAX_DATE_MS ? null : result;
}

/** Pure, locale-aware formatting in UTC and the browser's local zone. */
export function formatTimestamp(milliseconds: number, locale: string) {
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid timestamp");

  const options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "long" };
  return {
    utc: new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(date),
    local: new Intl.DateTimeFormat(locale, options).format(date),
    iso: date.toISOString(),
  };
}

export default function TimestampConverter() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const locale = useLocale();

  const [timestampInput, setTimestampInput] = useState("");
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [unitOverride, setUnitOverride] = useState<TimestampUnit | null>(null);
  const [milliseconds, setMilliseconds] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Auto-detect stays active until the visitor explicitly picks a unit.
  const unit = unitOverride ?? detectTimestampUnit(timestampInput);

  const outputs = useMemo(() => {
    if (milliseconds === null) return [];

    const formatted = formatTimestamp(milliseconds, locale);
    return [
      { id: "utc", label: t("timestamp-converter.utc"), value: formatted.utc },
      { id: "local", label: t("timestamp-converter.local"), value: formatted.local },
      { id: "iso", label: t("timestamp-converter.iso"), value: formatted.iso },
      {
        id: "seconds",
        label: t("timestamp-converter.seconds"),
        value: new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(
          milliseconds / 1000,
        ),
      },
      {
        id: "milliseconds",
        label: t("timestamp-converter.milliseconds"),
        value: new Intl.NumberFormat(locale).format(milliseconds),
      },
    ];
  }, [locale, milliseconds, t]);

  const handleTimestampChange = (raw: string) => {
    setTimestampInput(raw);
    setError("");

    if (!raw.trim()) {
      setMilliseconds(null);
      setDateTimeInput("");
      return;
    }

    const parsed = parseTimestamp(raw, unitOverride ?? detectTimestampUnit(raw));
    if (parsed === null) {
      setMilliseconds(null);
      setDateTimeInput("");
      setError(t("timestamp-converter.invalidTimestamp"));
      return;
    }

    setMilliseconds(parsed);
    setDateTimeInput(toDateTimeLocal(parsed));
  };

  const handleDateTimeChange = (raw: string) => {
    setDateTimeInput(raw);
    setError("");

    if (!raw) {
      setMilliseconds(null);
      setTimestampInput("");
      return;
    }

    const parsed = parseDateTimeLocal(raw);
    if (parsed === null) {
      setMilliseconds(null);
      setTimestampInput("");
      setError(t("timestamp-converter.invalidTimestamp"));
      return;
    }

    setMilliseconds(parsed);
    setTimestampInput(toTimestampInput(parsed, unit));
  };

  const handleUnitChange = (next: TimestampUnit) => {
    setUnitOverride(next);
    setError("");
    if (milliseconds !== null) setTimestampInput(toTimestampInput(milliseconds, next));
  };

  const handleNow = () => {
    const now = Date.now();
    setMilliseconds(now);
    setTimestampInput(toTimestampInput(now, unit));
    setDateTimeInput(toDateTimeLocal(now));
    setError("");
  };

  const handleSample = () => {
    setUnitOverride(null);
    setMilliseconds(SAMPLE_MS);
    setTimestampInput(toTimestampInput(SAMPLE_MS, "milliseconds"));
    setDateTimeInput(toDateTimeLocal(SAMPLE_MS));
    setError("");
  };

  const handleReset = () => {
    setTimestampInput("");
    setDateTimeInput("");
    setUnitOverride(null);
    setMilliseconds(null);
    setError("");
  };

  return (
    <WorkspaceLayout
      title={t("timestamp-converter.title")}
      icon="Activity"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={
        error ? t("statusError") : milliseconds === null ? t("statusIdle") : t("statusReady")
      }
      input={
        <div className="flex flex-col gap-5">
          <ToolField
            label={tu("value")}
            htmlFor="timestamp-value"
            hint={`${t("timestamp-converter.seconds")} · ${t("timestamp-converter.milliseconds")}`}
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
              <input
                id="timestamp-value"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                value={timestampInput}
                onChange={(event) => handleTimestampChange(event.target.value)}
                placeholder="1767225600"
                className={selectClassName}
                aria-invalid={Boolean(error)}
              />
              <select
                value={unit}
                onChange={(event) => handleUnitChange(event.target.value as TimestampUnit)}
                className={selectClassName}
                aria-label={tu("value")}
              >
                <option value="seconds">{t("timestamp-converter.seconds")}</option>
                <option value="milliseconds">{t("timestamp-converter.milliseconds")}</option>
              </select>
            </div>
          </ToolField>

          <ToolField label={t("timestamp-converter.dateTime")} htmlFor="timestamp-datetime">
            <input
              id="timestamp-datetime"
              type="datetime-local"
              value={dateTimeInput}
              onChange={(event) => handleDateTimeChange(event.target.value)}
              className={selectClassName}
              aria-invalid={Boolean(error)}
            />
          </ToolField>

          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <Button type="button" variant="ghost" size="sm" onClick={handleNow}>
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t("timestamp-converter.useNow")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!timestampInput && !dateTimeInput}
              onClick={handleReset}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>

          {error ? (
            <p role="alert" aria-live="assertive" className="tp-workspace-error">
              {error}
            </p>
          ) : null}
        </div>
      }
      output={
        outputs.length ? (
          <div aria-live="polite">
            <dl className="tp-stats">
              {outputs.map((output) => (
                <div key={output.id} className="tp-stat">
                  <dt className="tp-stat-label">{output.label}</dt>
                  <dd className="tp-stat-value whitespace-normal break-words font-mono text-[13px] leading-[1.5]">
                    {output.value}
                  </dd>
                  <CopyButton
                    text={output.value}
                    label={tu("copy")}
                    copiedLabel={tu("copied")}
                    className="mt-3"
                  />
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <OutputEmpty message={t("resultEmpty")} className="min-h-[200px]" />
        )
      }
    />
  );
}
