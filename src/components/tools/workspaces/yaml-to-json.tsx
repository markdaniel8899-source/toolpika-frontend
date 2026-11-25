"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty, ToolField } from "../workspace-ui";

const SAMPLE = `name: Toolpika
version: 2
available: true
tags:
  - browser
  - private
details:
  owner: team
  stats:
    tools: 8
    free: true`;

export type YamlIndent = 2 | 4;

export type YamlToJsonResult =
  | { ok: true; json: string; indent: YamlIndent }
  | { ok: false; reason: "invalidYaml" | "unsupported" };

type YamlRecord = { [key: string]: YamlValue };
type YamlValue = string | number | boolean | null | YamlValue[] | YamlRecord;

interface YamlLine {
  indent: number;
  content: string;
}

interface ParsedBlock {
  value: YamlValue;
  next: number;
}

class YamlParseError extends Error {
  constructor(readonly reason: "invalidYaml" | "unsupported") {
    super(reason);
  }
}

function fail(reason: "invalidYaml" | "unsupported"): never {
  throw new YamlParseError(reason);
}

/** Strip unquoted trailing comments while preserving text inside quotes. */
function stripComment(line: string): string {
  let quote: '"' | "'" | null = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (quote === '"' && char === "\\") {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "#" && (index === 0 || /\s/u.test(line[index - 1]))) {
      return line.slice(0, index);
    }
  }
  return line;
}

/** Reject anchors, aliases, tags, document markers and merge keys up front. */
function assertSupported(content: string): void {
  if (
    content === "---" ||
    content === "..." ||
    /(^|\s)[&*][\w-]+/u.test(content) ||
    /(^|\s)!+[A-Za-z<>]/u.test(content) ||
    /(^|\s)<<\s*:/u.test(content)
  ) {
    fail("unsupported");
  }
}

function findColon(raw: string): number {
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (quote) {
      if (quote === '"' && char === "\\") {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "[" || char === "{") {
      depth += 1;
      continue;
    }
    if (char === "]" || char === "}") {
      depth -= 1;
      continue;
    }
    if (
      char === ":" &&
      depth === 0 &&
      (index + 1 === raw.length || /\s/u.test(raw[index + 1]))
    ) {
      return index;
    }
  }
  return -1;
}

function splitTopLevel(raw: string, separator: string): string[] | null {
  const parts: string[] = [];
  let buffer = "";
  let quote: '"' | "'" | null = null;
  let depth = 0;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (quote) {
      buffer += char;
      if (quote === '"' && char === "\\" && index + 1 < raw.length) {
        buffer += raw[index + 1];
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }
    if (char === "[" || char === "{") depth += 1;
    if (char === "]" || char === "}") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(buffer.trim());
      buffer = "";
      continue;
    }
    buffer += char;
  }

  if (quote !== null || depth !== 0) return null;
  parts.push(buffer.trim());
  return parts;
}

/** Deterministic scalar parsing: quoted strings, numbers, booleans and null. */
function parseScalar(raw: string): YamlValue {
  const value = raw.trim();
  if (!value) return null;

  if (value.startsWith('"')) {
    if (value.length < 2 || !value.endsWith('"')) fail("invalidYaml");
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "string") fail("invalidYaml");
      return parsed;
    } catch (caught) {
      if (caught instanceof YamlParseError) throw caught;
      return fail("invalidYaml");
    }
  }

  if (value.startsWith("'")) {
    if (value.length < 2 || !value.endsWith("'")) fail("invalidYaml");
    return value.slice(1, -1).replace(/''/gu, "'");
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    const parts = splitTopLevel(inner, ",");
    if (!parts) fail("invalidYaml");
    return parts.map(parseScalar);
  }

  if (value.startsWith("{") && value.endsWith("}")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return {};
    const parts = splitTopLevel(inner, ",");
    if (!parts) fail("invalidYaml");
    const record: YamlRecord = {};
    for (const part of parts) {
      const colon = findColon(part);
      if (colon < 0) fail("invalidYaml");
      const key = parseScalar(part.slice(0, colon));
      if (typeof key !== "string" || !key) fail("invalidYaml");
      record[key] = parseScalar(part.slice(colon + 1));
    }
    return record;
  }

  const lower = value.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  if (lower === "null" || lower === "~") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(value)) {
    return Number(value);
  }
  if (value.startsWith("|") || value.startsWith(">")) fail("unsupported");
  return value;
}

function tokenize(source: string, step: number): YamlLine[] {
  const lines: YamlLine[] = [];
  const rawLines = source.replace(/^\uFEFF/u, "").split(/\r\n|\r|\n/u);

  for (const original of rawLines) {
    if (/^[ \t]*\t/u.test(original)) fail("invalidYaml");
    const content = stripComment(original).trim();
    if (!content) continue;
    const indent = original.length - original.replace(/^ +/u, "").length;
    if (indent % step !== 0) fail("invalidYaml");
    assertSupported(content);
    lines.push({ indent, content });
  }

  return lines;
}

