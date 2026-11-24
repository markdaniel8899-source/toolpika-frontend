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
  "password-generator": ["definition", "steps", "facts", "faq"],
  "unit-converter": ["definition", "steps", "example", "useCases", "faq"],
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

  let intentText = "";
  try {
    intentText = t(k("searchIntents"));
  } catch {
    // Older locale files may not carry this key yet.
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
    howToTitle: t(k("howToTitle")),
    howToSteps: lines(t(k("howTo"))),
    exampleTitle: t(k("exampleTitle")),
    exampleLabel: t(k("exampleLabel")),
    exampleInput: t(k("exampleInput")),
    exampleOutput: t(k("exampleOutput")),
    exampleNote: t(k("exampleNote")),
    featuresTitle: t(k("featuresTitle")),
    features: pairs(t(k("features"))),
    useCasesTitle: t(k("useCasesTitle")),
    useCases: pairs(t(k("useCases"))),
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
