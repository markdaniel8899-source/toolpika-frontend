/** Pure rent versus buy arithmetic. No DOM, React or locale formatting. */

export type RentVsBuyErrorCode =
  | "INVALID_NUMBER"
  | "OUT_OF_RANGE"
  | "DOWN_TOO_LARGE";

export interface RentVsBuyInput {
  /** Rent paid each month at the start of the holding period. */
  monthlyRent: number;
  /** Purchase price of the home. */
  homePrice: number;
  /** Cash paid up front. */
  downPayment: number;
  /** Nominal annual mortgage rate in percent, so 6 means 6 percent. */
  annualRate: number;
  /** Whole years the home is kept before selling. */
  years: number;
}

/**
 * Fixed assumptions applied to every calculation. They are shown in the
 * interface so the comparison can be read as a set of stated what-ifs rather
 * than a prediction of a particular market.
 */
export const ASSUMPTIONS = {
  mortgageTermYears: 30,
  propertyTaxRate: 0.01,
  insuranceRate: 0.0035,
  maintenanceRate: 0.01,
  closingRate: 0.02,
  sellingRate: 0.06,
  appreciationRate: 0.03,
  rentGrowthRate: 0.03,
} as const;

export const MAX_YEARS = 40;
export const MAX_RATE = 25;

export const DEFAULT_RENT_VS_BUY_INPUT: RentVsBuyInput = {
  monthlyRent: 1800,
  homePrice: 350000,
  downPayment: 70000,
  annualRate: 6,
  years: 10,
};

export const SAMPLE_RENT_VS_BUY_INPUT: RentVsBuyInput = {
  monthlyRent: 2200,
  homePrice: 400000,
  downPayment: 80000,
  annualRate: 5.5,
  years: 12,
};

export function validateRentVsBuyInput(
  input: RentVsBuyInput,
): RentVsBuyErrorCode | null {
  const values = [
    input.monthlyRent,
    input.homePrice,
    input.downPayment,
    input.annualRate,
    input.years,
  ];
  if (!values.every((value) => Number.isFinite(value))) {
    return "INVALID_NUMBER";
  }
  if (
    input.monthlyRent <= 0 ||
    input.homePrice <= 0 ||
    input.downPayment < 0 ||
    input.annualRate < 0 ||
    input.annualRate > MAX_RATE ||
    input.years < 1 ||
    input.years > MAX_YEARS ||
    !Number.isInteger(input.years)
  ) {
    return "OUT_OF_RANGE";
  }
  if (input.downPayment >= input.homePrice) {
    return "DOWN_TOO_LARGE";
  }
  return null;
}

/** Level monthly principal and interest payment for a fixed-rate loan. */
export function monthlyPrincipalAndInterest(
  loan: number,
  annualRate: number,
): number {
  if (loan <= 0) return 0;
  const months = ASSUMPTIONS.mortgageTermYears * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return loan / months;
  return (
    (loan * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
  );
}

/** Loan balance left after a whole number of years of payments. */
export function balanceAfterYears(
  loan: number,
  annualRate: number,
  payment: number,
  years: number,
): number {
  if (years <= 0) return loan;
  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return Math.max(0, loan - payment * months);
  }
  const growth = Math.pow(1 + monthlyRate, months);
  return Math.max(0, loan * growth - (payment * (growth - 1)) / monthlyRate);
}

/** Rent paid through a given year, including the annual rent increase. */
function rentThroughYear(input: RentVsBuyInput, years: number): number {
  let total = 0;
  for (let year = 1; year <= years; year += 1) {
    total +=
      input.monthlyRent *
      12 *
      Math.pow(1 + ASSUMPTIONS.rentGrowthRate, year - 1);
  }
  return total;
}

export interface RentVsBuyYear {
  year: number;
  /** Rent paid from year one through this year. */
  rentCost: number;
  /** Net buying cost if the home were sold at the end of this year. */
  buyCost: number;
  homeValue: number;
  equity: number;
}

export interface RentVsBuyResult {
  rentTotal: number;
  buyTotal: number;
  /** Buy total minus rent total. A negative number favours buying. */
  difference: number;
  cheaper: "rent" | "buy";
  loanAmount: number;
  monthlyPI: number;
  closingCost: number;
  carryingPerYear: number;
  breakEvenYear: number | null;
  years: RentVsBuyYear[];
  error?: RentVsBuyErrorCode;
}

