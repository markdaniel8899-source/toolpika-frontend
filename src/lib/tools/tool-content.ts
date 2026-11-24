import type { Translate } from "@/lib/tools/translate";

/**
 * Tool-specific page content for tools that have a full, hand-written page.
 * Long blocks are stored as single translated strings and split here so the
 * translation pipeline only has to move one value per section.
 */
export interface ToolPageContent {
  byline: string;
  directAnswer: string;
  aboutTitle: string;
  contextualLink: string;
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
  features: { title: string; body: string }[];
  useCasesTitle: string;
  useCases: { title: string; body: string }[];
  mistakesTitle: string;
  mistakes: { title: string; body: string }[];
  limitsTitle: string;
  limits: string[];
  faqTitle: string;
  faqs: { question: string; answer: string }[];
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

function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function pairs(value: string): { title: string; body: string }[] {
  return lines(value).map((line) => {
    const split = line.indexOf("::");
    if (split < 0) return { title: line, body: "" };
    return { title: line.slice(0, split).trim(), body: line.slice(split + 2).trim() };
  });
}

function qa(value: string): { question: string; answer: string }[] {
  return pairs(value).map((item) => ({ question: item.title, answer: item.body }));
}

export function hasFullToolContent(slug: string): boolean {
  return WITH_FULL_CONTENT.has(slug);
}

export function getToolPageContent(t: Translate, slug: string): ToolPageContent | null {
  if (!WITH_FULL_CONTENT.has(slug)) return null;
  const k = (key: string) => `${slug}.page.${key}`;

  return {
    byline: t(k("byline")),
    directAnswer: t(k("directAnswer")),
    aboutTitle: t(k("aboutTitle")),
    // Keep a stable token instead of ICU braces: the string is split around
    // the link later, and formatting `{tool}` without a value throws.
    contextualLink: t(k("contextualLink"), { tool: "%%TOOL%%" }),
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
}
