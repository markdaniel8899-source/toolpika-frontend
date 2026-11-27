/** Pure sleep-cycle scheduling arithmetic. No DOM, React or locale formatting. */

export type SleepMode = "bedtime" | "wake";

export const SLEEP_MODES: readonly SleepMode[] = ["bedtime", "wake"];

export const CYCLE_MINUTES = 90;
export const DEFAULT_BUFFER_MINUTES = 15;
export const MIN_CYCLES = 3;
export const MAX_CYCLES = 7;
export const RECOMMENDED_CYCLES = 5;

const MINUTES_PER_DAY = 1440;
const MAX_BUFFER_MINUTES = 60;

export type SleepErrorCode = "INVALID_TIME" | "INVALID_BUFFER";

export interface SleepInput {
  mode: SleepMode;
  timeMinutes: number;
  bufferMinutes: number;
}

export interface SleepOption {
  cycles: number;
  minutes: number;
  durationMinutes: number;
}

export interface SleepResult {
  options: SleepOption[];
  error?: { code: SleepErrorCode };
}

function fail(code: SleepErrorCode): SleepResult {
  return { options: [], error: { code } };
}

/** Parse a native time input value of the form HH:MM into minutes since midnight. */
export function parseClockTime(raw: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Wrap a minute offset into a 24 hour clock value. */
export function wrapMinutes(value: number): number {
  return ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * Build ideal wake times from a bedtime, or ideal bedtimes from a wake time.
 * Each cycle is 90 minutes, and the fall-asleep buffer is added before sleep.
 */
export function calculateSleepCycles(input: SleepInput): SleepResult {
  const { mode, timeMinutes, bufferMinutes } = input;

  if (!Number.isFinite(timeMinutes) || timeMinutes < 0 || timeMinutes >= MINUTES_PER_DAY) {
    return fail("INVALID_TIME");
  }
  if (!Number.isFinite(bufferMinutes) || bufferMinutes < 0 || bufferMinutes > MAX_BUFFER_MINUTES) {
    return fail("INVALID_BUFFER");
  }

  const cycleCounts =
    mode === "bedtime"
      ? [MIN_CYCLES, 4, RECOMMENDED_CYCLES, 6, MAX_CYCLES]
      : [MAX_CYCLES, 6, RECOMMENDED_CYCLES, 4, MIN_CYCLES];

  const options = cycleCounts.map((cycles) => {
    const durationMinutes = bufferMinutes + cycles * CYCLE_MINUTES;
    const offset = mode === "bedtime" ? timeMinutes + durationMinutes : timeMinutes - durationMinutes;
    return { cycles, minutes: wrapMinutes(offset), durationMinutes };
  });

  return { options };
}

export interface SleepReportLabels {
  title: string;
  mode: string;
  input: string;
  buffer: string;
  recommended: string;
  options: string;
  note: string;
  modeBedtime: string;
  modeWake: string;
  cyclesWord: string;
}

/** Render the schedule as plain text for clipboard use. */
export function formatSleepReport(
  result: SleepResult,
  input: SleepInput,
  labels: SleepReportLabels,
  formatTime: (minutes: number) => string,
): string {
  const lines = [
    labels.title,
    `${labels.mode}: ${input.mode === "bedtime" ? labels.modeBedtime : labels.modeWake}`,
    `${labels.input}: ${formatTime(input.timeMinutes)}`,
    `${labels.buffer}: ${input.bufferMinutes}`,
  ];

  const recommended = result.options.find((option) => option.cycles === RECOMMENDED_CYCLES);
  if (recommended) lines.push(`${labels.recommended}: ${formatTime(recommended.minutes)}`);

  lines.push(labels.options);
  result.options.forEach((option) => {
    lines.push(`${option.cycles} ${labels.cyclesWord}: ${formatTime(option.minutes)}`);
  });
  lines.push(labels.note);

  return lines.join("\n");
}
