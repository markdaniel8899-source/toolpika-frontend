"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Code, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
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
  DEFAULT_MINIFY_OPTIONS,
  MinifyError,
  minifyJavaScript,
  type MinifyOptions,
} from "./js-minifier.logic";

export default function JsMinifier() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions<MinifyOptions>(
    "toolpika:js-minifier",
    DEFAULT_MINIFY_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [source, setSource] = useState("");
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedSource = useDebounced(source, 180);

  const evaluation = useMemo(() => {
    if (!delayedSource.trim()) return { result: null, error: "" };
    try {
      return { result: minifyJavaScript(delayedSource, options), error: "" };
    } catch (caught) {
      if (caught instanceof MinifyError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("js-minifier.tooLarge") };
      }
      if (caught instanceof MinifyError && caught.code === "UNTERMINATED") {
        return { result: null, error: tw("js-minifier.unterminated") };
      }
      return { result: null, error: tw("js-minifier.failed") };
    }
  }, [delayedSource, options, tw]);

  const output = evaluation.result?.code ?? "";

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setSource((previous) => (previous ? `${previous}\n${clip}` : clip));
    } catch {
      showNotice(tw("js-minifier.pasteFailed"));
    }
    sourceRef.current?.focus();
  }, [showNotice, tw]);

  const handleClear = useCallback(() => {
    setSource("");
    clearNotice();
    sourceRef.current?.focus();
  }, [clearNotice]);

  const handleSample = useCallback(() => {
    setSource(tw("js-minifier.sample"));
    update(DEFAULT_MINIFY_OPTIONS);
    clearNotice();
  }, [clearNotice, tw, update]);

  const handleReset = useCallback(() => {
    setSource("");
    resetOptions();
    clearNotice();
    sourceRef.current?.focus();
  }, [clearNotice, resetOptions]);

  const copyShortcut = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {
      showNotice(tw("js-minifier.copyFailed"));
    });
  }, [output, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("js-minifier.title")}
      subtitle={tw("js-minifier.subtitle")}
      icon="Code"
      sampleLabel={tw("js-minifier.trySample")}
      resetLabel={tw("js-minifier.reset")}
      privacyLabel={tw("js-minifier.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane id="js-minifier-input-title" title={tw("js-minifier.inputTitle")}>
          <div className="tp-tool-group tp-tool-group--flush">
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="tp-tool-inline-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void handlePaste()}
                  aria-label={tw("js-minifier.paste")}
                >
                  <ClipboardPaste aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!source}
                  onClick={handleClear}
                  aria-label={t("clear")}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>
            <textarea
              id="js-minifier-source"
              ref={sourceRef}
              className="tp-tool-editor"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={tw("js-minifier.sourcePlaceholder")}
              aria-label={t("pasteText")}
              aria-describedby={evaluation.error ? "js-minifier-error" : undefined}
              spellCheck={false}
            />
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="js-minifier-result-title"
          title={t("result")}
          result
          actions={
            <>
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={output}
                fileName="minified.min.js"
                mimeType="text/javascript;charset=utf-8"
                label={t("download")}
              />
            </>
          }
        >
          {evaluation.error ? (
            <p id="js-minifier-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {evaluation.result ? (
            <div className="tp-tool-result" aria-live="polite">
              <textarea
                className="tp-tool-code"
                value={output}
                readOnly
                spellCheck={false}
                aria-label={tw("js-minifier.codeLabel")}
              />
              <dl className="tp-tool-stats tp-tool-stats--inline">
                <Stat
                  label={tw("js-minifier.originalLabel")}
                  value={evaluation.result.stats.originalBytes}
                />
                <Stat
                  label={tw("js-minifier.minifiedLabel")}
                  value={evaluation.result.stats.minifiedBytes}
                />
                <Stat
                  label={tw("js-minifier.savedLabel")}
                  value={`${evaluation.result.stats.savedPercent}%`}
                />
              </dl>
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Code aria-hidden="true" />}
              title={tw("js-minifier.emptyTitle")}
              hint={tw("js-minifier.emptyHint")}
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
            <CheckboxRow
              id="js-minify-strip-comments"
              label={tw("js-minifier.stripComments")}
              checked={options.stripComments}
              onChange={(stripComments) => update({ stripComments })}
            />
            <CheckboxRow
              id="js-minify-preserve-semicolons"
              label={tw("js-minifier.preserveSemicolons")}
              checked={options.preserveSemicolons}
              onChange={(preserveSemicolons) => update({ preserveSemicolons })}
            />
            <CheckboxRow
              id="js-minify-collapse-booleans"
              label={tw("js-minifier.collapseBooleans")}
              checked={options.collapseBooleans}
              onChange={(collapseBooleans) => update({ collapseBooleans })}
            />
            <CheckboxRow
              id="js-minify-remove-debugger"
              label={tw("js-minifier.removeDebugger")}
              checked={options.removeDebugger}
              onChange={(removeDebugger) => update({ removeDebugger })}
            />
          </div>
        </>
      }
    />
  );
}
