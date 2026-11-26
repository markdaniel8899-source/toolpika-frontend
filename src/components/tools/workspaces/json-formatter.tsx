"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CodeOutput, OutputEmpty } from "../workspace-ui";

const SAMPLE = '{"name":"Toolpika","tools":8,"free":true}';

export default function JsonFormatter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"format" | "minify" | null>(null);

  const handleReset = () => {
    setInput("");
    setOutput("");
    setError(null);
    setMode(null);
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setOutput("");
    setError(null);
    setMode(null);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
        setOutput("");
        setError(null);
        setMode(null);
      }
    } catch {
      // Clipboard permission can be denied; the editor remains usable.
    }
  };

  const run = (next: "format" | "minify") => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      setMode(null);
      return;
    }

    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(
        next === "format"
          ? JSON.stringify(parsed, null, 2)
          : JSON.stringify(parsed)
      );
      setError(null);
      setMode(next);
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : t("error"));
      setMode(null);
    }
  };

  return (
    <WorkspaceLayout
      title={tw("json-formatter.title")}
      icon="Code"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={output ? `${output.length} ${t("characters")}` : undefined}
      input={
        <div className="flex flex-col gap-3">
          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("paste")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!input}
              onClick={() => {
                setInput("");
                setOutput("");
                setError(null);
                setMode(null);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setError(null);
              setMode(null);
            }}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            spellCheck={false}
            className="min-h-[300px] font-mono text-[13px]"
          />
          <p className="tp-workspace-hint" aria-live="polite">
            {input.length} {t("characters").toLowerCase()}
          </p>
        </div>
      }
      output={
        <div className="flex flex-col gap-4" aria-live="polite">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "format" ? "default" : "secondary"}
              aria-pressed={mode === "format"}
              disabled={!input.trim()}
              onClick={() => run("format")}
            >
              {t("formatJson")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "minify" ? "default" : "secondary"}
              aria-pressed={mode === "minify"}
              disabled={!input.trim()}
              onClick={() => run("minify")}
            >
              {t("minifyJson")}
            </Button>
          </div>

          {error ? (
            <p role="alert" className="tp-workspace-error">
              {t("jsonInvalid", { message: error })}
            </p>
          ) : null}

          {output ? (
            <>
              <p className="tp-status-pill" data-tone="success">
                {t("jsonValid")}
              </p>
              <CodeOutput
                code={output}
                language="json"
                storageKey="tp-json-formatter-code-view"
                label={t("result")}
                fileName="formatted.json"
              />
            </>
          ) : (
            <OutputEmpty message={tw("resultEmpty")} className="min-h-[200px]" />
          )}
        </div>
      }
    />
  );
}
