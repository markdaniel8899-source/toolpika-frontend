"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Percent } from "lucide-react";
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
  calculateDiscount,
  DEFAULTS,
  type DiscountInput,
  type DiscountMode,
} from "./discount-calculator.logic";

const ERROR_ID = "tp-discount-error";
const RESULT_ERROR_ID = "tp-discount-result-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function DiscountCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [price, setPrice] = useState("");
  const [mode, setMode] = useState<DiscountMode>(DEFAULTS.mode);
  const [discount, setDiscount] = useState("");
  const [coupon, setCoupon] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [includeExtras, setIncludeExtras] = useState(false);
  const { copy, reset } = useCopyFeedback();

  const modeOptions = useMemo(
    () => [
      { value: "percent", label: tw("discount-calculator.modePercent") },
      { value: "amount", label: tw("discount-calculator.modeAmount") },
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

  const parsedPrice = parseValue(price);
  const parsedDiscount = parseValue(discount);
  const parsedCoupon = parseValue(coupon);
  const parsedTax = parseValue(taxRate);

  const invalidPrice = price.trim().length > 0 && parsedPrice === null;
  const invalidDiscount =
    discount.trim().length > 0 && parsedDiscount === null;
  const invalidCoupon =
    includeExtras && coupon.trim().length > 0 && parsedCoupon === null;
  const invalidTax =
    includeExtras && taxRate.trim().length > 0 && parsedTax === null;
  const invalid =
    invalidPrice || invalidDiscount || invalidCoupon || invalidTax;

  const allFilled =
    price.trim().length > 0 &&
    discount.trim().length > 0 &&
    (!includeExtras || coupon.trim().length > 0) &&
    (!includeExtras || taxRate.trim().length > 0);

  const result = useMemo(() => {
    if (parsedPrice === null || parsedDiscount === null) return null;
    const input: DiscountInput = {
      price: parsedPrice,
      mode,
      discount: parsedDiscount,
      coupon: includeExtras ? (parsedCoupon ?? 0) : 0,
      taxPercent: includeExtras ? (parsedTax ?? 0) : 0,
      includeExtras,
    };
    return calculateDiscount(input);
  }, [parsedPrice, parsedDiscount, parsedCoupon, parsedTax, mode, includeExtras]);

  const errorText = invalid
    ? `${tw("discount-calculator.errorInvalid")} ${tw("discount-calculator.fixInvalid")}`
    : result?.error
      ? `${tw("discount-calculator.errorRange")} ${tw("discount-calculator.fixRange")}`
      : "";
  const describedBy = errorText ? ERROR_ID : undefined;

  const reportText = useMemo(() => {
    if (!result || result.error || !allFilled || errorText) return "";
    const discountLabel =
      mode === "percent"
        ? `${tw("discount-calculator.discountLabel")} (${percent.format(parsedDiscount ?? 0)}%)`
        : tw("discount-calculator.discountLabel");
    return [
      tw("discount-calculator.copyTitle"),
      `${tw("discount-calculator.originalLabel")}: ${money.format(result.price)}`,
      `${discountLabel}: ${money.format(result.discountAmount)}`,
      `${tw("discount-calculator.couponLabel")}: ${money.format(result.couponAmount)}`,
      `${tw("discount-calculator.taxLabel")}: ${money.format(result.tax)}`,
      `${tw("discount-calculator.savingsLabel")}: ${money.format(result.savings)}`,
      `${tw("discount-calculator.finalLabel")}: ${money.format(result.finalPrice)}`,
    ].join("\n");
  }, [result, allFilled, errorText, mode, parsedDiscount, percent, money, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void copy(reportText);
  }, [copy, reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setPrice(String(DEFAULTS.price));
    setMode(DEFAULTS.mode);
    setDiscount(String(DEFAULTS.discount));
    setCoupon(String(DEFAULTS.coupon));
    setTaxRate(String(DEFAULTS.taxPercent));
    setIncludeExtras(DEFAULTS.includeExtras);
    reset();
  }, [reset]);

  const handleReset = useCallback(() => {
    setPrice("");
    setMode("percent");
    setDiscount("");
    setCoupon("");
    setTaxRate("");
    setIncludeExtras(false);
    reset();
  }, [reset]);

  return (
    <ToolShell
      title={tw("discount-calculator.title")}
      icon="Percent"
      sampleLabel={tw("discount-calculator.trySample")}
      resetLabel={tw("discount-calculator.reset")}
      privacyLabel={tw("discount-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-discount-input-title"
          title={tw("discount-calculator.inputTitle")}
        >
          <ToolField
            label={tw("discount-calculator.priceLabel")}
            htmlFor="tp-discount-price"
          >
            <NumberStepper
              id="tp-discount-price"
              value={price}
              min={0}
              step={1}
              inputMode="decimal"
              ariaLabel={tw("discount-calculator.priceLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setPrice(next);
                reset();
              }}
            />
          </ToolField>

          <ToolField
            label={tw("discount-calculator.modeLabel")}
            htmlFor="tp-discount-mode"
          >
            <SegmentedControl
              label={tw("discount-calculator.modeLabel")}
              value={mode}
              options={modeOptions}
              onChange={(next) => {
                setMode(next as DiscountMode);
                reset();
              }}
            />
          </ToolField>

          <ToolField
            label={
              mode === "percent"
                ? tw("discount-calculator.percentLabel")
                : tw("discount-calculator.amountLabel")
            }
            htmlFor="tp-discount-value"
          >
            <NumberStepper
              id="tp-discount-value"
              value={discount}
              min={0}
              step={1}
              inputMode="decimal"
              ariaLabel={
                mode === "percent"
                  ? tw("discount-calculator.percentLabel")
                  : tw("discount-calculator.amountLabel")
              }
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setDiscount(next);
                reset();
              }}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-discount-extras-toggle"
                label={tw("discount-calculator.extraToggleLabel")}
                checked={includeExtras}
                onChange={() => setIncludeExtras((previous) => !previous)}
              />
              <label htmlFor="tp-discount-extras-toggle" className="tp-check-label">
                {tw("discount-calculator.extraToggleLabel")}
              </label>
            </div>
            {includeExtras ? (
              <>
                <ToolField
                  label={tw("discount-calculator.couponLabel")}
                  htmlFor="tp-discount-coupon"
                >
                  <NumberStepper
                    id="tp-discount-coupon"
                    value={coupon}
                    min={0}
                    step={1}
                    inputMode="decimal"
                    ariaLabel={tw("discount-calculator.couponLabel")}
                    increaseLabel={t("stepUp")}
                    decreaseLabel={t("stepDown")}
                    describedBy={describedBy}
                    onValueChange={(next) => {
                      setCoupon(next);
                      reset();
                    }}
                  />
                </ToolField>
                <ToolField
                  label={tw("discount-calculator.taxRateLabel")}
                  htmlFor="tp-discount-tax"
                  hint={tw("discount-calculator.taxHint")}
                >
                  <NumberStepper
                    id="tp-discount-tax"
                    value={taxRate}
                    min={0}
                    step={0.25}
                    inputMode="decimal"
                    ariaLabel={tw("discount-calculator.taxRateLabel")}
                    increaseLabel={t("stepUp")}
                    decreaseLabel={t("stepDown")}
                    describedBy={describedBy}
                    onValueChange={(next) => {
                      setTaxRate(next);
                      reset();
                    }}
                  />
                </ToolField>
              </>
            ) : null}
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
          id="tp-discount-result-title"
          title={t("result")}
          hint={tw("discount-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={tw("discount-calculator.copyResult")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!allFilled ? (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Percent aria-hidden="true" />}
                title={tw("discount-calculator.emptyTitle")}
                hint={tw("discount-calculator.emptyHint")}
              />
            </div>
          ) : errorText || !result || result.error ? (
            <div className="tp-tool-result" aria-live="polite">
              <p id={RESULT_ERROR_ID} className="tp-tool-error" role="alert">
                {errorText ||
                  `${tw("discount-calculator.errorRange")} ${tw("discount-calculator.fixRange")}`}
              </p>
              <ToolEmpty
                icon={<Percent aria-hidden="true" />}
                title={tw("discount-calculator.errorTitle")}
                hint={tw("discount-calculator.fixRange")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-label">
                {tw("discount-calculator.finalLabel")}
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
                {money.format(result.finalPrice)}
              </output>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("discount-calculator.originalLabel")}
                  value={money.format(result.price)}
                />
                <Stat
                  label={tw("discount-calculator.discountLabel")}
                  value={money.format(result.discountAmount)}
                />
                <Stat
                  label={tw("discount-calculator.couponLabel")}
                  value={money.format(result.couponAmount)}
                />
                <Stat
                  label={tw("discount-calculator.taxLabel")}
                  value={money.format(result.tax)}
                />
                <Stat
                  label={tw("discount-calculator.savingsLabel")}
                  value={money.format(result.savings)}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("discount-calculator.formulaTitle")}
                </span>
                <div className="tp-tool-url">
                  <code dir="ltr">{tw("discount-calculator.formula")}</code>
                </div>
                {result.capped ? (
                  <p className="tp-tool-hint">
                    {tw("discount-calculator.cappedNote")}
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
