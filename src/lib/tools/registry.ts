import type { ComponentType } from "react";
import {
  Calculator,
  FileText,
  Image,
  Code,
  LayoutGrid,
  Shield,
} from "lucide-react";

export type ToolCategory = "text" | "image" | "file" | "code" | "converter" | "calculator" | "security";

export type ToolInput = "text" | "file" | "url";

export interface Tool {
  id: string;
  slug: string;
  title: string;
  category: ToolCategory;
  description: string;
  icon: string; // lucide icon name
  inputs: ToolInput[];
  clientSide: boolean;
  status: "draft" | "live" | "hidden";
  /** Explicitly tagged so the New filter shows curated recent arrivals. */
  isNew?: boolean;
}

const CATEGORY_ICONS: Record<ToolCategory, ComponentType> = {
  text: FileText,
  image: Image,
  file: FileText,
  code: Code,
  converter: LayoutGrid,
  security: Shield,
  calculator: Calculator,
};

/**
 * Registered tools. Every tool gets a page at /[locale]/tools/[slug].
 * clientSide tools run entirely in the browser (default, privacy-first).
 *
 * The array order is the curated order used by the "Popular tools" list.
 * There is deliberately no usage count here: run counts live in Supabase
 * (public.tools.usage_count) and are never invented (AGENTS.md - no fake proof).
 */
