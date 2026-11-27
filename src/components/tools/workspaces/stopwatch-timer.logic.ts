/** Pure stopwatch formatting and lap arithmetic. No DOM, React or side effects. */

export interface Lap {
  /** Duration since the previous lap, in milliseconds. */
  lapMs: number;
  /** Duration since the start, in milliseconds. */
  splitMs: number;
}

export interface StopwatchValue {
  elapsedMs: number;
  laps: Lap[];
  fastestIndex: number | null;
  slowestIndex: number | null;
}

export interface LapHighlights {
  fastestIndex: number | null;
  slowestIndex: number | null;
}

/** Format milliseconds as mm:ss.cs, adding an hours field past one hour. */
export function formatElapsed(ms: number): string {
  const safe = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  const centiseconds = Math.floor(safe / 10);
  const cs = centiseconds % 100;
  const secondsTotal = Math.floor(centiseconds / 100);
  const seconds = secondsTotal % 60;
  const minutesTotal = Math.floor(secondsTotal / 60);
  const minutes = minutesTotal % 60;
  const hours = Math.floor(minutesTotal / 60);
  const pad = (part: number) => String(part).padStart(2, "0");
  const tail = `${pad(minutes)}:${pad(seconds)}.${pad(cs)}`;
  return hours > 0 ? `${pad(hours)}:${tail}` : tail;
}

/** Turn cumulative split times into lap durations and splits. */
export function buildLaps(splitTimes: readonly number[]): Lap[] {
  let previous = 0;
  return splitTimes.map((splitMs) => {
    const safe = Number.isFinite(splitMs) ? Math.max(0, splitMs) : 0;
    const lap = { lapMs: Math.max(0, safe - previous), splitMs: safe };
    previous = safe;
    return lap;
  });
}

/** Mark the shortest and longest laps once there are two distinct values. */
export function lapHighlights(laps: readonly Lap[]): LapHighlights {
  if (laps.length < 2) return { fastestIndex: null, slowestIndex: null };
  let fastestIndex = 0;
  let slowestIndex = 0;
  laps.forEach((lap, index) => {
    if (lap.lapMs < laps[fastestIndex].lapMs) fastestIndex = index;
    if (lap.lapMs > laps[slowestIndex].lapMs) slowestIndex = index;
  });
  if (laps[fastestIndex].lapMs === laps[slowestIndex].lapMs) {
    return { fastestIndex: null, slowestIndex: null };
  }
  return { fastestIndex, slowestIndex };
}

export interface LapsReportLabels {
  title: string;
  elapsed: string;
  lap: string;
  split: string;
  fastest: string;
  slowest: string;
}

/** Render the lap list as plain text for clipboard and file export. */
export function formatLapsReport(
  value: StopwatchValue,
  labels: LapsReportLabels,
  formatNumber: (value: number) => string,
): string {
  const lines = [labels.title, `${labels.elapsed}: ${formatElapsed(value.elapsedMs)}`];
  value.laps.forEach((lap, index) => {
    lines.push(
      `${labels.lap} ${formatNumber(index + 1)}: ${formatElapsed(lap.lapMs)} (${labels.split} ${formatElapsed(lap.splitMs)})`,
    );
  });
  if (value.fastestIndex !== null) {
    lines.push(`${labels.fastest}: ${formatNumber(value.fastestIndex + 1)}`);
  }
  if (value.slowestIndex !== null) {
    lines.push(`${labels.slowest}: ${formatNumber(value.slowestIndex + 1)}`);
  }
  return lines.join("\n");
}
