#!/usr/bin/env node
/**
 * Toolpika — check-message-usage.js
 *
 * Finds translation keys that the code asks for but the message files do not
 * define. next-intl throws MISSING_MESSAGE at build time for these, so
 * catching them here is faster than waiting for `next build`.
 *
 * It scans src/ for translation aliases:
 *
 *   const t = await getTranslations({ locale, namespace: "x" });
 *   const t = useTranslations("x");
 *
 * and then checks every literal t("key"), t.rich("key") call for that alias
 * against en.json.
 *
 * Usage (run from the frontend repo root):
 *   node scripts/check-message-usage.js
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC_DIR = join(ROOT, "src");
const EN_FILE = join(ROOT, "messages", "en.json");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }

  return files;
}

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

/**
 * Finds `const <alias> = ... getTranslations/useTranslations` and returns the
 * namespace each alias is bound to.
 */
function findAliases(source) {
  const aliases = new Map();

  const patterns = [
    // const t = await getTranslations({ ..., namespace: "x" })
    /const\s+(\w+)\s*=\s*await\s+getTranslations\(\s*\{[\s\S]*?namespace:\s*["'`]([A-Za-z0-9_]+)["'`][\s\S]*?\}\s*\)/g,
    // const t = getTranslations({ ..., namespace: "x" })
    /const\s+(\w+)\s*=\s*getTranslations\(\s*\{[\s\S]*?namespace:\s*["'`]([A-Za-z0-9_]+)["'`][\s\S]*?\}\s*\)/g,
    // const t = useTranslations("x")
    /const\s+(\w+)\s*=\s*useTranslations\(\s*["'`]([A-Za-z0-9_]+)["'`]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      aliases.set(match[1], match[2]);
    }
  }

  return aliases;
}

async function main() {
  const en = JSON.parse(await readFile(EN_FILE, "utf8"));
  const enFlat = flatten(en);

  const files = await walk(SRC_DIR);
  let problems = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const aliases = findAliases(source);

    if (aliases.size === 0) continue;

    for (const [alias, namespace] of aliases) {
      // alias("key") and alias.rich("key")
      const pattern = new RegExp(
        `\\b${alias}(?:\\.rich)?\\(\\s*["'\`]([A-Za-z0-9_.]+)["'\`]`,
        "g"
      );

      for (const match of source.matchAll(pattern)) {
        const full = `${namespace}.${match[1]}`;
        if (!(full in enFlat)) {
          console.log(`${file.replace(ROOT, "")}: missing ${full}`);
          problems += 1;
        }
      }
    }
  }

  if (problems > 0) {
    console.error(`\n${problems} missing message key(s).`);
    process.exit(1);
  }

  console.log("All message keys used in the code exist in en.json.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
