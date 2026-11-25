"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import { WorkspaceLayout } from "../workspace-layout";
import { CheckboxRow, CopyButton, OutputEmpty, ToolField } from "../workspace-ui";

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

  const conversion = useMemo(() => {
    if (!input.trim()) return null;
    return mode === "toCsv"
      ? jsonArrayToCsv(input, { delimiter, includeHeaders })
      : csvToJson(input, delimiter);
  }, [input, mode, delimiter, includeHeaders]);

  let output = "";
  if (conversion && conversion.ok) {
    output = "csv" in conversion ? conversion.csv : conversion.json;
  }
  const errorReason = conversion && !conversion.ok ? conversion.reason : null;

  const clearAll = () => {
    setInput("");
    setMode("toCsv");
    setDelimiter(",");
    setIncludeHeaders(true);
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setMode("toCsv");
    setDelimiter(",");
    setIncludeHeaders(true);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
    } catch {
      // Clipboard permission can be denied; the editor remains usable.
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const mime = mode === "toCsv" ? "text/csv" : "application/json";
    const extension = mode === "toCsv" ? "csv" : "json";
    const blob = new Blob([output], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `data.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceLayout
      title={t("json-to-csv.title")}
      icon="Code"
      onReset={clearAll}
      onSample={handleSample}
      statusRight={output ? `${output.length} ${tu("characters")}` : undefined}
      input={
        <div className="flex min-w-0 flex-col gap-4">
          <div
            role="group"
            aria-label={t("json-to-csv.title")}
            className="flex w-full gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-1 sm:w-auto"
          >
            <Button
              type="button"
              size="sm"
              variant={mode === "toCsv" ? "default" : "ghost"}
              aria-pressed={mode === "toCsv"}
              className="min-w-0 flex-1 px-3 sm:flex-none"
              onClick={() => setMode("toCsv")}
            >
              {t("json-to-csv.jsonToCsv")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "toJson" ? "default" : "secondary"}
              aria-pressed={mode === "toJson"}
              className="min-w-0 flex-1 px-3 sm:flex-none"
              onClick={() => setMode("toJson")}
            >
              {t("json-to-csv.csvToJson")}
            </Button>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handlePaste()}
              >
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {t("paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!input}
                onClick={() => setInput("")}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("clear")}
              </Button>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tu("startTyping")}
              aria-label={t("json-to-csv.title")}
              spellCheck={false}
              className="tp-field-input min-h-[220px] min-w-0 max-w-full font-mono text-[13px]"
            />
          </div>

          <div className="grid min-w-0 items-end gap-3 sm:grid-cols-2">
            <ToolField label={t("json-to-csv.delimiter")}>
              <ThemedSelect
                value={delimiter}
                onValueChange={(value) => setDelimiter(value as CsvDelimiter)}
                options={DELIMITER_OPTIONS}
                ariaLabel={t("json-to-csv.delimiter")}
              />
            </ToolField>
            {mode === "toCsv" ? (
              <div className="flex min-h-[42px] items-center">
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
            <p className="tp-workspace-hint">{t("json-to-csv.flattenNote")}</p>
          ) : null}
          <p className="tp-workspace-hint" aria-live="polite">
            {input.length} {tu("characters").toLowerCase()}
          </p>
        </div>
      }
      output={
        <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
          <div className="grid min-w-0 gap-2" aria-live="polite">
            {conversion && conversion.ok ? (
              <span className="tp-workspace-hint">
                {conversion.rows} {t("json-to-csv.rows")} · {conversion.columns}{" "}
                {t("json-to-csv.columns")}
              </span>
            ) : null}
          </div>

          {errorReason ? (
            <p role="alert" aria-live="polite" className="tp-workspace-error">
              {errorReason === "invalidJson"
                ? t("json-to-csv.invalidJson")
                : errorReason === "notTabular"
                  ? t("json-to-csv.notTabular")
                  : t("json-to-csv.invalidCsv")}
            </p>
          ) : null}

          {output ? (
            <div className="flex min-w-0 flex-col gap-3">
              <pre className="tp-output-pre min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {output}
              </pre>
              <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
                <CopyButton
                  text={output}
                  label={t("copyResult")}
                  copiedLabel={tu("copied")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  aria-label={tu("download")}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("downloadResult")}
                </Button>
              </div>
            </div>
          ) : (
            <OutputEmpty
              message={t("resultEmpty")}
              className="min-h-[200px] min-w-0 overflow-hidden break-words [overflow-wrap:anywhere]"
            />
          )}
        </div>
      }
    />
  );
}
