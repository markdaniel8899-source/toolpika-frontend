import type { Tool } from "@/lib/tools/registry";

/**
 * Per-tool SEO copy, generated from the registry entry - never one identical
 * blob pasted on every page. The tool name and category appear naturally a few
 * times; the rest is plain, human language about what the tool actually does.
 */
export interface ToolSeoContent {
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
}

/** Lowercase the first character so a description reads mid-sentence. */
function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

/**
 * Build natural SEO prose + 4 genuinely useful FAQs for a single tool.
 * `categoryLabel` is the translated, human-readable category name.
 */
export function getToolSeoContent(
  tool: Tool,
  categoryLabel: string,
): ToolSeoContent {
  const name = tool.title;
  const category = categoryLabel.toLowerCase();
  const what = lowerFirst(tool.description.replace(/\.$/, ""));

  const intro =
    `${name} is a free ${category} tool that ${what}. ` +
    `It runs entirely in your browser, so there is nothing to install, no account to create, ` +
    `and nothing to upload. Open the page, do the work, and move on. ${name} keeps your ` +
    `content on your own device. Whether you need a quick ${category} fix or a repeatable ` +
    `step in your workflow, this tool is built to get out of the way.`;

  const sections: ToolSeoContent["sections"] = [
    {
      heading: `What you can do with ${name}`,
      paragraphs: [
        `${name} handles the common ${category} jobs people run into every day. ` +
          `Paste or add your content, adjust the options you need, and read the result ` +
          `straight away. The controls are kept to the essentials so the tool stays ` +
          `quick even on a phone.`,
        `Because this is a ${category} utility, the work happens locally. Nothing is ` +
          `sent to a server and nothing is stored, which makes ${name} a practical ` +
          `choice when your content is private or you simply value a fast, quiet page.`,
      ],
    },
    {
      heading: "How this tool fits your workflow",
      paragraphs: [
        `Most people use ${name} in a browser tab alongside the rest of their work. ` +
          `There is no setup step and no learning curve: the ${category} action you ` +
          `came for is the one on screen. Copy or download the output and carry on.`,
        `If you work across devices, ${name} behaves the same everywhere because the ` +
          `whole tool runs in the browser. That makes it easy to return to the same ` +
          `${category} task on a laptop, tablet or phone without changing how you work.`,
      ],
    },
    {
      heading: "Why use a browser-based tool",
      paragraphs: [
        `A browser ${category} tool keeps the useful part, getting the job done, and ` +
          `drops the rest. ${name} does not ask for a sign-in, tracking cookies or an ` +
          `upload, so the page stays fast and your material stays yours.`,
      ],
    },
  ];

  const faqs: ToolSeoContent["faqs"] = [
    {
      question: `Is ${name} free?`,
      answer:
        `Yes. ${name} is free, with no account or limits on everyday ${category} use.`,
    },
    {
      question: `Is my content uploaded?`,
      answer: `No. ${name} runs in your browser — nothing is uploaded or stored.`,
    },
    {
      question: `Anything to install?`,
      answer: `Nothing. Any modern browser on a phone or computer runs ${name}.`,
    },
    {
      question: `Works on mobile?`,
      answer: `Yes. ${name} fits small screens, so a quick ${category} task stays one-handed.`,
    },
  ];

  return { intro, sections, faqs };
}
