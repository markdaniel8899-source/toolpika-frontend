import type { Translate } from "@/lib/tools/translate";

/**
 * Per-tool SEO copy, assembled from the translated templates in
 * messages/<locale>.json under `tools.seo.*`. All prose is localized; only the
 * tool name, category label and short description are injected as values.
 */
export interface ToolSeoContent {
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
  closing: string;
}

/** Lowercase the first character so a description reads mid-sentence. */
function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

export function getToolSeoContent(
  t: Translate,
  values: { name: string; category: string; description: string },
): ToolSeoContent {
  const { name, description } = values;
  const category = values.category.toLowerCase();
  // Strip the sentence-ending period (Latin '.' or Devanagari '।') so the
  // description reads naturally inside the translated SEO templates.
  const what = lowerFirst(description.replace(/[.।]$/u, ""));

  return {
    intro: t("seo.intro", { name, category, what }),
    closing: t("seo.closing", { name }),
    sections: [
      {
        heading: t("seo.canDoHeading", { name }),
        paragraphs: [
          t("seo.canDoP1", { name, category }),
          t("seo.canDoP2", { name, category }),
        ],
      },
      {
        heading: t("seo.workflowHeading", { name }),
        paragraphs: [
          t("seo.workflowP1", { name, category }),
          t("seo.workflowP2", { name, category }),
        ],
      },
      {
        heading: t("seo.browserHeading", { name }),
        paragraphs: [t("seo.browserP1", { name, category })],
      },
    ],
    faqs: [
      {
        question: t("seo.freeQ", { name }),
        answer: t("seo.freeA", { name, category }),
      },
      {
        question: t("seo.uploadQ", { name }),
        answer: t("seo.uploadA", { name }),
      },
      {
        question: t("seo.installQ", { name }),
        answer: t("seo.installA", { name, category }),
      },
      {
        question: t("seo.phoneQ", { name }),
        answer: t("seo.phoneA", { name, category }),
      },
    ],
  };
}
