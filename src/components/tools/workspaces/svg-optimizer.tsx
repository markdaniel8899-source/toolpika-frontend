"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardPaste, Code, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  Stat,
  ToolEmpty,
  ToolPane,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULT_SVG_OPTIMIZE_OPTIONS,
  optimizeSvg,
  SAMPLE_SVG,
  SvgOptimizeError,
  type SvgOptimizeOptions,
  type SvgOptimizeResult,
} from "./svg-optimizer.logic";

type Evaluation =
  | { result: SvgOptimizeResult; error: "" }
  | { result: null; error: string };

export default function SvgOptimizer() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { showNotice, clearNotice } = useToolNotice();
  const { options, update, reset: resetOptions } =
    usePersistedOptions<SvgOptimizeOptions>(
      "toolpika:svg-optimizer",
      DEFAULT_SVG_OPTIMIZE_OPTIONS,
    );

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedInput = useDebounced(input, 180);

  const evaluation = useMemo<Evaluation>(() => {
    if (!delayedInput.trim()) return { result: null, error: "" };
    try {
      return { result: optimizeSvg(delayedInput, options), error: "" };
    } catch (caught) {
      if (caught instanceof SvgOptimizeError) {
        const code = caught.code;
        if (code === "TOO_LARGE") {
          return {
            result: null,
            error: `${tw("svg-optimizer.errorTooLarge")} ${tw("svg-optimizer.fixTooLarge")}`,
          };
        }
        if (code === "NOT_SVG") {
          return {
            result: null,
            error: `${tw("svg-optimizer.errorRoot")} ${tw("svg-optimizer.fixRoot")}`,
          };
        }
        if (code === "UNBALANCED") {
          return {
            result: null,
            error: `${tw("svg-optimizer.errorUnbalanced")} ${tw("svg-optimizer.fixUnbalanced")}`,
          };
        }
      }
      return {
        result: null,
        error: `${tw("svg-optimizer.errorGeneric")} ${tw("svg-optimizer.fixGeneric")}`,
      };
    }
  }, [delayedInput, options, tw]);

  const result = evaluation.result;
  const output = result?.output ?? "";

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
        clearNotice();
      }
    } catch {
      showNotice(tw("svg-optimizer.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [clearNotice, showNotice, tw]);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_SVG);
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
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {
      showNotice(tw("svg-optimizer.copyUnavailable"));
    });
  }, [output, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  const describedBy = evaluation.error ? "tp-svg-optimizer-error" : undefined;

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Code" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("svg-optimizer.title")}</span>
            <span className="tp-tool-subtitle">{tw("svg-optimizer.subtitle")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("svg-optimizer.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("svg-optimizer.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="tp-svg-optimizer-input-title"
          title={tw("svg-optimizer.inputTitle")}
          hint={tw("svg-optimizer.inputHint")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("svg-optimizer.paste")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!input}
                onClick={() => setInput("")}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
        >
          <textarea
            id="tp-svg-optimizer-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              clearNotice();
            }}
            placeholder={t("startTyping")}
            aria-label={tw("svg-optimizer.svgLabel")}
            aria-describedby={describedBy}
            spellCheck={false}
          />
          {evaluation.error ? (
            <p
              id="tp-svg-optimizer-error"
              className="tp-tool-error"
              role="alert"
            >
              {evaluation.error}
            </p>
          ) : null}

          <div className="tp-tool-options-head">
            <h3>{t("options")}</h3>
          </div>
          <div className="tp-tool-options-grid tp-tool-options-grid--single">
            <div className="tp-tool-group tp-tool-group--flush">
              <CheckboxRow
                id="tp-svg-optimizer-comments"
                label={tw("svg-optimizer.removeComments")}
                checked={options.removeComments}
                onChange={(removeComments) => update({ removeComments })}
              />
              <CheckboxRow
                id="tp-svg-optimizer-metadata"
                label={tw("svg-optimizer.removeMetadata")}
                checked={options.removeMetadata}
                onChange={(removeMetadata) => update({ removeMetadata })}
              />
              <CheckboxRow
                id="tp-svg-optimizer-whitespace"
                label={tw("svg-optimizer.collapseWhitespace")}
                checked={options.collapseWhitespace}
                onChange={(collapseWhitespace) => update({ collapseWhitespace })}
              />
              <CheckboxRow
                id="tp-svg-optimizer-jsx"
                label={tw("svg-optimizer.jsxAttributes")}
                checked={options.jsxAttributes}
                onChange={(jsxAttributes) => update({ jsxAttributes })}
              />
              <p className="tp-tool-hint">{tw("svg-optimizer.optionsHint")}</p>
            </div>
          </div>
        </ToolPane>

        <ToolPane
          id="tp-svg-optimizer-result-title"
          title={tw("svg-optimizer.resultTitle")}
          hint={tw("svg-optimizer.resultHint")}
          result
          actions={
            <>
              <CopyButton
                text={output}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={output}
                fileName="optimized.svg"
                mimeType="image/svg+xml;charset=utf-8"
                label={t("download")}
                disabled={!output}
              />
            </>
          }
        >
          {result ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("svg-optimizer.beforeLabel")}
                  value={`${result.inputBytes} B`}
                />
                <Stat
                  label={tw("svg-optimizer.afterLabel")}
                  value={`${result.outputBytes} B`}
                />
                <Stat
                  label={tw("svg-optimizer.savedLabel")}
                  value={`${result.savedPercent}%`}
                />
                <Stat
                  label={tw("svg-optimizer.removedLabel")}
                  value={result.commentsRemoved + result.metadataRemoved}
                />
              </dl>
              <textarea
                className="tp-tool-code tp-tool-code--tall"
                value={output}
                readOnly
                dir="ltr"
                aria-label={tw("svg-optimizer.outputLabel")}
              />
              <p className="tp-tool-hint">{tw("svg-optimizer.outputHint")}</p>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Code aria-hidden="true" />}
                title={tw("svg-optimizer.emptyTitle")}
                hint={tw("svg-optimizer.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("svg-optimizer.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
