#!/usr/bin/env node
/**
 * Toolpika — check-locale-keys.js
 *
 * Verifies that every locale file in messages/ has exactly the same key set as
 * en.json. Missing keys break the build (next-intl throws MISSING_MESSAGE),
 * so key mismatch still fails the command.
 *
 * The command also reports (without failing by default):
 *   - values still byte-identical to English, grouped into seo/page/UI
 *   - protected-token mismatches (%%TOOL%%, {placeholders}, ICU, <markup>)
 *   - stray ">>" / ">" / unmatched quotes
 *
 * Usage (run from the frontend repo root):
 *   node scripts/check-locale-keys.js
 *
 * Exit code 0 = all locales match en.json, 1 = key differences found.
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractTokens,
  sameTokens,
  hasStraySymbols,
  englishSummary,
  formatSummary,
} from "./localization-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = resolve(__dirname, "..", "messages");

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

async function main() {
  const files = await readdir(MESSAGES_DIR);
  const localeFiles = files.filter(
    (file) => file.endsWith(".json") && file !== "admin.json",
  );

  const en = JSON.parse(await readFile(join(MESSAGES_DIR, "en.json"), "utf8"));
  const enFlat = flatten(en);
  const enKeys = Object.keys(enFlat).sort();

  let failed = false;
  let warningCount = 0;

  for (const file of localeFiles.sort()) {
    const locale = file.replace(/\.json$/, "");
    const json = JSON.parse(await readFile(join(MESSAGES_DIR, file), "utf8"));
    const flat = flatten(json);
    const keys = Object.keys(flat).sort();

    const missing = enKeys.filter((key) => !(key in flat));
    const extra = keys.filter((key) => !(key in enFlat));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`[${locale}] keys OK (${keys.length})`);
    } else {
      failed = true;
      console.log(`[${locale}] KEY MISMATCH`);
      if (missing.length) console.log(`  missing: ${missing.join(", ")}`);
      if (extra.length) console.log(`  extra:   ${extra.join(", ")}`);
    }

    if (locale !== "en") {
      const summary = englishSummary(enFlat, flat);
      console.log(`  [${locale}] English-identical values — ${formatSummary(summary)}`);

      for (const key of enKeys) {
        const source = enFlat[key];
        const translated = flat[key];
        if (typeof source !== "string" || typeof translated !== "string") continue;

        if (extractTokens(source).length > 0 && !sameTokens(source, translated)) {
          warningCount += 1;
          console.log(
            `  [${locale}] TOKEN MISMATCH ${key}: en=${JSON.stringify(source).slice(0, 100)} / ${locale}=${JSON.stringify(translated).slice(0, 100)}`,
          );
        }
        if (hasStraySymbols(translated)) {
          warningCount += 1;
          console.log(`  [${locale}] STRAY SYMBOL ${key}: ${JSON.stringify(translated).slice(0, 100)}`);
        }
      }
    }
  }

  if (warningCount > 0) {
    console.log(`\n${warningCount} localization warning(s) — review before shipping.`);
  }

  if (failed) {
    console.error("\nLocale files do not match en.json.");
    process.exit(1);
  }

  console.log("\nAll locale files match en.json.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
