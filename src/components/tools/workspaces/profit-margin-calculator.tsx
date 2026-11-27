"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
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
  calculateProfit,
  DEFAULTS,
  TARGET_LIMITS,
  type ProfitMode,
} from "./profit-margin-calculator.logic";

const ERROR_ID = "tp-profit-margin-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function ProfitMarginCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const { options, update, reset: resetOptions } = usePersistedOptions<{ mode: ProfitMode }>(
    "toolpika:profit-margin-calculator",
    { mode: DEFAULTS.mode },
  );
  const mode = options.mode;

  const [cost, setCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [target, setTarget] = useState("");

  const parsedCost = parseValue(cost);
  const parsedPrice = parseValue(sellingPrice);
  const parsedTarget = parseValue(target);
  const hasValues = cost.trim() !== "" && sellingPrice.trim() !== "" && target.trim() !== "";
  const invalid = [cost, sellingPrice, target].some(
    (value) => value.trim() !== "" && parseValue(value) === null,
  );

  const calculation = useMemo(
    () =>
      parsedCost !== null && parsedPrice !== null && parsedTarget !== null
        ? calculateProfit({
            cost: parsedCost,
            sellingPrice: parsedPrice,
            mode,
            target: parsedTarget,
          })
        : null,
    [parsedCost, parsedPrice, parsedTarget, mode],
  );

  const errorCode = calculation?.error?.code;
  const errorText = invalid || errorCode === "INVALID_NUMBER"
    ? `${tw("profit-margin-calculator.errorInvalid")} ${tw("profit-margin-calculator.fixInvalid")}`
    : errorCode === "ZERO_VALUE"
      ? `${tw("profit-margin-calculator.errorZero")} ${tw("profit-margin-calculator.fixZero")}`
      : errorCode === "TARGET_RANGE"
        ? `${tw("profit-margin-calculator.errorTarget")} ${tw("profit-margin-calculator.fixTarget", { max: TARGET_LIMITS[mode] })}`
        : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = hasValues && !!calculation && !calculation.error && !invalid;

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }),
    [locale],
  );
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation) return "";
    return [
      tw("profit-margin-calculator.summaryLabel"),
      `${tw("profit-margin-calculator.heroLabel")}: ${money.format(calculation.netProfit)}`,
      `${tw("profit-margin-calculator.marginLabel")}: ${percent.format(calculation.grossMargin)}%`,
      `${tw("profit-margin-calculator.markupLabel")}: ${percent.format(calculation.markup)}%`,
      `${tw("profit-margin-calculator.targetPriceLabel")}: ${money.format(calculation.targetPrice)}`,
      `${tw("profit-margin-calculator.gapLabel")}: ${money.format(calculation.gap)}`,
      "",
      tw("profit-margin-calculator.marginFormula"),
      tw("profit-margin-calculator.markupFormula"),
    ].join("\n");
  }, [ready, calculation, money, percent, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    update({ mode: DEFAULTS.mode });
    setCost(String(DEFAULTS.cost));
    setSellingPrice(String(DEFAULTS.sellingPrice));
    setTarget(String(DEFAULTS.target));
  };

  const handleReset = () => {
    resetOptions();
    setCost("");
    setSellingPrice("");
    setTarget("");
  };

  const modeChanged = (next: ProfitMode) => {
    update({ mode: next });
  };

  const targetLabel = mode === "margin"
    ? tw("profit-margin-calculator.targetMarginLabel")
    : tw("profit-margin-calculator.targetMarkupLabel");
  const targetHint = mode === "margin"
    ? tw("profit-margin-calculator.targetMarginHint")
    : tw("profit-margin-calculator.targetMarkupHint");

  return (
    <ToolShell
      title={tw("profit-margin-calculator.title")}
      icon="Calculator"
      sampleLabel={tw("profit-margin-calculator.trySample")}
      resetLabel={tw("profit-margin-calculator.reset")}
      privacyLabel={tw("profit-margin-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-profit-input-title"
          title={tw("profit-margin-calculator.inputTitle")}
          hint={tw("profit-margin-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<ProfitMode>
              label={tw("profit-margin-calculator.modeLabel")}
              value={mode}
              options={[
                { value: "margin", label: tw("profit-margin-calculator.modeMargin") },
                { value: "markup", label: tw("profit-margin-calculator.modeMarkup") },
              ]}
              onChange={modeChanged}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("profit-margin-calculator.costLabel")}
              htmlFor="tp-profit-cost"
              hint={tw("profit-margin-calculator.costHint")}
            >
              <NumberStepper
                id="tp-profit-cost"
                value={cost}
                min={0}
                step={1}
                inputMode="decimal"
                ariaLabel={tw("profit-margin-calculator.costLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setCost}
              />
            </ToolField>

            <ToolField
              label={tw("profit-margin-calculator.priceLabel")}
              htmlFor="tp-profit-price"
              hint={tw("profit-margin-calculator.priceHint")}
            >
              <NumberStepper
                id="tp-profit-price"
                value={sellingPrice}
                min={0}
                step={1}
                inputMode="decimal"
                ariaLabel={tw("profit-margin-calculator.priceLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setSellingPrice}
              />
            </ToolField>
          </div>

          <ToolField
            label={targetLabel}
            htmlFor="tp-profit-target"
            hint={targetHint}
          >
            <NumberStepper
              id="tp-profit-target"
              value={target}
              min={0}
              max={TARGET_LIMITS[mode]}
              step={1}
              inputMode="decimal"
              ariaLabel={targetLabel}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setTarget}
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
          id="tp-profit-result-title"
          title={t("result")}
          hint={tw("profit-margin-calculator.resultHint")}
          result
          actions={
            <>
              {ready && calculation ? (
                <ToolBadge tone={calculation.netProfit >= 0 ? "success" : "danger"}>
                  {calculation.netProfit >= 0
                    ? tw("profit-margin-calculator.profitLabel")
                    : tw("profit-margin-calculator.lossLabel")}
                </ToolBadge>
              ) : null}
              <CopyButton
                text={reportText}
                label={tw("profit-margin-calculator.copyResult")}
                copiedLabel={t("copied")}
              />
            </>
          }
        >
          {!ready || !calculation ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={errorText
                  ? tw("profit-margin-calculator.errorTitle")
                  : tw("profit-margin-calculator.emptyTitle")}
                hint={errorText
                  ? tw("profit-margin-calculator.errorEmptyHint")
                  : tw("profit-margin-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("profit-margin-calculator.heroLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {money.format(calculation.netProfit)}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("profit-margin-calculator.marginLabel")}
                  value={`${percent.format(calculation.grossMargin)}%`}
                />
                <Stat
                  label={tw("profit-margin-calculator.markupLabel")}
                  value={`${percent.format(calculation.markup)}%`}
                />
                <Stat
                  label={tw("profit-margin-calculator.targetPriceLabel")}
                  value={money.format(calculation.targetPrice)}
                />
                <Stat
                  label={tw("profit-margin-calculator.gapLabel")}
                  value={money.format(calculation.gap)}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("profit-margin-calculator.formulaTitle")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">
                    {`${tw("profit-margin-calculator.marginFormula")}\n${tw("profit-margin-calculator.markupFormula")}`}
                  </code>
                </div>
                <p className="tp-tool-hint">{tw("profit-margin-calculator.marginVsMarkup")}</p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
