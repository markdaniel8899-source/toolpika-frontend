"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CheckboxRow,
  CopyButton,
  OutputEmpty,
  ToolBadge,
  ToolField,
  ToolPane,
  ToolShell,
} from "../workspace-ui";

const SAMPLE = "Hello, World! This is a Sample Slug — with Café résumé.";

export type SlugOptions = {
  separator?: "-" | "_";
  stripDiacritics?: boolean;
};

/**
 * Pure slug builder: lowercase, strip accents when asked, drop punctuation,
 * collapse whitespace and join words with the chosen separator. No DOM access.
 */
export function textToSlug(input: string, options: SlugOptions = {}): string {
  const { separator = "-", stripDiacritics = true } = options;
  let value = input.trim().toLowerCase();

  if (stripDiacritics) {
    value = value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  const words = value
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  return words ? words.split(" ").join(separator) : "";
}

export default function SlugGenerator() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const [text, setText] = useState("");
  const [separator, setSeparator] = useState<"-" | "_">("-");
  const [stripDiacritics, setStripDiacritics] = useState(true);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const slug = useMemo(
    () => textToSlug(text, { separator, stripDiacritics }),
    [text, separator, stripDiacritics],
  );

  const separatorOptions = [
    { value: "-", label: t("slug-generator.hyphen") },
    { value: "_", label: t("slug-generator.underscore") },
  ];

  const status = error
    ? t("statusError")
    : slug
      ? t("statusReady")
      : t("statusIdle");

  const handleReset = () => {
    setText("");
    setSeparator("-");
    setStripDiacritics(true);
    setError(false);
    inputRef.current?.focus();
  };

  const handleSample = () => {
    setText(SAMPLE);
    setError(false);
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((previous) => (previous ? `${previous}\n${clip}` : clip));
        setError(false);
      }
    } catch {
      setError(true);
    }
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setText("");
    setError(false);
    inputRef.current?.focus();
  };

  return (
    <ToolShell
      title={t("slug-generator.title")}
      icon="Link"
      sampleLabel={t("trySample")}
      resetLabel={t("reset")}
      privacyLabel={t("privacyRibbon")}
      onReset={handleReset}
      onSample={handleSample}
      input={
        <ToolPane
          id="slug-input-title"
          title={t("input")}
          actions={
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {t("paste")}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={!text} onClick={handleClear}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("clear")}
              </Button>
            </>
          }
          footer={<span aria-live="polite">{text.length} {tu("characters").toLowerCase()}</span>}
        >
          <Textarea
            ref={inputRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(false);
            }}
            placeholder={tu("startTyping")}
            aria-label={tu("pasteText")}
            className="tp-tool-editor min-h-[200px]"
          />
          <ToolField label={t("slug-generator.separator")}>
            <ThemedSelect
              value={separator}
              onValueChange={(next) => setSeparator(next === "_" ? "_" : "-")}
              options={separatorOptions}
              ariaLabel={t("slug-generator.separator")}
            />
          </ToolField>
          <CheckboxRow
            id="slug-diacritics"
            label={t("slug-generator.stripDiacritics")}
            checked={stripDiacritics}
            onChange={setStripDiacritics}
          />
          {error ? (
            <p className="tp-tool-error" role="alert">
              {tu("error")}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="slug-result-title"
          title={t("result")}
          result
          actions={
            <ToolBadge tone={error ? "danger" : slug ? "success" : "neutral"}>
              {status}
            </ToolBadge>
          }
        >
          {slug ? (
            <div className="tp-tool-result" aria-live="polite">
              <div className="tp-tool-url">
                <code>{slug}</code>
              </div>
              <CopyButton text={slug} label={tu("copy")} copiedLabel={tu("copied")} />
            </div>
          ) : (
            <OutputEmpty message={t("resultEmpty")} className="min-h-[140px]" />
          )}
        </ToolPane>
      }
    />
  );
}
