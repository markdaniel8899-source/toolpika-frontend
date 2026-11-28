/** Pure XML tree to JSON conversion. No DOM, no React, no translations. */

export type AttributeMode = "prefix" | "ignore";

export interface XmlToJsonOptions {
  attributes: AttributeMode;
  trimText: boolean;
  indent: 2 | 4;
}

export interface XmlAttribute {
  name: string;
  value: string;
}

export interface XmlElementNode {
  type: "element";
  name: string;
  attributes: ReadonlyArray<XmlAttribute>;
  children: ReadonlyArray<XmlNode>;
}

export interface XmlTextNode {
  type: "text";
  text: string;
}

export type XmlNode = XmlElementNode | XmlTextNode;

export type JsonValue = string | null | JsonValue[] | { [key: string]: JsonValue };

export const ATTRIBUTE_KEY_PREFIX = "@";
export const TEXT_KEY = "#text";

export const XML_TO_JSON_DEFAULTS: XmlToJsonOptions = {
  attributes: "prefix",
  trimText: true,
  indent: 2,
};

/** True when the pasted source has anything worth parsing. */
export function hasXmlContent(source: string): boolean {
  return source.trim().length > 0;
}

/** Reduce a browser parser message to one short readable line. */
export function cleanParserMessage(message: string): string {
  const firstLine = message
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return "";
  return firstLine.replace(/\s+/gu, " ").slice(0, 220);
}

function normalizeText(value: string, trim: boolean): string {
  return trim ? value.trim() : value;
}

function collectText(node: XmlElementNode, trim: boolean): string {
  return node.children
    .filter((child): child is XmlTextNode => child.type === "text")
    .map((child) => normalizeText(child.text, trim))
    .join("");
}

function addValue(record: Record<string, JsonValue>, key: string, value: JsonValue): void {
  const previous = record[key];
  if (previous === undefined) {
    record[key] = value;
    return;
  }
  if (Array.isArray(previous)) {
    previous.push(value);
    return;
  }
  record[key] = [previous, value];
}

/**
 * Attributes become prefixed keys, repeated child names become arrays, and an
 * element with both attributes and text stores the text under TEXT_KEY. An
 * element with neither children nor attributes collapses to its text string.
 */
export function elementToJson(
  node: XmlElementNode,
  options: XmlToJsonOptions,
): JsonValue {
  const elementChildren = node.children.filter(
    (child): child is XmlElementNode => child.type === "element",
  );
  const text = collectText(node, options.trimText);
  const record: Record<string, JsonValue> = {};

  if (options.attributes === "prefix") {
    for (const attribute of node.attributes) {
      record[`${ATTRIBUTE_KEY_PREFIX}${attribute.name}`] = attribute.value;
    }
  }

  for (const child of elementChildren) {
    addValue(record, child.name, elementToJson(child, options));
  }

  if (Object.keys(record).length === 0) return text;
  if (text) record[TEXT_KEY] = text;
  return record;
}

export function stringifyJson(value: JsonValue, indent: 2 | 4): string {
  return JSON.stringify(value, null, indent) ?? "null";
}

export interface XmlConversion {
  value: JsonValue;
  json: string;
}

/** Convert a normalized document element into formatted JSON. */
export function convertXmlElement(
  root: XmlElementNode,
  options: XmlToJsonOptions,
): XmlConversion {
  const value = elementToJson(root, options);
  return { value, json: stringifyJson(value, options.indent) };
}
