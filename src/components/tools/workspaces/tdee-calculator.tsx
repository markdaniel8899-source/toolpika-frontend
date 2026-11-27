"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity } from "lucide-react";
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
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  ACTIVITY_LEVELS,
  calculateTdee,
  DEFAULTS,
  formatTdeeReport,
  type ActivityLevel,
  type Profile,
  type TdeeError,
} from "./tdee-calculator.logic";

const ERROR_ID = "tp-tdee-error";

// A neutral worked example, never a recommended intake.
const INITIAL = { age: 30, height: 175, weight: 75, profile: "male" as Profile, activity: "moderate" as ActivityLevel };

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function TdeeCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const { options, update, reset: resetOptions } = usePersistedOptions<{
    profile: Profile;
    activity: ActivityLevel;
  }>("toolpika:tdee-calculator", {
    profile: DEFAULTS.profile,
    activity: DEFAULTS.activity,
  });
  const profile = options.profile;
  const activity = options.activity;

  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const parsedAge = parseValue(age);
  const parsedHeight = parseValue(height);
  const parsedWeight = parseValue(weight);
  const allFilled = age.trim().length > 0 && height.trim().length > 0 && weight.trim().length > 0;
  const invalid = [age, height, weight].some(
    (value) => value.trim().length > 0 && parseValue(value) === null,
  );

  const calculation = useMemo(
    () =>
      parsedAge !== null && parsedHeight !== null && parsedWeight !== null
        ? calculateTdee({
            age: parsedAge,
            height: parsedHeight,
            weight: parsedWeight,
            profile,
            activity,
          })
        : null,
    [parsedAge, parsedHeight, parsedWeight, profile, activity],
  );

  const errorCode: TdeeError | undefined = calculation?.error;
  const errorText = invalid
    ? `${tw("tdee-calculator.errorInvalid")} ${tw("tdee-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("tdee-calculator.errorRange")} ${tw("tdee-calculator.fixRange")}`
      : errorCode === "INVALID_NUMBER"
        ? `${tw("tdee-calculator.errorInvalid")} ${tw("tdee-calculator.fixInvalid")}`
        : "";
  const ready = Boolean(allFilled && calculation && !calculation.error && !invalid);
  const describedBy = errorText ? ERROR_ID : undefined;

  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const factorFormat = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }),
    [locale],
  );

  const profileLabel = useCallback(
    (value: Profile) =>
      value === "female"
        ? tw("tdee-calculator.profileFemale")
        : tw("tdee-calculator.profileMale"),
    [tw],
  );

  const activityLabel = useCallback(
    (value: ActivityLevel) => {
      switch (value) {
        case "sedentary":
          return tw("tdee-calculator.activitySedentary");
        case "light":
          return tw("tdee-calculator.activityLight");
        case "moderate":
          return tw("tdee-calculator.activityModerate");
        case "active":
          return tw("tdee-calculator.activityActive");
        case "veryActive":
          return tw("tdee-calculator.activityVeryActive");
      }
    },
    [tw],
  );

  const activityOptions = useMemo(
    () =>
      ACTIVITY_LEVELS.map((level) => ({
        value: level,
        label: activityLabel(level),
      })),
    [activityLabel],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation) return "";
    const report = formatTdeeReport(calculation, {
      title: tw("tdee-calculator.reportTitle"),
      bmr: tw("tdee-calculator.bmrLabel"),
      factor: tw("tdee-calculator.factorLabel"),
      tdee: tw("tdee-calculator.tdeeLabel"),
      maintenance: tw("tdee-calculator.maintenanceLabel"),
      cut: tw("tdee-calculator.cutLabel"),
      gain: tw("tdee-calculator.gainLabel"),
      formula: tw("tdee-calculator.formulaTitle"),
      unit: tw("tdee-calculator.unitKcal"),
      note: tw("tdee-calculator.referenceNote"),
    });
    return [
      `${tw("tdee-calculator.profileLabel")}: ${profileLabel(profile)}`,
      `${tw("tdee-calculator.activityLabel")}: ${activityLabel(activity)}`,
      report,
    ].join("\n");
  }, [ready, calculation, tw, profileLabel, activityLabel, profile, activity]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ profile: INITIAL.profile, activity: INITIAL.activity });
    setAge(String(INITIAL.age));
    setHeight(String(INITIAL.height));
    setWeight(String(INITIAL.weight));
  };

  const handleReset = () => {
    resetOptions();
    setAge("");
    setHeight("");
    setWeight("");
  };

  return (
    <ToolShell
      title={tw("tdee-calculator.title")}
      icon="Activity"
      sampleLabel={tw("tdee-calculator.trySample")}
      resetLabel={tw("tdee-calculator.reset")}
      privacyLabel={tw("tdee-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-tdee-input-title"
          title={tw("tdee-calculator.inputTitle")}
          hint={tw("tdee-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<Profile>
              label={tw("tdee-calculator.profileLabel")}
              value={profile}
              options={[
                { value: "female", label: tw("tdee-calculator.profileFemale") },
                { value: "male", label: tw("tdee-calculator.profileMale") },
              ]}
              onChange={(next) => update({ profile: next })}
            />
            <p className="tp-tool-hint">{tw("tdee-calculator.profileHint")}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ToolField
              label={tw("tdee-calculator.ageLabel")}
              htmlFor="tp-tdee-age"
              hint={tw("tdee-calculator.ageHint")}
            >
              <NumberStepper
                id="tp-tdee-age"
                value={age}
                min={16}
                max={120}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("tdee-calculator.ageLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setAge}
              />
            </ToolField>
            <ToolField
              label={tw("tdee-calculator.heightLabel")}
              htmlFor="tp-tdee-height"
              hint={tw("tdee-calculator.heightHint")}
            >
              <NumberStepper
                id="tp-tdee-height"
                value={height}
                min={120}
                max={250}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("tdee-calculator.heightLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setHeight}
              />
            </ToolField>
            <ToolField
              label={tw("tdee-calculator.weightLabel")}
              htmlFor="tp-tdee-weight"
              hint={tw("tdee-calculator.weightHint")}
            >
              <NumberStepper
                id="tp-tdee-weight"
                value={weight}
                min={30}
                max={500}
                step={0.5}
                inputMode="decimal"
                ariaLabel={tw("tdee-calculator.weightLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setWeight}
              />
            </ToolField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("tdee-calculator.activityLabel")}
              htmlFor="tp-tdee-activity"
              hint={tw("tdee-calculator.activityHint")}
            >
              <ThemedSelect
                value={activity}
                ariaLabel={tw("tdee-calculator.activityLabel")}
                options={activityOptions}
                onValueChange={(next) => update({ activity: next as ActivityLevel })}
              />
            </ToolField>
          </div>

          <p className="tp-tool-hint">{tw("tdee-calculator.referenceNote")}</p>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-tdee-result-title"
          title={t("result")}
          actions={
            <>
              {ready && calculation ? (
                <ToolBadge tone="accent">{activityLabel(activity)}</ToolBadge>
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
                icon={<Activity aria-hidden="true" />}
                title={
                  errorText
                    ? tw("tdee-calculator.errorTitle")
                    : tw("tdee-calculator.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("tdee-calculator.emptyErrorHint")
                    : tw("tdee-calculator.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("tdee-calculator.tdeeLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {whole.format(Math.round(calculation.tdee))} {tw("tdee-calculator.unitKcal")}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("tdee-calculator.bmrLabel")}
                  value={`${whole.format(Math.round(calculation.bmr))} ${tw("tdee-calculator.unitKcal")}`}
                />
                <Stat
                  label={tw("tdee-calculator.factorLabel")}
                  value={factorFormat.format(calculation.factor)}
                />
                <Stat
                  label={tw("tdee-calculator.maintenanceLabel")}
                  value={`${whole.format(Math.round(calculation.maintenance))} ${tw("tdee-calculator.unitKcal")}`}
                />
                <Stat
                  label={tw("tdee-calculator.cutLabel")}
                  value={`${whole.format(Math.round(calculation.cut))} ${tw("tdee-calculator.unitKcal")}`}
                />
                <Stat
                  label={tw("tdee-calculator.gainLabel")}
                  value={`${whole.format(Math.round(calculation.gain))} ${tw("tdee-calculator.unitKcal")}`}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("tdee-calculator.formulaTitle")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">
                    {`${calculation.bmrFormula}\n${calculation.tdeeFormula}`}
                  </code>
                </div>
                <p className="tp-tool-hint">{tw("tdee-calculator.formulaHint")}</p>
              </div>

              <p className="tp-tool-hint">{tw("tdee-calculator.footnote")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
