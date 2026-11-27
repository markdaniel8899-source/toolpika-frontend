"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import {
  calculateRentVsBuy,
  DEFAULT_RENT_VS_BUY_INPUT,
  formatRentVsBuyReport,
  SAMPLE_RENT_VS_BUY_INPUT,
  type RentVsBuyErrorCode,
  type RentVsBuyInput,
} from "./rent-vs-buy-calculator.logic";

const ERROR_ID = "tp-rent-buy-error";

function parseValue(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return Number.NaN;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

export default function RentVsBuyCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [monthlyRent, setMonthlyRent] = useState(
    String(DEFAULT_RENT_VS_BUY_INPUT.monthlyRent),
  );
  const [homePrice, setHomePrice] = useState(
    String(DEFAULT_RENT_VS_BUY_INPUT.homePrice),
  );
  const [downPayment, setDownPayment] = useState(
    String(DEFAULT_RENT_VS_BUY_INPUT.downPayment),
  );
  const [annualRate, setAnnualRate] = useState(
    String(DEFAULT_RENT_VS_BUY_INPUT.annualRate),
  );
  const [years, setYears] = useState(String(DEFAULT_RENT_VS_BUY_INPUT.years));

  const allFilled = [monthlyRent, homePrice, downPayment, annualRate, years].every(
    (value) => value.trim().length > 0,
  );
  const invalidTyped = [monthlyRent, homePrice, downPayment, annualRate, years].some(
    (value) => value.trim().length > 0 && !Number.isFinite(parseValue(value)),
  );

  const input: RentVsBuyInput = useMemo(
    () => ({
      monthlyRent: parseValue(monthlyRent),
      homePrice: parseValue(homePrice),
      downPayment: parseValue(downPayment),
      annualRate: parseValue(annualRate),
      years: parseValue(years),
    }),
    [monthlyRent, homePrice, downPayment, annualRate, years],
  );

  const result = useMemo(() => calculateRentVsBuy(input), [input]);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }),
    [locale],
  );
  const precise = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const formatMoney = useCallback(
    (value: number) => money.format(Math.round(value)),
    [money],
  );
  const formatPrecise = useCallback(
    (value: number) => precise.format(value),
    [precise],
  );

  const errorCode: RentVsBuyErrorCode | undefined = result.error;
  const errorText = invalidTyped
    ? `${tw("rent-vs-buy-calculator.errorInvalid")} ${tw("rent-vs-buy-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("rent-vs-buy-calculator.errorRange")} ${tw("rent-vs-buy-calculator.fixRange")}`
      : errorCode === "DOWN_TOO_LARGE"
        ? `${tw("rent-vs-buy-calculator.errorDown")} ${tw("rent-vs-buy-calculator.fixDown")}`
        : "";
  const ready = allFilled && !invalidTyped && !result.error;

  const reportText = useMemo(() => {
    if (!ready) return "";
    return formatRentVsBuyReport(
      result,
      {
        title: tw("rent-vs-buy-calculator.reportTitle"),
        rentTotal: tw("rent-vs-buy-calculator.rentTotalLabel"),
        buyTotal: tw("rent-vs-buy-calculator.buyTotalLabel"),
        difference: tw("rent-vs-buy-calculator.heroLabel"),
        cheaper: tw("rent-vs-buy-calculator.cheaperLabel"),
        cheaperRent: tw("rent-vs-buy-calculator.cheaperRent"),
        cheaperBuy: tw("rent-vs-buy-calculator.cheaperBuy"),
        monthlyPI: tw("rent-vs-buy-calculator.monthlyPILabel"),
        loanAmount: tw("rent-vs-buy-calculator.loanLabel"),
        breakEven: tw("rent-vs-buy-calculator.breakEvenLabel"),
        breakEvenReached: tw("rent-vs-buy-calculator.breakEvenReached"),
        breakEvenNone: tw("rent-vs-buy-calculator.breakEvenNone"),
        tableTitle: tw("rent-vs-buy-calculator.tableTitle"),
        columnYear: tw("rent-vs-buy-calculator.columnYear"),
        columnRent: tw("rent-vs-buy-calculator.columnRent"),
        columnBuy: tw("rent-vs-buy-calculator.columnBuy"),
        note: tw("rent-vs-buy-calculator.reportNote"),
      },
      formatMoney,
    );
  }, [ready, result, tw, formatMoney]);

  const handleSample = () => {
    setMonthlyRent(String(SAMPLE_RENT_VS_BUY_INPUT.monthlyRent));
    setHomePrice(String(SAMPLE_RENT_VS_BUY_INPUT.homePrice));
    setDownPayment(String(SAMPLE_RENT_VS_BUY_INPUT.downPayment));
    setAnnualRate(String(SAMPLE_RENT_VS_BUY_INPUT.annualRate));
    setYears(String(SAMPLE_RENT_VS_BUY_INPUT.years));
  };

  const handleReset = () => {
    setMonthlyRent("");
    setHomePrice("");
    setDownPayment("");
    setAnnualRate("");
    setYears("");
  };

  return (
    <ToolShell
      title={tw("rent-vs-buy-calculator.title")}
      icon="TrendingUp"
      sampleLabel={tw("rent-vs-buy-calculator.trySample")}
      resetLabel={tw("rent-vs-buy-calculator.reset")}
      privacyLabel={tw("rent-vs-buy-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-rent-buy-input-title"
          title={tw("rent-vs-buy-calculator.inputTitle")}
          hint={tw("rent-vs-buy-calculator.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("rent-vs-buy-calculator.rentLabel")}
              htmlFor="tp-rent-buy-rent"
              hint={tw("rent-vs-buy-calculator.rentHint")}
            >
              <NumberStepper
                id="tp-rent-buy-rent"
                value={monthlyRent}
                min={1}
                step={100}
                ariaLabel={tw("rent-vs-buy-calculator.rentLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={errorText ? ERROR_ID : undefined}
                onValueChange={setMonthlyRent}
              />
            </ToolField>

            <ToolField
              label={tw("rent-vs-buy-calculator.priceLabel")}
              htmlFor="tp-rent-buy-price"
              hint={tw("rent-vs-buy-calculator.priceHint")}
            >
              <NumberStepper
                id="tp-rent-buy-price"
                value={homePrice}
                min={1000}
                step={5000}
                ariaLabel={tw("rent-vs-buy-calculator.priceLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={errorText ? ERROR_ID : undefined}
                onValueChange={setHomePrice}
              />
            </ToolField>

            <ToolField
              label={tw("rent-vs-buy-calculator.downLabel")}
              htmlFor="tp-rent-buy-down"
              hint={tw("rent-vs-buy-calculator.downHint")}
            >
              <NumberStepper
                id="tp-rent-buy-down"
                value={downPayment}
                min={0}
                step={5000}
                ariaLabel={tw("rent-vs-buy-calculator.downLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={errorText ? ERROR_ID : undefined}
                onValueChange={setDownPayment}
              />
            </ToolField>

            <ToolField
              label={tw("rent-vs-buy-calculator.rateLabel")}
              htmlFor="tp-rent-buy-rate"
              hint={tw("rent-vs-buy-calculator.rateHint")}
            >
              <NumberStepper
                id="tp-rent-buy-rate"
                value={annualRate}
                min={0}
                max={25}
                step={0.25}
                inputMode="decimal"
                ariaLabel={tw("rent-vs-buy-calculator.rateLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={errorText ? ERROR_ID : undefined}
                onValueChange={setAnnualRate}
              />
            </ToolField>

            <ToolField
              label={tw("rent-vs-buy-calculator.yearsLabel")}
              htmlFor="tp-rent-buy-years"
              hint={tw("rent-vs-buy-calculator.yearsHint")}
            >
              <NumberStepper
                id="tp-rent-buy-years"
                value={years}
                min={1}
                max={40}
                step={1}
                ariaLabel={tw("rent-vs-buy-calculator.yearsLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={errorText ? ERROR_ID : undefined}
                onValueChange={setYears}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("rent-vs-buy-calculator.assumptionsTitle")}
            </p>
            <p className="tp-tool-hint">
              {tw("rent-vs-buy-calculator.assumptionsNote")}
            </p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-rent-buy-result-title"
          title={t("result")}
          hint={tw("rent-vs-buy-calculator.resultHint")}
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
                title={tw("rent-vs-buy-calculator.emptyTitle")}
                hint={errorText || tw("rent-vs-buy-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("rent-vs-buy-calculator.heroLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {formatMoney(Math.abs(result.difference))}
                </output>
                <ToolBadge tone="success">
                  {result.cheaper === "buy"
                    ? tw("rent-vs-buy-calculator.cheaperBuy")
                    : tw("rent-vs-buy-calculator.cheaperRent")}
                </ToolBadge>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("rent-vs-buy-calculator.rentTotalLabel")}
                  value={formatMoney(result.rentTotal)}
                />
                <Stat
                  label={tw("rent-vs-buy-calculator.buyTotalLabel")}
                  value={formatMoney(result.buyTotal)}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("rent-vs-buy-calculator.breakdownTitle")}
                </span>
                <div className="tp-tool-list">
                  <div className="tp-tool-row">
                    <span>{tw("rent-vs-buy-calculator.monthlyPILabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {formatPrecise(result.monthlyPI)}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("rent-vs-buy-calculator.loanLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {formatMoney(result.loanAmount)}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("rent-vs-buy-calculator.closingLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {formatMoney(result.closingCost)}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("rent-vs-buy-calculator.carryingLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {formatMoney(result.carryingPerYear)}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("rent-vs-buy-calculator.breakEvenLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {result.breakEvenYear
                        ? tw("rent-vs-buy-calculator.breakEvenReached").replace(
                            "{year}",
                            String(result.breakEvenYear),
                          )
                        : tw("rent-vs-buy-calculator.breakEvenNone")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("rent-vs-buy-calculator.tableTitle")}
                </span>
                <div className="max-h-[260px] overflow-auto rounded-[10px] border border-[var(--border)]">
                  <table
                    className="w-full min-w-[420px] border-collapse text-left font-mono text-[12px]"
                    dir="ltr"
                  >
                    <thead className="sticky top-0 bg-[var(--surface)]">
                      <tr>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("rent-vs-buy-calculator.columnYear")}
                        </th>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("rent-vs-buy-calculator.columnRent")}
                        </th>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("rent-vs-buy-calculator.columnBuy")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.years.map((row) => (
                        <tr
                          key={row.year}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-3 py-2 text-[var(--text)]">{row.year}</td>
                          <td className="px-3 py-2 text-[var(--text)]">
                            {formatMoney(row.rentCost)}
                          </td>
                          <td className="px-3 py-2 text-[var(--text)]">
                            {formatMoney(row.buyCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="tp-tool-hint">
                  {tw("rent-vs-buy-calculator.tableHint")}
                </p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
