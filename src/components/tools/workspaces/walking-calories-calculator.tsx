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
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateWalk,
  convertDistance,
  convertPace,
  convertWeight,
  DEFAULTS,
  formatWalkReport,
  type ActivityMode,
  type DistanceUnit,
  type InputMode,
  type WalkErrorCode,
  type WeightUnit,
} from "./walking-calories-calculator.logic";

const ERROR_ID = "tp-walking-error";

interface WalkOptions {
  activity: ActivityMode;
  mode: InputMode;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function WalkingCaloriesCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<WalkOptions>(
    "toolpika:walking-calories-calculator",
    {
      activity: DEFAULTS.activity,
      mode: DEFAULTS.mode,
      weightUnit: DEFAULTS.weightUnit,
      distanceUnit: DEFAULTS.distanceUnit,
    },
  );
  const { activity, mode, weightUnit, distanceUnit } = options;

  const [weight, setWeight] = useState("");
  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");
  const [minutes, setMinutes] = useState("");

  const parsedWeight = parseValue(weight);
  const parsedDistance = parseValue(distance);
  const parsedPace = parseValue(pace);
  const parsedMinutes = parseValue(minutes);

  const typedInvalid = [weight, distance, pace, minutes].some(
    (raw) => raw.trim() !== "" && parseValue(raw) === null,
  );
  const canCalculate =
    parsedWeight !== null && parsedPace !== null &&
    (mode === "distance" ? parsedDistance !== null : parsedMinutes !== null);

  const result = useMemo(
    () =>
      canCalculate
        ? calculateWalk({
            activity,
            mode,
            weightUnit,
            weight: parsedWeight as number,
            distanceUnit,
            distance: parsedDistance ?? 0,
            pace: parsedPace as number,
            minutes: parsedMinutes ?? 0,
          })
        : null,
    [canCalculate, activity, mode, weightUnit, parsedWeight, distanceUnit, parsedDistance, parsedPace, parsedMinutes],
  );