export const tools: Tool[] = [
  {
    id: "word-counter",
    slug: "word-counter",
    title: "Word Counter",
    category: "text",
    description: "Count words, characters, sentences and paragraphs in your text.",
    icon: "FileText",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "case-converter",
    slug: "case-converter",
    title: "Case Converter",
    category: "text",
    description: "Convert text to UPPERCASE, lowercase, Title Case or camelCase.",
    icon: "Type",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "image-compressor",
    slug: "image-compressor",
    title: "Image Compressor",
    category: "image",
    description: "Compress JPEG and PNG images locally in your browser.",
    icon: "Image",
    inputs: ["file"],
    clientSide: true,
    status: "live",
  },
  {
    id: "json-formatter",
    slug: "json-formatter",
    title: "JSON Formatter",
    category: "code",
    description: "Format, validate and minify JSON in your browser.",
    icon: "Code",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "unit-converter",
    slug: "unit-converter",
    title: "Unit Converter",
    category: "converter",
    description: "Convert length, weight, temperature and more.",
    icon: "LayoutGrid",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "password-generator",
    slug: "password-generator",
    title: "Password Generator",
    category: "security",
    description: "Generate strong, random passwords locally.",
    icon: "Shield",
    inputs: [],
    clientSide: true,
    status: "live",
  },
  {
    id: "url-encoder",
    slug: "url-encoder",
    title: "URL Encoder / Decoder",
    category: "converter",
    description: "Encode or decode URLs and query strings.",
    icon: "Link",
    inputs: ["text", "url"],
    clientSide: true,
    status: "live",
  },
  {
    id: "base64-encoder",
    slug: "base64-encoder",
    title: "Base64 Encoder / Decoder",
    category: "converter",
    description: "Encode or decode Base64 strings.",
    icon: "Copy",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "json-to-csv",
    slug: "json-to-csv",
    title: "JSON to CSV Converter",
    category: "converter",
    description: "Turn JSON records into spreadsheet-ready CSV.",
    icon: "FileText",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "markdown-to-html",
    slug: "markdown-to-html",
    title: "Markdown to HTML Converter",
    category: "converter",
    description: "Convert Markdown into clean, safe HTML.",
    icon: "Code",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "color-converter",
    slug: "color-converter",
    title: "Color Converter",
    category: "converter",
    description: "Convert between HEX, RGB and HSL colors.",
    icon: "Wand2",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "number-base-converter",
    slug: "number-base-converter",
    title: "Number Base Converter",
    category: "converter",
    description: "Convert numbers between binary, octal, decimal and hex.",
    icon: "LayoutGrid",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "timestamp-converter",
    slug: "timestamp-converter",
    title: "Timestamp Converter",
    category: "converter",
    description: "Convert Unix timestamps to dates and back.",
    icon: "Activity",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "data-storage-converter",
    slug: "data-storage-converter",
    title: "Data Storage Converter",
    category: "converter",
    description: "Convert between SI and binary storage units.",
    icon: "LayoutGrid",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "slug-generator",
    slug: "slug-generator",
    title: "Text to Slug Generator",
    category: "converter",
    description: "Turn headings into clean, URL-safe slugs.",
    icon: "Link",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "yaml-to-json",
    slug: "yaml-to-json",
    title: "YAML to JSON Converter",
    category: "converter",
    description: "Convert YAML configuration into formatted JSON.",
    icon: "FileText",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "lorem-ipsum-generator",
    slug: "lorem-ipsum-generator",
    title: "Lorem Ipsum Generator",
    category: "text",
    description: "Generate placeholder paragraphs, sentences or words.",
    icon: "Braces",
    inputs: [],
    clientSide: true,
    status: "live",
  },
  {
    id: "text-diff-checker",
    slug: "text-diff-checker",
    title: "Text Diff Checker",
    category: "text",
    description: "Compare two texts line by line or word by word.",
    icon: "Diff",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "uuid-generator",
    slug: "uuid-generator",
    title: "UUID Generator",
    category: "code",
    description: "Generate RFC 4122 version 4 UUIDs in bulk.",
    icon: "Hash",
    inputs: [],
    clientSide: true,
    status: "live",
  },
  {
    id: "jwt-decoder",
    slug: "jwt-decoder",
    title: "JWT Decoder",
    category: "security",
    description: "Inspect JWT headers, payloads and claims locally.",
    icon: "KeyRound",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "regex-tester",
    slug: "regex-tester",
    title: "Regex Tester",
    category: "code",
    description: "Test regular expressions with flags and live matches.",
    icon: "Regex",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "percentage-calculator",
    slug: "percentage-calculator",
    title: "Percentage Calculator",
    category: "calculator",
    description: "Solve common percentage problems in one click.",
    icon: "Percent",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "aspect-ratio-calculator",
    slug: "aspect-ratio-calculator",
    title: "Aspect Ratio Calculator",
    category: "calculator",
    description: "Scale dimensions while keeping the same ratio.",
    icon: "Ruler",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "utm-builder",
    slug: "utm-builder",
    title: "UTM Builder",
    category: "converter",
    description: "Build tracked campaign URLs from a base URL.",
    icon: "Link2",
    inputs: ["url"],
    clientSide: true,
    status: "live",
  },
  {
    id: "hash-generator",
    slug: "hash-generator",
    title: "Hash Generator",
    category: "security",
    description: "Compute SHA-1, SHA-256 and SHA-512 hashes locally.",
    icon: "Fingerprint",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "image-resizer",
    slug: "image-resizer",
    title: "Image Resizer",
    category: "image",
    description: "Resize JPEG, PNG and WebP images in your browser.",
    icon: "Maximize2",
    inputs: ["file"],
    clientSide: true,
    status: "live",
  },
  {
    id: "remove-duplicate-lines",
    slug: "remove-duplicate-lines",
    title: "Remove Duplicate Lines",
    category: "text",
    description: "Remove repeated lines from a list, with case and order options.",
    icon: "Diff",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "sort-text-lines",
    slug: "sort-text-lines",
    title: "Sort Text Lines",
    category: "text",
    description: "Sort lines alphabetically or numerically, ascending or descending.",
    icon: "ArrowDownUp",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "find-and-replace-text",
    slug: "find-and-replace-text",
    title: "Find and Replace Text",
    category: "text",
    description: "Find and replace text with case, whole-word and regex modes.",
    icon: "Regex",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "character-frequency-counter",
    slug: "character-frequency-counter",
    title: "Character Frequency Counter",
    category: "text",
    description: "Count how often each character appears, with live percentages.",
    icon: "Hash",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "readability-score-checker",
    slug: "readability-score-checker",
    title: "Readability Score Checker",
    category: "text",
    description: "Check Flesch reading ease and grade level for your writing.",
    icon: "Gauge",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "html-formatter",
    slug: "html-formatter",
    title: "HTML Formatter",
    category: "code",
    description: "Pretty-print HTML with safe, escaped output.",
    icon: "Code",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "css-formatter",
    slug: "css-formatter",
    title: "CSS Formatter",
    category: "code",
    description: "Format CSS rules and properties with a clear indent.",
    icon: "Braces",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "css-minifier",
    slug: "css-minifier",
    title: "CSS Minifier",
    category: "code",
    description: "Minify CSS by stripping comments and extra whitespace.",
    icon: "Braces",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "js-minifier",
    slug: "js-minifier",
    title: "JS Minifier",
    category: "code",
    description: "Minify JavaScript safely without executing the input.",
    icon: "Code",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "sql-formatter",
    slug: "sql-formatter",
    title: "SQL Formatter",
    category: "code",
    description: "Format SQL statements with clauses and indentation.",
    icon: "Database",
    inputs: ["text"],
    clientSide: true,
    status: "live",
  },
  {
    id: "cron-expression-generator",
    slug: "cron-expression-generator",
    title: "Cron Expression Generator",
    category: "code",
    description: "Build and validate five-field cron expressions locally.",
    icon: "Clock",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "hmac-generator",
    slug: "hmac-generator",
    title: "HMAC Generator",
    category: "security",
    description: "Compute HMAC signatures with SHA-1, SHA-256 or SHA-512.",
    icon: "Fingerprint",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "random-string-generator",
    slug: "random-string-generator",
    title: "Random String Generator",
    category: "security",
    description: "Generate random strings from chosen character sets.",
    icon: "Shuffle",
    inputs: [],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "meta-tag-generator",
    slug: "meta-tag-generator",
    title: "Meta Tag Generator",
    category: "code",
    description: "Build escaped meta tags for a page in one pass.",
    icon: "Code",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "keyword-density-checker",
    slug: "keyword-density-checker",
    title: "Keyword Density Checker",
    category: "text",
    description: "Measure word counts and shares in a block of text.",
    icon: "Hash",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "open-graph-generator",
    slug: "open-graph-generator",
    title: "Open Graph Generator",
    category: "code",
    description: "Create Open Graph and Twitter card tags locally.",
    icon: "Globe",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "compound-interest-calculator",
    slug: "compound-interest-calculator",
    title: "Compound Interest Calculator",
    category: "calculator",
    description: "Project compound growth with a year-by-year breakdown.",
    icon: "Calculator",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "loan-emi-calculator",
    slug: "loan-emi-calculator",
    title: "Loan EMI Calculator",
    category: "calculator",
    description: "Calculate EMIs, total interest and an amortisation preview.",
    icon: "Calculator",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "bmi-calculator",
    slug: "bmi-calculator",
    title: "BMI Calculator",
    category: "calculator",
    description: "Calculate BMI and a healthy weight range from your inputs.",
    icon: "Gauge",
    inputs: ["text"],
    clientSide: true,
    status: "live",
    isNew: true,
  },
  {
    id: "pomodoro-timer",
    slug: "pomodoro-timer",
    title: "Pomodoro Timer",
    category: "calculator",
    description: "Run focused work and break intervals with round tracking.",
    icon: "Clock",
    inputs: [],
    clientSide: true,
    status: "live",
    isNew: true,
  },
];

