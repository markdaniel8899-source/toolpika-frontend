"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FILTERS,
  SAMPLE_TEXT,
  countCharacters,
  getVisibleStyles,
  transformText,
  truncateForCard,
  type FilterId,
  type StyleId,
} from "./fancy-font-generator.logic";

export default function FancyFontGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [copiedId, setCopiedId] = useState<StyleId | null>(null);
  const flashTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const filterLabels: Record<FilterId, string> = {
    all: tw("fancy-font-generator.filterAll"),
    serif: tw("fancy-font-generator.filterSerif"),
    modern: tw("fancy-font-generator.filterModern"),
    playful: tw("fancy-font-generator.filterPlayful"),
  };

  const styleLabels: Record<StyleId, string> = {
    bold: tw("fancy-font-generator.styleBold"),
    italic: tw("fancy-font-generator.styleItalic"),
    boldItalic: tw("fancy-font-generator.styleBoldItalic"),
    cursiveScript: tw("fancy-font-generator.styleCursiveScript"),
    boldScript: tw("fancy-font-generator.styleBoldScript"),
    fraktur: tw("fancy-font-generator.styleFraktur"),
    monospace: tw("fancy-font-generator.styleMonospace"),
    doubleStruck: tw("fancy-font-generator.styleDoubleStruck"),
    bubble: tw("fancy-font-generator.styleBubble"),
    square: tw("fancy-font-generator.styleSquare"),
    smallCaps: tw("fancy-font-generator.styleSmallCaps"),
    wideText: tw("fancy-font-generator.styleWideText"),
    strikethrough: tw("fancy-font-generator.styleStrikethrough"),
    upsideDown: tw("fancy-font-generator.styleUpsideDown"),
  };

  const visible = useMemo(() => getVisibleStyles(filter), [filter]);
  const hasText = text.trim().length > 0;
  const source = hasText ? text : SAMPLE_TEXT;
  const count = countCharacters(text);

  const copyStyle = async (style: StyleId) => {
    try {
      await navigator.clipboard.writeText(transformText(source, style));
      setCopiedId(style);
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="tp-play">
      <header className="tp-play-head">
        <h2 className="tp-play-title">{tw("fancy-font-generator.title")}</h2>
        <p className="tp-play-sub">{tw("fancy-font-generator.subtitle")}</p>
      </header>

      <div className="tp-play-toolbar" role="group" aria-label={tw("fancy-font-generator.filterLabel")}>
        {FILTERS.map((id) => (
          <button
            key={id}
            type="button"
            className={`tp-play-pill${filter === id ? " tp-play-pill--active" : ""}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {filterLabels[id]}
          </button>
        ))}
      </div>

      <div className="tp-play-toolbar">
        <label className="tp-play-tag" htmlFor="fancy-font-source">
          {tw("fancy-font-generator.inputLabel")}
        </label>
        <input
          id="fancy-font-source"
          className="tp-play-input"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={tw("fancy-font-generator.inputPlaceholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <span className="tp-play-count" aria-live="polite">
          {count} {tw("fancy-font-generator.charactersLabel")}
        </span>
        <button
          type="button"
          className="tp-play-btn tp-play-btn--primary"
          onClick={() => setText(SAMPLE_TEXT)}
        >
          {tw("fancy-font-generator.trySample")}
        </button>
        <button
          type="button"
          className="tp-play-btn tp-play-btn--ghost"
          disabled={!text}
          onClick={() => setText("")}
        >
          {t("clear")}
        </button>
      </div>

      {!hasText && <p className="tp-play-empty">{tw("fancy-font-generator.sampleHint")}</p>}

      <div className="tp-play-grid">
        {visible.map((style) => {
          const isCopied = copiedId === style;
          const preview = truncateForCard(transformText(source, style));
          return (
            <div
              key={style}
              className={`tp-play-card${isCopied ? " tp-play-card--active" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${styleLabels[style]}: ${isCopied ? t("copied") : t("copy")}`}
              onClick={() => void copyStyle(style)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void copyStyle(style);
                }
              }}
            >
              <span className="tp-play-chip">{styleLabels[style]}</span>
              <span className="tp-play-result" aria-hidden="true">
                {preview}
              </span>
              <button
                type="button"
                className="tp-play-btn tp-play-btn--ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  void copyStyle(style);
                }}
              >
                {isCopied ? t("copied") : t("copy")}
              </button>
            </div>
          );
        })}
      </div>

      <div className="tp-play-toolbar">
        <span className="tp-play-tag">{tw("fancy-font-generator.tipGood")}</span>
        <span className="tp-play-tag">{tw("fancy-font-generator.tipAvoid")}</span>
        <span className="tp-play-tag">{tw("fancy-font-generator.tipAccess")}</span>
      </div>
    </div>
  );
}
