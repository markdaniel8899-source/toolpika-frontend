"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, CornerDownLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

const SAMPLE = "Hello world from Toolpika";

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function words(text: string) {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function titleCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^|[\s-]+)(\p{L})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

function sentenceCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

export default function CaseConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const helper = useMemo(() => {
    const trimmed = text.trim();
    return {
      characters: text.length,
      words: trimmed ? words(trimmed).length : 0,
      lines: text ? text.split(/\r\n|\r|\n/u).length : 0,
    };
  }, [text]);

  const handleReset = () => {
    setText("");
    setResult("");
    setActive(null);
  };

  const handleSample = () => {
    setText(SAMPLE);
    setResult("");
    setActive(null);
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((previous) => (previous ? `${previous}\n${clip}` : clip));
        setResult("");
        setActive(null);
      }
    } catch {
      // Clipboard permission can be denied; the editor remains usable.
    }
  };

  const transforms = [
    { id: "upper", label: t("uppercase"), run: () => text.toUpperCase() },
    { id: "lower", label: t("lowercase"), run: () => text.toLowerCase() },
    { id: "title", label: t("titleCase"), run: () => titleCase(text) },
    { id: "sentence", label: t("sentenceCase"), run: () => sentenceCase(text) },
    {
      id: "camel",
      label: t("camelCase"),
      run: () =>
        words(text.toLowerCase())
          .map((word, index) => (index === 0 ? word : capitalize(word)))
          .join(""),
    },
    {
      id: "kebab",
      label: t("kebabCase"),
      run: () => words(text.toLowerCase()).join("-"),
    },
    {
      id: "snake",
      label: t("snakeCase"),
      run: () => words(text.toLowerCase()).join("_"),
    },
  ];

  const apply = (id: string, run: () => string) => {
    setResult(run());
    setActive(id);
  };

  return (
    <WorkspaceLayout
      title={tw("case-converter.title")}
      onReset={handleReset}
      onSample={handleSample}
      status={result ? tw("statusReady") : text ? tw("statusIdle") : undefined}
      statusRight={result ? `${result.length} ${t("characters")}` : undefined}
      input={
        <div className="flex flex-col gap-3">
          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("paste")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!text}
              onClick={() => {
                setText("");
                setResult("");
                setActive(null);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setResult("");
              setActive(null);
            }}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            className="min-h-[300px]"
          />
          <p className="tp-workspace-hint" aria-live="polite">
            {helper.characters} {t("characters").toLowerCase()} · {helper.words} {t("words").toLowerCase()} · {helper.lines} {t("lines").toLowerCase()}
          </p>
        </div>
      }
      output={
        <div className="flex flex-col gap-4" aria-live="polite">
          <div className="grid grid-cols-2 gap-2">
            {transforms.map((transform) => (
              <Button
                key={transform.id}
                type="button"
                variant={active === transform.id ? "default" : "secondary"}
                aria-pressed={active === transform.id}
                disabled={!text}
                onClick={() => apply(transform.id, transform.run)}
              >
                {transform.label}
              </Button>
            ))}
          </div>

          {result ? (
            <Textarea
              value={result}
              readOnly
              aria-label={t("result")}
              className="min-h-[160px] bg-[var(--bg)]"
            />
          ) : (
            <OutputEmpty message={tw("resultEmpty")} />
          )}

          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <CopyButton text={result} label={t("copy")} copiedLabel={t("copied")} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!result}
              aria-label={tw("result")}
              onClick={() => {
                setText(result);
                setResult("");
                setActive(null);
              }}
            >
              <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("result")}
            </Button>
          </div>
        </div>
      }
    />
  );
}
