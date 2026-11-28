"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  ToolBadge,
  ToolEmpty,
  ToolField,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import { calculateRoi, type RoiErrorCode } from "./roi-calculator.logic";

const ERROR_ID = "tp-roi-error";

export default function RoiCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [investment, setInvestment] = useState("");
  const [returnedValue, setReturnedValue] = useState("");
  const [years, setYears] = useState("");

  const calculation = useMemo(
    () => calculateRoi({ investment, returnedValue, years }),
    [investment, returnedValue, years],
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
      case "EMPTY_RETURNED":
        return `${tw("roi-calculator.errorEmptyReturned")} ${tw("roi-calculator.fixReturned")}`;
      case "INVALID_RETURNED":
        return `${tw("roi-calculator.errorInvalidReturned")} ${tw("roi-calculator.fixReturned")}`;
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
  const roi = calculation.roi ?? 0;
  const positive = roi >= 0;

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
      `${tw("roi-calculator.heroLabel")}: ${number.format(roi)}%`,
      `${tw("roi-calculator.netProfitLabel")}: ${nf.format(calculation.netGain ?? 0)}`,
      `${tw("roi-calculator.endingLabel")}: ${nf.format(calculation.endingValue ?? 0)}`,
      `${tw("roi-calculator.multipleLabel")}: ${number.format(calculation.multiple ?? 0)}x`,
      `${tw("roi-calculator.cagrLabel")}: ${calculation.cagr === null ? tw("roi-calculator.notAvailable") : `${number.format(calculation.cagr)}%`}`,
    ].join("\n");
  }, [ready, roi, calculation, number, nf, tw]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setInvestment("10000");
    setReturnedValue("14500");
    setYears("3");
  };

  const handleClear = () => {
    setInvestment("");
    setReturnedValue("");
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
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="TrendingUp" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("roi-calculator.title")}</span>
            <span className="tp-tool-subtitle">{tw("roi-calculator.subtitle")}</span>
          </span>
        </div>
        <ToolBadge tone={positive ? "success" : "danger"}>
          {positive ? tw("roi-calculator.gainBadge") : tw("roi-calculator.lossBadge")}
        </ToolBadge>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-roi-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-roi-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("roi-calculator.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("roi-calculator.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
                {tw("roi-calculator.trySample")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

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
              label={tw("roi-calculator.returnedLabel")}
              htmlFor="tp-roi-returned"
              hint={tw("roi-calculator.returnedHint")}
            >
              <NumberStepper
                id="tp-roi-returned"
                value={returnedValue}
                ariaLabel={tw("roi-calculator.returnedLabel")}
                onValueChange={setReturnedValue}
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

          <div className="tp-meta-pill" aria-live="polite">
            <span>{tw("roi-calculator.investmentLabel")}</span>
            <strong dir="ltr">{investment || "0"}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("roi-calculator.returnedLabel")}</span>
            <strong dir="ltr">{returnedValue || "0"}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("roi-calculator.yearsLabel")}</span>
            <strong dir="ltr">{years || "0"}</strong>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-notice" data-tone="danger" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 self-start overflow-auto lg:col-span-6 lg:sticky lg:top-4"
          aria-labelledby="tp-roi-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-roi-result-title" className="text-sm font-semibold text-[var(--text)]">
                {t("result")}
              </h3>
              <p className="tp-tool-hint">{tw("roi-calculator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={reportText || null}
                fileName={tw("roi-calculator.downloadFileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {ready ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <div className="tp-hero-value">
                <span className="tp-tool-label">{tw("roi-calculator.heroLabel")}</span>
                <output
                  dir="ltr"
                  className="tp-hero-value-text"
                  style={{ color: positive ? "var(--success)" : "var(--danger)" }}
                >
                  {`${number.format(roi)}%`}
                </output>
                <span className="tp-hero-value-note">{tw("roi-calculator.heroNote")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="tp-meta-pill">
                  <span>{tw("roi-calculator.netProfitLabel")}</span>
                  <strong dir="ltr">{nf.format(calculation.netGain ?? 0)}</strong>
                </div>
                <div className="tp-meta-pill">
                  <span>{tw("roi-calculator.cagrLabel")}</span>
                  <strong dir="ltr">
                    {calculation.cagr === null
                      ? tw("roi-calculator.notAvailable")
                      : `${number.format(calculation.cagr)}%`}
                  </strong>
                </div>
                <div className="tp-meta-pill">
                  <span>{tw("roi-calculator.multipleLabel")}</span>
                  <strong dir="ltr">{`${number.format(calculation.multiple ?? 0)}x`}</strong>
                </div>
              </div>
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("roi-calculator.formulaTitle")}</span>
                <div className="tp-output-viewer whitespace-pre-line" role="region" aria-label={tw("roi-calculator.formulaTitle")}>
                  <code dir="ltr">{tw("roi-calculator.formulaReturned")}</code>
                </div>
                <p className="tp-tool-hint">{tw("roi-calculator.formulaNote")}</p>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="TrendingUp" />}
                title={errorText ? tw("roi-calculator.errorTitle") : tw("roi-calculator.emptyTitle")}
                hint={errorText ? tw("roi-calculator.errorEmptyHint") : tw("roi-calculator.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("roi-calculator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
