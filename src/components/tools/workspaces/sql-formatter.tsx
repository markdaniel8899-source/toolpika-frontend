"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  Stat,
  ToggleSwitch,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULT_FORMAT_OPTIONS,
  SqlFormatError,
  formatSql,
  type FormatOptions,
} from "./sql-formatter.logic";

const SAMPLE = [
  "select id,name,email from users where active=1 order by name;",
].join("\n");

type IndentChoice = "2" | "4";

export default function SqlFormatter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions<FormatOptions>(
    "toolpika:sql-formatter",
    DEFAULT_FORMAT_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const [source, setSource] = useState("");
  const sourceRef = useRef<HTMLTextAreaElement | null>(null);
  const delayedSource = useDebounced(source, 180);

  const evaluation = useMemo(() => {
    if (!delayedSource.trim()) return { result: null, error: "" };
    try {
      return { result: formatSql(delayedSource, options), error: "" };
    } catch (caught) {
      if (caught instanceof SqlFormatError && caught.code === "TOO_LARGE") {
        return { result: null, error: tw("sql-formatter.tooLarge") };
      }
      if (caught instanceof SqlFormatError && caught.code === "UNTERMINATED") {
        return { result: null, error: tw("sql-formatter.unterminated") };
      }
      return { result: null, error: tw("sql-formatter.failed") };
    }
  }, [delayedSource, options, tw]);

  const output = evaluation.result?.sql ?? "";
  const indentValue: IndentChoice = options.indent === 4 ? "4" : "2";

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setSource((previous) => (previous ? `${previous}\n${clip}` : clip));
    } catch {
      showNotice(tw("sql-formatter.pasteFailed"));
    }
    sourceRef.current?.focus();
  }, [showNotice, tw]);

  const handleClear = useCallback(() => {
    setSource("");
    clearNotice();
    sourceRef.current?.focus();
  }, [clearNotice]);

  const handleSample = useCallback(() => {
    setSource(SAMPLE);
    update({ indent: 2, uppercaseKeywords: true, singleLineClauses: false });
    clearNotice();
  }, [clearNotice, update]);

  const handleReset = useCallback(() => {
    setSource("");
    resetOptions();
    clearNotice();
    sourceRef.current?.focus();
  }, [clearNotice, resetOptions]);

  const copyShortcut = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {
      showNotice(tw("sql-formatter.copyFailed"));
    });
  }, [output, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("sql-formatter.title")}
      subtitle={tw("sql-formatter.subtitle")}
      icon="Database"
      sampleLabel={tw("sql-formatter.trySample")}
      resetLabel={tw("sql-formatter.reset")}
      privacyLabel={tw("sql-formatter.privacyRibbon")}
      shortcutHint={tw("sql-formatter.shortcutHint")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane id="sql-formatter-input-title" title={tw("sql-formatter.inputTitle")}>
          <div className="tp-tool-group tp-tool-group--flush">
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div className="tp-tool-inline-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void handlePaste()}
                  aria-label={tw("sql-formatter.paste")}
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
              id="sql-formatter-source"
              ref={sourceRef}
              className="tp-tool-editor"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={tw("sql-formatter.sqlPlaceholder")}
              aria-label={t("pasteText")}
              aria-describedby={evaluation.error ? "sql-formatter-error" : undefined}
              spellCheck={false}
            />
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="sql-formatter-result-title"
          title={t("result")}
          result
          actions={
            <>
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={output}
                fileName="formatted.sql"
                mimeType="application/sql;charset=utf-8"
                label={t("download")}
              />
            </>
          }
        >
          {evaluation.error ? (
            <p id="sql-formatter-error" className="tp-tool-error" role="alert">
              {evaluation.error}
            </p>
          ) : null}

          {evaluation.result ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("sql-formatter.statementsLabel")}
                  value={evaluation.result.stats.statements}
                />
                <Stat label={tw("sql-formatter.linesLabel")} value={evaluation.result.stats.lines} />
              </dl>
              <textarea
                className="tp-tool-code tp-tool-code--tall"
                value={output}
                readOnly
                spellCheck={false}
                aria-label={tw("sql-formatter.codeLabel")}
              />
            </div>
          ) : evaluation.error ? null : (
            <ToolEmpty
              icon={<Database aria-hidden="true" />}
              title={tw("sql-formatter.emptyTitle")}
              hint={tw("sql-formatter.emptyHint")}
            />
          )}
        </ToolPane>
      }
      options={
        <div>
          <div className="tp-tool-options-head">
            <h3>{t("options")}</h3>
          </div>
          <div className="tp-tool-options-grid">
            <div className="tp-tool-group">
              <p className="tp-tool-group-title">{tw("sql-formatter.indentLabel")}</p>
              <SegmentedControl<IndentChoice>
                label={tw("sql-formatter.indentLabel")}
                value={indentValue}
                options={[
                  { value: "2", label: tw("sql-formatter.indentTwo") },
                  { value: "4", label: tw("sql-formatter.indentFour") },
                ]}
                onChange={(value) => update({ indent: value === "4" ? 4 : 2 })}
              />
            </div>
            <div className="tp-tool-group">
              <p className="tp-tool-group-title">{tw("sql-formatter.formatTitle")}</p>
              <label className="tp-tool-check" htmlFor="sql-formatter-uppercase">
                <input
                  id="sql-formatter-uppercase"
                  type="checkbox"
                  className="tp-checkbox"
                  checked={options.uppercaseKeywords}
                  onChange={(event) => update({ uppercaseKeywords: event.target.checked })}
                />
                <span>{tw("sql-formatter.uppercaseKeywords")}</span>
              </label>
              <div className="tp-tool-check">
                <ToggleSwitch
                  id="sql-formatter-single-line-clauses"
                  label={tw("sql-formatter.singleLineClauses")}
                  checked={options.singleLineClauses}
                  onChange={() => update({ singleLineClauses: !options.singleLineClauses })}
                />
                <label htmlFor="sql-formatter-single-line-clauses">
                  {tw("sql-formatter.singleLineClauses")}
                </label>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}
