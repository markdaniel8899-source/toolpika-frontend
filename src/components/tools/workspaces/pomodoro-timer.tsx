"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NumberStepper,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULTS,
  MAX_MINUTES,
  MIN_MINUTES,
  formatClock,
  nextPhaseAfterWork,
  parseDuration,
  phaseSeconds,
  roundsUntilLongBreak,
  tick,
  type DurationError,
  type Durations,
  type TimerPhase,
} from "./pomodoro-timer.logic";

const ERROR_ID = "tp-pomodoro-error";

type RawDurations = Record<keyof Durations, string>;

const SAMPLE_RAW: RawDurations = {
  work: String(DEFAULTS.work),
  shortBreak: String(DEFAULTS.shortBreak),
  longBreak: String(DEFAULTS.longBreak),
};

export default function PomodoroTimer() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [raw, setRaw] = useState<RawDurations>(SAMPLE_RAW);
  const [durations, setDurations] = useState<Durations>(DEFAULTS);
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [remaining, setRemaining] = useState(phaseSeconds("work", DEFAULTS));
  const [rounds, setRounds] = useState(0);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);
  const { notice, showNotice, clearNotice } = useToolNotice();

  const errors: Record<keyof Durations, DurationError | undefined> = {
    work: parseDuration(raw.work).error,
    shortBreak: parseDuration(raw.shortBreak).error,
    longBreak: parseDuration(raw.longBreak).error,
  };
  const firstError = errors.work ?? errors.shortBreak ?? errors.longBreak;

  const errorMessages: Record<DurationError, string> = {
    EMPTY: tw("pomodoro-timer.errorEmpty"),
    NOT_NUMBER: tw("pomodoro-timer.errorNotNumber"),
    OUT_OF_RANGE: tw("pomodoro-timer.errorOutOfRange"),
  };

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    if (runningRef.current) return;
    setRemaining(phaseSeconds(phase, durations));
  }, [phase, durations]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((previous) => tick(previous));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining > 0 || firstError) return;
    setRunning(false);

    if (phase === "work") {
      const completed = rounds + 1;
      const next = nextPhaseAfterWork(completed);
      setRounds(completed);
      setPhase(next);
      setRemaining(phaseSeconds(next, durations));
      showNotice(
        next === "longBreak"
          ? tw("pomodoro-timer.completeLongBreak")
          : tw("pomodoro-timer.completeWork"),
      );
    } else {
      setPhase("work");
      setRemaining(phaseSeconds("work", durations));
      showNotice(tw("pomodoro-timer.completeBreak"));
    }
  }, [remaining, phase, rounds, durations, firstError, showNotice, tw]);

  const changeDuration = (key: keyof Durations, value: string) => {
    setRaw((previous) => ({ ...previous, [key]: value }));
    const parsed = parseDuration(value);
    if (!parsed.error && parsed.minutes !== null) {
      setDurations((previous) => ({ ...previous, [key]: parsed.minutes as number }));
    }
  };

  const resetTimer = () => {
    setRunning(false);
    setRounds(0);
    setPhase("work");
    setRemaining(phaseSeconds("work", durations));
    clearNotice();
  };

  const loadSample = () => {
    setRunning(false);
    setRaw(SAMPLE_RAW);
    setDurations(DEFAULTS);
    setRounds(0);
    setPhase("work");
    setRemaining(phaseSeconds("work", DEFAULTS));
    clearNotice();
  };

  const phaseLabel =
    phase === "work"
      ? tw("pomodoro-timer.phaseWork")
      : phase === "shortBreak"
        ? tw("pomodoro-timer.phaseShortBreak")
        : tw("pomodoro-timer.phaseLongBreak");
  const statusLabel = running
    ? tw("pomodoro-timer.statusRunning")
    : tw("pomodoro-timer.statusPaused");
  const badgeTone = phase === "work" ? "accent" : "success";
  const clock = formatClock(remaining);

  return (
    <ToolShell
      title={tw("pomodoro-timer.title")}
      icon="Clock"
      sampleLabel={tw("pomodoro-timer.trySample")}
      resetLabel={tw("pomodoro-timer.reset")}
      privacyLabel={tw("pomodoro-timer.privacyRibbon")}
      onSample={loadSample}
      onReset={resetTimer}
      notice={notice}
      input={
        <ToolPane
          id="tp-pomodoro-input-title"
          title={tw("pomodoro-timer.inputTitle")}
          hint={tw("pomodoro-timer.inputHint")}
        >
          <ToolField
            label={tw("pomodoro-timer.durationWork")}
            htmlFor="tp-pomodoro-work"
            hint={tw("pomodoro-timer.hintWork")}
          >
            <NumberStepper
              id="tp-pomodoro-work"
              value={raw.work}
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              ariaLabel={tw("pomodoro-timer.durationWork")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={firstError ? ERROR_ID : undefined}
              onValueChange={(value) => changeDuration("work", value)}
            />
          </ToolField>

          <ToolField
            label={tw("pomodoro-timer.durationShort")}
            htmlFor="tp-pomodoro-short"
            hint={tw("pomodoro-timer.hintShort")}
          >
            <NumberStepper
              id="tp-pomodoro-short"
              value={raw.shortBreak}
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              ariaLabel={tw("pomodoro-timer.durationShort")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={firstError ? ERROR_ID : undefined}
              onValueChange={(value) => changeDuration("shortBreak", value)}
            />
          </ToolField>

          <ToolField
            label={tw("pomodoro-timer.durationLong")}
            htmlFor="tp-pomodoro-long"
            hint={tw("pomodoro-timer.hintLong")}
          >
            <NumberStepper
              id="tp-pomodoro-long"
              value={raw.longBreak}
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              ariaLabel={tw("pomodoro-timer.durationLong")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={firstError ? ERROR_ID : undefined}
              onValueChange={(value) => changeDuration("longBreak", value)}
            />
          </ToolField>

          {firstError ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorMessages[firstError]}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-pomodoro-result-title"
          title={t("result")}
          result
          actions={
            <Button
              type="button"
              size="sm"
              disabled={Boolean(firstError)}
              onClick={() => setRunning((previous) => !previous)}
            >
              {running ? tw("pomodoro-timer.pause") : tw("pomodoro-timer.start")}
            </Button>
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <ToolBadge tone={badgeTone}>{phaseLabel}</ToolBadge>
              <span className="tp-tool-hint">{statusLabel}</span>
            </div>

            <output
              dir="ltr"
              aria-live="off"
              aria-label={`${phaseLabel} ${clock}`}
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
                fontSize: "clamp(42px, 8vw, 68px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              {clock}
            </output>

            <dl className="tp-tool-stats">
              <Stat
                label={tw("pomodoro-timer.completedRoundsLabel")}
                value={rounds}
              />
              <Stat
                label={tw("pomodoro-timer.longBreakInLabel")}
                value={roundsUntilLongBreak(rounds)}
              />
            </dl>

            {firstError ? (
              <ToolEmpty
                icon={<Timer aria-hidden="true" />}
                title={tw("pomodoro-timer.errorTitle")}
                hint={errorMessages[firstError]}
              />
            ) : null}
          </div>
        </ToolPane>
      }
    />
  );
}
