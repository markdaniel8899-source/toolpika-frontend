#!/usr/bin/env node
/**
 * Toolpika — translate-ui-strings.js
 *
 * Translates messages/en.json into the nine target locales using an
 * OpenAI-compatible chat-completions API (Groq by default, NVIDIA NIM via
 * TRANSLATION_* environment variables).
 *
 * Usage (run from the frontend repo root):
 *   npm run translate -- --locale de
 *   npm run translate -- --prefix tools.word-counter
 *   npm run translate -- --dry-run
 *   npm run translate -- --force
 *
 * Rules:
 *   * JSON keys are never translated — only values.
 *   * Protected tokens (%%TOOL%%, {placeholders}, ICU plural syntax, <markup>)
 *     are verified after every batch, not just requested in the prompt.
 *   * Source-value hashes are cached in scripts/.translation-cache.json so a
 *     changed English value is re-translated even when the old translation is
 *     still present.
 *   * Batches are written atomically; a failed batch aborts instead of writing
 *     malformed data. English is never written into a target locale file.
 */

import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  sameTokens,
  hasStraySymbols,
  englishSummary,
  formatSummary,
} from "./localization-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = resolve(__dirname, "..", "messages");
const CACHE_PATH = resolve(__dirname, ".translation-cache.json");

// OpenAI-compatible endpoint. Defaults to the original Groq setup; set the
// TRANSLATION_* variables to use another provider (e.g. NVIDIA NIM).
const API_ENDPOINT =
  process.env.TRANSLATION_ENDPOINT ??
  "https://api.groq.com/openai/v1/chat/completions";
const API_MODEL = process.env.TRANSLATION_MODEL ?? "qwen/qwen3.8-27b";
const MAX_TOKENS = Number(process.env.TRANSLATION_MAX_TOKENS ?? 4096);
const LOCALES = ["de", "fr", "es", "pt-BR", "ru", "tr", "it", "ar", "hi"];
const LOCALE_NAMES = {
  de: "German",
  fr: "French",
  es: "Spanish",
  "pt-BR": "Brazilian Portuguese",
  ru: "Russian",
  tr: "Turkish",
  it: "Italian",
  ar: "Modern Standard Arabic",
  hi: "Hindi",
};

/**
 * Only code-like values that must never be translated. Ordinary UI words such
 * as "Text", "Home" or "Contact" are deliberately NOT in this set: they are
 * real translatable strings and the checker reports them if they stay English.
 */
const SKIP_VALUES = new Set([
  "camelCase", "kebab-case", "snake_case", "{count} min",
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
  // New tools: worked examples are code/data, not translatable prose.
  "tools.lorem-ipsum-generator.page.exampleInput",
  "tools.lorem-ipsum-generator.page.exampleOutput",
  "tools.text-diff-checker.page.exampleInput",
  "tools.text-diff-checker.page.exampleOutput",
  "tools.jwt-decoder.page.exampleInput",
  "tools.jwt-decoder.page.exampleOutput",
  "tools.regex-tester.page.exampleInput",
  "tools.regex-tester.page.exampleOutput",
  "tools.percentage-calculator.page.exampleInput",
  "tools.percentage-calculator.page.exampleOutput",
  "tools.aspect-ratio-calculator.page.exampleInput",
  "tools.aspect-ratio-calculator.page.exampleOutput",
  "tools.utm-builder.page.exampleInput",
  "tools.utm-builder.page.exampleOutput",
  "tools.hash-generator.page.exampleInput",
  "tools.hash-generator.page.exampleOutput",
  // Version labels, algorithm names and download file names stay byte-exact.
  "tools.uuid-generator.version4",
  "tools.uuid-generator.version7",
  "tools.uuid-generator.versionNil",
  "tools.uuid-generator.downloadName",
  "tools.jwt-decoder.downloadName",
  "tools.aspect-ratio-calculator.fileName",
  "tools.utm-builder.fileName",
  "tools.hash-generator.sha256",
  "tools.hash-generator.sha512",
  "tools.hash-generator.sha1",
]);

// Small batches + a pause keep us under provider output-token limits.
const BATCH_SIZE = Number(
  process.env.TRANSLATION_BATCH_SIZE ?? process.env.GROQ_BATCH_SIZE ?? 10,
);
const REQUEST_DELAY_MS = Number(
  process.env.TRANSLATION_BATCH_DELAY_MS ??
    process.env.GROQ_BATCH_DELAY_MS ??
    15000,
);

