/** Pure, local password scoring. No storage, network or random values. */

export type StrengthBand = "empty" | "weak" | "fair" | "good" | "strong";
export type TipId = "length" | "variety" | "patterns" | "common" | "spaces";

export interface PasswordChecks {
  length: boolean;
  lower: boolean;
  upper: boolean;
  numbers: boolean;
  symbols: boolean;
  noSequence: boolean;
  noRepeat: boolean;
  uncommon: boolean;
  noSpaces: boolean;
}

export interface PasswordAssessment {
  score: 0 | 1 | 2 | 3 | 4;
  band: StrengthBand;
  entropyBits: number;
  poolSize: number;
  checks: PasswordChecks;
  tips: TipId[];
}

export const PASSWORD_SAMPLE = "CorrectHorse9!Battery";
export const DEFAULT_MIN_LENGTH = 12;

const COMMON = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "abc123",
  "iloveyou",
  "monkey",
];

const LOWER = 26;
const UPPER = 26;
const DIGITS = 10;
const SYMBOLS = 32;

/** Detect four or more consecutive letters or digits stepping by one. */
function hasSequence(value: string): boolean {
  const text = value.toLowerCase();
  for (let index = 0; index + 3 < text.length; index += 1) {
    const a = text.charCodeAt(index);
    const b = text.charCodeAt(index + 1);
    const c = text.charCodeAt(index + 2);
    const d = text.charCodeAt(index + 3);
    if (
      /[a-z0-9]/u.test(text[index]) &&
      /[a-z0-9]/u.test(text[index + 1]) &&
      /[a-z0-9]/u.test(text[index + 2]) &&
      /[a-z0-9]/u.test(text[index + 3]) &&
      b === a + 1 &&
      c === b + 1 &&
      d === c + 1
    ) {
      return true;
    }
  }
  return false;
}

/** Detect three equal neighbours or a two character block repeated three times. */
function hasRepeat(value: string): boolean {
  if (/(.)\1{2,}/u.test(value)) return true;
  return /^(.{1,6})\1{2,}$/u.test(value);
}

function containsCommon(value: string): boolean {
  const text = value.toLowerCase();
  return COMMON.some((word) => text.includes(word));
}

export function assessPassword(value: string, minLength = DEFAULT_MIN_LENGTH): PasswordAssessment {
  if (!value) {
    return {
      score: 0,
      band: "empty",
      entropyBits: 0,
      poolSize: 0,
      checks: {
        length: false,
        lower: false,
        upper: false,
        numbers: false,
        symbols: false,
        noSequence: true,
        noRepeat: true,
        uncommon: true,
        noSpaces: true,
      },
      tips: [],
    };
  }

  const threshold = Math.min(32, Math.max(4, Math.floor(minLength)));
  const sequence = hasSequence(value);
  const repeat = hasRepeat(value);
  const common = containsCommon(value);
  const spaces = /\s/u.test(value);

  const checks: PasswordChecks = {
    length: value.length >= threshold,
    lower: /[a-z]/u.test(value),
    upper: /[A-Z]/u.test(value),
    numbers: /[0-9]/u.test(value),
    symbols: /[^A-Za-z0-9\s]/u.test(value),
    noSequence: !sequence,
    noRepeat: !repeat,
    uncommon: !common,
    noSpaces: !spaces,
  };

  const poolSize =
    (checks.lower ? LOWER : 0) +
    (checks.upper ? UPPER : 0) +
    (checks.numbers ? DIGITS : 0) +
    (checks.symbols ? SYMBOLS : 0) +
    (spaces ? 4 : 0);

  const rawBits = poolSize > 0 ? value.length * Math.log2(poolSize) : 0;
  const penalty = (sequence ? 18 : 0) + (repeat ? 14 : 0) + (common ? 24 : 0);
  const entropyBits = Math.max(0, Math.round(rawBits - penalty));

  let points = 0;
  if (value.length >= 8) points += 1;
  if (value.length >= threshold) points += 1;
  if (value.length >= 16) points += 1;
  const variety = [checks.lower, checks.upper, checks.numbers, checks.symbols].filter(Boolean).length;
  if (variety >= 2) points += 1;
  if (variety >= 3) points += 1;
  if (variety >= 4) points += 1;
  if (!sequence && !repeat && !common) points += 2;
  if (spaces) points -= 1;

  let score: 1 | 2 | 3 | 4 = 1;
  if (points >= 8 && checks.length && checks.uncommon) score = 4;
  else if (points >= 6 && checks.length) score = 3;
  else if (points >= 4) score = 2;

  const band: StrengthBand = (["weak", "fair", "good", "strong"] as const)[score - 1];

  const tips: TipId[] = [];
  if (!checks.length) tips.push("length");
  if (variety < 3) tips.push("variety");
  if (sequence || repeat) tips.push("patterns");
  if (common) tips.push("common");
  if (spaces) tips.push("spaces");

  return { score, band, entropyBits, poolSize, checks, tips };
}

export const BAND_LABEL_KEYS: Record<StrengthBand, string> = {
  empty: "password-strength-checker.bandEmpty",
  weak: "password-strength-checker.bandWeak",
  fair: "password-strength-checker.bandFair",
  good: "password-strength-checker.bandGood",
  strong: "password-strength-checker.bandStrong",
};

export const BAND_TONES: Record<StrengthBand, "neutral" | "danger" | "warning" | "accent" | "success"> = {
  empty: "neutral",
  weak: "danger",
  fair: "warning",
  good: "accent",
  strong: "success",
};

export const TIP_KEYS: Record<TipId, string> = {
  length: "password-strength-checker.tipLength",
  variety: "password-strength-checker.tipVariety",
  patterns: "password-strength-checker.tipPatterns",
  common: "password-strength-checker.tipCommon",
  spaces: "password-strength-checker.tipSpaces",
};

export const CHECK_KEYS: Record<keyof PasswordChecks, string> = {
  length: "password-strength-checker.checkLength",
  lower: "password-strength-checker.checkLower",
  upper: "password-strength-checker.checkUpper",
  numbers: "password-strength-checker.checkNumbers",
  symbols: "password-strength-checker.checkSymbols",
  noSequence: "password-strength-checker.checkSequence",
  noRepeat: "password-strength-checker.checkRepeat",
  uncommon: "password-strength-checker.checkCommon",
  noSpaces: "password-strength-checker.checkSpaces",
};

export const CHECK_ORDER: (keyof PasswordChecks)[] = [
  "length",
  "lower",
  "upper",
  "numbers",
  "symbols",
  "noSequence",
  "noRepeat",
  "uncommon",
  "noSpaces",
];
