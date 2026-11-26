/**
 * Pure five-field cron parsing, validation, plain-English planning and a
 * bounded next-run preview. No DOM, no React, no date library, no network.
 */

export type CronFieldKey = "minute" | "hour" | "day" | "month" | "weekday";

export type CronFieldError =
  | "EMPTY"
  | "INVALID_ITEM"
  | "OUT_OF_RANGE"
  | "REVERSED_RANGE"
  | "INVALID_STEP"
  | "INVALID_NAME";

export interface FieldSpec {
  key: CronFieldKey;
  min: number;
  /** Highest value accepted by the parser. Weekday 7 also means Sunday. */
  max: number;
  /** Highest value in the canonical set. Weekdays canonicalise to 0 through 6. */
  fullMax: number;
}

export const FIELD_SPECS: readonly FieldSpec[] = [
  { key: "minute", min: 0, max: 59, fullMax: 59 },
  { key: "hour", min: 0, max: 23, fullMax: 23 },
  { key: "day", min: 1, max: 31, fullMax: 31 },
  { key: "month", min: 1, max: 12, fullMax: 12 },
  { key: "weekday", min: 0, max: 7, fullMax: 6 },
];

export const FIELD_KEYS: readonly CronFieldKey[] = [
  "minute",
  "hour",
  "day",
  "month",
  "weekday",
];

export type CronFields = Record<CronFieldKey, string>;

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

const WEEKDAY_NAMES = [
  "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT",
] as const;

export interface ParsedField {
  key: CronFieldKey;
  values: number[];
  canonical: string;
  restricted: boolean;
  error?: CronFieldError;
}

export type DescriptionShape =
  | "everyMinute"
  | "everyNMinutes"
  | "hourly"
  | "dailyAt"
  | "weeklyAt"
  | "monthlyOn"
  | "yearlyOn"
  | "custom";

/** Structured, language-neutral plan. The UI turns this into a sentence. */
export interface CronDescription {
  shape: DescriptionShape;
  minutes: number[];
  hours: number[];
  days: number[];
  months: number[];
  weekdays: number[];
  step?: number;
}

export interface CronAnalysis {
  fields: ParsedField[];
  expression: string;
  valid: boolean;
  errorField?: CronFieldKey;
  errorCode?: CronFieldError;
  description: CronDescription | null;
}

interface AtomResult {
  value?: number;
  error?: CronFieldError;
}

interface ItemResult {
  values?: number[];
  error?: CronFieldError;
}

const DIGITS = /^\d+$/u;

function specFor(key: CronFieldKey): FieldSpec {
  return FIELD_SPECS.find((spec) => spec.key === key) ?? FIELD_SPECS[0];
}

function resolveAtom(atom: string, spec: FieldSpec): AtomResult {
  const upper = atom.toUpperCase();

  if (DIGITS.test(atom)) {
    const value = Number(atom);
    return value >= spec.min && value <= spec.max
      ? { value }
      : { error: "OUT_OF_RANGE" };
  }

  let value = -1;
  if (spec.key === "month") {
    value = MONTH_NAMES.indexOf(upper as (typeof MONTH_NAMES)[number]) + 1;
  } else if (spec.key === "weekday") {
    value = WEEKDAY_NAMES.indexOf(upper as (typeof WEEKDAY_NAMES)[number]);
  }

  if (value < 0) return { error: "INVALID_NAME" };
  return { value };
}

function parseItem(item: string, spec: FieldSpec): ItemResult {
  if (!item) return { error: "INVALID_ITEM" };

  const parts = item.split("/");
  if (parts.length > 2) return { error: "INVALID_ITEM" };

  let step = 1;
  if (parts.length === 2) {
    if (!DIGITS.test(parts[1])) return { error: "INVALID_STEP" };
    step = Number(parts[1]);
    if (step < 1) return { error: "INVALID_STEP" };
  }

  const base = parts[0];
  let start: number;
  let end: number;

  if (base === "*") {
    start = spec.min;
    end = spec.fullMax;
  } else if (base.includes("-")) {
    const bounds = base.split("-");
    if (bounds.length !== 2) return { error: "INVALID_ITEM" };
    const from = resolveAtom(bounds[0], spec);
    const to = resolveAtom(bounds[1], spec);
    if (from.error) return { error: from.error };
    if (to.error) return { error: to.error };
    if (from.value === undefined || to.value === undefined) {
      return { error: "INVALID_ITEM" };
    }
    if (from.value > to.value) return { error: "REVERSED_RANGE" };
    start = from.value;
    end = to.value;
  } else {
    const single = resolveAtom(base, spec);
    if (single.error) return { error: single.error };
    if (single.value === undefined) return { error: "INVALID_ITEM" };
    start = single.value;
    end = parts.length === 2 ? spec.fullMax : single.value;
  }

  const values: number[] = [];
  for (let value = start; value <= end; value += step) {
    // Weekday 7 is an alias for Sunday and folds into 0.
    values.push(value > spec.fullMax ? spec.min : value);
  }
  return { values };
}

function canonicalToken(values: number[], spec: FieldSpec): string {
  const size = spec.fullMax - spec.min + 1;
  if (values.length === size) return "*";

  const step = values.length > 1 ? values[1] - values[0] : 0;
  if (
    values[0] === spec.min &&
    step > 1 &&
    values.every((value, index) => value === spec.min + index * step) &&
    values[values.length - 1] + step > spec.fullMax
  ) {
    return `*/${step}`;
  }

  if (
    values.length >= 3 &&
    values.every((value, index) => value === values[0] + index)
  ) {
    return `${values[0]}-${values[values.length - 1]}`;
  }

  return values.join(",");
}

