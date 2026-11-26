"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Braces, ClipboardPaste, X } from "lucide-react";
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
  CssFormatterError,
  DEFAULT_CSS_FORMATTER_OPTIONS,
  formatCss,
  type IndentChoice,
} from "./css-formatter.logic";

const SAMPLE = `/* Card */
.card {
  border-radius: 8px;
  padding: 16px; content: "a; b";
}
@media (min-width: 600px) {
  .card { padding: 24px; }
}`;

export default function CssFormatter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions(
    "toolpika:css-formatter",
    DEFAULT_CSS_FORMATTER_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedInput = useDebounced(input, 180);

  const evaluation = useMemo(() => {
    if (!delayedInput.trim()) return { result: null, error: "" };
    try {
      return { result: formatCss(delayedInput, options), error: "" };
    } catch (caught) {
      if (caught instanceof CssFormatterError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("css-formatter.tooLarge") };
      }
      return { result: null, error: tw("css-formatter.unbalanced") };
    }
  }, [delayedInput, options, tw]);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInput(clip);
        clearNotice();
      }
    } catch {
      showNotice(tw("css-formatter.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [clearNotice, showNotice, tw]);

  const handleClear = useCallback(() => {
    setInput("");
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleSample = useCallback(() => {
    setInput(SAMPLE);
    update(DEFAULT_CSS_FORMATTER_OPTIONS);
    clearNotice();
  }, [clearNotice, update]);

  const handleReset = useCallback(() => {
    setInput("");
    resetOptions();
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice, resetOptions]);

  const copyShortcut = useCallback(() => {
    const css = evaluation.result?.css;
    if (!css) return;
    navigator.clipboard.writeText(css).catch(() => {
      showNotice(tw("css-formatter.copyUnavailable"));
    });
  }, [evaluation.result, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("css-formatter.title")}
      subtitle={tw("css-formatter.subtitle")}
      icon="Braces"
      sampleLabel={tw("css-formatter.trySample")}
      resetLabel={tw("css-formatter.reset")}
      privacyLabel={tw("css-formatter.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="css-format-input-title"
          title={tw("css-formatter.inputTitle")}
          hint={tw("css-formatter.inputHint")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("css-formatter.paste")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
        >
          <textarea
            id="css-format-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("startTyping")}
            aria-label={tw("css-formatter.cssLabel")}
            aria-describedby={evaluation.error ? "css-format-error" : undefined}
            spellCheck={false}
          />
        </ToolPane>
      }
      result={
        <ToolPane
          id="css-format-result-title"
          title={tw("css-formatter.resultTitle")}
          result
        >
          {evaluation.error ? (
            <p id="css-format-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {evaluation.result ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat label={tw("css-formatter.rules")} value={evaluation.result.stats.rules} />
                <Stat label={tw("css-formatter.properties")} value={evaluation.result.stats.properties} />
              </dl>
              <CodeOutput
                code={evaluation.result.css}
                language="css"
                storageKey="tp-css-formatter-code-view"
                label={t("result")}
                fileName="formatted.css"
                mimeType="text/css;charset=utf-8"
              />
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Braces aria-hidden="true" />}
              title={tw("css-formatter.emptyTitle")}
              hint={tw("css-formatter.emptyHint")}
            />
          )}
        </ToolPane>
      }
      options={
        <>
          <div className="tp-tool-options-head">
            <h3>{t("options")}</h3>
          </div>
          <div className="tp-tool-options-grid tp-tool-options-grid--single">
            <ToolField label={tw("css-formatter.indentLabel")}>
              <SegmentedControl<IndentChoice>
                label={tw("css-formatter.indentLabel")}
                value={options.indent}
                options={[
                  { value: "2", label: tw("css-formatter.indentTwo") },
                  { value: "4", label: tw("css-formatter.indentFour") },
                ]}
                onChange={(indent) => update({ indent })}
              />
            </ToolField>

            <div className="tp-tool-group">
              <CheckboxRow
                id="css-format-property-line"
                label={tw("css-formatter.propertyPerLine")}
                checked={options.propertyPerLine}
                onChange={(propertyPerLine) => update({ propertyPerLine })}
              />
            </div>
          </div>
        </>
      }
    />
  );
}
