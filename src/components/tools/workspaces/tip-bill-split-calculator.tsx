"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
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
  useCopyFeedback,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateSplit,
  DEFAULTS,
  MAX_PEOPLE,
  type SplitInput,
} from "./tip-bill-split-calculator.logic";

const ERROR_ID = "tp-tip-split-error";
const RESULT_ERROR_ID = "tp-tip-split-result-error";
const CUSTOM = "custom";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function TipBillSplitCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [bill, setBill] = useState("");
  const [preset, setPreset] = useState("18");
  const [customTip, setCustomTip] = useState("");
  const [split, setSplit] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [includeTax, setIncludeTax] = useState(false);
  const [roundPerPerson, setRoundPerPerson] = useState(false);
  const { copy, reset } = useCopyFeedback();

  const tipOptions = useMemo(
    () => [
      { value: "0", label: tw("tip-bill-split-calculator.tip0") },
      { value: "15", label: tw("tip-bill-split-calculator.tip15") },
      { value: "18", label: tw("tip-bill-split-calculator.tip18") },
      { value: "20", label: tw("tip-bill-split-calculator.tip20") },
      { value: CUSTOM, label: tw("tip-bill-split-calculator.tipCustom") },
    ],
    [tw],
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const parsedBill = parseValue(bill);
  const parsedSplit = parseValue(split);
  const parsedTip = preset === CUSTOM ? parseValue(customTip) : Number(preset);
  const parsedTax = parseValue(taxRate);

  const invalidBill = bill.trim().length > 0 && parsedBill === null;
  const invalidTip =
    preset === CUSTOM && customTip.trim().length > 0 && parsedTip === null;
  const invalidSplit = split.trim().length > 0 && parsedSplit === null;
  const invalidTax =
    includeTax && taxRate.trim().length > 0 && parsedTax === null;
  const invalid = invalidBill || invalidTip || invalidSplit || invalidTax;

  const allFilled =
    bill.trim().length > 0 &&
    split.trim().length > 0 &&
    (preset !== CUSTOM || customTip.trim().length > 0) &&
    (!includeTax || taxRate.trim().length > 0);

  const result = useMemo(() => {
    if (
      parsedBill === null ||
      parsedTip === null ||
      parsedSplit === null ||
      (includeTax && parsedTax === null)
    ) {
      return null;
    }
    const input: SplitInput = {
      bill: parsedBill,
      tipPercent: parsedTip,
      taxPercent: includeTax ? (parsedTax ?? 0) : 0,
      includeTax,
      splitCount: parsedSplit,
      roundPerPerson,
    };
    return calculateSplit(input);
  }, [parsedBill, parsedTip, parsedSplit, parsedTax, includeTax, roundPerPerson]);

  const errorText = invalid
    ? `${tw("tip-bill-split-calculator.errorInvalid")} ${tw("tip-bill-split-calculator.fixInvalid")}`
    : result?.error
      ? `${tw("tip-bill-split-calculator.errorRange")} ${tw("tip-bill-split-calculator.fixRange")}`
      : "";
  const describedBy = errorText ? ERROR_ID : undefined;

  const reportText = useMemo(() => {
    if (!result || result.error || !allFilled || errorText) return "";
    const tipLabel =
      preset === CUSTOM
        ? `${tw("tip-bill-split-calculator.tipLabel")} (${percent.format(parsedTip ?? 0)}%)`
        : `${tw("tip-bill-split-calculator.tipLabel")} (${preset}%)`;
    return [
      tw("tip-bill-split-calculator.copyTitle"),
      `${tw("tip-bill-split-calculator.billLabel")}: ${money.format(result.bill)}`,
      `${tw("tip-bill-split-calculator.taxLabel")}: ${money.format(result.tax)}`,
      `${tipLabel}: ${money.format(result.tip)}`,
      `${tw("tip-bill-split-calculator.totalLabel")}: ${money.format(result.total)}`,
      `${tw("tip-bill-split-calculator.splitLabel")}: ${result.splitCount}`,
      `${tw("tip-bill-split-calculator.perPersonLabel")}: ${money.format(result.perPerson)}`,
    ].join("\n");
  }, [result, allFilled, errorText, preset, parsedTip, percent, money, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void copy(reportText);
  }, [copy, reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setBill(String(DEFAULTS.bill));
    setPreset("18");
    setCustomTip("");
    setSplit(String(DEFAULTS.splitCount));
    setTaxRate(String(DEFAULTS.taxPercent));
    setIncludeTax(DEFAULTS.includeTax);
    setRoundPerPerson(DEFAULTS.roundPerPerson);
    reset();
  }, [reset]);

  const handleReset = useCallback(() => {
    setBill("");
    setPreset("18");
    setCustomTip("");
    setSplit("");
    setTaxRate("");
    setIncludeTax(false);
    setRoundPerPerson(false);
    reset();
  }, [reset]);

  return (
    <ToolShell
      title={tw("tip-bill-split-calculator.title")}
      icon="Calculator"
      sampleLabel={tw("tip-bill-split-calculator.trySample")}
      resetLabel={tw("tip-bill-split-calculator.reset")}
      privacyLabel={tw("tip-bill-split-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-tip-split-input-title"
          title={tw("tip-bill-split-calculator.inputTitle")}
        >
          <ToolField
            label={tw("tip-bill-split-calculator.billLabel")}
            htmlFor="tp-tip-bill"
            hint={tw("tip-bill-split-calculator.billHint")}
          >
            <NumberStepper
              id="tp-tip-bill"
              value={bill}
              min={0}
              step={1}
              inputMode="decimal"
              ariaLabel={tw("tip-bill-split-calculator.billLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setBill(next);
                reset();
              }}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("tip-bill-split-calculator.tipPresetLabel")}
            </p>
            <SegmentedControl
              label={tw("tip-bill-split-calculator.tipPresetLabel")}
              value={preset}
              options={tipOptions}
              onChange={(next) => {
                setPreset(next);
                reset();
              }}
            />
            {preset === CUSTOM ? (
              <ToolField
                label={tw("tip-bill-split-calculator.customTipLabel")}
                htmlFor="tp-tip-custom"
              >
                <NumberStepper
                  id="tp-tip-custom"
                  value={customTip}
                  min={0}
                  step={1}
                  inputMode="decimal"
                  ariaLabel={tw("tip-bill-split-calculator.customTipLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  describedBy={describedBy}
                  onValueChange={(next) => {
                    setCustomTip(next);
                    reset();
                  }}
                />
              </ToolField>
            ) : null}
          </div>

          <ToolField
            label={tw("tip-bill-split-calculator.splitLabel")}
            htmlFor="tp-tip-split-count"
            hint={tw("tip-bill-split-calculator.splitHint")}
          >
            <NumberStepper
              id="tp-tip-split-count"
              value={split}
              min={1}
              max={MAX_PEOPLE}
              step={1}
              inputMode="numeric"
              ariaLabel={tw("tip-bill-split-calculator.splitLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setSplit(next);
                reset();
              }}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-tip-tax-toggle"
                label={tw("tip-bill-split-calculator.taxToggleLabel")}
                checked={includeTax}
                onChange={() => setIncludeTax((previous) => !previous)}
              />
              <label htmlFor="tp-tip-tax-toggle" className="tp-check-label">
                {tw("tip-bill-split-calculator.taxToggleLabel")}
              </label>
            </div>
            {includeTax ? (
              <ToolField
                label={tw("tip-bill-split-calculator.taxRateLabel")}
                htmlFor="tp-tip-tax"
                hint={tw("tip-bill-split-calculator.taxHint")}
              >
                <NumberStepper
                  id="tp-tip-tax"
                  value={taxRate}
                  min={0}
                  step={0.25}
                  inputMode="decimal"
                  ariaLabel={tw("tip-bill-split-calculator.taxRateLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  describedBy={describedBy}
                  onValueChange={(next) => {
                    setTaxRate(next);
                    reset();
                  }}
                />
              </ToolField>
            ) : null}

            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-tip-round-toggle"
                label={tw("tip-bill-split-calculator.roundToggleLabel")}
                checked={roundPerPerson}
                onChange={() => setRoundPerPerson((previous) => !previous)}
              />
              <label htmlFor="tp-tip-round-toggle" className="tp-check-label">
                {tw("tip-bill-split-calculator.roundToggleLabel")}
              </label>
            </div>
            <p className="tp-tool-hint">
              {tw("tip-bill-split-calculator.roundHint")}
            </p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="status" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-tip-split-result-title"
          title={t("result")}
          hint={tw("tip-bill-split-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={tw("tip-bill-split-calculator.copySplit")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!allFilled ? (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={tw("tip-bill-split-calculator.emptyTitle")}
                hint={tw("tip-bill-split-calculator.emptyHint")}
              />
            </div>
          ) : errorText || !result || result.error ? (
            <div className="tp-tool-result" aria-live="polite">
              <p id={RESULT_ERROR_ID} className="tp-tool-error" role="alert">
                {errorText ||
                  `${tw("tip-bill-split-calculator.errorRange")} ${tw("tip-bill-split-calculator.fixRange")}`}
              </p>
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={tw("tip-bill-split-calculator.errorTitle")}
                hint={tw("tip-bill-split-calculator.fixRange")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-label">
                {tw("tip-bill-split-calculator.perPersonLabel")}
              </p>
              <output
                dir="ltr"
                style={{
                  display: "block",
                  width: "100%",
                  padding: "18px 16px",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--surface)",
                  color: "var(--accent)",
                  textAlign: "center",
                  fontFamily: "var(--font-mono, ui-monospace, monospace)",
                  fontSize: "clamp(32px, 5vw, 46px)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {money.format(result.perPerson)}
              </output>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("tip-bill-split-calculator.billLabel")}
                  value={money.format(result.bill)}
                />
                <Stat
                  label={tw("tip-bill-split-calculator.taxLabel")}
                  value={money.format(result.tax)}
                />
                <Stat
                  label={tw("tip-bill-split-calculator.tipLabel")}
                  value={money.format(result.tip)}
                />
                <Stat
                  label={tw("tip-bill-split-calculator.totalLabel")}
                  value={money.format(result.total)}
                />
                <Stat
                  label={tw("tip-bill-split-calculator.splitLabel")}
                  value={String(result.splitCount)}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("tip-bill-split-calculator.formulaTitle")}
                </span>
                <div className="tp-tool-url">
                  <code dir="ltr">{tw("tip-bill-split-calculator.formula")}</code>
                </div>
                {result.rounded ? (
                  <p className="tp-tool-hint">
                    {tw("tip-bill-split-calculator.roundedNote")}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
