import type { Translate } from "@/lib/tools/translate";

/**
 * Flexible, module-based content model.
 *
 * A tool page is a list of sections, not a fixed seven-block template. Each
 * tool can include, omit or reorder modules based on what that tool actually
 * needs, which keeps pages from competing for the same generic copy.
 */
export type ContentSectionKind =
  | "definition"
  | "steps"
  | "example"
  | "facts"
  | "useCases"
  | "mistakes"
  | "faq";

export interface TextPair {
  title: string;
  body: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type ContentSection =
  | {
      kind: "definition";
      id: string;
      title: string;
      /** A concise, quotable answer shown before the detail (AEO/GEO). */
      answer: string;
      paragraphs: string[];
    }
  | { kind: "steps"; id: string; title: string; items: string[] }
  | {
      kind: "example";
      id: string;
      title: string;
      label: string;
      input: string;
      output: string;
      note: string;
    }
  | { kind: "facts"; id: string; title: string; items: TextPair[] }
  | {
      kind: "points";
      id: string;
      title: string;
      items: TextPair[];
      tone?: "warning";
      /** Optional limit list rendered inside the same section. */
      limitsTitle?: string;
      limits?: string[];
    }
  | { kind: "faq"; id: string; title: string; items: FaqItem[] };

export interface ToolPageContent {
  byline: string;
  directAnswer: string;
  aboutTitle: string;
  contextualLink: string;
  /** Long-tail intents this page is uniquely allowed to target. */
  searchIntents: string[];
  sections: ContentSection[];

