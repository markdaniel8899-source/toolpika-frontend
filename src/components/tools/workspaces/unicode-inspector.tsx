"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  UNICODE_DEFAULTS,
  inspectUnicode,
  type CharacterInfo,
  type StripOptions,
  type UnicodeCategory,
} from "./unicode-inspector.logic";

const SAMPLE = "Private\u200Bnote\u00A0with\u00ADhidden\u200Fmarks";

const CATEGORY_KEYS: ReadonlyArray<{ key: keyof StripOptions; label: string }> = [
  { key: "zeroWidth", label: "unicode-inspector.stripZeroWidth" },
  { key: "nonBreaking", label: "unicode-inspector.stripNonBreaking" },
  { key: "directional", label: "unicode-inspector.stripDirectional" },
  { key: "control", label: "unicode-inspector.stripControl" },
];

const SHORT_TAGS: Readonly<Record<number, string>> = {
  0x00ad: "SHY",
  0x00a0: "NBSP",
  0x061c: "ALM",
  0x180e: "MVS",
  0x200b: "ZWSP",
  0x200c: "ZWNJ",
  0x200d: "ZWJ",
  0x200e: "LRM",
  0x200f: "RLM",
  0x202a: "LRE",
  0x202b: "RLE",
  0x202c: "PDF",
  0x202d: "LRO",
  0x202e: "RLO",
  0x202f: "NNBSP",
  0x2060: "WJ",
  0x2061: "FA",
  0x2062: "IT",
  0x2063: "IS",
  0x2064: "IP",
  0x2066: "LRI",
  0x2067: "RLI",
  0x2068: "FSI",
  0x2069: "PDI",
  0xfeff: "BOM",
};

function shortTag(info: CharacterInfo): string {
  return SHORT_TAGS[info.codePoint] ?? (info.category === "control" ? "CTRL" : info.hex);
}

function utf8Hex(character: string): string {
  return Array.from(new TextEncoder().encode(character))
    .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
    .join(" ");
}

