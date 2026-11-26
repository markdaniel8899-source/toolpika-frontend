"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Gauge, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToggleSwitch,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateBmi,
  DEFAULTS,
  formatBmiReport,
  type BmiCategory,
  type BmiErrorCode,
  type UnitSystem,
} from "./bmi-calculator.logic";

const ERROR_ID = "tp-bmi-error";

const BADGE_TONE: Record<BmiCategory, "success" | "warning" | "danger"> = {
  underweight: "warning",
  healthy: "success",
  overweight: "warning",
  obese: "danger",
};

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function BmiCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [showHealthyRange, setShowHealthyRange] = useState(true);
  const { options, update, reset: resetOptions } = usePersistedOptions<{ system: UnitSystem }>(
    "toolpika:bmi-calculator",
    { system: DEFAULTS.system },
  );
  const system = options.system;

  const parsedWeight = parseValue(weight);
  const parsedHeight = parseValue(height);
  const hasValues = weight.trim().length > 0 && height.trim().length > 0;
  const invalid = (weight.trim().length > 0 && parsedWeight === null) ||
    (height.trim().length > 0 && parsedHeight === null);

  const calculation = useMemo(
    () =>
      parsedWeight !== null && parsedHeight !== null
        ? calculateBmi(parsedWeight, parsedHeight, system)
        : null,
    [parsedWeight, parsedHeight, system],
  );

  const errorCode: BmiErrorCode | undefined = calculation?.error?.code;
  const errorText = invalid
    ? `${tw("bmi-calculator.errorInvalid")} ${tw("bmi-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("bmi-calculator.errorRange")} ${tw("bmi-calculator.fixRange")}`
      : errorCode === "INVALID_NUMBER"
        ? `${tw("bmi-calculator.errorInvalid")} ${tw("bmi-calculator.fixInvalid")}`
        : "";
  const ready = hasValues && !!calculation && !calculation.error && !invalid;
  const describedBy = errorText ? ERROR_ID : undefined;

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  );

  const categoryLabel = useCallback(
    (category: BmiCategory) => {
      switch (category) {
        case "underweight":
          return tw("bmi-calculator.categoryUnderweight");
        case "healthy":
          return tw("bmi-calculator.categoryHealthy");
        case "overweight":
          return tw("bmi-calculator.categoryOverweight");
        case "obese":
          return tw("bmi-calculator.categoryObese");
      }
    },
    [tw],
  );

  const reportText = useMemo(
    () =>
      ready && calculation
        ? formatBmiReport(calculation, categoryLabel(calculation.category), {
            title: tw("bmi-calculator.reportTitle"),
            bmi: tw("bmi-calculator.reportBmi"),
            category: tw("bmi-calculator.reportCategory"),
            healthy: tw("bmi-calculator.reportHealthy"),
            formula: tw("bmi-calculator.reportFormula"),
            note: tw("bmi-calculator.reportNote"),
            unit: system === "metric"
              ? tw("bmi-calculator.unitKg")
              : tw("bmi-calculator.unitLb"),
          })
        : "",
    [ready, calculation, categoryLabel, tw, system],
  );

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ system: DEFAULTS.system });
    setWeight(String(DEFAULTS.weight));
    setHeight(String(DEFAULTS.height));
    setShowHealthyRange(true);
  };

  const handleReset = () => {
    resetOptions();
    setWeight("");
    setHeight("");
    setShowHealthyRange(true);
  };

  const weightLabel = system === "metric"
    ? tw("bmi-calculator.weightKgLabel")
    : tw("bmi-calculator.weightLbLabel");
  const heightLabel = system === "metric"
    ? tw("bmi-calculator.heightCmLabel")
    : tw("bmi-calculator.heightInLabel");

  return (
    <ToolShell
      title={tw("bmi-calculator.title")}
      icon="Gauge"
      sampleLabel={tw("bmi-calculator.trySample")}
      resetLabel={tw("bmi-calculator.reset")}
      privacyLabel={tw("bmi-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-bmi-input-title"
          title={tw("bmi-calculator.inputTitle")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setWeight("");
                setHeight("");
              }}
              disabled={!weight && !height}
              aria-label={t("clear")}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<UnitSystem>
              label={tw("bmi-calculator.unitLabel")}
              value={system}
              options={[
                { value: "metric", label: tw("bmi-calculator.metric") },
                { value: "imperial", label: tw("bmi-calculator.imperial") },
              ]}
              onChange={(next) => {
                update({ system: next });
                setWeight("");
                setHeight("");
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={weightLabel} htmlFor="tp-bmi-weight">
              <NumberStepper
                id="tp-bmi-weight"
                value={weight}
                min={0}
                step={system === "metric" ? 0.5 : 1}
                inputMode="decimal"
                ariaLabel={weightLabel}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setWeight}
              />
            </ToolField>
            <ToolField label={heightLabel} htmlFor="tp-bmi-height">
              <NumberStepper
                id="tp-bmi-height"
                value={height}
                min={0}
                step={1}
                inputMode="decimal"
                ariaLabel={heightLabel}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setHeight}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-bmi-show-healthy-range"
                label={tw("bmi-calculator.showHealthyRange")}
                checked={showHealthyRange}
                onChange={() => setShowHealthyRange((previous) => !previous)}
              />
              <label htmlFor="tp-bmi-show-healthy-range" className="tp-check-label">
                {tw("bmi-calculator.showHealthyRange")}
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
          id="tp-bmi-result-title"
          title={t("result")}
          result
          actions={
            <>
              {ready && calculation ? (
                <ToolBadge tone={BADGE_TONE[calculation.category]}>
                  {categoryLabel(calculation.category)}
                </ToolBadge>
              ) : null}
              <CopyButton
                text={reportText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={reportText}
                fileName="bmi-report.txt"
                label={t("download")}
              />
            </>
          }
        >
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Gauge aria-hidden="true" />}
                title={
                  errorText
                    ? tw("bmi-calculator.errorTitle")
                    : tw("bmi-calculator.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("bmi-calculator.emptyErrorHint")
                    : tw("bmi-calculator.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("bmi-calculator.bmiLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {formatter.format(calculation.bmi)}
                </output>
              </div>

              {showHealthyRange ? (
                <dl className="tp-tool-stats">
                  <Stat
                    label={tw("bmi-calculator.healthyRangeLabel")}
                    value={`${formatter.format(calculation.healthyWeight.min)} - ${formatter.format(calculation.healthyWeight.max)} ${system === "metric" ? tw("bmi-calculator.unitKg") : tw("bmi-calculator.unitLb")}`}
                  />
                </dl>
              ) : null}

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("bmi-calculator.formulaTitle")}</span>
                <div className="tp-tool-url">
                  <code dir="ltr">{calculation.formula}</code>
                </div>
              </div>

              <p className="tp-tool-hint">{tw("bmi-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
