"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyFeedback,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateCompound,
  DEFAULTS,
} from "./compound-interest-calculator.logic";

const ERROR_ID = "tp-ci-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function CompoundInterestCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [compounds, setCompounds] = useState("");
  const [frequency, setFrequency] = useState("12");
  const { copy, reset } = useCopyFeedback();

  const frequencyOptions = useMemo(
    () => [
      { value: "1", label: tw("compound-interest-calculator.frequencyAnnual") },
      { value: "2", label: tw("compound-interest-calculator.frequencySemiannual") },
      { value: "4", label: tw("compound-interest-calculator.frequencyQuarterly") },
      { value: "12", label: tw("compound-interest-calculator.frequencyMonthly") },
      { value: "52", label: tw("compound-interest-calculator.frequencyWeekly") },
      { value: "365", label: tw("compound-interest-calculator.frequencyDaily") },
      { value: "custom", label: tw("compound-interest-calculator.frequencyCustom") },
    ],
    [tw],
  );

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale]
  );

  const result = useMemo(() => {
    const parsedPrincipal = parseValue(principal);
    const parsedRate = parseValue(rate);
    const parsedYears = parseValue(years);
    const parsedCompounds = parseValue(compounds);
    if (
      parsedPrincipal === null ||
      parsedRate === null ||
      parsedYears === null ||
      parsedCompounds === null
    ) {
      return null;
    }
    return calculateCompound({
      principal: parsedPrincipal,
      annualRate: parsedRate,
      years: parsedYears,
      compoundsPerYear: parsedCompounds,
    });
  }, [principal, rate, years, compounds]);

  const allFilled =
    principal.trim().length > 0 &&
    rate.trim().length > 0 &&
    years.trim().length > 0 &&
    compounds.trim().length > 0;
  const invalid = [principal, rate, years, compounds].some(
    (value) => value.trim().length > 0 && parseValue(value) === null
  );

  const errorText = invalid
    ? tw("compound-interest-calculator.errorInvalid")
    : result?.error === "INVALID_RANGE"
      ? tw("compound-interest-calculator.errorRange")
      : result?.error === "TOO_LARGE"
        ? tw("compound-interest-calculator.errorTooLarge")
        : "";
  const describedBy = errorText ? ERROR_ID : undefined;

  const reportText = useMemo(() => {
    if (!result || result.error || !allFilled) return "";
    const lines = [
      tw("compound-interest-calculator.summaryLabel"),
      `${tw("compound-interest-calculator.finalAmountLabel")}: ${fmt.format(result.finalAmount)}`,
      `${tw("compound-interest-calculator.interestLabel")}: ${fmt.format(result.interestEarned)}`,
      `${tw("compound-interest-calculator.effectiveRateLabel")}: ${fmt.format(result.effectiveAnnualRate)}%`,
      "",
      tw("compound-interest-calculator.tableTitle"),
      [
        tw("compound-interest-calculator.columnYear"),
        tw("compound-interest-calculator.columnOpening"),
        tw("compound-interest-calculator.columnInterest"),
        tw("compound-interest-calculator.columnClosing"),
      ].join(" | "),
      ...result.years.map((row) =>
        [
          String(row.year),
          fmt.format(row.opening),
          fmt.format(row.interest),
          fmt.format(row.closing),
        ].join(" | ")
      ),
    ];
    return lines.join("\n");
  }, [result, allFilled, fmt, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void copy(reportText);
  }, [copy, reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setPrincipal(String(DEFAULTS.principal));
    setRate(String(DEFAULTS.annualRate));
    setYears(String(DEFAULTS.years));
    setCompounds(String(DEFAULTS.compoundsPerYear));
    setFrequency(String(DEFAULTS.compoundsPerYear));
    reset();
  }, [reset]);

  const handleReset = useCallback(() => {
    setPrincipal("");
    setRate("");
    setYears("");
    setCompounds("");
    setFrequency("12");
    reset();
  }, [reset]);

  const ready = Boolean(result && !result.error && !errorText && allFilled);

  return (
    <ToolShell
      title={tw("compound-interest-calculator.title")}
      icon="Calculator"
      sampleLabel={tw("compound-interest-calculator.trySample")}
      resetLabel={tw("compound-interest-calculator.reset")}
      privacyLabel={tw("compound-interest-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-ci-input-title"
          title={tw("compound-interest-calculator.inputTitle")}
          hint={tw("compound-interest-calculator.inputHint")}
        >
          <ToolField
            label={tw("compound-interest-calculator.principalLabel")}
            htmlFor="tp-ci-principal"
          >
            <NumberStepper
              id="tp-ci-principal"
              value={principal}
              min={0}
              step={100}
              inputMode="decimal"
              ariaLabel={tw("compound-interest-calculator.principalLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setPrincipal(next);
                reset();
              }}
            />
          </ToolField>

          <ToolField
            label={tw("compound-interest-calculator.rateLabel")}
            htmlFor="tp-ci-rate"
            hint={tw("compound-interest-calculator.rateHint")}
          >
            <NumberStepper
              id="tp-ci-rate"
              value={rate}
              min={0}
              step={0.25}
              inputMode="decimal"
              ariaLabel={tw("compound-interest-calculator.rateLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setRate(next);
                reset();
              }}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("compound-interest-calculator.yearsLabel")}
              htmlFor="tp-ci-years"
            >
              <NumberStepper
                id="tp-ci-years"
                value={years}
                min={1}
                max={100}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("compound-interest-calculator.yearsLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => {
                  setYears(next);
                  reset();
                }}
              />
            </ToolField>

            <ToolField
              label={tw("compound-interest-calculator.frequencyLabel")}
              htmlFor="tp-ci-frequency"
            >
              <ThemedSelect
                value={frequency}
                ariaLabel={tw("compound-interest-calculator.frequencyLabel")}
                options={frequencyOptions}
                onValueChange={(next) => {
                  setFrequency(next);
                  if (next !== "custom") setCompounds(next);
                  reset();
                }}
              />
            </ToolField>

            <ToolField
              label={tw("compound-interest-calculator.compoundsLabel")}
              htmlFor="tp-ci-compounds"
              hint={tw("compound-interest-calculator.compoundsHint")}
            >
              <NumberStepper
                id="tp-ci-compounds"
                value={compounds}
                min={1}
                max={365}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("compound-interest-calculator.compoundsLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => {
                  setCompounds(next);
                  const preset = ["1", "2", "4", "12", "52", "365"].includes(next) ? next : "custom";
                  setFrequency(preset);
                  reset();
                }}
              />
            </ToolField>
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
          id="tp-ci-result-title"
          title={t("result")}
          hint={tw("compound-interest-calculator.resultHint")}
          result
          actions={
            <>
              <CopyButton
                text={reportText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={reportText}
                fileName="compound-interest-report.txt"
                label={t("download")}
                disabled={!reportText}
              />
            </>
          }
        >
          {!allFilled ? (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={tw("compound-interest-calculator.emptyTitle")}
                hint={tw("compound-interest-calculator.emptyHint")}
              />
            </div>
          ) : ready && result ? (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-label">
                {tw("compound-interest-calculator.summaryLabel")}
              </p>
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("compound-interest-calculator.finalAmountLabel")}
                  value={fmt.format(result.finalAmount)}
                />
                <Stat
                  label={tw("compound-interest-calculator.interestLabel")}
                  value={fmt.format(result.interestEarned)}
                />
                <Stat
                  label={tw("compound-interest-calculator.effectiveRateLabel")}
                  value={`${fmt.format(result.effectiveAnnualRate)}%`}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("compound-interest-calculator.tableTitle")}
                </span>
                <div className="max-h-[260px] overflow-auto rounded-[10px] border border-[var(--border)]">
                  <table
                    className="w-full border-collapse text-left font-mono text-[12px]"
                    dir="ltr"
                  >
                    <thead className="sticky top-0 bg-[var(--surface)]">
                      <tr>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("compound-interest-calculator.columnYear")}
                        </th>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("compound-interest-calculator.columnOpening")}
                        </th>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("compound-interest-calculator.columnInterest")}
                        </th>
                        <th
                          scope="col"
                          className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                        >
                          {tw("compound-interest-calculator.columnClosing")}
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
                            {fmt.format(row.opening)}
                          </td>
                          <td className="px-3 py-2 text-[var(--text)]">
                            {fmt.format(row.interest)}
                          </td>
                          <td className="px-3 py-2 text-[var(--text)]">
                            {fmt.format(row.closing)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={tw("compound-interest-calculator.emptyTitle")}
                hint={errorText || tw("compound-interest-calculator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
