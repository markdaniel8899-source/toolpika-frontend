"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  ENTITY_DEFAULTS,
  transformEntities,
  type EntityMode,
  type EntityStyle,
} from "./html-entity-encoder.logic";

const SAMPLE = `Tom & Jerry said "it's <b>bold</b>" and left > home`;

const WARNING_ID = "tp-html-entity-warning";

interface EntityOptions {
  mode: EntityMode;
  style: EntityStyle;
}

export default function HtmlEntityEncoder() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<EntityOptions>(
    "tp-html-entity-encoder-options",
    ENTITY_DEFAULTS,
  );

  const result = useMemo(
    () => (input.trim() ? transformEntities(input, options.mode, options.style) : null),
    [input, options],
  );
  const output = result?.output ?? "";
  const unknown = result?.unknown[0] ?? "";

  const handleCopy = useCallback(() => {
    if (!output) return;
    void navigator.clipboard.writeText(output).catch(() => undefined);
  }, [output]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setInput(SAMPLE);
    resetOptions();
  };

  const handleReset = () => {
    setInput("");
    resetOptions();
  };

  const modeOptions: { value: EntityMode; label: string }[] = [
    { value: "encode", label: t("encode") },
    { value: "decode", label: t("decode") },
  ];
  const styleOptions: { value: EntityStyle; label: string }[] = [
    { value: "named", label: tw("html-entity-encoder.styleNamed") },
    { value: "numeric", label: tw("html-entity-encoder.styleNumeric") },
  ];

  return (
    <ToolShell
      title={tw("html-entity-encoder.title")}
      subtitle={tw("html-entity-encoder.shortDesc")}
      icon="Code"
      sampleLabel={tw("html-entity-encoder.trySample")}
      resetLabel={tw("html-entity-encoder.reset")}
      privacyLabel={tw("html-entity-encoder.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-html-entity-input-title"
          title={tw("html-entity-encoder.inputTitle")}
          hint={tw("html-entity-encoder.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!input}
              onClick={() => setInput("")}
            >
              {t("clear")}
            </Button>
          }
        >
          <textarea
            id="tp-html-entity-source"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={tw("html-entity-encoder.placeholder")}
            aria-label={tw("html-entity-encoder.inputTitle")}
            aria-describedby={unknown ? WARNING_ID : undefined}
            spellCheck={false}
            className="tp-tool-editor"
          />

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("html-entity-encoder.directionLabel")}</span>
            <SegmentedControl<EntityMode>
              label={tw("html-entity-encoder.directionLabel")}
              value={options.mode}
              options={modeOptions}
              onChange={(mode) => update({ mode })}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("html-entity-encoder.styleLabel")}</span>
            <SegmentedControl<EntityStyle>
              label={tw("html-entity-encoder.styleLabel")}
              value={options.style}
              options={styleOptions}
              onChange={(style) => update({ style })}
            />
            <p className="tp-tool-hint">{tw("html-entity-encoder.styleHint")}</p>
          </div>

          {unknown ? (
            <p id={WARNING_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {tw("html-entity-encoder.errorUnknown", { entity: unknown })}
              {" "}
              {tw("html-entity-encoder.fixUnknown")}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-html-entity-result-title"
          title={tw("html-entity-encoder.resultTitle")}
          hint={tw("html-entity-encoder.resultHint")}
          result
          actions={<CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />}
          footer={
            result ? (
              <ToolBadge tone="success">{tw("html-entity-encoder.readyBadge")}</ToolBadge>
            ) : null
          }
        >
          {result ? (
            <div className="tp-tool-result" aria-live="polite">
              <textarea
                value={output}
                readOnly
                aria-label={tw("html-entity-encoder.resultTitle")}
                spellCheck={false}
                dir="ltr"
                className="tp-tool-editor"
              />
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("html-entity-encoder.changesStat")}
                  value={result.replacements}
                />
                <Stat
                  label={tw("html-entity-encoder.lengthStat")}
                  value={`${Array.from(input).length} → ${Array.from(output).length}`}
                />
              </dl>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Code aria-hidden="true" />}
                title={tw("html-entity-encoder.emptyTitle")}
                hint={tw("html-entity-encoder.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
