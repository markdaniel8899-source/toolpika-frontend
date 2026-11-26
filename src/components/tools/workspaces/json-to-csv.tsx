"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Code, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CheckboxRow,
  CodeOutput,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolPane,
  ToolShell,
} from "../workspace-ui";

const SAMPLE = `[
  { "name": "Toolpika", "category": "code", "meta": { "rank": 1 } },
  { "name": "Word Counter", "category": "text", "meta": { "rank": 2 } }
]`;

export type CsvDelimiter = "," | ";" | "\t";

export interface JsonToCsvOptions {
  delimiter: CsvDelimiter;
  includeHeaders: boolean;
}

export type JsonToCsvResult =
  | { ok: true; csv: string; rows: number; columns: number }
  | { ok: false; reason: "invalidJson" | "notTabular" };

export type CsvToJsonResult =
  | { ok: true; json: string; rows: number; columns: number }
  | { ok: false; reason: "invalidCsv" };

type FlatObject = Record<string, unknown>;

function isObject(value: unknown): value is FlatObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Turn nested objects into dot paths; arrays stay JSON-encoded scalar cells. */
export function flattenRow(value: FlatObject, prefix = ""): FlatObject {
  const flat: FlatObject = {};
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isObject(child)) {
      Object.assign(flat, flattenRow(child, path));
    } else {
      flat[path] = child;
    }
  }
  return flat;
}

/** RFC 4180 field escaping: quote delimiters, quotes and embedded newlines. */
export function csvCell(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return "";
  const raw =
    typeof value === "string"
      ? value
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  const needsQuotes =
    raw.includes(delimiter) || raw.includes('"') || /[\r\n]/u.test(raw);
  return needsQuotes ? `"${raw.replace(/"/gu, '""')}"` : raw;
}

/** Pure JSON (array or object of objects) to CSV conversion. */
export function jsonArrayToCsv(
  source: string,
  options: JsonToCsvOptions,
): JsonToCsvResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, reason: "invalidJson" };
  }

  let records: FlatObject[];
  if (Array.isArray(parsed)) {
    if (parsed.length === 0 || !parsed.every(isObject)) {
      return { ok: false, reason: "notTabular" };
    }
    records = parsed;
  } else if (isObject(parsed)) {
    const values = Object.values(parsed);
    if (values.length === 0 || !values.every(isObject)) {
      return { ok: false, reason: "notTabular" };
    }
    records = values;
  } else {
    return { ok: false, reason: "notTabular" };
  }

  const flattened = records.map((record) => flattenRow(record));
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const record of flattened) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  if (columns.length === 0) return { ok: false, reason: "notTabular" };

  const lines: string[] = [];
  if (options.includeHeaders) {
    lines.push(
      columns.map((key) => csvCell(key, options.delimiter)).join(options.delimiter),
    );
  }
  for (const record of flattened) {
    lines.push(
      columns
        .map((key) => csvCell(record[key], options.delimiter))
        .join(options.delimiter),
    );
  }

  return {
    ok: true,
    csv: lines.join("\n"),
    rows: flattened.length,
    columns: columns.length,
  };
}

/** Parse one RFC 4180 record set. Returns null for malformed input. */
function parseCsv(source: string, delimiter: string): string[][] | null {
  const text = source.replace(/^\uFEFF/u, "");
  if (!text.trim()) return null;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let index = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }
    if (char === '"') {
      if (field.length > 0) return null;
      quoted = true;
      index += 1;
      continue;
    }
    if (char === delimiter) {
      pushField();
      index += 1;
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      pushRow();
      index += 1;
      continue;
    }
    field += char;
    index += 1;
  }

  if (quoted) return null;
  if (field.length > 0 || row.length > 0) pushRow();
  return rows.length > 0 ? rows : null;
}

/** Pure CSV (first row is the header) to JSON conversion. */
export function csvToJson(source: string, delimiter: string): CsvToJsonResult {
  const rows = parseCsv(source, delimiter);
  if (!rows || rows.length < 2) return { ok: false, reason: "invalidCsv" };

  const header = rows[0];
  const data = rows.slice(1);
  if (header.some((key) => key.length === 0)) {
    return { ok: false, reason: "invalidCsv" };
  }
  if (new Set(header).size !== header.length) {
    return { ok: false, reason: "invalidCsv" };
  }
  if (data.some((cells) => cells.length !== header.length)) {
    return { ok: false, reason: "invalidCsv" };
  }

  const objects = data.map((cells) => {
    const record: FlatObject = {};
    header.forEach((key, position) => {
      record[key] = cells[position];
    });
    return record;
  });

  return {
    ok: true,
    json: JSON.stringify(objects, null, 2),
    rows: objects.length,
    columns: header.length,
  };
}

