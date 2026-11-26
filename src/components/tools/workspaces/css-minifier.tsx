"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Braces, ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CodeOutput,
  Stat,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  CssMinifierError,
  DEFAULT_CSS_MINIFIER_OPTIONS,
  minifyCss,
} from "./css-minifier.logic";

export default function CssMinifier() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions(
    "toolpika:css-minifier",
    DEFAULT_CSS_MINIFIER_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedInput = useDebounced(input, 180);

  const evaluation = useMemo(() => {
    if (!delayedInput.trim()) return { result: null, error: "" };
    try {
      return { result: minifyCss(delayedInput, options), error: "" };
    } catch (caught) {
      if (caught instanceof CssMinifierError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("css-minifier.tooLarge") };
      }
      return { result: null, error: tw("css-minifier.minifyFailed") };
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
      showNotice(tw("css-minifier.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [clearNotice, showNotice, tw]);

  const handleClear = useCallback(() => {
    setInput("");
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleSample = useCallback(() => {
    setInput(tw("css-minifier.sample"));
    update(DEFAULT_CSS_MINIFIER_OPTIONS);
    clearNotice();
  }, [clearNotice, tw, update]);

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
      showNotice(tw("css-minifier.copyUnavailable"));
    });
  }, [evaluation.result, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("css-minifier.title")}
      subtitle={tw("css-minifier.subtitle")}
      icon="Braces"
      sampleLabel={tw("css-minifier.trySample")}
      resetLabel={tw("css-minifier.reset")}
      privacyLabel={tw("css-minifier.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="css-minify-input-title"
          title={tw("css-minifier.inputTitle")}
          hint={tw("css-minifier.inputHint")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("css-minifier.paste")}
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
            id="css-minify-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("startTyping")}
            aria-label={tw("css-minifier.cssLabel")}
            aria-describedby={evaluation.error ? "css-minify-error" : undefined}
            spellCheck={false}
          />
          <>
            <div className="tp-tool-options-head">
              <h3>{t("options")}</h3>
            </div>
            <div className="tp-tool-options-grid tp-tool-options-grid--two">
              <div className="tp-tool-group">
                <CheckboxRow
                  id="css-minify-strip-comments"
                  label={tw("css-minifier.stripComments")}
                  checked={options.stripComments}
                  onChange={(stripComments) => update({ stripComments })}
                />
              </div>
              <div className="tp-tool-group">
                <CheckboxRow
                  id="css-minify-compact-colors"
                  label={tw("css-minifier.compactColors")}
                  checked={options.compactColors}
                  onChange={(compactColors) => update({ compactColors })}
                />
              </div>
              <div className="tp-tool-group">
                <CheckboxRow
                  id="css-minify-remove-last-semicolon"
                  label={tw("css-minifier.removeLastSemicolon")}
                  checked={options.removeLastSemicolon}
                  onChange={(removeLastSemicolon) => update({ removeLastSemicolon })}
                />
              </div>
              <div className="tp-tool-group">
                <CheckboxRow
                  id="css-minify-lowercase-hex"
                  label={tw("css-minifier.lowercaseHex")}
                  checked={options.lowercaseHex}
                  onChange={(lowercaseHex) => update({ lowercaseHex })}
                />
              </div>
            </div>
          </>
        </ToolPane>
      }
      result={
        <ToolPane
          id="css-minify-result-title"
          title={tw("css-minifier.resultTitle")}
          result
        >
          {evaluation.error ? (
            <p id="css-minify-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {evaluation.result ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats tp-tool-stats--inline">
                <Stat label={tw("css-minifier.originalSize")} value={evaluation.result.stats.originalSize} />
                <Stat label={tw("css-minifier.minifiedSize")} value={evaluation.result.stats.minifiedSize} />
                <Stat
                  label={tw("css-minifier.saved")}
                  value={`${evaluation.result.stats.savedPercent}%`}
                />
              </dl>
              <CodeOutput
                code={evaluation.result.css}
                language="css"
                storageKey="tp-css-minifier-code-view"
                label={t("result")}
                fileName="style.min.css"
                mimeType="text/css;charset=utf-8"
                wrap
              />
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Braces aria-hidden="true" />}
              title={tw("css-minifier.emptyTitle")}
              hint={tw("css-minifier.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
