"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardPaste, Copy, RotateCcw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { CheckboxRow, Stat } from "../workspace-ui";

const SAMPLE =
  "The quiet utility of doing one thing well. Paste your own text here and see every count update as you type. Small tools should stay out of the way.";

/** Pure counting logic — no UI, no DOM access. */
export function countText(text: string, wordsPerMinute: number) {
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
  const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / wordsPerMinute));

  return { words, characters, charactersNoSpaces, sentences, paragraphs, lines, minutes };
}

export default function WordCounter() {
  const t = useTranslations("tools");
  const tui = useTranslations("toolUi");
  const [text, setText] = useState("");
  const [wordsPerMinute, setWordsPerMinute] = useState(200);
  const [includeReadingTime, setIncludeReadingTime] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pasteError, setPasteError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = useMemo(() => countText(text, wordsPerMinute), [text, wordsPerMinute]);
  const hasText = text.trim().length > 0;

  const statsText = useMemo(
    () =>
      [
        `${tui("words")}: ${stats.words}`,
        `${tui("characters")}: ${stats.characters}`,
        `${tui("charactersNoSpaces")}: ${stats.charactersNoSpaces}`,
        `${tui("sentences")}: ${stats.sentences}`,
        `${tui("paragraphs")}: ${stats.paragraphs}`,
        `${tui("lines")}: ${stats.lines}`,
        ...(includeReadingTime
          ? [`${tui("readingTime")}: ${tui("minuteShort", { count: stats.minutes })}`]
          : []),
      ].join("\n"),
    [stats, includeReadingTime, tui],
  );

  const copyStats = useCallback(async () => {
    if (!hasText) return;
    try {
      await navigator.clipboard.writeText(statsText);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be blocked; the stats stay selectable on screen.
    }
  }, [hasText, statsText]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        void copyStats();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copyStats]);

  const focusInput = () => inputRef.current?.focus();

  const paste = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (value) {
        setText(value);
        setPasteError(false);
        focusInput();
      }
    } catch {
      setPasteError(true);
    }
  };

  const clear = () => {
    setText("");
    setCopied(false);
    focusInput();
  };

  const resetOptions = () => {
    setWordsPerMinute(200);
    setIncludeReadingTime(true);
  };

  return (
    <WorkspaceLayout
      header={
        <div className="tp-workspace-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setText(SAMPLE);
              focusInput();
            }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("word-counter.trySample")}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void paste()}>
            <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
            {t("word-counter.paste")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resetOptions}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {t("word-counter.reset")}
          </Button>
        </div>
      }
      input={
        <>
          <Textarea
            ref={inputRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setPasteError(false);
            }}
            placeholder={tui("pasteText")}
            aria-label={tui("pasteText")}
            className="min-h-[320px]"
          />
          <div className="tp-workspace-pane-foot">
            <span className="tp-pane-hint" aria-live="polite">
              {pasteError ? t("word-counter.pasteUnavailable") : t("word-counter.inputHint")}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={!text}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("word-counter.clear")}
            </Button>
          </div>
        </>
      }
      output={
        <>
          <span className="tp-status-pill" data-tone={hasText ? "success" : "neutral"}>
            {hasText ? t("word-counter.statusLive") : t("word-counter.statusEmpty")}
          </span>
          {hasText ? (
            <dl className="grid grid-cols-2 gap-3">
              <Stat label={tui("words")} value={stats.words} />
              <Stat label={tui("characters")} value={stats.characters} />
              <Stat label={tui("charactersNoSpaces")} value={stats.charactersNoSpaces} />
              <Stat label={tui("sentences")} value={stats.sentences} />
              <Stat label={tui("paragraphs")} value={stats.paragraphs} />
              <Stat label={tui("lines")} value={stats.lines} />
              {includeReadingTime ? (
                <div className="col-span-2">
                  <Stat
                    label={tui("readingTime")}
                    value={tui("minuteShort", { count: stats.minutes })}
                  />
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="tp-workspace-empty">{t("word-counter.emptyHint")}</p>
          )}
          <div className="tp-workspace-pane-foot">
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
              {copied ? t("word-counter.copied") : t("word-counter.copyStats")}
            </Button>
          </div>
        </>
      }
      options={
        <>
          <span className="tp-workspace-options-title">{t("word-counter.optionsTitle")}</span>
          <CheckboxRow
            id="wc-reading-time"
            label={t("word-counter.includeReadingTime")}
            checked={includeReadingTime}
            onChange={setIncludeReadingTime}
          />
          {includeReadingTime ? (
            <label className="tp-workspace-option-range">
              <span>
                {t("word-counter.wordsPerMinute")}: <strong>{wordsPerMinute}</strong>
              </span>
              <input
                type="range"
                min={100}
                max={400}
                step={25}
                value={wordsPerMinute}
                onChange={(event) => setWordsPerMinute(Number(event.target.value))}
                aria-label={t("word-counter.wordsPerMinute")}
              />
            </label>
          ) : null}
        </>
      }
      status={
        <>
          <span className="tp-workspace-privacy">
            <ShieldCheck className="tp-icon" aria-hidden="true" />
            {t("runsInBrowser")} · {t("word-counter.shortcutHint")}
          </span>
          <span>{t("word-counter.liveCharacters", { count: stats.characters })}</span>
        </>
      }
    />
  );
}