export type ToolCategoryKey = ToolCategory;

export const categories = [
  { slug: "text", label: "Text", Icon: CATEGORY_ICONS.text },
  { slug: "image", label: "Images", Icon: CATEGORY_ICONS.image },
  { slug: "code", label: "Code", Icon: CATEGORY_ICONS.code },
  { slug: "converter", label: "Converters", Icon: CATEGORY_ICONS.converter },
  { slug: "security", label: "Security", Icon: CATEGORY_ICONS.security },
  { slug: "calculator", label: "Calculators", Icon: CATEGORY_ICONS.calculator },
] as const;

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

/**
 * Translation keys for the `tools` message namespace.
 * Tool names, descriptions and SEO copy live in messages/<locale>.json under
 * `tools.<slug>.*` so every locale can translate them with Groq.
 */
export function toolTitleKey(tool: Tool) {
  return `${tool.slug}.title`;
}

export function toolDescriptionKey(tool: Tool) {
  return `${tool.slug}.shortDesc`;
}

export function toolSeoTitleKey(tool: Tool) {
  return `${tool.slug}.seo.title`;
}

export function toolSeoDescriptionKey(tool: Tool) {
  return `${tool.slug}.seo.description`;
}

export function categoryKey(slug: string) {
  return `categories.${slug}`;
}

export function getLiveTools() {
  return tools.filter((tool) => tool.status === "live");
}

/** The curated set shown by the New page and the all-tools New filter. */
export function getNewTools() {
  const flagged = getLiveTools().filter((tool) => tool.isNew);
  return flagged.length > 0 ? flagged : getLiveTools().slice(-4).reverse();
}

export function getToolsByCategory(category: ToolCategory) {
  return getLiveTools().filter((tool) => tool.category === category);
}

/**
 * A thin category (fewer than three live tools) stays reachable from the
 * browser but is kept out of the sitemap and marked noindex, following the
 * site's category rules.
 */
export function isCategoryIndexable(category: string) {
  return getToolsByCategory(category as ToolCategory).length >= 3;
}

/**
 * The curated order of the live tools, used by the "Popular tools" list.
 *
 * No usage sorting happens here: run counts live in Supabase and are never
 * invented for the public site.
 */
export function getPopularTools(limit = 8) {
  return getLiveTools().slice(0, limit);
}
