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
