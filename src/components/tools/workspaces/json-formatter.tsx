"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Code, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CodeOutput,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
} from "../workspace-ui";

const SAMPLE = '{"name":"Toolpika","tools":8,"free":true}';

export default function JsonFormatter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"format" | "minify" | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const clearAll = () => {
    setInput("");
    setOutput("");
    setError(null);
    setMode(null);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    clearAll();
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setOutput("");
    setError(null);
    setMode(null);
    inputRef.current?.focus();
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
    inputRef.current?.focus();
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
    <ToolShell
      title={tw("json-formatter.title")}
      subtitle={tw("json-formatter.shortDesc")}
      icon="Code"
      sampleLabel={tw("trySample")}
      resetLabel={tw("reset")}
      privacyLabel={tw("privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="json-formatter-input-title"
          title={tw("input")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("paste")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!input}
                onClick={clearAll}
                aria-label={tw("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
          footer={
            <span aria-live="polite">
              {input.length} {t("characters").toLowerCase()}
            </span>
          }
        >
          <textarea
            id="json-formatter-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setError(null);
              setMode(null);
            }}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            aria-describedby={error ? "json-formatter-error" : undefined}
            spellCheck={false}
          />
        </ToolPane>
      }
      result={
        <ToolPane
          id="json-formatter-result-title"
          title={tw("result")}
          result
          actions={
            <>
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
            </>
          }
          footer={output ? <ToolBadge tone="success">{t("jsonValid")}</ToolBadge> : null}
        >
          {error ? (
            <p id="json-formatter-error" className="tp-tool-error" role="alert">
              {t("jsonInvalid", { message: error })}
            </p>
          ) : null}

          {output ? (
            <div className="tp-tool-result" aria-live="polite">
              <CodeOutput
                code={output}
                language="json"
                storageKey="tp-json-formatter-code-view"
                label={t("result")}
                fileName={mode === "minify" ? "minified.json" : "formatted.json"}
                mimeType="application/json;charset=utf-8"
                wrap={mode === "minify"}
              />
            </div>
          ) : error ? null : (
            <ToolEmpty
              icon={<Code aria-hidden="true" />}
              title={tw("resultEmpty")}
              hint={tw("pasteContent")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
