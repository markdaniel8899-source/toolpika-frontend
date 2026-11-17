"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

export default function JsonFormatter() {
  const t = useTranslations("toolUi");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (mode: "format" | "minify") => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(
        mode === "format"
          ? JSON.stringify(parsed, null, 2)
          : JSON.stringify(parsed)
      );
      setError(null);
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : t("error"));
    }
  };

  return (
    <WorkspaceLayout
      input={
        <Textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError(null);
          }}
          placeholder={t("pasteText")}
          aria-label={t("pasteText")}
          spellCheck={false}
          className="min-h-[320px] resize-y font-mono text-[13px]"
        />
      }
      output={
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!input.trim()}
              onClick={() => run("format")}
            >
              {t("formatJson")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!input.trim()}
              onClick={() => run("minify")}
            >
              {t("minifyJson")}
            </Button>
          </div>

          {error ? (
            <p role="alert" className="text-sm leading-[1.6] text-[var(--danger)]">
              {t("jsonInvalid", { message: error })}
            </p>
          ) : null}

          {output ? (
            <>
              <p className="text-xs font-medium text-[var(--success)]">
                {t("jsonValid")}
              </p>
              <pre className="max-h-[320px] overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4 text-[13px] leading-[1.6] text-[var(--text)]">
                {output}
              </pre>
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
            </>
          ) : (
            <OutputEmpty message={t("pasteText")} className="min-h-[200px]" />
          )}
        </div>
      }
    />
  );
}
