"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownUp, ClipboardPaste, X } from "lucide-react";
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
  DEFAULT_SORT_OPTIONS,
  LineToolsError,
  sortTextLines,
  type SortDirection,
  type SortOptions,
} from "./sort-text-lines.logic";

export default function SortTextLines() {
  const tw = useTranslations("tools");
  const t = useTranslations("toolUi");
  const { options, update, reset: resetOptions } =
    usePersistedOptions<SortOptions>(
      "toolpika:sort-text-lines",
      DEFAULT_SORT_OPTIONS,
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
        result: sortTextLines(delayedText, delayedOptions),
        error: "",
      };
    } catch (caught) {
      if (caught instanceof LineToolsError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("sort-text-lines.tooLarge") };
      }
      return { result: null, error: tw("sort-text-lines.failed") };
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
      showNotice(tw("sort-text-lines.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [handleTextChange, showNotice, tw]);

  const handleClear = useCallback(() => {
    handleTextChange("");
    inputRef.current?.focus();
  }, [handleTextChange]);

  const handleSample = useCallback(() => {
    handleTextChange(tw("sort-text-lines.sampleText"));
    update(DEFAULT_SORT_OPTIONS);
  }, [handleTextChange, tw, update]);

  const handleReset = useCallback(() => {
    handleTextChange("");
    resetOptions();
    inputRef.current?.focus();
  }, [handleTextChange, resetOptions]);

  const copyShortcut = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {
      showNotice(tw("sort-text-lines.copyUnavailable"));
    });
  }, [output, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("sort-text-lines.title")}
      subtitle={tw("sort-text-lines.subtitle")}
      icon="ArrowDownUp"
      sampleLabel={tw("sort-text-lines.trySample")}
      resetLabel={tw("sort-text-lines.reset")}
      privacyLabel={tw("sort-text-lines.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="sort-input-title"
          title={tw("sort-text-lines.inputTitle")}
          hint={tw("sort-text-lines.inputHint")}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <label className="tp-tool-label" htmlFor="sort-text">
              {tw("sort-text-lines.textLabel")}
            </label>
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handlePaste()}
                aria-label={`${tw("sort-text-lines.paste")} ${tw("sort-text-lines.textLabel")}`}
              >
                <ClipboardPaste aria-hidden="true" />
                {tw("sort-text-lines.paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!text}
                aria-label={`${t("clear")} ${tw("sort-text-lines.textLabel")}`}
              >
                <X aria-hidden="true" />
                {t("clear")}
              </Button>
            </div>
          </div>

          <textarea
            id="sort-text"
            ref={inputRef}
            className="tp-tool-editor"
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            aria-describedby={evaluation.error ? "sort-error" : undefined}
            spellCheck={false}
          />

          <div className="tp-tool-group">
            <p className="tp-tool-group-title">
              {tw("sort-text-lines.optionsTitle")}
            </p>
            <SegmentedControl<SortDirection>
              label={tw("sort-text-lines.directionLabel")}
              value={options.direction}
              options={[
                {
                  value: "asc",
                  label: tw("sort-text-lines.ascending"),
                },
                {
                  value: "desc",
                  label: tw("sort-text-lines.descending"),
                },
              ]}
              onChange={(direction) => update({ direction })}
            />
            <CheckboxRow
              id="sort-natural"
              label={tw("sort-text-lines.naturalSort")}
              checked={options.natural}
              onChange={(natural) => update({ natural })}
            />
            <CheckboxRow
              id="sort-case"
              label={tw("sort-text-lines.caseSensitive")}
              checked={options.caseSensitive}
              onChange={(caseSensitive) => update({ caseSensitive })}
            />
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="sort-result-title"
          title={tw("sort-text-lines.resultTitle")}
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
                fileName="sorted-lines.txt"
                label={t("download")}
              />
            </>
          }
        >
          {evaluation.error ? (
            <p id="sort-error" className="tp-tool-error" role="alert">
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
                aria-label={tw("sort-text-lines.outputLabel")}
              />
              <dl className="tp-tool-stats tp-tool-stats--inline">
                <Stat
                  label={tw("sort-text-lines.lineCountLabel")}
                  value={evaluation.result.lineCount}
                />
              </dl>
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<ArrowDownUp aria-hidden="true" />}
              title={tw("sort-text-lines.emptyTitle")}
              hint={tw("sort-text-lines.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