function emptyResult(error: RentVsBuyErrorCode): RentVsBuyResult {
  return {
    rentTotal: 0,
    buyTotal: 0,
    difference: 0,
    cheaper: "rent",
    loanAmount: 0,
    monthlyPI: 0,
    closingCost: 0,
    carryingPerYear: 0,
    breakEvenYear: null,
    years: [],
    error,
  };
}

/**
 * Compare the cash cost of renting with the net cash cost of buying and
 * selling at the end of the chosen holding period. Raw numbers are returned;
 * the UI owns all rounding and formatting.
 */
export function calculateRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const problem = validateRentVsBuyInput(input);
  if (problem) return emptyResult(problem);

  const loanAmount = input.homePrice - input.downPayment;
  const monthlyPI = monthlyPrincipalAndInterest(loanAmount, input.annualRate);
  const closingCost = input.homePrice * ASSUMPTIONS.closingRate;
  const carryingPerYear =
    input.homePrice *
    (ASSUMPTIONS.propertyTaxRate +
      ASSUMPTIONS.insuranceRate +
      ASSUMPTIONS.maintenanceRate);

  const rows: RentVsBuyYear[] = [];
  for (let year = 1; year <= input.years; year += 1) {
    const homeValue =
      input.homePrice * Math.pow(1 + ASSUMPTIONS.appreciationRate, year);
    const remaining = balanceAfterYears(
      loanAmount,
      input.annualRate,
      monthlyPI,
      year,
    );
    const equity = homeValue - remaining;
    const sellingCost = homeValue * ASSUMPTIONS.sellingRate;
    const buyCost =
      input.downPayment +
      closingCost +
      monthlyPI * 12 * year +
      carryingPerYear * year -
      (equity - sellingCost);

    rows.push({
      year,
      rentCost: rentThroughYear(input, year),
      buyCost,
      homeValue,
      equity,
    });
  }

  const final = rows[rows.length - 1];
  const breakEven = rows.find((row) => row.buyCost <= row.rentCost);

  return {
    rentTotal: final.rentCost,
    buyTotal: final.buyCost,
    difference: final.buyCost - final.rentCost,
    cheaper: final.buyCost <= final.rentCost ? "buy" : "rent",
    loanAmount,
    monthlyPI,
    closingCost,
    carryingPerYear,
    breakEvenYear: breakEven ? breakEven.year : null,
    years: rows,
  };
}

export interface RentVsBuyReportLabels {
  title: string;
  rentTotal: string;
  buyTotal: string;
  difference: string;
  cheaper: string;
  cheaperRent: string;
  cheaperBuy: string;
  monthlyPI: string;
  loanAmount: string;
  breakEven: string;
  breakEvenReached: string;
  breakEvenNone: string;
  tableTitle: string;
  columnYear: string;
  columnRent: string;
  columnBuy: string;
  note: string;
}

/** Plain text comparison for the clipboard button. */
export function formatRentVsBuyReport(
  result: RentVsBuyResult,
  labels: RentVsBuyReportLabels,
  money: (value: number) => string,
): string {
  if (result.error) return "";
  const direction = result.cheaper === "buy" ? labels.cheaperBuy : labels.cheaperRent;
  const breakEven = result.breakEvenYear
    ? labels.breakEvenReached.replace("{year}", String(result.breakEvenYear))
    : labels.breakEvenNone;
  const lines = [
    labels.title,
    `${labels.rentTotal}: ${money(result.rentTotal)}`,
    `${labels.buyTotal}: ${money(result.buyTotal)}`,
    `${labels.difference}: ${money(Math.abs(result.difference))}`,
    `${labels.cheaper}: ${direction}`,
    `${labels.monthlyPI}: ${money(result.monthlyPI)}`,
    `${labels.loanAmount}: ${money(result.loanAmount)}`,
    `${labels.breakEven}: ${breakEven}`,
    "",
    labels.tableTitle,
    [
      labels.columnYear,
      labels.columnRent,
      labels.columnBuy,
    ].join(" | "),
    ...result.years.map((row) =>
      [
        String(row.year),
        money(row.rentCost),
        money(row.buyCost),
      ].join(" | "),
    ),
    "",
    labels.note,
  ];
  return lines.join("\n");
}
