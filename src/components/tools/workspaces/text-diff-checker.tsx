"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Diff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
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
  DEFAULT_DIFF_OPTIONS,
  DiffError,
  diffText,
  formatPlainDiff,
  type DiffMode,
  type DiffOptions,
} from "./text-diff-checker.logic";

const SAMPLE_ORIGINAL = "The quick brown fox jumps.";
const SAMPLE_REVISED = "The quick red fox jumps.";

export default function TextDiffChecker() {
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions<DiffOptions>(
    "toolpika:text-diff-checker",
    DEFAULT_DIFF_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [original, setOriginal] = useState("");
  const [revised, setRevised] = useState("");
  const originalRef = useRef<HTMLTextAreaElement | null>(null);
  const revisedRef = useRef<HTMLTextAreaElement | null>(null);

  const delayedOriginal = useDebounced(original, 180);
  const delayedRevised = useDebounced(revised, 180);

  const evaluation = useMemo(() => {
    if (!delayedOriginal.trim() || !delayedRevised.trim()) {
      return { result: null, error: "" };
    }
    try {
      return {
        result: diffText(delayedOriginal, delayedRevised, options.mode),
        error: "",
      };
    } catch (caught) {
      if (caught instanceof DiffError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("text-diff-checker.tooLarge") };
      }
      return { result: null, error: tw("text-diff-checker.diffFailed") };
    }
  }, [delayedOriginal, delayedRevised, options.mode, tw]);

  const plainDiff = useMemo(
    () => (evaluation.result ? formatPlainDiff(evaluation.result.rows) : ""),
    [evaluation.result],
  );

  const pasteInto = useCallback(
    async (target: "original" | "revised") => {
      try {
        const clip = await navigator.clipboard.readText();
        if (clip) {
          if (target === "original") setOriginal(clip);
          else setRevised(clip);
        }
      } catch {
        showNotice(tw("text-diff-checker.pasteUnavailable"));
      }
      if (target === "original") originalRef.current?.focus();
      else revisedRef.current?.focus();
    },
    [showNotice, tw],
  );

  const clearField = useCallback(
    (target: "original" | "revised") => {
      clearNotice();
      if (target === "original") {
        setOriginal("");
        originalRef.current?.focus();
      } else {
        setRevised("");
        revisedRef.current?.focus();
      }
    },
    [clearNotice],
  );

  const handleSample = useCallback(() => {
    setOriginal(SAMPLE_ORIGINAL);
    setRevised(SAMPLE_REVISED);
    update({ mode: "words" });
    clearNotice();
  }, [clearNotice, update]);

  const handleReset = useCallback(() => {
    setOriginal("");
    setRevised("");
    resetOptions();
    clearNotice();
    originalRef.current?.focus();
  }, [clearNotice, resetOptions]);

  const copyShortcut = useCallback(() => {
    if (!plainDiff) return;
    navigator.clipboard.writeText(plainDiff).catch(() => {
      showNotice(tw("text-diff-checker.copyUnavailable"));
    });
  }, [plainDiff, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("text-diff-checker.title")}
      subtitle={tw("text-diff-checker.subtitle")}
      icon="Diff"
      sampleLabel={tw("text-diff-checker.trySample")}
      resetLabel={tw("text-diff-checker.reset")}
      privacyLabel={tw("text-diff-checker.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="diff-input-title"
          title={tw("text-diff-checker.inputTitle")}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            <div className="tp-tool-group">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <label className="tp-tool-label" htmlFor="diff-original">
                  {tw("text-diff-checker.originalLabel")}
                </label>
                <div className="tp-tool-inline-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void pasteInto("original")}
                    aria-label={`${tw("text-diff-checker.paste")} ${tw("text-diff-checker.originalLabel")}`}
                  >
                    <ClipboardPaste aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => clearField("original")}
                    aria-label={`${tw("text-diff-checker.clear")} ${tw("text-diff-checker.originalLabel")}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <textarea
                id="diff-original"
                ref={originalRef}
                className="tp-tool-editor"
                value={original}
                onChange={(event) => setOriginal(event.target.value)}
                placeholder={tw("text-diff-checker.originalPlaceholder")}
                aria-label={tw("text-diff-checker.originalLabel")}
                aria-describedby={evaluation.error ? "diff-error" : undefined}
                spellCheck={false}
              />
            </div>
            <div className="tp-tool-group">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <label className="tp-tool-label" htmlFor="diff-revised">
                  {tw("text-diff-checker.revisedLabel")}
                </label>
                <div className="tp-tool-inline-actions">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void pasteInto("revised")}
                    aria-label={`${tw("text-diff-checker.paste")} ${tw("text-diff-checker.revisedLabel")}`}
                  >
                    <ClipboardPaste aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => clearField("revised")}
                    aria-label={`${tw("text-diff-checker.clear")} ${tw("text-diff-checker.revisedLabel")}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <textarea
                id="diff-revised"
                ref={revisedRef}
                className="tp-tool-editor"
                value={revised}
                onChange={(event) => setRevised(event.target.value)}
                placeholder={tw("text-diff-checker.revisedPlaceholder")}
                aria-label={tw("text-diff-checker.revisedLabel")}
                aria-describedby={evaluation.error ? "diff-error" : undefined}
                spellCheck={false}
              />
            </div>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="diff-result-title"
          title={tw("text-diff-checker.resultTitle")}
          result
          actions={
            <SegmentedControl<DiffMode>
              label={tw("text-diff-checker.modeLabel")}
              value={options.mode}
              options={[
                { value: "lines", label: tw("text-diff-checker.lines") },
                { value: "words", label: tw("text-diff-checker.words") },
              ]}
              onChange={(mode) => update({ mode })}
            />
          }
        >
          {evaluation.error ? (
            <p id="diff-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {evaluation.result ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat label={tw("text-diff-checker.added")} value={evaluation.result.stats.added} />
                <Stat label={tw("text-diff-checker.removed")} value={evaluation.result.stats.removed} />
                <Stat label={tw("text-diff-checker.unchanged")} value={evaluation.result.stats.unchanged} />
                <Stat
                  label={tw("text-diff-checker.similarity")}
                  value={`${evaluation.result.stats.similarity}%`}
                />
              </dl>
              <div className="tp-tool-list">
                {evaluation.result.rows.map((row, index) => {
                  const marker = row.kind === "added" ? "+" : row.kind === "removed" ? "-" : " ";
                  const tone =
                    row.kind === "added"
                      ? "success"
                      : row.kind === "removed"
                        ? "danger"
                        : undefined;
                  const value = row.kind === "added" ? (row.right ?? "") : (row.left ?? "");
                  return (
                    <div className="tp-tool-row" key={`${index}-${row.kind}`}>
                      <span aria-hidden="true">{index + 1}</span>
                      <span className="tp-tool-highlight" data-tone={tone}>
                        {marker} {value}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <CopyButton
                  text={plainDiff}
                  label={tw("text-diff-checker.copy")}
                  copiedLabel={tw("text-diff-checker.copied")}
                />
                <DownloadButton
                  content={plainDiff}
                  fileName="text-diff.txt"
                  label={tw("text-diff-checker.download")}
                />
              </div>
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Diff aria-hidden="true" />}
              title={tw("text-diff-checker.emptyTitle")}
              hint={tw("text-diff-checker.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
