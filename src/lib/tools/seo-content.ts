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
      question: `Is ${name} free to use?`,
      answer:
        `Yes. ${name} is free, with no account and no limits on everyday ${category} use. ` +
        `You can open it, use it and leave without paying or signing up for anything.`,
    },
    {
      question: `Does ${name} upload or store my content?`,
      answer:
        `No. ${name} runs in your browser, so your content never reaches a server. ` +
        `There is no upload step and nothing is saved after you close the tab.`,
    },
    {
      question: `Do I need to install anything to use ${name}?`,
      answer:
        `Nothing to install. ${name} is a web page, so any modern browser on a computer ` +
        `or phone can run this ${category} tool. Just open the page and start.`,
    },
    {
      question: `Can I use ${name} on my phone?`,
      answer:
        `Yes. ${name} is built for small screens as well as large ones, so you can do a ` +
        `quick ${category} task one-handed. The result can be copied or downloaded right ` +
        `from the page.`,
    },
  ];

  return { intro, sections, faqs };
}
