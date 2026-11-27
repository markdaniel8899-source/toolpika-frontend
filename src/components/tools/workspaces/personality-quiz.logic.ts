/**
 * Pure data and scoring for the Personality and Work-Style Vibe Quiz.
 * No DOM, no React, no storage and no network. The same eight answers always
 * produce the same archetype, including when two or more scores tie.
 */

export type Archetype = "architect" | "catalyst" | "craftsperson" | "navigator";
export type AnswerId = "a" | "b" | "c";

export type ArchetypeScores = Record<Archetype, number>;

export interface AnswerOption {
  id: AnswerId;
  /** Points added to each archetype. Missing keys add zero. */
  scores: Partial<ArchetypeScores>;
}

export interface Question {
  id: string;
  options: AnswerOption[];
}

/** Fixed display order also acts as the deterministic tie break. */
export const ARCHETYPES: readonly Archetype[] = [
  "architect",
  "catalyst",
  "craftsperson",
  "navigator",
];

export const OPTION_IDS: readonly AnswerId[] = ["a", "b", "c"];

/**
 * Eight scenarios. Each card offers three answers, so one archetype sits out
 * every round. Over eight rounds every archetype is offered six times.
 */
export const QUESTIONS: readonly Question[] = [
  {
    id: "q1",
    options: [
      { id: "a", scores: { architect: 2, navigator: 1 } },
      { id: "b", scores: { catalyst: 2, architect: 1 } },
      { id: "c", scores: { navigator: 2, catalyst: 1 } },
    ],
  },
  {
    id: "q2",
    options: [
      { id: "a", scores: { catalyst: 2, navigator: 1 } },
      { id: "b", scores: { craftsperson: 2, architect: 1 } },
      { id: "c", scores: { navigator: 2, craftsperson: 1 } },
    ],
  },
  {
    id: "q3",
    options: [
      { id: "a", scores: { architect: 2, craftsperson: 1 } },
      { id: "b", scores: { craftsperson: 2, navigator: 1 } },
      { id: "c", scores: { navigator: 2, architect: 1 } },
    ],
  },
  {
    id: "q4",
    options: [
      { id: "a", scores: { architect: 2, catalyst: 1 } },
      { id: "b", scores: { catalyst: 2, craftsperson: 1 } },
      { id: "c", scores: { craftsperson: 2, architect: 1 } },
    ],
  },
  {
    id: "q5",
    options: [
      { id: "a", scores: { architect: 2, navigator: 1 } },
      { id: "b", scores: { catalyst: 2, navigator: 1 } },
      { id: "c", scores: { navigator: 2, catalyst: 1 } },
    ],
  },
  {
    id: "q6",
    options: [
      { id: "a", scores: { catalyst: 2, architect: 1 } },
      { id: "b", scores: { craftsperson: 2, catalyst: 1 } },
      { id: "c", scores: { navigator: 2, architect: 1 } },
    ],
  },
  {
    id: "q7",
    options: [
      { id: "a", scores: { architect: 2, navigator: 1 } },
      { id: "b", scores: { craftsperson: 2, architect: 1 } },
      { id: "c", scores: { navigator: 2, craftsperson: 1 } },
    ],
  },
  {
    id: "q8",
    options: [
      { id: "a", scores: { architect: 2, craftsperson: 1 } },
      { id: "b", scores: { catalyst: 2, architect: 1 } },
      { id: "c", scores: { craftsperson: 2, navigator: 1 } },
    ],
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

function emptyScores(): ArchetypeScores {
  return { architect: 0, catalyst: 0, craftsperson: 0, navigator: 0 };
}

/** A fresh, unanswered deck. One slot per question, all empty. */
export function initialAnswers(): (AnswerId | null)[] {
  return QUESTIONS.map(() => null);
}

/** Return a new answer list with one slot replaced, leaving the old list intact. */
export function recordAnswer(
  answers: (AnswerId | null)[],
  index: number,
  optionId: AnswerId,
): (AnswerId | null)[] {
  if (index < 0 || index >= QUESTIONS.length) return answers.slice();
  const next = answers.slice();
  next[index] = optionId;
  return next;
}

/** Move one card back without touching any recorded answer. */
export function previousStep(current: number): number {
  return Math.max(0, current - 1);
}

/** Move one card forward, capped at the result step. */
export function nextStep(current: number): number {
  return Math.min(TOTAL_STEPS, current + 1);
}

/** True only when every one of the eight cards has an answer. */
export function isComplete(answers: (AnswerId | null)[]): boolean {
  return answers.length === TOTAL_STEPS && answers.every((value) => value !== null);
}

/** Highest score wins. Strict comparison keeps ties on the first in ARCHETYPES. */
export function winningArchetype(scores: ArchetypeScores): Archetype {
  let best: Archetype = ARCHETYPES[0];
  for (const archetype of ARCHETYPES) {
    if (scores[archetype] > scores[best]) best = archetype;
  }
  return best;
}

export interface QuizResult {
  scores: ArchetypeScores;
  winner: Archetype;
}

/** Sum the mapped points and return the winner, or null for a partial deck. */
export function scoreAnswers(answers: (AnswerId | null)[]): QuizResult | null {
  if (!isComplete(answers)) return null;

  const scores = emptyScores();
  QUESTIONS.forEach((question, index) => {
    const option = question.options.find((item) => item.id === answers[index]);
    if (!option) return;
    for (const archetype of ARCHETYPES) {
      scores[archetype] += option.scores[archetype] ?? 0;
    }
  });

  return { scores, winner: winningArchetype(scores) };
}