export function parseField(key: CronFieldKey, raw: string): ParsedField {
  const spec = specFor(key);
  const trimmed = raw.trim();
  if (!trimmed) {
    return { key, values: [], canonical: "", restricted: false, error: "EMPTY" };
  }

  const items = trimmed.split(/[\s,]+/u).filter(Boolean);
  const unique = new Set<number>();

  for (const item of items) {
    const parsed = parseItem(item, spec);
    if (parsed.error || !parsed.values) {
      return {
        key,
        values: [],
        canonical: trimmed,
        restricted: false,
        error: parsed.error ?? "INVALID_ITEM",
      };
    }
    parsed.values.forEach((value) => unique.add(value));
  }

  const values = [...unique].sort((a, b) => a - b);
  const full = Array.from(
    { length: spec.fullMax - spec.min + 1 },
    (_, index) => spec.min + index,
  );
  const restricted = !(
    values.length === full.length && values.every((value, index) => value === full[index])
  );

  return { key, values, canonical: canonicalToken(values, spec), restricted };
}

function isFull(field: ParsedField): boolean {
  return !field.restricted;
}

function isSingle(field: ParsedField): boolean {
  return field.values.length === 1;
}

function describe(fields: ParsedField[]): CronDescription {
  const byKey = (key: CronFieldKey) =>
    fields.find((field) => field.key === key) as ParsedField;

  const minute = byKey("minute");
  const hour = byKey("hour");
  const day = byKey("day");
  const month = byKey("month");
  const weekday = byKey("weekday");

  const plan: CronDescription = {
    shape: "custom",
    minutes: minute.values,
    hours: hour.values,
    days: day.values,
    months: month.values,
    weekdays: weekday.values,
  };

  const simpleTime = isSingle(minute) && isSingle(hour);

  if (
    isFull(minute) && isFull(hour) && isFull(day) && isFull(month) && isFull(weekday)
  ) {
    plan.shape = "everyMinute";
    return plan;
  }

  if (
    isFull(hour) &&
    isFull(day) && isFull(month) && isFull(weekday) &&
    minute.values.length > 1 &&
    minute.values[0] === 0 &&
    minute.values.every((value, index) => value === index * minute.values[1])
  ) {
    plan.shape = "everyNMinutes";
    plan.step = minute.values[1];
    return plan;
  }

  if (
    minute.values.length === 1 && minute.values[0] === 0 &&
    isFull(hour) && isFull(day) && isFull(month) && isFull(weekday)
  ) {
    plan.shape = "hourly";
    return plan;
  }

  if (simpleTime && isFull(day) && isFull(month) && isFull(weekday)) {
    plan.shape = "dailyAt";
    return plan;
  }

  if (simpleTime && isFull(day) && isFull(month) && !isFull(weekday)) {
    plan.shape = "weeklyAt";
    return plan;
  }

  if (simpleTime && !isFull(day) && isFull(month) && isFull(weekday)) {
    plan.shape = "monthlyOn";
    return plan;
  }

  if (simpleTime && !isFull(day) && !isFull(month) && isFull(weekday)) {
    plan.shape = "yearlyOn";
    return plan;
  }

  return plan;
}

/** Parse all five fields and build a canonical expression. */
export function analyzeCron(fields: CronFields): CronAnalysis {
  const parsed = FIELD_KEYS.map((key) => parseField(key, fields[key] ?? ""));
  const expression = parsed.map((field) => field.canonical).join(" ");
  const broken = parsed.find((field) => Boolean(field.error));

  if (broken) {
    return {
      fields: parsed,
      expression,
      valid: false,
      errorField: broken.key,
      errorCode: broken.error,
      description: null,
    };
  }

  return {
    fields: parsed,
    expression,
    valid: true,
    description: describe(parsed),
  };
}

/**
 * Preview up to `count` upcoming runs. Scans minute by minute for one year,
 * which covers every standard five-field schedule including annual ones.
 * Day-of-month and day-of-week follow the usual cron OR rule when both are
 * restricted. Times are read from the supplied Date using local device time.
 */
export function getNextRuns(
  analysis: CronAnalysis,
  from: Date,
  count = 3,
): Date[] {
  if (!analysis.valid) return [];

  const valuesFor = (key: CronFieldKey) =>
    new Set(
      (analysis.fields.find((field) => field.key === key) as ParsedField).values,
    );

  const minutes = valuesFor("minute");
  const hours = valuesFor("hour");
  const days = valuesFor("day");
  const months = valuesFor("month");
  const weekdays = valuesFor("weekday");
  const dayField = analysis.fields.find((field) => field.key === "day") as ParsedField;
  const weekdayField = analysis.fields.find(
    (field) => field.key === "weekday",
  ) as ParsedField;

  const dayRestricted = dayField.restricted;
  const weekdayRestricted = weekdayField.restricted;

  const cursor = new Date(from);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const runs: Date[] = [];
  const MAX_MINUTES = 366 * 24 * 60;

  for (let elapsed = 0; elapsed < MAX_MINUTES && runs.length < count; elapsed += 1) {
    const monthMatches = months.has(cursor.getMonth() + 1);
    const dayMatches = days.has(cursor.getDate());
    const weekdayMatches = weekdays.has(cursor.getDay());

    let dayOk: boolean;
    if (dayRestricted && weekdayRestricted) {
      dayOk = dayMatches || weekdayMatches;
    } else if (dayRestricted) {
      dayOk = dayMatches;
    } else if (weekdayRestricted) {
      dayOk = weekdayMatches;
    } else {
      dayOk = true;
    }

    if (
      monthMatches &&
      dayOk &&
      hours.has(cursor.getHours()) &&
      minutes.has(cursor.getMinutes())
    ) {
      runs.push(new Date(cursor));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}
