/**
 * Pure JSON to TypeScript inference. Parsing and code generation are plain
 * functions of their inputs; clipboard, editing and downloads stay in the
 * component.
 */

export type RootStyle = "interface" | "type";

export interface TsOptions {
  rootName: string;
  style: RootStyle;
  optional: boolean;
  nullable: boolean;
}

export type RootKind = "object" | "array" | "scalar";

export type TsResult =
  | { ok: true; code: string; typeName: string; fieldCount: number; rootKind: RootKind }
  | { ok: false; reason: "invalidJson" | "empty" };

export const DEFAULT_OPTIONS: TsOptions = {
  rootName: "Root",
  style: "interface",
  optional: true,
  nullable: true,
};

export const SAMPLE_JSON = `{
  "id": 7,
  "name": "Toolpika",
  "active": true,
  "tags": ["code", "browser"],
  "owner": { "email": null },
  "scores": [{ "value": 4 }, { "value": 5, "note": "latest" }]
}`;

interface Generator {
  options: TsOptions;
  defs: string[];
  used: Set<string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function toPascalCase(value: string): string {
  const parts = value.trim().split(/[^A-Za-z0-9]+/u).filter(Boolean);
  const joined = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return joined || "Root";
}

export function sanitizeTypeName(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^A-Za-z0-9_$]/gu, "");
  if (!cleaned) return fallback;
  const named = toPascalCase(cleaned);
  return /^\d/u.test(named) ? `${fallback}${named}` : named;
}

function uniqueName(base: string, gen: Generator): string {
  const clean = sanitizeTypeName(base, "Item");
  let name = clean;
  let index = 2;
  while (gen.used.has(name)) {
    name = `${clean}${index}`;
    index += 1;
  }
  gen.used.add(name);
  return name;
}

function propertyName(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(key) ? key : JSON.stringify(key);
}

function indent(level: number): string {
  return "  ".repeat(level);
}

function scalarType(value: unknown): string {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

function unionTypes(values: unknown[], gen: Generator, hint: string, depth: number): string {
  const usable = gen.options.nullable ? values : values.filter((value) => value !== null);
  const types: string[] = [];
  for (const value of usable) {
    const type = typeFor(value, gen, hint, depth);
    if (!types.includes(type)) types.push(type);
  }
  if (types.length === 0) return "unknown";
  return types.length === 1 ? types[0] : types.join(" | ");
}

function typeFor(value: unknown, gen: Generator, hint: string, depth: number): string {
  if (value === null) return gen.options.nullable ? "null" : "unknown";

  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const records = value.filter(isRecord);
    if (records.length > 0) {
      const name = uniqueName(hint || "Item", gen);
      const others = value.filter((item) => !isRecord(item));
      gen.defs.push(`export interface ${name} ${interfaceBody(records, gen, 0)}`);
      if (others.length === 0) return `${name}[]`;
      return `(${name} | ${unionTypes(others, gen, hint, 0)})[]`;
    }
    const inner = unionTypes(value, gen, hint, depth);
    return inner.includes("|") ? `(${inner})[]` : `${inner}[]`;
  }

  if (isRecord(value)) return interfaceBody([value], gen, depth);
  return scalarType(value);
}

function unionKeys(records: Record<string, unknown>[]): string[] {
  const keys: string[] = [];
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

function interfaceBody(records: Record<string, unknown>[], gen: Generator, depth: number): string {
  const keys = unionKeys(records);
  if (keys.length === 0) return "{}";

  const lines = ["{"];
  for (const key of keys) {
    const present = records.filter((record) => Object.prototype.hasOwnProperty.call(record, key));
    const optional = gen.options.optional && present.length < records.length ? "?" : "";
    const type = unionTypes(present.map((record) => record[key]), gen, key, depth + 1);
    lines.push(`${indent(depth + 1)}${propertyName(key)}${optional}: ${type};`);
  }
  lines.push(`${indent(depth)}}`);
  return lines.join("\n");
}

/** Convert a JSON string into a TypeScript declaration with simple inference. */
export function jsonToTypeScript(source: string, options: TsOptions): TsResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    return { ok: false, reason: "invalidJson" };
  }

  if (parsed === null || parsed === undefined) return { ok: false, reason: "empty" };

  const gen: Generator = { options, defs: [], used: new Set<string>() };
  const rootName = uniqueName(options.rootName, gen);
  let rootDeclaration: string;
  let rootKind: RootKind;
  let fieldCount = 0;

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return { ok: false, reason: "empty" };
    const records = parsed.filter(isRecord);
    if (records.length === parsed.length) {
      const body = interfaceBody(records, gen, 0);
      rootDeclaration = `export interface ${rootName} ${body}`;
      const alias = uniqueName(`${rootName}List`, gen);
      gen.defs.push(`export type ${alias} = ${rootName}[];`);
      fieldCount = unionKeys(records).length;
    } else {
      const inner = unionTypes(parsed, gen, rootName, 0);
      rootDeclaration = `export type ${rootName} = ${inner.includes("|") ? `(${inner})` : inner}[];`;
    }
    rootKind = "array";
  } else if (isRecord(parsed)) {
    const body = interfaceBody([parsed], gen, 0);
    rootDeclaration =
      options.style === "type"
        ? `export type ${rootName} = ${body};`
        : `export interface ${rootName} ${body}`;
    fieldCount = Object.keys(parsed).length;
    rootKind = "object";
  } else {
    rootDeclaration = `export type ${rootName} = ${typeFor(parsed, gen, rootName, 0)};`;
    rootKind = "scalar";
  }

  return {
    ok: true,
    code: [rootDeclaration, ...gen.defs].join("\n\n"),
    typeName: rootName,
    fieldCount,
    rootKind,
  };
}
