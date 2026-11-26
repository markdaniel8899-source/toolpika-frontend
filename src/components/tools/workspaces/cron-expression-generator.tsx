"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  ToolField,
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
  type CronAnalysis,
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

export default function CronExpressionGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [fields, setFields] = useState<CronFields>(SAMPLE);

  const delayedFields = useDebounced(fields);
  const analysis = useMemo<CronAnalysis>(
    () => analyzeCron(delayedFields),
    [delayedFields],
  );
  const runs = useMemo(
    () => (analysis.valid ? getNextRuns(analysis, new Date(), 3) : []),
    [analysis],
  );

  const fieldViews: {
    key: CronFieldKey;
    label: string;
    hint: string;
  }[] = [
    {
      key: "minute",
      label: tw("cron-expression-generator.fieldMinute"),
      hint: tw("cron-expression-generator.rangeMinute"),
    },
    {
      key: "hour",
      label: tw("cron-expression-generator.fieldHour"),
      hint: tw("cron-expression-generator.rangeHour"),
    },
    {
      key: "day",
      label: tw("cron-expression-generator.fieldDay"),
      hint: tw("cron-expression-generator.rangeDay"),
    },
    {
      key: "month",
      label: tw("cron-expression-generator.fieldMonth"),
      hint: tw("cron-expression-generator.rangeMonth"),
    },
    {
      key: "weekday",
      label: tw("cron-expression-generator.fieldWeekday"),
      hint: tw("cron-expression-generator.rangeWeekday"),
    },
  ];

  const presets: { label: string; values: CronFields }[] = [
    {
      label: tw("cron-expression-generator.presetEveryMinute"),
      values: makeFields("*", "*", "*", "*", "*"),
    },
    {
      label: tw("cron-expression-generator.presetEveryFiveMinutes"),
      values: makeFields("*/5", "*", "*", "*", "*"),
    },
    {
      label: tw("cron-expression-generator.presetHourly"),
      values: makeFields("0", "*", "*", "*", "*"),
    },
    {
      label: tw("cron-expression-generator.presetDaily"),
      values: makeFields("0", "9", "*", "*", "*"),
    },
    {
      label: tw("cron-expression-generator.presetWeekdays"),
      values: makeFields("0", "9", "*", "*", "1-5"),
    },
    {
      label: tw("cron-expression-generator.presetWeekly"),
      values: makeFields("0", "9", "*", "*", "1"),
    },
    {
      label: tw("cron-expression-generator.presetMonthly"),
      values: makeFields("0", "0", "1", "*", "*"),
    },
    {
      label: tw("cron-expression-generator.presetYearly"),
      values: makeFields("0", "0", "1", "1", "*"),
    },
  ];

  const errorMessages: Record<CronFieldError, string> = {
    EMPTY: tw("cron-expression-generator.errorEmpty"),
    INVALID_ITEM: tw("cron-expression-generator.errorInvalidItem"),
    OUT_OF_RANGE: tw("cron-expression-generator.errorOutOfRange"),
    REVERSED_RANGE: tw("cron-expression-generator.errorReversedRange"),
    INVALID_STEP: tw("cron-expression-generator.errorInvalidStep"),
    INVALID_NAME: tw("cron-expression-generator.errorInvalidName"),
  };

  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }),
    [locale],
  );
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }),
    [locale],
  );
  const runFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [locale],
  );

  const explanation = useMemo(() => {
    const plan = analysis.description;
    if (!plan) return "";

    const numbers = (values: number[]) => values.join(", ");
    const weekdays = (values: number[]) =>
      values
        .map((value) => weekdayFormatter.format(new Date(Date.UTC(2024, 0, 7 + value))))
        .join(", ");
    const months = (values: number[]) =>
      values
        .map((value) => monthFormatter.format(new Date(Date.UTC(2024, value - 1, 1))))
        .join(", ");
    const clock = (hour: number, minute: number) =>
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const time = clock(plan.hours[0] ?? 0, plan.minutes[0] ?? 0);

    const shapes: Record<DescriptionShape, string> = {
      everyMinute: tw("cron-expression-generator.descEveryMinute"),
      everyNMinutes: tw("cron-expression-generator.descEveryNMinutes", {
        count: plan.step ?? 1,
      }),
      hourly: tw("cron-expression-generator.descHourly"),
      dailyAt: tw("cron-expression-generator.descDailyAt", { time }),
      weeklyAt: tw("cron-expression-generator.descWeeklyAt", {
        days: weekdays(plan.weekdays),
        time,
      }),
      monthlyOn: tw("cron-expression-generator.descMonthlyOn", {
        days: numbers(plan.days),
        time,
      }),
      yearlyOn: tw("cron-expression-generator.descYearlyOn", {
        months: months(plan.months),
        days: numbers(plan.days),
        time,
      }),
      custom: tw("cron-expression-generator.descCustom", {
        minutes: numbers(plan.minutes),
        hours: numbers(plan.hours),
        days: numbers(plan.days),
        months: months(plan.months),
        weekdays: weekdays(plan.weekdays),
      }),
    };

    return shapes[plan.shape];
  }, [analysis, monthFormatter, tw, weekdayFormatter]);

  const resultText = useMemo(() => {
    if (!analysis.valid) return "";
    const lines = [
      tw("cron-expression-generator.copyExpression", {
        expression: analysis.expression,
      }),
      tw("cron-expression-generator.copyExplanation", { explanation }),
      ...runs.map((run, index) =>
        tw("cron-expression-generator.copyRun", {
          number: index + 1,
          time: runFormatter.format(run),
        }),
      ),
    ];
    return lines.join("\n");
  }, [analysis, explanation, runFormatter, runs, tw]);

  const handleShortcutCopy = useCallback(() => {
    if (!resultText) return;
    void navigator.clipboard.writeText(resultText).catch(() => undefined);
  }, [resultText]);
  useCopyShortcut(handleShortcutCopy);

  const handleFieldChange = (key: CronFieldKey, value: string) => {
    setFields((previous) => ({ ...previous, [key]: value }));
  };

  const errorMessage =
    analysis.errorField && analysis.errorCode
      ? tw("cron-expression-generator.errorField", {
          field: fieldViews.find((view) => view.key === analysis.errorField)?.label ?? "",
          reason: errorMessages[analysis.errorCode],
        })
      : "";

  return (
    <ToolShell
      title={tw("cron-expression-generator.title")}
      icon="Clock"
      sampleLabel={tw("cron-expression-generator.trySample")}
      resetLabel={tw("cron-expression-generator.reset")}
      privacyLabel={tw("cron-expression-generator.privacyRibbon")}
      onSample={() => setFields(SAMPLE)}
      onReset={() => setFields(EMPTY_FIELDS)}
      input={
        <ToolPane
          id="tp-cron-input-title"
          title={tw("cron-expression-generator.inputTitle")}
          hint={tw("cron-expression-generator.inputHint")}
        >
          {fieldViews.map((view) => (
            <ToolField
              key={view.key}
              label={view.label}
              htmlFor={`tp-cron-${view.key}`}
              hint={view.hint}
            >
              <input
                id={`tp-cron-${view.key}`}
                className="tp-tool-field"
                type="text"
                inputMode="text"
                dir="ltr"
                spellCheck={false}
                autoComplete="off"
                value={fields[view.key]}
                onChange={(event) => handleFieldChange(view.key, event.target.value)}
                aria-invalid={analysis.errorField === view.key}
                aria-describedby={
                  analysis.errorField === view.key ? ERROR_ID : undefined
                }
              />
            </ToolField>
          ))}

          <div className="tp-tool-group">
            <p className="tp-tool-label">
              {tw("cron-expression-generator.presetsLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFields(preset.values)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-cron-result-title"
          title={t("result")}
          result
          actions={
            <>
              {analysis.valid ? (
                <ToolBadge tone="success">
                  {tw("cron-expression-generator.validLabel")}
                </ToolBadge>
              ) : null}
              <CopyButton
                text={resultText}
                label={tw("cron-expression-generator.copyButton")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={resultText}
                fileName="cron-expression.txt"
                label={tw("cron-expression-generator.downloadExpression")}
              />
            </>
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            {!analysis.valid ? (
              <>
                <p id={ERROR_ID} className="tp-tool-error" role="alert">
                  {errorMessage}
                </p>
                <ToolEmpty
                  icon={<Clock3 aria-hidden="true" />}
                  title={tw("cron-expression-generator.errorTitle")}
                  hint={tw("cron-expression-generator.errorHint")}
                />
              </>
            ) : (
              <>
                <p className="tp-tool-label">
                  {tw("cron-expression-generator.expressionLabel")}
                </p>
                <output
                  dir="ltr"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "16px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "var(--surface)",
                    color: "var(--accent)",
                    textAlign: "center",
                    fontFamily: "var(--font-mono, ui-monospace, monospace)",
                    fontSize: "clamp(18px, 3.4vw, 28px)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    overflowWrap: "anywhere",
                  }}
                >
                  {analysis.expression}
                </output>

                <div className="tp-tool-group">
                  <p className="tp-tool-label">
                    {tw("cron-expression-generator.explanationLabel")}
                  </p>
                  <p className="tp-tool-hint">{explanation}</p>
                </div>

                <div className="tp-tool-group">
                  <p className="tp-tool-label">
                    {tw("cron-expression-generator.nextRunsLabel")}
                  </p>
                  <p className="tp-tool-hint">
                    {tw("cron-expression-generator.nextRunsHint")}
                  </p>
                  <ol className="m-0 flex list-decimal flex-col gap-1 pl-5">
                    {runs.map((run, index) => (
                      <li key={run.toISOString()} className="tp-tool-hint">
                        {tw("cron-expression-generator.copyRun", {
                          number: index + 1,
                          time: runFormatter.format(run),
                        })}
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
