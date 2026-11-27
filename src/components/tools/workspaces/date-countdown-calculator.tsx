"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import {
  CheckboxRow,
  CopyButton,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateDateCountdown,
  formatDateReport,
  toDateString,
  type DateErrorCode,
  type DateMode,
} from "./date-countdown-calculator.logic";

const ERROR_ID = "tp-date-countdown-error";

const SAMPLE = {
  start: "2026-01-15",
  target: "2026-11-27",
  another: "2026-06-01",
};

export default function DateCountdownCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<{
    mode: DateMode;
    inclusive: boolean;
  }>("toolpika:date-countdown-calculator", { mode: "days", inclusive: false });
  const mode = options.mode;
  const inclusive = options.inclusive;

  const [start, setStart] = useState("");
  const [target, setTarget] = useState("");
  const [another, setAnother] = useState("");

  // "Today" is filled after hydration so server and client markup agree.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnother(toDateString(new Date())));
    return () => cancelAnimationFrame(frame);
  }, []);

  const input = useMemo(
    () => ({ start, target, another, mode, inclusive }),
    [start, target, another, mode, inclusive],
  );
  const calculation = useMemo(() => calculateDateCountdown(input), [input]);
  const value = calculation.value;

  const errorCode: DateErrorCode | undefined = calculation.error?.code;
  const errorText =
    errorCode === "MISSING_START" || errorCode === "MISSING_TARGET"
      ? `${tw("date-countdown-calculator.errorMissing")} ${tw("date-countdown-calculator.fixMissing")}`
      : errorCode === "INVALID_START" ||
          errorCode === "INVALID_TARGET" ||
          errorCode === "INVALID_ANOTHER"
        ? `${tw("date-countdown-calculator.errorInvalid")} ${tw("date-countdown-calculator.fixInvalid")}`
        : errorCode === "ORDER"
          ? `${tw("date-countdown-calculator.errorOrder")} ${tw("date-countdown-calculator.fixOrder")}`
          : "";
  const ready = Boolean(value && !errorText);
  const describedBy = errorText ? ERROR_ID : undefined;

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const modeLabel = useCallback(
    (next: DateMode) =>
      next === "days"
        ? tw("date-countdown-calculator.modeDays")
        : next === "weeks"
          ? tw("date-countdown-calculator.modeWeeks")
          : next === "months"
            ? tw("date-countdown-calculator.modeMonths")
            : tw("date-countdown-calculator.modeCountdown"),
    [tw],
  );

  const heroText = useMemo(() => {
    if (!ready || !value) return "";
    const tail = (count: number, unit: string) =>
      count > 0 ? ` ${nf.format(count)} ${unit}` : "";
    if (mode === "days") {
      return `${nf.format(value.totalDays)} ${tw("date-countdown-calculator.unitDays")}`;
    }
    if (mode === "weeks") {
      return `${nf.format(value.totalWeeks)} ${tw("date-countdown-calculator.unitWeeks")}${tail(value.totalWeekDays, tw("date-countdown-calculator.unitDays"))}`;
    }
    if (mode === "months") {
      const totalMonths = value.years * 12 + value.months;
      return `${nf.format(totalMonths)} ${tw("date-countdown-calculator.unitMonths")}${tail(value.monthRemainder, tw("date-countdown-calculator.unitDays"))}`;
    }
    return [
      `${nf.format(value.years)} ${tw("date-countdown-calculator.unitYearShort")}`,
      `${nf.format(value.months)} ${tw("date-countdown-calculator.unitMonthShort")}`,
      `${nf.format(value.weeks)} ${tw("date-countdown-calculator.unitWeekShort")}`,
      `${nf.format(value.days)} ${tw("date-countdown-calculator.unitDayShort")}`,
    ].join(" ");
  }, [ready, value, mode, nf, tw]);

  const heroLabel =
    mode === "days"
      ? tw("date-countdown-calculator.heroDaysLabel")
      : mode === "weeks"
        ? tw("date-countdown-calculator.heroWeeksLabel")
        : mode === "months"
          ? tw("date-countdown-calculator.heroMonthsLabel")
          : tw("date-countdown-calculator.heroCountdownLabel");

  const chainText = useMemo(() => {
    if (!ready || !value) return "";
    return [
      start,
      `+${nf.format(value.years)} ${tw("date-countdown-calculator.unitYearShort")}`,
      `+${nf.format(value.months)} ${tw("date-countdown-calculator.unitMonthShort")}`,
      `+${nf.format(value.weeks)} ${tw("date-countdown-calculator.unitWeekShort")}`,
      `+${nf.format(value.days)} ${tw("date-countdown-calculator.unitDayShort")}`,
      `= ${target}`,
    ].join(" ");
  }, [ready, value, start, target, nf, tw]);

  const reportText = useMemo(() => {
    if (!ready || !value) return "";
    return formatDateReport(
      input,
      value,
      {
        title: tw("date-countdown-calculator.reportTitle"),
        start: tw("date-countdown-calculator.reportStart"),
        target: tw("date-countdown-calculator.reportTarget"),
        another: tw("date-countdown-calculator.reportAnother"),
        mode: tw("date-countdown-calculator.reportMode"),
        counting: tw("date-countdown-calculator.reportCounting"),
        inclusive: tw("date-countdown-calculator.reportInclusive"),
        exclusive: tw("date-countdown-calculator.reportExclusive"),
        total: tw("date-countdown-calculator.reportTotal"),
        breakdown: tw("date-countdown-calculator.reportBreakdown"),
        comparison: tw("date-countdown-calculator.reportComparison"),
        note: tw("date-countdown-calculator.note"),
        years: tw("date-countdown-calculator.unitYears"),
        months: tw("date-countdown-calculator.unitMonths"),
        weeks: tw("date-countdown-calculator.unitWeeks"),
        days: tw("date-countdown-calculator.unitDays"),
      },
      modeLabel(mode),
      heroText,
    );
  }, [ready, value, input, tw, modeLabel, mode, heroText]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ mode: "days", inclusive: false });
    setStart(SAMPLE.start);
    setTarget(SAMPLE.target);
    setAnother(SAMPLE.another);
  };

  const handleReset = () => {
    resetOptions();
    setStart("");
    setTarget("");
    setAnother(toDateString(new Date()));
  };

  return (
    <ToolShell
      title={tw("date-countdown-calculator.title")}
      icon="Clock"
      sampleLabel={tw("date-countdown-calculator.trySample")}
      resetLabel={tw("date-countdown-calculator.reset")}
      privacyLabel={tw("date-countdown-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-date-countdown-input-title"
          title={tw("date-countdown-calculator.inputTitle")}
          hint={tw("date-countdown-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("date-countdown-calculator.startLabel")}
              htmlFor="tp-date-countdown-start"
              hint={tw("date-countdown-calculator.startHint")}
            >
              <input
                id="tp-date-countdown-start"
                type="date"
                className="tp-field-input"
                value={start}
                aria-label={tw("date-countdown-calculator.startLabel")}
                aria-describedby={describedBy}
                onChange={(event) => setStart(event.target.value)}
              />
            </ToolField>

            <ToolField
              label={tw("date-countdown-calculator.targetLabel")}
              htmlFor="tp-date-countdown-target"
              hint={tw("date-countdown-calculator.targetHint")}
            >
              <input
                id="tp-date-countdown-target"
                type="date"
                className="tp-field-input"
                value={target}
                aria-label={tw("date-countdown-calculator.targetLabel")}
                aria-describedby={describedBy}
                onChange={(event) => setTarget(event.target.value)}
              />
            </ToolField>
          </div>

          <ToolField
            label={tw("date-countdown-calculator.anotherLabel")}
            htmlFor="tp-date-countdown-another"
            hint={tw("date-countdown-calculator.anotherHint")}
          >
            <input
              id="tp-date-countdown-another"
              type="date"
              className="tp-field-input"
              value={another}
              aria-label={tw("date-countdown-calculator.anotherLabel")}
              aria-describedby={describedBy}
              onChange={(event) => setAnother(event.target.value)}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<DateMode>
              label={tw("date-countdown-calculator.modeLabel")}
              value={mode}
              options={[
                { value: "days", label: tw("date-countdown-calculator.modeDays") },
                { value: "weeks", label: tw("date-countdown-calculator.modeWeeks") },
                { value: "months", label: tw("date-countdown-calculator.modeMonths") },
                { value: "countdown", label: tw("date-countdown-calculator.modeCountdown") },
              ]}
              onChange={(next) => update({ mode: next })}
            />
            <CheckboxRow
              id="tp-date-countdown-inclusive"
              label={tw("date-countdown-calculator.inclusiveLabel")}
              checked={inclusive}
              onChange={(checked) => update({ inclusive: checked })}
            />
            <p className="tp-tool-hint">{tw("date-countdown-calculator.inclusiveHint")}</p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-date-countdown-result-title"
          title={t("result")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Clock aria-hidden="true" />}
                title={
                  errorText
                    ? tw("date-countdown-calculator.errorTitle")
                    : tw("date-countdown-calculator.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("date-countdown-calculator.emptyErrorHint")
                    : tw("date-countdown-calculator.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{heroLabel}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {heroText}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("date-countdown-calculator.totalDaysLabel")}
                  value={`${nf.format(value.totalDays)} ${tw("date-countdown-calculator.unitDays")}`}
                />
                <Stat
                  label={tw("date-countdown-calculator.wholeWeeksLabel")}
                  value={`${nf.format(value.totalWeeks)} ${tw("date-countdown-calculator.unitWeeks")} + ${nf.format(value.totalWeekDays)} ${tw("date-countdown-calculator.unitDays")}`}
                />
                <Stat
                  label={tw("date-countdown-calculator.calendarMonthsLabel")}
                  value={`${nf.format(value.years * 12 + value.months)} ${tw("date-countdown-calculator.unitMonths")} + ${nf.format(value.monthRemainder)} ${tw("date-countdown-calculator.unitDays")}`}
                />
                <Stat
                  label={tw("date-countdown-calculator.yearsLabel")}
                  value={`${nf.format(value.years)} ${tw("date-countdown-calculator.unitYears")}`}
                />
                <Stat
                  label={tw("date-countdown-calculator.comparisonLabel")}
                  value={`${nf.format(value.comparisonDays)} ${tw("date-countdown-calculator.unitDays")}`}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("date-countdown-calculator.breakdownTitle")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{chainText}</code>
                </div>
              </div>

              <p className="tp-tool-hint">{tw("date-countdown-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