  const errorCode: WalkErrorCode | undefined = result?.error?.code;
  const errorText = typedInvalid || errorCode === "INVALID_NUMBER"
    ? `${tw("walking-calories-calculator.errorInvalid")} ${tw("walking-calories-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("walking-calories-calculator.errorRange")} ${tw("walking-calories-calculator.fixRange")}`
      : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = canCalculate && !!result && !result.error && !typedInvalid;

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  );
  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const weightUnitOptions = useMemo<{ value: WeightUnit; label: string }[]>(() => [
    { value: "kg", label: tw("walking-calories-calculator.kg") },
    { value: "lb", label: tw("walking-calories-calculator.lb") },
  ], [tw]);
  const distanceUnitOptions = useMemo<{ value: DistanceUnit; label: string }[]>(() => [
    { value: "km", label: tw("walking-calories-calculator.unitKm") },
    { value: "mi", label: tw("walking-calories-calculator.unitMi") },
  ], [tw]);
  const activityOptions = useMemo<{ value: ActivityMode; label: string }[]>(() => [
    { value: "walk", label: tw("walking-calories-calculator.activityWalk") },
    { value: "run", label: tw("walking-calories-calculator.activityRun") },
  ], [tw]);
  const modeOptions = useMemo<{ value: InputMode; label: string }[]>(() => [
    { value: "distance", label: tw("walking-calories-calculator.modeDistance") },
    { value: "duration", label: tw("walking-calories-calculator.modeDuration") },
  ], [tw]);

  const reportText = useMemo(() => {
    if (!ready || !result || parsedWeight === null || parsedPace === null) return "";
    return formatWalkReport(result, {
      activity,
      mode,
      weightUnit,
      weight: parsedWeight,
      distanceUnit,
      distance: parsedDistance ?? 0,
      pace: parsedPace,
      minutes: parsedMinutes ?? 0,
    }, {
      title: tw("walking-calories-calculator.reportTitle"),
      weight: tw("walking-calories-calculator.reportWeight"),
      activity: tw("walking-calories-calculator.reportActivity"),
      duration: tw("walking-calories-calculator.reportDuration"),
      distance: tw("walking-calories-calculator.reportDistance"),
      pace: tw("walking-calories-calculator.reportPace"),
      speed: tw("walking-calories-calculator.reportSpeed"),
      met: tw("walking-calories-calculator.reportMet"),
      burn: tw("walking-calories-calculator.reportBurn"),
      note: tw("walking-calories-calculator.note"),
      unitKg: tw("walking-calories-calculator.kg"),
      unitLb: tw("walking-calories-calculator.lb"),
      unitKm: tw("walking-calories-calculator.unitKm"),
      unitMi: tw("walking-calories-calculator.unitMi"),
      unitMin: tw("walking-calories-calculator.unitMin"),
      unitKcal: tw("walking-calories-calculator.unitKcal"),
      unitMet: tw("walking-calories-calculator.unitMet"),
      unitSpeed: tw("walking-calories-calculator.unitSpeed"),
      walk: tw("walking-calories-calculator.activityWalk"),
      run: tw("walking-calories-calculator.activityRun"),
    });
  }, [ready, result, activity, mode, weightUnit, parsedWeight, distanceUnit, parsedDistance, parsedPace, parsedMinutes, tw]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({
      activity: DEFAULTS.activity,
      mode: DEFAULTS.mode,
      weightUnit: DEFAULTS.weightUnit,
      distanceUnit: DEFAULTS.distanceUnit,
    });
    setWeight(String(DEFAULTS.weightKg));
    setDistance(String(DEFAULTS.distanceKm));
    setPace(String(DEFAULTS.paceKm));
    setMinutes(String(DEFAULTS.minutes));
  };

  const handleReset = () => {
    resetOptions();
    setWeight("");
    setDistance("");
    setPace("");
    setMinutes("");
  };

  const handleWeightUnit = (next: WeightUnit) => {
    const parsed = parseValue(weight);
    if (parsed !== null && parsed > 0) {
      setWeight(String(weightUnit === next
        ? parsed
        : Math.round(convertWeight(parsed, weightUnit, next))));
    }
    update({ weightUnit: next });
  };

  const handleDistanceUnit = (next: DistanceUnit) => {
    const parsedDistanceValue = parseValue(distance);
    const parsedPaceValue = parseValue(pace);
    if (distanceUnit !== next) {
      if (parsedDistanceValue !== null) {
        setDistance(String(Math.round(convertDistance(parsedDistanceValue, distanceUnit, next) * 10) / 10));
      }
      if (parsedPaceValue !== null) {
        setPace(String(Math.round(convertPace(parsedPaceValue, distanceUnit, next) * 10) / 10));
      }
    }
    update({ distanceUnit: next });
  };

  const weightLabel = weightUnit === "kg"
    ? tw("walking-calories-calculator.weightKgLabel")
    : tw("walking-calories-calculator.weightLbLabel");
  const distanceLabel = distanceUnit === "km"
    ? tw("walking-calories-calculator.distanceKmLabel")
    : tw("walking-calories-calculator.distanceMiLabel");
  const paceLabel = distanceUnit === "km"
    ? tw("walking-calories-calculator.paceKmLabel")
    : tw("walking-calories-calculator.paceMiLabel");

  return (
    <ToolShell
      title={tw("walking-calories-calculator.title")}
      icon="Activity"
      sampleLabel={tw("walking-calories-calculator.trySample")}
      resetLabel={tw("walking-calories-calculator.reset")}
      privacyLabel={tw("walking-calories-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-walking-input-title"
          title={tw("walking-calories-calculator.inputTitle")}
          hint={tw("walking-calories-calculator.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setWeight("");
                setDistance("");
                setPace("");
                setMinutes("");
              }}
              disabled={!weight && !distance && !pace && !minutes}
              aria-label={t("clear")}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<ActivityMode>
              label={tw("walking-calories-calculator.activityLabel")}
              value={activity}
              options={activityOptions}
              onChange={(next) => update({ activity: next })}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<InputMode>
              label={tw("walking-calories-calculator.modeLabel")}
              value={mode}
              options={modeOptions}
              onChange={(next) => update({ mode: next })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={weightLabel}
              htmlFor="tp-walking-weight"
              hint={tw("walking-calories-calculator.weightHint")}
            >
              <NumberStepper
                id="tp-walking-weight"
                value={weight}
                min={0}
                step={1}
                inputMode="decimal"
                ariaLabel={weightLabel}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setWeight}
              />
            </ToolField>
            <div className="tp-tool-group tp-tool-group--flush">
              <p className="tp-tool-group-title">
                {tw("walking-calories-calculator.weightUnitLabel")}
              </p>
              <SegmentedControl<WeightUnit>
                label={tw("walking-calories-calculator.weightUnitLabel")}
                value={weightUnit}
                options={weightUnitOptions}
                onChange={handleWeightUnit}
              />
            </div>
          </div>

          {mode === "distance" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolField
                label={distanceLabel}
                htmlFor="tp-walking-distance"
                hint={tw("walking-calories-calculator.distanceHint")}
              >
                <NumberStepper
                  id="tp-walking-distance"
                  value={distance}
                  min={0}
                  step={1}
                  inputMode="decimal"
                  ariaLabel={distanceLabel}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  describedBy={describedBy}
                  onValueChange={setDistance}
                />
              </ToolField>
              <div className="tp-tool-group tp-tool-group--flush">
                <p className="tp-tool-group-title">
                  {tw("walking-calories-calculator.distanceUnitLabel")}
                </p>
                <SegmentedControl<DistanceUnit>
                  label={tw("walking-calories-calculator.distanceUnitLabel")}
                  value={distanceUnit}
                  options={distanceUnitOptions}
                  onChange={handleDistanceUnit}
                />
              </div>
            </div>
          ) : (
            <ToolField
              label={tw("walking-calories-calculator.durationLabel")}
              htmlFor="tp-walking-minutes"
              hint={tw("walking-calories-calculator.durationHint")}
            >
              <NumberStepper
                id="tp-walking-minutes"
                value={minutes}
                min={0}
                step={5}
                inputMode="numeric"
                ariaLabel={tw("walking-calories-calculator.durationLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setMinutes}
              />
            </ToolField>
          )}

          <ToolField
            label={paceLabel}
            htmlFor="tp-walking-pace"
            hint={tw("walking-calories-calculator.paceHint")}
          >
            <NumberStepper
              id="tp-walking-pace"
              value={pace}
              min={0}
              step={1}
              inputMode="decimal"
              ariaLabel={paceLabel}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setPace}
            />
          </ToolField>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-walking-result-title"
          title={t("result")}
          hint={tw("walking-calories-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !result ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Activity aria-hidden="true" />}
                title={errorText
                  ? tw("walking-calories-calculator.errorTitle")
                  : tw("walking-calories-calculator.emptyTitle")}
                hint={errorText
                  ? tw("walking-calories-calculator.emptyErrorHint")
                  : tw("walking-calories-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("walking-calories-calculator.kcalLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {whole.format(result.kcal)} {tw("walking-calories-calculator.unitKcal")}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("walking-calories-calculator.statTime")}
                  value={`${whole.format(result.minutes)} ${tw("walking-calories-calculator.unitMin")}`}
                />
                <Stat
                  label={tw("walking-calories-calculator.statDistance")}
                  value={`${formatter.format(convertDistance(result.distanceKm, "km", distanceUnit))} ${distanceUnit}`}
                />
                <Stat
                  label={tw("walking-calories-calculator.statSpeed")}
                  value={`${formatter.format(result.speedKmh)} ${tw("walking-calories-calculator.unitSpeed")}`}
                />
                <Stat
                  label={tw("walking-calories-calculator.statMet")}
                  value={`${formatter.format(result.met)} ${tw("walking-calories-calculator.unitMet")}`}
                />
                <Stat
                  label={tw("walking-calories-calculator.statWeight")}
                  value={`${formatter.format(result.weightKg)} ${tw("walking-calories-calculator.kg")}`}
                />
              </dl>

              <p className="tp-tool-hint">{tw("walking-calories-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
