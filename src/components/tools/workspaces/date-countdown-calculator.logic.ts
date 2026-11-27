/** Pure, UTC-safe calendar arithmetic for date differences. No DOM, React or locale formatting. */

const MS_PER_DAY = 86_400_000;

export type DateMode = "days" | "weeks" | "months" | "countdown";

export const DATE_MODES: readonly DateMode[] = ["days", "weeks", "months", "countdown"];

export type DateErrorCode =
  | "MISSING_START"
  | "MISSING_TARGET"
  | "INVALID_START"
  | "INVALID_TARGET"
  | "INVALID_ANOTHER"
  | "ORDER";

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

export interface DateCountdownInput {
  start: string;
  target: string;
  another: string;
  mode: DateMode;
  inclusive: boolean;
}

export interface DateDifference {
  /** Whole days between start and target, including the final day when inclusive. */
  totalDays: number;
  /** Whole sevens in the full day count, independent of calendar months. */
  totalWeeks: number;
  /** Days left over after those whole weeks. */
  totalWeekDays: number;
  /** Countdown chain: whole years, then months, then weeks, then days. */
  years: number;
  months: number;
  weeks: number;
  days: number;
  /** Days left over after whole calendar months. */
  monthRemainder: number;
  /** Gap between the comparison date and the target, shown as a positive number. */
  comparisonDays: number;
}

export interface DateCountdownResult {
  value?: DateDifference;
  error?: { code: DateErrorCode };
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Build a UTC midnight from calendar parts, including years below 100. */
function utcDate(parts: ParsedDate): Date {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/** Parse a YYYY-MM-DD value as a real calendar date, rejecting rollovers. */
export function parseDate(raw: string): ParsedDate | null {
  const match = DATE_PATTERN.exec(raw.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const check = utcDate({ year, month, day });
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/** Format a Date as YYYY-MM-DD using the viewer's local calendar day. */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayNumber(parts: ParsedDate): number {
  return Math.round(utcDate(parts).getTime() / MS_PER_DAY);
}

function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of the next month is the final day of the requested month.
  return utcDate({ year, month: month + 1, day: 0 }).getUTCDate();
}

/** Add calendar months, clamping to the last valid day of a shorter month. */
function addMonths(parts: ParsedDate, count: number): ParsedDate {
  const total = parts.year * 12 + (parts.month - 1) + count;
  const year = Math.floor(total / 12);
  const month = total - year * 12 + 1;
  const day = Math.min(parts.day, lastDayOfMonth(year, month));
  return { year, month, day };
}

interface Breakdown {
  years: number;
  months: number;
  weeks: number;
  days: number;
  monthRemainder: number;
}

/** Walk forward in whole years, then months, then weeks, then days. */
function breakDown(start: ParsedDate, endDay: number): Breakdown {
  let years = 0;
  while (dayNumber(addMonths(start, (years + 1) * 12)) <= endDay) years += 1;

  const afterYears = addMonths(start, years * 12);
  let months = 0;
  while (dayNumber(addMonths(afterYears, months + 1)) <= endDay) months += 1;

  const afterMonths = addMonths(afterYears, months);
  const monthRemainder = Math.max(0, endDay - dayNumber(afterMonths));
  const weeks = Math.floor(monthRemainder / 7);
  const days = monthRemainder - weeks * 7;

  return { years, months, weeks, days, monthRemainder };
}

export function calculateDateCountdown(input: DateCountdownInput): DateCountdownResult {
  if (!input.start.trim()) return { error: { code: "MISSING_START" } };
  if (!input.target.trim()) return { error: { code: "MISSING_TARGET" } };

  const start = parseDate(input.start);
  if (!start) return { error: { code: "INVALID_START" } };

  const target = parseDate(input.target);
  if (!target) return { error: { code: "INVALID_TARGET" } };

  const another = parseDate(input.another);
  if (!another) return { error: { code: "INVALID_ANOTHER" } };

  const startDay = dayNumber(start);
  const targetDay = dayNumber(target);
  if (targetDay < startDay) return { error: { code: "ORDER" } };

  const endDay = targetDay + (input.inclusive ? 1 : 0);
  const totalDays = endDay - startDay;
  const parts = breakDown(start, endDay);
  const comparisonDays = Math.abs(endDay - dayNumber(another));

  return {
    value: {
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      totalWeekDays: totalDays % 7,
      years: parts.years,
      months: parts.months,
      weeks: parts.weeks,
      days: parts.days,
      monthRemainder: parts.monthRemainder,
      comparisonDays,
    },
  };
}

export interface DateReportLabels {
  title: string;
  start: string;
  target: string;
  another: string;
  mode: string;
  counting: string;
  inclusive: string;
  exclusive: string;
  total: string;
  breakdown: string;
  comparison: string;
  note: string;
  years: string;
  months: string;
  weeks: string;
  days: string;
}

/** Render the result as plain text for clipboard use. */
export function formatDateReport(
  input: DateCountdownInput,
  value: DateDifference,
  labels: DateReportLabels,
  modeLabel: string,
  heroText: string,
): string {
  return [
    labels.title,
    `${labels.start}: ${input.start}`,
    `${labels.target}: ${input.target}`,
    `${labels.another}: ${input.another}`,
    `${labels.mode}: ${modeLabel}`,
    `${labels.counting}: ${input.inclusive ? labels.inclusive : labels.exclusive}`,
    `${labels.total}: ${heroText}`,
    labels.breakdown,
    `${labels.years}: ${value.years} | ${labels.months}: ${value.months} | ${labels.weeks}: ${value.weeks} | ${labels.days}: ${value.days}`,
    `${labels.comparison}: ${value.comparisonDays}`,
    labels.note,
  ].join("\n");
}
