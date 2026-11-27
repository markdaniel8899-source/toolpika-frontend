"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PiggyBank as PiggyBankIcon } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateSavingsGoal,
  COMPOUNDING_FREQUENCIES,
  DEFAULTS,
  formatSavingsPlan,
  type CompoundingFrequency,
} from "./savings-goal-calculator.logic";

const ERROR_ID = "savings-goal-calculator-error";

export default function SavingsGoalCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [goal, setGoal] = useState("");
  const [startingSavings, setStartingSavings] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [frequency, setFrequency] = useState<CompoundingFrequency>("monthly");

  const input = useMemo(
    () => ({ goal, startingSavings, monthlyContribution, annualRate, frequency }),
    [goal, startingSavings, monthlyContribution, annualRate, frequency],
  );
  const calculation = useMemo(() => calculateSavingsGoal(input), [input]);
  const plan = calculation.value;
  const error = calculation.error;

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const frequencyOptions = useMemo(
    () =>
      COMPOUNDING_FREQUENCIES.map((value) => ({
        value,
        label: tw(`savings-goal-calculator.frequency${value.charAt(0).toUpperCase()}${value.slice(1)}`),
      })),
    [tw],
  );
  const frequencyLabel = frequencyOptions.find((option) => option.value === frequency)?.label ?? "";

  const errorText = useMemo(() => {
    const code = error?.code;
    if (code === "MISSING_GOAL" || code === "MISSING_STARTING" ||
        code === "MISSING_CONTRIBUTION" || code === "MISSING_RATE") {
      return `${tw("savings-goal-calculator.errorMissing")} ${tw("savings-goal-calculator.fixMissing")}`;
    }
    if (code === "INVALID_NUMBER") {
      return `${tw("savings-goal-calculator.errorInvalid")} ${tw("savings-goal-calculator.fixInvalid")}`;
    }
    if (code === "NEGATIVE_VALUE") {
      return `${tw("savings-goal-calculator.errorNegative")} ${tw("savings-goal-calculator.fixNegative")}`;
    }
    if (code === "ZERO_GOAL") {
      return `${tw("savings-goal-calculator.errorZero")} ${tw("savings-goal-calculator.fixZero")}`;
    }
    if (code === "NO_GROWTH") {
      return `${tw("savings-goal-calculator.errorNoGrowth")} ${tw("savings-goal-calculator.fixNoGrowth")}`;
    }
    if (code === "UNREACHABLE") {
      const suggestion = error?.suggestedContribution ?? 0;
      return `${tw("savings-goal-calculator.errorUnreachable")} ${tw("savings-goal-calculator.suggestPrefix")} ${money.format(suggestion)} ${tw("savings-goal-calculator.suggestSuffix")}`;
    }
    return "";
  }, [error, tw, money]);

  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = Boolean(plan && !errorText);

  const timelineText = plan
    ? `${whole.format(plan.years)} ${tw("savings-goal-calculator.unitYears")} ${whole.format(plan.remainingMonths)} ${tw("savings-goal-calculator.unitMonths")}`
    : "";

  const reportText = useMemo(() => {
    if (!ready || !plan) return "";
    return formatSavingsPlan(
      plan,
      input,
      {
        title: tw("savings-goal-calculator.reportTitle"),
        goal: tw("savings-goal-calculator.goalLabel"),
        starting: tw("savings-goal-calculator.startingLabel"),
        contribution: tw("savings-goal-calculator.contributionLabel"),
        rate: tw("savings-goal-calculator.rateLabel"),
        frequency: tw("savings-goal-calculator.frequencyLabel"),
        months: tw("savings-goal-calculator.monthsLabel"),
        timeline: tw("savings-goal-calculator.timelineLabel"),
        totalContributed: tw("savings-goal-calculator.totalContributedLabel"),
        growth: tw("savings-goal-calculator.growthLabel"),
        finalBalance: tw("savings-goal-calculator.finalBalanceLabel"),
        yearsUnit: tw("savings-goal-calculator.unitYears"),
        monthsUnit: tw("savings-goal-calculator.unitMonths"),
        note: tw("savings-goal-calculator.reportNote"),
      },
      frequencyLabel,
      (value) => money.format(value),
    );
  }, [ready, plan, input, tw, frequencyLabel, money]);

  const handleCopy = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setGoal(DEFAULTS.goal);
    setStartingSavings(DEFAULTS.startingSavings);
    setMonthlyContribution(DEFAULTS.monthlyContribution);
    setAnnualRate(DEFAULTS.annualRate);
    setFrequency(DEFAULTS.frequency);
  };

  const handleReset = () => {
    setGoal("");
    setStartingSavings("");
    setMonthlyContribution("");
    setAnnualRate("");
    setFrequency("monthly");
  };

  const emptyTitle = errorText
    ? error?.code === "UNREACHABLE"
      ? tw("savings-goal-calculator.unreachableTitle")
      : tw("savings-goal-calculator.errorTitle")
    : tw("savings-goal-calculator.emptyTitle");
  const emptyHint = errorText
    ? error?.code === "UNREACHABLE" && error.shortfall !== undefined
      ? `${tw("savings-goal-calculator.shortfallLabel")}: ${money.format(error.shortfall)}`
      : tw("savings-goal-calculator.fixGeneric")
    : tw("savings-goal-calculator.emptyHint");

  return (
    <ToolShell
      title={tw("savings-goal-calculator.title")}
      icon="PiggyBank"
      sampleLabel={tw("savings-goal-calculator.trySample")}
      resetLabel={tw("savings-goal-calculator.reset")}
      privacyLabel={tw("savings-goal-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-savings-goal-input-title"
          title={tw("savings-goal-calculator.inputTitle")}
          hint={tw("savings-goal-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("savings-goal-calculator.goalLabel")}
              htmlFor="tp-savings-goal"
              hint={tw("savings-goal-calculator.goalHint")}
            >
              <NumberStepper
                id="tp-savings-goal"
                value={goal}
                min={0}
                step={100}
                inputMode="decimal"
                ariaLabel={tw("savings-goal-calculator.goalLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => setGoal(next)}
              />
            </ToolField>
            <ToolField
              label={tw("savings-goal-calculator.startingLabel")}
              htmlFor="tp-savings-start"
              hint={tw("savings-goal-calculator.startingHint")}
            >
              <NumberStepper
                id="tp-savings-start"
                value={startingSavings}
                min={0}
                step={100}
                inputMode="decimal"
                ariaLabel={tw("savings-goal-calculator.startingLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => setStartingSavings(next)}
              />
            </ToolField>
            <ToolField
              label={tw("savings-goal-calculator.contributionLabel")}
              htmlFor="tp-savings-monthly"
              hint={tw("savings-goal-calculator.contributionHint")}
            >
              <NumberStepper
                id="tp-savings-monthly"
                value={monthlyContribution}
                min={0}
                step={25}
                inputMode="decimal"
                ariaLabel={tw("savings-goal-calculator.contributionLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => setMonthlyContribution(next)}
              />
            </ToolField>
            <ToolField
              label={tw("savings-goal-calculator.rateLabel")}
              htmlFor="tp-savings-rate"
              hint={tw("savings-goal-calculator.rateHint")}
            >
              <NumberStepper
                id="tp-savings-rate"
                value={annualRate}
                min={0}
                step={0.5}
                inputMode="decimal"
                ariaLabel={tw("savings-goal-calculator.rateLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => setAnnualRate(next)}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("savings-goal-calculator.frequencyLabel")}
            </p>
            <SegmentedControl<CompoundingFrequency>
              label={tw("savings-goal-calculator.frequencyLabel")}
              value={frequency}
              options={frequencyOptions}
              onChange={setFrequency}
            />
            <p className="tp-tool-hint">
              {tw("savings-goal-calculator.frequencyHint")}
            </p>
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
          id="tp-savings-goal-result-title"
          title={t("result")}
          hint={tw("savings-goal-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !plan ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<PiggyBankIcon aria-hidden="true" />}
                title={emptyTitle}
                hint={emptyHint}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("savings-goal-calculator.monthsLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {`${whole.format(plan.months)} ${tw("savings-goal-calculator.unitMonths")}`}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("savings-goal-calculator.timelineLabel")}
                  value={timelineText}
                />
                <Stat
                  label={tw("savings-goal-calculator.totalContributedLabel")}
                  value={money.format(plan.totalContributed)}
                />
                <Stat
                  label={tw("savings-goal-calculator.growthLabel")}
                  value={money.format(plan.growth)}
                />
                <Stat
                  label={tw("savings-goal-calculator.finalBalanceLabel")}
                  value={money.format(plan.finalBalance)}
                />
              </dl>

              <p className="tp-tool-hint">
                {tw("savings-goal-calculator.contributedHint")}
              </p>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("savings-goal-calculator.checkpointsTitle")}
                </span>
                <div className="tp-tool-list">
                  {plan.checkpoints.map((checkpoint) => (
                    <div className="tp-tool-row" key={checkpoint.month}>
                      <span>
                        {tw("savings-goal-calculator.checkpointPrefix")} {whole.format(checkpoint.month)}
                      </span>
                      <span className="tp-tool-pill" dir="ltr">
                        {money.format(checkpoint.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
