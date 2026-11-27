"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToggleSwitch,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  ACTIVITY_LEVELS,
  calculateWaterIntake,
  convertWeight,
  DEFAULTS,
  formatWaterReport,
  type ActivityLevel,
  type WaterErrorCode,
  type WeightUnit,
} from "./water-intake-calculator.logic";

const ERROR_ID = "tp-water-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function WaterIntakeCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<{ unit: WeightUnit }>(
    "toolpika:water-intake-calculator",
    { unit: DEFAULTS.unit },
  );
  const unit = options.unit;

  const [weight, setWeight] = useState(() => String(unit === "kg" ? DEFAULTS.kg : DEFAULTS.lb));
  const [activity, setActivity] = useState<ActivityLevel>(DEFAULTS.activity);
  const [exerciseBoost, setExerciseBoost] = useState(false);
  const [climateBoost, setClimateBoost] = useState(false);

  const parsedWeight = parseValue(weight);
  const invalid = weight.trim().length > 0 && parsedWeight === null;

  const calculation = useMemo(
    () =>
      parsedWeight !== null
        ? calculateWaterIntake({
            weight: parsedWeight,
            unit,
            activity,
            exerciseBoost,
            climateBoost,
          })
        : null,
    [parsedWeight, unit, activity, exerciseBoost, climateBoost],
  );

  const errorCode: WaterErrorCode | undefined = calculation?.error?.code;
  const errorText = invalid
    ? `${tw("water-intake-calculator.errorInvalid")} ${tw("water-intake-calculator.fixInvalid")}`
    : errorCode === "INVALID_NUMBER"
      ? `${tw("water-intake-calculator.errorInvalid")} ${tw("water-intake-calculator.fixInvalid")}`
      : errorCode === "OUT_OF_RANGE"
        ? `${tw("water-intake-calculator.errorRange")} ${tw("water-intake-calculator.fixRange")}`
        : "";
  const ready = weight.trim().length > 0 && !!calculation && !calculation.error && !invalid;
  const describedBy = errorText ? ERROR_ID : undefined;

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const activityLabel = useCallback(
    (level: ActivityLevel) => {
      switch (level) {
        case "sedentary":
          return tw("water-intake-calculator.activitySedentary");
        case "light":
          return tw("water-intake-calculator.activityLight");
        case "moderate":
          return tw("water-intake-calculator.activityModerate");
        case "active":
          return tw("water-intake-calculator.activityActive");
      }
    },
    [tw],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation || parsedWeight === null) return "";
    return formatWaterReport(
      calculation,
      { weight: parsedWeight, unit, activity, exerciseBoost, climateBoost },
      {
        title: tw("water-intake-calculator.reportTitle"),
        weight: tw("water-intake-calculator.reportWeight"),
        activity: tw("water-intake-calculator.reportActivity"),
        base: tw("water-intake-calculator.reportBase"),
        adjusted: tw("water-intake-calculator.reportAdjusted"),
        boost: tw("water-intake-calculator.reportBoost"),
        total: tw("water-intake-calculator.reportTotal"),
        glasses: tw("water-intake-calculator.reportGlasses"),
        bottles: tw("water-intake-calculator.reportBottles"),
        note: tw("water-intake-calculator.note"),
        unitKg: tw("water-intake-calculator.unitKg"),
        unitLb: tw("water-intake-calculator.unitLb"),
        unitMl: tw("water-intake-calculator.unitMl"),
        activityLabel: activityLabel(activity),
      },
    );
  }, [ready, calculation, parsedWeight, unit, activity, exerciseBoost, climateBoost, tw, activityLabel]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ unit: DEFAULTS.unit });
    setWeight(String(DEFAULTS.kg));
    setActivity(DEFAULTS.activity);
    setExerciseBoost(true);
    setClimateBoost(false);
  };

  const handleReset = () => {
    resetOptions();
    setWeight("");
    setActivity(DEFAULTS.activity);
    setExerciseBoost(false);
    setClimateBoost(false);
  };

  const handleUnitChange = (next: WeightUnit) => {
    const parsed = parseValue(weight);
    const starting = next === "kg" ? DEFAULTS.kg : DEFAULTS.lb;
    setWeight(
      parsed !== null && parsed > 0
        ? String(Math.round(convertWeight(parsed, unit, next)))
        : String(starting),
    );
    update({ unit: next });
  };

  const weightLabel = unit === "kg"
    ? tw("water-intake-calculator.weightKgLabel")
    : tw("water-intake-calculator.weightLbLabel");

  return (
    <ToolShell
      title={tw("water-intake-calculator.title")}
      icon="Activity"
      sampleLabel={tw("water-intake-calculator.trySample")}
      resetLabel={tw("water-intake-calculator.reset")}
      privacyLabel={tw("water-intake-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-water-input-title"
          title={tw("water-intake-calculator.inputTitle")}
          hint={tw("water-intake-calculator.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setWeight("")}
              disabled={!weight}
              aria-label={t("clear")}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<WeightUnit>
              label={tw("water-intake-calculator.unitLabel")}
              value={unit}
              options={[
                { value: "kg", label: tw("water-intake-calculator.kg") },
                { value: "lb", label: tw("water-intake-calculator.lb") },
              ]}
              onChange={handleUnitChange}
            />
          </div>

          <ToolField
            label={weightLabel}
            htmlFor="tp-water-weight"
            hint={tw("water-intake-calculator.weightHint")}
          >
            <NumberStepper
              id="tp-water-weight"
              value={weight}
              min={0}
              step={unit === "kg" ? 1 : 2}
              inputMode="decimal"
              ariaLabel={weightLabel}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setWeight}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<ActivityLevel>
              label={tw("water-intake-calculator.activityLabel")}
              value={activity}
              options={ACTIVITY_LEVELS.map((level) => ({
                value: level,
                label: activityLabel(level),
              }))}
              onChange={setActivity}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">{tw("water-intake-calculator.boostTitle")}</p>
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-water-exercise"
                label={tw("water-intake-calculator.exerciseLabel")}
                checked={exerciseBoost}
                onChange={() => setExerciseBoost((previous) => !previous)}
              />
              <label htmlFor="tp-water-exercise" className="tp-check-label">
                {tw("water-intake-calculator.exerciseLabel")}
              </label>
            </div>
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-water-climate"
                label={tw("water-intake-calculator.climateLabel")}
                checked={climateBoost}
                onChange={() => setClimateBoost((previous) => !previous)}
              />
              <label htmlFor="tp-water-climate" className="tp-check-label">
                {tw("water-intake-calculator.climateLabel")}
              </label>
            </div>
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
          id="tp-water-result-title"
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
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Activity aria-hidden="true" />}
                title={
                  errorText
                    ? tw("water-intake-calculator.errorTitle")
                    : tw("water-intake-calculator.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("water-intake-calculator.emptyErrorHint")
                    : tw("water-intake-calculator.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("water-intake-calculator.totalLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {formatter.format(calculation.totalMl)} {tw("water-intake-calculator.unitMl")}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("water-intake-calculator.baseLabel")}
                  value={`${formatter.format(calculation.baseMl)} ${tw("water-intake-calculator.unitMl")}`}
                />
                <Stat
                  label={tw("water-intake-calculator.adjustedLabel")}
                  value={`${formatter.format(calculation.adjustedMl)} ${tw("water-intake-calculator.unitMl")}`}
                />
                <Stat
                  label={tw("water-intake-calculator.boostLabel")}
                  value={`${formatter.format(calculation.boostMl)} ${tw("water-intake-calculator.unitMl")}`}
                />
                <Stat
                  label={tw("water-intake-calculator.glassesLabel")}
                  value={formatter.format(calculation.glasses)}
                />
                <Stat
                  label={tw("water-intake-calculator.bottlesLabel")}
                  value={formatter.format(calculation.bottles)}
                />
              </dl>

              <p className="tp-tool-hint">{tw("water-intake-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
