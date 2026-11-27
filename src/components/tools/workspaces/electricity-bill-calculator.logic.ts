/** Pure electricity cost arithmetic. No DOM, React, storage, fetch or side effects. */

export type WattageUnit = "W" | "kW";

export interface ApplianceInput {
  id: string;
  name: string;
  power: string;
  hours: string;
  days: string;
}

export interface ElectricityBillInput {
  appliances: ApplianceInput[];
  wattageUnit: WattageUnit;
  daysPerMonth: string;
  rate: string;
  currency: string;
}

export type ElectricityErrorCode =
  | "NO_APPLIANCES"
  | "MISSING_POWER"
  | "INVALID_POWER"
  | "MISSING_HOURS"
  | "INVALID_HOURS"
  | "INVALID_DAYS"
  | "MISSING_RATE"
  | "INVALID_RATE";

export interface ApplianceResult {
  id: string;
  name: string;
  days: number;
  dailyKwh: number;
  monthlyKwh: number;
  monthlyCost: number;
}

export interface ElectricityBillValue {
  appliances: ApplianceResult[];
  daysPerMonth: number;
  rate: number;
  currency: string;
  wattageUnit: WattageUnit;
  dailyKwh: number;
  monthlyKwh: number;
  monthlyCost: number;
  yearlyKwh: number;
  yearlyCost: number;
}

export interface ElectricityBillResult {
  value?: ElectricityBillValue;
  error?: { code: ElectricityErrorCode };
}

export const MAX_APPLIANCES = 20;
export const DEFAULT_DAYS_PER_MONTH = "30";

export function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function isMonthLength(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 31;
}

export function calculateElectricityBill(
  input: ElectricityBillInput,
): ElectricityBillResult {
  const rows = input.appliances.slice(0, MAX_APPLIANCES);
  if (rows.length === 0) return { error: { code: "NO_APPLIANCES" } };

  const rate = parseNumber(input.rate);
  if (rate === null) return { error: { code: "MISSING_RATE" } };
  if (rate < 0) return { error: { code: "INVALID_RATE" } };

  const globalDays = parseNumber(input.daysPerMonth);
  if (globalDays === null || !isMonthLength(globalDays)) {
    return { error: { code: "INVALID_DAYS" } };
  }

  for (const row of rows) {
    const power = parseNumber(row.power);
    if (power === null) return { error: { code: "MISSING_POWER" } };
    if (power <= 0) return { error: { code: "INVALID_POWER" } };
    const hours = parseNumber(row.hours);
    if (hours === null) return { error: { code: "MISSING_HOURS" } };
    if (hours < 0 || hours > 24) return { error: { code: "INVALID_HOURS" } };
    if (row.days.trim()) {
      const override = parseNumber(row.days);
      if (override === null || !isMonthLength(override)) {
        return { error: { code: "INVALID_DAYS" } };
      }
    }
  }

  const appliances = rows.map((row) => {
    const power = parseNumber(row.power) as number;
    const hours = parseNumber(row.hours) as number;
    const days = row.days.trim()
      ? (parseNumber(row.days) as number)
      : globalDays;
    const powerKw = input.wattageUnit === "kW" ? power : power / 1000;
    const dailyKwh = powerKw * hours;
    const monthlyKwh = dailyKwh * days;
    return {
      id: row.id,
      name: row.name.trim(),
      days,
      dailyKwh,
      monthlyKwh,
      monthlyCost: monthlyKwh * rate,
    };
  });

  const dailyKwh = appliances.reduce((sum, item) => sum + item.dailyKwh, 0);
  const monthlyKwh = appliances.reduce((sum, item) => sum + item.monthlyKwh, 0);
  const monthlyCost = monthlyKwh * rate;

  return {
    value: {
      appliances,
      daysPerMonth: globalDays,
      rate,
      currency: input.currency,
      wattageUnit: input.wattageUnit,
      dailyKwh,
      monthlyKwh,
      monthlyCost,
      yearlyKwh: monthlyKwh * 12,
      yearlyCost: monthlyCost * 12,
    },
  };
}

export interface EstimateReportLabels {
  title: string;
  rate: string;
  days: string;
  unit: string;
  breakdown: string;
  daily: string;
  monthly: string;
  yearly: string;
  genericName: string;
  note: string;
}

export interface EstimateFormatters {
  number: (value: number) => string;
  money: (value: number) => string;
}

export function formatEstimateReport(
  value: ElectricityBillValue,
  labels: EstimateReportLabels,
  formatters: EstimateFormatters,
): string {
  const lines: string[] = [
    labels.title,
    `${labels.rate}: ${formatters.money(value.rate)} / ${labels.unit}`,
    `${labels.days}: ${value.daysPerMonth}`,
    labels.breakdown,
  ];
  for (const item of value.appliances) {
    lines.push(
      `${item.name || labels.genericName}: ${formatters.number(item.monthlyKwh)} ${labels.unit} / ${formatters.money(item.monthlyCost)}`,
    );
  }
  lines.push(`${labels.daily}: ${formatters.number(value.dailyKwh)} ${labels.unit}`);
  lines.push(
    `${labels.monthly}: ${formatters.number(value.monthlyKwh)} ${labels.unit} / ${formatters.money(value.monthlyCost)}`,
  );
  lines.push(
    `${labels.yearly}: ${formatters.number(value.yearlyKwh)} ${labels.unit} / ${formatters.money(value.yearlyCost)}`,
  );
  lines.push(labels.note);
  return lines.join("\n");
}