function parseMapping(
  lines: YamlLine[],
  start: number,
  indent: number,
  step: number,
): ParsedBlock {
  const record: YamlRecord = {};
  let cursor = start;

  while (cursor < lines.length && lines[cursor].indent === indent) {
    const line = lines[cursor];
    if (line.content === "-" || line.content.startsWith("- ")) {
      fail("invalidYaml");
    }
    const colon = findColon(line.content);
    if (colon < 0) fail("invalidYaml");
    const key = parseScalar(line.content.slice(0, colon));
    if (typeof key !== "string" || !key) fail("invalidYaml");
    if (Object.prototype.hasOwnProperty.call(record, key)) fail("invalidYaml");

    const rest = line.content.slice(colon + 1).trim();
    cursor += 1;

    if (!rest) {
      const child = lines[cursor];
      if (child && child.indent > indent) {
        if (child.indent !== indent + step) fail("invalidYaml");
        const parsed = parseBlock(lines, cursor, child.indent, step);
        record[key] = parsed.value;
        cursor = parsed.next;
      } else {
        record[key] = null;
      }
      continue;
    }

    record[key] = parseScalar(rest);
    const child = lines[cursor];
    if (child && child.indent > indent) fail("invalidYaml");
  }

  return { value: record, next: cursor };
}

function parseBlock(
  lines: YamlLine[],
  start: number,
  indent: number,
  step: number,
): ParsedBlock {
  const first = lines[start];
  if (!first || first.indent !== indent) fail("invalidYaml");

  const isSequenceLine = (content: string) =>
    content === "-" || content.startsWith("- ");

  if (!isSequenceLine(first.content)) {
    return parseMapping(lines, start, indent, step);
  }

  const list: YamlValue[] = [];
  let cursor = start;

  while (
    cursor < lines.length &&
    lines[cursor].indent === indent &&
    isSequenceLine(lines[cursor].content)
  ) {
    const entry = lines[cursor].content.slice(1).trim();

    if (!entry) {
      const child = lines[cursor + 1];
      if (!child || child.indent <= indent) {
        list.push(null);
        cursor += 1;
        continue;
      }
      if (child.indent !== indent + step) fail("invalidYaml");
      const parsed = parseBlock(lines, cursor + 1, child.indent, step);
      list.push(parsed.value);
      cursor = parsed.next;
      continue;
    }

    if (findColon(entry) >= 0) {
      // A list item that starts a mapping: treat "- key: value" as a normal
      // mapping line one level deeper so following keys join the same object.
      lines[cursor] = { indent: indent + step, content: entry };
      const parsed = parseMapping(lines, cursor, indent + step, step);
      list.push(parsed.value);
      cursor = parsed.next;
      continue;
    }

    list.push(parseScalar(entry));
    cursor += 1;
    const child = lines[cursor];
    if (child && child.indent > indent) fail("invalidYaml");
  }

  return { value: list, next: cursor };
}

/** Pure, deterministic YAML-subset to JSON conversion. */
export function yamlToJson(
  source: string,
  indent: YamlIndent,
): YamlToJsonResult {
  try {
    if (!source.trim()) return { ok: false, reason: "invalidYaml" };
    const lines = tokenize(source, indent);
    if (lines.length === 0) return { ok: false, reason: "invalidYaml" };
    const parsed = parseBlock(lines, 0, lines[0].indent, indent);
    if (parsed.next !== lines.length) {
      return { ok: false, reason: "invalidYaml" };
    }
    return {
      ok: true,
      json: JSON.stringify(parsed.value, null, indent) ?? "null",
      indent,
    };
  } catch (caught) {
    if (caught instanceof YamlParseError) {
      return { ok: false, reason: caught.reason };
    }
    return { ok: false, reason: "invalidYaml" };
  }
}

export default function YamlToJson() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<YamlIndent>(2);

  const indentOptions = [
    { value: "2", label: `2 ${t("yaml-to-json.spaces")}` },
    { value: "4", label: `4 ${t("yaml-to-json.spaces")}` },
  ] as const;

  const conversion = useMemo(
    () => (input.trim() ? yamlToJson(input, indent) : null),
    [input, indent],
  );
  const output = conversion && conversion.ok ? conversion.json : "";
  const errorReason = conversion && !conversion.ok ? conversion.reason : null;

  const clearAll = () => {
    setInput("");
    setIndent(2);
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setIndent(2);
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
    const blob = new Blob([output], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "data.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceLayout
      title={t("yaml-to-json.title")}
      icon="Code"
      onReset={clearAll}
      onSample={handleSample}
      statusRight={output ? `${output.length} ${tu("characters")}` : undefined}
      input={
        <div className="flex min-w-0 flex-col gap-4">
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
            aria-label={t("yaml-to-json.title")}
            spellCheck={false}
            className="tp-field-input min-h-[300px] min-w-0 max-w-full font-mono text-[13px]"
          />

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <ToolField label={t("yaml-to-json.indent")}>
              <ThemedSelect
                value={String(indent)}
                onValueChange={(value) => setIndent(value === "4" ? 4 : 2)}
                options={indentOptions}
                ariaLabel={t("yaml-to-json.indent")}
              />
            </ToolField>
          </div>

          <p className="tp-workspace-hint" aria-live="polite">
            {input.length} {tu("characters").toLowerCase()}
          </p>
        </div>
      }
      output={
        <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
          <div className="grid min-w-0 gap-2 sm:grid-cols-[auto_1fr] sm:items-center" aria-live="polite">
            <span
              className="tp-status-pill"
              data-tone={errorReason ? "danger" : output ? "success" : "neutral"}
            >
              {errorReason
                ? t("statusError")
                : output
                  ? t("statusReady")
                  : t("statusIdle")}
            </span>
          </div>

          {errorReason ? (
            <p role="alert" aria-live="polite" className="tp-workspace-error break-words [overflow-wrap:anywhere]">
              {errorReason === "invalidYaml"
                ? t("yaml-to-json.invalidYaml")
                : t("yaml-to-json.unsupported")}
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
