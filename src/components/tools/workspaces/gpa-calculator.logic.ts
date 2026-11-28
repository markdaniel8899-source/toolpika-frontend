/**
 * Pure grade point arithmetic. No DOM, React, storage or network access.
 * All inputs stay as strings at the boundary and are parsed here.
 */

export const GRADES = [
  "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F",
] as const;
export type Grade = (typeof GRADES)[number];

export const GRADE_POINTS: Record<Grade, number> = {
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  "D-": 0.7,
  F: 0,
};

export const WEIGHTS = ["standard", "honors", "ap"] as const;
export type CourseWeight = (typeof WEIGHTS)[number];

export const WEIGHT_BONUS: Record<CourseWeight, number> = {
  standard: 0,
  honors: 0.5,
  ap: 1,
};

export const MAX_POINTS_PER_COURSE = 5;
export const MAX_CREDITS_PER_COURSE = 30;

export type GpaErrorCode =
  | "NO_COURSES"
  | "EMPTY_CREDITS"
  | "INVALID_CREDITS"
  | "CREDITS_OUT_OF_RANGE"
  | "INVALID_GRADE"
  | "INVALID_PRIOR_GPA"
  | "INVALID_PRIOR_CREDITS"
  | "PRIOR_PAIR_INCOMPLETE";

export interface CourseRow {
  id: string;
  credits: string;
  grade: Grade;
  weight: CourseWeight;
}

export interface GpaInput {
  courses: CourseRow[];
  priorGpa: string;
  priorCredits: string;
  weighted: boolean;
}

export interface GpaResult {
  semesterGpa: number | null;
  cumulativeGpa: number | null;
  totalCredits: number;
  qualityPoints: number;
  courseCount: number;
  error?: { code: GpaErrorCode; rowId?: string };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** Calculate semester and cumulative GPA from course rows and prior totals. */
export function calculateGpa(input: GpaInput): GpaResult {
  const blank: GpaResult = {
    semesterGpa: null,
    cumulativeGpa: null,
    totalCredits: 0,
    qualityPoints: 0,
    courseCount: input.courses.length,
  };

  if (input.courses.length === 0) {
    return { ...blank, error: { code: "NO_COURSES" } };
  }

  let totalCredits = 0;
  let qualityPoints = 0;

  for (const course of input.courses) {
    if (course.credits.trim().length === 0) {
      return { ...blank, error: { code: "EMPTY_CREDITS", rowId: course.id } };
    }

    const credits = Number(course.credits);
    if (!Number.isFinite(credits)) {
      return { ...blank, error: { code: "INVALID_CREDITS", rowId: course.id } };
    }
    if (credits <= 0 || credits > MAX_CREDITS_PER_COURSE) {
      return { ...blank, error: { code: "CREDITS_OUT_OF_RANGE", rowId: course.id } };
    }

    const basePoints = GRADE_POINTS[course.grade];
    if (basePoints === undefined) {
      return { ...blank, error: { code: "INVALID_GRADE", rowId: course.id } };
    }

    const pointsPerCredit = input.weighted
      ? Math.min(MAX_POINTS_PER_COURSE, basePoints + WEIGHT_BONUS[course.weight])
      : basePoints;

    totalCredits += credits;
    qualityPoints += credits * pointsPerCredit;
  }

  if (totalCredits === 0) {
    return { ...blank, error: { code: "CREDITS_OUT_OF_RANGE" } };
  }

  const semesterGpa = round(qualityPoints / totalCredits);

  const priorGpaRaw = input.priorGpa.trim();
  const priorCreditsRaw = input.priorCredits.trim();
  const priorGpa = priorGpaRaw === "" ? 0 : Number(priorGpaRaw);
  const priorCredits = priorCreditsRaw === "" ? 0 : Number(priorCreditsRaw);

  if (!Number.isFinite(priorGpa) || priorGpa < 0 || priorGpa > MAX_POINTS_PER_COURSE) {
    return { ...blank, error: { code: "INVALID_PRIOR_GPA" } };
  }
  if (!Number.isFinite(priorCredits) || priorCredits < 0 || priorCredits > 1_000) {
    return { ...blank, error: { code: "INVALID_PRIOR_CREDITS" } };
  }
  if ((priorGpa > 0 && priorCredits === 0) || (priorGpa === 0 && priorCredits > 0)) {
    return { ...blank, error: { code: "PRIOR_PAIR_INCOMPLETE" } };
  }

  const cumulativeGpa = round(
    (priorGpa * priorCredits + qualityPoints) / (priorCredits + totalCredits),
  );

  return {
    semesterGpa,
    cumulativeGpa,
    totalCredits,
    qualityPoints: round(qualityPoints),
    courseCount: input.courses.length,
  };
}
