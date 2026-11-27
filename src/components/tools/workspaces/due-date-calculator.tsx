"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import {
  CopyButton,
  DatePartsPicker,
  HeroValue,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateDueDate,
  formatDueDateReport,
  type DueDateErrorCode,
  type DueDateInput,
  type DueDateMethod,
  type MilestoneKey,
  type TransferDay,
} from "./due-date-calculator.logic";

const ERROR_ID = "due-date-calculator-error";

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function DueDateCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<{
    method: DueDateMethod;
    transferDay: string;
  }>("toolpika:due-date-calculator", { method: "lmp", transferDay: "5" });

  const [reference, setReference] = useState("");
  const [asOf, setAsOf] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAsOf(toDateString(new Date())));
    return () => cancelAnimationFrame(frame);
  }, []);

  const transferDay = Number(options.transferDay) as TransferDay;
  const input = useMemo<DueDateInput>(
    () => ({ method: options.method, reference, transferDay, asOf }),
    [options.method, transferDay, reference, asOf],
  );
  const calculation = useMemo(() => calculateDueDate(input), [input]);
  const value = calculation.value;

  const numberFmt = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    [locale],
  );
  const formatDate = useCallback(
    (raw: string) => dateFmt.format(new Date(`${raw}T00:00:00Z`)),
    [dateFmt],
  );

  const errorCode: DueDateErrorCode | undefined = calculation.error?.code;
  const errorText =
    errorCode === "MISSING_REFERENCE" || errorCode === "MISSING_AS_OF"
      ? `${tw("due-date-calculator.errorMissing")} ${tw("due-date-calculator.fixMissing")}`
      : errorCode === "INVALID_REFERENCE" || errorCode === "INVALID_AS_OF"
        ? `${tw("due-date-calculator.errorInvalid")} ${tw("due-date-calculator.fixInvalid")}`
        : errorCode === "ORDER"
          ? `${tw("due-date-calculator.errorOrder")} ${tw("due-date-calculator.fixOrder")}`
          : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = Boolean(value && !errorText);

  const milestoneLabels = useMemo<Record<MilestoneKey, string>>(
    () => ({
      firstTrimesterEnd: tw("due-date-calculator.milestoneFirstEnd"),
      midpoint: tw("due-date-calculator.milestoneMidpoint"),
      termStart: tw("due-date-calculator.milestoneTermStart"),
      termEnd: tw("due-date-calculator.milestoneTermEnd"),
    }),
    [tw],
  );

  const trimesterLabel = useMemo(() => {
    if (!value) return "";
    if (value.trimester === "first") return tw("due-date-calculator.trimesterFirst");
    if (value.trimester === "second") return tw("due-date-calculator.trimesterSecond");
    if (value.trimester === "third") return tw("due-date-calculator.trimesterThird");
    return tw("due-date-calculator.trimesterAfterDue");
  }, [value, tw]);

  const trimesterTone = useMemo(() => {
    if (!value) return "neutral" as const;
    if (value.trimester === "first") return "accent" as const;
    if (value.trimester === "second") return "success" as const;
    if (value.trimester === "third") return "warning" as const;
    return "danger" as const;
  }, [value]);

  const methodLabel = useCallback(
    (method: DueDateMethod) =>
      method === "lmp"
        ? tw("due-date-calculator.methodLmp")
        : method === "conception"
          ? tw("due-date-calculator.methodConception")
          : tw("due-date-calculator.methodIvf"),
    [tw],
  );

  const reportText = useMemo(() => {
    if (!ready || !value) return "";
    return formatDueDateReport(
      input,
      value,
      {
        title: tw("due-date-calculator.reportTitle"),
        method: tw("due-date-calculator.methodLabel"),
        reference: tw("due-date-calculator.referenceLabel"),
        asOf: tw("due-date-calculator.asOfLabel"),
        due: tw("due-date-calculator.heroLabel"),
        gestational: tw("due-date-calculator.gestationalLabel"),
        trimester: tw("due-date-calculator.trimesterLabel"),
        milestones: tw("due-date-calculator.milestoneTitle"),
        note: tw("due-date-calculator.note"),
      },
      methodLabel(input.method),
      trimesterLabel,
      milestoneLabels,
      formatDate,
    );
  }, [ready, value, input, tw, methodLabel, trimesterLabel, milestoneLabels, formatDate]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ method: "lmp", transferDay: "5" });
    setReference("2026-01-01");
    setAsOf(toDateString(new Date()));
  };
  const handleReset = () => {
    resetOptions();
    setReference("");
    setAsOf(toDateString(new Date()));
  };

  return (
    <ToolShell
      title={tw("due-date-calculator.title")}
      icon="CalendarDays"
      sampleLabel={tw("due-date-calculator.trySample")}
      resetLabel={tw("due-date-calculator.reset")}
      privacyLabel={tw("due-date-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-due-date-input-title"
          title={tw("due-date-calculator.inputTitle")}
          hint={tw("due-date-calculator.inputHint")}
        >
          <SegmentedControl<DueDateMethod>
            label={tw("due-date-calculator.methodLabel")}
            value={options.method}
            options={[
              { value: "lmp", label: tw("due-date-calculator.methodLmp") },
              { value: "conception", label: tw("due-date-calculator.methodConception") },
              { value: "ivf", label: tw("due-date-calculator.methodIvf") },
            ]}
            onChange={(next) => update({ method: next })}
          />

          <DatePartsPicker
            id="tp-due-date-reference"
            label={`${tw("due-date-calculator.referenceLabel")} (${methodLabel(options.method)})`}
            value={reference}
            onChange={setReference}
            locale={locale}
            hint={tw("due-date-calculator.referenceHint")}
            ariaDescribedBy={describedBy}
            minYear={2000}
            maxYear={2100}
          />
          <DatePartsPicker
            id="tp-due-date-as-of"
            label={tw("due-date-calculator.asOfLabel")}
            value={asOf}
            onChange={setAsOf}
            locale={locale}
            hint={tw("due-date-calculator.asOfHint")}
            ariaDescribedBy={describedBy}
            todayLabel={t("today")}
            onToday={() => setAsOf(toDateString(new Date()))}
            minYear={2000}
            maxYear={2100}
          />

          {options.method === "ivf" ? (
            <div className="tp-tool-group tp-tool-group--flush">
              <SegmentedControl<string>
                label={tw("due-date-calculator.transferDayLabel")}
                value={options.transferDay}
                options={[
                  { value: "2", label: tw("due-date-calculator.transferDay2") },
                  { value: "3", label: tw("due-date-calculator.transferDay3") },
                  { value: "5", label: tw("due-date-calculator.transferDay5") },
                ]}
                onChange={(next) => update({ transferDay: next })}
              />
              <p className="tp-tool-hint">{tw("due-date-calculator.transferDayHint")}</p>
            </div>
          ) : null}

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-due-date-result-title"
          title={t("result")}
          result
          actions={<CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />}
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<CalendarDays aria-hidden="true" />}
                title={errorText ? tw("due-date-calculator.errorTitle") : tw("due-date-calculator.emptyTitle")}
                hint={errorText ? tw("due-date-calculator.emptyErrorHint") : tw("due-date-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("due-date-calculator.heroLabel")}
                value={formatDate(value.dueDate)}
                note={`${tw("due-date-calculator.methodLabel")}: ${methodLabel(input.method)}`}
              />

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("due-date-calculator.gestationalLabel")}
                  value={`${numberFmt.format(value.gestationalWeeks)} ${tw("due-date-calculator.unitWeeks")} ${numberFmt.format(value.gestationalDays)} ${tw("due-date-calculator.unitDays")}`}
                />
                <Stat
                  label={tw("due-date-calculator.daysUntilLabel")}
                  value={`${numberFmt.format(value.daysUntilDue)} ${tw("due-date-calculator.unitDays")}`}
                />
                <Stat
                  label={tw("due-date-calculator.lmpEquivalentLabel")}
                  value={formatDate(value.lmpEquivalent)}
                />
              </dl>

              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-group-title">{tw("due-date-calculator.trimesterLabel")}</span>
                <ToolBadge tone={trimesterTone}>{trimesterLabel}</ToolBadge>
              </div>

              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-group-title">{tw("due-date-calculator.milestoneTitle")}</span>
                <div className="tp-tool-list">
                  {value.milestones.map((milestone) => (
                    <div className="tp-tool-row tp-tool-row-plain" key={milestone.key}>
                      <span>{milestoneLabels[milestone.key]}</span>
                      <span className="tp-tool-value" dir="ltr">{formatDate(milestone.date)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="tp-tool-hint">{tw("due-date-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
