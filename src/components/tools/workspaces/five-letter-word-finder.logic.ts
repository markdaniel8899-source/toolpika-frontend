/** Pure clue filtering. No DOM, React, storage or network access. */

export const WORD_LENGTH = 5;

/**
 * A curated bundle of common English five letter words. Every entry is lower
 * case, exactly five letters and not a proper noun. It is intentionally small
 * enough to ship inside the client bundle and answer a clue board instantly.
 */
export const COMMON_FIVE_LETTER_WORDS: readonly string[] = [
  "about", "above", "actor", "acute", "adapt", "admit", "adopt", "adult",
  "after", "again", "agent", "agree", "ahead", "alarm", "album", "alert",
  "alien", "alike", "alive", "allow", "alone", "along", "alter", "amber",
  "amend", "among", "ample", "angel", "anger", "angle", "angry", "apart",
  "apple", "apply", "arena", "argue", "arise", "armor", "arrow", "aside",
  "asset", "audio", "audit", "avoid", "awake", "award", "aware",
  "badge", "baker", "basic", "basin", "batch", "beach", "beard", "beast",
  "begin", "being", "below", "bench", "berry", "birth", "black", "blade",
  "blame", "blank", "blast", "blend", "blind", "block", "bloom", "board",
  "boost", "booth", "bound", "brain", "brake", "brand", "bread", "break",
  "breed", "brick", "bride", "brief", "bring", "broad", "broke", "brown",
  "brush", "build", "bunch", "bunny", "burst",
  "cable", "camel", "candy", "canoe", "cargo", "carry", "catch", "cause",
  "chain", "chair", "chalk", "chart", "chase", "cheap", "check", "cheek",
  "cheer", "chess", "chest", "chief", "child", "chill", "choir", "chose",
  "chunk", "churn", "civic", "civil", "claim", "class", "clean", "clear",
  "clerk", "click", "cliff", "climb", "clock", "close", "cloth", "cloud",
  "coach", "coast", "color", "comet", "comic", "coral", "count", "court",
  "cover", "crack", "craft", "crane", "crash", "crazy", "cream", "creek",
  "creep", "crime", "crisp", "cross", "crowd", "crown", "crude", "cruel",
  "crush", "crust", "curve", "cycle",
  "daily", "dance", "dealt", "death", "debut", "decay", "delay", "delta",
  "dense", "depth", "devil", "diary", "digit", "dirty", "doubt", "dozen",
  "draft", "drama", "dream", "dress", "dried", "drink", "drive", "drone",
  "dryer", "dusty",
  "eager", "eagle", "early", "earth", "eight", "elbow", "elder", "elect",
  "elite", "empty", "enemy", "enjoy", "enter", "entry", "equal", "error",
  "event", "every", "exact", "exist", "extra",
  "fable", "faith", "false", "fancy", "fault", "favor", "feast", "fence",
  "fever", "field", "fifth", "fifty", "fight", "final", "first", "flame",
  "flash", "fleet", "flesh", "float", "flock", "flood", "floor", "flour",
  "fluid", "focus", "force", "forge", "forth", "forty", "found", "frame",
  "frank", "fraud", "fresh", "fried", "front", "frost", "fruit", "funny",
  "giant", "given", "glass", "glide", "globe", "gloom", "glory", "glove",
  "going", "grace", "grade", "grain", "grand", "grant", "grape", "graph",
  "grasp", "grass", "grave", "great", "green", "greet", "grief", "grill",
  "grind", "groan", "gross", "group", "guard", "guess", "guest", "guide",
  "guilt",
  "happy", "hardy", "heart", "heavy", "hedge", "hello", "hence", "herbs",
  "hobby", "honey", "honor", "horse", "hotel", "house", "human", "humor",
  "hurry",
  "ideal", "image", "imply", "index", "inner", "input", "issue",
  "jeans", "jelly", "jewel", "joint", "judge", "juice", "jumbo",
  "karma", "knife", "knock", "known",
  "label", "labor", "large", "laser", "later", "laugh", "layer", "learn",
  "lease", "least", "leave", "legal", "lemon", "level", "light", "limit",
  "linen", "liver", "local", "logic", "loose", "lower", "loyal",
  "magic", "major", "maker", "mango", "maple", "march", "match", "maybe",
  "mayor", "meant", "medal", "media", "mercy", "merit", "merry", "metal",
  "meter", "might", "minor", "minus", "mixed", "model", "money", "month",
  "moral", "motor", "mount", "mouse", "mouth", "movie", "music",
  "naked", "names", "naval", "never", "newly", "night", "ninth", "noble",
  "noise", "north", "noted", "novel", "nurse",
  "ocean", "offer", "often", "olive", "onion", "opera", "orbit", "order",
  "other", "ought", "outer", "owner",
  "paint", "panel", "panic", "paper", "party", "paste", "patch", "pause",
  "peace", "pearl", "phase", "phone", "photo", "piano", "piece", "pilot",
  "pitch", "pixel", "pizza", "place", "plain", "plane", "plant", "plate",
  "point", "polar", "porch", "pound", "power", "press", "price", "pride",
  "prime", "print", "prior", "prize", "proof", "proud", "prove", "pulse",
  "punch", "pupil", "puppy",
  "queen", "query", "quest", "quick", "quiet", "quite", "quota",
  "radio", "raise", "range", "rapid", "ratio", "reach", "react", "ready",
  "realm", "rebel", "refer", "reign", "relax", "relay", "renew", "reply",
  "rhyme", "rider", "ridge", "rifle", "right", "rigid", "risen", "rival",
  "river", "roast", "robot", "rough", "round", "route", "royal", "rugby",
  "ruler", "rural",
  "salad", "salon", "salsa", "sandy", "sauce", "scale", "scene", "scent",
  "scope", "score", "scout", "scrap", "screw", "sense", "serve", "setup",
  "seven", "shade", "shake", "shall", "shame", "shape", "share", "shark",
  "sharp", "sheep", "sheet", "shelf", "shell", "shift", "shine", "shirt",
  "shock", "shoot", "shore", "short", "shout", "shown", "sight", "silly",
  "since", "sixth", "sixty", "skill", "sleep", "slice", "slide", "slope",
  "small", "smart", "smile", "smoke", "snake", "solar", "solid", "solve",
  "sound", "south", "space", "spare", "speak", "speed", "spell", "spend",
  "spice", "spill", "spine", "sport", "spray", "squad", "stack", "staff",
  "stage", "stain", "stair", "stake", "stand", "stare", "start", "state",
  "steam", "steel", "steep", "steer", "stern", "stick", "stiff", "still",
  "stock", "stone", "stood", "stool", "store", "storm", "story", "stove",
  "straw", "strip", "stuck", "study", "stuff", "style", "sugar", "suite",
  "super", "sweet", "swing", "sword",
  "table", "taken", "taste", "teach", "tears", "teeth", "tempo", "tenet",
  "thank", "theft", "their", "theme", "there", "thick", "thing", "think",
  "third", "those", "three", "threw", "throw", "tiger", "tight", "timer",
  "tired", "title", "today", "token", "tooth", "topic", "total", "touch",
  "tough", "tower", "track", "trade", "trail", "train", "trait", "treat",
  "trend", "trial", "tribe", "trick", "tried", "truck", "truly", "trunk",
  "trust", "truth", "twice", "twist",
  "under", "union", "unite", "unity", "until", "upper", "upset", "urban",
  "usage", "usual",
  "valid", "value", "vapor", "vault", "venue", "verse", "video", "vinyl",
  "viral", "virus", "visit", "vital", "vivid", "vocal", "voice", "voter",
  "wagon", "waist", "waste", "watch", "water", "waves", "weary", "weave",
  "weigh", "weird", "whale", "wheat", "wheel", "where", "which", "while",
  "white", "whole", "whose", "wider", "widow", "width", "witch", "woman",
  "women", "world", "worry", "worse", "worst", "worth", "would", "wound",
  "woven", "write", "wrong",
  "yacht", "yield", "young", "youth", "zebra",
];

