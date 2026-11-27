/** Pure, UTC-safe pregnancy date arithmetic. No DOM, React, storage or locale formatting. */

const MS_PER_DAY = 86_400_000;

export type DueDateMethod = "lmp" | "conception" | "ivf";
export type TransferDay = 2 | 3 | 5;
export type MilestoneKey = "firstTrimesterEnd" | "midpoint" | "termStart" | "termEnd";
export type Trimester = "first" | "second" | "third" | "afterDue";

export interface DueDateInput {
  method: DueDateMethod;
  reference: string;
  transferDay: TransferDay;
  asOf: string;
}

export type DueDateErrorCode =
  | "MISSING_REFERENCE"
  | "INVALID_REFERENCE"
  | "MISSING_AS_OF"
  | "INVALID_AS_OF"
  | "ORDER";

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

export interface Milestone {
  key: MilestoneKey;
  date: string;
  weeks: number;
  days: number;
}

export interface DueDateValue {
  dueDate: string;
  lmpEquivalent: string;
  gestationalWeeks: number;
  gestationalDays: number;
  gestationalTotalDays: number;
  daysUntilDue: number;
  trimester: Trimester;
  milestones: Milestone[];
}

export interface DueDateResult {
  value?: DueDateValue;
  error?: { code: DueDateErrorCode };
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a YYYY-MM-DD calendar date, rejecting rollover dates. */
export function parseDate(raw: string): ParsedDate | null {
  const match = DATE_PATTERN.exec(raw.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(0);
  check.setUTCFullYear(year, month - 1, day);
  check.setUTCHours(0, 0, 0, 0);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function dayNumber(parts: ParsedDate): number {
  return Math.round(
    Date.UTC(parts.year, parts.month - 1, parts.day) / MS_PER_DAY,
  );
}

function dateFromDayNumber(day: number): string {
  const date = new Date(day * MS_PER_DAY);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

function offsetFor(method: DueDateMethod, transferDay: TransferDay): number {
  if (method === "lmp") return 280;
  if (method === "conception") return 266;
  return 280 - 14 - transferDay;
}

function lmpOffsetFor(method: DueDateMethod, transferDay: TransferDay): number {
  if (method === "lmp") return 0;
  if (method === "conception") return 14;
  return 14 + transferDay;
}

function trimesterFor(totalDays: number, dueDay: number, asOfDay: number): Trimester {
  if (asOfDay > dueDay) return "afterDue";
  if (totalDays < 98) return "first";
  if (totalDays < 196) return "second";
  return "third";
}

export function calculateDueDate(input: DueDateInput): DueDateResult {
  if (!input.reference.trim()) return { error: { code: "MISSING_REFERENCE" } };
  const reference = parseDate(input.reference);
  if (!reference) return { error: { code: "INVALID_REFERENCE" } };

  if (!input.asOf.trim()) return { error: { code: "MISSING_AS_OF" } };
  const asOf = parseDate(input.asOf);
  if (!asOf) return { error: { code: "INVALID_AS_OF" } };

  const referenceDay = dayNumber(reference);
  const asOfDay = dayNumber(asOf);
  if (asOfDay < referenceDay) return { error: { code: "ORDER" } };

  const lmpDay = referenceDay - lmpOffsetFor(input.method, input.transferDay);
  const dueDay = lmpDay + 280;
  const gestationalTotalDays = asOfDay - lmpDay;
  const milestones: Milestone[] = [
    { key: "firstTrimesterEnd", date: dateFromDayNumber(lmpDay + 97), weeks: 13, days: 6 },
    { key: "midpoint", date: dateFromDayNumber(lmpDay + 140), weeks: 20, days: 0 },
    { key: "termStart", date: dateFromDayNumber(lmpDay + 259), weeks: 37, days: 0 },
    { key: "termEnd", date: dateFromDayNumber(lmpDay + 294), weeks: 42, days: 0 },
  ];

  return {
    value: {
      dueDate: dateFromDayNumber(referenceDay + offsetFor(input.method, input.transferDay)),
      lmpEquivalent: dateFromDayNumber(lmpDay),
      gestationalWeeks: Math.floor(gestationalTotalDays / 7),
      gestationalDays: gestationalTotalDays % 7,
      gestationalTotalDays,
      daysUntilDue: dueDay - asOfDay,
      trimester: trimesterFor(gestationalTotalDays, dueDay, asOfDay),
      milestones,
    },
  };
}

export interface DueDateReportLabels {
  title: string;
  method: string;
  reference: string;
  asOf: string;
  due: string;
  gestational: string;
  trimester: string;
  milestones: string;
  note: string;
}

export function formatDueDateReport(
  input: DueDateInput,
  value: DueDateValue,
  labels: DueDateReportLabels,
  methodLabel: string,
  trimesterLabel: string,
  milestoneLabels: Record<MilestoneKey, string>,
  formatDate: (raw: string) => string,
): string {
  const lines: string[] = [
    labels.title,
    `${labels.method}: ${methodLabel}`,
    `${labels.reference}: ${input.reference}`,
    `${labels.asOf}: ${input.asOf}`,
    `${labels.due}: ${formatDate(value.dueDate)}`,
    `${labels.gestational}: ${value.gestationalWeeks} + ${value.gestationalDays}`,
    `${labels.trimester}: ${trimesterLabel}`,
    labels.milestones,
  ];
  for (const milestone of value.milestones) {
    lines.push(`${milestoneLabels[milestone.key]}: ${formatDate(milestone.date)}`);
  }
  lines.push(labels.note);
  return lines.join("\n");
}