type Mode = "toCsv" | "toJson";

const DELIMITER_OPTIONS = [
  { value: ",", label: "," },
  { value: ";", label: ";" },
  { value: "\t", label: "Tab" },
] as const;

export default function JsonToCsv() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("toCsv");
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(",");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const conversion = useMemo(() => {
    if (!input.trim()) return null;
    return mode === "toCsv"
      ? jsonArrayToCsv(input, { delimiter, includeHeaders })
      : csvToJson(input, delimiter);
  }, [input, mode, delimiter, includeHeaders]);

  const errorReason = conversion && !conversion.ok ? conversion.reason : null;

  const errorMessage =
    errorReason === "invalidJson"
      ? t("json-to-csv.invalidJson")
      : errorReason === "notTabular"
        ? t("json-to-csv.notTabular")
        : t("json-to-csv.invalidCsv");

  const clearAll = () => {
    setInput("");
    setMode("toCsv");
    setDelimiter(",");
    setIncludeHeaders(true);
    inputRef.current?.focus();
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setMode("toCsv");
    setDelimiter(",");
    setIncludeHeaders(true);
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
    } catch {
      // Clipboard permission can be denied; the editor remains usable.
    }
    inputRef.current?.focus();
  };

  return (
    <ToolShell
      title={t("json-to-csv.title")}
      subtitle={t("json-to-csv.shortDesc")}
      icon="Code"
      sampleLabel={t("trySample")}
      resetLabel={t("reset")}
      privacyLabel={t("privacyRibbon")}
      onSample={handleSample}
      onReset={clearAll}
      input={
        <ToolPane
          id="json-to-csv-input-title"
          title={t("input")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={t("paste")}
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
          footer={
            <span aria-live="polite">
              {input.length} {tu("characters").toLowerCase()}
            </span>
          }
        >
          <SegmentedControl<Mode>
            label={t("json-to-csv.title")}
            value={mode}
            options={[
              { value: "toCsv", label: t("json-to-csv.jsonToCsv") },
              { value: "toJson", label: t("json-to-csv.csvToJson") },
            ]}
            onChange={setMode}
          />
          <textarea
            id="json-to-csv-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={tu("startTyping")}
            aria-label={t("json-to-csv.title")}
            spellCheck={false}
          />
          <>
            <div className="tp-tool-options-head">
              <h3>{tu("options")}</h3>
            </div>
            <div className="tp-tool-options-grid tp-tool-options-grid--single">
              <div className="tp-tool-group">
                <p className="tp-tool-group-title">{t("json-to-csv.delimiter")}</p>
                <ThemedSelect
                  value={delimiter}
                  onValueChange={(value) => setDelimiter(value as CsvDelimiter)}
                  options={DELIMITER_OPTIONS}
                  ariaLabel={t("json-to-csv.delimiter")}
                />
              </div>
              {mode === "toCsv" ? (
                <div className="tp-tool-group">
                  <CheckboxRow
                    id="j2c-include-headers"
                    label={t("json-to-csv.includeHeaders")}
                    checked={includeHeaders}
                    onChange={setIncludeHeaders}
                  />
                </div>
              ) : null}
            </div>
            {mode === "toCsv" ? (
              <p className="tp-tool-hint">{t("json-to-csv.flattenNote")}</p>
            ) : null}
          </>
        </ToolPane>
      }
      result={
        <ToolPane id="json-to-csv-result-title" title={t("result")} result>
          {errorReason ? (
            <p role="alert" aria-live="polite" className="tp-tool-error">
              {errorMessage}
            </p>
          ) : null}

          {conversion && conversion.ok ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat label={t("json-to-csv.rows")} value={conversion.rows} />
                <Stat label={t("json-to-csv.columns")} value={conversion.columns} />
              </dl>
              <CodeOutput
                code={"csv" in conversion ? conversion.csv : conversion.json}
                language={mode === "toCsv" ? "csv" : "json"}
                storageKey="tp-json-to-csv-code-view"
                label={tu("result")}
                fileName={mode === "toCsv" ? "data.csv" : "data.json"}
                mimeType={
                  mode === "toCsv"
                    ? "text/csv;charset=utf-8"
                    : "application/json;charset=utf-8"
                }
              />
            </div>
          ) : errorReason ? null : (
            <ToolEmpty
              icon={<Code aria-hidden="true" />}
              title={t("resultEmpty")}
              hint={t("pasteContent")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
