/**
 * Shared localization helpers for the message QA and translation scripts.
 * Pure functions only — no network, no filesystem, no side effects.
 */

/**
 * Extract the protected tokens from a message value.
 *
 * Handles:
 *   - the literal %%TOOL%% link token
 *   - simple {placeholder} variables
 *   - ICU plural/select structure: variable name + a single icuHash flag.
 *     Branch labels and branch words are intentionally ignored: Russian, for
 *     example, legitimately adds few/many branches that English does not have.
 *   - <tag> / </tag> markup fragments (tag text is not part of the token)
 */
export function extractTokens(value) {
  const tokens = [];
  const text = String(value ?? "");
  let index = 0;

  while (index < text.length) {
    if (text.startsWith("%%TOOL%%", index)) {
      tokens.push("%%TOOL%%");
      index += "%%TOOL%%".length;
      continue;
    }

    if (text[index] === "<") {
      const end = text.indexOf(">", index + 1);
      if (end !== -1) {
        tokens.push(text.slice(index, end + 1));
        index = end + 1;
        continue;
      }
    }

    if (text[index] === "{") {
      let depth = 0;
      let end = -1;
      for (let cursor = index; cursor < text.length; cursor += 1) {
        if (text[cursor] === "{") depth += 1;
        else if (text[cursor] === "}") {
          depth -= 1;
          if (depth === 0) {
            end = cursor;
            break;
          }
        }
      }
      if (end !== -1) {
        const inner = text.slice(index + 1, end);
        if (/^[A-Za-z_][\w]*$/u.test(inner)) {
          tokens.push(`{${inner}}`);
        } else if (/\b(plural|select)\b/u.test(inner)) {
          tokens.push(`icu:${inner.split(",")[0].trim()}`);
          if (inner.includes("#")) tokens.push("icuHash");
        }
        index = end + 1;
        continue;
      }
    }

    index += 1;
  }

  return tokens;
}

export function sameTokens(left, right) {
  const a = extractTokens(left).sort();
  const b = extractTokens(right).sort();
  return a.length === b.length && a.every((token, index) => token === b[index]);
}

/**
 * Detects symbol damage that must never appear in a translated UI value:
 * stray ">>" / ">" and unmatched straight quotes. <tag> markup is ignored.
 */
export function hasStraySymbols(value) {
  const text = String(value ?? "");
  const withoutMarkup = text.replace(/<[^>]*>/g, "");
  if (withoutMarkup.includes(">")) return true;
  const straightQuotes = (text.match(/"/g) ?? []).length;
  return straightQuotes % 2 !== 0;
}

/** Groups keys into the three buckets used by the QA summary. */
export function namespaceOf(key) {
  if (key.includes(".seo.")) return "seo";
  if (key.includes(".page.")) return "page";
  return "UI";
}

/** Counts values still byte-identical to English, grouped by namespace. */
export function englishSummary(sourceFlat, targetFlat) {
  const summary = { seo: 0, page: 0, UI: 0, total: 0 };
  for (const [key, value] of Object.entries(sourceFlat)) {
    if (typeof value !== "string") continue;
    if (targetFlat[key] === value) {
      summary[namespaceOf(key)] += 1;
      summary.total += 1;
    }
  }
  return summary;
}

export function formatSummary(summary) {
  return `seo: ${summary.seo}, page: ${summary.page}, UI: ${summary.UI} (total ${summary.total})`;
}
