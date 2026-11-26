/**
 * Pure timer rules for the Pomodoro workspace. No DOM, no React, no audio,
 * no storage and no network. The React layer owns the interval itself.
 */

export type TimerPhase = "work" | "shortBreak" | "longBreak";

export interface Durations {
  work: number;
  shortBreak: number;
  longBreak: number;
}

export type DurationPhase = keyof Durations;

export const DEFAULTS: Durations = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
};

export const LONG_BREAK_EVERY = 4;
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;

export type DurationError = "EMPTY" | "NOT_NUMBER" | "OUT_OF_RANGE";

export interface DurationParse {
  minutes: number | null;
  error?: DurationError;
}

/** Validate one inline minutes field. Whole minutes only, 1 through 180. */
export function parseDuration(raw: string): DurationParse {
  const trimmed = raw.trim();
  if (!trimmed) return { minutes: null, error: "EMPTY" };
  if (!/^\d+$/u.test(trimmed)) return { minutes: null, error: "NOT_NUMBER" };

  const minutes = Number(trimmed);
  if (
    !Number.isFinite(minutes) ||
    minutes < MIN_MINUTES ||
    minutes > MAX_MINUTES
  ) {
    return { minutes: null, error: "OUT_OF_RANGE" };
  }

  return { minutes };
}

/** Total seconds for a phase using the current validated durations. */
export function phaseSeconds(phase: TimerPhase, durations: Durations): number {
  return durations[phase] * 60;
}

/** A finished work round leads to a long break every fourth round. */
export function nextPhaseAfterWork(completedWorkRounds: number): TimerPhase {
  return completedWorkRounds % LONG_BREAK_EVERY === 0 ? "longBreak" : "shortBreak";
}

/** Rounds left until the next long break, always 1 through four. */
export function roundsUntilLongBreak(completedWorkRounds: number): number {
  return LONG_BREAK_EVERY - (completedWorkRounds % LONG_BREAK_EVERY);
}

/** Countdown text. Minutes are allowed to exceed two digits. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** One interval step, clamped at zero so a timer never goes negative. */
export function tick(remainingSeconds: number): number {
  return Math.max(0, Math.floor(remainingSeconds) - 1);
}
