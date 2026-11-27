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
  calculateBreakEven,
  DEFAULTS,
} from "./break-even-calculator.logic";

const ERROR_ID = "tp-break-even-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function BreakEvenCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [fixed, setFixed] = useState("");
  const [price, setPrice] = useState("");
  const [variable, setVariable] = useState("");

  const rawValues = [fixed, price, variable];
  const parsedFixed = parseValue(fixed);
  const parsedPrice = parseValue(price);
  const parsedVariable = parseValue(variable);
  const hasValues = rawValues.every((value) => value.trim() !== "");
  const invalid = rawValues.some(
    (value) => value.trim() !== "" && parseValue(value) === null,
  );

  const calculation = useMemo(
    () =>
      parsedFixed !== null && parsedPrice !== null && parsedVariable !== null
        ? calculateBreakEven({
            fixedCosts: parsedFixed,
            pricePerUnit: parsedPrice,
            variableCostPerUnit: parsedVariable,
          })
        : null,
    [parsedFixed, parsedPrice, parsedVariable],
  );

  const errorCode = calculation?.error?.code;
  const errorText = invalid || errorCode === "INVALID_NUMBER"
    ? `${tw("break-even-calculator.errorInvalid")} ${tw("break-even-calculator.fixInvalid")}`
    : errorCode === "ZERO_MARGIN"
      ? `${tw("break-even-calculator.errorZeroMargin")} ${tw("break-even-calculator.fixZeroMargin")}`
      : errorCode === "NEGATIVE_MARGIN"
        ? `${tw("break-even-calculator.errorNegativeMargin")} ${tw("break-even-calculator.fixNegativeMargin")}`
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
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation) return "";
    return [
      tw("break-even-calculator.summaryLabel"),
      `${tw("break-even-calculator.heroLabel")}: ${number.format(calculation.units)}`,
      `${tw("break-even-calculator.revenueLabel")}: ${money.format(calculation.revenue)}`,
      `${tw("break-even-calculator.exactLabel")}: ${number.format(calculation.exactUnits)}`,
      `${tw("break-even-calculator.contributionLabel")}: ${money.format(calculation.contribution)}`,
      `${tw("break-even-calculator.ratioLabel")}: ${percent.format(calculation.ratio)}%`,
      "",
      tw("break-even-calculator.formula"),
    ].join("\n");
  }, [ready, calculation, money, number, percent, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setFixed(String(DEFAULTS.fixedCosts));
    setPrice(String(DEFAULTS.pricePerUnit));
    setVariable(String(DEFAULTS.variableCostPerUnit));
  };

  const handleReset = () => {
    setFixed("");
    setPrice("");
    setVariable("");
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
      title={tw("break-even-calculator.title")}
      icon="Calculator"
      sampleLabel={tw("break-even-calculator.trySample")}
      resetLabel={tw("break-even-calculator.reset")}
      privacyLabel={tw("break-even-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-break-even-input-title"
          title={tw("break-even-calculator.inputTitle")}
          hint={tw("break-even-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("break-even-calculator.fixedLabel")}
              htmlFor="tp-break-even-fixed"
              hint={tw("break-even-calculator.fixedHint")}
            >
              <NumberStepper
                id="tp-break-even-fixed"
                value={fixed}
                ariaLabel={tw("break-even-calculator.fixedLabel")}
                onValueChange={setFixed}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("break-even-calculator.priceLabel")}
              htmlFor="tp-break-even-price"
              hint={tw("break-even-calculator.priceHint")}
            >
              <NumberStepper
                id="tp-break-even-price"
                value={price}
                ariaLabel={tw("break-even-calculator.priceLabel")}
                onValueChange={setPrice}
                {...stepperProps}
              />
            </ToolField>

            <ToolField
              label={tw("break-even-calculator.variableLabel")}
              htmlFor="tp-break-even-variable"
              hint={tw("break-even-calculator.variableHint")}
            >
              <NumberStepper
                id="tp-break-even-variable"
                value={variable}
                ariaLabel={tw("break-even-calculator.variableLabel")}
                onValueChange={setVariable}
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
          id="tp-break-even-result-title"
          title={t("result")}
          hint={tw("break-even-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={tw("break-even-calculator.copyResult")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={errorText
                  ? tw("break-even-calculator.errorTitle")
                  : tw("break-even-calculator.emptyTitle")}
                hint={errorText
                  ? tw("break-even-calculator.errorEmptyHint")
                  : tw("break-even-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("break-even-calculator.heroLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {number.format(calculation.units)}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("break-even-calculator.revenueLabel")}
                  value={money.format(calculation.revenue)}
                />
                <Stat
                  label={tw("break-even-calculator.exactLabel")}
                  value={number.format(calculation.exactUnits)}
                />
                <Stat
                  label={tw("break-even-calculator.contributionLabel")}
                  value={money.format(calculation.contribution)}
                />
                <Stat
                  label={tw("break-even-calculator.ratioLabel")}
                  value={`${percent.format(calculation.ratio)}%`}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("break-even-calculator.formulaTitle")}
                </span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{tw("break-even-calculator.formula")}</code>
                </div>
                <p className="tp-tool-hint">
                  {tw("break-even-calculator.marginNote")}
                </p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
