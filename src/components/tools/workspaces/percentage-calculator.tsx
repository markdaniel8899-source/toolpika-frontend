"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, Check, Copy, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DownloadButton,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyFeedback,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculate,
  DEFAULTS,
  type CalculationError,
  type Mode,
} from "./percentage-calculator.logic";

const ERROR_ID = "tp-percentage-error";

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
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const formatted =
    calculation && !calculation.error
      ? formatter.format(calculation.value)
      : "";

  const resultText = useMemo(() => {
    if (!calculation || calculation.error || !formatted) return "";
    const lines = [`${tw("percentage-calculator.resultLabel")}: ${formatted}`];
    if (calculation.formula) {
      lines.push(`${tw("percentage-calculator.formulaLabel")}: ${calculation.formula}`);
    }
    return lines.join("\n");
  }, [calculation, formatted, tw]);

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

  const hasValues = a.trim().length > 0 && b.trim().length > 0;
  const invalid = invalidA || invalidB;
  const error: CalculationError | undefined = calculation?.error;
  const errorText = invalid
    ? `${tw("percentage-calculator.errorInvalid")} ${tw("percentage-calculator.fixInvalid")}`
    : error
      ? `${tw("percentage-calculator.errorDivision")} ${tw("percentage-calculator.fixDivision")}`
      : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const errorHint = invalid
    ? tw("percentage-calculator.fixInvalid")
    : tw("percentage-calculator.fixDivision");

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
          footer={
            <Button type="button" variant="outline" size="sm" onClick={swap}>
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("percentage-calculator.swap")}
            </Button>
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
              aria-invalid={Boolean(errorText)}
              aria-describedby={describedBy}
              autoComplete="off"
            />
          </ToolField>

          <ToolField
            label={tw("percentage-calculator.valueY")}
            htmlFor="tp-percentage-b"
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
              aria-invalid={Boolean(errorText)}
              aria-describedby={describedBy}
              autoComplete="off"
            />
          </ToolField>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-percentage-result-title"
          title={t("result")}
          result
          actions={
            <>
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
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Percent aria-hidden="true" />}
                title={tw("percentage-calculator.emptyTitle")}
                hint={tw("percentage-calculator.emptyHint")}
              />
            </div>
          ) : errorText ? (
            <div className="tp-tool-result" aria-live="polite">
              <p id={ERROR_ID} className="tp-tool-error" role="alert">
                {errorText}
              </p>
              <ToolEmpty
                icon={<Percent aria-hidden="true" />}
                title={tw("percentage-calculator.errorTitle")}
                hint={errorHint}
              />
            </div>
          ) : calculation && formatted ? (
            <div className="tp-tool-result" aria-live="polite">
              <p className="tp-tool-label">
                {tw("percentage-calculator.resultLabel")}
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
                {formatted}
              </output>
              <pre
                dir="ltr"
                className="m-0 overflow-auto whitespace-pre-wrap rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-[13px] leading-relaxed"
              >
                {calculation.formula}
              </pre>
            </div>
          ) : null}
        </ToolPane>
      }
    />
  );
}
