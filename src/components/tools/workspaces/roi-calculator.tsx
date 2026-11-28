"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import {
  CopyButton,
  HeroValue,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateRoi,
  type RoiErrorCode,
} from "./roi-calculator.logic";

const ERROR_ID = "tp-roi-error";

export default function RoiCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [investment, setInvestment] = useState("");
  const [profit, setProfit] = useState("");
  const [years, setYears] = useState("");

  const calculation = useMemo(
    () => calculateRoi({ investment, profit, years }),
    [investment, profit, years],
  );

  const errorText = (() => {
    const code: RoiErrorCode | undefined = calculation.error?.code;
    switch (code) {
      case "EMPTY_INVESTMENT":
        return `${tw("roi-calculator.errorEmptyInvestment")} ${tw("roi-calculator.fixInvestment")}`;
      case "INVALID_INVESTMENT":
        return `${tw("roi-calculator.errorInvalidInvestment")} ${tw("roi-calculator.fixInvestment")}`;
      case "ZERO_INVESTMENT":
        return `${tw("roi-calculator.errorZeroInvestment")} ${tw("roi-calculator.fixInvestment")}`;
      case "EMPTY_PROFIT":
        return `${tw("roi-calculator.errorEmptyProfit")} ${tw("roi-calculator.fixProfit")}`;
      case "INVALID_PROFIT":
        return `${tw("roi-calculator.errorInvalidProfit")} ${tw("roi-calculator.fixProfit")}`;
      case "EMPTY_YEARS":
        return `${tw("roi-calculator.errorEmptyYears")} ${tw("roi-calculator.fixYears")}`;
      case "INVALID_YEARS":
        return `${tw("roi-calculator.errorInvalidYears")} ${tw("roi-calculator.fixYears")}`;
      case "YEARS_OUT_OF_RANGE":
        return `${tw("roi-calculator.errorYearsRange")} ${tw("roi-calculator.fixYears")}`;
      default:
        return "";
    }
  })();

  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = !errorText && calculation.roi !== null;

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
    [locale],
  );
  const number = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const reportText = useMemo(() => {
    if (!ready) return "";
    return [
      tw("roi-calculator.reportTitle"),
      `${tw("roi-calculator.heroLabel")}: ${number.format(calculation.roi ?? 0)}%`,
      `${tw("roi-calculator.netGainLabel")}: ${nf.format(calculation.netGain ?? 0)}`,
      `${tw("roi-calculator.endingLabel")}: ${nf.format(calculation.endingValue ?? 0)}`,
      `${tw("roi-calculator.multipleLabel")}: ${number.format(calculation.multiple ?? 0)}x`,
      `${tw("roi-calculator.cagrLabel")}: ${calculation.cagr === null ? tw("roi-calculator.notAvailable") : `${number.format(calculation.cagr)}%`}`,
    ].join("\n");
  }, [ready, calculation, number, nf, tw]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setInvestment("10000");
    setProfit("4500");
    setYears("3");
  };

  const handleReset = () => {
    setInvestment("");
    setProfit("");
    setYears("");
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
      title={tw("roi-calculator.title")}
      icon="TrendingUp"
      subtitle={tw("roi-calculator.subtitle")}
      sampleLabel={tw("roi-calculator.trySample")}
      resetLabel={tw("roi-calculator.reset")}
      privacyLabel={tw("roi-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-roi-input-title"
          title={tw("roi-calculator.inputTitle")}
          hint={tw("roi-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("roi-calculator.investmentLabel")}
              htmlFor="tp-roi-investment"
              hint={tw("roi-calculator.investmentHint")}
            >
              <NumberStepper
                id="tp-roi-investment"
                value={investment}
                ariaLabel={tw("roi-calculator.investmentLabel")}
                onValueChange={setInvestment}
                {...stepperProps}
              />
            </ToolField>
            <ToolField
              label={tw("roi-calculator.profitLabel")}
              htmlFor="tp-roi-profit"
              hint={tw("roi-calculator.profitHint")}
            >
              <NumberStepper
                id="tp-roi-profit"
                value={profit}
                ariaLabel={tw("roi-calculator.profitLabel")}
                onValueChange={setProfit}
                {...stepperProps}
              />
            </ToolField>
            <ToolField
              label={tw("roi-calculator.yearsLabel")}
              htmlFor="tp-roi-years"
              hint={tw("roi-calculator.yearsHint")}
            >
              <NumberStepper
                id="tp-roi-years"
                value={years}
                ariaLabel={tw("roi-calculator.yearsLabel")}
                onValueChange={setYears}
                max={100}
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
          id="tp-roi-result-title"
          title={t("result")}
          hint={tw("roi-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<TrendingUp aria-hidden="true" />}
                title={errorText ? tw("roi-calculator.errorTitle") : tw("roi-calculator.emptyTitle")}
                hint={errorText ? tw("roi-calculator.errorEmptyHint") : tw("roi-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("roi-calculator.heroLabel")}
                value={`${number.format(calculation.roi ?? 0)}%`}
                note={tw("roi-calculator.heroNote")}
              />
              <dl className="tp-tool-stats">
                <Stat label={tw("roi-calculator.netGainLabel")} value={nf.format(calculation.netGain ?? 0)} />
                <Stat label={tw("roi-calculator.endingLabel")} value={nf.format(calculation.endingValue ?? 0)} />
                <Stat label={tw("roi-calculator.multipleLabel")} value={`${number.format(calculation.multiple ?? 0)}x`} />
                <Stat
                  label={tw("roi-calculator.cagrLabel")}
                  value={calculation.cagr === null
                    ? tw("roi-calculator.notAvailable")
                    : `${number.format(calculation.cagr)}%`}
                />
              </dl>
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("roi-calculator.formulaTitle")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{tw("roi-calculator.formula")}</code>
                </div>
                <p className="tp-tool-hint">{tw("roi-calculator.formulaNote")}</p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
