"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateFreelanceRate,
  DEFAULTS,
  TAX_LIMIT,
} from "./freelance-rate-calculator.logic";

const ERROR_ID = "tp-freelance-rate-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function FreelanceRateCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [income, setIncome] = useState("");
  const [weeks, setWeeks] = useState("");
  const [hoursWeek, setHoursWeek] = useState("");
  const [daysWeek, setDaysWeek] = useState("");
  const [expenses, setExpenses] = useState("");
  const [tax, setTax] = useState("");
  const [projectHours, setProjectHours] = useState("");

  const rawValues = [income, weeks, hoursWeek, daysWeek, expenses, tax, projectHours];
  const parsed = rawValues.map(parseValue);
  const hasValues = rawValues.every((value) => value.trim() !== "");
  const invalid = rawValues.some(
    (value) => value.trim() !== "" && parseValue(value) === null,
  );

  const calculation = useMemo(
    () =>
      parsed.every((value) => value !== null)
        ? calculateFreelanceRate({
            targetNetIncome: parsed[0] as number,
            billableWeeks: parsed[1] as number,
            billableHoursPerWeek: parsed[2] as number,
            billableDaysPerWeek: parsed[3] as number,
            annualExpenses: parsed[4] as number,
            taxBufferPercent: parsed[5] as number,
            hoursPerProject: parsed[6] as number,
          })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [income, weeks, hoursWeek, daysWeek, expenses, tax, projectHours],
  );

  const errorCode = calculation?.error?.code;
  const errorText = invalid || errorCode === "INVALID_NUMBER"
    ? `${tw("freelance-rate-calculator.errorInvalid")} ${tw("freelance-rate-calculator.fixInvalid")}`
    : errorCode === "ZERO_TIME"
      ? `${tw("freelance-rate-calculator.errorZero")} ${tw("freelance-rate-calculator.fixZero")}`
      : errorCode === "TAX_RANGE"
        ? `${tw("freelance-rate-calculator.errorTax")} ${tw("freelance-rate-calculator.fixTax")}`
        : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = hasValues && !!calculation && !calculation.error && !invalid;

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }),
    [locale],
  );
  const number = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation) return "";
    return [
      tw("freelance-rate-calculator.summaryLabel"),
      `${tw("freelance-rate-calculator.heroLabel")}: ${money.format(calculation.hourlyRate)}`,
      `${tw("freelance-rate-calculator.dailyLabel")}: ${money.format(calculation.dailyRate)}`,
      `${tw("freelance-rate-calculator.projectLabel")}: ${money.format(calculation.projectRate)}`,
      `${tw("freelance-rate-calculator.grossLabel")}: ${money.format(calculation.grossRevenue)}`,
      `${tw("freelance-rate-calculator.hoursLabel")}: ${number.format(calculation.billableHours)}`,
      "",
      tw("freelance-rate-calculator.formula"),
    ].join("\n");
  }, [ready, calculation, money, number, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setIncome(String(DEFAULTS.targetNetIncome));
    setWeeks(String(DEFAULTS.billableWeeks));
    setHoursWeek(String(DEFAULTS.billableHoursPerWeek));
    setDaysWeek(String(DEFAULTS.billableDaysPerWeek));
    setExpenses(String(DEFAULTS.annualExpenses));
    setTax(String(DEFAULTS.taxBufferPercent));
    setProjectHours(String(DEFAULTS.hoursPerProject));
  };

  const handleReset = () => {
    setIncome("");
    setWeeks("");
    setHoursWeek("");
    setDaysWeek("");
    setExpenses("");
    setTax("");
    setProjectHours("");
  };

  const stepperProps = {
    min: 0,
    step: 1,
    inputMode: "decimal" as const,
    increaseLabel: t("stepUp"),
    decreaseLabel: t("stepDown"),
    describedBy,
  };

  return (
    <ToolShell
      title={tw("freelance-rate-calculator.title")}
      icon="Calculator"
      sampleLabel={tw("freelance-rate-calculator.trySample")}
      resetLabel={tw("freelance-rate-calculator.reset")}
      privacyLabel={tw("freelance-rate-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-freelance-rate-input-title"
          title={tw("freelance-rate-calculator.inputTitle")}
          hint={tw("freelance-rate-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("freelance-rate-calculator.incomeLabel")}
              htmlFor="tp-freelance-income"
              hint={tw("freelance-rate-calculator.incomeHint")}
            >
              <NumberStepper
                id="tp-freelance-income"
                value={income}
                ariaLabel={tw("freelance-rate-calculator.incomeLabel")}
                onValueChange={setIncome}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("freelance-rate-calculator.weeksLabel")}
              htmlFor="tp-freelance-weeks"
              hint={tw("freelance-rate-calculator.weeksHint")}
            >
              <NumberStepper
                id="tp-freelance-weeks"
                value={weeks}
                ariaLabel={tw("freelance-rate-calculator.weeksLabel")}
                onValueChange={setWeeks}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("freelance-rate-calculator.hoursWeekLabel")}
              htmlFor="tp-freelance-hours-week"
              hint={tw("freelance-rate-calculator.hoursWeekHint")}
            >
              <NumberStepper
                id="tp-freelance-hours-week"
                value={hoursWeek}
                ariaLabel={tw("freelance-rate-calculator.hoursWeekLabel")}
                onValueChange={setHoursWeek}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("freelance-rate-calculator.daysWeekLabel")}
              htmlFor="tp-freelance-days-week"
              hint={tw("freelance-rate-calculator.daysWeekHint")}
            >
              <NumberStepper
                id="tp-freelance-days-week"
                value={daysWeek}
                ariaLabel={tw("freelance-rate-calculator.daysWeekLabel")}
                onValueChange={setDaysWeek}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("freelance-rate-calculator.expensesLabel")}
              htmlFor="tp-freelance-expenses"
              hint={tw("freelance-rate-calculator.expensesHint")}
            >
              <NumberStepper
                id="tp-freelance-expenses"
                value={expenses}
                ariaLabel={tw("freelance-rate-calculator.expensesLabel")}
                onValueChange={setExpenses}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("freelance-rate-calculator.taxLabel")}
              htmlFor="tp-freelance-tax"
              hint={tw("freelance-rate-calculator.taxHint")}
            >
              <NumberStepper
                id="tp-freelance-tax"
                value={tax}
                max={TAX_LIMIT - 1}
                ariaLabel={tw("freelance-rate-calculator.taxLabel")}
                onValueChange={setTax}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("freelance-rate-calculator.projectHoursLabel")}
              htmlFor="tp-freelance-project-hours"
              hint={tw("freelance-rate-calculator.projectHoursHint")}
            >
              <NumberStepper
                id="tp-freelance-project-hours"
                value={projectHours}
                ariaLabel={tw("freelance-rate-calculator.projectHoursLabel")}
                onValueChange={setProjectHours}
                {...stepperProps}
              />
            </ToolField>
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
          id="tp-freelance-rate-result-title"
          title={t("result")}
          hint={tw("freelance-rate-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={tw("freelance-rate-calculator.copyRate")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={errorText
                  ? tw("freelance-rate-calculator.errorTitle")
                  : tw("freelance-rate-calculator.emptyTitle")}
                hint={errorText
                  ? tw("freelance-rate-calculator.errorEmptyHint")
                  : tw("freelance-rate-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("freelance-rate-calculator.heroLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {money.format(calculation.hourlyRate)}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("freelance-rate-calculator.dailyLabel")}
                  value={money.format(calculation.dailyRate)}
                />
                <Stat
                  label={tw("freelance-rate-calculator.projectLabel")}
                  value={money.format(calculation.projectRate)}
                />
                <Stat
                  label={tw("freelance-rate-calculator.grossLabel")}
                  value={money.format(calculation.grossRevenue)}
                />
                <Stat
                  label={tw("freelance-rate-calculator.hoursLabel")}
                  value={number.format(calculation.billableHours)}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("freelance-rate-calculator.formulaTitle")}
                </span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{tw("freelance-rate-calculator.formula")}</code>
                </div>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
