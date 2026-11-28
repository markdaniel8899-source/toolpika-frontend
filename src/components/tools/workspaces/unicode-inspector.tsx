"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, RotateCcw, ScanText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  HeroValue,
  Stat,
  ToolEmpty,
  ToolField,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  UNICODE_DEFAULTS,
  inspectUnicode,
  type StripOptions,
  type UnicodeCategory,
} from "./unicode-inspector.logic";

const SAMPLE = "Private\u200Bnote\u00A0with\u00ADhidden\u200Fmarks";

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

  const handleCopy = useCallback(() => {
    const cleaned = inspection?.cleaned;
    if (!cleaned) return;
    void navigator.clipboard.writeText(cleaned).catch(() => undefined);
  }, [inspection]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setInput(SAMPLE);
    resetOptions();
  };

  const handleReset = () => {
    setInput("");
    resetOptions();
  };

  const categoryLabels: Record<UnicodeCategory, string> = {
    zeroWidth: tw("unicode-inspector.categoryZeroWidth"),
    nonBreaking: tw("unicode-inspector.categoryNonBreaking"),
    directional: tw("unicode-inspector.categoryDirectional"),
    control: tw("unicode-inspector.categoryControl"),
  };

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="ScanText" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("unicode-inspector.title")}</span>
            <span className="tp-tool-subtitle">{tw("unicode-inspector.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("unicode-inspector.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("unicode-inspector.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <section className="tp-tool-pane" aria-labelledby="tp-unicode-input-title">
          <div className="tp-tool-pane-head">
            <div className="tp-tool-pane-title">
              <h3 id="tp-unicode-input-title">{tw("unicode-inspector.inputTitle")}</h3>
              <p className="tp-tool-pane-hint">{tw("unicode-inspector.inputHint")}</p>
            </div>
          </div>
          <div className="tp-tool-pane-body">
            <ToolField label={tw("unicode-inspector.textLabel")} htmlFor="tp-unicode-source">
              <textarea
                id="tp-unicode-source"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={tw("unicode-inspector.placeholder")}
                aria-label={tw("unicode-inspector.textLabel")}
                spellCheck={false}
                className="tp-tool-editor"
              />
            </ToolField>

            <div className="tp-tool-group tp-tool-group--flush">
              <span className="tp-tool-group-title">{tw("unicode-inspector.stripTitle")}</span>
              <CheckboxRow
                id="tp-unicode-zero-width"
                label={tw("unicode-inspector.stripZeroWidth")}
                checked={strip.zeroWidth}
                onChange={(zeroWidth) => update({ zeroWidth })}
              />
              <CheckboxRow
                id="tp-unicode-non-breaking"
                label={tw("unicode-inspector.stripNonBreaking")}
                checked={strip.nonBreaking}
                onChange={(nonBreaking) => update({ nonBreaking })}
              />
              <CheckboxRow
                id="tp-unicode-directional"
                label={tw("unicode-inspector.stripDirectional")}
                checked={strip.directional}
                onChange={(directional) => update({ directional })}
              />
              <CheckboxRow
                id="tp-unicode-control"
                label={tw("unicode-inspector.stripControl")}
                checked={strip.control}
                onChange={(control) => update({ control })}
              />
              <p className="tp-tool-hint">{tw("unicode-inspector.stripHint")}</p>
            </div>
          </div>
        </section>

        <section
          className="tp-tool-pane tp-tool-pane--result"
          aria-labelledby="tp-unicode-result-title"
        >
          <div className="tp-tool-pane-head">
            <div className="tp-tool-pane-title">
              <h3 id="tp-unicode-result-title">{t("results")}</h3>
              <p className="tp-tool-pane-hint">{tw("unicode-inspector.resultHint")}</p>
            </div>
            {inspection ? (
              <div className="tp-tool-pane-actions">
                <CopyButton
                  text={inspection.cleaned}
                  label={t("copy")}
                  copiedLabel={t("copied")}
                />
              </div>
            ) : null}
          </div>
          <div className="tp-tool-pane-body">
            {inspection ? (
              <div className="tp-tool-result" aria-live="polite">
                <HeroValue
                  label={tw("unicode-inspector.heroLabel")}
                  value={String(inspection.flagged)}
                  note={tw("unicode-inspector.heroNote")}
                />

                <dl className="tp-tool-stats">
                  <Stat label={tw("unicode-inspector.statTotal")} value={inspection.total} />
                  <Stat label={tw("unicode-inspector.statUnique")} value={inspection.unique} />
                  <Stat
                    label={tw("unicode-inspector.statCleaned")}
                    value={Array.from(inspection.cleaned).length}
                  />
                </dl>

                {inspection.issues.length > 0 ? (
                  <div className="tp-tool-group tp-tool-group--flush">
                    <span className="tp-tool-group-title">{tw("unicode-inspector.tableTitle")}</span>
                    <div
                      className="flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)]"
                      role="table"
                      aria-label={tw("unicode-inspector.tableTitle")}
                    >
                      <div
                        className="grid grid-cols-[auto_auto_1fr_auto] gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]"
                        role="row"
                      >
                        <span role="columnheader">{tw("unicode-inspector.tableIndex")}</span>
                        <span role="columnheader">{tw("unicode-inspector.tableCode")}</span>
                        <span role="columnheader">{tw("unicode-inspector.tableName")}</span>
                        <span role="columnheader">{tw("unicode-inspector.tableCategory")}</span>
                      </div>
                      {inspection.issues.map((issue) => (
                        <div
                          className="grid grid-cols-[auto_auto_1fr_auto] gap-2 px-3 py-2 text-[12px] text-[var(--text)] [overflow-wrap:anywhere]"
                          role="row"
                          key={`${issue.index}-${issue.hex}`}
                        >
                          <span role="cell" dir="ltr">{issue.index + 1}</span>
                          <span role="cell" dir="ltr">{issue.hex}</span>
                          <span role="cell">{issue.name}</span>
                          <span role="cell">{categoryLabels[issue.category as UnicodeCategory]}</span>
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

                <ToolField
                  label={tw("unicode-inspector.cleanLabel")}
                  htmlFor="tp-unicode-cleaned"
                >
                  <textarea
                    id="tp-unicode-cleaned"
                    value={inspection.cleaned}
                    readOnly
                    aria-label={tw("unicode-inspector.cleanLabel")}
                    spellCheck={false}
                    className="tp-tool-editor"
                  />
                </ToolField>
              </div>
            ) : (
              <div aria-live="polite">
                <ToolEmpty
                  icon={<ScanText aria-hidden="true" />}
                  title={tw("unicode-inspector.emptyTitle")}
                  hint={tw("unicode-inspector.emptyHint")}
                />
              </div>
            )}
          </div>
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
