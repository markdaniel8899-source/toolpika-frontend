"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useCopyFeedback } from "@/components/tools/workspace-ui";
import {
  MAX_SCRAMBLE_LETTERS,
  normaliseLetters,
  shuffleLetters,
  solveScramble,
  type LengthFilter,
} from "./word-scramble-solver.logic";

const SAMPLE = "nelist";

export default function WordScrambleSolver() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<LengthFilter>("all");
  const [lastCopied, setLastCopied] = useState("");
  const { copy } = useCopyFeedback();

  const letters = useMemo(
    () => normaliseLetters(input).slice(0, MAX_SCRAMBLE_LETTERS),
    [input],
  );
  const solution = useMemo(() => solveScramble(letters, filter), [letters, filter]);

  const filterOptions = [
    { value: "all" as const, label: tw("word-scramble-solver.filterAll") },
    { value: "3" as const, label: tw("word-scramble-solver.filter3") },
    { value: "4" as const, label: tw("word-scramble-solver.filter4") },
    { value: "5" as const, label: tw("word-scramble-solver.filter5") },
    { value: "6+" as const, label: tw("word-scramble-solver.filter6Plus") },
  ];

  const handleCopyWord = useCallback(
    async (word: string) => {
      const ok = await copy(word);
      setLastCopied(ok ? word : "");
    },
    [copy],
  );

  const handleSample = () => {
    setInput(SAMPLE);
    setFilter("all");
    setLastCopied("");
  };

  const handleClear = () => {
    setInput("");
    setLastCopied("");
  };

  const handleShuffle = () => {
    setInput(shuffleLetters(letters));
    setLastCopied("");
  };

  const winner = solution.fullAnagrams[0];

  return (
    <div className="tp-play">
      <div className="tp-play-head">
        <h2 className="tp-play-title">{tw("word-scramble-solver.title")}</h2>
        <p className="tp-play-sub">{tw("word-scramble-solver.subtitle")}</p>
      </div>

      <div className="tp-play-toolbar">
        <button type="button" className="tp-play-btn tp-play-btn--ghost" onClick={handleSample}>
          {tw("word-scramble-solver.trySample")}
        </button>
        <button
          type="button"
          className="tp-play-btn"
          onClick={handleShuffle}
          disabled={letters.length < 2}
        >
          {tw("word-scramble-solver.shuffle")}
        </button>
        <button
          type="button"
          className="tp-play-btn tp-play-btn--ghost"
          onClick={handleClear}
          disabled={!input}
        >
          {t("clear")}
        </button>
      </div>

      <label className="tp-play-sub" htmlFor="wss-letters">
        {tw("word-scramble-solver.inputLabel")}
      </label>
      <div className="tp-play-toolbar">
        <input
          id="wss-letters"
          className="tp-play-input"
          value={input}
          onChange={(event) => {
            setInput(normaliseLetters(event.target.value).slice(0, MAX_SCRAMBLE_LETTERS));
            setLastCopied("");
          }}
          placeholder={tw("word-scramble-solver.inputPlaceholder")}
          aria-describedby="wss-count"
          maxLength={MAX_SCRAMBLE_LETTERS}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <span className="tp-play-count" id="wss-count">
          {tw("word-scramble-solver.letterCount", { count: letters.length, max: MAX_SCRAMBLE_LETTERS })}
        </span>
      </div>

      <div className="tp-play-grid" aria-label={tw("word-scramble-solver.tilesLabel")}>
        {letters.length === 0 ? (
          <p className="tp-play-empty">{tw("word-scramble-solver.tilesEmpty")}</p>
        ) : (
          letters.split("").map((letter, index) => (
            <span className="tp-play-tile" key={`${letter}-${index}`}>
              <span className="tp-play-letter">{letter.toUpperCase()}</span>
            </span>
          ))
        )}
      </div>

      <div className="tp-play-toolbar" role="group" aria-label={tw("word-scramble-solver.lengthFilterLabel")}>
        {filterOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={filter === option.value ? "tp-play-pill tp-play-pill--active" : "tp-play-pill"}
            aria-pressed={filter === option.value}
            onClick={() => {
              setFilter(option.value);
              setLastCopied("");
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="tp-play-result" aria-live="polite">
        {solution.total === 0 ? (
          <div className="tp-play-empty">
            <p>{tw("word-scramble-solver.emptyTitle")}</p>
            <p>{tw("word-scramble-solver.emptyHint")}</p>
          </div>
        ) : (
          <>
            {winner ? (
              <div className="tp-play-winner">
                <span className="tp-play-tag">{tw("word-scramble-solver.fullMatchTag")}</span>
                <button
                  type="button"
                  className="tp-play-chip"
                  onClick={() => void handleCopyWord(winner)}
                  aria-label={tw("word-scramble-solver.copyWord", { word: winner })}
                >
                  {winner.toUpperCase()}
                  {lastCopied === winner ? <span className="tp-play-tag">{t("copied")}</span> : null}
                </button>
              </div>
            ) : null}

            <p className="tp-play-sub">
              {tw("word-scramble-solver.resultsCount", { count: solution.total })}
            </p>
            <p className="tp-play-sub">{tw("word-scramble-solver.copyHint")}</p>
            {solution.truncated ? (
              <p className="tp-play-sub">{tw("word-scramble-solver.resultCapNote")}</p>
            ) : null}

            <div className="tp-play-grid">
              {solution.groups.map((group) => (
                <section
                  className="tp-play-card"
                  key={group.length}
                  aria-label={tw("word-scramble-solver.groupLabel", { count: group.length })}
                >
                  <h3 className="tp-play-title">
                    {tw("word-scramble-solver.groupTitle", { count: group.length })}
                  </h3>
                  <div className="tp-play-toolbar">
                    {group.words.map((word) => (
                      <button
                        type="button"
                        className="tp-play-chip"
                        key={word}
                        onClick={() => void handleCopyWord(word)}
                        aria-label={tw("word-scramble-solver.copyWord", { word })}
                      >
                        {word.toUpperCase()}
                        {lastCopied === word ? (
                          <span className="tp-play-tag">{t("copied")}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