const SYSTEM_PROMPT = `You are a senior software localization engineer translating UI copy, SEO text and help content for a privacy-first web tools site.

Translate the MEANING and SEARCH/READING INTENT of each value naturally into the target language. Do not translate word for word and do not preserve English sentence order when the target language reads better another way. Write the way a native speaker would write the same label, question or explanation on this site.

Return ONLY a JSON object with the same keys you received. Translate values only.

Protected tokens — copy these byte-for-byte into the translated value:
- %%TOOL%% (a literal link token; never translate, rewrite or remove it)
- {name}, {count}, {year} and any other {placeholder}
- ICU plural syntax such as "{count, plural, one {# tool} other {# tools}}" — keep the braces, # and branch syntax exact; translate only the words inside branches
- markup fragments such as <display>seconds</display> — keep the tags exact, translate the words inside

Never invent stray ">>", ">", unmatched quotation marks, markdown fences, commentary, or extra keys. If a value has no protected token, do not add one.

Style:
- Plain, concise, specific language. No marketing hype: no "seamless", "elevate", "unleash", no filler.
- Keep a consistent, calm tone across all strings.
- Use correct orthography for the target locale: German umlauts and ß; Spanish and Portuguese accents; French and Italian accents; Turkish dotted/dotless letters; natural Cyrillic for Russian; Modern Standard Arabic for ar; natural Devanagari Hindi for hi (not transliterated English).
- Preserve punctuation conventions of the target language; do not copy English punctuation habits blindly.
- Brand name "Toolpika" is never translated.`;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { dryRun: false, locale: null, force: false, prefixes: [] };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--force") options.force = true;
    else if (argument === "--locale") options.locale = args[++index];
    else if (argument === "--prefix") {
      const value = args[++index];
      if (value) {
        for (const part of value.split(",")) {
          const prefix = part.trim().replace(/\.+$/u, "");
          if (prefix) options.prefixes.push(prefix);
        }
      }
    }
  }

  return options;
}

function matchesPrefix(key, prefixes) {
  if (prefixes.length === 0) return true;
  return prefixes.some(
    (prefix) => key === prefix || key.startsWith(`${prefix}.`),
  );
}

const hashValue = (value) =>
  createHash("sha256").update(String(value)).digest("hex");

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
    for (let index = 0; index < keys.length - 1; index += 1) {
      cursor[keys[index]] ??= {};
      cursor = cursor[keys[index]];
    }
    cursor[keys[keys.length - 1]] = value;
  }
  return result;
}

async function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJsonAtomic(filePath, data) {
  const temp = `${filePath}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(temp, filePath);
}

/**
 * Verify a model response before it is allowed near a message file.
 * Returns only the requested keys; a dropped key or altered protected token
 * aborts the batch so no partially corrupted JSON is written.
 */
function validateBatch(requested, result, sourceValues, locale, warnings) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error(`expected a JSON object, received ${typeof result}`);
  }

  let translated = result;
  const resultKeys = Object.keys(translated);
  if (
    resultKeys.length === 1 &&
    !(resultKeys[0] in requested) &&
    translated[resultKeys[0]] &&
    typeof translated[resultKeys[0]] === "object"
  ) {
    const wrapper = resultKeys[0];
    warnings.push(`[${locale}] batch was wrapped in "${wrapper}"; unwrapped automatically`);
    translated = translated[wrapper];
  }

  const requestedKeys = Object.keys(requested);
  const missing = requestedKeys.filter((key) => !(key in translated));
  const extra = Object.keys(translated).filter((key) => !requestedKeys.includes(key));

  if (missing.length > 0) {
    throw new Error(`batch dropped ${missing.length} key(s): ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    warnings.push(`[${locale}] batch returned ${extra.length} unexpected key(s); ignored: ${extra.join(", ")}`);
  }

  const clean = {};
  for (const key of requestedKeys) {
    const value = translated[key];
    if (typeof value !== "string") {
      throw new Error(`${key}: expected a string, received ${typeof value}`);
    }
    if (!sameTokens(sourceValues[key], value)) {
      throw new Error(
        `${key}: protected token changed (expected ${JSON.stringify(sourceValues[key]).slice(0, 80)})`,
      );
    }
    if (hasStraySymbols(value)) {
      throw new Error(`${key}: stray ">>", ">" or unmatched quote in translated value`);
    }
    clean[key] = value;
  }

  return clean;
}

