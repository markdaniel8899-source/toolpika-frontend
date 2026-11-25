"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import {
  CopyButton,
  OutputEmpty,
  selectClassName,
  ToolField,
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
    <WorkspaceLayout
      title={t("slug-generator.title")}
      icon="Link"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={slug ? `${slug.length} ${tu("characters")}` : undefined}
      input={
        <div className="flex flex-col gap-3">
          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              {t("paste")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!text}
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
          <Textarea
            ref={inputRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setError(false);
            }}
            placeholder={tu("startTyping")}
            aria-label={tu("pasteText")}
            className="min-h-[240px]"
          />
          <p className="tp-workspace-hint" aria-live="polite">
            {text.length} {tu("characters").toLowerCase()}
          </p>
          {error ? (
            <p className="tp-workspace-error" role="alert">
              {tu("error")}
            </p>
          ) : null}
        </div>
      }
      output={
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ToolField label={t("slug-generator.separator")} htmlFor="slug-separator">
              <select
                id="slug-separator"
                className={selectClassName}
                value={separator}
                onChange={(event) =>
                  setSeparator(event.target.value === "_" ? "_" : "-")
                }
              >
                <option value="-">{t("slug-generator.hyphen")}</option>
                <option value="_">{t("slug-generator.underscore")}</option>
              </select>
            </ToolField>

            <ToolField
              label={t("slug-generator.stripDiacritics")}
              htmlFor="slug-diacritics"
            >
              <label
                htmlFor="slug-diacritics"
                className="tp-field-input flex cursor-pointer items-center gap-3"
              >
                <input
                  id="slug-diacritics"
                  type="checkbox"
                  checked={stripDiacritics}
                  onChange={(event) => setStripDiacritics(event.target.checked)}
                  className="h-4 w-4 accent-[var(--accent-fill)]"
                />
                {t("slug-generator.stripDiacritics")}
              </label>
            </ToolField>
          </div>

          {slug ? (
            <div className="tp-result-card flex flex-col gap-3" aria-live="polite">
              <output className="break-all font-mono text-lg text-[var(--text)]">
                {slug}
              </output>
              <CopyButton
                text={slug}
                label={tu("copy")}
                copiedLabel={tu("copied")}
              />
            </div>
          ) : (
            <OutputEmpty message={t("resultEmpty")} className="min-h-[140px]" />
          )}

          <p className="tp-workspace-hint" role="status" aria-live="polite">
            {status}
          </p>
          <p className="tp-workspace-hint" aria-live="polite">
            {slug.length} {tu("characters").toLowerCase()} · {tu("lowercase")}
          </p>
        </div>
      }
    />
  );
}
