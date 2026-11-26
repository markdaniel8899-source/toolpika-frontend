"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock3 } from "lucide-react";
import {
  CopyButton,
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
} from "@/components/tools/workspace-ui";
import {
  analyzeCron,
  getNextRuns,
  type CronFieldError,
  type CronFieldKey,
  type CronFields,
  type DescriptionShape,
} from "./cron-expression-generator.logic";

const ERROR_ID = "tp-cron-error";

function makeFields(
  minute: string,
  hour: string,
  day: string,
  month: string,
  weekday: string,
): CronFields {
  return { minute, hour, day, month, weekday };
}

const SAMPLE = makeFields("0", "9", "*", "*", "1-5");
const EMPTY_FIELDS = makeFields("*", "*", "*", "*", "*");

const PRESET_DEFS = [
  { key: "presetEveryMinute", value: makeFields("*", "*", "*", "*", "*") },
  { key: "presetEveryFiveMinutes", value: makeFields("*/5", "*", "*", "*", "*") },
  { key: "presetHourly", value: makeFields("0", "*", "*", "*", "*") },
  { key: "presetDaily", value: makeFields("0", "9", "*", "*", "*") },
  { key: "presetWeekdays", value: makeFields("0", "9", "*", "*", "1-5") },
  { key: "presetWeekly", value: makeFields("0", "9", "*", "*", "1") },
  { key: "presetMonthly", value: makeFields("0", "9", "1", "*", "*") },
  { key: "presetYearly", value: makeFields("0", "9", "1", "1", "*") },
] as const;

const FIELD_META: ReadonlyArray<{
  key: CronFieldKey;
  labelKey: string;
  rangeKey: string;
  icon: string;
  badge: string;
}> = [
  { key: "minute", labelKey: "fieldMinute", rangeKey: "rangeMinute", icon: "⏱️", badge: "0-59" },
  { key: "hour", labelKey: "fieldHour", rangeKey: "rangeHour", icon: "🕘", badge: "0-23" },
  { key: "day", labelKey: "fieldDay", rangeKey: "rangeDay", icon: "📅", badge: "1-31" },
  { key: "month", labelKey: "fieldMonth", rangeKey: "rangeMonth", icon: "🗓️", badge: "1-12" },
  { key: "weekday", labelKey: "fieldWeekday", rangeKey: "rangeWeekday", icon: "🔁", badge: "0-7" },
];

function sameFields(a: CronFields, b: CronFields): boolean {
  return FIELD_META.every(({ key }) => a[key] === b[key]);
}

