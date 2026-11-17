"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function words(text: string) {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

function titleCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^|[\s\-–—]+)(\p{L})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

function sentenceCase(text: string) {
  return text
    .toLowerCase()
    .replace(/(^|[.!?]\s+|\n\s*)(\p{L})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
}

export default function CaseConverter() {
  const t = useTranslations("toolUi");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  const transforms = [
    { id: "upper", label: t("uppercase"), run: () => text.toUpperCase() },
    { id: "lower", label: t("lowercase"), run: () => text.toLowerCase() },
    { id: "title", label: t("titleCase"), run: () => titleCase(text) },
    { id: "sentence", label: t("sentenceCase"), run: () => sentenceCase(text) },
    {
      id: "camel",
      label: t("camelCase"),
      run: () => {
        const parts = words(text.toLowerCase());
        return parts.map((word, index) => (index === 0 ? word : capitalize(word))).join("");
      },
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

  return (
    <WorkspaceLayout
      input={
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("pasteText")}
          aria-label={t("pasteText")}
          className="min-h-[320px] resize-y"
        />
      }
      output={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {transforms.map((transform) => (
              <Button
                key={transform.id}
                type="button"
                variant="secondary"
                size="sm"
                disabled={!text}
                onClick={() => setResult(transform.run())}
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
              className="min-h-[140px] resize-y bg-[var(--bg)]"
            />
          ) : (
            <OutputEmpty message={t("pasteText")} />
          )}

          <div className="flex flex-wrap gap-2">
            <CopyButton text={result} label={t("copy")} copiedLabel={t("copied")} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!text && !result}
              onClick={() => {
                setText("");
                setResult("");
              }}
            >
              {t("clear")}
            </Button>
          </div>
        </div>
      }
    />
  );
}
