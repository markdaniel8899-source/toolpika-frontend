"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import {
  CopyButton,
  CurrencyPicker,
  HeroValue,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateTax,
  DEFAULT_CURRENCY,
  DEFAULT_TAX_INPUT,
  formatTaxReport,
  type CurrencyCode,
  type TaxErrorCode,
  type TaxMode,
} from "./sales-tax-calculator.logic";

const ERROR_ID = "tp-tax-error";
const CUSTOM = "custom";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function SalesTaxCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [mode, setMode] = useState<TaxMode>(DEFAULT_TAX_INPUT.mode);
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState(String(DEFAULT_TAX_INPUT.rate));
  const [customRate, setCustomRate] = useState("");
  const [quantity, setQuantity] = useState(String(DEFAULT_TAX_INPUT.quantity));
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  const parsedAmount = parseValue(amount);
  const parsedRate = preset === CUSTOM ? parseValue(customRate) : Number(preset);
  const parsedQuantity = parseValue(quantity);

  const calculation = useMemo(
    () =>
      calculateTax({
        amount: parsedAmount ?? Number.NaN,
        rate: parsedRate ?? Number.NaN,
        quantity: parsedQuantity ?? Number.NaN,
        mode,
      }),
    [parsedAmount, parsedRate, parsedQuantity, mode],
  );
  const value = calculation.value;

  const errorCode: TaxErrorCode | undefined = calculation.error?.code;
  const errorText = !amount.trim()
    ? `${tw("sales-tax-calculator.errorMissing")} ${tw("sales-tax-calculator.fixMissing")}`
    : errorCode === "INVALID_AMOUNT"
      ? `${tw("sales-tax-calculator.errorInvalid")} ${tw("sales-tax-calculator.fixInvalid")}`
      : errorCode === "NEGATIVE_AMOUNT"
        ? `${tw("sales-tax-calculator.errorNegative")} ${tw("sales-tax-calculator.fixNegative")}`
        : errorCode === "INVALID_RATE"
          ? `${tw("sales-tax-calculator.errorRate")} ${tw("sales-tax-calculator.fixRate")}`
          : errorCode === "INVALID_QUANTITY"
            ? `${tw("sales-tax-calculator.errorQuantity")} ${tw("sales-tax-calculator.fixQuantity")}`
            : "";
  const ready = Boolean(value && !errorText);
  const describedBy = errorText ? ERROR_ID : undefined;

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale, currency],
  );
  const percent = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );

  const reportText = useMemo(() => {
    if (!ready || !value || parsedRate === null) return "";
    return formatTaxReport(
      { amount: parsedAmount ?? 0, rate: parsedRate, quantity: parsedQuantity ?? 0, mode },
      currency,
      {
        title: tw("sales-tax-calculator.reportTitle"),
        mode: tw("sales-tax-calculator.modeLabel"),
        modeAdd: tw("sales-tax-calculator.modeAdd"),
        modeExtract: tw("sales-tax-calculator.modeExtract"),
        amount: tw("sales-tax-calculator.amountLabel"),
        rate: tw("sales-tax-calculator.rateLabel"),
        quantity: tw("sales-tax-calculator.quantityLabel"),
        currency: tw("sales-tax-calculator.currencyLabel"),
        net: tw("sales-tax-calculator.netLabel"),
        tax: tw("sales-tax-calculator.taxLabel"),
        total: tw("sales-tax-calculator.totalLabel"),
        perUnit: tw("sales-tax-calculator.perUnitTitle"),
        perUnitNet: tw("sales-tax-calculator.perUnitNetLabel"),
        perUnitTax: tw("sales-tax-calculator.perUnitTaxLabel"),
        perUnitTotal: tw("sales-tax-calculator.perUnitTotalLabel"),
        note: tw("sales-tax-calculator.reportNote"),
      },
      {
        amount: money.format(parsedAmount ?? 0),
        rate: `${percent.format(parsedRate)}%`,
        net: money.format(value.net),
        tax: money.format(value.tax),
        total: money.format(value.total),
        perUnitNet: money.format(value.perUnitNet),
        perUnitTax: money.format(value.perUnitTax),
        perUnitTotal: money.format(value.perUnitTotal),
      },
    );
  }, [ready, value, parsedAmount, parsedRate, parsedQuantity, mode, currency, tw, money, percent]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setMode(DEFAULT_TAX_INPUT.mode);
    setAmount(String(DEFAULT_TAX_INPUT.amount));
    setPreset(String(DEFAULT_TAX_INPUT.rate));
    setCustomRate("");
    setQuantity(String(DEFAULT_TAX_INPUT.quantity));
    setCurrency(DEFAULT_CURRENCY);
  };

  const handleReset = () => {
    setMode(DEFAULT_TAX_INPUT.mode);
    setAmount("");
    setPreset(String(DEFAULT_TAX_INPUT.rate));
    setCustomRate("");
    setQuantity(String(DEFAULT_TAX_INPUT.quantity));
    setCurrency(DEFAULT_CURRENCY);
  };

  return (
    <ToolShell
      title={tw("sales-tax-calculator.title")}
      icon="Receipt"
      sampleLabel={tw("sales-tax-calculator.trySample")}
      resetLabel={tw("sales-tax-calculator.reset")}
      privacyLabel={tw("sales-tax-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-tax-input-title"
          title={tw("sales-tax-calculator.inputTitle")}
          hint={tw("sales-tax-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<TaxMode>
              label={tw("sales-tax-calculator.modeLabel")}
              value={mode}
              options={[
                { value: "add", label: tw("sales-tax-calculator.modeAdd") },
                { value: "extract", label: tw("sales-tax-calculator.modeExtract") },
              ]}
              onChange={setMode}
            />
            <p className="tp-tool-hint">
              {mode === "add"
                ? tw("sales-tax-calculator.addHint")
                : tw("sales-tax-calculator.extractHint")}
            </p>
          </div>

          <ToolField
            label={tw("sales-tax-calculator.amountLabel")}
            htmlFor="tp-tax-amount"
            hint={
              mode === "add"
                ? tw("sales-tax-calculator.amountHintAdd")
                : tw("sales-tax-calculator.amountHintExtract")
            }
          >
            <NumberStepper
              id="tp-tax-amount"
              value={amount}
              min={0}
              step={1}
              inputMode="decimal"
              ariaLabel={tw("sales-tax-calculator.amountLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setAmount}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">{tw("sales-tax-calculator.rateLabel")}</p>
            <SegmentedControl
              label={tw("sales-tax-calculator.rateLabel")}
              value={preset}
              options={[
                { value: "0", label: tw("sales-tax-calculator.rate0") },
                { value: "5", label: tw("sales-tax-calculator.rate5") },
                { value: "10", label: tw("sales-tax-calculator.rate10") },
                { value: "20", label: tw("sales-tax-calculator.rate20") },
                { value: CUSTOM, label: tw("sales-tax-calculator.rateCustom") },
              ]}
              onChange={setPreset}
            />
            {preset === CUSTOM ? (
              <ToolField
                label={tw("sales-tax-calculator.customRateLabel")}
                htmlFor="tp-tax-custom-rate"
                hint={tw("sales-tax-calculator.rateHint")}
              >
                <NumberStepper
                  id="tp-tax-custom-rate"
                  value={customRate}
                  min={0}
                  step={0.25}
                  inputMode="decimal"
                  ariaLabel={tw("sales-tax-calculator.customRateLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  describedBy={describedBy}
                  onValueChange={setCustomRate}
                />
              </ToolField>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("sales-tax-calculator.quantityLabel")}
              htmlFor="tp-tax-quantity"
              hint={tw("sales-tax-calculator.quantityHint")}
            >
              <NumberStepper
                id="tp-tax-quantity"
                value={quantity}
                min={1}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("sales-tax-calculator.quantityLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setQuantity}
              />
            </ToolField>

            <CurrencyPicker
              id="tp-tax-currency"
              label={tw("sales-tax-calculator.currencyLabel")}
              value={currency}
              onChange={(next) => setCurrency(next as CurrencyCode)}
            />
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
          id="tp-tax-result-title"
          title={t("result")}
          hint={tw("sales-tax-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Receipt aria-hidden="true" />}
                title={
                  errorText
                    ? tw("sales-tax-calculator.errorTitle")
                    : tw("sales-tax-calculator.emptyTitle")
                }
                hint={errorText || tw("sales-tax-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("sales-tax-calculator.totalLabel")}
                value={money.format(value.total)}
                note={`${tw("sales-tax-calculator.rateLabel")}: ${percent.format(value.rate)}%`}
              />

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("sales-tax-calculator.taxLabel")}
                  value={money.format(value.tax)}
                />
                <Stat
                  label={tw("sales-tax-calculator.netLabel")}
                  value={money.format(value.net)}
                />
                <Stat
                  label={tw("sales-tax-calculator.rateLabel")}
                  value={`${percent.format(value.rate)}%`}
                />
                <Stat
                  label={tw("sales-tax-calculator.quantityLabel")}
                  value={String(value.quantity)}
                />
              </dl>

              {value.quantity > 1 ? (
                <div className="flex flex-col gap-2">
                  <span className="tp-tool-group-title">
                    {tw("sales-tax-calculator.perUnitTitle")}
                  </span>
                  <div className="tp-tool-list">
                    <div className="tp-tool-row tp-tool-row-plain">
                      <span>{tw("sales-tax-calculator.perUnitNetLabel")}</span>
                      <span className="tp-tool-value" dir="ltr">{money.format(value.perUnitNet)}</span>
                    </div>
                    <div className="tp-tool-row tp-tool-row-plain">
                      <span>{tw("sales-tax-calculator.perUnitTaxLabel")}</span>
                      <span className="tp-tool-value" dir="ltr">{money.format(value.perUnitTax)}</span>
                    </div>
                    <div className="tp-tool-row tp-tool-row-plain">
                      <span>{tw("sales-tax-calculator.perUnitTotalLabel")}</span>
                      <span className="tp-tool-value" dir="ltr">{money.format(value.perUnitTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <p className="tp-tool-hint">{tw("sales-tax-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
