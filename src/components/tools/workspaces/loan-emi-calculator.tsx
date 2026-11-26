"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator } from "lucide-react";
import {
  CopyButton,
  DownloadButton,
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
import { calculateEmi, DEFAULTS } from "./loan-emi-calculator.logic";

const ERROR_ID = "tp-emi-error";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function LoanEmiCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [principal, setPrincipal] = useState(String(DEFAULTS.principal));
  const [rate, setRate] = useState(String(DEFAULTS.annualRate));
  const [tenure, setTenure] = useState(String(DEFAULTS.tenureMonths));
  const [tenureUnit, setTenureUnit] = useState<"months" | "years">("months");
  const [showAmortisation, setShowAmortisation] = useState(true);
  const { copy, reset } = useCopyFeedback();

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
    const parsedTenure = parseValue(tenure);
    if (
      parsedPrincipal === null ||
      parsedRate === null ||
      parsedTenure === null
    ) {
      return null;
    }
    const tenureMonths = tenureUnit === "years" ? parsedTenure * 12 : parsedTenure;
    return calculateEmi({
      principal: parsedPrincipal,
      annualRate: parsedRate,
      tenureMonths,
    });
  }, [principal, rate, tenure, tenureUnit]);

  const allFilled =
    principal.trim().length > 0 &&
    rate.trim().length > 0 &&
    tenure.trim().length > 0;
  const invalid = [principal, rate, tenure].some(
    (value) => value.trim().length > 0 && parseValue(value) === null
  );

  const errorText = invalid
    ? tw("loan-emi-calculator.errorInvalid")
    : result?.error === "INVALID_RANGE"
      ? tw("loan-emi-calculator.errorRange")
      : result?.error === "TOO_LONG"
        ? tw("loan-emi-calculator.errorTooLong")
        : "";
  const describedBy = errorText ? ERROR_ID : undefined;

  const reportText = useMemo(() => {
    if (!result || result.error || !allFilled) return "";
    const lines = [
      tw("loan-emi-calculator.summaryLabel"),
      `${tw("loan-emi-calculator.emiLabel")}: ${fmt.format(result.emi)}`,
      `${tw("loan-emi-calculator.totalInterestLabel")}: ${fmt.format(result.totalInterest)}`,
      `${tw("loan-emi-calculator.totalPayableLabel")}: ${fmt.format(result.totalPayable)}`,
      `${tw("loan-emi-calculator.formulaTitle")}: ${tw("loan-emi-calculator.formula")}`,
    ];
    if (showAmortisation) {
      lines.push(
        "",
        tw("loan-emi-calculator.tableTitle"),
        [
          tw("loan-emi-calculator.columnMonth"),
          tw("loan-emi-calculator.columnPayment"),
          tw("loan-emi-calculator.columnInterest"),
          tw("loan-emi-calculator.columnPrincipal"),
          tw("loan-emi-calculator.columnBalance"),
        ].join(" | "),
        ...result.preview.map((row) =>
          [
            String(row.month),
            fmt.format(row.payment),
            fmt.format(row.interest),
            fmt.format(row.principalPaid),
            fmt.format(row.balance),
          ].join(" | ")
        ),
        "",
        tw("loan-emi-calculator.roundingNote"),
      );
    }
    return lines.join("\n");
  }, [result, allFilled, fmt, showAmortisation, tw]);

  const handleCopy = useCallback(() => {
    if (reportText) void copy(reportText);
  }, [copy, reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setPrincipal(String(DEFAULTS.principal));
    setRate(String(DEFAULTS.annualRate));
    setTenure(String(DEFAULTS.tenureMonths));
    setTenureUnit("months");
    setShowAmortisation(true);
    reset();
  }, [reset]);

  const handleReset = useCallback(() => {
    setPrincipal("");
    setRate("");
    setTenure("");
    setTenureUnit("months");
    setShowAmortisation(true);
    reset();
  }, [reset]);

  const ready = Boolean(result && !result.error && !errorText && allFilled);

  return (
    <ToolShell
      title={tw("loan-emi-calculator.title")}
      icon="Calculator"
      sampleLabel={tw("loan-emi-calculator.trySample")}
      resetLabel={tw("loan-emi-calculator.reset")}
      privacyLabel={tw("loan-emi-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-emi-input-title"
          title={tw("loan-emi-calculator.inputTitle")}
          hint={tw("loan-emi-calculator.inputHint")}
        >
          <ToolField
            label={tw("loan-emi-calculator.principalLabel")}
            htmlFor="tp-emi-principal"
            hint={tw("loan-emi-calculator.principalHint")}
          >
            <NumberStepper
              id="tp-emi-principal"
              value={principal}
              min={1}
              step={1000}
              inputMode="decimal"
              ariaLabel={tw("loan-emi-calculator.principalLabel")}
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
            label={tw("loan-emi-calculator.rateLabel")}
            htmlFor="tp-emi-rate"
            hint={tw("loan-emi-calculator.rateHint")}
          >
            <NumberStepper
              id="tp-emi-rate"
              value={rate}
              min={0}
              step={0.25}
              inputMode="decimal"
              ariaLabel={tw("loan-emi-calculator.rateLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setRate(next);
                reset();
              }}
            />
          </ToolField>

          <div className="tp-tool-group">
            <SegmentedControl<"months" | "years">
              label={tw("loan-emi-calculator.tenureUnitLabel")}
              value={tenureUnit}
              options={[
                { value: "months", label: tw("loan-emi-calculator.tenureMonths") },
                { value: "years", label: tw("loan-emi-calculator.tenureYears") },
              ]}
              onChange={(next) => {
                if (next === tenureUnit) return;
                const current = parseValue(tenure);
                if (current !== null) {
                  const converted = next === "years" ? current / 12 : current * 12;
                  const clean = Number.isFinite(converted)
                    ? String(Number.isInteger(converted) ? converted : Number(converted.toFixed(2)))
                    : tenure;
                  setTenure(clean);
                }
                setTenureUnit(next);
                reset();
              }}
            />
          </div>

          <ToolField
            label={tw("loan-emi-calculator.tenureLabel")}
            htmlFor="tp-emi-tenure"
            hint={tw("loan-emi-calculator.tenureHint")}
          >
            <NumberStepper
              id="tp-emi-tenure"
              value={tenure}
              min={1}
              max={tenureUnit === "years" ? 50 : 600}
              step={tenureUnit === "years" ? 1 : 12}
              inputMode="numeric"
              ariaLabel={tw("loan-emi-calculator.tenureLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={(next) => {
                setTenure(next);
                reset();
              }}
            />
          </ToolField>

          <p className="tp-tool-hint">{tw("loan-emi-calculator.defaultsNote")}</p>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("loan-emi-calculator.displayOptionsTitle")}
            </p>
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-emi-show-amortisation"
                label={tw("loan-emi-calculator.showAmortisation")}
                checked={showAmortisation}
                onChange={() => setShowAmortisation((previous) => !previous)}
              />
              <label htmlFor="tp-emi-show-amortisation" className="tp-check-label">
                {tw("loan-emi-calculator.showAmortisation")}
              </label>
            </div>
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
          id="tp-emi-result-title"
          title={t("result")}
          hint={tw("loan-emi-calculator.resultHint")}
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
                fileName="loan-emi-report.txt"
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
                title={tw("loan-emi-calculator.emptyTitle")}
                hint={tw("loan-emi-calculator.emptyHint")}
              />
            </div>
          ) : ready && result ? (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-label">
                {tw("loan-emi-calculator.summaryLabel")}
              </p>
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("loan-emi-calculator.emiLabel")}
                  value={fmt.format(result.emi)}
                />
                <Stat
                  label={tw("loan-emi-calculator.totalInterestLabel")}
                  value={fmt.format(result.totalInterest)}
                />
                <Stat
                  label={tw("loan-emi-calculator.totalPayableLabel")}
                  value={fmt.format(result.totalPayable)}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("loan-emi-calculator.formulaTitle")}
                </span>
                <div className="tp-tool-url">
                  <code dir="ltr">{tw("loan-emi-calculator.formula")}</code>
                </div>
                <p className="tp-tool-hint">
                  {tw("loan-emi-calculator.formulaHint")}
                </p>
              </div>

              {showAmortisation ? (
                <div className="flex flex-col gap-1">
                  <span className="tp-tool-label">
                    {tw("loan-emi-calculator.tableTitle")}
                  </span>
                  <div className="max-h-[260px] overflow-auto rounded-[10px] border border-[var(--border)]">
                    <table
                      className="w-full min-w-[520px] border-collapse text-left font-mono text-[12px]"
                      dir="ltr"
                    >
                      <thead className="sticky top-0 bg-[var(--surface)]">
                        <tr>
                          <th
                            scope="col"
                            className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                          >
                            {tw("loan-emi-calculator.columnMonth")}
                          </th>
                          <th
                            scope="col"
                            className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                          >
                            {tw("loan-emi-calculator.columnPayment")}
                          </th>
                          <th
                            scope="col"
                            className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                          >
                            {tw("loan-emi-calculator.columnInterest")}
                          </th>
                          <th
                            scope="col"
                            className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                          >
                            {tw("loan-emi-calculator.columnPrincipal")}
                          </th>
                          <th
                            scope="col"
                            className="border-b border-[var(--border)] px-3 py-2 font-semibold text-[var(--muted)]"
                          >
                            {tw("loan-emi-calculator.columnBalance")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview.map((row) => (
                          <tr
                            key={row.month}
                            className="border-b border-[var(--border)] last:border-0"
                          >
                            <td className="px-3 py-2 text-[var(--text)]">{row.month}</td>
                            <td className="px-3 py-2 text-[var(--text)]">
                              {fmt.format(row.payment)}
                            </td>
                            <td className="px-3 py-2 text-[var(--text)]">
                              {fmt.format(row.interest)}
                            </td>
                            <td className="px-3 py-2 text-[var(--text)]">
                              {fmt.format(row.principalPaid)}
                            </td>
                            <td className="px-3 py-2 text-[var(--text)]">
                              {fmt.format(row.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="tp-tool-hint">
                    {tw("loan-emi-calculator.roundingNote")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Calculator aria-hidden="true" />}
                title={tw("loan-emi-calculator.emptyTitle")}
                hint={errorText || tw("loan-emi-calculator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
