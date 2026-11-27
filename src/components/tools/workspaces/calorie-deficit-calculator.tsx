"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
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
} from "@/components/tools/workspace-ui";
import {
  calculateDeficit,
  DEFAULT_DEFICIT_INPUT,
  formatDeficitReport,
  type DeficitDirection,
  type DeficitErrorCode,
  type DeficitInput,
  type DeficitMode,
  type PaceCode,
} from "./calorie-deficit-calculator.logic";

const ERROR_ID = "tp-deficit-error";

// A neutral worked example, never a personal plan.
const SAMPLE: DeficitInput = {
  currentWeight: 82,
  targetWeight: 74,
  mode: "deficit",
  dailyKcal: 500,
};

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function CalorieDeficitCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [mode, setMode] = useState<DeficitMode>(DEFAULT_DEFICIT_INPUT.mode);
  const [dailyKcal, setDailyKcal] = useState("");

  const parsedCurrent = parseValue(currentWeight);
  const parsedTarget = parseValue(targetWeight);
  const parsedDaily = parseValue(dailyKcal);
  const allFilled =
    currentWeight.trim().length > 0 &&
    targetWeight.trim().length > 0 &&
    dailyKcal.trim().length > 0;
  const invalid = [currentWeight, targetWeight, dailyKcal].some(
    (value) => value.trim().length > 0 && parseValue(value) === null,
  );

  const calculation = useMemo(
    () =>
      parsedCurrent !== null && parsedTarget !== null && parsedDaily !== null
        ? calculateDeficit({
            currentWeight: parsedCurrent,
            targetWeight: parsedTarget,
            mode,
            dailyKcal: parsedDaily,
          })
        : null,
    [parsedCurrent, parsedTarget, parsedDaily, mode],
  );

  const errorCode: DeficitErrorCode | undefined = calculation?.error;
  const errorText = invalid
    ? `${tw("calorie-deficit-calculator.errorInvalid")} ${tw("calorie-deficit-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("calorie-deficit-calculator.errorRange")} ${tw("calorie-deficit-calculator.fixRange")}`
      : errorCode === "SAME_WEIGHT"
        ? `${tw("calorie-deficit-calculator.errorSame")} ${tw("calorie-deficit-calculator.fixSame")}`
        : errorCode === "ZERO_CHANGE"
          ? `${tw("calorie-deficit-calculator.errorZero")} ${tw("calorie-deficit-calculator.fixZero")}`
          : errorCode === "WRONG_DIRECTION"
            ? `${tw("calorie-deficit-calculator.errorDirection")} ${tw("calorie-deficit-calculator.fixDirection")}`
            : "";
  const ready = Boolean(allFilled && calculation && !calculation.error && !errorText);
  const describedBy = errorText ? ERROR_ID : undefined;

  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const oneDecimal = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const twoDecimals = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const modeOptions = useMemo<{ value: DeficitMode; label: string }[]>(
    () => [
      { value: "deficit", label: tw("calorie-deficit-calculator.modeDeficit") },
      { value: "surplus", label: tw("calorie-deficit-calculator.modeSurplus") },
    ],
    [tw],
  );

  const paceLabels = useMemo<Record<PaceCode, string>>(
    () => ({
      slow: tw("calorie-deficit-calculator.paceSlow"),
      gentle: tw("calorie-deficit-calculator.paceGentle"),
      steady: tw("calorie-deficit-calculator.paceSteady"),
      aggressive: tw("calorie-deficit-calculator.paceAggressive"),
    }),
    [tw],
  );

  const directionLabels = useMemo<Record<DeficitDirection, string>>(
    () => ({
      lose: tw("calorie-deficit-calculator.directionLose"),
      gain: tw("calorie-deficit-calculator.directionGain"),
    }),
    [tw],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation) return "";
    return formatDeficitReport(
      calculation,
      {
        currentWeight: parsedCurrent ?? 0,
        targetWeight: parsedTarget ?? 0,
        mode,
        dailyKcal: parsedDaily ?? 0,
      },
      {
        title: tw("calorie-deficit-calculator.reportTitle"),
        current: tw("calorie-deficit-calculator.currentWeightLabel"),
        target: tw("calorie-deficit-calculator.targetWeightLabel"),
        daily: tw("calorie-deficit-calculator.dailyLabel"),
        change: tw("calorie-deficit-calculator.weightChangeLabel"),
        gap: tw("calorie-deficit-calculator.totalLabel"),
        weeks: tw("calorie-deficit-calculator.weeksLabel"),
        days: tw("calorie-deficit-calculator.daysLabel"),
        weekly: tw("calorie-deficit-calculator.weeklyLabel"),
        paceTitle: tw("calorie-deficit-calculator.paceTitle"),
        pace: paceLabels,
        direction: directionLabels,
        unitKg: tw("calorie-deficit-calculator.unitKg"),
        unitKcal: tw("calorie-deficit-calculator.unitKcal"),
        unitWeeks: tw("calorie-deficit-calculator.unitWeeks"),
        unitDays: tw("calorie-deficit-calculator.unitDays"),
        note: tw("calorie-deficit-calculator.reportNote"),
      },
    );
  }, [ready, calculation, parsedCurrent, parsedTarget, parsedDaily, mode, tw, paceLabels, directionLabels]);

  const handleSample = () => {
    setCurrentWeight(String(SAMPLE.currentWeight));
    setTargetWeight(String(SAMPLE.targetWeight));
    setMode(SAMPLE.mode);
    setDailyKcal(String(SAMPLE.dailyKcal));
  };

  const handleReset = () => {
    setCurrentWeight("");
    setTargetWeight("");
    setMode(DEFAULT_DEFICIT_INPUT.mode);
    setDailyKcal("");
  };

  return (
    <ToolShell
      title={tw("calorie-deficit-calculator.title")}
      icon="TrendingUp"
      sampleLabel={tw("calorie-deficit-calculator.trySample")}
      resetLabel={tw("calorie-deficit-calculator.reset")}
      privacyLabel={tw("calorie-deficit-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-deficit-input-title"
          title={tw("calorie-deficit-calculator.inputTitle")}
          hint={tw("calorie-deficit-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("calorie-deficit-calculator.currentWeightLabel")}
              htmlFor="tp-deficit-current"
              hint={tw("calorie-deficit-calculator.weightHint")}
            >
              <NumberStepper
                id="tp-deficit-current"
                value={currentWeight}
                min={30}
                max={300}
                step={0.5}
                inputMode="decimal"
                ariaLabel={tw("calorie-deficit-calculator.currentWeightLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setCurrentWeight}
              />
            </ToolField>
            <ToolField
              label={tw("calorie-deficit-calculator.targetWeightLabel")}
              htmlFor="tp-deficit-target"
              hint={tw("calorie-deficit-calculator.weightHint")}
            >
              <NumberStepper
                id="tp-deficit-target"
                value={targetWeight}
                min={30}
                max={300}
                step={0.5}
                inputMode="decimal"
                ariaLabel={tw("calorie-deficit-calculator.targetWeightLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setTargetWeight}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("calorie-deficit-calculator.modeLabel")}
            </p>
            <SegmentedControl<DeficitMode>
              label={tw("calorie-deficit-calculator.modeLabel")}
              value={mode}
              options={modeOptions}
              onChange={setMode}
            />
          </div>

          <ToolField
            label={tw("calorie-deficit-calculator.dailyLabel")}
            htmlFor="tp-deficit-daily"
            hint={tw("calorie-deficit-calculator.dailyHint")}
          >
            <NumberStepper
              id="tp-deficit-daily"
              value={dailyKcal}
              min={0}
              max={2000}
              step={50}
              inputMode="numeric"
              ariaLabel={tw("calorie-deficit-calculator.dailyLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setDailyKcal}
            />
          </ToolField>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-deficit-result-title"
          title={t("result")}
          hint={tw("calorie-deficit-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<TrendingUp aria-hidden="true" />}
                title={
                  errorText
                    ? tw("calorie-deficit-calculator.errorTitle")
                    : tw("calorie-deficit-calculator.emptyTitle")
                }
                hint={errorText || tw("calorie-deficit-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("calorie-deficit-calculator.weeksLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {oneDecimal.format(calculation.weeks)} {tw("calorie-deficit-calculator.unitWeeks")}
                </output>
              </div>

              <ToolBadge tone="accent">
                {directionLabels[calculation.direction]}
              </ToolBadge>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("calorie-deficit-calculator.weightChangeLabel")}
                  value={`${oneDecimal.format(calculation.weightChangeKg)} ${tw("calorie-deficit-calculator.unitKg")}`}
                />
                <Stat
                  label={tw("calorie-deficit-calculator.totalLabel")}
                  value={`${whole.format(Math.round(calculation.totalKcal))} ${tw("calorie-deficit-calculator.unitKcal")}`}
                />
                <Stat
                  label={tw("calorie-deficit-calculator.daysLabel")}
                  value={`${whole.format(Math.round(calculation.days))} ${tw("calorie-deficit-calculator.unitDays")}`}
                />
                <Stat
                  label={tw("calorie-deficit-calculator.weeklyLabel")}
                  value={`${twoDecimals.format(calculation.weeklyKg)} ${tw("calorie-deficit-calculator.unitKg")}`}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("calorie-deficit-calculator.paceTitle")}
                </span>
                <p className="tp-tool-hint">{paceLabels[calculation.pace]}</p>
              </div>

              <p className="tp-tool-hint">
                {tw("calorie-deficit-calculator.reportNote")}
              </p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
