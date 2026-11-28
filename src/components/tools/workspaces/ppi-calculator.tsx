"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Ruler } from "lucide-react";
import {
  CopyButton,
  DownloadButton,
  HeroValue,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  PPI_DEFAULTS,
  calculatePpi,
  previewSize,
  type PpiErrorCode,
} from "./ppi-calculator.logic";

const ERROR_ID = "tp-ppi-error";

export default function PpiCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [diagonal, setDiagonal] = useState("");

  const calculation = useMemo(() => {
    if (!width.trim() || !height.trim() || !diagonal.trim()) return null;
    return calculatePpi({
      width: Number(width),
      height: Number(height),
      diagonalInches: Number(diagonal),
    });
  }, [width, height, diagonal]);

  const ready = calculation?.ok ? calculation : null;
  const code: PpiErrorCode | null = calculation && !calculation.ok ? calculation.code : null;

  const preview = useMemo(() => {
    if (!ready) return null;
    return previewSize(Number(width), Number(height));
  }, [ready, width, height]);

  const summary = useMemo(() => {
    if (!ready) return "";
    return tw("ppi-calculator.copyText", {
      ppi: ready.ppi.toFixed(1),
      width: Number(width),
      height: Number(height),
      inches: Number(diagonal),
      ratio: `${ready.ratio.w}:${ready.ratio.h}`,
    });
  }, [ready, width, height, diagonal, tw]);

  const handleCopy = useCallback(() => {
    if (!summary) return;
    void navigator.clipboard.writeText(summary).catch(() => undefined);
  }, [summary]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setWidth(String(PPI_DEFAULTS.width));
    setHeight(String(PPI_DEFAULTS.height));
    setDiagonal(String(PPI_DEFAULTS.diagonalInches));
  };

  const handleReset = () => {
    setWidth("");
    setHeight("");
    setDiagonal("");
  };

  return (
    <ToolShell
      title={tw("ppi-calculator.title")}
      subtitle={tw("ppi-calculator.shortDesc")}
      icon="Ruler"
      sampleLabel={tw("ppi-calculator.trySample")}
      resetLabel={tw("ppi-calculator.reset")}
      privacyLabel={tw("ppi-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-ppi-input-title"
          title={tw("ppi-calculator.inputTitle")}
          hint={tw("ppi-calculator.inputHint")}
          className="lg:order-last"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("ppi-calculator.widthLabel")} htmlFor="tp-ppi-width">
              <NumberStepper
                id="tp-ppi-width"
                value={width}
                min={1}
                ariaLabel={tw("ppi-calculator.widthLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={code ? ERROR_ID : undefined}
                onValueChange={setWidth}
              />
            </ToolField>
            <ToolField label={tw("ppi-calculator.heightLabel")} htmlFor="tp-ppi-height">
              <NumberStepper
                id="tp-ppi-height"
                value={height}
                min={1}
                ariaLabel={tw("ppi-calculator.heightLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={code ? ERROR_ID : undefined}
                onValueChange={setHeight}
              />
            </ToolField>
          </div>

          <ToolField
            label={tw("ppi-calculator.diagonalLabel")}
            htmlFor="tp-ppi-diagonal"
            hint={tw("ppi-calculator.diagonalHint")}
          >
            <NumberStepper
              id="tp-ppi-diagonal"
              value={diagonal}
              min={0.1}
              step={0.1}
              inputMode="decimal"
              ariaLabel={tw("ppi-calculator.diagonalLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={code ? ERROR_ID : undefined}
              onValueChange={setDiagonal}
            />
          </ToolField>

          {code ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {code === "nonPositive"
                ? tw("ppi-calculator.errorPositive")
                : tw("ppi-calculator.errorNumber")}
              {" "}
              {code === "nonPositive"
                ? tw("ppi-calculator.fixPositive")
                : tw("ppi-calculator.fixNumber")}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-ppi-result-title"
          title={tw("ppi-calculator.resultTitle")}
          hint={tw("ppi-calculator.resultHint")}
          result
          className="lg:order-first"
          actions={
            <>
              <CopyButton text={summary} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={summary}
                fileName={tw("ppi-calculator.fileName")}
                label={t("download")}
              />
            </>
          }
        >
          {ready && preview ? (
            <div className="tp-tool-result" aria-live="polite">
              <div
                className="flex min-h-[220px] items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4"
                role="img"
                aria-label={tw("ppi-calculator.previewLabel", {
                  width: Number(width),
                  height: Number(height),
                })}
              >
                <div
                  className="tp-tool-preview"
                  style={{ width: preview.width, height: preview.height, maxWidth: "100%" }}
                />
              </div>

              <HeroValue
                label={tw("ppi-calculator.heroLabel")}
                value={ready.ppi.toFixed(1)}
                note={tw("ppi-calculator.heroNote")}
              />

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("ppi-calculator.statMegapixels")}
                  value={ready.megapixels.toFixed(2)}
                />
                <Stat
                  label={tw("ppi-calculator.statDiagonalPixels")}
                  value={String(Math.round(ready.diagonalPixels))}
                />
                <Stat
                  label={tw("ppi-calculator.statAspect")}
                  value={`${ready.ratio.w}:${ready.ratio.h}`}
                />
                <Stat
                  label={tw("ppi-calculator.statDimensions")}
                  value={`${Number(width)} × ${Number(height)}`}
                />
              </dl>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Ruler aria-hidden="true" />}
                title={tw("ppi-calculator.emptyTitle")}
                hint={tw("ppi-calculator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
