"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { WorkspaceLayout } from "./workspace-layout";
import { WorkspaceSkeleton } from "@/components/ui/skeleton";

/** Each tool workspace is a code-split client island. */
const loading = () => <WorkspaceSkeleton />;
const WordCounter = dynamic(() => import("./workspaces/word-counter"), { loading });
const CaseConverter = dynamic(() => import("./workspaces/case-converter"), { loading });
const ImageCompressor = dynamic(() => import("./workspaces/image-compressor"), { loading });
const JsonFormatter = dynamic(() => import("./workspaces/json-formatter"), { loading });
const UnitConverter = dynamic(() => import("./workspaces/unit-converter"), { loading });
const PasswordGenerator = dynamic(() => import("./workspaces/password-generator"), { loading });
const UrlEncoder = dynamic(() => import("./workspaces/url-encoder"), { loading });
const Base64Encoder = dynamic(() => import("./workspaces/base64-encoder"), { loading });
const JsonToCsv = dynamic(() => import("./workspaces/json-to-csv"), { loading });
const MarkdownToHtml = dynamic(() => import("./workspaces/markdown-to-html"), { loading });
const ColorConverter = dynamic(() => import("./workspaces/color-converter"), { loading });
const NumberBaseConverter = dynamic(() => import("./workspaces/number-base-converter"), { loading });
const TimestampConverter = dynamic(() => import("./workspaces/timestamp-converter"), { loading });
const DataStorageConverter = dynamic(() => import("./workspaces/data-storage-converter"), { loading });
const SlugGenerator = dynamic(() => import("./workspaces/slug-generator"), { loading });
const YamlToJson = dynamic(() => import("./workspaces/yaml-to-json"), { loading });
const LoremIpsumGenerator = dynamic(() => import("./workspaces/lorem-ipsum-generator"), { loading });
const TextDiffChecker = dynamic(() => import("./workspaces/text-diff-checker"), { loading });
const UuidGenerator = dynamic(() => import("./workspaces/uuid-generator"), { loading });
const JwtDecoder = dynamic(() => import("./workspaces/jwt-decoder"), { loading });
const RegexTester = dynamic(() => import("./workspaces/regex-tester"), { loading });
const PercentageCalculator = dynamic(() => import("./workspaces/percentage-calculator"), { loading });
const AspectRatioCalculator = dynamic(() => import("./workspaces/aspect-ratio-calculator"), { loading });
const UtmBuilder = dynamic(() => import("./workspaces/utm-builder"), { loading });
const HashGenerator = dynamic(() => import("./workspaces/hash-generator"), { loading });
const ImageResizer = dynamic(() => import("./workspaces/image-resizer"), { loading });
const RemoveDuplicateLines = dynamic(() => import("./workspaces/remove-duplicate-lines"), { loading });
const SortTextLines = dynamic(() => import("./workspaces/sort-text-lines"), { loading });
const FindAndReplaceText = dynamic(() => import("./workspaces/find-and-replace-text"), { loading });
const CharacterFrequencyCounter = dynamic(() => import("./workspaces/character-frequency-counter"), { loading });
const ReadabilityScoreChecker = dynamic(() => import("./workspaces/readability-score-checker"), { loading });
const HtmlFormatter = dynamic(() => import("./workspaces/html-formatter"), { loading });
const CssFormatter = dynamic(() => import("./workspaces/css-formatter"), { loading });
const CssMinifier = dynamic(() => import("./workspaces/css-minifier"), { loading });
const JsMinifier = dynamic(() => import("./workspaces/js-minifier"), { loading });
const SqlFormatter = dynamic(() => import("./workspaces/sql-formatter"), { loading });

const WORKSPACES = {
  "word-counter": WordCounter,
  "case-converter": CaseConverter,
  "image-compressor": ImageCompressor,
  "json-formatter": JsonFormatter,
  "unit-converter": UnitConverter,
  "password-generator": PasswordGenerator,
  "url-encoder": UrlEncoder,
  "base64-encoder": Base64Encoder,
  "json-to-csv": JsonToCsv,
  "markdown-to-html": MarkdownToHtml,
  "color-converter": ColorConverter,
  "number-base-converter": NumberBaseConverter,
  "timestamp-converter": TimestampConverter,
  "data-storage-converter": DataStorageConverter,
  "slug-generator": SlugGenerator,
  "yaml-to-json": YamlToJson,
  "lorem-ipsum-generator": LoremIpsumGenerator,
  "text-diff-checker": TextDiffChecker,
  "uuid-generator": UuidGenerator,
  "jwt-decoder": JwtDecoder,
  "regex-tester": RegexTester,
  "percentage-calculator": PercentageCalculator,
  "aspect-ratio-calculator": AspectRatioCalculator,
  "utm-builder": UtmBuilder,
  "hash-generator": HashGenerator,
  "image-resizer": ImageResizer,
  "remove-duplicate-lines": RemoveDuplicateLines,
  "sort-text-lines": SortTextLines,
  "find-and-replace-text": FindAndReplaceText,
  "character-frequency-counter": CharacterFrequencyCounter,
  "readability-score-checker": ReadabilityScoreChecker,
  "html-formatter": HtmlFormatter,
  "css-formatter": CssFormatter,
  "css-minifier": CssMinifier,
  "js-minifier": JsMinifier,
  "sql-formatter": SqlFormatter,
} as const;

export function ToolWorkspace({ slug }: { slug: string }) {
  const t = useTranslations("tools");
  const Workspace = WORKSPACES[slug as keyof typeof WORKSPACES];

  if (!Workspace) {
    return (
      <WorkspaceLayout
        title={t("notFound")}
        onReset={() => undefined}
        input={
          <p className="flex min-h-[200px] items-center justify-center rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--bg)] p-6 text-center text-sm text-[var(--muted)]">
            {t("pasteContent")}
          </p>
        }
        output={
          <p className="flex min-h-[200px] items-center justify-center rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--bg)] p-6 text-center text-sm text-[var(--muted)]">
            {t("resultEmpty")}
          </p>
        }
      />
    );
  }

  return <Workspace />;
}
