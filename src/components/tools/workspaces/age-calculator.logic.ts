/** Pure calendar age arithmetic. No DOM, React, locale formatting or side effects. */

const MS_PER_DAY = 86_400_000;

export type AgeErrorCode =
  | "MISSING_BIRTH"
  | "INVALID_BIRTH"
  | "INVALID_AS_OF"
  | "ORDER";

export interface AgeInput {
  birth: string;
  asOf: string;
}

export interface AgeValue {
  /** Whole calendar years, then months, then days. */
  years: number;
  months: number;
  days: number;
  /** Straight day count between the two dates. */
  totalDays: number;
  /** Whole sevens in the day count and the days left over. */
  weeks: number;
  weekDays: number;
  /** Whole calendar months and the days left after them. */
  calendarMonths: number;
  monthDays: number;
  /** YYYY-MM-DD of the next birthday on or after the as-of date. */
  nextBirthday: string;
  /** Days from the as-of date to that birthday; zero means today. */
  nextBirthdayDays: number;
}

export interface AgeResult {
  value?: AgeValue;
  error?: { code: AgeErrorCode };
}

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
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

function formatParts(parts: ParsedDate): string {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
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

/** First birthday on or after the as-of day, clamping a leap-day birth date. */
function nextBirthdayFor(birth: ParsedDate, asOf: ParsedDate): ParsedDate {
  const asOfDay = dayNumber(asOf);
  for (let year = asOf.year; year <= asOf.year + 4; year += 1) {
    const candidate: ParsedDate = {
      year,
      month: birth.month,
      day: Math.min(birth.day, lastDayOfMonth(year, birth.month)),
    };
    if (dayNumber(candidate) >= asOfDay) return candidate;
  }
  // Unreachable for real calendar dates, but keeps the return type total.
  return { year: asOf.year + 4, month: birth.month, day: birth.day };
}

export function calculateAge(input: AgeInput): AgeResult {
  if (!input.birth.trim()) return { error: { code: "MISSING_BIRTH" } };

  const birth = parseDate(input.birth);
  if (!birth) return { error: { code: "INVALID_BIRTH" } };

  const asOf = parseDate(input.asOf);
  if (!asOf) return { error: { code: "INVALID_AS_OF" } };

  const birthDay = dayNumber(birth);
  const asOfDay = dayNumber(asOf);
  if (asOfDay < birthDay) return { error: { code: "ORDER" } };

  let years = 0;
  while (dayNumber(addMonths(birth, (years + 1) * 12)) <= asOfDay) years += 1;

  const afterYears = addMonths(birth, years * 12);
  let months = 0;
  while (dayNumber(addMonths(afterYears, months + 1)) <= asOfDay) months += 1;

  const calendarMonths = years * 12 + months;
  const monthDays = asOfDay - dayNumber(addMonths(birth, calendarMonths));
  const totalDays = asOfDay - birthDay;
  const next = nextBirthdayFor(birth, asOf);

  return {
    value: {
      years,
      months,
      days: monthDays,
      totalDays,
      weeks: Math.floor(totalDays / 7),
      weekDays: totalDays % 7,
      calendarMonths,
      monthDays,
      nextBirthday: formatParts(next),
      nextBirthdayDays: dayNumber(next) - asOfDay,
    },
  };
}

export interface AgeReportLabels {
  title: string;
  birth: string;
  asOf: string;
  age: string;
  totalDays: string;
  weeks: string;
  calendarMonths: string;
  birthWeekday: string;
  nextBirthday: string;
  nextBirthdayDays: string;
  nextBirthdayWeekday: string;
  note: string;
}

export interface AgeReportParts {
  age: string;
  totalDays: string;
  weeks: string;
  calendarMonths: string;
  birthWeekday: string;
  nextBirthdayDays: string;
  nextBirthdayWeekday: string;
}

/** Render the result as plain text for clipboard use. */
export function formatAgeReport(
  input: AgeInput,
  value: AgeValue,
  labels: AgeReportLabels,
  parts: AgeReportParts,
): string {
  return [
    labels.title,
    `${labels.birth}: ${input.birth}`,
    `${labels.asOf}: ${input.asOf}`,
    `${labels.age}: ${parts.age}`,
    `${labels.totalDays}: ${parts.totalDays}`,
    `${labels.weeks}: ${parts.weeks}`,
    `${labels.calendarMonths}: ${parts.calendarMonths}`,
    `${labels.birthWeekday}: ${parts.birthWeekday}`,
    `${labels.nextBirthday}: ${value.nextBirthday}`,
    `${labels.nextBirthdayDays}: ${parts.nextBirthdayDays}`,
    `${labels.nextBirthdayWeekday}: ${parts.nextBirthdayWeekday}`,
    labels.note,
  ].join("\n");
}
