"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Braces,
  CircleCheck,
  Copy,
  FileText,
  Hash,
  KeyRound,
  ListOrdered,
  ShieldCheck,
  Type,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * A 600×430 "film set" scaled by one transform. Every cursor target is
 * a coordinate on that set, so the choreography stays exact at any
 * viewport width. No video, no canvas — only React and Framer Motion.
 *
 * The demo is not a mock-up: counts are computed from the typed text,
 * JSON is parsed and re-serialised, and passwords come from Web Crypto.
 * ------------------------------------------------------------------ */

const CANVAS_W = 600;
/* Each scene types for ~3.5s, holds its finished result briefly, then cuts. */
const SCENE_MS = 5200;
const TAB_CENTERS = [144, 300, 456] as const;
const TAB_Y = 65;

const WORD_TEXT = "The quiet utility of doing one thing well.";
const JSON_TEXT = '{"name":"Toolpika","live":true}';
const PASSWORD_LENGTH = 16;
const PASSWORD_CHARSET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+";

const TYPE_START = 950;
const JSON_TYPE_START = 1050;
const TYPE_CHAR_MS = 92;
const PASSWORD_START = 1180;
const PASSWORD_REVEAL_MS = 3000;

/** Spaces move faster, punctuation pauses — a more human typewriter. */
function charDelay(text: string, index: number) {
  const ch = text[index];
  if (ch === " ") return TYPE_CHAR_MS * 0.55;
  if ('.!?,:;{}[]"'.includes(ch)) return TYPE_CHAR_MS * 1.45;
  return TYPE_CHAR_MS * (0.9 + ((index * 37) % 5) * 0.06);
}

/** Real counters, recomputed from whatever has actually been typed. */
function countText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, characters: 0, sentences: 0, lines: 0 };
  }
  return {
    words: trimmed.split(/\s+/).length,
    characters: text.length,
    sentences: (trimmed.match(/[.!?]+(?=\s|$)/g) ?? []).length,
    lines: text.split(/\r\n|\r|\n/).length,
  };
}

/** Cryptographically random password — the same approach as the real tool. */
function generatePassword(length = PASSWORD_LENGTH) {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return "";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += PASSWORD_CHARSET[values[index] % PASSWORD_CHARSET.length];
  }
  return output;
}

type CursorStop = { at: number; x: number; y: number; click?: boolean };

/** Cursor choreography per tool. Stops marked `click` fire the ripple. */
const CURSOR_STOPS: CursorStop[][] = [
  [
    { at: 0, x: TAB_CENTERS[0], y: TAB_Y },
    { at: 520, x: TAB_CENTERS[0], y: TAB_Y, click: true },
    { at: 900, x: 186, y: 224, click: true },
    { at: 4380, x: 106, y: 348 },
    { at: 4520, x: 106, y: 348, click: true },
  ],
  [
    { at: 0, x: TAB_CENTERS[1], y: TAB_Y },
    { at: 520, x: TAB_CENTERS[1], y: TAB_Y, click: true },
    { at: 1010, x: 172, y: 208, click: true },
    { at: 4200, x: 456, y: 214 },
    { at: 4340, x: 456, y: 214, click: true },
  ],
  [
    { at: 0, x: TAB_CENTERS[2], y: TAB_Y },
    { at: 520, x: TAB_CENTERS[2], y: TAB_Y, click: true },
    { at: 1080, x: 520, y: 248, click: true },
    { at: 4050, x: 286, y: 194 },
    { at: 4180, x: 286, y: 194, click: true },
  ],
];

/* ---------------------------- hooks -------------------------------- */

/**
 * Reveal text one character at a time on the animation frame clock.
 * A rAF loop keeps the caret and the text perfectly in step, even when
 * the tab is busy or a frame is dropped.
 */
function useTypewriter(text: string, startAt: number, reduced: boolean) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    let index = 0;
    let nextCharAt = performance.now() + startAt;
    let needsReset = true;

    const tick = (now: number) => {
      // Reset on the frame clock, not in the effect body, so React never
      // sees a synchronous state update during commit.
      if (needsReset) {
        setTyped("");
        needsReset = false;
      }
      let changed = false;
      while (index < text.length && now >= nextCharAt) {
        index += 1;
        nextCharAt += charDelay(text, index - 1);
        changed = true;
      }
      if (changed) setTyped(text.slice(0, index));
      if (index < text.length) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, startAt, reduced]);

  return reduced ? text : typed;
}

