import type { ComponentType } from "react";
import {
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
}

const CATEGORY_ICONS: Record<ToolCategory, ComponentType> = {
  text: FileText,
  image: Image,
  file: FileText,
  code: Code,
  converter: LayoutGrid,
  security: Shield,
  calculator: LayoutGrid,
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
];

export type ToolCategoryKey = ToolCategory;

export const categories = [
  { slug: "text", label: "Text", Icon: CATEGORY_ICONS.text },
  { slug: "image", label: "Images", Icon: CATEGORY_ICONS.image },
  { slug: "code", label: "Code", Icon: CATEGORY_ICONS.code },
  { slug: "converter", label: "Converters", Icon: CATEGORY_ICONS.converter },
  { slug: "security", label: "Security", Icon: CATEGORY_ICONS.security },
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

export function getToolsByCategory(category: ToolCategory) {
  return getLiveTools().filter((tool) => tool.category === category);
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
