export interface SeoInput {
  title: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
}

export interface SeoCheckState {
  id: "title" | "description" | "headings";
  ok: boolean;
  /** Character count that the rule measures. Zero for the heading rule. */
  length: number;
}

/**
 * A transparent, rule-based SEO score.
 *
 * Each rule is worth a fixed number of points. The same function runs on the
 * client (live checklist) and on the server (stored score), so the two never
 * disagree.
 */
export function scoreSeo(input: SeoInput): number {
  const title = (input.seoTitle || input.title).trim();
  const description = input.seoDescription.trim();
  const content = input.content;

  let score = 0;

  if (title.length >= 30 && title.length <= 60) score += 30;
  else if (title.length > 0) score += 15;

  if (description.length >= 70 && description.length <= 160) score += 30;
  else if (description.length > 0) score += 15;

  if (/^#\s+\S/m.test(content)) score += 20;
  if (/^##\s+\S/m.test(content)) score += 20;

  return Math.min(100, score);
}

/**
 * Live checklist state used by the blog editor sidebar.
 *
 * It returns measurements only - the labels and sentences come from
 * messages/admin.json in the component, so no UI copy is hardcoded here.
 */
export function getSeoChecks(input: SeoInput): SeoCheckState[] {
  const title = (input.seoTitle || input.title).trim();
  const description = input.seoDescription.trim();
  const hasH1 = /^#\s+\S/m.test(input.content);
  const hasH2 = /^##\s+\S/m.test(input.content);

  return [
    {
      id: "title",
      ok: title.length >= 30 && title.length <= 60,
      length: title.length,
    },
    {
      id: "description",
      ok: description.length >= 70 && description.length <= 160,
      length: description.length,
    },
    {
      id: "headings",
      ok: hasH1 && hasH2,
      length: 0,
    },
  ];
}
