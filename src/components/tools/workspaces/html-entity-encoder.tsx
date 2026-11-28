"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  useCopyShortcut,
  usePersistedOptions,
} from "../workspace-ui";
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
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
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

  const handleCopy = () => {
    if (!output) return;
    void navigator.clipboard.writeText(output).catch(() => undefined);
  };
  useCopyShortcut(handleCopy);

  const clearAll = () => {
    setInput("");
    inputRef.current?.focus();
  };

  const handleSample = () => {
    setInput(SAMPLE);
    resetOptions();
    inputRef.current?.focus();
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
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Code" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("html-entity-encoder.title")}</span>
            <span className="tp-tool-subtitle">{tw("html-entity-encoder.shortDesc")}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl<EntityMode>
            label={tw("html-entity-encoder.directionLabel")}
            value={options.mode}
            options={modeOptions}
            onChange={(mode) => update({ mode })}
          />
          <SegmentedControl<EntityStyle>
            label={tw("html-entity-encoder.styleLabel")}
            value={options.style}
            options={styleOptions}
            onChange={(style) => update({ style })}
          />
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-html-entity-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-html-entity-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("html-entity-encoder.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("html-entity-encoder.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
                {tw("html-entity-encoder.trySample")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-html-entity-source" className="text-sm font-medium text-[var(--text)]">
              {tw("html-entity-encoder.inputTitle")}
            </label>
            <textarea
              id="tp-html-entity-source"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tw("html-entity-encoder.placeholder")}
              className="tp-tool-editor"
              rows={12}
              dir="ltr"
              aria-label={tw("html-entity-encoder.inputTitle")}
              aria-invalid={Boolean(unknown)}
              aria-describedby={unknown ? WARNING_ID : undefined}
              spellCheck={false}
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

          <div className="tp-meta-pill" aria-live="polite">
            <span>{t("characters")}</span>
            <strong dir="ltr">{Array.from(input).length}</strong>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="tp-html-entity-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-html-entity-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("html-entity-encoder.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("html-entity-encoder.resultHint")}</p>
            </div>
            <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            {result ? (
              <ToolBadge tone="success">{tw("html-entity-encoder.readyBadge")}</ToolBadge>
            ) : null}
            {result ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{tw("html-entity-encoder.changesStat")}</span>
                <strong dir="ltr">{result.replacements}</strong>
                <span aria-hidden="true">•</span>
                <span>{tw("html-entity-encoder.lengthStat")}</span>
                <strong dir="ltr">{Array.from(input).length} → {Array.from(output).length}</strong>
              </>
            ) : null}
          </div>

          {result ? (
            <div className="tp-output-viewer" role="region" aria-label={tw("html-entity-encoder.resultTitle")} aria-live="polite">
              <code dir="ltr">{output}</code>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Code" />}
                title={tw("html-entity-encoder.emptyTitle")}
                hint={tw("html-entity-encoder.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("html-entity-encoder.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