/** Reveal a prepared value over time — used by the password generator. */
function useRevealedText(text: string, startAt: number, duration: number, reduced: boolean) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!text || reduced) return;

    let frame = 0;
    let lastCount = -1;
    const startsAt = performance.now() + startAt;

    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startsAt) / duration));
      const count = Math.floor(progress * text.length);
      if (count !== lastCount) {
        lastCount = count;
        setShown(text.slice(0, count));
      }
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, startAt, duration, reduced]);

  return reduced ? text : shown;
}

/** Real JSON parse + pretty-print. Incomplete input stays invalid. */
function useFormattedJson(text: string) {
  return useMemo(() => {
    if (!text.trim()) return { valid: false, pretty: "" };
    try {
      const value: unknown = JSON.parse(text);
      return { valid: true, pretty: JSON.stringify(value, null, 2) };
    } catch {
      return { valid: false, pretty: "" };
    }
  }, [text]);
}

/* -------------------------- fake cursor ---------------------------- */

function FakeCursor({ x, y, press, pressed }: { x: number; y: number; press: number; pressed: boolean }) {
  return (
    <>
      <motion.div
        className="tp-demo-cursor"
        initial={false}
        animate={{ x, y, scale: pressed ? 0.86 : 1 }}
        transition={{
          x: { type: "spring", stiffness: 120, damping: 24, mass: 0.85 },
          y: { type: "spring", stiffness: 120, damping: 24, mass: 0.85 },
          scale: { duration: 0.18, ease: "easeOut" },
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 2.5 4 19l4.6-4.5 3 6.6 2.6-1.2-3-6.5H18z"
            fill="var(--accent)"
          />
        </svg>
      </motion.div>
      <AnimatePresence>
        {press > 0 ? (
          <motion.span
            key={press}
            className="tp-demo-click"
            style={{ left: x, top: y }}
            initial={{ opacity: 0.85, scale: 0.35 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

function Caret() {
  return <span className="tp-demo-caret" aria-hidden="true" />;
}

/* --------------------------- scenarios ----------------------------- */

const STAT_META = [
  { Icon: Type, label: "Words" },
  { Icon: Hash, label: "Characters" },
  { Icon: FileText, label: "Sentences" },
  { Icon: ListOrdered, label: "Lines" },
] as const;

function WordCounterScene({ reduced }: { reduced: boolean }) {
  const typed = useTypewriter(WORD_TEXT, TYPE_START, reduced);
  const done = typed.length === WORD_TEXT.length;
  const counts = countText(typed);
  const values = [counts.words, counts.characters, counts.sentences, counts.lines];

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-docbar">
        <span className="tp-demo-docbar-title"><FileText className="tp-demo-mini-icon" />Untitled note</span>
        <span className={done ? "tp-demo-docbar-meta is-done" : "tp-demo-docbar-meta"}>
          {done ? (
            <CircleCheck className="tp-demo-mini-icon" />
          ) : (
            <span className="tp-demo-typing-dot" aria-hidden="true" />
          )}
          {done ? "Counted live" : "Counting live"}
        </span>
      </div>

      <div className="tp-demo-editor">
        <span>{typed}</span>
        <Caret />
        <span className="tp-demo-editor-pulse" />
      </div>

      <div className="tp-demo-stats">
        {STAT_META.map(({ Icon, label }, index) => (
          <div key={label} className={`tp-demo-stat${index === 0 ? " is-primary" : ""}`}>
            <motion.b
              key={`${label}-${values[index]}`}
              initial={reduced ? false : { opacity: 0.45, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            >
              {values[index]}
            </motion.b>
            <span><Icon className="tp-demo-mini-icon" />{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Colour one line of already-formatted JSON without inventing values. */
function highlightJson(line: string) {
  const parts: ReactNode[] = [];
  const pattern = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
  let cursor = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) parts.push(line.slice(cursor, match.index));
    if (match[1]) {
      if (match[2]) {
        parts.push(<span className="tp-demo-key" key={key++}>{match[1]}</span>);
        parts.push(<span className="tp-demo-punc" key={key++}>{match[2]}</span>);
      } else {
        parts.push(<span className="tp-demo-str" key={key++}>{match[1]}</span>);
      }
    } else if (match[3]) {
      parts.push(<span className="tp-demo-bool" key={key++}>{match[3]}</span>);
    } else if (match[4]) {
      parts.push(<span className="tp-demo-num" key={key++}>{match[4]}</span>);
    }
    cursor = pattern.lastIndex;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
}

function JsonFormatterScene({ reduced }: { reduced: boolean }) {
  const typed = useTypewriter(JSON_TEXT, JSON_TYPE_START, reduced);
  const { valid, pretty } = useFormattedJson(typed);
  const lines = pretty ? pretty.split("\n") : [];

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-panels">
        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head">
            <span><Braces className="tp-demo-mini-icon" />Input</span>
            <span className="tp-demo-panel-tag">{typed.length ? `${typed.length} chars` : "RAW"}</span>
          </div>
          <div className="tp-demo-panel-body">
            <pre className="tp-demo-code"><span>{typed}</span><Caret /></pre>
          </div>
        </div>

        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head">
            <span><CircleCheck className="tp-demo-mini-icon" />Output</span>
            <span className={valid ? "tp-demo-panel-tag is-valid" : "tp-demo-panel-tag"}>
              {valid ? "VALID" : typed ? "PARSING" : "READY"}
            </span>
          </div>
          <div className="tp-demo-panel-body">
            <AnimatePresence mode="wait">
              {valid ? (
                <motion.pre
                  key="pretty"
                  className="tp-demo-code"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduced ? 0 : 0.2 }}
                >
                  {lines.map((line, index) => (
                    <motion.span
                      className="tp-demo-code-line"
                      key={index}
                      initial={reduced ? false : { opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reduced ? 0 : 0.28, delay: reduced ? 0 : index * 0.07 }}
                    >
                      <span className="tp-demo-line-no">{index + 1}</span>
                      {highlightJson(line)}
                    </motion.span>
                  ))}
                </motion.pre>
              ) : (
                <motion.div
                  key="skeleton"
                  className="tp-demo-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span /><span /><span />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

const STRENGTH_LABELS = ["Waiting", "Weak", "Fair", "Strong", "Very strong"] as const;
const STRENGTH_BADGES = ["…", "WEAK", "FAIR", "STRONG", "VERY STRONG"] as const;

function PasswordScene({ reduced }: { reduced: boolean }) {
  const [secret, setSecret] = useState("");

  // Generate once after mount so the server and client render the same markup.
  useEffect(() => {
    const timer = window.setTimeout(() => setSecret(generatePassword()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // The fake cursor clicks Generate at ~1.1s; characters then fill in live.
  const password = useRevealedText(secret, PASSWORD_START, PASSWORD_REVEAL_MS, reduced);
  const done = secret.length > 0 && password.length === secret.length;
  const entropy = password
    ? Math.round(password.length * Math.log2(PASSWORD_CHARSET.length))
    : 0;
  const score = entropy >= 80 ? 4 : entropy >= 60 ? 3 : entropy >= 40 ? 2 : entropy > 0 ? 1 : 0;

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-pw-wrap">
        <div className="tp-demo-pw-box">
          <span className="tp-demo-pw-value" data-empty={!password}>
            {password ? (
              <>
                {password}
                {done ? null : <Caret />}
              </>
            ) : (
              "••••••••••••••••"
            )}
          </span>
          <span className="tp-demo-copy" aria-hidden="true"><Copy className="tp-demo-mini-icon" /></span>
        </div>

        <div className="tp-demo-pw-actions">
          <span className="tp-demo-pw-note"><ShieldCheck className="tp-demo-mini-icon" />Generated with Web Crypto</span>
          <span className={done ? "tp-demo-generate is-done" : "tp-demo-generate"}>
            <KeyRound className="tp-demo-mini-icon" />Generate
          </span>
        </div>

        <div className="tp-demo-strength">
          <div className="tp-demo-strength-head">
            <span>Strength</span>
            <span className="tp-demo-strength-label">{STRENGTH_LABELS[score]}</span>
          </div>
          <div className="tp-demo-strength-bars">
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                className="tp-demo-strength-bar"
                initial={false}
                animate={{ opacity: score > index ? 1 : 0.18, scaleY: score > index ? 1 : 0.7 }}
                transition={{ duration: reduced ? 0 : 0.32, delay: reduced ? 0 : index * 0.04 }}
              />
            ))}
          </div>
          <div className="tp-demo-strength-foot">
            <span>{password ? `${password.length} characters · ${entropy} bits` : "Waiting for input"}</span>
            <span className="tp-demo-pw-badge">{STRENGTH_BADGES[score]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- shell ------------------------------- */

const TOOLS = [
  { label: "Word Counter", Icon: Type },
  { label: "JSON Formatter", Icon: Braces },
  { label: "Password Generator", Icon: KeyRound },
] as const;

export function HeroDemo() {
  const reduced = useReducedMotion() ?? false;
  const [toolIndex, setToolIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; press: number; pressed: boolean }>({
    x: TAB_CENTERS[0],
    y: TAB_Y,
    press: 0,
    pressed: false,
  });
  const [scale, setScale] = useState(0.9);
  const [zoom, setZoom] = useState(1.002);
  const viewportRef = useRef<HTMLDivElement>(null);

  /* One scale transform keeps the fixed canvas responsive on every width. */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CANVAS_W);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Controller: advance through the three tools on a steady loop. */
  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => setToolIndex((current) => (current + 1) % 3), SCENE_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  /* The tab lights up on the click, not on the cut. */
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setActiveTab(toolIndex), 560);
    return () => window.clearTimeout(timer);
  }, [toolIndex, reduced]);

  const shownTab = reduced ? toolIndex : activeTab;

  /* Drive the fake cursor through the current tool's choreography. */
  useEffect(() => {
    if (reduced) return;
    const [first, ...rest] = CURSOR_STOPS[toolIndex];

    // New scene, new start: place the pointer on the tab instantly instead of
    // sweeping it across the whole canvas from the previous scene. Deferred so
    // the state update never happens synchronously inside the effect.
    const timers: number[] = [];
    timers.push(window.setTimeout(() => {
      setCursor((previous) => ({ x: first.x, y: first.y, press: previous.press, pressed: false }));
    }, 0));

    rest.forEach((stop) => {
      timers.push(window.setTimeout(() => {
        setCursor((previous) => ({
          x: stop.x,
          y: stop.y,
          press: stop.click ? previous.press + 1 : previous.press,
          pressed: Boolean(stop.click),
        }));
        if (stop.click) {
          timers.push(window.setTimeout(
            () => setCursor((previous) => ({ ...previous, pressed: false })),
            160,
          ));
        }
      }, stop.at));
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toolIndex, reduced]);

  /* Every cursor hop gives the set a small, cursor-anchored zoom pulse. */
  useEffect(() => {
    if (reduced) {
      const reset = window.setTimeout(() => setZoom(1), 0);
      return () => window.clearTimeout(reset);
    }
    const pulse = window.setTimeout(() => setZoom(1.014), 0);
    const release = window.setTimeout(() => setZoom(1.002), 380);
    return () => {
      window.clearTimeout(pulse);
      window.clearTimeout(release);
    };
  }, [cursor.x, cursor.y, reduced]);

  return (
    <motion.div
      className="tp-demo-float"
      animate={reduced ? undefined : { y: [0, -5, 0] }}
      transition={reduced ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-hidden="true"
    >
      <div className="tp-demo-viewport" ref={viewportRef}>
        <div className="tp-demo-canvas" style={{ transform: `scale(${scale})` }}>
          <motion.div
            className="tp-demo-zoom"
            style={{ transformOrigin: `${cursor.x}px ${cursor.y}px` }}
            animate={{ scale: reduced ? 1 : zoom }}
            transition={reduced ? undefined : {
              type: "spring",
              stiffness: 220,
              damping: 26,
              mass: 0.6,
            }}
          >
            <div className="tp-demo-bezel">
              <div className="tp-demo-core">
                <div className="tp-demo-bar">
                  <span className="tp-demo-dot tp-demo-dot--red" />
                  <span className="tp-demo-dot tp-demo-dot--yellow" />
                  <span className="tp-demo-dot tp-demo-dot--green" />
                  <span className="tp-demo-url">toolpika.site</span>
                  <span className="tp-demo-bar-note">Real tools · running locally</span>
                </div>

                <div className="tp-demo-tabs">
                  {TOOLS.map(({ label, Icon }, index) => (
                    <span
                      key={label}
                      className={`tp-demo-tab${shownTab === index ? " is-active" : ""}`}
                    >
                      {shownTab === index ? (
                        <motion.span
                          className="tp-demo-tab-pill"
                          layoutId="tp-demo-tab-pill"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <Icon className="tp-demo-tab-icon" />
                      <span className="tp-demo-tab-label">{label}</span>
                    </span>
                  ))}
                </div>

                <div className="tp-demo-stage">
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={toolIndex}
                      className="tp-demo-scene-wrap"
                      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.99 }}
                      transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {toolIndex === 0 ? (
                        <WordCounterScene reduced={reduced} />
                      ) : toolIndex === 1 ? (
                        <JsonFormatterScene reduced={reduced} />
                      ) : (
                        <PasswordScene reduced={reduced} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="tp-demo-foot">
                  <div className="tp-demo-timeline">
                    <motion.span
                      key={toolIndex}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: reduced ? 0 : SCENE_MS / 1000, ease: "linear" }}
                    />
                  </div>
                  <span className="tp-demo-foot-note"><ShieldCheck className="tp-demo-mini-icon" />Runs in your browser</span>
                  <span className="tp-demo-foot-count">0{toolIndex + 1} / 03</span>
                </div>
              </div>
            </div>
          </motion.div>

          {reduced ? null : (
            <FakeCursor x={cursor.x} y={cursor.y} press={cursor.press} pressed={cursor.pressed} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