export default function UnicodeInspector() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");
  const { options: strip, update, reset: resetOptions } = usePersistedOptions<StripOptions>(
    "tp-unicode-inspector-options",
    UNICODE_DEFAULTS,
  );

  const inspection = useMemo(
    () => (input ? inspectUnicode(input, strip) : null),
    [input, strip],
  );

  const cleaned = inspection?.cleaned ?? "";
  const flagged = inspection?.flagged ?? 0;

  const handleCopy = useCallback(() => {
    if (!cleaned) return;
    void navigator.clipboard.writeText(cleaned).catch(() => undefined);
  }, [cleaned]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setInput(SAMPLE);
    resetOptions();
  };

  const handleClear = () => setInput("");

  const handleStrip = () => {
    if (cleaned) setInput(cleaned);
  };

  const categoryLabels: Record<UnicodeCategory, string> = {
    zeroWidth: tw("unicode-inspector.categoryZeroWidth"),
    nonBreaking: tw("unicode-inspector.categoryNonBreaking"),
    directional: tw("unicode-inspector.categoryDirectional"),
    control: tw("unicode-inspector.categoryControl"),
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="ScanText" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("unicode-inspector.title")}</span>
            <span className="tp-tool-subtitle">{tw("unicode-inspector.shortDesc")}</span>
          </span>
        </div>
        <ToolBadge tone={flagged > 0 ? "warning" : "success"}>
          {tw("unicode-inspector.hiddenBadge", { count: flagged })}
        </ToolBadge>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-12"
          aria-labelledby="tp-unicode-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-unicode-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("unicode-inspector.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("unicode-inspector.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
                {tw("unicode-inspector.trySample")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <label htmlFor="tp-unicode-source" className="text-sm font-medium text-[var(--text)]">
            {tw("unicode-inspector.textLabel")}
          </label>
          <textarea
            id="tp-unicode-source"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={tw("unicode-inspector.placeholder")}
            aria-label={tw("unicode-inspector.textLabel")}
            spellCheck={false}
            dir="ltr"
            rows={4}
            className="tp-tool-editor"
          />

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("unicode-inspector.stripTitle")}</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_KEYS.map((category) => (
                <Button
                  key={category.key}
                  type="button"
                  size="sm"
                  variant={strip[category.key] ? "secondary" : "ghost"}
                  aria-pressed={strip[category.key]}
                  onClick={() => update({ [category.key]: !strip[category.key] } as Partial<StripOptions>)}
                >
                  {tw(category.label)}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="default"
                disabled={flagged === 0}
                onClick={handleStrip}
              >
                {tw("unicode-inspector.stripHidden")}
              </Button>
            </div>
            <p className="tp-tool-hint">{tw("unicode-inspector.stripHint")}</p>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <span>{tw("unicode-inspector.statTotal")}</span>
            <strong dir="ltr">{inspection?.total ?? 0}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("unicode-inspector.heroLabel")}</span>
            <strong dir="ltr">{flagged}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("unicode-inspector.statUnique")}</span>
            <strong dir="ltr">{inspection?.unique ?? 0}</strong>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-12"
          aria-labelledby="tp-unicode-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-unicode-result-title" className="text-sm font-semibold text-[var(--text)]">
                {t("results")}
              </h3>
              <p className="tp-tool-hint">{tw("unicode-inspector.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={cleaned} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={cleaned || null}
                fileName={tw("unicode-inspector.downloadFileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {inspection ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-group-title">{tw("unicode-inspector.tokenStripTitle")}</span>
                <div className="flex flex-wrap items-center gap-1" dir="ltr">
                  {inspection.characters.map((character) => (
                    character.category ? (
                      <ToolBadge key={`${character.index}-${character.hex}`} tone="warning">
                        {shortTag(character)}
                      </ToolBadge>
                    ) : (
                      <span
                        key={`${character.index}-${character.hex}`}
                        className="inline-flex min-w-[18px] items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--bg)] px-1 py-0.5 font-mono text-[11px] text-[var(--text)]"
                      >
                        {character.char}
                      </span>
                    )
                  ))}
                </div>
                <p className="tp-tool-hint">{tw("unicode-inspector.tokenHint")}</p>
              </div>

              {inspection.issues.length > 0 ? (
                <div className="tp-tool-group tp-tool-group--flush">
                  <span className="tp-tool-group-title">{tw("unicode-inspector.tableTitle")}</span>
                  <div
                    className="flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)]"
                    role="table"
                    aria-label={tw("unicode-inspector.tableTitle")}
                  >
                    <div
                      className="grid grid-cols-[auto_auto_auto_1fr] gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
                      role="row"
                    >
                      <span role="columnheader">{tw("unicode-inspector.tableChar")}</span>
                      <span role="columnheader">{tw("unicode-inspector.tableUnicode")}</span>
                      <span role="columnheader">{tw("unicode-inspector.tableUtf8")}</span>
                      <span role="columnheader">{tw("unicode-inspector.tableName")}</span>
                    </div>
                    {inspection.issues.map((issue) => (
                      <div
                        className="grid grid-cols-[auto_auto_auto_1fr] gap-2 px-3 py-2 text-[12px] text-[var(--text)]"
                        role="row"
                        key={`${issue.index}-${issue.hex}`}
                      >
                        <span role="cell" dir="ltr" className="font-mono">{shortTag(issue)}</span>
                        <span role="cell" dir="ltr" className="font-mono">{issue.hex}</span>
                        <span role="cell" dir="ltr" className="font-mono">{utf8Hex(issue.char)}</span>
                        <span role="cell">{issue.name} ({categoryLabels[issue.category as UnicodeCategory]})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ToolEmpty
                  icon={<Check aria-hidden="true" />}
                  title={tw("unicode-inspector.allClearTitle")}
                  hint={tw("unicode-inspector.allClearHint")}
                />
              )}

              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("unicode-inspector.cleanLabel")}</span>
                <div
                  className="tp-output-viewer"
                  role="region"
                  aria-label={tw("unicode-inspector.cleanLabel")}
                >
                  <code dir="ltr">{cleaned}</code>
                </div>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="ScanText" />}
                title={tw("unicode-inspector.emptyTitle")}
                hint={tw("unicode-inspector.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("unicode-inspector.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
