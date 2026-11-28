"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  selectClassName,
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
  boldSerif: "fancy-text-generator.styleBoldSerif",
  italicSerif: "fancy-text-generator.styleItalicSerif",
  boldItalic: "fancy-text-generator.styleBoldItalic",
  script: "fancy-text-generator.styleScript",
  boldScript: "fancy-text-generator.styleBoldScript",
  monospace: "fancy-text-generator.styleMonospace",
  fraktur: "fancy-text-generator.styleFraktur",
  boldFraktur: "fancy-text-generator.styleBoldFraktur",
  doubleStruck: "fancy-text-generator.styleDoubleStruck",
  sansSerif: "fancy-text-generator.styleSansSerif",
  sansSerifBold: "fancy-text-generator.styleSansSerifBold",
  sansSerifItalic: "fancy-text-generator.styleSansSerifItalic",
  sansSerifBoldItalic: "fancy-text-generator.styleSansSerifBoldItalic",
  circled: "fancy-text-generator.styleCircled",
  squared: "fancy-text-generator.styleSquared",
  strikethrough: "fancy-text-generator.styleStrikethrough",
};

export default function FancyTextGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<FancyStyleId>("boldSerif");
  const [copiedId, setCopiedId] = useState<FancyStyleId | null>(null);
  const { copied, copy, reset: resetCopy } = useCopyFeedback();

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

  const ready = result.variants.length > 0 && !errorText;
  const selectedVariant = result.variants.find((variant) => variant.id === selected)
    ?? result.variants[0];
  const selectedText = selectedVariant?.text ?? "";
  const selectedLabel = selectedVariant
    ? tw(STYLE_LABEL_KEYS[selectedVariant.id])
    : "";

  const reportText = useMemo(
    () => (ready
      ? result.variants
        .map((variant) => `${tw(STYLE_LABEL_KEYS[variant.id])}: ${variant.text}`)
        .join("\n")
      : ""),
    [ready, result.variants, tw],
  );

  const handleVariant = useCallback(async (id: FancyStyleId, value: string) => {
    const ok = await copy(value);
    if (ok) {
      setSelected(id);
      setCopiedId(id);
    }
  }, [copy]);

  const handleCopyShortcut = useCallback(() => {
    if (selectedText) void copy(selectedText);
  }, [copy, selectedText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setText(tw("fancy-text-generator.sampleText"));
    setSelected("boldSerif");
    setCopiedId(null);
    resetCopy();
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setText("");
    setSelected("boldSerif");
    setCopiedId(null);
    resetCopy();
    inputRef.current?.focus();
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setCopiedId(null);
    resetCopy();
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Sparkles" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("fancy-text-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("fancy-text-generator.subtitle")}</span>
          </span>
        </div>
        <ToolBadge tone="accent">
          {tw("fancy-text-generator.styleCountBadge", { count: result.variants.length || 16 })}
        </ToolBadge>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="default" size="sm" onClick={handleSample}>
            {tw("fancy-text-generator.trySample")}
          </Button>
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-12 lg:sticky lg:top-4 lg:z-10"
          aria-labelledby="tp-fancy-text-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-fancy-text-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("fancy-text-generator.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("fancy-text-generator.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <label htmlFor="tp-fancy-text-input" className="text-sm font-medium text-[var(--text)]">
            {tw("fancy-text-generator.inputLabel")}
          </label>
          <input
            id="tp-fancy-text-input"
            ref={inputRef}
            type="text"
            autoComplete="off"
            className={`${selectClassName} font-mono`}
            value={text}
            placeholder={t("startTyping")}
            aria-invalid={Boolean(errorText) || undefined}
            aria-describedby={errorText ? ERROR_ID : undefined}
            onChange={(event) => handleTextChange(event.target.value)}
            spellCheck={false}
          />

          <div className="tp-meta-pill" aria-live="polite">
            <span>{t("characters")}</span>
            <strong dir="ltr">{result.inputCharacters}</strong>
            {ready ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{tw("fancy-text-generator.mappedLabel")}</span>
                <strong dir="ltr">{result.mappedCharacters}</strong>
              </>
            ) : null}
            <span aria-hidden="true">•</span>
            <span>{tw("fancy-text-generator.maxLabel", { max: MAX_TEXT_LENGTH })}</span>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-notice" data-tone="danger" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-12"
          aria-labelledby="tp-fancy-text-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-fancy-text-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("fancy-text-generator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("fancy-text-generator.stylesHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton
                text={selectedText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={reportText || null}
                fileName={tw("fancy-text-generator.downloadFileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {ready ? (
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-live="polite"
            >
              {result.variants.map((variant) => {
                const label = tw(STYLE_LABEL_KEYS[variant.id]);
                const isCopied = copiedId === variant.id && copied;
                return (
                  <div
                    key={variant.id}
                    className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <div className="tp-industrial-bar">
                      <span className="tp-tool-label">{label}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={isCopied ? "default" : "secondary"}
                        aria-label={`${t("copy")} ${label}`}
                        onClick={() => void handleVariant(variant.id, variant.text)}
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                        {isCopied ? t("copied") : t("copy")}
                      </Button>
                    </div>
                    <output dir="ltr" className="block min-w-0 break-words font-mono text-sm leading-relaxed text-[var(--text)]">
                      {variant.text}
                    </output>
                    {selectedVariant?.id === variant.id ? (
                      <span className="tp-tool-hint">{tw("fancy-text-generator.selectedHint")}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Sparkles" />}
                title={tw("fancy-text-generator.emptyTitle")}
                hint={errorText
                  ? tw("fancy-text-generator.gridErrorHint")
                  : tw("fancy-text-generator.gridEmptyHint")}
              />
            </div>
          )}
          <p className="tp-tool-hint">
            {selectedLabel ? `${tw("fancy-text-generator.lastStyleHint")} ${selectedLabel}` : tw("fancy-text-generator.copyHint")}
          </p>
        </section>
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
