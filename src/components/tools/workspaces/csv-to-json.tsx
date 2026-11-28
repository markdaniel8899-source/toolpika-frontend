"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CodeOutput,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  selectClassName,
} from "../workspace-ui";
import {
  convertCsv,
  CSV_SAMPLE,
  type CsvIssue,
  type CsvOutputMode,
} from "./csv-to-json.logic";

const ERROR_KEYS: Record<CsvIssue, string> = {
  empty: "csv-to-json.errorEmpty",
  delimiter: "csv-to-json.errorDelimiter",
  quotes: "csv-to-json.errorQuotes",
  ragged: "csv-to-json.errorRagged",
  emptyHeader: "csv-to-json.errorEmptyHeader",
  duplicateHeader: "csv-to-json.errorDuplicateHeader",
};
const FIX_KEYS: Record<CsvIssue, string> = {
  empty: "csv-to-json.fixEmpty",
  delimiter: "csv-to-json.fixDelimiter",
  quotes: "csv-to-json.fixQuotes",
  ragged: "csv-to-json.fixRagged",
  emptyHeader: "csv-to-json.fixEmptyHeader",
  duplicateHeader: "csv-to-json.fixDuplicateHeader",
};

export default function CsvToJson() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
  const [outputMode, setOutputMode] = useState<CsvOutputMode>("json");

  const result = useMemo(
    () => (input.trim() ? convertCsv(input, { delimiter, hasHeader }) : null),
    [input, delimiter, hasHeader],
  );

  const reason = result && !result.ok ? result.reason : null;
  const rowSuffix = reason === "ragged" && result && !result.ok && result.row
    ? ` ${tw("csv-to-json.rowLabel")} ${result.row}.`
    : "";
  const errorText = reason
    ? `${tw(ERROR_KEYS[reason])}${rowSuffix} ${tw(FIX_KEYS[reason])}`
    : "";

  const clearAll = () => {
    setInput("");
    inputRef.current?.focus();
  };

  const loadSample = () => {
    setInput(CSV_SAMPLE);
    setDelimiter(",");
    setHasHeader(true);
    setOutputMode("json");
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
    } catch {
      // Clipboard access can be denied; the editor remains usable.
    }
    inputRef.current?.focus();
  };

  const code = result && result.ok
    ? outputMode === "json" ? result.json : result.markdown
    : "";

  return (
    <ToolShell
      title={tw("csv-to-json.title")}
      subtitle={tw("csv-to-json.shortDesc")}
      icon="FileText"
      sampleLabel={tw("csv-to-json.trySample")}
      resetLabel={tw("csv-to-json.reset")}
      privacyLabel={tw("csv-to-json.privacyRibbon")}
      onSample={clearAll}
      onReset={loadSample}
      ribbonRight={<span className="tp-tool-hint">{tw("csv-to-json.shortcutHint")}</span>}
      input={
        <ToolPane
          id="csv-to-json-input-title"
          title={tw("csv-to-json.inputTitle")}
          hint={tw("csv-to-json.inputHint")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button type="button" variant="secondary" size="sm" onClick={loadSample}>
                {tw("csv-to-json.sampleAction")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("csv-to-json.pasteAction")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!input}
                onClick={clearAll}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
          footer={<span aria-live="polite">{input.length} {t("characters")}</span>}
        >
          <ToolField
            label={tw("csv-to-json.csvLabel")}
            htmlFor="csv-to-json-source"
            hint={tw("csv-to-json.csvHint")}
          >
            <textarea
              id="csv-to-json-source"
              ref={inputRef}
              className={`${selectClassName} tp-tool-editor`}
              rows={12}
              dir="ltr"
              value={input}
              placeholder={tw("csv-to-json.csvPlaceholder")}
              aria-describedby={errorText ? "csv-to-json-error" : undefined}
              aria-invalid={Boolean(errorText)}
              onChange={(event) => setInput(event.target.value)}
              spellCheck={false}
            />
          </ToolField>
          {errorText ? (
            <p id="csv-to-json-error" className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="csv-to-json-result-title"
          title={tw("csv-to-json.resultTitle")}
          hint={tw("csv-to-json.resultHint")}
          result
        >
          <div aria-live="polite">
            {result && result.ok ? (
              <div className="tp-tool-result">
                <dl className="tp-tool-stats">
                  <Stat label={tw("csv-to-json.statRows")} value={result.rows} />
                  <Stat label={tw("csv-to-json.statColumns")} value={result.columns} />
                </dl>
                <CodeOutput
                  code={code}
                  language={outputMode === "json" ? "json" : "text"}
                  label={tw("csv-to-json.resultTitle")}
                  fileName={outputMode === "json" ? "data.json" : "data.md"}
                  mimeType={outputMode === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8"}
                  wrap={outputMode === "markdown"}
                />
              </div>
            ) : (
              <ToolEmpty
                icon={<ToolIcon name="FileText" />}
                title={tw("csv-to-json.emptyTitle")}
                hint={errorText
                  ? tw("csv-to-json.errorEmptyHint")
                  : tw("csv-to-json.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
      options={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToolField
            label={tw("csv-to-json.delimiterLabel")}
            htmlFor="csv-to-json-delimiter"
            hint={tw("csv-to-json.delimiterHint")}
          >
            <input
              id="csv-to-json-delimiter"
              className={selectClassName}
              dir="ltr"
              maxLength={2}
              value={delimiter}
              placeholder={tw("csv-to-json.delimiterPlaceholder")}
              onChange={(event) => setDelimiter(event.target.value)}
            />
          </ToolField>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--text)]">{tw("csv-to-json.formatTitle")}</span>
            <CheckboxRow
              id="csv-to-json-header"
              label={tw("csv-to-json.headerToggle")}
              checked={hasHeader}
              onChange={setHasHeader}
            />
            <SegmentedControl<CsvOutputMode>
              label={tw("csv-to-json.outputLabel")}
              value={outputMode}
              options={[
                { value: "json", label: tw("csv-to-json.outJson") },
                { value: "markdown", label: tw("csv-to-json.outMarkdown") },
              ]}
              onChange={setOutputMode}
            />
          </div>
        </div>
      }
    />
  );
}
