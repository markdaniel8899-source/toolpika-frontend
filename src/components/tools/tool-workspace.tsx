"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { WorkspaceLayout } from "./workspace-layout";
import { WorkspaceSkeleton } from "@/components/ui/skeleton";
import { generatedTools } from "@/lib/tools/generated/tools";

/**
 * Tool workspaces are client-only islands and each one is code-split, so a
 * visitor only downloads the tool they opened.
 */
const loading = () => <WorkspaceSkeleton />;
const WordCounter = dynamic(() => import("./workspaces/word-counter"), { loading });
const CaseConverter = dynamic(() => import("./workspaces/case-converter"), { loading });
const ImageCompressor = dynamic(() => import("./workspaces/image-compressor"), { loading });
const JsonFormatter = dynamic(() => import("./workspaces/json-formatter"), { loading });
const UnitConverter = dynamic(() => import("./workspaces/unit-converter"), { loading });
const PasswordGenerator = dynamic(() => import("./workspaces/password-generator"), { loading });
const UrlEncoder = dynamic(() => import("./workspaces/url-encoder"), { loading });
const Base64Encoder = dynamic(() => import("./workspaces/base64-encoder"), { loading });
const GeneratedTool = dynamic(
  () => import("./workspaces/generated-tool").then((module) => module.GeneratedTool),
  { loading },
);

const WORKSPACES = {
  "word-counter": WordCounter,
  "case-converter": CaseConverter,
  "image-compressor": ImageCompressor,
  "json-formatter": JsonFormatter,
  "unit-converter": UnitConverter,
  "password-generator": PasswordGenerator,
  "url-encoder": UrlEncoder,
  "base64-encoder": Base64Encoder,
} as const;

export function ToolWorkspace({ slug }: { slug: string }) {
  const t = useTranslations("tools");
  const Workspace = WORKSPACES[slug as keyof typeof WORKSPACES];
  const isGenerated = generatedTools.some((tool) => tool.slug === slug);

  if (!Workspace && isGenerated) {
    return <GeneratedTool slug={slug} />;
  }

  // A tool that exists in the registry but has no workspace yet still renders
  // a readable page instead of an empty gap.
  if (!Workspace) {
    return (
      <WorkspaceLayout
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
