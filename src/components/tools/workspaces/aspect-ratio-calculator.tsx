"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
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
} from "./aspect-ratio-calculator.logic";

type LockMode = "width" | "height";

type Calculation =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; dimensions: Dimensions; ratio: Ratio };

const ERROR_ID = "tp-arc-error";

export default function AspectRatioCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [target, setTarget] = useState("");
  const [preset, setPreset] = useState("");
  const [lock, setLock] = useState<LockMode>("width");
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
          lock === "width" ? { width: goal } : { height: goal },
          "nearest",
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
  }, [delayedWidth, delayedHeight, delayedTarget, lock, tw]);

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
    setTarget(lock === "width" ? "1280" : "720");
  }, [lock]);

  const handleReset = useCallback(() => {
    setWidth("");
    setHeight("");
    setTarget("");
    setPreset("");
    setLock("width");
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

  const describedBy = calculation.status === "error" ? ERROR_ID : undefined;

  // Fit the ratio into the result pane while keeping the exact proportions.
  const previewSize = useMemo(() => {
    if (calculation.status !== "ready") return null;
    const scale = Math.min(480 / calculation.ratio.w, 240 / calculation.ratio.h);
    return {
      width: Math.max(1, Math.round(calculation.ratio.w * scale)),
      height: Math.max(1, Math.round(calculation.ratio.h * scale)),
    };
  }, [calculation]);

  return (
    <ToolShell
      title={tw("aspect-ratio-calculator.title")}
      icon="Ruler"
      sampleLabel={tw("aspect-ratio-calculator.trySample")}
      resetLabel={tw("aspect-ratio-calculator.reset")}
      privacyLabel={tw("privacyRibbon")}
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
              <NumberStepper
                id="tp-arc-width"
                inputRef={widthRef}
                value={width}
                min={1}
                ariaLabel={tw("aspect-ratio-calculator.widthLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => {
                  setWidth(next);
                  setPreset("");
                }}
              />
            </ToolField>
            <ToolField label={tw("aspect-ratio-calculator.heightLabel")} htmlFor="tp-arc-height">
              <NumberStepper
                id="tp-arc-height"
                value={height}
                min={1}
                ariaLabel={tw("aspect-ratio-calculator.heightLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(next) => {
                  setHeight(next);
                  setPreset("");
                }}
              />
            </ToolField>
          </div>

          <ToolField label={tw("aspect-ratio-calculator.presetLabel")}>
            <ThemedSelect
              value={preset}
              onValueChange={handlePreset}
              ariaLabel={tw("aspect-ratio-calculator.presetLabel")}
              options={[
                { value: "", label: tw("aspect-ratio-calculator.presetCustom") },
                ...commonRatios.map((ratio) => {
                  const label = `${ratio.w}:${ratio.h}`;
                  return { value: label, label };
                }),
              ]}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<LockMode>
              label={tw("aspect-ratio-calculator.lockLabel")}
              value={lock}
              options={[
                { value: "width", label: tw("aspect-ratio-calculator.byWidth") },
                { value: "height", label: tw("aspect-ratio-calculator.byHeight") },
              ]}
              onChange={setLock}
            />
          </div>

          <ToolField
            label={
              lock === "width"
                ? tw("aspect-ratio-calculator.targetWidthLabel")
                : tw("aspect-ratio-calculator.targetHeightLabel")
            }
            htmlFor="tp-arc-target"
          >
            <NumberStepper
              id="tp-arc-target"
              value={target}
              min={1}
              ariaLabel={
                lock === "width"
                  ? tw("aspect-ratio-calculator.targetWidthLabel")
                  : tw("aspect-ratio-calculator.targetHeightLabel")
              }
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setTarget}
            />
          </ToolField>

          {calculation.status === "error" ? (
            <p
              id={ERROR_ID}
              className="tp-tool-error"
              role="status"
              aria-live="polite"
            >
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
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("aspect-ratio-calculator.reducedLabel")}
                </span>
                <span className="tp-tool-pill">
                  {`${calculation.ratio.w}:${calculation.ratio.h}`}
                </span>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("aspect-ratio-calculator.widthStat")}
                  value={calculation.dimensions.width}
                />
                <Stat
                  label={tw("aspect-ratio-calculator.heightStat")}
                  value={calculation.dimensions.height}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("aspect-ratio-calculator.cssLabel")}</span>
                <div className="tp-tool-url">
                  <code>
                    {`aspect-ratio: ${calculation.ratio.w} / ${calculation.ratio.h}`}
                  </code>
                </div>
              </div>

              {previewSize ? (
                <>
                  <div
                    className="tp-tool-preview"
                    style={{
                      width: previewSize.width,
                      height: previewSize.height,
                      maxWidth: "100%",
                      aspectRatio: `${calculation.ratio.w} / ${calculation.ratio.h}`,
                    }}
                    role="img"
                    aria-label={tw("aspect-ratio-calculator.previewSize", previewSize)}
                  />
                  <p className="tp-tool-hint">
                    {tw("aspect-ratio-calculator.previewSize", previewSize)}
                  </p>
                </>
              ) : null}
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Ruler />}
                title={tw("aspect-ratio-calculator.emptyTitle")}
                hint={tw("aspect-ratio-calculator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
