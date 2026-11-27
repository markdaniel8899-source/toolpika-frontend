"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Database } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  calculateVideoSize,
  DEFAULT_VIDEO_SIZE_INPUT,
  formatVideoSizeReport,
  RESOLUTION_BITRATES,
  SAMPLE_VIDEO_SIZE_INPUT,
  type StorageCapacityId,
  type VideoResolution,
  type VideoSizeErrorCode,
  type VideoSizeInput,
  type VideoSizeMode,
} from "./video-size-calculator.logic";

const ERROR_ID = "tp-video-size-error";

function parseValue(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return Number.NaN;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

export default function VideoSizeCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [mode, setMode] = useState<VideoSizeMode>(DEFAULT_VIDEO_SIZE_INPUT.mode);
  const [resolution, setResolution] = useState<VideoResolution>(
    DEFAULT_VIDEO_SIZE_INPUT.resolution,
  );
  const [duration, setDuration] = useState(
    String(DEFAULT_VIDEO_SIZE_INPUT.durationMinutes),
  );
  const [bitrate, setBitrate] = useState(
    String(DEFAULT_VIDEO_SIZE_INPUT.bitrateMbps),
  );
  const [dataRate, setDataRate] = useState(
    String(DEFAULT_VIDEO_SIZE_INPUT.dataRateMBPerMin),
  );

  const activeFields =
    mode === "bitrate" ? [duration, bitrate] : [duration, dataRate];
  const allFilled = activeFields.every((value) => value.trim().length > 0);
  const invalidTyped = activeFields.some(
    (value) => value.trim().length > 0 && !Number.isFinite(parseValue(value)),
  );

  const input: VideoSizeInput = useMemo(
    () => ({
      mode,
      resolution,
      durationMinutes: parseValue(duration),
      bitrateMbps: parseValue(bitrate),
      dataRateMBPerMin: parseValue(dataRate),
    }),
    [mode, resolution, duration, bitrate, dataRate],
  );

  const result = useMemo(() => calculateVideoSize(input), [input]);

  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
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
  const formatCount = useCallback(
    (value: number) => whole.format(Math.round(value)),
    [whole],
  );
  const formatDecimal = useCallback(
    (value: number) => precise.format(value),
    [precise],
  );

  const resolutionOptions = useMemo(
    () => [
      {
        value: "res480p" as const,
        label: tw("video-size-calculator.res480p"),
      },
      {
        value: "res720p" as const,
        label: tw("video-size-calculator.res720p"),
      },
      {
        value: "res1080p" as const,
        label: tw("video-size-calculator.res1080p"),
      },
      {
        value: "res1440p" as const,
        label: tw("video-size-calculator.res1440p"),
      },
      {
        value: "res2160p" as const,
        label: tw("video-size-calculator.res2160p"),
      },
    ],
    [tw],
  );

  const capacityLabels = useMemo<Record<StorageCapacityId, string>>(
    () => ({
      gb1: tw("video-size-calculator.capacityGb1"),
      gb64: tw("video-size-calculator.capacityGb64"),
      gb256: tw("video-size-calculator.capacityGb256"),
      tb1: tw("video-size-calculator.capacityTb1"),
    }),
    [tw],
  );

  const errorCode: VideoSizeErrorCode | undefined = result.error;
  const errorText = invalidTyped
    ? `${tw("video-size-calculator.errorInvalid")} ${tw("video-size-calculator.fixInvalid")}`
    : errorCode === "OUT_OF_RANGE"
      ? `${tw("video-size-calculator.errorRange")} ${tw("video-size-calculator.fixRange")}`
      : "";
  const ready = allFilled && !invalidTyped && !result.error;

  const reportText = useMemo(() => {
    if (!ready) return "";
    return formatVideoSizeReport(
      result,
      {
        title: tw("video-size-calculator.reportTitle"),
        size: tw("video-size-calculator.heroLabel"),
        sizeMB: tw("video-size-calculator.sizeMBLabel"),
        sizeGB: tw("video-size-calculator.sizeGBLabel"),
        equivalent: tw("video-size-calculator.equivalentLabel"),
        unitMbps: tw("video-size-calculator.unitMbps"),
        duration: tw("video-size-calculator.durationLabel"),
        storage: tw("video-size-calculator.storageTitle"),
        note: tw("video-size-calculator.reportNote"),
        capacityGb1: capacityLabels.gb1,
        capacityGb64: capacityLabels.gb64,
        capacityGb256: capacityLabels.gb256,
        capacityTb1: capacityLabels.tb1,
        file: tw("video-size-calculator.file"),
        files: tw("video-size-calculator.files"),
      },
      formatCount,
      formatDecimal,
      formatCount,
    );
  }, [ready, result, tw, capacityLabels, formatCount, formatDecimal]);

  const handleSample = () => {
    setMode(SAMPLE_VIDEO_SIZE_INPUT.mode);
    setResolution(SAMPLE_VIDEO_SIZE_INPUT.resolution);
    setDuration(String(SAMPLE_VIDEO_SIZE_INPUT.durationMinutes));
    setBitrate(String(SAMPLE_VIDEO_SIZE_INPUT.bitrateMbps));
    setDataRate(String(SAMPLE_VIDEO_SIZE_INPUT.dataRateMBPerMin));
  };

  const handleReset = () => {
    setMode(DEFAULT_VIDEO_SIZE_INPUT.mode);
    setResolution(DEFAULT_VIDEO_SIZE_INPUT.resolution);
    setDuration("");
    setBitrate("");
    setDataRate("");
  };

  const heroSize =
    result.sizeMB >= 1000
      ? `${formatDecimal(result.sizeGB)} ${tw("video-size-calculator.unitGB")}`
      : `${formatCount(result.sizeMB)} ${tw("video-size-calculator.unitMB")}`;

  return (
    <ToolShell
      title={tw("video-size-calculator.title")}
      icon="Database"
      sampleLabel={tw("video-size-calculator.trySample")}
      resetLabel={tw("video-size-calculator.reset")}
      privacyLabel={tw("video-size-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-video-size-input-title"
          title={tw("video-size-calculator.inputTitle")}
          hint={tw("video-size-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<VideoSizeMode>
              label={tw("video-size-calculator.modeLabel")}
              value={mode}
              options={[
                {
                  value: "bitrate",
                  label: tw("video-size-calculator.modeBitrate"),
                },
                {
                  value: "dataRate",
                  label: tw("video-size-calculator.modeDataRate"),
                },
              ]}
              onChange={setMode}
            />
          </div>

          <ToolField
            label={tw("video-size-calculator.durationLabel")}
            htmlFor="tp-video-duration"
            hint={tw("video-size-calculator.durationHint")}
          >
            <NumberStepper
              id="tp-video-duration"
              value={duration}
              min={1}
              max={10080}
              step={1}
              inputMode="decimal"
              ariaLabel={tw("video-size-calculator.durationLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={errorText ? ERROR_ID : undefined}
              onValueChange={setDuration}
            />
          </ToolField>

          {mode === "bitrate" ? (
            <div className="flex flex-col gap-3">
              <div className="tp-tool-group tp-tool-group--flush">
                <p className="tp-tool-group-title">
                  {tw("video-size-calculator.resolutionLabel")}
                </p>
                <ThemedSelect
                  value={resolution}
                  ariaLabel={tw("video-size-calculator.resolutionLabel")}
                  options={resolutionOptions}
                  onValueChange={(next) => {
                    const chosen = next as VideoResolution;
                    setResolution(chosen);
                    setBitrate(String(RESOLUTION_BITRATES[chosen]));
                  }}
                />
                <p className="tp-tool-hint">
                  {tw("video-size-calculator.resolutionHint")}
                </p>
              </div>

              <ToolField
                label={tw("video-size-calculator.bitrateLabel")}
                htmlFor="tp-video-bitrate"
                hint={tw("video-size-calculator.bitrateHint")}
              >
                <NumberStepper
                  id="tp-video-bitrate"
                  value={bitrate}
                  min={0.1}
                  max={1000}
                  step={0.5}
                  inputMode="decimal"
                  ariaLabel={tw("video-size-calculator.bitrateLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  describedBy={errorText ? ERROR_ID : undefined}
                  onValueChange={setBitrate}
                />
              </ToolField>
            </div>
          ) : (
            <ToolField
              label={tw("video-size-calculator.dataRateLabel")}
              htmlFor="tp-video-data-rate"
              hint={tw("video-size-calculator.dataRateHint")}
            >
              <NumberStepper
                id="tp-video-data-rate"
                value={dataRate}
                min={0.1}
                max={10000}
                step={5}
                inputMode="decimal"
                ariaLabel={tw("video-size-calculator.dataRateLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={errorText ? ERROR_ID : undefined}
                onValueChange={setDataRate}
              />
            </ToolField>
          )}

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-video-size-result-title"
          title={t("result")}
          hint={tw("video-size-calculator.resultHint")}
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
                icon={<Database aria-hidden="true" />}
                title={tw("video-size-calculator.emptyTitle")}
                hint={errorText || tw("video-size-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("video-size-calculator.heroLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {heroSize}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("video-size-calculator.sizeMBLabel")}
                  value={formatCount(result.sizeMB)}
                />
                <Stat
                  label={tw("video-size-calculator.sizeGBLabel")}
                  value={formatDecimal(result.sizeGB)}
                />
                <Stat
                  label={tw("video-size-calculator.equivalentLabel")}
                  value={`${formatDecimal(result.equivalentMbps)} ${tw("video-size-calculator.unitMbps")}`}
                />
                <Stat
                  label={tw("video-size-calculator.overheadLabel")}
                  value={`+${formatDecimal(result.overheadMB)} ${tw("video-size-calculator.unitMB")}`}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("video-size-calculator.storageTitle")}
                </span>
                <div className="tp-tool-list">
                  {result.fits.map((fit) => (
                    <div className="tp-tool-row" key={fit.id}>
                      <span>{capacityLabels[fit.id]}</span>
                      <span className="tp-tool-pill" dir="ltr">
                        {`${formatCount(fit.count)} ${fit.count === 1 ? tw("video-size-calculator.file") : tw("video-size-calculator.files")}`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="tp-tool-hint">
                  {tw("video-size-calculator.storageHint")}
                </p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
