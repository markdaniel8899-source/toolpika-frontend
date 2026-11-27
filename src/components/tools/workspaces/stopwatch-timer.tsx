"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Timer as TimerIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  buildLaps,
  formatElapsed,
  formatLapsReport,
  lapHighlights,
  type Lap,
  type StopwatchValue,
} from "./stopwatch-timer.logic";

const SAMPLE_SPLITS = [12_340, 22_210, 37_230];

export default function StopwatchTimer() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const runningRef = useRef(false);
  const startRef = useRef(0);
  const baseRef = useRef(0);
  const elapsedRef = useRef(0);

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const value = useMemo<StopwatchValue>(
    () => ({ elapsedMs, laps, ...lapHighlights(laps) }),
    [elapsedMs, laps],
  );

  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const tick = () => {
      elapsedRef.current = baseRef.current + (performance.now() - startRef.current);
      setElapsedMs(elapsedRef.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  const start = useCallback(() => {
    startRef.current = performance.now();
    baseRef.current = elapsedRef.current;
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (!runningRef.current) return;
    const next = baseRef.current + (performance.now() - startRef.current);
    elapsedRef.current = next;
    setElapsedMs(next);
    setRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (runningRef.current) pause();
    else start();
  }, [pause, start]);

  const recordLap = useCallback(() => {
    if (!runningRef.current) return;
    const current = baseRef.current + (performance.now() - startRef.current);
    elapsedRef.current = current;
    setElapsedMs(current);
    setLaps((previous) => {
      const last = previous.length ? previous[previous.length - 1].splitMs : 0;
      if (current <= last) return previous;
      return buildLaps([...previous.map((lap) => lap.splitMs), current]);
    });
  }, []);

  const resetClock = useCallback(() => {
    setRunning(false);
    runningRef.current = false;
    startRef.current = 0;
    baseRef.current = 0;
    elapsedRef.current = 0;
    setElapsedMs(0);
    setLaps([]);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || (target && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))) return;
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        toggle();
        return;
      }
      if (event.key.toLowerCase() === "l") {
        event.preventDefault();
        if (runningRef.current) recordLap();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, recordLap]);

  const reportText = useMemo(
    () => formatLapsReport(
      value,
      {
        title: tw("stopwatch-timer.reportTitle"),
        elapsed: tw("stopwatch-timer.reportElapsed"),
        lap: tw("stopwatch-timer.lapWord"),
        split: tw("stopwatch-timer.splitLabel"),
        fastest: tw("stopwatch-timer.fastestLabel"),
        slowest: tw("stopwatch-timer.slowestLabel"),
      },
      (number) => nf.format(number),
    ),
    [value, tw, nf],
  );

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    const sampleLaps = buildLaps(SAMPLE_SPLITS);
    const total = sampleLaps[sampleLaps.length - 1].splitMs;
    setRunning(false);
    runningRef.current = false;
    startRef.current = 0;
    baseRef.current = total;
    elapsedRef.current = total;
    setElapsedMs(total);
    setLaps(sampleLaps);
  };

  return (
    <ToolShell
      title={tw("stopwatch-timer.title")}
      icon="Timer"
      sampleLabel={tw("stopwatch-timer.trySample")}
      resetLabel={tw("stopwatch-timer.reset")}
      privacyLabel={tw("stopwatch-timer.privacyRibbon")}
      onSample={handleSample}
      onReset={resetClock}
      input={
        <ToolPane
          id="tp-stopwatch-input-title"
          title={tw("stopwatch-timer.inputTitle")}
          hint={tw("stopwatch-timer.inputHint")}
        >
          <div className="tp-clock-display">
            <ToolBadge tone={running ? "success" : "neutral"}>
              {running ? tw("stopwatch-timer.statusRunning") : tw("stopwatch-timer.statusPaused")}
            </ToolBadge>
            <output dir="ltr" aria-live="off" aria-label={`${tw("stopwatch-timer.elapsedLabel")} ${formatElapsed(value.elapsedMs)}`}>
              {formatElapsed(value.elapsedMs)}
            </output>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-clock-actions">
              <Button type="button" onClick={toggle}>
                {running ? tw("stopwatch-timer.pause") : tw("stopwatch-timer.start")}
              </Button>
              <Button type="button" variant="secondary" onClick={recordLap} disabled={!running}>
                {tw("stopwatch-timer.lap")}
              </Button>
            </div>
            <p className="tp-tool-hint">{tw("stopwatch-timer.keyboardHint")}</p>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-stopwatch-result-title"
          title={t("result")}
          hint={tw("stopwatch-timer.resultHint")}
          result
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={reportText} label={tw("stopwatch-timer.copyLaps")} copiedLabel={t("copied")} />
              <DownloadButton content={reportText} fileName={tw("stopwatch-timer.fileName")} label={tw("stopwatch-timer.downloadLaps")} />
            </div>
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            <dl className="tp-tool-stats">
              <Stat label={tw("stopwatch-timer.lapCountLabel")} value={nf.format(laps.length)} />
              <Stat label={tw("stopwatch-timer.fastestLabel")} value={value.fastestIndex === null ? tw("stopwatch-timer.noneLabel") : `${tw("stopwatch-timer.lapWord")} ${nf.format(value.fastestIndex + 1)} (${formatElapsed(laps[value.fastestIndex].lapMs)})`} />
              <Stat label={tw("stopwatch-timer.slowestLabel")} value={value.slowestIndex === null ? tw("stopwatch-timer.noneLabel") : `${tw("stopwatch-timer.lapWord")} ${nf.format(value.slowestIndex + 1)} (${formatElapsed(laps[value.slowestIndex].lapMs)})`} />
            </dl>

            {laps.length === 0 ? (
              <ToolEmpty icon={<TimerIcon aria-hidden="true" />} title={tw("stopwatch-timer.emptyTitle")} hint={tw("stopwatch-timer.emptyHint")} />
            ) : (
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-group-title">{tw("stopwatch-timer.lapsTitle")}</span>
                <div className="tp-lap-table">
                  <div className="tp-lap-head">
                    <span>{tw("stopwatch-timer.lapWord")}</span>
                    <span>{tw("stopwatch-timer.elapsedLabel")}</span>
                    <span>{tw("stopwatch-timer.splitLabel")}</span>
                  </div>
                  {laps.map((lap, index) => (
                    <div
                      className="tp-lap-row"
                      key={index}
                      data-highlight={index === value.fastestIndex ? "fastest" : index === value.slowestIndex ? "slowest" : undefined}
                    >
                      <span>{nf.format(index + 1)}</span>
                      <span dir="ltr">{formatElapsed(lap.lapMs)}</span>
                      <span dir="ltr">{formatElapsed(lap.splitMs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
