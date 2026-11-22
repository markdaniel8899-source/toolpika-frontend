"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getGeneratedRunner,
  getGeneratedToolMeta,
} from "@/lib/tools/generated/registry";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

export interface GeneratedToolMetaLike {
  slug: string;
  title?: string;
  archetype?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  runLabel?: string;
  outputLabel?: string;
  examples?: { input: string; output: string }[];
}

/**
 * Shared renderer for tools created in Tool Studio. The generated module is a
 * pure `run(input: string): string` function, so no model-written React ever
 * reaches visitors - only the operation and its metadata.
 */
export function GeneratedToolWorkspace({
  slug,
  run,
  meta,
}: {
  slug: string;
  run: (input: string) => string;
  meta?: GeneratedToolMetaLike;
}) {
  const t = useTranslations("tools");
  const tUi = useTranslations("toolUi");

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const examples = meta?.examples ?? [];
  const placeholder = meta?.inputPlaceholder || t("pasteContent");
  const runLabel = meta?.runLabel || tUi("generate");
  const outputLabel = meta?.outputLabel || t("result");

  async function handleRun(value = input) {
    setRunning(true);
    setError(null);
    try {
      // Yield once so the busy state can paint before the operation runs.
      await Promise.resolve();
      const result = run(value);
      if (typeof result !== "string") {
        throw new Error("The tool did not return text.");
      }
      setOutput(result);
    } catch (cause) {
      setOutput("");
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  }

  return (
    <WorkspaceLayout
      input={
        <div className="flex flex-col gap-3">
          <label htmlFor={`generated-input-${slug}`} className="sr-only">
            {meta?.inputLabel || t("input")}
          </label>
          <Textarea
            id={`generated-input-${slug}`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={placeholder}
            aria-label={meta?.inputLabel || t("input")}
            className="min-h-[280px]"
          />
          <Button
            type="button"
            onClick={() => void handleRun()}
            disabled={running}
            className="self-start"
          >
            <Play aria-hidden="true" />
            {running ? "…" : runLabel}
          </Button>
          {examples.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--muted)]">{t("input")}:</span>
              {examples.slice(0, 3).map((example, index) => (
                <button
                  key={`${example.input}-${index}`}
                  type="button"
                  className="tp-admin-btn tp-admin-btn-secondary"
                  onClick={() => {
                    setInput(example.input);
                    void handleRun(example.input);
                  }}
                >
                  {example.input.length > 40
                    ? `${example.input.slice(0, 40)}…`
                    : example.input}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      }
      output={
        <div className="flex flex-col gap-3">
          <p className="sr-only">{outputLabel}</p>
          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-[10px] border border-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {tUi("error")} {error}
            </p>
          ) : null}
          {output ? (
            <Textarea
              value={output}
              readOnly
              aria-label={outputLabel}
              className="min-h-[200px] bg-[var(--bg)]"
            />
          ) : (
            <OutputEmpty message={t("resultEmpty")} className="min-h-[200px]" />
          )}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={output} label={tUi("copy")} copiedLabel={tUi("copied")} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!input && !output}
              onClick={() => {
                setInput("");
                setOutput("");
                setError(null);
              }}
            >
              {tUi("clear")}
            </Button>
          </div>
        </div>
      }
    />
  );
}

/** Registry-driven wrapper used by the local (non-GitHub) apply path. */
export default function GeneratedTool({ slug }: { slug: string }) {
  const runner = getGeneratedRunner(slug);
  if (!runner) return null;
  return (
    <GeneratedToolWorkspace
      slug={slug}
      run={runner}
      meta={getGeneratedToolMeta(slug) ?? undefined}
    />
  );
}