  // Legacy flat fields are retained for schema builders and older callers.
  whatIsTitle: string;
  whatIsParagraphs: string[];
  howToTitle: string;
  howToSteps: string[];
  exampleTitle: string;
  exampleLabel: string;
  exampleInput: string;
  exampleOutput: string;
  exampleNote: string;
  featuresTitle: string;
  features: TextPair[];
  useCasesTitle: string;
  useCases: TextPair[];
  mistakesTitle: string;
  mistakes: TextPair[];
  limitsTitle: string;
  limits: string[];
  faqTitle: string;
  faqs: FaqItem[];
  trustTitle: string;
  trustBody: string;
}

/** Slugs with a dedicated, hand-written template page. */
const WITH_FULL_CONTENT = new Set([
  "word-counter",
  "case-converter",
  "image-compressor",
  "json-formatter",
  "unit-converter",
  "password-generator",
  "url-encoder",
  "base64-encoder",
  "json-to-csv",
  "markdown-to-html",
  "color-converter",
  "number-base-converter",
  "timestamp-converter",
  "data-storage-converter",
  "slug-generator",
  "yaml-to-json",
  "lorem-ipsum-generator",
  "text-diff-checker",
  "uuid-generator",
  "jwt-decoder",
  "regex-tester",
  "percentage-calculator",
  "aspect-ratio-calculator",
  "utm-builder",
  "hash-generator",
  "image-resizer",
  "remove-duplicate-lines",
  "sort-text-lines",
  "find-and-replace-text",
  "character-frequency-counter",
  "readability-score-checker",
  "html-formatter",
  "css-formatter",
  "css-minifier",
  "js-minifier",
  "sql-formatter",
  "cron-expression-generator",
  "hmac-generator",
  "random-string-generator",
  "meta-tag-generator",
  "keyword-density-checker",
  "open-graph-generator",
  "compound-interest-calculator",
  "loan-emi-calculator",
  "bmi-calculator",
  "pomodoro-timer",
]);

/** Tools with an explicit long-tail intent list in their messages. */
const WITH_SEARCH_INTENTS = new Set([
  "word-counter",
  "lorem-ipsum-generator",
  "text-diff-checker",
  "uuid-generator",
  "jwt-decoder",
  "regex-tester",
  "percentage-calculator",
  "aspect-ratio-calculator",
  "utm-builder",
  "hash-generator",
  "image-resizer",
  "remove-duplicate-lines",
  "sort-text-lines",
  "sql-formatter",
  "js-minifier",
  "cron-expression-generator",
  "hmac-generator",
  "random-string-generator",
  "pomodoro-timer",
]);

/**
 * Default section order. Overrides let a tool drop modules it does not need
 * (for example, a password generator has no meaningful syntax example).
 */
const DEFAULT_PLAN: ContentSectionKind[] = [
  "definition",
  "steps",
  "example",
  "facts",
  "useCases",
  "mistakes",
  "faq",
];

const SECTION_PLANS: Record<string, ContentSectionKind[]> = {
  "word-counter": [
    "definition",
    "steps",
    "example",
    "facts",
    "useCases",
    "mistakes",
    "faq",
  ],
  "case-converter": [
    "definition",
    "steps",
    "example",
    "useCases",
    "mistakes",
    "faq",
  ],
  "image-compressor": [
    "definition",
    "steps",
    "facts",
    "useCases",
    "mistakes",
    "faq",
  ],
  "json-formatter": [
    "definition",
    "steps",
    "example",
    "facts",
    "mistakes",
    "faq",
  ],
  "unit-converter": ["definition", "steps", "example", "useCases", "mistakes", "faq"],
  "password-generator": ["definition", "steps", "facts", "mistakes", "faq"],
  "url-encoder": ["definition", "steps", "example", "mistakes", "faq"],
  "base64-encoder": ["definition", "steps", "example", "mistakes", "faq"],
  // "features" in the template maps to the "facts" module in this codebase.
  "json-to-csv": [
    "definition",
    "steps",
    "example",
    "facts",
    "useCases",
    "mistakes",
    "faq",
  ],
  "markdown-to-html": [
    "definition",
    "steps",
    "example",
    "useCases",
    "mistakes",
    "faq",
  ],
  "color-converter": [
    "definition",
    "steps",
    "example",
    "facts",
    "mistakes",
    "faq",
  ],
  "number-base-converter": [
    "definition",
    "steps",
    "example",
    "mistakes",
    "faq",
  ],
  "timestamp-converter": [
    "definition",
    "steps",
    "example",
    "useCases",
    "mistakes",
    "faq",
  ],
  "data-storage-converter": [
    "definition",
    "steps",
    "example",
    "mistakes",
    "faq",
  ],
  "slug-generator": [
    "definition",
    "steps",
    "example",
    "useCases",
    "mistakes",
    "faq",
  ],
  "yaml-to-json": [
    "definition",
    "steps",
    "example",
    "facts",
    "mistakes",
    "faq",
  ],
  // Each plan follows the task: reference first where standards matter,
  // worked example first where the output shape matters, and no filler
  // modules where the tool simply has nothing useful to say in them.
  "lorem-ipsum-generator": ["definition", "steps", "example", "mistakes", "faq"],
  "text-diff-checker": ["definition", "example", "steps", "mistakes", "faq"],
  "uuid-generator": ["definition", "facts", "steps", "mistakes", "faq"],
  "jwt-decoder": ["definition", "example", "facts", "mistakes", "faq"],
  "regex-tester": ["definition", "steps", "example", "facts", "mistakes", "faq"],
  "percentage-calculator": ["definition", "example", "steps", "useCases", "mistakes", "faq"],
  "aspect-ratio-calculator": ["definition", "steps", "useCases", "mistakes", "faq"],
  "utm-builder": ["definition", "facts", "steps", "example", "mistakes", "faq"],
  "hash-generator": ["definition", "facts", "example", "mistakes", "faq"],
  "image-resizer": ["definition", "facts", "steps", "mistakes", "faq"],
  "remove-duplicate-lines": ["definition", "steps", "example", "mistakes", "faq"],
  "sort-text-lines": ["definition", "example", "steps", "mistakes", "faq"],
  "find-and-replace-text": ["definition", "steps", "example", "facts", "mistakes", "faq"],
  "character-frequency-counter": ["definition", "facts", "steps", "mistakes", "faq"],
  "readability-score-checker": ["definition", "steps", "useCases", "mistakes", "faq"],
  "html-formatter": ["definition", "example", "steps", "facts", "mistakes", "faq"],
  "css-formatter": ["definition", "steps", "facts", "mistakes", "faq"],
  "css-minifier": ["definition", "facts", "steps", "mistakes", "faq"],
  "js-minifier": ["definition", "steps", "facts", "mistakes", "faq"],
  "sql-formatter": ["definition", "example", "steps", "mistakes", "faq"],
  "cron-expression-generator": ["definition", "facts", "steps", "example", "mistakes", "faq"],
  "hmac-generator": ["definition", "steps", "facts", "mistakes", "faq"],
  "random-string-generator": ["definition", "facts", "steps", "mistakes", "faq"],
  "meta-tag-generator": ["definition", "example", "steps", "facts", "mistakes", "faq"],
  "keyword-density-checker": ["definition", "steps", "useCases", "mistakes", "faq"],
  "open-graph-generator": ["definition", "example", "facts", "mistakes", "faq"],
  "compound-interest-calculator": ["definition", "steps", "example", "useCases", "mistakes", "faq"],
  "loan-emi-calculator": ["definition", "example", "steps", "facts", "mistakes", "faq"],
  "bmi-calculator": ["definition", "steps", "facts", "mistakes", "faq"],
  "pomodoro-timer": ["definition", "useCases", "steps", "mistakes", "faq"],
};

function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function pairs(value: string): TextPair[] {
  return lines(value).map((line) => {
    const split = line.indexOf("::");
    if (split < 0) return { title: line, body: "" };
    return { title: line.slice(0, split).trim(), body: line.slice(split + 2).trim() };
  });
}

function qa(value: string): FaqItem[] {
  return pairs(value).map((item) => ({ question: item.title, answer: item.body }));
}

function buildSections(
  slug: string,
  content: Omit<ToolPageContent, "sections">,
): ContentSection[] {
  const plan = SECTION_PLANS[slug] ?? DEFAULT_PLAN;

  const builders: Record<ContentSectionKind, () => ContentSection | null> = {
    definition: () => ({
      kind: "definition",
      id: "what-is",
      title: content.whatIsTitle,
      answer: content.whatIsParagraphs[0] ?? content.directAnswer,
      paragraphs: content.whatIsParagraphs.slice(1),
    }),
    steps: () => ({
      kind: "steps",
      id: "how-to",
      title: content.howToTitle,
      items: content.howToSteps,
    }),
    example: () => ({
      kind: "example",
      id: "example",
      title: content.exampleTitle,
      label: content.exampleLabel,
      input: content.exampleInput,
      output: content.exampleOutput,
      note: content.exampleNote,
    }),
    facts: () => ({
      kind: "facts",
      id: "features",
      title: content.featuresTitle,
      items: content.features,
    }),
    useCases: () => ({
      kind: "points",
      id: "use-cases",
      title: content.useCasesTitle,
      items: content.useCases,
    }),
    mistakes: () => ({
      kind: "points",
      id: "mistakes",
      title: content.mistakesTitle,
      items: content.mistakes,
      tone: "warning",
      limitsTitle: content.limitsTitle,
      limits: content.limits,
    }),
    faq: () => ({
      kind: "faq",
      id: "faq",
      title: content.faqTitle,
      items: content.faqs,
    }),
  };

  return plan
    .map((kind) => builders[kind]())
    .filter((section): section is ContentSection => section !== null);
}

export function getToolPageContent(t: Translate, slug: string): ToolPageContent | null {
  if (!WITH_FULL_CONTENT.has(slug)) return null;
  const k = (key: string) => `${slug}.page.${key}`;
  const plan = SECTION_PLANS[slug] ?? DEFAULT_PLAN;
  // Request only the modules this tool renders. A tool without an example or
  // use-case module has no such message keys, and asking next-intl for them
  // would log MISSING_MESSAGE during every static build.
  const needs = (kind: ContentSectionKind) => plan.includes(kind);
  const moduleText = (kind: ContentSectionKind, key: string) =>
    needs(kind) ? t(k(key)) : "";

  // Example code contains literal JSON braces, which ICU treats as malformed
  // arguments. Read those messages raw so the sample renders as written.
  const rawText = (key: string) => {
    const raw = t.raw?.(key);
    return typeof raw === "string" ? raw : t(key);
  };

  // Only tools with an explicit searchIntents key should request it. Other
  // tools derive long-tail topics from their own FAQ questions; asking next-intl
  // for a missing key logs noisy MISSING_MESSAGE errors during static builds.
  let intentText = "";
  if (WITH_SEARCH_INTENTS.has(slug)) {
    try {
      intentText = t(k("searchIntents"));
    } catch {
      // Fall back to FAQ questions below.
    }
  }

  const base: Omit<ToolPageContent, "sections"> = {
    byline: t(k("byline")),
    directAnswer: t(k("directAnswer")),
    aboutTitle: t(k("aboutTitle")),
    // Keep a stable token instead of ICU braces: the string is split around
    // the link later, and formatting `{tool}` without a value throws.
    contextualLink: t(k("contextualLink"), { tool: "%%TOOL%%" }),
    searchIntents: lines(intentText),
    whatIsTitle: t(k("whatIsTitle")),
    whatIsParagraphs: t(k("whatIs")).split(/\n\s*\n/u).map((p) => p.trim()).filter(Boolean),
    howToTitle: moduleText("steps", "howToTitle"),
    howToSteps: lines(moduleText("steps", "howTo")),
    exampleTitle: moduleText("example", "exampleTitle"),
    exampleLabel: moduleText("example", "exampleLabel"),
    exampleInput: needs("example") ? rawText(k("exampleInput")) : "",
    exampleOutput: needs("example") ? rawText(k("exampleOutput")) : "",
    exampleNote: moduleText("example", "exampleNote"),
    featuresTitle: moduleText("facts", "featuresTitle"),
    features: pairs(moduleText("facts", "features")),
    useCasesTitle: moduleText("useCases", "useCasesTitle"),
    useCases: pairs(moduleText("useCases", "useCases")),
    mistakesTitle: t(k("mistakesTitle")),
    mistakes: pairs(t(k("mistakes"))),
    limitsTitle: t(k("limitsTitle")),
    limits: lines(t(k("limits"))),
    faqTitle: t(k("faqTitle")),
    faqs: qa(t(k("faqs"))),
    trustTitle: t(k("trustTitle")),
    trustBody: t(k("trustBody")),
  };

  const searchIntents = base.searchIntents.length > 0
    ? base.searchIntents
    : base.faqs.slice(0, 4).map((faq) => faq.question);

  return { ...base, searchIntents, sections: buildSections(slug, base) };
}
