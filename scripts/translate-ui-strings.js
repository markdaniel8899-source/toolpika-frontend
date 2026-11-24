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
const GROQ_MODEL = "qwen/qwen3.8-27b";
const LOCALES = ["de", "fr", "es", "pt-BR", "ru", "tr", "it", "ar", "hi"];

// Values that are deliberately identical across locales: code identifiers,
// abbreviations and cognates. Re-sending them on every run wastes Groq tokens.
const SKIP_VALUES = new Set([
  "camelCase", "kebab-case", "snake_case", "{count} min",
  "Original", "Cookies", "Code", "Text", "Live", "Images",
  "Contact", "Blog", "Legal", "Home", "Input", "Privacy",
]);

// Code-like values that must stay byte-identical in every locale.
const SKIP_KEYS = new Set([
  "tools.word-counter.page.exampleInput",
  "tools.word-counter.page.exampleOutput",
  "tools.case-converter.page.exampleInput",
  "tools.case-converter.page.exampleOutput",
  "tools.image-compressor.page.exampleInput",
  "tools.image-compressor.page.exampleOutput",
  "tools.json-formatter.page.exampleInput",
  "tools.json-formatter.page.exampleOutput",
  "tools.unit-converter.page.exampleInput",
  "tools.unit-converter.page.exampleOutput",
  "tools.password-generator.page.exampleInput",
  "tools.password-generator.page.exampleOutput",
  "tools.url-encoder.page.exampleInput",
  "tools.url-encoder.page.exampleOutput",
  "tools.base64-encoder.page.exampleInput",
  "tools.base64-encoder.page.exampleOutput",
]);

// Small batches + a pause between requests keep us under Groq's per-minute
// output-token (OTPM) limit. Each batch is saved immediately so an
// interrupted run can resume without re-translating finished strings.
const BATCH_SIZE = 10;
const REQUEST_DELAY_MS = 15000;

const SYSTEM_PROMPT = `You are a professional software localization engine for a web tools site.

Translate the given JSON values into the target language.

Rules:
1. Return ONLY valid JSON. No markdown fences, no commentary.
2. Keep every JSON key exactly as given. Only values are translated.
3. Preserve these tokens byte-for-byte: {placeholders} like {name}, {count}, {year}, ICU plural syntax like "{count, plural, one {# tool} other {# tools}}", and markup like <display>text</display>. Translate the words inside plural branches, but keep the syntax and # placeholder exact.
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

async function translateBatch(payload, targetLocale, apiKey, attempt = 0, maxAttempts = 15) {
  let response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
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
  } catch (error) {
    if (attempt < maxAttempts) {
      const waitMs = Math.min(10000 * (attempt + 1), 60000);
      console.log(`  [${targetLocale}] network error — retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${maxAttempts})…`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return translateBatch(payload, targetLocale, apiKey, attempt + 1, maxAttempts);
    }
    throw error;
  }

  if (response.status === 429 && attempt < maxAttempts) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const waitMs = Math.min(retryAfter > 0 ? retryAfter * 1000 : 10000 * (attempt + 1), 60000);
    console.log(`  [${targetLocale}] rate limited — retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${maxAttempts})…`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return translateBatch(payload, targetLocale, apiKey, attempt + 1, maxAttempts);
  }

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
      if (!options.force && SKIP_KEYS.has(path)) continue;
      // Keep intentional English values as-is when the key already exists.
      if (!options.force && SKIP_VALUES.has(value) && targetFlat[path] !== undefined) continue;
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

    const entries = Object.entries(pending);
    console.log(`[${locale}] translating ${entries.length} strings…`);

    let current = { ...sourceFlat, ...targetFlat };
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = Object.fromEntries(entries.slice(i, i + BATCH_SIZE));
      const result = await translateBatch(batch, locale, apiKey);
      current = { ...current, ...result };
      // Save after every batch so an interrupted run resumes from here.
      await writeJsonAtomic(targetPath, unflatten(current));
      console.log(`  [${locale}] ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length} saved`);
      if (i + BATCH_SIZE < entries.length) {
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
      }
    }

    console.log(`[${locale}] done → ${targetPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
