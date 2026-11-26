"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Diff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  SegmentedControl,
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
  DEFAULT_DEDUPE_OPTIONS,
  LineToolsError,
  removeDuplicateLines,
  type DedupeOptions,
  type KeepMode,
} from "./remove-duplicate-lines.logic";

export default function RemoveDuplicateLines() {
  const tw = useTranslations("tools");
  const t = useTranslations("toolUi");
  const { options, update, reset: resetOptions } =
    usePersistedOptions<DedupeOptions>(
      "toolpika:remove-duplicate-lines",
      DEFAULT_DEDUPE_OPTIONS,
    );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const delayedText = useDebounced(text, 160);
  const delayedOptions = useDebounced(options, 120);

  const evaluation = useMemo(() => {
    if (!delayedText.trim()) return { result: null, error: "" };
    try {
      return {
        result: removeDuplicateLines(delayedText, delayedOptions),
        error: "",
      };
    } catch (caught) {
      if (caught instanceof LineToolsError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("remove-duplicate-lines.tooLarge") };
      }
      return { result: null, error: tw("remove-duplicate-lines.failed") };
    }
  }, [delayedText, delayedOptions, tw]);

  const output = evaluation.result?.output ?? "";

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      clearNotice();
    },
    [clearNotice],
  );

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) handleTextChange(clip);
    } catch {
      showNotice(tw("remove-duplicate-lines.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [handleTextChange, showNotice, tw]);

  const handleClear = useCallback(() => {
    handleTextChange("");
    inputRef.current?.focus();
  }, [handleTextChange]);

  const handleSample = useCallback(() => {
    handleTextChange(tw("remove-duplicate-lines.sampleText"));
    update(DEFAULT_DEDUPE_OPTIONS);
  }, [handleTextChange, tw, update]);

  const handleReset = useCallback(() => {
    handleTextChange("");
    resetOptions();
    inputRef.current?.focus();
  }, [handleTextChange, resetOptions]);

  const copyShortcut = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {
      showNotice(tw("remove-duplicate-lines.copyUnavailable"));
    });
  }, [output, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("remove-duplicate-lines.title")}
      subtitle={tw("remove-duplicate-lines.subtitle")}
      icon="Diff"
      sampleLabel={tw("remove-duplicate-lines.trySample")}
      resetLabel={tw("remove-duplicate-lines.reset")}
      privacyLabel={tw("remove-duplicate-lines.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="dedupe-input-title"
          title={tw("remove-duplicate-lines.inputTitle")}
          hint={tw("remove-duplicate-lines.inputHint")}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <label className="tp-tool-label" htmlFor="dedupe-text">
              {tw("remove-duplicate-lines.textLabel")}
            </label>
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={`${tw("remove-duplicate-lines.paste")} ${tw("remove-duplicate-lines.textLabel")}`}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={!text}
                aria-label={`${t("clear")} ${tw("remove-duplicate-lines.textLabel")}`}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </div>

          <textarea
            id="dedupe-text"
            ref={inputRef}
            className="tp-tool-editor"
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            aria-describedby={evaluation.error ? "dedupe-error" : undefined}
            spellCheck={false}
          />

          <div className="tp-tool-group">
            <p className="tp-tool-group-title">
              {tw("remove-duplicate-lines.optionsTitle")}
            </p>
            <SegmentedControl<KeepMode>
              label={tw("remove-duplicate-lines.keepLabel")}
              value={options.keep}
              options={[
                {
                  value: "first",
                  label: tw("remove-duplicate-lines.keepFirst"),
                },
                {
                  value: "last",
                  label: tw("remove-duplicate-lines.keepLast"),
                },
              ]}
              onChange={(keep) => update({ keep })}
            />
            <CheckboxRow
              id="dedupe-case"
              label={tw("remove-duplicate-lines.caseSensitive")}
              checked={options.caseSensitive}
              onChange={(caseSensitive) => update({ caseSensitive })}
            />
            <CheckboxRow
              id="dedupe-trim"
              label={tw("remove-duplicate-lines.trimWhitespace")}
              checked={options.trim}
              onChange={(trim) => update({ trim })}
            />
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="dedupe-result-title"
          title={tw("remove-duplicate-lines.resultTitle")}
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
                fileName="unique-lines.txt"
                label={t("download")}
              />
            </>
          }
        >
          {evaluation.error ? (
            <p id="dedupe-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {evaluation.result ? (
            <div className="tp-tool-result" aria-live="polite">
              <textarea
                className="tp-tool-code tp-tool-code--tall"
                value={output}
                readOnly
                spellCheck={false}
                aria-label={tw("remove-duplicate-lines.outputLabel")}
              />
              <dl className="tp-tool-stats tp-tool-stats--inline">
                <Stat
                  label={tw("remove-duplicate-lines.originalLines")}
                  value={evaluation.result.inputCount}
                />
                <Stat
                  label={tw("remove-duplicate-lines.uniqueLines")}
                  value={evaluation.result.outputCount}
                />
                <Stat
                  label={tw("remove-duplicate-lines.removedLines")}
                  value={evaluation.result.removed}
                />
              </dl>
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Diff aria-hidden="true" />}
              title={tw("remove-duplicate-lines.emptyTitle")}
              hint={tw("remove-duplicate-lines.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
