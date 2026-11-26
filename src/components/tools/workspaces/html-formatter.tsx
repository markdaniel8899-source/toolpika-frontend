"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Code, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CodeOutput,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULT_HTML_FORMAT_OPTIONS,
  formatHtml,
  HtmlFormatError,
  type HtmlFormatOptions,
  type IndentSize,
} from "./html-formatter.logic";

const SAMPLE =
  "<main><h1>Hello</h1><p>Formatted HTML stays easy to read.</p><ul><li>One</li><li>Two</li></ul></main>";

export default function HtmlFormatter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { options, update, reset: resetOptions } =
    usePersistedOptions<HtmlFormatOptions>(
      "toolpika:html-formatter",
      DEFAULT_HTML_FORMAT_OPTIONS,
    );
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedInput = useDebounced(input, 180);

  const evaluation = useMemo(() => {
    if (!delayedInput.trim()) {
      return { result: null, error: "" };
    }
    try {
      return {
        result: formatHtml(delayedInput, options),
        error: "",
      };
    } catch (caught) {
      if (caught instanceof HtmlFormatError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("html-formatter.tooLarge") };
      }
      return { result: null, error: tw("html-formatter.error") };
    }
  }, [delayedInput, options, tw]);

  const result = evaluation.result;

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
        clearNotice();
      }
    } catch {
      showNotice(tw("html-formatter.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [clearNotice, showNotice, tw]);

  const clearInput = useCallback(() => {
    setInput("");
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleSample = useCallback(() => {
    setInput(SAMPLE);
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleReset = useCallback(() => {
    setInput("");
    resetOptions();
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice, resetOptions]);

  const copyShortcut = useCallback(() => {
    if (!result?.output) return;
    navigator.clipboard.writeText(result.output).catch(() => {
      showNotice(tw("html-formatter.copyUnavailable"));
    });
  }, [result, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("html-formatter.title")}
      subtitle={tw("html-formatter.subtitle")}
      icon="Code"
      sampleLabel={tw("html-formatter.trySample")}
      resetLabel={tw("html-formatter.reset")}
      privacyLabel={tw("html-formatter.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="html-formatter-input-title"
          title={tw("html-formatter.inputTitle")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("html-formatter.paste")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!input}
                onClick={clearInput}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
        >
          <textarea
            id="html-formatter-input"
            ref={inputRef}
            className="tp-tool-code"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              clearNotice();
            }}
            placeholder={t("startTyping")}
            aria-label={tw("html-formatter.htmlLabel")}
            aria-describedby={evaluation.error ? "html-formatter-error" : undefined}
            spellCheck={false}
          />
          <>
            <div className="tp-tool-options-head">
              <h3>{t("options")}</h3>
            </div>
            <div className="tp-tool-options-grid tp-tool-options-grid--single">
              <ToolField label={tw("html-formatter.indentLabel")}>
                <SegmentedControl<IndentSize>
                  label={tw("html-formatter.indentLabel")}
                  value={options.indentSize}
                  options={[
                    { value: "2", label: tw("html-formatter.indent2") },
                    { value: "4", label: tw("html-formatter.indent4") },
                  ]}
                  onChange={(indentSize) => update({ indentSize })}
                />
              </ToolField>

              <div className="tp-tool-group">
                <CheckboxRow
                  id="html-formatter-escape"
                  label={tw("html-formatter.escapeLabel")}
                  checked={options.escapeMarkup}
                  onChange={(escapeMarkup) => update({ escapeMarkup })}
                />
              </div>
            </div>
          </>
        </ToolPane>
      }
      result={
        <ToolPane
          id="html-formatter-result-title"
          title={tw("html-formatter.resultTitle")}
          result
        >
          {evaluation.error ? (
            <p id="html-formatter-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {result ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("html-formatter.tagCountLabel")}
                  value={result.tagCount}
                />
                <Stat
                  label={tw("html-formatter.lineCountLabel")}
                  value={result.lineCount}
                />
              </dl>

              {result.unclosed > 0 ? (
                <p className="tp-tool-notice" role="status">
                  {tw("html-formatter.unclosedNotice")}
                </p>
              ) : null}

              <CodeOutput
                code={result.output}
                language="html"
                storageKey="tp-html-formatter-code-view"
                label={t("result")}
                fileName="formatted.html"
                mimeType="text/html;charset=utf-8"
              />

              <p className="tp-tool-hint">{tw("html-formatter.limitsNote")}</p>
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Code aria-hidden="true" />}
              title={tw("html-formatter.emptyTitle")}
              hint={tw("html-formatter.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
