"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gauge } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  ACTIVITY_LEVELS,
  calculateProtein,
  DEFAULTS,
  formatProteinReport,
  GOALS,
  type Activity,
  type Goal,
  type ProteinError,
} from "./protein-target-calculator.logic";

const ERROR_ID = "tp-protein-error";

// A neutral worked example, not a recommended intake for anyone.
const INITIAL = { weight: 75, goal: "maintenance" as Goal, activity: "moderate" as Activity };

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function ProteinTargetCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const { options, update, reset: resetOptions } = usePersistedOptions<{
    goal: Goal;
    activity: Activity;
  }>("toolpika:protein-target-calculator", {
    goal: DEFAULTS.goal,
    activity: DEFAULTS.activity,
  });
  const goal = options.goal;
  const activity = options.activity;

  const [weight, setWeight] = useState("");
  const parsedWeight = parseValue(weight);
  const allFilled = weight.trim().length > 0;
  const invalid = weight.trim().length > 0 && parsedWeight === null;

  const calculation = useMemo(
    () =>
      parsedWeight !== null
        ? calculateProtein({ weight: parsedWeight, goal, activity })
        : null,
    [parsedWeight, goal, activity],
  );

  const errorCode: ProteinError | undefined = calculation?.error;
  const errorText = invalid
    ? `${tw("protein-target-calculator.errorInvalid")} ${tw("protein-target-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("protein-target-calculator.errorRange")} ${tw("protein-target-calculator.fixRange")}`
      : errorCode === "INVALID_NUMBER"
        ? `${tw("protein-target-calculator.errorInvalid")} ${tw("protein-target-calculator.fixInvalid")}`
        : "";
  const ready = Boolean(allFilled && calculation && !calculation.error && !invalid);
  const describedBy = errorText ? ERROR_ID : undefined;

  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const decimal = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  );

  const goalLabel = useCallback(
    (value: Goal) => {
      switch (value) {
        case "maintenance":
          return tw("protein-target-calculator.goalMaintenance");
        case "muscleGain":
          return tw("protein-target-calculator.goalMuscleGain");
        case "fatLoss":
          return tw("protein-target-calculator.goalFatLoss");
      }
    },
    [tw],
  );

  const activityLabel = useCallback(
    (value: Activity) => {
      switch (value) {
        case "low":
          return tw("protein-target-calculator.activityLow");
        case "moderate":
          return tw("protein-target-calculator.activityModerate");
        case "high":
          return tw("protein-target-calculator.activityHigh");
      }
    },
    [tw],
  );

  const goalOptions = useMemo(
    () => GOALS.map((value) => ({ value, label: goalLabel(value) })),
    [goalLabel],
  );
  const activityOptions = useMemo(
    () => ACTIVITY_LEVELS.map((value) => ({ value, label: activityLabel(value) })),
    [activityLabel],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation) return "";
    const report = formatProteinReport(calculation, {
      title: tw("protein-target-calculator.reportTitle"),
      perKg: tw("protein-target-calculator.perKgLabel"),
      perDay: tw("protein-target-calculator.perDayLabel"),
      target: tw("protein-target-calculator.targetLabel"),
      formula: tw("protein-target-calculator.formulaTitle"),
      unit: tw("protein-target-calculator.unitGram"),
      note: tw("protein-target-calculator.footnote"),
    });
    return [
      `${tw("protein-target-calculator.goalLabel")}: ${goalLabel(goal)}`,
      `${tw("protein-target-calculator.activityLabel")}: ${activityLabel(activity)}`,
      report,
    ].join("\n");
  }, [ready, calculation, tw, goalLabel, activityLabel, goal, activity]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ goal: INITIAL.goal, activity: INITIAL.activity });
    setWeight(String(INITIAL.weight));
  };

  const handleReset = () => {
    resetOptions();
    setWeight("");
  };

  return (
    <ToolShell
      title={tw("protein-target-calculator.title")}
      icon="Gauge"
      sampleLabel={tw("protein-target-calculator.trySample")}
      resetLabel={tw("protein-target-calculator.reset")}
      privacyLabel={tw("protein-target-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-protein-input-title"
          title={tw("protein-target-calculator.inputTitle")}
          hint={tw("protein-target-calculator.inputHint")}
        >
          <ToolField
            label={tw("protein-target-calculator.weightLabel")}
            htmlFor="tp-protein-weight"
            hint={tw("protein-target-calculator.weightHint")}
          >
            <NumberStepper
              id="tp-protein-weight"
              value={weight}
              min={30}
              max={300}
              step={0.5}
              inputMode="decimal"
              ariaLabel={tw("protein-target-calculator.weightLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setWeight}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<Goal>
              label={tw("protein-target-calculator.goalLabel")}
              value={goal}
              options={goalOptions}
              onChange={(next) => update({ goal: next })}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<Activity>
              label={tw("protein-target-calculator.activityLabel")}
              value={activity}
              options={activityOptions}
              onChange={(next) => update({ activity: next })}
            />
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
          id="tp-protein-result-title"
          title={t("result")}
          actions={
            <>
              {ready && calculation ? (
                <ToolBadge tone="accent">{goalLabel(goal)}</ToolBadge>
              ) : null}
              <CopyButton
                text={reportText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
            </>
          }
          result
        >
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Gauge aria-hidden="true" />}
                title={
                  errorText
                    ? tw("protein-target-calculator.errorTitle")
                    : tw("protein-target-calculator.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("protein-target-calculator.emptyErrorHint")
                    : tw("protein-target-calculator.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("protein-target-calculator.targetLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {whole.format(calculation.target)} {tw("protein-target-calculator.unitGram")}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("protein-target-calculator.perKgLabel")}
                  value={`${decimal.format(calculation.perKg.min)} - ${decimal.format(calculation.perKg.max)} g/kg`}
                />
                <Stat
                  label={tw("protein-target-calculator.lowerLabel")}
                  value={`${whole.format(Math.round(calculation.perDay.min))} ${tw("protein-target-calculator.unitGram")}`}
                />
                <Stat
                  label={tw("protein-target-calculator.upperLabel")}
                  value={`${whole.format(Math.round(calculation.perDay.max))} ${tw("protein-target-calculator.unitGram")}`}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("protein-target-calculator.formulaTitle")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{calculation.formula}</code>
                </div>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