export default function CronExpressionGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [fields, setFields] = useState<CronFields>(SAMPLE);

  const activePreset = useMemo(
    () => PRESET_DEFS.find((preset) => sameFields(preset.value, fields))?.key ?? null,
    [fields],
  );

  const delayedFields = useDebounced(fields);
  const analysis = useMemo(() => analyzeCron(delayedFields), [delayedFields]);

  const errorText = useMemo(() => {
    if (!analysis.errorField || !analysis.errorCode) return "";
    const codeKey: Record<CronFieldError, string> = {
      EMPTY: "errorEmpty",
      INVALID_ITEM: "errorInvalidItem",
      OUT_OF_RANGE: "errorOutOfRange",
      REVERSED_RANGE: "errorReversedRange",
      INVALID_STEP: "errorInvalidStep",
      INVALID_NAME: "errorInvalidName",
    };
    return tw(`cron-expression-generator.errorField`, {
      field: tw(`cron-expression-generator.${fieldLabelKey(analysis.errorField)}`),
      reason: tw(`cron-expression-generator.${codeKey[analysis.errorCode]}`),
    });
  }, [analysis, tw]);

  const description = useMemo(() => {
    if (!analysis.valid || !analysis.description) return "";
    return formatDescription(analysis.description, tw);
  }, [analysis, tw]);

  const preview = useMemo(() => {
    if (!analysis.valid) return [];
    return getNextRuns(analysis, new Date(), 3);
  }, [analysis]);

  const timeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const reportText = useMemo(() => {
    if (!analysis.valid) return "";
    const lines = [
      tw("cron-expression-generator.copyExpression", { expression: analysis.expression }),
      tw("cron-expression-generator.copyExplanation", { explanation: description }),
      "",
      tw("cron-expression-generator.nextRunsLabel"),
      ...preview.map((date, index) =>
        tw("cron-expression-generator.copyRun", {
          number: index + 1,
          time: timeFormat.format(date),
        }),
      ),
    ];
    return lines.join("\n");
  }, [analysis, description, preview, timeFormat, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopy);

  const applyPreset = useCallback((next: CronFields) => {
    setFields(next);
  }, []);

  const handleSample = useCallback(() => applyPreset(SAMPLE), [applyPreset]);
  const handleReset = useCallback(() => applyPreset(EMPTY_FIELDS), [applyPreset]);

  const updateField = useCallback((key: CronFieldKey, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  }, []);

  return (
    <ToolShell
      title={tw("cron-expression-generator.title")}
      icon="Clock3"
      sampleLabel={tw("cron-expression-generator.trySample")}
      resetLabel={tw("cron-expression-generator.reset")}
      privacyLabel={tw("cron-expression-generator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-cron-input-title"
          title={tw("cron-expression-generator.inputTitle")}
          hint={tw("cron-expression-generator.inputHint")}
        >
          <div className="flex flex-col gap-5">
            <div className="tp-tool-group">
              <span className="tp-tool-label">{tw("cron-expression-generator.presetsLabel")}</span>
              <div className="tp-cron-presets" role="group" aria-label={tw("cron-expression-generator.presetsLabel")}>
                {PRESET_DEFS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    className="tp-cron-preset"
                    aria-pressed={activePreset === preset.key}
                    onClick={() => applyPreset(preset.value)}
                  >
                    {tw(`cron-expression-generator.${preset.key}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="tp-cron-fields">
              {FIELD_META.map((meta) => {
                const parsed = analysis.fields.find((field) => field.key === meta.key);
                const hasError = parsed?.error !== undefined;
                const inputId = `tp-cron-${meta.key}`;
                return (
                  <div key={meta.key} className="tp-cron-field-card">
                    <div className="tp-cron-field-head">
                      <div className="tp-cron-field-title">
                        <span className="tp-cron-field-icon" aria-hidden="true">{meta.icon}</span>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <label className="tp-cron-field-name" htmlFor={inputId}>
                            {tw(`cron-expression-generator.${meta.labelKey}`)}
                          </label>
                          <span className="tp-cron-field-range">
                            {tw(`cron-expression-generator.${meta.rangeKey}`)}
                          </span>
                        </div>
                      </div>
                      <span className="tp-cron-field-badge">{meta.badge}</span>
                    </div>
                    <input
                      id={inputId}
                      className="tp-tool-field"
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={fields[meta.key]}
                      aria-invalid={hasError || undefined}
                      aria-describedby={hasError ? ERROR_ID : undefined}
                      onChange={(event) => updateField(meta.key, event.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            {errorText ? (
              <p id={ERROR_ID} className="tp-tool-error" role="status" aria-live="polite">
                {errorText}
              </p>
            ) : null}
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-cron-result-title"
          title={tw("cron-expression-generator.validLabel")}
          hint={tw("cron-expression-generator.nextRunsHint")}
          result
          actions={
            analysis.valid ? (
              <>
                <CopyButton
                  text={reportText}
                  label={t("copy")}
                  copiedLabel={t("copied")}
                />
                <DownloadButton
                  content={reportText}
                  fileName={tw("cron-expression-generator.downloadExpression")}
                  label={t("download")}
                />
              </>
            ) : undefined
          }
        >
          {analysis.valid ? (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("cron-expression-generator.expressionLabel")}</span>
                <div className="tp-tool-url">
                  <code dir="ltr">{analysis.expression}</code>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("cron-expression-generator.explanationLabel")}</span>
                <p className="text-[14px] leading-6 text-[var(--text)]">{description}</p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-label">{tw("cron-expression-generator.nextRunsLabel")}</span>
                {preview.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {preview.map((date, index) => (
                      <li
                        key={date.toISOString()}
                        className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5"
                      >
                        <span className="inline-flex items-center gap-2 text-[13px] text-[var(--text)]">
                          <ToolBadge tone="accent">{index + 1}</ToolBadge>
                          <span dir="ltr">{timeFormat.format(date)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tp-tool-hint">{tw("cron-expression-generator.nextRunsHint")}</p>
                )}
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Clock3 aria-hidden="true" />}
                title={tw("cron-expression-generator.errorTitle")}
                hint={tw("cron-expression-generator.errorHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}

function fieldLabelKey(key: CronFieldKey): string {
  switch (key) {
    case "minute":
      return "fieldMinute";
    case "hour":
      return "fieldHour";
    case "day":
      return "fieldDay";
    case "month":
      return "fieldMonth";
    case "weekday":
      return "fieldWeekday";
  }
}

function formatDescription(
  desc: { shape: DescriptionShape; minutes: number[]; hours: number[]; days: number[]; months: number[]; weekdays: number[]; step?: number },
  tw: ReturnType<typeof useTranslations<"tools">>,
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(desc.hours[0] ?? 0)}:${pad(desc.minutes[0] ?? 0)}`;
  const join = (values: number[]) => values.join(", ");
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  switch (desc.shape) {
    case "everyMinute":
      return tw("cron-expression-generator.descEveryMinute");
    case "everyNMinutes":
      return tw("cron-expression-generator.descEveryNMinutes", { count: desc.step ?? 1 });
    case "hourly":
      return tw("cron-expression-generator.descHourly");
    case "dailyAt":
      return tw("cron-expression-generator.descDailyAt", { time });
    case "weeklyAt":
      return tw("cron-expression-generator.descWeeklyAt", {
        days: desc.weekdays.map((d) => weekdayNames[d] ?? String(d)).join(", "),
        time,
      });
    case "monthlyOn":
      return tw("cron-expression-generator.descMonthlyOn", { days: join(desc.days), time });
    case "yearlyOn":
      return tw("cron-expression-generator.descYearlyOn", {
        months: desc.months.map((m) => monthNames[m - 1] ?? String(m)).join(", "),
        days: join(desc.days),
        time,
      });
    case "custom":
    default:
      return tw("cron-expression-generator.descCustom", {
        minutes: join(desc.minutes),
        hours: join(desc.hours),
        days: join(desc.days),
        months: join(desc.months),
        weekdays: join(desc.weekdays),
      });
  }
}
