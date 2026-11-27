/** Pure reading and speaking time arithmetic. No DOM, React or locale formatting. */

export const DEFAULTS: { readingWpm: number; speakingWpm: number } = {
  readingWpm: 200,
  speakingWpm: 130,
};

/** Cap oversized pastes so a very large document cannot stall the main thread. */
export const MAX_TEXT_LENGTH = 1000000;

export type ReadingErrorCode = "INVALID_WPM" | "TOO_LARGE";

export interface ReadingResult {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  readingSeconds: number;
  speakingSeconds: number;
  error?: { code: ReadingErrorCode };
}

function fail(code: ReadingErrorCode): ReadingResult {
  return {
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    readingSeconds: 0,
    speakingSeconds: 0,
    error: { code },
  };
}

/** Words are whitespace-separated runs; reading and speaking use linear WPM rates. */
export function calculateReading(
  text: string,
  readingWpm: number,
  speakingWpm: number,
): ReadingResult {
  if (
    !Number.isFinite(readingWpm) ||
    !Number.isFinite(speakingWpm) ||
    readingWpm <= 0 ||
    speakingWpm <= 0
  ) {
    return fail("INVALID_WPM");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return fail("TOO_LARGE");
  }

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/u).length : 0;

  return {
    words,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/gu, "").length,
    readingSeconds: Math.round((words / readingWpm) * 60),
    speakingSeconds: Math.round((words / speakingWpm) * 60),
  };
}

/** Render a whole number of seconds as minutes and seconds with translated units. */
export function formatDuration(
  seconds: number,
  minuteLabel: string,
  secondLabel: string,
): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;

  if (minutes === 0) return `${remainder} ${secondLabel}`;
  if (remainder === 0) return `${minutes} ${minuteLabel}`;
  return `${minutes} ${minuteLabel} ${remainder} ${secondLabel}`;
}
