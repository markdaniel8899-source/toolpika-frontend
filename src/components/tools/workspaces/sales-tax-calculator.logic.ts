/** Pure sales tax arithmetic. No DOM, React, locale formatting or side effects. */

export type TaxMode = "add" | "extract";

export type TaxErrorCode =
  | "MISSING_AMOUNT"
  | "INVALID_AMOUNT"
  | "NEGATIVE_AMOUNT"
  | "INVALID_RATE"
  | "INVALID_QUANTITY";

export const TAX_MODES: readonly TaxMode[] = ["add", "extract"];
export const QUICK_RATES = [0, 5, 10, 20] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export interface TaxInput {
  /** Net amount in add mode, gross amount in extract mode. */
  amount: number;
  rate: number;
  quantity: number;
  mode: TaxMode;
}

export interface TaxValue {
  net: number;
  tax: number;
  total: number;
  rate: number;
  quantity: number;
  perUnitNet: number;
  perUnitTax: number;
  perUnitTotal: number;
}

export interface TaxResult {
  value?: TaxValue;
  error?: { code: TaxErrorCode };
}

/** Sample values shared by the component's Try sample action. */
export const DEFAULT_TAX_INPUT: TaxInput = {
  amount: 120,
  rate: 20,
  quantity: 3,
  mode: "add",
};
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

function fail(error: TaxErrorCode): TaxResult {
  return { error: { code: error } };
}

/** Money is kept to whole cents so display and copy agree. */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Add mode: tax is a percentage of the net amount, total is net plus tax.
 * Extract mode: tax is the share already inside the gross amount, computed as
 * gross times rate divided by 100 plus rate. Quantity only splits the result
 * into per-unit figures, it never changes the amount entered.
 */
export function calculateTax(input: TaxInput): TaxResult {
  const { amount, rate, quantity, mode } = input;

  if (!Number.isFinite(amount)) return fail("INVALID_AMOUNT");
  if (amount < 0) return fail("NEGATIVE_AMOUNT");
  if (!Number.isFinite(rate) || rate < 0) return fail("INVALID_RATE");
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
    return fail("INVALID_QUANTITY");
  }

  const gross =
    mode === "add" ? roundMoney(amount * (1 + rate / 100)) : roundMoney(amount);
  const tax =
    mode === "add"
      ? roundMoney(gross - amount)
      : roundMoney((gross * rate) / (100 + rate));
  const net = roundMoney(gross - tax);

  return {
    value: {
      net,
      tax,
      total: gross,
      rate,
      quantity,
      perUnitNet: roundMoney(net / quantity),
      perUnitTax: roundMoney(tax / quantity),
      perUnitTotal: roundMoney(gross / quantity),
    },
  };
}

export interface TaxReportLabels {
  title: string;
  mode: string;
  modeAdd: string;
  modeExtract: string;
  amount: string;
  rate: string;
  quantity: string;
  currency: string;
  net: string;
  tax: string;
  total: string;
  perUnit: string;
  perUnitNet: string;
  perUnitTax: string;
  perUnitTotal: string;
  note: string;
}

export interface TaxReportParts {
  amount: string;
  rate: string;
  net: string;
  tax: string;
  total: string;
  perUnitNet: string;
  perUnitTax: string;
  perUnitTotal: string;
}

/** Render the breakdown as plain text for clipboard use. */
export function formatTaxReport(
  input: TaxInput,
  currency: CurrencyCode,
  labels: TaxReportLabels,
  parts: TaxReportParts,
): string {
  const lines = [
    labels.title,
    `${labels.mode}: ${input.mode === "add" ? labels.modeAdd : labels.modeExtract}`,
    `${labels.amount}: ${parts.amount}`,
    `${labels.rate}: ${parts.rate}`,
    `${labels.quantity}: ${input.quantity}`,
    `${labels.currency}: ${currency}`,
    `${labels.net}: ${parts.net}`,
    `${labels.tax}: ${parts.tax}`,
    `${labels.total}: ${parts.total}`,
  ];
  if (input.quantity > 1) {
    lines.push(
      labels.perUnit,
      `${labels.perUnitNet}: ${parts.perUnitNet}`,
      `${labels.perUnitTax}: ${parts.perUnitTax}`,
      `${labels.perUnitTotal}: ${parts.perUnitTotal}`,
    );
  }
  lines.push(labels.note);
  return lines.join("\n");
}
