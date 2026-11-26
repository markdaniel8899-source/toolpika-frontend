"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Gauge, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  analyzeReadability,
  ReadabilityInputError,
  type FleschBand,
  type GradeBand,
} from "./readability-score-checker.logic";

const SAMPLE =
  "Clear writing respects the reader. Short sentences carry one idea each, and familiar words keep the meaning easy to follow. Aim for a paragraph a busy person can understand on the first read.";

type Tone = "success" | "warning" | "danger";

const BAND_TONE: Record<FleschBand, Tone> = {
  veryEasy: "success",
  easy: "success",
  standard: "success",
  fairlyDifficult: "warning",
  difficult: "danger",
  veryDifficult: "danger",
};

const GRADE_TONE: Record<GradeBand, Tone> = {
  upTo8: "success",
  grades9to12: "warning",
  grade13Plus: "danger",
};

export default function ReadabilityScoreChecker() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedText = useDebounced(text, 180);

  const labels = useMemo(
    () => ({
      band: {
        veryEasy: tw("readability-score-checker.bandVeryEasy"),
        easy: tw("readability-score-checker.bandEasy"),
        standard: tw("readability-score-checker.bandStandard"),
        fairlyDifficult: tw("readability-score-checker.bandFairlyDifficult"),
        difficult: tw("readability-score-checker.bandDifficult"),
        veryDifficult: tw("readability-score-checker.bandVeryDifficult"),
      } satisfies Record<FleschBand, string>,
      grade: {
        upTo8: tw("readability-score-checker.gradeUpTo8"),
        grades9to12: tw("readability-score-checker.grade9to12"),
        grade13Plus: tw("readability-score-checker.grade13Plus"),
      } satisfies Record<GradeBand, string>,
      explain: {
        veryEasy: tw("readability-score-checker.explainVeryEasy"),
        easy: tw("readability-score-checker.explainEasy"),
        standard: tw("readability-score-checker.explainStandard"),
        fairlyDifficult: tw("readability-score-checker.explainFairlyDifficult"),
        difficult: tw("readability-score-checker.explainDifficult"),
        veryDifficult: tw("readability-score-checker.explainVeryDifficult"),
      } satisfies Record<FleschBand, string>,
    }),
    [tw],
  );

  const evaluation = useMemo(() => {
    if (!delayedText.trim()) return { result: null, error: "" };
    try {
      return { result: analyzeReadability(delayedText), error: "" };
    } catch (caught) {
      if (
        caught instanceof ReadabilityInputError &&
        caught.code === "TOO_LARGE"
      ) {
        return { result: null, error: tw("readability-score-checker.tooLarge") };
      }
      return { result: null, error: tw("readability-score-checker.error") };
    }
  }, [delayedText, tw]);

  const result = evaluation.result;

  const report = useMemo(() => {
    if (!result) return "";
    return [
      tw("readability-score-checker.title"),
      `${tw("readability-score-checker.scoreLabel")}: ${result.flesch} (${labels.band[result.band]})`,
      `${tw("readability-score-checker.gradeLabel")}: ${result.grade} (${labels.grade[result.gradeBand]})`,
      `${tw("readability-score-checker.statWords")}: ${result.words}`,
      `${tw("readability-score-checker.statSentences")}: ${result.sentences}`,
      `${tw("readability-score-checker.statSyllables")}: ${result.syllables}`,
      `${tw("readability-score-checker.statAvgSentence")}: ${result.avgWordsPerSentence}`,
      `${tw("readability-score-checker.statAvgSyllable")}: ${result.avgSyllablesPerWord}`,
      "",
      labels.explain[result.band],
      "",
      tw("readability-score-checker.reportDisclaimer"),
    ].join("\n");
  }, [labels, result, tw]);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((previous) => (previous ? `${previous}\n${clip}` : clip));
        clearNotice();
      }
    } catch {
      showNotice(tw("readability-score-checker.pasteUnavailable"));
    }
    inputRef.current?.focus();
  }, [clearNotice, showNotice, tw]);

  const handleSample = useCallback(() => {
    setText(SAMPLE);
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleReset = useCallback(() => {
    setText("");
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const copyShortcut = useCallback(() => {
    if (!report) return;
    navigator.clipboard.writeText(report).catch(() => {
      showNotice(tw("readability-score-checker.copyUnavailable"));
    });
  }, [report, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("readability-score-checker.title")}
      subtitle={tw("readability-score-checker.subtitle")}
      icon="Gauge"
      sampleLabel={tw("readability-score-checker.trySample")}
      resetLabel={tw("readability-score-checker.reset")}
      privacyLabel={tw("readability-score-checker.privacyRibbon")}
      shortcutHint={tw("readability-score-checker.shortcutHint")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="readability-input-title"
          title={tw("readability-score-checker.inputTitle")}
        >
          <div className="tp-tool-group">
            <div className="tp-tool-pane-head">
              <label className="tp-tool-label" htmlFor="readability-input">
                {tw("readability-score-checker.textLabel")}
              </label>
              <div className="tp-tool-inline-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void handlePaste()}
                  aria-label={tw("readability-score-checker.paste")}
                >
                  <ClipboardPaste aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={!text}
                  onClick={() => {
                    setText("");
                    clearNotice();
                    inputRef.current?.focus();
                  }}
                  aria-label={t("clear")}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>
            <textarea
              id="readability-input"
              ref={inputRef}
              className="tp-tool-editor"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                clearNotice();
              }}
              placeholder={t("startTyping")}
              aria-label={tw("readability-score-checker.textLabel")}
              aria-describedby={evaluation.error ? "readability-error" : undefined}
              spellCheck
            />
            <p className="tp-tool-hint" aria-live="polite">
              {text.length} {t("characters").toLowerCase()}
            </p>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="readability-result-title"
          title={tw("readability-score-checker.resultTitle")}
          result
        >
          {evaluation.error ? (
            <p id="readability-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {result ? (
            <div className="tp-tool-result" aria-live="polite">
              <div className="tp-tool-preview">
                <span className="tp-tool-label">
                  {tw("readability-score-checker.scoreLabel")}
                </span>
                <strong style={{ fontSize: "2rem", lineHeight: 1.1 }}>
                  {result.flesch}
                </strong>
                <ToolBadge tone={BAND_TONE[result.band]}>
                  {labels.band[result.band]}
                </ToolBadge>
              </div>

              <div className="tp-tool-row">
                <span className="tp-tool-label">
                  {tw("readability-score-checker.gradeLabel")}
                </span>
                <ToolBadge tone={GRADE_TONE[result.gradeBand]}>
                  {result.grade} ({labels.grade[result.gradeBand]})
                </ToolBadge>
              </div>

              <p className="tp-tool-hint">{labels.explain[result.band]}</p>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("readability-score-checker.statWords")}
                  value={result.words}
                />
                <Stat
                  label={tw("readability-score-checker.statSentences")}
                  value={result.sentences}
                />
                <Stat
                  label={tw("readability-score-checker.statSyllables")}
                  value={result.syllables}
                />
                <Stat
                  label={tw("readability-score-checker.statAvgSentence")}
                  value={result.avgWordsPerSentence}
                />
                <Stat
                  label={tw("readability-score-checker.statAvgSyllable")}
                  value={result.avgSyllablesPerWord}
                />
              </dl>

              <p className="tp-tool-hint">
                {tw("readability-score-checker.scaleHint")}
              </p>
              {result.assumedSingleSentence ? (
                <p className="tp-tool-notice" role="status">
                  {tw("readability-score-checker.assumedSentence")}
                </p>
              ) : null}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <CopyButton
                  text={report}
                  label={t("copy")}
                  copiedLabel={t("copied")}
                />
                <DownloadButton
                  content={report}
                  fileName="readability-report.txt"
                  label={t("download")}
                />
              </div>
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Gauge aria-hidden="true" />}
              title={tw("readability-score-checker.emptyTitle")}
              hint={tw("readability-score-checker.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
