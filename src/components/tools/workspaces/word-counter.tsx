"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  ClipboardPaste,
  Clock,
  Copy,
  FileText,
  Mic,
  RotateCcw,
  ShieldCheck,
  Target,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/tools/workspace-ui";
import { cn } from "@/lib/utils";

const SAMPLE =
  "The quiet utility of doing one thing well. Paste your own text here and see every count update as you type.";

const READING_WPM = 200;
const SPEAKING_WPM = 130;

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
  const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / READING_WPM));
  const speakingMinutes =
    words === 0 ? 0 : Math.max(1, Math.ceil(words / SPEAKING_WPM));

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    lines,
    minutes,
    speakingMinutes,
  };
}

/**
 * Numbers count up instead of snapping, which makes a live tool feel alive.
 * Falls back to the final value when the reader prefers reduced motion.
 */
function AnimatedNumber({ value }: { value: number }) {
  const locale = useLocale();
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => {
        displayRef.current = value;
        setDisplay(value);
      });
      return () => cancelAnimationFrame(frame);
    }

    const from = displayRef.current;
    if (from === value) return;

    const start = performance.now();
    const duration = 260;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (value - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        displayRef.current = value;
        setDisplay(value);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{formatter.format(display)}</>;
}

function InsightStat({
  label,
  value,
  wide,
  primary,
}: {
  label: string;
  value: number;
  wide?: boolean;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "tp-wc-stat",
        wide && "tp-wc-stat--wide",
        primary && "tp-wc-stat--primary",
      )}
    >
      <dt>{label}</dt>
      <dd>
        <AnimatedNumber value={value} />
      </dd>
    </div>
  );
}

