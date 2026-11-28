"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  ToolEmpty,
  ToolPane,
  useCopyFeedback,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  buildFancyResult,
  MAX_TEXT_LENGTH,
  type FancyErrorCode,
  type FancyStyleId,
} from "./fancy-text-generator.logic";

const ERROR_ID = "tp-fancy-text-error";

const STYLE_LABEL_KEYS: Record<FancyStyleId, string> = {
  bold: "fancy-text-generator.styleBold",
  italic: "fancy-text-generator.styleItalic",
  monospace: "fancy-text-generator.styleMonospace",
  strikethrough: "fancy-text-generator.styleStrikethrough",
  script: "fancy-text-generator.styleScript",
};

export default function FancyTextGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [text, setText] = useState("");
  const [selected, setSelected] = useState<FancyStyleId>("bold");
  const [copiedId, setCopiedId] = useState<FancyStyleId | null>(null);
  const { copied, copy } = useCopyFeedback();

  const result = useMemo(() => buildFancyResult(text), [text]);

  const errorText = (() => {
    const code: FancyErrorCode | undefined = result.error?.code;
    switch (code) {
      case "EMPTY_TEXT":
        return `${tw("fancy-text-generator.errorEmpty")} ${tw("fancy-text-generator.fixEmpty")}`;
      case "TOO_LONG":
        return `${tw("fancy-text-generator.errorTooLong", { max: MAX_TEXT_LENGTH })} ${tw("fancy-text-generator.fixTooLong")}`;
      case "NO_LETTERS":
        return `${tw("fancy-text-generator.errorNoLetters")} ${tw("fancy-text-generator.fixNoLetters")}`;
      default:
        return "";
    }
  })();

  const activeVariant = result.variants.find((variant) => variant.id === selected);
  const ready = result.variants.length > 0 && !errorText;

  const handleVariant = useCallback(
    async (id: FancyStyleId, value: string) => {
      const ok = await copy(value);
      if (ok) {
        setSelected(id);
        setCopiedId(id);
      }
    },
    [copy],
  );

  const handleCopyShortcut = useCallback(() => {
    const variant = result.variants.find((item) => item.id === selected) ?? result.variants[0];
    if (variant) void copy(variant.text);
  }, [copy, result.variants, selected]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setText(tw("fancy-text-generator.sampleText"));
    setSelected("bold");
    setCopiedId(null);
  };

  const handleReset = () => {
    setText("");
    setSelected("bold");
    setCopiedId(null);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setCopiedId(null);
  };

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Sparkles" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("fancy-text-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("fancy-text-generator.subtitle")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("fancy-text-generator.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("fancy-text-generator.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="tp-fancy-text-input-title"
          title={tw("fancy-text-generator.inputTitle")}
          hint={tw("fancy-text-generator.inputHint")}
        >
          <div className="flex flex-col gap-2">
            <label className="tp-tool-label" htmlFor="tp-fancy-text-input">
              {tw("fancy-text-generator.inputLabel")}
            </label>
            <textarea
              id="tp-fancy-text-input"
              className="tp-field-input tp-tool-editor"
              value={text}
              rows={5}
              placeholder={t("startTyping")}
              aria-describedby={errorText ? ERROR_ID : undefined}
              onChange={(event) => handleTextChange(event.target.value)}
              spellCheck={false}
            />
            <p className="tp-tool-hint">
              {result.inputCharacters} {t("characters")}
              {ready ? ` · ${result.mappedCharacters} ${tw("fancy-text-generator.mappedLabel")}` : ""}
            </p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>

        <ToolPane
          id="tp-fancy-text-result-title"
          title={tw("fancy-text-generator.resultTitle")}
          hint={tw("fancy-text-generator.resultHint")}
          actions={
            <CopyButton
              text={ready && activeVariant ? activeVariant.text : ""}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Sparkles aria-hidden="true" />}
                title={tw("fancy-text-generator.emptyTitle")}
                hint={errorText
                  ? tw("fancy-text-generator.errorEmptyHint")
                  : tw("fancy-text-generator.emptyHint")}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-live="polite">
              {result.variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3 text-start transition-colors hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  aria-label={`${tw(STYLE_LABEL_KEYS[variant.id])} ${t("copy")}`}
                  aria-pressed={selected === variant.id}
                  onClick={() => void handleVariant(variant.id, variant.text)}
                >
                  <span className="tp-tool-label">
                    {tw(STYLE_LABEL_KEYS[variant.id])}
                    {copiedId === variant.id && copied ? ` · ${t("copied")}` : ""}
                  </span>
                  <output dir="ltr" className="block min-w-0 break-words font-mono text-sm leading-relaxed text-[var(--text)]">
                    {variant.text}
                  </output>
                </button>
              ))}
            </div>
          )}
          <p className="tp-tool-hint">{tw("fancy-text-generator.copyHint")}</p>
        </ToolPane>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("fancy-text-generator.privacyRibbon")}
        </span>
        <span className="tp-tool-hint">{tw("fancy-text-generator.shortcutHint")}</span>
      </div>
    </div>
  );
}
