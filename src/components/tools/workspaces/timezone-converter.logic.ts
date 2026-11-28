/**
 * Pure time zone conversion using Intl.DateTimeFormat only.
 * No DOM, React, storage, network or timer access lives in this module.
 * Internal maths always use Latin digits so numbers parse in every locale.
 */

export const TIME_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export type TimeZoneId = (typeof TIME_ZONES)[number];

export const MAX_HOUR_SHIFT = 48;

export type TimeErrorCode =
  | "EMPTY_DATE"
  | "INVALID_DATE"
  | "INVALID_TIME"
  | "EMPTY_ZONES"
  | "INVALID_BASE_ZONE";

export interface ConversionInput {
  date: string;
  time: string;
  baseZone: string;
  selectedZones: string[];
  hourShift: number;
}

export interface ConvertedZone {
  zone: string;
  dateLabel: string;
  timeLabel: string;
  offsetHours: number;
}

export interface ConversionResult {
  instant: number;
  baseDate: string;
  baseTime: string;
  zones: ConvertedZone[];
  error?: { code: TimeErrorCode };
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/u;
const HOUR = 3_600_000;

type NumericParts = Record<string, number>;

/** Wall-clock fields of an instant in one zone, with stable Latin digits. */
function numericParts(instant: number, zone: string): NumericParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts: NumericParts = {};
  for (const part of formatter.formatToParts(new Date(instant))) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts;
}

function wallMillis(parts: NumericParts): number {
  return Date.UTC(
    parts.year ?? 0,
    (parts.month ?? 1) - 1,
    parts.day ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
  );
}

/** Resolve a wall time in a zone to an instant, allowing for day changes. */
function toInstant(date: string, time: string, zone: string): number | null {
  const dateMatch = DATE_PATTERN.exec(date);
  const timeMatch = TIME_PATTERN.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59) return null;

  const calendarDay = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDay.getUTCFullYear() !== year ||
    calendarDay.getUTCMonth() !== month - 1 ||
    calendarDay.getUTCDate() !== day
  ) {
    return null;
  }

  let guess = Date.UTC(year, month - 1, day, hour, minute);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = wallMillis(numericParts(guess, zone)) - guess;
    if (offset === 0) break;
    guess -= offset;
  }
  return guess;
}

/** Locale-aware label parts for one instant. */
function displayLabel(instant: number, zone: string, locale: string): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(new Date(instant))) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }

  return {
    date: `${parts.weekday ?? ""}, ${parts.day ?? ""} ${parts.month ?? ""} ${parts.year ?? ""}`.trim(),
    time: `${parts.hour ?? ""}:${parts.minute ?? ""}`,
  };
}

/** Convert a base wall time into every selected zone at once. */
export function convertTimes(input: ConversionInput, locale: string): ConversionResult {
  const empty: ConversionResult = {
    instant: 0,
    baseDate: input.date,
    baseTime: input.time,
    zones: [],
  };

  if (input.date.trim().length === 0) return { ...empty, error: { code: "EMPTY_DATE" } };
  if (!DATE_PATTERN.test(input.date.trim())) return { ...empty, error: { code: "INVALID_DATE" } };
  if (input.time.trim().length === 0 || !TIME_PATTERN.test(input.time.trim())) {
    return { ...empty, error: { code: "INVALID_TIME" } };
  }
  if (!TIME_ZONES.includes(input.baseZone as TimeZoneId)) {
    return { ...empty, error: { code: "INVALID_BASE_ZONE" } };
  }

  const selected = input.selectedZones.filter((zone): zone is TimeZoneId =>
    TIME_ZONES.includes(zone as TimeZoneId),
  );
  if (selected.length === 0) return { ...empty, error: { code: "EMPTY_ZONES" } };

  const baseInstant = toInstant(input.date.trim(), input.time.trim(), input.baseZone);
  if (baseInstant === null) return { ...empty, error: { code: "INVALID_DATE" } };

  const instant = baseInstant + input.hourShift * HOUR;
  const baseWall = wallMillis(numericParts(instant, input.baseZone));

  const zones = selected.map((zone) => {
    const label = displayLabel(instant, zone, locale);
    const offsetHours = Math.round(
      ((wallMillis(numericParts(instant, zone)) - baseWall) / HOUR) * 2,
    ) / 2;
    return {
      zone,
      dateLabel: label.date,
      timeLabel: label.time,
      offsetHours,
    };
  });

  return { instant, baseDate: input.date, baseTime: input.time, zones };
}