export default function WordCounter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const [goal, setGoal] = useState("");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = useMemo(() => countText(text), [text]);
  const hasText = text.trim().length > 0;
  const goalValue = Math.min(100000, Math.max(0, Math.floor(Number(goal) || 0)));
  const progress = goalValue > 0 ? Math.min(100, (stats.words / goalValue) * 100) : 0;
  const goalReached = goalValue > 0 && stats.words >= goalValue;

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
        `${t("speakingTime")}: ${t("minuteShort", { count: stats.speakingMinutes })}`,
        ...(goalValue > 0 ? [`${t("goal")}: ${stats.words} / ${goalValue}`] : []),
      ].join("\n"),
    [goalValue, stats, t],
  );

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3200);
  }, []);

  const copyStats = useCallback(async () => {
    if (!hasText) return;
    try {
      await navigator.clipboard.writeText(statsText);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      showNotice(tw("word-counter.pasteUnavailable"));
    }
  }, [hasText, statsText, showNotice, tw]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "c"
      ) {
        event.preventDefault();
        void copyStats();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copyStats]);

  const handleSample = useCallback(() => {
    setText(SAMPLE);
    setCopied(false);
    setNotice("");
    inputRef.current?.focus();
  }, []);

  const handleReset = useCallback(() => {
    setText("");
    setGoal("");
    setCopied(false);
    setNotice("");
    inputRef.current?.focus();
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) {
        inputRef.current?.focus();
        return;
      }
      setText((previous) => (previous ? `${previous}\n${clip}` : clip));
      setCopied(false);
      inputRef.current?.focus();
    } catch {
      showNotice(tw("word-counter.pasteUnavailable"));
      inputRef.current?.focus();
    }
  }, [showNotice, tw]);

  const handleClear = useCallback(() => {
    setText("");
    setCopied(false);
    setNotice("");
    inputRef.current?.focus();
  }, []);

  return (
    <div className="tp-wc">
      <div className="tp-wc-bar">
        <div className="tp-wc-identity">
          <span className="tp-wc-mark" aria-hidden="true">
            <FileText />
          </span>
          <div className="tp-wc-identity-copy">
            <span className="tp-wc-name">{tw("word-counter.title")}</span>
          </div>
        </div>
        <div className="tp-wc-bar-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("word-counter.trySample")}
          </Button>
          <Button type="button" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("word-counter.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-wc-body">
        <section className="tp-wc-editor" aria-labelledby="tp-wc-input-label">
          <div className="tp-wc-pane-head">
            <div className="tp-wc-pane-title">
              <h2 id="tp-wc-input-label">{t("yourText")}</h2>
            </div>
            <div className="tp-wc-mini-actions">
              <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("word-counter.paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!text}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="tp-wc-editor-wrap">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setCopied(false);
                setNotice("");
              }}
              aria-label={t("pasteText")}
              placeholder={t("startTyping")}
              spellCheck
              className="tp-wc-textarea"
            />
          </div>

          {notice ? (
            <p className="tp-wc-notice" role="status">
              {notice}
            </p>
          ) : null}
        </section>

        <aside className="tp-wc-insights" aria-labelledby="tp-wc-result-label">
          <div className="tp-wc-pane-head">
            <div className="tp-wc-pane-title">
              <h2 id="tp-wc-result-label">{t("results")}</h2>
            </div>
          </div>

          <div className="tp-wc-hero">
            <div className="tp-wc-hero-head">
              <span className="tp-wc-hero-label">
                <Type aria-hidden="true" />
                {t("wordCount")}
              </span>
              {goalValue > 0 ? (
                <span className="tp-wc-hero-badge">{Math.round(progress)}%</span>
              ) : null}
            </div>
            <span className="tp-wc-hero-value" aria-live="polite">
              <AnimatedNumber value={stats.words} />
            </span>
            <div className="tp-wc-hero-foot">
              <span>
                <Clock aria-hidden="true" />
                {t("readingTime")}: {t("minuteShort", { count: stats.minutes })}
              </span>
              <span>
                <Mic aria-hidden="true" />
                {t("speakingTime")}: {t("minuteShort", { count: stats.speakingMinutes })}
              </span>
            </div>
            <span className="tp-wc-hero-glow" aria-hidden="true" />
          </div>

          <dl className="tp-wc-stats">
            <InsightStat label={t("characters")} value={stats.characters} primary />
            <InsightStat label={t("charactersNoSpaces")} value={stats.charactersNoSpaces} />
            <InsightStat label={t("sentences")} value={stats.sentences} />
            <InsightStat label={t("paragraphs")} value={stats.paragraphs} />
            <InsightStat label={t("lines")} value={stats.lines} wide />
          </dl>

          <div className="tp-wc-goal" data-reached={goalReached || undefined}>
            <div className="tp-wc-goal-head">
              <label htmlFor="tp-wc-goal" className="tp-wc-goal-label">
                <Target aria-hidden="true" />
                {t("goal")}
              </label>
              <div className="tp-wc-goal-input">
                <NumberStepper
                  id="tp-wc-goal"
                  value={goal}
                  min={0}
                  max={100000}
                  step={50}
                  ariaLabel={t("goal")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  onValueChange={setGoal}
                />
                <span>{t("words").toLowerCase()}</span>
              </div>
            </div>
            {goalValue > 0 ? (
              <>
                <div
                  className="tp-wc-goal-track"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={goalValue}
                  aria-valuenow={Math.min(stats.words, goalValue)}
                  aria-label={t("goal")}
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="tp-wc-goal-meta">
                  <span>
                    {stats.words} / {goalValue}
                  </span>
                  {goalReached ? (
                    <span className="tp-wc-goal-done">
                      <Check aria-hidden="true" />
                      {Math.round(progress)}%
                    </span>
                  ) : (
                    <span>{Math.round(progress)}%</span>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="tp-wc-ribbon">
        <span className="tp-wc-ribbon-note">
          <ShieldCheck aria-hidden="true" />
          {tw("privacyRibbon")}
        </span>
        <Button
          type="button"
          size="sm"
          onClick={() => void copyStats()}
          disabled={!hasText}
          className="tp-wc-ribbon-copy"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {copied ? tw("word-counter.copied") : tw("word-counter.copyStats")}
        </Button>
      </div>
    </div>
  );
}
