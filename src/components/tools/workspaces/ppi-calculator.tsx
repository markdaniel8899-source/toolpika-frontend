"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  HeroValue,
  NumberStepper,
  ToolBadge,
  ToolEmpty,
} from "../workspace-ui";
import {
  PPI_DEFAULTS,
  calculatePpi,
  previewSize,
  type PpiErrorCode,
} from "./ppi-calculator.logic";

const ERROR_ID = "tp-ppi-error";

const PRESETS = [
  { key: "preset1080p", width: 1920, height: 1080, diagonal: 24 },
  { key: "preset1440p", width: 2560, height: 1440, diagonal: 27 },
  { key: "preset4k", width: 3840, height: 2160, diagonal: 27 },
  { key: "presetMacbook", width: 3024, height: 1964, diagonal: 14 },
] as const;

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
  const errorText = code
    ? `${code === "nonPositive"
      ? tw("ppi-calculator.errorPositive")
      : tw("ppi-calculator.errorNumber")} ${code === "nonPositive"
      ? tw("ppi-calculator.fixPositive")
      : tw("ppi-calculator.fixNumber")}`
    : "";

  const preview = useMemo(() => {
    if (!ready) return null;
    return previewSize(Number(width), Number(height), 360, 140);
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

  const applyPreset = (widthValue: number, heightValue: number, diagonalValue: number) => {
    setWidth(String(widthValue));
    setHeight(String(heightValue));
    setDiagonal(String(diagonalValue));
  };

  const handleSample = () => {
    applyPreset(
      PPI_DEFAULTS.width,
      PPI_DEFAULTS.height,
      PPI_DEFAULTS.diagonalInches,
    );
  };

  const clearAll = () => {
    setWidth("");
    setHeight("");
    setDiagonal("");
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Ruler" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("ppi-calculator.title")}</span>
            <span className="tp-tool-subtitle">{tw("ppi-calculator.shortDesc")}</span>
          </span>
        </div>
        <ToolBadge tone="accent">{tw("ppi-calculator.heroLabel")}</ToolBadge>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
            {tw("ppi-calculator.trySample")}
          </Button>
        </div>
      </div>

      {errorText ? (
        <p className="tp-tool-notice" id={ERROR_ID} data-tone="danger" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-ppi-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-ppi-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("ppi-calculator.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("ppi-calculator.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("ppi-calculator.presetsLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => applyPreset(preset.width, preset.height, preset.diagonal)}
                >
                  {tw(`ppi-calculator.${preset.key}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="tp-ppi-width" className="text-sm font-medium text-[var(--text)]">
                {tw("ppi-calculator.widthLabel")}
              </label>
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
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="tp-ppi-height" className="text-sm font-medium text-[var(--text)]">
                {tw("ppi-calculator.heightLabel")}
              </label>
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
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-ppi-diagonal" className="text-sm font-medium text-[var(--text)]">
              {tw("ppi-calculator.diagonalLabel")}
            </label>
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
            <p className="tp-tool-hint">{tw("ppi-calculator.diagonalHint")}</p>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <span>{tw("ppi-calculator.widthLabel")}</span>
            <strong dir="ltr">{width || "0"}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("ppi-calculator.heightLabel")}</span>
            <strong dir="ltr">{height || "0"}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("ppi-calculator.diagonalLabel")}</span>
            <strong dir="ltr">{diagonal || "0"}</strong>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 self-start lg:col-span-6 lg:sticky lg:top-4"
          aria-labelledby="tp-ppi-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-ppi-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("ppi-calculator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("ppi-calculator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={summary} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={summary}
                fileName={tw("ppi-calculator.fileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {ready && preview ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <div
                className="tp-stage"
                style={{ minHeight: 140 }}
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

              <div className="flex flex-wrap gap-2">
                <div className="tp-meta-pill">
                  <span>{tw("ppi-calculator.statAspect")}</span>
                  <strong dir="ltr">{`${ready.ratio.w}:${ready.ratio.h}`}</strong>
                </div>
                <div className="tp-meta-pill">
                  <span>{tw("ppi-calculator.statMegapixels")}</span>
                  <strong dir="ltr">{ready.megapixels.toFixed(2)}</strong>
                </div>
                <div className="tp-meta-pill">
                  <span>{tw("ppi-calculator.badgeDotPitch")}</span>
                  <strong dir="ltr">{(25.4 / ready.ppi).toFixed(3)} mm</strong>
                </div>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Ruler" />}
                title={tw("ppi-calculator.emptyTitle")}
                hint={tw("ppi-calculator.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("ppi-calculator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
