"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import {
  MAX_ITEMS,
  addItems,
  applyPreset,
  availablePool,
  parseItemList,
  pickWinner,
  pruneEliminated,
  removeItem,
  secureRandomIndex,
  supportsSecureRandom,
  withElimination,
  withRecent,
  type PickerPreset,
  type PresetLists,
} from "./random-choice-picker.logic";

const ROLL_STEPS = 9;
const ROLL_INTERVAL_MS = 80;

export default function RandomChoicePicker() {
  const tw = useTranslations("tools");
  const t = useTranslations("toolUi");

  const [items, setItems] = useState<string[]>([]);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [eliminateWinner, setEliminateWinner] = useState(false);
  const [entry, setEntry] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollingLabel, setRollingLabel] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [activePreset, setActivePreset] = useState<PickerPreset | null>(null);

  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (rollTimer.current) clearInterval(rollTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const presetLists = useMemo<PresetLists>(
    () => ({
      lunchSpots: tw("random-choice-picker.presetLunchSpotsItems"),
      teamTurn: tw("random-choice-picker.presetTeamTurnItems"),
      yesOrNo: tw("random-choice-picker.presetYesOrNoItems"),
      weekendActivity: tw("random-choice-picker.presetWeekendActivityItems"),
    }),
    [tw],
  );

  const pool = useMemo(
    () => availablePool(items, eliminated, eliminateWinner),
    [items, eliminated, eliminateWinner],
  );

  const clearNotice = useCallback(() => setNotice(""), []);

  const mutateItems = useCallback(
    (next: string[]) => {
      setItems(next);
      setEliminated((previous) => pruneEliminated(previous, next));
      setWinner(null);
      setActivePreset(null);
      clearNotice();
    },
    [clearNotice],
  );

  const handleAdd = useCallback(() => {
    if (!entry.trim()) return;
    const next = addItems(items, entry);
    if (next.length === items.length) {
      setNotice(
        items.length >= MAX_ITEMS
          ? tw("random-choice-picker.listFull")
          : tw("random-choice-picker.alreadyAdded"),
      );
      return;
    }
    mutateItems(next);
    setEntry("");
  }, [entry, items, mutateItems, tw]);

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) return;
      const next = addItems(items, clip);
      if (next.length === items.length) {
        setNotice(
          items.length >= MAX_ITEMS
            ? tw("random-choice-picker.listFull")
            : tw("random-choice-picker.alreadyAdded"),
        );
        return;
      }
      mutateItems(next);
      setEntry("");
    } catch {
      setNotice(tw("random-choice-picker.pasteUnavailable"));
    }
  }, [items, mutateItems, tw]);

  const handlePreset = useCallback(
    (preset: PickerPreset) => {
      mutateItems(applyPreset(preset, presetLists));
      setEliminated([]);
      setEntry("");
      setActivePreset(preset);
    },
    [mutateItems, presetLists],
  );

  const handleSample = useCallback(() => {
    mutateItems(parseItemList(tw("random-choice-picker.sampleText")));
    setEliminated([]);
    setEntry("");
  }, [mutateItems, tw]);

  const handleClear = useCallback(() => {
    setItems([]);
    setEliminated([]);
    setWinner(null);
    setEntry("");
    setActivePreset(null);
    clearNotice();
  }, [clearNotice]);

  const handleClearEliminations = useCallback(() => {
    setEliminated([]);
    setWinner(null);
    clearNotice();
  }, [clearNotice]);

  const finalize = useCallback(
    (chosen: string) => {
      setWinner(chosen);
      setRolling(false);
      setRollingLabel(null);
      setRecent((previous) => withRecent(previous, chosen));
      if (eliminateWinner) {
        setEliminated((previous) => withElimination(previous, chosen, true));
      }
    },
    [eliminateWinner],
  );

  const handlePick = useCallback(() => {
    if (rollTimer.current) return;

    if (!supportsSecureRandom()) {
      setNotice(tw("random-choice-picker.randomUnavailable"));
      return;
    }

    const chosen = pickWinner(pool);
    if (!chosen) {
      setNotice(
        eliminateWinner
          ? tw("random-choice-picker.allEliminatedHint")
          : tw("random-choice-picker.emptyHint"),
      );
      return;
    }

    clearNotice();
    setCopied(false);
    setWinner(null);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || pool.length < 2) {
      finalize(chosen);
      return;
    }

    setRolling(true);
    let steps = 0;

    rollTimer.current = setInterval(() => {
      steps += 1;
      setRollingLabel(pool[secureRandomIndex(pool.length)] ?? chosen);

      if (steps >= ROLL_STEPS) {
        if (rollTimer.current) clearInterval(rollTimer.current);
        rollTimer.current = null;
        finalize(chosen);
      }
    }, ROLL_INTERVAL_MS);
  }, [pool, eliminateWinner, finalize, clearNotice, tw]);

  const handleCopyWinner = useCallback(() => {
    if (!winner) return;
    navigator.clipboard.writeText(winner).then(
      () => {
        setCopied(true);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 1600);
      },
      () => setNotice(tw("random-choice-picker.copyUnavailable")),
    );
  }, [winner, tw]);

  const pillClass = (preset: PickerPreset) =>
    activePreset === preset
      ? "tp-play-pill tp-play-pill--active"
      : "tp-play-pill";

  return (
    <div className="tp-play">
      <header className="tp-play-head">
        <h1 className="tp-play-title">{tw("random-choice-picker.title")}</h1>
        <p className="tp-play-sub">{tw("random-choice-picker.subtitle")}</p>
      </header>

      <div
        className="tp-play-toolbar"
        role="group"
        aria-label={tw("random-choice-picker.presetTitle")}
      >
        <button
          type="button"
          className={pillClass("lunchSpots")}
          aria-pressed={activePreset === "lunchSpots"}
          onClick={() => handlePreset("lunchSpots")}
        >
          {tw("random-choice-picker.presetLunchSpots")}
        </button>
        <button
          type="button"
          className={pillClass("teamTurn")}
          aria-pressed={activePreset === "teamTurn"}
          onClick={() => handlePreset("teamTurn")}
        >
          {tw("random-choice-picker.presetTeamTurn")}
        </button>
        <button
          type="button"
          className={pillClass("yesOrNo")}
          aria-pressed={activePreset === "yesOrNo"}
          onClick={() => handlePreset("yesOrNo")}
        >
          {tw("random-choice-picker.presetYesOrNo")}
        </button>
        <button
          type="button"
          className={pillClass("weekendActivity")}
          aria-pressed={activePreset === "weekendActivity"}
          onClick={() => handlePreset("weekendActivity")}
        >
          {tw("random-choice-picker.presetWeekendActivity")}
        </button>
      </div>

      <div className="tp-play-toolbar">
        <button
          type="button"
          className="tp-play-btn tp-play-btn--ghost"
          onClick={handleSample}
        >
          {tw("random-choice-picker.trySample")}
        </button>
      </div>

      <div className="tp-play-grid">
        <section className="tp-play-card">
          <h2 className="tp-play-title">
            {tw("random-choice-picker.choicesTitle")}
          </h2>
          <p className="tp-play-count">
            {items.length} {tw("random-choice-picker.countUnit")}
            {eliminateWinner && eliminated.length > 0
              ? `, ${pool.length} ${tw("random-choice-picker.remainingUnit")}`
              : ""}
          </p>

          <label className="tp-play-sub" htmlFor="random-choice-entry">
            {tw("random-choice-picker.entryLabel")}
          </label>
          <textarea
            id="random-choice-entry"
            className="tp-play-input"
            value={entry}
            onChange={(event) => {
              setEntry(event.target.value);
              clearNotice();
            }}
            placeholder={tw("random-choice-picker.entryPlaceholder")}
            rows={3}
            spellCheck={false}
          />

          <div className="tp-play-toolbar">
            <button
              type="button"
              className="tp-play-btn tp-play-btn--ghost"
              onClick={() => void handlePaste()}
            >
              <ClipboardPaste aria-hidden="true" />
              {tw("random-choice-picker.pasteButton")}
            </button>
            <button
              type="button"
              className="tp-play-btn tp-play-btn--ghost"
              onClick={handleAdd}
              disabled={!entry.trim()}
            >
              {tw("random-choice-picker.addButton")}
            </button>
            <button
              type="button"
              className="tp-play-btn tp-play-btn--ghost"
              onClick={handleClear}
              disabled={!items.length}
            >
              {t("clear")}
            </button>
          </div>

          {notice ? (
            <p className="tp-play-sub" role="alert">
              {notice}
            </p>
          ) : null}

          {items.length ? (
            <ul
              className="tp-play-grid"
              aria-label={tw("random-choice-picker.choicesTitle")}
            >
              {items.map((item, index) => {
                const isGone = eliminateWinner && eliminated.includes(item);
                return (
                  <li className="tp-play-tag" key={`${index}-${item}`}>
                    <span>{item}</span>
                    {isGone ? (
                      <span className="tp-play-count">
                        {tw("random-choice-picker.pickedLabel")}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="tp-play-btn tp-play-btn--ghost"
                      aria-label={`${tw("random-choice-picker.remove")} ${item}`}
                      onClick={() => mutateItems(removeItem(items, index))}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="tp-play-empty">
              <p className="tp-play-sub">
                {tw("random-choice-picker.emptyTitle")}
              </p>
              <p className="tp-play-sub">
                {tw("random-choice-picker.emptyHint")}
              </p>
            </div>
          )}
        </section>

        <section className="tp-play-card">
          <h2 className="tp-play-title">
            {tw("random-choice-picker.stageTitle")}
          </h2>

          <label className="tp-play-sub">
            <input
              type="checkbox"
              checked={eliminateWinner}
              onChange={(event) => {
                setEliminateWinner(event.target.checked);
                setWinner(null);
              }}
            />
            {tw("random-choice-picker.eliminateLabel")}
          </label>
          <p className="tp-play-sub">
            {tw("random-choice-picker.eliminateHint")}
          </p>

          <button
            type="button"
            className="tp-play-btn tp-play-btn--primary"
            onClick={handlePick}
            disabled={rolling || pool.length === 0}
          >
            {tw("random-choice-picker.pickButton")}
          </button>

          {rolling ? (
            <div className="tp-play-card tp-play-card--active" aria-live="polite">
              <p className="tp-play-sub">{tw("random-choice-picker.rolling")}</p>
              <p className="tp-play-winner">{rollingLabel}</p>
            </div>
          ) : null}

          {winner && !rolling ? (
            <div className="tp-play-result" aria-live="polite">
              <p className="tp-play-sub">
                {tw("random-choice-picker.winnerTitle")}
              </p>
              <p className="tp-play-winner">{winner}</p>
              <div className="tp-play-toolbar">
                <button
                  type="button"
                  className="tp-play-btn tp-play-btn--ghost"
                  onClick={() => void handleCopyWinner()}
                >
                  {copied ? t("copied") : tw("random-choice-picker.copyWinner")}
                </button>
                <button
                  type="button"
                  className="tp-play-btn tp-play-btn--ghost"
                  onClick={handlePick}
                >
                  {tw("random-choice-picker.pickAgain")}
                </button>
              </div>
            </div>
          ) : null}

          {!rolling && !winner && !pool.length && items.length ? (
            <div className="tp-play-empty">
              <p className="tp-play-sub">
                {tw("random-choice-picker.allEliminatedTitle")}
              </p>
              <p className="tp-play-sub">
                {tw("random-choice-picker.allEliminatedHint")}
              </p>
              <button
                type="button"
                className="tp-play-btn tp-play-btn--ghost"
                onClick={handleClearEliminations}
              >
                {tw("random-choice-picker.clearEliminations")}
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="tp-play-card" aria-label={tw("random-choice-picker.recentTitle")}>
        <h2 className="tp-play-title">
          {tw("random-choice-picker.recentTitle")}
        </h2>
        {recent.length ? (
          <div className="tp-play-toolbar">
            {recent.map((label, index) => (
              <span className="tp-play-chip" key={`${index}-${label}`}>
                {label}
              </span>
            ))}
          </div>
        ) : (
          <p className="tp-play-sub">{tw("random-choice-picker.noRecent")}</p>
        )}
      </section>
    </div>
  );
}
