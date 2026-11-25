"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, Check, Copy, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  DownloadButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyFeedback,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculate,
  DEFAULTS,
  type CalculationError,
  type Mode,
} from "./percentage-calculator.logic";

type Decimals = 2 | 4 | 6;
type DecimalsValue = "2" | "4" | "6";

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function PercentageCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>(DEFAULTS.mode);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const { options, update } = usePersistedOptions<{
    decimals: Decimals;
    includeFormula: boolean;
  }>("tp-percentage-calculator-options", {
    decimals: 2,
    includeFormula: true,
  });
  const { copied, copy, reset } = useCopyFeedback();

  const parsedA = parseValue(a);
  const parsedB = parseValue(b);
  const invalidA = a.trim().length > 0 && parsedA === null;
  const invalidB = b.trim().length > 0 && parsedB === null;
  const calculation = useMemo(
    () =>
      parsedA !== null && parsedB !== null
        ? calculate(mode, parsedA, parsedB)
        : null,
    [mode, parsedA, parsedB],
  );

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: options.decimals,
      }),
    [locale, options.decimals],
  );
  const formatted =
    calculation && !calculation.error
      ? formatter.format(calculation.value)
      : "";

  const resultText = useMemo(() => {
    if (!calculation || calculation.error || !formatted) return "";
    const lines = [`${tw("percentage-calculator.resultLabel")}: ${formatted}`];
    if (options.includeFormula && calculation.formula) {
      lines.push(`${tw("percentage-calculator.formulaLabel")}: ${calculation.formula}`);
    }
    lines.push(
      `${tw("percentage-calculator.stepsLabel")}: ${calculation.steps.join("; ")}`,
    );
    return lines.join("\n");
  }, [calculation, formatted, options.includeFormula, tw]);

  const handleCopy = useCallback(() => {
    if (resultText) void copy(resultText);
  }, [copy, resultText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setMode(DEFAULTS.mode);
    setA(String(DEFAULTS.a));
    setB(String(DEFAULTS.b));
    reset();
  };

  const handleReset = () => {
    setMode(DEFAULTS.mode);
    setA("");
    setB("");
    reset();
  };

  const swap = () => {
    setA(b);
    setB(a);
    reset();
  };

  const errorText = (error: CalculationError | undefined) => {
    if (error === "DIVISION_BY_ZERO") {
      return `${tw("percentage-calculator.errorDivision")} ${tw("percentage-calculator.fixDivision")}`;
    }
    if (error === "INVALID_NUMBER") {
      return `${tw("percentage-calculator.errorInvalid")} ${tw("percentage-calculator.fixInvalid")}`;
    }
    return "";
  };

  const hasValues = a.trim().length > 0 && b.trim().length > 0;
  const hasError = Boolean(calculation?.error) || invalidA || invalidB;
  const statusTone: "neutral" | "success" | "danger" = hasError
    ? "danger"
    : formatted
      ? "success"
      : "neutral";
  const statusLabel = hasError
    ? tw("percentage-calculator.statusError")
    : formatted
      ? tw("percentage-calculator.statusLive")
      : tw("percentage-calculator.statusIdle");
  const decimalsValue = String(options.decimals) as DecimalsValue;

  return (
    <ToolShell
      title={tw("percentage-calculator.title")}
      icon="Percent"
      sampleLabel={tw("percentage-calculator.trySample")}
      resetLabel={tw("percentage-calculator.reset")}
      privacyLabel={tw("percentage-calculator.privacyRibbon")}
      shortcutHint={tw("percentage-calculator.shortcutHint")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-percentage-input-title"
          title={tw("percentage-calculator.inputTitle")}
          hint={tw("percentage-calculator.inputHint")}
          footer={
            <>
              <Button type="button" variant="outline" size="sm" onClick={swap}>
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("percentage-calculator.swap")}
              </Button>
              <span>{tw("percentage-calculator.inputFooterHint")}</span>
            </>
          }
        >
          <div>
            <label className="tp-tool-label" htmlFor="tp-percentage-mode">
              {tw("percentage-calculator.modeLabel")}
            </label>
            <select
              id="tp-percentage-mode"
              className="tp-tool-select"
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as Mode);
                reset();
              }}
            >
              <option value="percentOf">
                {tw("percentage-calculator.modePercentOf")}
              </option>
              <option value="whatPercent">
                {tw("percentage-calculator.modeWhatPercent")}
              </option>
              <option value="percentChange">
                {tw("percentage-calculator.modePercentChange")}
              </option>
              <option value="increaseBy">
                {tw("percentage-calculator.modeIncreaseBy")}
              </option>
              <option value="decreaseBy">
                {tw("percentage-calculator.modeDecreaseBy")}
              </option>
            </select>
          </div>

          <ToolField
            label={tw("percentage-calculator.valueX")}
            htmlFor="tp-percentage-a"
            hint={tw("percentage-calculator.valuesHint")}
          >
            <input
              id="tp-percentage-a"
              className="tp-tool-field"
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={a}
              onChange={(event) => {
                setA(event.target.value);
                reset();
              }}
              placeholder={String(DEFAULTS.a)}
              aria-invalid={invalidA}
              autoComplete="off"
            />
            {invalidA ? (
              <p className="tp-tool-error" role="alert">
                {tw("percentage-calculator.invalidNumber")}
              </p>
            ) : null}
          </ToolField>

          <ToolField
            label={tw("percentage-calculator.valueY")}
            htmlFor="tp-percentage-b"
            hint={tw("percentage-calculator.valuesHint")}
          >
            <input
              id="tp-percentage-b"
              className="tp-tool-field"
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={b}
              onChange={(event) => {
                setB(event.target.value);
                reset();
              }}
              placeholder={String(DEFAULTS.b)}
              aria-invalid={invalidB}
              autoComplete="off"
            />
            {invalidB ? (
              <p className="tp-tool-error" role="alert">
                {tw("percentage-calculator.invalidNumber")}
              </p>
            ) : null}
          </ToolField>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-percentage-result-title"
          title={t("result")}
          hint={tw("percentage-calculator.resultHint")}
          result
          actions={
            <>
              <ToolBadge tone={statusTone}>{statusLabel}</ToolBadge>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!resultText}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? t("copied") : tw("percentage-calculator.copyResult")}
              </Button>
              <DownloadButton
                content={resultText}
                fileName="percentage-result.txt"
                label={tw("percentage-calculator.downloadResult")}
              />
            </>
          }
        >
          {!hasValues ? (
            <ToolEmpty
              icon={<Percent aria-hidden="true" />}
              title={tw("percentage-calculator.emptyTitle")}
              hint={tw("percentage-calculator.emptyHint")}
            />
          ) : invalidA || invalidB ? (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-error" role="alert">
                {errorText("INVALID_NUMBER")}
              </p>
              <ToolEmpty
                icon={<Percent aria-hidden="true" />}
                title={tw("percentage-calculator.errorTitle")}
                hint={tw("percentage-calculator.fixInvalid")}
              />
            </div>
          ) : calculation?.error ? (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-error" role="alert">
                {errorText(calculation.error)}
              </p>
              <ToolEmpty
                icon={<Percent aria-hidden="true" />}
                title={tw("percentage-calculator.errorTitle")}
                hint={tw("percentage-calculator.fixDivision")}
              />
            </div>
          ) : calculation ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <div className="tp-tool-stat" data-accent="true">
                  <dt>{tw("percentage-calculator.resultLabel")}</dt>
                  <dd>{formatted}</dd>
                </div>
              </dl>

              {options.includeFormula && calculation.formula ? (
                <pre className="tp-tool-code">{calculation.formula}</pre>
              ) : null}

              <div>
                <p className="tp-tool-label">
                  {tw("percentage-calculator.stepsLabel")}
                </p>
                <ol className="tp-tool-list">
                  {calculation.steps.map((step, index) => (
                    <li className="tp-tool-row" key={index}>
                      <span className="tp-tool-pill">
                        {tw("percentage-calculator.stepIndex", {
                          index: index + 1,
                        })}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </ToolPane>
      }
      options={
        <div>
          <div className="tp-tool-options-head">
            <h3>{tw("percentage-calculator.optionsTitle")}</h3>
          </div>
          <div className="tp-tool-options-grid">
            <div className="tp-tool-group">
              <p className="tp-tool-group-title">
                {tw("percentage-calculator.decimalsLabel")}
              </p>
              <SegmentedControl
                label={tw("percentage-calculator.decimalsLabel")}
                value={decimalsValue}
                options={[
                  { value: "2" as DecimalsValue, label: "2" },
                  { value: "4" as DecimalsValue, label: "4" },
                  { value: "6" as DecimalsValue, label: "6" },
                ]}
                onChange={(value) =>
                  update({ decimals: Number(value) as Decimals })
                }
              />
            </div>
            <div className="tp-tool-group">
              <p className="tp-tool-group-title">
                {tw("percentage-calculator.displayLabel")}
              </p>
              <CheckboxRow
                id="tp-percentage-formula"
                label={tw("percentage-calculator.includeFormula")}
                checked={options.includeFormula}
                onChange={(checked) => update({ includeFormula: checked })}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}
