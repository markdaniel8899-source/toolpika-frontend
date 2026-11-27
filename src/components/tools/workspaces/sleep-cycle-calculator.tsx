"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateSleepCycles,
  DEFAULT_BUFFER_MINUTES,
  formatSleepReport,
  parseClockTime,
  RECOMMENDED_CYCLES,
  type SleepErrorCode,
  type SleepMode,
} from "./sleep-cycle-calculator.logic";

const ERROR_ID = "tp-sleep-error";

export default function SleepCycleCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<{
    mode: SleepMode;
    buffer: number;
  }>(
    "toolpika:sleep-cycle-calculator",
    { mode: "bedtime", buffer: DEFAULT_BUFFER_MINUTES },
  );
  const mode = options.mode;
  const buffer = options.buffer;

  const [time, setTime] = useState("");

  const parsedTime = parseClockTime(time);
  const timeFilled = time.trim().length > 0;
  const invalid = timeFilled && parsedTime === null;

  const calculation = useMemo(
    () =>
      parsedTime !== null
        ? calculateSleepCycles({ mode, timeMinutes: parsedTime, bufferMinutes: buffer })
        : null,
    [parsedTime, mode, buffer],
  );

  const errorCode: SleepErrorCode | undefined = calculation?.error?.code;
  const errorText = invalid || errorCode === "INVALID_TIME"
    ? `${tw("sleep-cycle-calculator.errorTime")} ${tw("sleep-cycle-calculator.fixTime")}`
    : errorCode === "INVALID_BUFFER"
      ? `${tw("sleep-cycle-calculator.errorBuffer")} ${tw("sleep-cycle-calculator.fixBuffer")}`
      : "";
  const ready = timeFilled && !!calculation && !calculation.error && !invalid;
  const describedBy = errorText ? ERROR_ID : undefined;

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }),
    [locale],
  );
  const formatTime = useCallback(
    (minutes: number) =>
      timeFormatter.format(
        new Date(Date.UTC(2024, 0, 1, Math.floor(minutes / 60), minutes % 60)),
      ),
    [timeFormatter],
  );

  const modeLabel = useCallback(
    (value: SleepMode) =>
      value === "bedtime"
        ? tw("sleep-cycle-calculator.modeBedtime")
        : tw("sleep-cycle-calculator.modeWake"),
    [tw],
  );

  const recommended = calculation?.options.find(
    (option) => option.cycles === RECOMMENDED_CYCLES,
  );

  const reportText = useMemo(() => {
    if (!ready || !calculation || parsedTime === null) return "";
    return formatSleepReport(
      calculation,
      { mode, timeMinutes: parsedTime, bufferMinutes: buffer },
      {
        title: tw("sleep-cycle-calculator.reportTitle"),
        mode: tw("sleep-cycle-calculator.reportMode"),
        input: tw("sleep-cycle-calculator.reportInput"),
        buffer: tw("sleep-cycle-calculator.reportBuffer"),
        recommended: tw("sleep-cycle-calculator.reportRecommended"),
        options: tw("sleep-cycle-calculator.reportOptions"),
        note: tw("sleep-cycle-calculator.note"),
        modeBedtime: modeLabel("bedtime"),
        modeWake: modeLabel("wake"),
        cyclesWord: tw("sleep-cycle-calculator.cyclesWord"),
      },
      formatTime,
    );
  }, [ready, calculation, parsedTime, mode, buffer, tw, modeLabel, formatTime]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ mode: "bedtime", buffer: DEFAULT_BUFFER_MINUTES });
    setTime("23:00");
  };

  const handleReset = () => {
    resetOptions();
    setTime("");
  };

  const handleBufferChange = (raw: string) => {
    const value = Number(raw);
    const next = Number.isFinite(value) ? Math.min(60, Math.max(0, value)) : DEFAULT_BUFFER_MINUTES;
    update({ buffer: next });
  };

  return (
    <ToolShell
      title={tw("sleep-cycle-calculator.title")}
      icon="Moon"
      sampleLabel={tw("sleep-cycle-calculator.trySample")}
      resetLabel={tw("sleep-cycle-calculator.reset")}
      privacyLabel={tw("sleep-cycle-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-sleep-input-title"
          title={tw("sleep-cycle-calculator.inputTitle")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setTime("")}
              disabled={!time}
              aria-label={t("clear")}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<SleepMode>
              label={tw("sleep-cycle-calculator.modeLabel")}
              value={mode}
              options={[
                { value: "bedtime", label: tw("sleep-cycle-calculator.modeBedtime") },
                { value: "wake", label: tw("sleep-cycle-calculator.modeWake") },
              ]}
              onChange={(next) => update({ mode: next })}
            />
          </div>

          <ToolField
            label={
              mode === "bedtime"
                ? tw("sleep-cycle-calculator.timeBedtimeLabel")
                : tw("sleep-cycle-calculator.timeWakeLabel")
            }
            htmlFor="tp-sleep-time"
          >
            <input
              id="tp-sleep-time"
              type="time"
              className="tp-field-input"
              value={time}
              aria-label={tw("sleep-cycle-calculator.timeLabel")}
              aria-describedby={describedBy}
              onChange={(event) => setTime(event.target.value)}
            />
          </ToolField>

          <ToolField
            label={tw("sleep-cycle-calculator.bufferLabel")}
            htmlFor="tp-sleep-buffer"
          >
            <NumberStepper
              id="tp-sleep-buffer"
              value={String(buffer)}
              min={0}
              max={60}
              step={5}
              inputMode="numeric"
              ariaLabel={tw("sleep-cycle-calculator.bufferLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={handleBufferChange}
            />
          </ToolField>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-sleep-result-title"
          title={t("result")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !calculation || !recommended ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Moon aria-hidden="true" />}
                title={
                  errorText
                    ? tw("sleep-cycle-calculator.errorTitle")
                    : tw("sleep-cycle-calculator.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("sleep-cycle-calculator.emptyErrorHint")
                    : tw("sleep-cycle-calculator.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("sleep-cycle-calculator.recommendedLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {formatTime(recommended.minutes)}
                </output>
              </div>

              <dl className="tp-tool-stats">
                {calculation.options
                  .filter((option) => option.cycles === 4 || option.cycles === 5 || option.cycles === 6)
                  .map((option) => (
                    <Stat
                      key={option.cycles}
                      label={`${option.cycles} ${tw("sleep-cycle-calculator.cyclesWord")}`}
                      value={formatTime(option.minutes)}
                    />
                  ))}
              </dl>

              <p className="tp-tool-hint">{tw("sleep-cycle-calculator.noteShort")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