async function translateBatch(payload, targetLocale, apiKey, attempt = 0, maxAttempts = 15) {
  let response;
  try {
    response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_MODEL,
        temperature: 0.2,
        max_tokens: MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content:
              `Target locale: ${targetLocale} (${LOCALE_NAMES[targetLocale] ?? targetLocale}).\n` +
              `Translate naturally for a real reader of this page in that language.\n\n` +
              `JSON to translate (keep keys, translate values only):\n${JSON.stringify(payload, null, 2)}`,
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
    throw new Error(`Translation API ${response.status}: ${detail.slice(0, 400)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Translation API returned an empty message");

  try {
    return JSON.parse(content);
  } catch (error) {
    if (attempt < maxAttempts) {
      const waitMs = Math.min(2000 * (attempt + 1), 10000);
      console.log(
        `  [${targetLocale}] invalid JSON — retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1}/${maxAttempts})…`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return translateBatch(payload, targetLocale, apiKey, attempt + 1, maxAttempts);
    }
    throw new Error(`Translation API returned invalid JSON: ${String(error.message).slice(0, 160)}`);
  }
}

/**
 * Translate a batch, splitting it in half whenever the model drops keys or
 * damages the JSON. Splitting keeps a single bad response from aborting the
 * whole locale run.
 */
async function translateEntries(entries, locale, apiKey, warnings, depth = 0) {
  const payload = Object.fromEntries(entries);
  try {
    const raw = await translateBatch(payload, locale, apiKey);
    return validateBatch(payload, raw, payload, locale, warnings);
  } catch (error) {
    if (entries.length > 1 && depth < 5) {
      console.log(
        `  [${locale}] batch issue (${error.message.slice(0, 90)}) — splitting ${entries.length} keys`,
      );
      const middle = Math.ceil(entries.length / 2);
      const first = await translateEntries(entries.slice(0, middle), locale, apiKey, warnings, depth + 1);
      const second = await translateEntries(entries.slice(middle), locale, apiKey, warnings, depth + 1);
      return { ...first, ...second };
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs();
  const apiKey = process.env.TRANSLATION_API_KEY ?? process.env.GROQ_API_KEY;

  // A dry run only reads message files; no credentials or network calls needed.
  if (!apiKey && !options.dryRun) {
    console.error(
      "Missing TRANSLATION_API_KEY (or GROQ_API_KEY). Set it before running this script.",
    );
    process.exit(1);
  }

  const sourcePath = join(MESSAGES_DIR, "en.json");
  const sourceFlat = flatten(JSON.parse(await readFile(sourcePath, "utf8")));
  const cache = await readJsonFile(CACHE_PATH, {});
  const warnings = [];
  const report = [];

  const targets = options.locale ? [options.locale] : LOCALES;
  await mkdir(MESSAGES_DIR, { recursive: true });

  for (const locale of targets) {
    if (!LOCALES.includes(locale)) {
      console.error(`Unknown locale "${locale}". Allowed: ${LOCALES.join(", ")}`);
      continue;
    }

    const targetPath = join(MESSAGES_DIR, `${locale}.json`);
    const target = await readJsonFile(targetPath, {});
    const targetFlat = flatten(target);
    const cached = cache[locale] ?? {};
    const pending = {};

    for (const [path, value] of Object.entries(sourceFlat)) {
      if (typeof value !== "string") continue;
      if (!matchesPrefix(path, options.prefixes)) continue;
      if (!options.force && (SKIP_KEYS.has(path) || /^tools\..*\.page\.example(Input|Output)$/u.test(path))) continue;
      if (!options.force && SKIP_VALUES.has(value) && targetFlat[path] !== undefined) continue;

      const sourceHash = hashValue(value);
      const missing = targetFlat[path] === undefined;
      const stillEnglish = targetFlat[path] === value;
      const sourceChanged =
        !options.force &&
        cached[path] !== undefined &&
        cached[path] !== sourceHash;

      if (options.force || missing || stillEnglish || sourceChanged) {
        pending[path] = value;
      }
    }

    const pendingKeys = Object.keys(pending);
    if (pendingKeys.length === 0) {
      console.log(`[${locale}] up to date — nothing to translate`);
      report.push({
        locale,
        translated: 0,
        summary: englishSummary(sourceFlat, targetFlat),
      });
      continue;
    }

    if (options.dryRun) {
      console.log(`[${locale}] would translate ${pendingKeys.length} string(s)`);
      console.log(`  ${pendingKeys.join(", ")}`);
      report.push({
        locale,
        translated: 0,
        summary: englishSummary(sourceFlat, targetFlat),
      });
      continue;
    }

    console.log(
      `[${locale}] translating ${pendingKeys.length} string(s)${options.prefixes.length ? ` (prefix: ${options.prefixes.join(", ")})` : ""}…`,
    );

    const entries = Object.entries(pending);
    // Never seed the target file with English. Unfinished keys stay missing so
    // the next run picks them up and no English leaks into a locale file.
    let current = { ...targetFlat };

    for (let index = 0; index < entries.length; index += BATCH_SIZE) {
      const batch = Object.fromEntries(entries.slice(index, index + BATCH_SIZE));
      let result;
      try {
        result = await translateEntries(Object.entries(batch), locale, apiKey, warnings);
      } catch (error) {
        console.error(`  [${locale}] batch failed: ${error.message}`);
        throw error;
      }

      current = { ...current, ...result };
      for (const key of Object.keys(result)) {
        cache[locale] ??= {};
        cache[locale][key] = hashValue(batch[key]);
      }

      await writeJsonAtomic(targetPath, unflatten(current));
      await writeJsonAtomic(CACHE_PATH, cache);
      console.log(
        `  [${locale}] ${Math.min(index + BATCH_SIZE, entries.length)}/${entries.length} saved`,
      );

      if (index + BATCH_SIZE < entries.length) {
        await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
      }
    }

    console.log(`[${locale}] done → ${targetPath}`);
    report.push({
      locale,
      translated: entries.length,
      summary: englishSummary(sourceFlat, current),
    });
  }

  console.log("\n=== Translation summary ===");
  for (const item of report) {
    console.log(
      `[${item.locale}] translated this run: ${item.translated}; ` +
        `English-identical remaining — ${formatSummary(item.summary)}`,
    );
  }
  if (warnings.length > 0) {
    console.log(`\n=== Warnings (${warnings.length}) ===`);
    for (const warning of warnings) console.log(`  ${warning}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
