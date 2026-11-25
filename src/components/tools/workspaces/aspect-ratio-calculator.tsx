"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  commonRatios,
  parseRatio,
  RatioError,
  reduceRatio,
  scaleDimensions,
  type Dimensions,
  type Ratio,
  type RoundingMode,
} from "./aspect-ratio-calculator.logic";

type LockMode = "width" | "height";
type AspectOptions = { rounding: RoundingMode; lock: LockMode };

type Calculation =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; dimensions: Dimensions; ratio: Ratio };

export default function AspectRatioCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [target, setTarget] = useState("");
  const [preset, setPreset] = useState("");
  const { options, update } = usePersistedOptions<AspectOptions>(
    "toolpika:aspect-ratio-calculator:options",
    { rounding: "nearest", lock: "width" },
  );
  const { notice, showNotice } = useToolNotice();
  const widthRef = useRef<HTMLInputElement | null>(null);

  const delayedWidth = useDebounced(width);
  const delayedHeight = useDebounced(height);
  const delayedTarget = useDebounced(target);

  const calculation = useMemo<Calculation>(() => {
    if (!delayedWidth.trim() || !delayedHeight.trim() || !delayedTarget.trim()) {
      return { status: "idle" };
    }

    const sourceWidth = Number(delayedWidth);
    const sourceHeight = Number(delayedHeight);
    const goal = Number(delayedTarget);
    if (
      !Number.isFinite(sourceWidth) ||
      !Number.isFinite(sourceHeight) ||
      !Number.isFinite(goal)
    ) {
      return { status: "error", message: tw("aspect-ratio-calculator.errorNumber") };
    }
    if (sourceWidth <= 0 || sourceHeight <= 0 || goal <= 0) {
      return { status: "error", message: tw("aspect-ratio-calculator.errorPositive") };
    }

    try {
      return {
        status: "ready",
        dimensions: scaleDimensions(
          sourceWidth,
          sourceHeight,
          options.lock === "width" ? { width: goal } : { height: goal },
          options.rounding,
        ),
        ratio: reduceRatio(sourceWidth, sourceHeight),
      };
    } catch (error) {
      const message =
        error instanceof RatioError && error.code === "MISSING_TARGET"
          ? tw("aspect-ratio-calculator.errorTarget")
          : tw("aspect-ratio-calculator.errorPositive");
      return { status: "error", message };
    }
  }, [delayedWidth, delayedHeight, delayedTarget, options.lock, options.rounding, tw]);

  const resultText = useMemo(() => {
    if (calculation.status !== "ready") return "";
    return tw("aspect-ratio-calculator.copyText", {
      ratio: `${calculation.ratio.w}:${calculation.ratio.h}`,
      width: calculation.dimensions.width,
      height: calculation.dimensions.height,
      w: calculation.ratio.w,
      h: calculation.ratio.h,
    });
  }, [calculation, tw]);

  const handleCopy = useCallback(() => {
    if (!resultText) return;
    void (async () => {
      try {
        await navigator.clipboard.writeText(resultText);
      } catch {
        showNotice(tw("aspect-ratio-calculator.clipboardUnavailable"));
      }
    })();
  }, [resultText, showNotice, tw]);

  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setWidth("1920");
    setHeight("1080");
    setPreset("16:9");
    setTarget(options.lock === "width" ? "1280" : "720");
  }, [options.lock]);

  const handleReset = useCallback(() => {
    setWidth("");
    setHeight("");
    setTarget("");
    setPreset("");
    widthRef.current?.focus();
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      const parsed = parseRatio(clip);
      if (!parsed) {
        showNotice(tw("aspect-ratio-calculator.pasteInvalid"));
      } else {
        setWidth(String(parsed.w));
        setHeight(String(parsed.h));
        setPreset("");
      }
    } catch {
      showNotice(tw("aspect-ratio-calculator.clipboardUnavailable"));
    }
    widthRef.current?.focus();
  }, [showNotice, tw]);

  const handlePreset = (value: string) => {
    setPreset(value);
    if (!value) return;
    const matched = parseRatio(value);
    if (!matched) return;
    setWidth(String(matched.w));
    setHeight(String(matched.h));
  };

  const statusBadge =
    calculation.status === "ready" ? (
      <ToolBadge tone="success">{tw("aspect-ratio-calculator.statusReady")}</ToolBadge>
    ) : calculation.status === "error" ? (
      <ToolBadge tone="danger">{tw("aspect-ratio-calculator.statusError")}</ToolBadge>
    ) : (
      <ToolBadge>{tw("aspect-ratio-calculator.statusIdle")}</ToolBadge>
    );

  return (
    <ToolShell
      title={tw("aspect-ratio-calculator.title")}
      icon="Ruler"
      sampleLabel={tw("aspect-ratio-calculator.trySample")}
      resetLabel={tw("aspect-ratio-calculator.reset")}
      privacyLabel={tw("privacyRibbon")}
      shortcutHint={tw("aspect-ratio-calculator.shortcutHint")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      noticeTone="warning"
      input={
        <ToolPane
          id="tp-arc-input-title"
          title={tw("aspect-ratio-calculator.inputTitle")}
          hint={tw("aspect-ratio-calculator.inputHint")}
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handlePaste()}
              >
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("aspect-ratio-calculator.paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={!width && !height && !target}
              >
                {t("clear")}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("aspect-ratio-calculator.widthLabel")} htmlFor="tp-arc-width">
              <input
                id="tp-arc-width"
                ref={widthRef}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className="tp-tool-field"
                value={width}
                onChange={(event) => {
                  setWidth(event.target.value);
                  setPreset("");
                }}
              />
            </ToolField>
            <ToolField label={tw("aspect-ratio-calculator.heightLabel")} htmlFor="tp-arc-height">
              <input
                id="tp-arc-height"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className="tp-tool-field"
                value={height}
                onChange={(event) => {
                  setHeight(event.target.value);
                  setPreset("");
                }}
              />
            </ToolField>
          </div>

          <ToolField label={tw("aspect-ratio-calculator.presetLabel")} htmlFor="tp-arc-preset">
            <select
              id="tp-arc-preset"
              className="tp-tool-select"
              value={preset}
              onChange={(event) => handlePreset(event.target.value)}
            >
              <option value="">{tw("aspect-ratio-calculator.presetCustom")}</option>
              {commonRatios.map((ratio) => {
                const label = `${ratio.w}:${ratio.h}`;
                return (
                  <option key={label} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<LockMode>
              label={tw("aspect-ratio-calculator.lockLabel")}
              value={options.lock}
              options={[
                { value: "width", label: tw("aspect-ratio-calculator.byWidth") },
                { value: "height", label: tw("aspect-ratio-calculator.byHeight") },
              ]}
              onChange={(value) => update({ lock: value })}
            />
          </div>

          <ToolField
            label={
              options.lock === "width"
                ? tw("aspect-ratio-calculator.targetWidthLabel")
                : tw("aspect-ratio-calculator.targetHeightLabel")
            }
            htmlFor="tp-arc-target"
          >
            <input
              id="tp-arc-target"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              className="tp-tool-field"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
            />
          </ToolField>

          {calculation.status === "error" ? (
            <p className="tp-tool-error" role="alert">
              {calculation.message}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-arc-result-title"
          title={tw("aspect-ratio-calculator.resultTitle")}
          hint={tw("aspect-ratio-calculator.resultHint")}
          result
          actions={
            <>
              {statusBadge}
              <CopyButton
                text={resultText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={resultText}
                fileName={tw("aspect-ratio-calculator.fileName")}
                label={t("download")}
                disabled={!resultText}
              />
            </>
          }
        >
          {calculation.status === "ready" ? (
            <div className="tp-tool-result">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("aspect-ratio-calculator.reducedLabel")}
                </span>
                <span className="tp-tool-pill">
                  {`${calculation.ratio.w}:${calculation.ratio.h}`}
                </span>
              </div>

              <dl className="tp-tool-stats">
                <Stat label={tw("aspect-ratio-calculator.widthStat")} value={calculation.dimensions.width} />
                <Stat label={tw("aspect-ratio-calculator.heightStat")} value={calculation.dimensions.height} />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("aspect-ratio-calculator.cssLabel")}</span>
                <div className="tp-tool-url">
                  <code>
                    {`aspect-ratio: ${calculation.ratio.w} / ${calculation.ratio.h}`}
                  </code>
                </div>
              </div>

              <div
                className="tp-tool-preview"
                style={{ aspectRatio: `${calculation.ratio.w} / ${calculation.ratio.h}` }}
                role="img"
                aria-label={tw("aspect-ratio-calculator.previewLabel", {
                  ratio: `${calculation.ratio.w}:${calculation.ratio.h}`,
                })}
              />
            </div>
          ) : (
            <ToolEmpty
              icon={<Ruler />}
              title={tw("aspect-ratio-calculator.emptyTitle")}
              hint={tw("aspect-ratio-calculator.emptyHint")}
            />
          )}
        </ToolPane>
      }
      options={
        <>
          <div className="tp-tool-options-head">
            <h3>{tw("aspect-ratio-calculator.optionsTitle")}</h3>
          </div>
          <div className="tp-tool-options-grid">
            <div className="tp-tool-group">
              <p className="tp-tool-group-title">
                {tw("aspect-ratio-calculator.roundingLabel")}
              </p>
              <select
                id="tp-arc-rounding"
                className="tp-tool-select"
                aria-label={tw("aspect-ratio-calculator.roundingLabel")}
                value={options.rounding}
                onChange={(event) =>
                  update({ rounding: event.target.value as RoundingMode })
                }
              >
                <option value="nearest">{tw("aspect-ratio-calculator.roundNearest")}</option>
                <option value="up">{tw("aspect-ratio-calculator.roundUp")}</option>
                <option value="down">{tw("aspect-ratio-calculator.roundDown")}</option>
              </select>
            </div>
          </div>
        </>
      }
    />
  );
}
