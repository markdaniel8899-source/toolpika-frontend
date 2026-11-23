"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { Stat } from "../workspace-ui";

const SAMPLE =
  "The quiet utility of doing one thing well. Paste your own text here and see every count update as you type.";

/** Pure counting logic — no UI, no DOM access. */
export function countText(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/u).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/gu, "").length;
  const sentences = trimmed
    ? text.split(/[.!?…]+/u).filter((part) => part.trim().length > 0).length
    : 0;
  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/u).filter((part) => part.trim().length > 0).length
    : 0;
  const lines = text ? text.split(/\r\n|\r|\n/u).length : 0;
  // 200 words per minute is the standard adult reading-speed estimate.
  const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

  return { words, characters, charactersNoSpaces, sentences, paragraphs, lines, minutes };
}

export default function WordCounter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = useMemo(() => countText(text), [text]);
  const hasText = text.trim().length > 0;

  const statsText = useMemo(
    () =>
      [
        `${t("words")}: ${stats.words}`,
        `${t("characters")}: ${stats.characters}`,
        `${t("charactersNoSpaces")}: ${stats.charactersNoSpaces}`,
        `${t("sentences")}: ${stats.sentences}`,
        `${t("paragraphs")}: ${stats.paragraphs}`,
        `${t("lines")}: ${stats.lines}`,
        `${t("readingTime")}: ${t("minuteShort", { count: stats.minutes })}`,
      ].join("\n"),
    [stats, t],
  );

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const copyStats = useCallback(async () => {
    if (!hasText) return;
    try {
      await navigator.clipboard.writeText(statsText);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the numbers stay on screen.
    }
  }, [hasText, statsText]);

  return (
    <WorkspaceLayout
      input={
        <>
          <Textarea
            ref={inputRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setCopied(false);
            }}
            placeholder={t("pasteText")}
            aria-label={t("pasteText")}
            className="min-h-[320px]"
          />
          <div className="tp-workspace-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setText(SAMPLE);
                inputRef.current?.focus();
              }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("word-counter.trySample")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setText("");
                inputRef.current?.focus();
              }}
              disabled={!text}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
        </>
      }
      output={
        <>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label={t("words")} value={stats.words} />
            <Stat label={t("characters")} value={stats.characters} />
            <Stat label={t("charactersNoSpaces")} value={stats.charactersNoSpaces} />
            <Stat label={t("sentences")} value={stats.sentences} />
            <Stat label={t("paragraphs")} value={stats.paragraphs} />
            <Stat label={t("lines")} value={stats.lines} />
            <div className="col-span-2">
              <Stat label={t("readingTime")} value={t("minuteShort", { count: stats.minutes })} />
            </div>
          </dl>
          <div className="tp-workspace-inline-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void copyStats()}
              disabled={!hasText}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? tw("word-counter.copied") : tw("word-counter.copyStats")}
            </Button>
          </div>
        </>
      }
    />
  );
}
