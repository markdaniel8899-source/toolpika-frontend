"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Hash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  Stat,
  ToggleSwitch,
  ToolBadge,
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
  analyzeDensity,
  DEFAULT_DENSITY_OPTIONS,
  formatDensityReport,
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
  TOP_WORDS,
  type DensityOptions,
} from "./keyword-density-checker.logic";

const ERROR_ID = "tp-density-error";

export default function KeywordDensityChecker() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<DensityOptions>(
    "toolpika:keyword-density-checker",
    DEFAULT_DENSITY_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();

  const debounced = useDebounced(
    useMemo(() => ({ text, options }), [text, options]),
    180,
  );
  const result = useMemo(
    () => analyzeDensity(debounced.text, debounced.options),
    [debounced],
  );

  const errorText = result.error
    ? `${tw("keyword-density-checker.errorTooLarge")} ${tw("keyword-density-checker.fixTooLarge")}`
    : "";
  const ready = text.length > 0 && !result.error;
  const describedBy = errorText ? ERROR_ID : undefined;

  const reportText = useMemo(
    () =>
      formatDensityReport(result, {
        title: tw("keyword-density-checker.reportTitle"),
        total: tw("keyword-density-checker.reportTotal"),
        unique: tw("keyword-density-checker.reportUnique"),
        top: tw("keyword-density-checker.reportTop", { count: TOP_WORDS }),
        word: tw("keyword-density-checker.columnWord"),
        count: tw("keyword-density-checker.columnCount"),
        share: tw("keyword-density-checker.columnShare"),
      }),
    [result, tw],
  );

  const handleCopyShortcut = useCallback(() => {
    if (!ready || !reportText) return;
    void navigator.clipboard.writeText(reportText).catch(() => {
      showNotice(tw("keyword-density-checker.clipboardUnavailable"));
    });
  }, [ready, reportText, showNotice, tw]);
  useCopyShortcut(handleCopyShortcut);

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((previous) => (previous ? `${previous}\n${clip}` : clip));
      }
    } catch {
      showNotice(tw("keyword-density-checker.clipboardUnavailable"));
    }
  };

  const handleSample = () => {
    setText(
      "Good content uses clear words. Clear words help readers, and clear words help search engines understand your content.",
    );
    update(DEFAULT_DENSITY_OPTIONS);
    clearNotice();
  };

  const handleReset = () => {
    setText("");
    resetOptions();
    clearNotice();
  };

  return (
    <ToolShell
      title={tw("keyword-density-checker.title")}
      icon="Hash"
      sampleLabel={tw("keyword-density-checker.trySample")}
      resetLabel={tw("keyword-density-checker.reset")}
      privacyLabel={tw("keyword-density-checker.privacyRibbon")}
      notice={notice}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-density-input-title"
          title={tw("keyword-density-checker.inputTitle")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={t("pasteText")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setText("")}
                disabled={!text}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
        >
          <div>
            <label className="tp-tool-label" htmlFor="tp-density-text">
              {tw("keyword-density-checker.textLabel")}
            </label>
            <textarea
              id="tp-density-text"
              className="tp-tool-editor"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("startTyping")}
              aria-describedby={describedBy}
              spellCheck={false}
            />
          </div>

          <div className="tp-tool-group">
            <p className="tp-tool-group-title">{tw("keyword-density-checker.optionsTitle")}</p>
            <ToolField
              label={tw("keyword-density-checker.minWordLengthLabel")}
              htmlFor="tp-density-min-length"
            >
              <NumberStepper
                id="tp-density-min-length"
                value={String(options.minWordLength)}
                min={MIN_WORD_LENGTH}
                max={MAX_WORD_LENGTH}
                ariaLabel={tw("keyword-density-checker.minWordLengthLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(next) => {
                  update({ minWordLength: Number(next) });
                }}
              />
            </ToolField>
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-density-ignore-case"
                label={tw("keyword-density-checker.ignoreCase")}
                checked={options.ignoreCase}
                onChange={() => update({ ignoreCase: !options.ignoreCase })}
              />
              <label htmlFor="tp-density-ignore-case" className="tp-check-label">
                {tw("keyword-density-checker.ignoreCase")}
              </label>
            </div>
            <div className="tp-check-row">
              <ToggleSwitch
                id="tp-density-stopwords"
                label={tw("keyword-density-checker.excludeStopwords")}
                checked={options.excludeStopwords}
                onChange={() => update({ excludeStopwords: !options.excludeStopwords })}
              />
              <label htmlFor="tp-density-stopwords" className="tp-check-label">
                {tw("keyword-density-checker.excludeStopwords")}
              </label>
            </div>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-density-result-title"
          title={t("result")}
          result
          actions={
            <>
              {ready ? (
                <ToolBadge tone="accent">
                  {tw("keyword-density-checker.totalWords", { count: result.total })}
                </ToolBadge>
              ) : null}
              <CopyButton
                text={ready ? reportText : ""}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={ready ? reportText : null}
                fileName="keyword-density-report.txt"
                label={t("download")}
              />
            </>
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Hash aria-hidden="true" />}
                title={
                  errorText
                    ? tw("keyword-density-checker.errorTitle")
                    : tw("keyword-density-checker.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("keyword-density-checker.errorEmptyHint")
                    : tw("keyword-density-checker.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              {result.rows.length === 0 ? (
                <ToolEmpty
                  icon={<Hash aria-hidden="true" />}
                  title={tw("keyword-density-checker.emptyTitle")}
                  hint={tw("keyword-density-checker.emptyHint")}
                />
              ) : (
                <>
                  <dl className="tp-tool-stats">
                    <Stat
                      label={tw("keyword-density-checker.uniqueWords")}
                      value={result.unique}
                    />
                  </dl>
                  <p className="tp-tool-hint">
                    {tw("keyword-density-checker.topHint", { count: TOP_WORDS })}
                  </p>
                  <div
                    className="tp-tool-list"
                    role="table"
                    aria-label={tw("keyword-density-checker.tableLabel")}
                  >
                    <div className="tp-tool-row" role="row">
                      <span role="columnheader">{tw("keyword-density-checker.columnWord")}</span>
                      <span role="columnheader">{tw("keyword-density-checker.columnCount")}</span>
                      <span role="columnheader">{tw("keyword-density-checker.columnShare")}</span>
                    </div>
                    {result.rows.map((row) => (
                      <div className="tp-tool-row" role="row" key={row.key}>
                        <span role="cell" className="tp-tool-pill">{row.word}</span>
                        <span role="cell">{row.count}</span>
                        <span role="cell">{row.percent}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
