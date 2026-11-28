"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolEmpty,
} from "../workspace-ui";
import {
  convertCsv,
  CSV_SAMPLE,
  type CsvIssue,
} from "./csv-to-json.logic";

type DelimiterChoice = "auto" | "comma" | "tab" | "semicolon";
type ViewMode = "json" | "table";

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

const DELIMITER_CHARS: Record<Exclude<DelimiterChoice, "auto">, string> = {
  comma: ",",
  tab: "\t",
  semicolon: ";",
};

/** Pick the most common explicit separator on the first non empty line. */
function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/u).find((row) => row.trim().length > 0) ?? "";
  const counts: Record<string, number> = { ",": 0, "\t": 0, ";": 0 };
  for (const char of line) {
    if (char in counts) counts[char] += 1;
  }
  let best = ",";
  for (const [char, count] of Object.entries(counts)) {
    if (count > counts[best]) best = char;
  }
  return best;
}

export default function CsvToJson() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [input, setInput] = useState("");
  const [delimiterChoice, setDelimiterChoice] = useState<DelimiterChoice>("auto");
  const [hasHeader, setHasHeader] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("json");

  const delimiter = delimiterChoice === "auto"
    ? detectDelimiter(input)
    : DELIMITER_CHARS[delimiterChoice];

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

  const records = useMemo(() => {
    if (!result?.ok) return [];
    try {
      const parsed: unknown = JSON.parse(result.json);
      return Array.isArray(parsed) ? (parsed as Array<Record<string, string>>) : [];
    } catch {
      return [];
    }
  }, [result]);

  const activeCode = result?.ok
    ? viewMode === "json" ? result.json : result.markdown
    : "";
  const jsonCode = result?.ok ? result.json : "";

  const clearAll = () => {
    setInput("");
    inputRef.current?.focus();
  };

  const loadSample = () => {
    setInput(CSV_SAMPLE);
    setDelimiterChoice("auto");
    setHasHeader(true);
    setViewMode("json");
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

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void file.text().then((text) => {
      setInput(text);
      setDelimiterChoice("auto");
      setViewMode("json");
    });
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="FileText" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("csv-to-json.title")}</span>
            <span className="tp-tool-subtitle">{tw("csv-to-json.shortDesc")}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl<DelimiterChoice>
            label={tw("csv-to-json.delimiterLabel")}
            value={delimiterChoice}
            options={[
              { value: "auto", label: tw("csv-to-json.delimiterAuto") },
              { value: "comma", label: tw("csv-to-json.delimiterComma") },
              { value: "tab", label: tw("csv-to-json.delimiterTab") },
              { value: "semicolon", label: tw("csv-to-json.delimiterSemicolon") },
            ]}
            onChange={setDelimiterChoice}
          />
          <CheckboxRow
            id="tp-csv-header"
            label={tw("csv-to-json.headerToggle")}
            checked={hasHeader}
            onChange={setHasHeader}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/plain"
            className="hidden"
            aria-label={tw("csv-to-json.uploadCsv")}
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            {tw("csv-to-json.uploadCsv")}
          </Button>
        </div>
      </div>

      {errorText ? (
        <p className="tp-tool-notice" id="csv-to-json-error" data-tone="danger" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-csv-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-csv-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("csv-to-json.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("csv-to-json.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={loadSample}>
                {tw("csv-to-json.sampleAction")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                {t("clear")}
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
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-csv-source" className="text-sm font-medium text-[var(--text)]">
              {tw("csv-to-json.csvLabel")}
            </label>
            <textarea
              id="tp-csv-source"
              ref={inputRef}
              className="tp-tool-editor"
              rows={12}
              dir="ltr"
              value={input}
              placeholder={tw("csv-to-json.csvPlaceholder")}
              aria-invalid={Boolean(errorText)}
              aria-describedby={errorText ? "csv-to-json-error" : undefined}
              spellCheck={false}
              onChange={(event) => setInput(event.target.value)}
            />
            <p className="tp-tool-hint">{tw("csv-to-json.csvHint")}</p>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <span>{t("characters")}</span>
            <strong dir="ltr">{input.length}</strong>
            <span aria-hidden="true">•</span>
            <span>{delimiterChoice === "auto"
              ? tw("csv-to-json.detectedLabel")
              : tw("csv-to-json.delimiterLabel")}</span>
            <strong dir="ltr">{delimiter === "\t" ? "\\t" : delimiter}</strong>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="tp-csv-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-csv-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("csv-to-json.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("csv-to-json.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={activeCode} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={jsonCode}
                fileName="data.json"
                mimeType="application/json;charset=utf-8"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            {result?.ok ? (
              <>
                <strong dir="ltr">{result.rows}</strong>
                <span>{tw("csv-to-json.statRows")}</span>
                <span aria-hidden="true">•</span>
                <strong dir="ltr">{result.columns}</strong>
                <span>{tw("csv-to-json.statColumns")}</span>
              </>
            ) : null}
          </div>

          <SegmentedControl<ViewMode>
            label={tw("csv-to-json.resultTitle")}
            value={viewMode}
            options={[
              { value: "json", label: tw("csv-to-json.tabJson") },
              { value: "table", label: tw("csv-to-json.tabTable") },
            ]}
            onChange={setViewMode}
          />

          {result?.ok ? (
            <div aria-live="polite">
              {viewMode === "json" ? (
                <div className="tp-output-viewer" role="region" aria-label={tw("csv-to-json.resultTitle")}>
                  <code dir="ltr">{result.json}</code>
                </div>
              ) : (
                <div className="overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        {result.headers.map((header, index) => (
                          <th key={index} className="whitespace-nowrap border-b border-[var(--border)] px-3 py-2 font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {result.headers.map((header, columnIndex) => (
                            <td key={columnIndex} className="whitespace-nowrap border-b border-[var(--border)] px-3 py-2">
                              {String(row[header] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="FileText" />}
                title={tw("csv-to-json.emptyTitle")}
                hint={errorText
                  ? tw("csv-to-json.errorEmptyHint")
                  : tw("csv-to-json.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("csv-to-json.privacyRibbon")}
        </span>
        <span className="tp-tool-hint">{tw("csv-to-json.shortcutHint")}</span>
      </div>
    </div>
  );
}
