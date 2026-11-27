/** Pure discount, coupon and tax arithmetic. No DOM, no React, no formatting. */

export type DiscountMode = "percent" | "amount";

export interface DiscountInput {
  price: number;
  mode: DiscountMode;
  discount: number;
  coupon: number;
  taxPercent: number;
  includeExtras: boolean;
}

export type DiscountError =
  | "INVALID_NUMBER"
  | "NEGATIVE_VALUE"
  | "INVALID_PERCENT"
  | "TOO_LARGE";

export interface DiscountResult {
  price: number;
  discountAmount: number;
  couponAmount: number;
  tax: number;
  savings: number;
  finalPrice: number;
  capped: boolean;
  error?: DiscountError;
}

export const DEFAULTS: DiscountInput = {
  price: 120,
  mode: "percent",
  discount: 25,
  coupon: 10,
  taxPercent: 8.25,
  includeExtras: true,
};

function fail(error: DiscountError): DiscountResult {
  return {
    price: 0,
    discountAmount: 0,
    couponAmount: 0,
    tax: 0,
    savings: 0,
    finalPrice: 0,
    capped: false,
    error,
  };
}

/**
 * Percent and fixed discounts are handled the same way after the discount
 * amount is known. An optional coupon is taken off next, then one flat tax
 * rate is applied to the reduced price. Savings never exceed the price.
 */
export function calculateDiscount(input: DiscountInput): DiscountResult {
  const { price, mode, discount, coupon, taxPercent, includeExtras } = input;

  if (![price, discount, coupon, taxPercent].every(Number.isFinite)) {
    return fail("INVALID_NUMBER");
  }

  if (price < 0 || discount < 0 || coupon < 0 || taxPercent < 0) {
    return fail("NEGATIVE_VALUE");
  }

  if (mode === "percent" && discount > 100) {
    return fail("INVALID_PERCENT");
  }

  if (mode === "amount" && discount > price) {
    return fail("TOO_LARGE");
  }

  const discountAmount = mode === "percent" ? price * (discount / 100) : discount;

  let couponAmount = includeExtras ? coupon : 0;
  const combined = discountAmount + couponAmount;
  const capped = combined > price;
  if (capped) {
    couponAmount = Math.max(0, price - discountAmount);
  }

  const savings = discountAmount + couponAmount;
  const reducedPrice = price - savings;
  const tax = includeExtras ? reducedPrice * (taxPercent / 100) : 0;

  return {
    price,
    discountAmount,
    couponAmount,
    tax,
    savings,
    finalPrice: reducedPrice + tax,
    capped,
  };
}
