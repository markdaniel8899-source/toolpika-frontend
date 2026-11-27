/**
 * Pure helpers for the Random Choice Picker. No React, no DOM, no network.
 * Winners come from crypto.getRandomValues with rejection sampling, never
 * a predictable fallback, so every entry in the active pool has exactly the
 * same chance.
 */

export type PickerPreset =
  | "lunchSpots"
  | "teamTurn"
  | "yesOrNo"
  | "weekendActivity";

export type PresetLists = Record<PickerPreset, string>;

export interface WeightedEntry {
  label: string;
  weight: number;
}

/** Upper bound that keeps the tag view readable and the draw responsive. */
export const MAX_ITEMS = 200;
/** How many winners stay in the compact recent strip. */
export const MAX_RECENT = 6;

/**
 * Split pasted text into clean, unique choices. One choice per line, blank
 * lines are dropped and case-insensitive duplicates are folded into one.
 */
export function parseItemList(raw: string): string[] {
  if (!raw) return [];

  const seen = new Set<string>();
  const items: string[] = [];

  for (const line of raw.split(/\r?\n/u)) {
    const label = line.trim();
    if (!label) continue;

    const key = label.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    items.push(label);
    if (items.length >= MAX_ITEMS) break;
  }

  return items;
}

/** Merge new text into an existing list without duplicates or overruns. */
export function addItems(items: string[], raw: string): string[] {
  const incoming = parseItemList(raw);
  if (!incoming.length) return items;

  const keys = new Set(items.map((item) => item.toLowerCase()));
  const merged = [...items];

  for (const label of incoming) {
    const key = label.toLowerCase();
    if (keys.has(key)) continue;
    if (merged.length >= MAX_ITEMS) break;

    keys.add(key);
    merged.push(label);
  }

  return merged;
}

/** Drop one entry by its current position. */
export function removeItem(items: string[], index: number): string[] {
  if (!Number.isInteger(index) || index < 0 || index >= items.length) {
    return items;
  }
  return items.filter((_, position) => position !== index);
}

/** Keep elimination flags only for choices that still exist. */
export function pruneEliminated(eliminated: string[], items: string[]): string[] {
  const valid = new Set(items);
  return eliminated.filter((label) => valid.has(label));
}

/** Turn a translated, newline-separated preset into a fresh list. */
export function applyPreset(preset: PickerPreset, presets: PresetLists): string[] {
  return parseItemList(presets[preset] ?? "");
}

/**
 * Weight every choice. With elimination on, already picked entries carry
 * weight 0 so they cannot be drawn again; all remaining entries carry weight 1.
 */
export function buildWeightedPool(
  items: string[],
  eliminated: string[],
  eliminate: boolean,
): WeightedEntry[] {
  if (!eliminate) {
    return items.map((label) => ({ label, weight: 1 }));
  }

  const gone = new Set(eliminated);
  return items.map((label) => ({ label, weight: gone.has(label) ? 0 : 1 }));
}

/** Choices that are still eligible for the next draw. */
export function availablePool(
  items: string[],
  eliminated: string[],
  eliminate: boolean,
): string[] {
  return buildWeightedPool(items, eliminated, eliminate)
    .filter((entry) => entry.weight > 0)
    .map((entry) => entry.label);
}

/** Web Crypto is required; there is deliberately no predictable fallback. */
export function supportsSecureRandom(): boolean {
  return typeof globalThis.crypto?.getRandomValues === "function";
}

/**
 * Uniform index in [0, length) using rejection sampling. A plain modulo would
 * slightly favour the first entries, so values at or above the largest exact
 * multiple of length are discarded and redrawn.
 */
export function secureRandomIndex(length: number): number {
  if (!Number.isInteger(length) || length <= 0) return -1;

  const range = 0x100000000;
  const limit = Math.floor(range / length) * length;
  const values = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return value % length;
}

/** Pick one entry from a pool, or null when no draw is possible. */
export function pickWinner(pool: string[]): string | null {
  if (!pool.length || !supportsSecureRandom()) return null;
  return pool[secureRandomIndex(pool.length)] ?? null;
}

/** Add the latest winner to the eliminated set when elimination is enabled. */
export function withElimination(
  eliminated: string[],
  winner: string,
  eliminate: boolean,
): string[] {
  if (!eliminate || eliminated.includes(winner)) return eliminated;
  return [...eliminated, winner];
}

/** newest first, unique, capped at MAX_RECENT. */
export function withRecent(recent: string[], winner: string): string[] {
  return [winner, ...recent.filter((label) => label !== winner)].slice(
    0,
    MAX_RECENT,
  );
}