export type SlotValue = string | null;

export interface FinderInput {
  /** Five entries. An empty string or null means the position is unknown. */
  readonly slots: readonly SlotValue[];
  readonly included: string;
  readonly excluded: string;
}

export interface ValidatedClues {
  /** Exactly five lowercase letters, with an empty string for unknown. */
  readonly slots: readonly [string, string, string, string, string];
  readonly included: readonly string[];
  readonly excluded: readonly string[];
}

export type ClueValidationError = "SLOT_COUNT" | "SLOT_VALUE";

export type ClueValidation =
  | { readonly valid: true; readonly clues: ValidatedClues }
  | { readonly valid: false; readonly error: ClueValidationError };

/** An empty slot becomes "", a single letter becomes lower case, rest is invalid. */
function parseSlot(value: SlotValue): string | null {
  if (value == null) return "";
  const letter = value.trim().toLowerCase();
  if (letter === "") return "";
  return /^[a-z]$/u.test(letter) ? letter : null;
}

/** Keep unique letters in the order typed, ignoring spaces and punctuation. */
function clueLetters(value: string): string[] {
  const seen = new Set<string>();
  for (const char of value.toLowerCase()) {
    if (/^[a-z]$/u.test(char) && !seen.has(char)) seen.add(char);
  }
  return Array.from(seen);
}

/**
 * Typed validation of the five slot values. A board is only accepted when it
 * has exactly five slots and each slot is empty or a single Latin letter.
 */
export function validateClues(input: FinderInput): ClueValidation {
  if (input.slots.length !== WORD_LENGTH) {
    return { valid: false, error: "SLOT_COUNT" };
  }

  const first = parseSlot(input.slots[0]);
  const second = parseSlot(input.slots[1]);
  const third = parseSlot(input.slots[2]);
  const fourth = parseSlot(input.slots[3]);
  const fifth = parseSlot(input.slots[4]);

  if (
    first === null || second === null || third === null ||
    fourth === null || fifth === null
  ) {
    return { valid: false, error: "SLOT_VALUE" };
  }

  return {
    valid: true,
    clues: {
      slots: [first, second, third, fourth, fifth],
      included: clueLetters(input.included),
      excluded: clueLetters(input.excluded),
    },
  };
}

/** Pure predicate. Positions must match exactly, included letters appear anywhere, excluded letters never appear. */
export function matchesClues(word: string, clues: ValidatedClues): boolean {
  if (word.length !== WORD_LENGTH) return false;

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const known = clues.slots[index];
    if (known !== "" && word[index] !== known) return false;
  }

  for (const letter of clues.included) {
    if (!word.includes(letter)) return false;
  }

  for (const letter of clues.excluded) {
    if (word.includes(letter)) return false;
  }

  return true;
}

/** Filter a word list against a board. Invalid boards simply match nothing. */
export function findMatchingWords(
  words: readonly string[],
  input: FinderInput,
): string[] {
  const validation = validateClues(input);
  if (!validation.valid) return [];
  return words.filter((word) => matchesClues(word, validation.clues));
}
