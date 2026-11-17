#!/usr/bin/env node
/**
 * Toolpika — translate-ui-strings.js
 *
 * Translates messages/en.json into every other locale using Groq
 * (Llama 3 70B), per i18n.md §3A.
 *
 * Usage (run from the frontend repo root):
 *   GROQ_API_KEY=... node scripts/translate-ui-strings.js
 *   GROQ_API_KEY=... node scripts/translate-ui-strings.js --locale de
 *   GROQ_API_KEY=... node scripts/translate-ui-strings.js --dry-run
 *
 * Rules:
 *   * JSON keys are never translated — only values.
 *   * ICU placeholders ({name}, {count}, <display>…</display>) are preserved
 *     verbatim; the prompt forbids altering them.
 *   * Only missing or changed keys are sent, so re-runs stay cheap.
 *   * Writes are atomic (temp file + rename).
 */

import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = resolve(__dirname, "..", "messages");

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const LOCALES = ["de", "fr", "es", "pt-BR", "ru", "tr", "it", "ar", "hi"];

const SYSTEM_PROMPT = `You are a professional software localization engine for a web tools site.

Translate the given JSON values into the target language.

Rules:
1. Return ONLY valid JSON. No markdown fences, no commentary.
2. Keep every JSON key exactly as given. Only values are translated.
3. Preserve these tokens byte-for-byte: {placeholders} like {name}, {count}, {year}, and markup like <display>text</display>.
4. Use natural, plain UI language. No marketing hype, no "seamless", "elevate", "unleash".
5. Keep the tone consistent across all strings.
6. For the target locale "ar", produce Modern Standard Arabic suitable for a UI.
7. For "hi", use natural Hindi (Devanagari), not transliterated English.
8. For "pt-BR", use Brazilian Portuguese, not European Portuguese.`;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { dryRun: false, locale: null, force: false };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--dry-run") options.dryRun = true;
    else if (args[i] === "--force") options.force = true;
    else if (args[i] === "--locale") options.locale = args[++i];
  }

  return options;
}

/** Flatten { a: { b: "x" } } -> { "a.b": "x" } */
function flatten(object, prefix = "") {
  const result = {};

  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flatten(value, path));
    } else {
      result[path] = value;
    }
  }

  return result;
}

/** Inverse of flatten: { "a.b": "x" } -> { a: { b: "x" } } */
function unflatten(flat) {
  const result = {};

  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split(".");
    let cursor = result;
    for (let i = 0; i < keys.length - 1; i += 1) {
      cursor[keys[i]] ??= {};
      cursor = cursor[keys[i]];
    }
    cursor[keys[keys.length - 1]] = value;
  }

  return result;
}

async function translateBatch(payload, targetLocale, apiKey) {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Target language: ${targetLocale}\n\nJSON to translate:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq ${response.status}: ${detail.slice(0, 400)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty message");
  }

  const parsed = JSON.parse(content);

  // Some models wrap the result in a single key; unwrap it if so.
  const keys = Object.keys(parsed);
  if (keys.length === 1 && keys[0] !== "translations" && typeof parsed[keys[0]] === "object") {
    return parsed[keys[0]];
  }

  return parsed;
}

async function writeJsonAtomic(filePath, data) {
  const temp = `${filePath}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, filePath);
}

async function main() {
  const options = parseArgs();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("Missing GROQ_API_KEY. Set it before running this script.");
    process.exit(1);
  }

  const sourcePath = join(MESSAGES_DIR, "en.json");
  const source = JSON.parse(await readFile(sourcePath, "utf8"));
  const sourceFlat = flatten(source);

  const targets = options.locale ? [options.locale] : LOCALES;

  await mkdir(MESSAGES_DIR, { recursive: true });

  for (const locale of targets) {
    if (!LOCALES.includes(locale)) {
      console.error(`Unknown locale "${locale}". Allowed: ${LOCALES.join(", ")}`);
      continue;
    }

    const targetPath = join(MESSAGES_DIR, `${locale}.json`);
    let target = {};

    try {
      target = JSON.parse(await readFile(targetPath, "utf8"));
    } catch {
      console.log(`[${locale}] no existing file — translating everything`);
    }

    const targetFlat = flatten(target);
    const pending = {};

    for (const [path, value] of Object.entries(sourceFlat)) {
      if (typeof value !== "string") continue;
      if (!options.force && targetFlat[path] === value) {
        // Value still identical to English — needs translating.
        pending[path] = value;
      } else if (!options.force && targetFlat[path] === undefined) {
        pending[path] = value;
      }
    }

    if (Object.keys(pending).length === 0) {
      console.log(`[${locale}] up to date — nothing to translate`);
      continue;
    }

    if (options.dryRun) {
      console.log(`[${locale}] would translate ${Object.keys(pending).length} strings`);
      console.log(Object.keys(pending).join(", "));
      continue;
    }

    console.log(`[${locale}] translating ${Object.keys(pending).length} strings…`);

    const translated = await translateBatch(pending, locale, apiKey);
    const merged = { ...sourceFlat, ...targetFlat, ...translated };

    await writeJsonAtomic(targetPath, unflatten(merged));
    console.log(`[${locale}] done → ${targetPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
