/** Pure RFC 4180 style CSV or TSV parsing with JSON and Markdown output. */

export type CsvIssue = "empty" | "delimiter" | "quotes" | "ragged" | "emptyHeader" | "duplicateHeader";
export type CsvOutputMode = "json" | "markdown";

export interface CsvOptions {
  delimiter: string;
  hasHeader: boolean;
}

export interface CsvSuccess {
  ok: true;
  json: string;
  markdown: string;
  rows: number;
  columns: number;
  headers: string[];
}

export type CsvResult = CsvSuccess | { ok: false; reason: CsvIssue; row?: number };

export const CSV_SAMPLE = [
  "name,category,visits",
  "URL Parser,code,1240",
  "Password Strength Checker,security,860",
  "CSV to JSON,converter,1510",
].join("\n");

/** Accept one literal character, with backslash-t as a visible tab alias. */
export function normalizeDelimiter(input: string): string | null {
  const value = input.trim();
  if (value === "\\t") return "\t";
  if (value.length !== 1 || value === '"' || value === "\n" || value === "\r") return null;
  return value;
}

/**
 * Parse records, honouring quoted cells, doubled quotes and CRLF line ends.
 * Returns null when a quote is left open or a quote starts mid-cell.
 */
export function parseCsvRows(source: string, delimiter: string): string[][] | null {
  const text = source.replace(/^\uFEFF/u, "");
  if (!text.trim()) return null;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false;
  let index = 0;

  const pushRow = () => {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
    field = "";
    started = false;
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
      if (started) return null;
      quoted = true;
      started = true;
      index += 1;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      started = false;
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
    started = true;
    index += 1;
  }

  if (quoted) return null;
  if (started || row.length > 0 || field.length > 0) pushRow();
  return rows.length > 0 ? rows : null;
}

function markdownCell(value: string): string {
  return value.replace(/\|/gu, "\\|").replace(/\r?\n/gu, " ");
}

/** Build both exports in one pass so switching the output mode is instant. */
export function convertCsv(source: string, options: CsvOptions): CsvResult {
  const delimiter = normalizeDelimiter(options.delimiter);
  if (!delimiter) return { ok: false, reason: "delimiter" };

  const rows = parseCsvRows(source, delimiter);
  if (!rows) return { ok: false, reason: "quotes" };
  if (rows.length === 0) return { ok: false, reason: "empty" };

  const width = rows[0].length;
  if (width === 0) return { ok: false, reason: "empty" };
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].length !== width) return { ok: false, reason: "ragged", row: index + 1 };
  }

  const headers = options.hasHeader
    ? rows[0]
    : Array.from({ length: width }, (_, index) => `column${index + 1}`);

  if (options.hasHeader) {
    if (headers.some((header) => !header.trim())) return { ok: false, reason: "emptyHeader" };
    if (new Set(headers).size !== headers.length) return { ok: false, reason: "duplicateHeader" };
  }

  const dataRows = options.hasHeader ? rows.slice(1) : rows;
  if (dataRows.length === 0) return { ok: false, reason: "empty" };

  const objects = dataRows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index];
    });
    return record;
  });

  const json = JSON.stringify(objects, null, 2);
  const lines = [
    `| ${headers.map(markdownCell).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...dataRows.map((cells) => `| ${cells.map(markdownCell).join(" | ")} |`),
  ];
  const markdown = lines.join("\n");

  return {
    ok: true,
    json,
    markdown,
    rows: objects.length,
    columns: width,
    headers,
  };
}
