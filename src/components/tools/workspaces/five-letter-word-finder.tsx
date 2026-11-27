"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  COMMON_FIVE_LETTER_WORDS,
  WORD_LENGTH,
  findMatchingWords,
  validateClues,
} from "./five-letter-word-finder.logic";
import { cn } from "@/lib/utils";

const TOTAL_WORDS = COMMON_FIVE_LETTER_WORDS.length;

const EMPTY_SLOTS: string[] = Array.from({ length: WORD_LENGTH }, () => "");

const SAMPLE_SLOTS = ["", "", "A", "", "E"];
const SAMPLE_INCLUDED = "CRN";
const SAMPLE_EXCLUDED = "SLT";

function singleLetter(value: string): string {
  return value.replace(/[^a-z]/giu, "").slice(0, 1).toUpperCase();
}

export default function FiveLetterWordFinder() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [slots, setSlots] = useState<string[]>(EMPTY_SLOTS);
  const [included, setIncluded] = useState("");
  const [excluded, setExcluded] = useState("");
  const [copiedWord, setCopiedWord] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const clues = useMemo(() => ({ slots, included, excluded }), [slots, included, excluded]);
  const validation = useMemo(() => validateClues(clues), [clues]);
  const matches = useMemo(
    () => findMatchingWords(COMMON_FIVE_LETTER_WORDS, clues),
    [clues],
  );
  const matchPercent = TOTAL_WORDS === 0 ? 0 : (matches.length / TOTAL_WORDS) * 100;

  const handleSlot = useCallback((index: number, raw: string) => {
    setSlots((previous) => {
      const next = previous.slice();
      next[index] = singleLetter(raw);
      return next;
    });
    setCopiedWord(null);
  }, []);

  const handleSample = useCallback(() => {
    setSlots(SAMPLE_SLOTS.slice());
    setIncluded(SAMPLE_INCLUDED);
    setExcluded(SAMPLE_EXCLUDED);
    setCopiedWord(null);
    setNotice("");
  }, []);

  const handleReset = useCallback(() => {
    setSlots(EMPTY_SLOTS.slice());
    setIncluded("");
    setExcluded("");
    setCopiedWord(null);
    setNotice("");
  }, []);

  const showNotice = useCallback(
    (message: string) => {
      setNotice(message);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(""), 3200);
    },
    [],
  );

  const handleCopy = useCallback(
    async (word: string) => {
      try {
        await navigator.clipboard.writeText(word.toUpperCase());
        setCopiedWord(word);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopiedWord(null), 1800);
      } catch {
        showNotice(tw("five-letter-word-finder.copyUnavailable"));
      }
    },
    [showNotice, tw],
  );

  return (
    <div className="tp-play">
      <header className="tp-play-head">
        <h2 className="tp-play-title">{tw("five-letter-word-finder.boardTitle")}</h2>
        <p className="tp-play-sub">{tw("five-letter-word-finder.boardHint")}</p>
      </header>

      <div className="tp-play-bar">
        <button
          type="button"
          className="tp-play-btn tp-play-btn--ghost"
          onClick={handleSample}
        >
          {tw("five-letter-word-finder.trySample")}
        </button>
        <button
          type="button"
          className="tp-play-btn tp-play-btn--ghost"
          onClick={handleReset}
        >
          {tw("five-letter-word-finder.resetBoard")}
        </button>
      </div>

      <section className="tp-play-card" aria-label={tw("five-letter-word-finder.boardTitle")}>
        <div className="tp-play-toolbar">
          <span className="tp-play-pill tp-play-pill--active">
            {tw("five-letter-word-finder.positionsTitle")}
          </span>
          <span className="tp-play-tag">{tw("five-letter-word-finder.positionsHint")}</span>
        </div>

        <div className="tp-play-grid" role="group" aria-label={tw("five-letter-word-finder.positionsTitle")}>
          {slots.map((value, index) => {
            const label = tw("five-letter-word-finder.slotLabel", { number: index + 1 });
            return (
              <label className="tp-play-tile" key={index}>
                <span className="tp-play-letter">{label}</span>
                <input
                  className="tp-play-input"
                  value={value}
                  onChange={(event) => handleSlot(index, event.target.value)}
                  maxLength={1}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={label}
                />
              </label>
            );
          })}
        </div>

        <div className="tp-play-toolbar">
          <span className="tp-play-pill">{tw("five-letter-word-finder.includedLabel")}</span>
          <span className="tp-play-tag">{tw("five-letter-word-finder.includedHint")}</span>
        </div>
        <label className="tp-play-chip">
          <span>{tw("five-letter-word-finder.includedLabel")}</span>
          <input
            className="tp-play-input"
            value={included}
            onChange={(event) => setIncluded(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label={tw("five-letter-word-finder.includedLabel")}
          />
        </label>

        <div className="tp-play-toolbar">
          <span className="tp-play-pill">{tw("five-letter-word-finder.excludedLabel")}</span>
          <span className="tp-play-tag">{tw("five-letter-word-finder.excludedHint")}</span>
        </div>
        <label className="tp-play-chip">
          <span>{tw("five-letter-word-finder.excludedLabel")}</span>
          <input
            className="tp-play-input"
            value={excluded}
            onChange={(event) => setExcluded(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-label={tw("five-letter-word-finder.excludedLabel")}
          />
        </label>

        {validation.valid ? null : (
          <p className="tp-play-empty" role="alert">
            {tw("five-letter-word-finder.slotError")}
          </p>
        )}
      </section>

      <div className="tp-play-result">
        <div className="tp-play-winner">
          <span className="tp-play-tag">{tw("five-letter-word-finder.matchTitle")}</span>
          <span className="tp-play-answer" aria-live="polite">
            {tw("five-letter-word-finder.matchCount", { count: matches.length })}
          </span>
          <span className="tp-play-count">
            {tw("five-letter-word-finder.totalWords", { count: TOTAL_WORDS })}
          </span>
        </div>
        <div
          className="tp-play-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOTAL_WORDS}
          aria-valuenow={matches.length}
          aria-label={tw("five-letter-word-finder.matchTitle")}
        >
          <span className="tp-play-progress-fill" style={{ width: `${matchPercent}%` }} />
        </div>
      </div>

      {notice ? (
        <p className="tp-play-empty" role="status">
          {notice}
        </p>
      ) : null}

      {matches.length === 0 ? (
        <p className="tp-play-empty">{tw("five-letter-word-finder.noMatches")}</p>
      ) : (
        <div className="tp-play-grid">
          {matches.map((word) => (
            <button
              key={word}
              type="button"
              className={cn(
                "tp-play-tile",
                copiedWord === word && "tp-play-card--active",
              )}
              onClick={() => void handleCopy(word)}
              aria-label={tw("five-letter-word-finder.copyWord", {
                word: word.toUpperCase(),
              })}
            >
              <span className="tp-play-letter">{word.toUpperCase()}</span>
              {copiedWord === word ? (
                <span className="tp-play-chip">{t("copied")}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <p className="tp-play-sub">{tw("five-letter-word-finder.gridHint")}</p>
    </div>
  );
}
