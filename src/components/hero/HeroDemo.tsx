"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
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
 * The demo is a single input-driven timeline: the cursor moves, clicks,
 * then the tool reacts. Nothing types or transforms before its click.
 * ------------------------------------------------------------------ */

const CANVAS_W = 600;
/* Core starts 13px into the bezel; the 42px bar + 46px tabs put tab
 * centres at y=78. Earlier y=65 landed in the browser chrome. */
const TAB_Y = 78;
const TAB_CENTERS = [144, 300, 456] as const;

const WORD_TEXT = "The quiet utility of doing one thing well.";
const JSON_TEXT = '{"name":"Toolpika","live":true}';

const WORD_FIELD = { x: 190, y: 212 };
const WORD_ASIDE = { x: 430, y: 248 };

const JSON_INPUT = { x: 158, y: 214 };
const JSON_ASIDE = { x: 250, y: 250 };
const JSON_FORMAT = { x: 258, y: 138 };

const PW_DIFFICULTY = { x: 460, y: 139 };
const PW_GENERATE = { x: 510, y: 259 };

const CLICK_MS = 200;
const REVEAL_MS = 1500;
const REDUCED_PASSWORD = "Tp!7kQ2#sM9@uR4x";

const DIFFICULTIES = [
  {
    label: "Basic",
    length: 12,
    charset: "abcdefghijkmnopqrstuvwxyz23456789",
  },
  {
    label: "Strong",
    length: 16,
    charset: "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+",
  },
  {
    label: "Ultra",
    length: 24,
    charset: "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+",
  },
] as const;

type Phase =
  | "word-focus"
  | "word-click"
  | "word-aside-move"
  | "word-type"
  | "word-hold"
  | "json-tab-move"
  | "json-tab-click"
  | "json-field-move"
  | "json-field-click"
  | "json-aside-move"
  | "json-type"
  | "json-format-move"
  | "json-format-click"
  | "json-hold"
  | "pw-tab-move"
  | "pw-tab-click"
  | "pw-difficulty-move"
  | "pw-difficulty-click"
  | "pw-generate-move"
  | "pw-generate-click"
  | "pw-reveal"
  | "pw-hold"
  | "word-tab-move"
  | "word-tab-click";

type DemoAction =
  | "word-field"
  | "json-field"
  | "json-format"
  | "pw-difficulty"
  | "pw-generate"
  | "tab-0"
  | "tab-1"
  | "tab-2";

/** Spaces move faster, punctuation pauses — a more human typewriter. */
function charDelay(text: string, index: number, base: number) {
  const ch = text[index];
  if (ch === " ") return base * 0.55;
  if ('.!?,:;{}[]"'.includes(ch)) return base * 1.45;
  return base * (0.9 + ((index * 37) % 5) * 0.06);
}

/** The typing clock is shared with the timeline so both finish together. */
function typeDuration(text: string, base: number) {
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    total += charDelay(text, index, base);
  }
  return total;
}

const TYPE_WORD_MS = typeDuration(WORD_TEXT, 68);
const TYPE_JSON_MS = typeDuration(JSON_TEXT, 52);

/** Every phase's real timespan; the progress bar is derived from these. */
const PHASE_MS: Record<Phase, number> = {
  "word-focus": 450,
  "word-click": CLICK_MS,
  "word-aside-move": 260,
  "word-type": TYPE_WORD_MS,
  "word-hold": 280,
  "json-tab-move": 550,
  "json-tab-click": CLICK_MS,
  "json-field-move": 500,
  "json-field-click": CLICK_MS,
  "json-aside-move": 240,
  "json-type": TYPE_JSON_MS,
  "json-format-move": 420,
  "json-format-click": CLICK_MS,
  "json-hold": 480,
  "pw-tab-move": 550,
  "pw-tab-click": CLICK_MS,
  "pw-difficulty-move": 480,
  "pw-difficulty-click": CLICK_MS,
  "pw-generate-move": 480,
  "pw-generate-click": CLICK_MS,
  "pw-reveal": REVEAL_MS,
  "pw-hold": 480,
  "word-tab-move": 550,
  "word-tab-click": CLICK_MS,
};

const TOTAL_MS = Object.values(PHASE_MS).reduce((sum, ms) => sum + ms, 0);

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
function generatePassword(length: number, charset: string) {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return "";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += charset[values[index] % charset.length];
  }
  return output;
}

/** Real JSON parse + pretty-print. Incomplete input stays invalid. */
function formatJson(text: string) {
  if (!text.trim()) return { valid: false, pretty: "" };
  try {
    const value: unknown = JSON.parse(text);
    return { valid: true, pretty: JSON.stringify(value, null, 2) };
  } catch {
    return { valid: false, pretty: "" };
  }
}

/* ---------------------------- fake cursor ---------------------------- */

type Ripple = { id: number; x: number; y: number };

function FakeCursor({
  x,
  y,
  scale,
  ripple,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  ripple: Ripple | null;
}) {
  return (
    <>
      <motion.div
        className="tp-demo-cursor"
        style={{ x, y, scale }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 2.5 4 19l4.6-4.5 3 6.6 2.6-1.2-3-6.5H18z"
            fill="var(--accent)"
          />
        </svg>
      </motion.div>
      <AnimatePresence>
        {ripple ? (
          <motion.span
            key={ripple.id}
            className="tp-demo-click"
            style={{ left: ripple.x, top: ripple.y }}
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

function WordCounterScene({
  typed,
  reduced,
  pressed,
}: {
  typed: string;
  reduced: boolean;
  pressed: boolean;
}) {
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

      <motion.div
        className="tp-demo-editor"
        data-pressed={pressed}
        animate={{ scale: pressed && !reduced ? 0.994 : 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.5 }}
      >
        <span>{typed}</span>
        <Caret />
        <span className="tp-demo-editor-pulse" />
      </motion.div>

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

function JsonFormatterScene({
  typed,
  formatted,
  reduced,
  pressedFormat,
}: {
  typed: string;
  formatted: boolean;
  reduced: boolean;
  pressedFormat: boolean;
}) {
  const result = useMemo(() => formatJson(typed), [typed]);
  const showPretty = formatted && result.valid;
  const lines = showPretty ? result.pretty.split("\n") : [];

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-panels">
        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head">
            <span><Braces className="tp-demo-mini-icon" />Input</span>
            <motion.span
              className="tp-demo-format"
              data-ready={result.valid}
              data-pressed={pressedFormat}
              animate={{ scale: pressedFormat && !reduced ? 0.96 : 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.5 }}
            >
              <WandIcon />Format
            </motion.span>
          </div>
          <div className="tp-demo-panel-body">
            <pre className="tp-demo-code"><span>{typed}</span><Caret /></pre>
          </div>
        </div>

        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head">
            <span><CircleCheck className="tp-demo-mini-icon" />Output</span>
            <span className={showPretty ? "tp-demo-panel-tag is-valid" : "tp-demo-panel-tag"}>
              {showPretty ? "VALID" : typed ? "UNFORMATTED" : "READY"}
            </span>
          </div>
          <div className="tp-demo-panel-body">
            <AnimatePresence mode="wait">
              {showPretty ? (
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

function WandIcon() {
  return (
    <svg className="tp-demo-mini-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 20 11-11M15 4v4m-2-2h4M19 12v4m-2-2h4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

const STRENGTH_LABELS = ["Waiting", "Weak", "Fair", "Strong", "Very strong"] as const;
const STRENGTH_BADGES = ["…", "WEAK", "FAIR", "STRONG", "VERY STRONG"] as const;

function PasswordScene({
  difficulty,
  password,
  complete,
  reduced,
  pressedDifficulty,
  pressedGenerate,
}: {
  difficulty: number;
  password: string;
  complete: boolean;
  reduced: boolean;
  pressedDifficulty: boolean;
  pressedGenerate: boolean;
}) {
  const config = DIFFICULTIES[difficulty];
  const entropy = password
    ? Math.round(password.length * Math.log2(config.charset.length))
    : 0;
  const score = entropy >= 80 ? 4 : entropy >= 60 ? 3 : entropy >= 40 ? 2 : entropy > 0 ? 1 : 0;

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-pw-wrap">
        <div className="tp-demo-pw-setup">
          <span className="tp-demo-pw-setup-label">Difficulty</span>
          <div className="tp-demo-difficulty">
            {DIFFICULTIES.map((option, index) => (
              <motion.span
                key={option.label}
                className={`tp-demo-difficulty-chip${difficulty === index ? " is-active" : ""}`}
                data-pressed={pressedDifficulty && difficulty === index}
                animate={{ scale: pressedDifficulty && difficulty === index && !reduced ? 0.95 : 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.5 }}
              >
                {option.label}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="tp-demo-pw-box">
          <span className="tp-demo-pw-value" data-empty={!password}>
            {password ? (
              <>
                {password}
                {complete ? null : <Caret />}
              </>
            ) : (
              "\u00a0"
            )}
          </span>
          <span className="tp-demo-copy" aria-hidden="true"><Copy className="tp-demo-mini-icon" /></span>
        </div>

        <div className="tp-demo-pw-actions">
          <span className="tp-demo-pw-note"><ShieldCheck className="tp-demo-mini-icon" />Generated with Web Crypto</span>
          <motion.span
            className={complete ? "tp-demo-generate is-done" : "tp-demo-generate"}
            data-pressed={pressedGenerate}
            animate={{ scale: pressedGenerate && !reduced ? 0.96 : 1 }}
            transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.5 }}
          >
            <KeyRound className="tp-demo-mini-icon" />Generate
          </motion.span>
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
  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [phase, setPhase] = useState<Phase>("word-focus");
  const [wordTyped, setWordTyped] = useState("");
  const [jsonTyped, setJsonTyped] = useState("");
  const [jsonFormatted, setJsonFormatted] = useState(false);
  const [difficulty, setDifficulty] = useState(0);
  const [secret, setSecret] = useState("");
  const [passwordShown, setPasswordShown] = useState("");
  const secretRef = useRef("");
  const cycleElapsed = useRef(0);
  const [pressing, setPressing] = useState(false);
  const [pressedAction, setPressedAction] = useState<DemoAction | null>(null);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(0.9);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);

  const cursorX = useMotionValue<number>(TAB_CENTERS[0]);
  const cursorY = useMotionValue<number>(TAB_Y);
  const cursorScale = useMotionValue<number>(1);
  const timelineProgress = useMotionValue<number>(0);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

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

  /* Reduced motion gets the finished states, without a moving pointer. */
  useEffect(() => {
    if (!reduced) return;
    const timer = window.setTimeout(() => {
      setSceneIndex(0);
      setActiveTab(0);
      setWordTyped(WORD_TEXT);
      setJsonTyped(JSON_TEXT);
      setJsonFormatted(true);
      setDifficulty(1);
      secretRef.current = REDUCED_PASSWORD;
      setSecret(REDUCED_PASSWORD);
      setPasswordShown(REDUCED_PASSWORD);
      cursorX.set(TAB_CENTERS[0]);
      cursorY.set(TAB_Y);
      timelineProgress.set(1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reduced, cursorX, cursorY, timelineProgress]);

  useEffect(() => {
    if (reduced) return;
    const controls = animate(cursorScale, pressing ? 0.86 : 1, {
      duration: 0.16,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [pressing, reduced, cursorScale]);

  /* The whole demo is one cancellable input-driven timeline. */
  useEffect(() => {
    if (reduced) return;

    if (phase === "word-focus") {
      cycleElapsed.current = 0;
      timelineProgress.set(0);
    }

    let cancelled = false;
    let frame = 0;

    const waitForResume = () =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (cancelled || !pausedRef.current) {
            resolve();
            return;
          }
          frame = requestAnimationFrame(check);
        };
        check();
      });

    /* The timeline advances on the same frames as the actions, so the line
       never waits for a phase change to jump to another hard-coded value. */
    const advanceClock = (delta: number) => {
      if (pausedRef.current) return;
      cycleElapsed.current = Math.min(TOTAL_MS, cycleElapsed.current + delta);
      timelineProgress.set(cycleElapsed.current / TOTAL_MS);
    };

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        let elapsed = 0;
        let last = performance.now();
        const tick = (now: number) => {
          if (cancelled) {
            resolve();
            return;
          }
          if (pausedRef.current) {
            last = now;
            frame = requestAnimationFrame(tick);
            return;
          }
          const delta = now - last;
          last = now;
          elapsed += delta;
          advanceClock(delta);
          if (elapsed >= ms) {
            resolve();
            return;
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });

    const moveTo = async (x: number, y: number, duration = 0.6) => {
      await waitForResume();
      if (cancelled) return;
      const fromX = cursorX.get();
      const fromY = cursorY.get();
      const total = duration * 1000;

      await new Promise<void>((resolve) => {
        let elapsed = 0;
        let last = performance.now();
        const tick = (now: number) => {
          if (cancelled) {
            resolve();
            return;
          }
          if (pausedRef.current) {
            last = now;
            frame = requestAnimationFrame(tick);
            return;
          }
          const delta = Math.min(now - last, Math.max(0, total - elapsed));
          last = now;
          elapsed += delta;
          advanceClock(delta);

          const fraction = total > 0 ? elapsed / total : 1;
          const eased = 1 - Math.pow(1 - fraction, 4);
          cursorX.set(fromX + (x - fromX) * eased);
          cursorY.set(fromY + (y - fromY) * eased);

          if (elapsed >= total) {
            resolve();
            return;
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });
    };

    const click = async (action: () => void, target?: DemoAction) => {
      await waitForResume();
      if (cancelled) return;
      setRipple({ id: Date.now(), x: cursorX.get(), y: cursorY.get() });
      setPressing(true);
      setPressedAction(target ?? null);
      action();
      await sleep(120);
      if (!cancelled) {
        setPressing(false);
        setPressedAction(null);
      }
      await sleep(CLICK_MS - 120);
    };

    /* Cursor stays parked beside the field; only the text writes itself. */
    const typeText = async (
      text: string,
      baseDelay: number,
      onUpdate: (value: string) => void,
    ) => {
      await waitForResume();
      if (cancelled) return;

      await new Promise<void>((resolve) => {
        let elapsed = 0;
        let last = performance.now();

        const tick = (now: number) => {
          if (cancelled) {
            resolve();
            return;
          }
          if (pausedRef.current) {
            last = now;
            frame = requestAnimationFrame(tick);
            return;
          }
          const delta = now - last;
          last = now;
          elapsed += delta;
          advanceClock(delta);

          let count = 0;
          let used = 0;
          while (count < text.length && elapsed >= used + charDelay(text, count, baseDelay)) {
            used += charDelay(text, count, baseDelay);
            count += 1;
          }

          onUpdate(text.slice(0, count));

          if (count >= text.length) {
            resolve();
            return;
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });
    };

    const revealText = async (text: string, onUpdate: (value: string) => void) => {
      await waitForResume();
      if (cancelled) return;

      await new Promise<void>((resolve) => {
        let elapsed = 0;
        let last = performance.now();

        const tick = (now: number) => {
          if (cancelled) {
            resolve();
            return;
          }
          if (pausedRef.current) {
            last = now;
            frame = requestAnimationFrame(tick);
            return;
          }
          const delta = now - last;
          last = now;
          elapsed += delta;
          advanceClock(delta);
          const count = Math.min(text.length, Math.floor((elapsed / REVEAL_MS) * text.length));
          onUpdate(text.slice(0, count));
          if (count >= text.length) {
            resolve();
            return;
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      });
    };

    const run = async () => {
      switch (phase) {
        case "word-focus":
          await moveTo(WORD_FIELD.x, WORD_FIELD.y, 0.45);
          if (!cancelled) setPhase("word-click");
          break;
        case "word-click":
          await click(() => undefined, "word-field");
          if (!cancelled) setPhase("word-aside-move");
          break;
        case "word-aside-move":
          await moveTo(WORD_ASIDE.x, WORD_ASIDE.y, 0.26);
          if (!cancelled) setPhase("word-type");
          break;
        case "word-type":
          setWordTyped("");
          await typeText(WORD_TEXT, 68, setWordTyped);
          if (!cancelled) setPhase("word-hold");
          break;
        case "word-hold":
          await sleep(280);
          if (!cancelled) setPhase("json-tab-move");
          break;

        case "json-tab-move":
          await moveTo(TAB_CENTERS[1], TAB_Y, 0.55);
          if (!cancelled) setPhase("json-tab-click");
          break;
        case "json-tab-click":
          await click(() => {
            setActiveTab(1);
            setSceneIndex(1);
            setJsonTyped("");
            setJsonFormatted(false);
          }, "tab-1");
          if (!cancelled) setPhase("json-field-move");
          break;
        case "json-field-move":
          await moveTo(JSON_INPUT.x, JSON_INPUT.y, 0.5);
          if (!cancelled) setPhase("json-field-click");
          break;
        case "json-field-click":
          await click(() => undefined, "json-field");
          if (!cancelled) setPhase("json-aside-move");
          break;
        case "json-aside-move":
          await moveTo(JSON_ASIDE.x, JSON_ASIDE.y, 0.24);
          if (!cancelled) setPhase("json-type");
          break;
        case "json-type":
          await typeText(JSON_TEXT, 52, setJsonTyped);
          if (!cancelled) setPhase("json-format-move");
          break;
        case "json-format-move":
          await moveTo(JSON_FORMAT.x, JSON_FORMAT.y, 0.42);
          if (!cancelled) setPhase("json-format-click");
          break;
        case "json-format-click":
          await click(() => setJsonFormatted(true), "json-format");
          if (!cancelled) setPhase("json-hold");
          break;
        case "json-hold":
          await sleep(480);
          if (!cancelled) setPhase("pw-tab-move");
          break;

        case "pw-tab-move":
          await moveTo(TAB_CENTERS[2], TAB_Y, 0.55);
          if (!cancelled) setPhase("pw-tab-click");
          break;
        case "pw-tab-click":
          await click(() => {
            setActiveTab(2);
            setSceneIndex(2);
            setDifficulty(0);
            secretRef.current = "";
            setSecret("");
            setPasswordShown("");
          }, "tab-2");
          if (!cancelled) setPhase("pw-difficulty-move");
          break;
        case "pw-difficulty-move":
          await moveTo(PW_DIFFICULTY.x, PW_DIFFICULTY.y, 0.48);
          if (!cancelled) setPhase("pw-difficulty-click");
          break;
        case "pw-difficulty-click":
          await click(() => setDifficulty(1), "pw-difficulty");
          if (!cancelled) setPhase("pw-generate-move");
          break;
        case "pw-generate-move":
          await moveTo(PW_GENERATE.x, PW_GENERATE.y, 0.48);
          if (!cancelled) setPhase("pw-generate-click");
          break;
        case "pw-generate-click":
          await click(() => {
            const next = generatePassword(DIFFICULTIES[1].length, DIFFICULTIES[1].charset);
            secretRef.current = next;
            setPasswordShown("");
            setSecret(next);
          }, "pw-generate");
          if (!cancelled) setPhase("pw-reveal");
          break;
        case "pw-reveal":
          if (secretRef.current) await revealText(secretRef.current, setPasswordShown);
          if (!cancelled) setPhase("pw-hold");
          break;
        case "pw-hold":
          await sleep(480);
          if (!cancelled) setPhase("word-tab-move");
          break;

        case "word-tab-move":
          await moveTo(TAB_CENTERS[0], TAB_Y, 0.55);
          if (!cancelled) setPhase("word-tab-click");
          break;
        case "word-tab-click":
          await click(() => {
            setActiveTab(0);
            setSceneIndex(0);
            setWordTyped("");
          }, "tab-0");
          if (!cancelled) setPhase("word-focus");
          break;
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      setPressing(false);
      setPressedAction(null);
    };
  }, [phase, reduced, cursorX, cursorY, timelineProgress]);

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
                  <motion.span
                    key={label}
                    className={`tp-demo-tab${activeTab === index ? " is-active" : ""}`}
                    data-pressed={pressedAction === `tab-${index}`}
                    animate={{ scale: pressedAction === `tab-${index}` && !reduced ? 0.97 : 1 }}
                    transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.5 }}
                  >
                    {activeTab === index ? (
                      <motion.span
                        className="tp-demo-tab-pill"
                        layoutId="tp-demo-tab-pill"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <Icon className="tp-demo-tab-icon" />
                    <span className="tp-demo-tab-label">{label}</span>
                  </motion.span>
                ))}
              </div>

              <div className="tp-demo-stage">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={sceneIndex}
                    className="tp-demo-scene-wrap"
                    initial={reduced ? false : { opacity: 0, y: 12, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.99 }}
                    transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {sceneIndex === 0 ? (
                      <WordCounterScene
                        typed={wordTyped}
                        reduced={reduced}
                        pressed={pressedAction === "word-field"}
                      />
                    ) : sceneIndex === 1 ? (
                      <JsonFormatterScene
                        typed={jsonTyped}
                        formatted={jsonFormatted}
                        reduced={reduced}
                        pressedFormat={pressedAction === "json-format"}
                      />
                    ) : (
                      <PasswordScene
                        difficulty={difficulty}
                        password={passwordShown}
                        complete={secret.length > 0 && passwordShown.length === secret.length}
                        reduced={reduced}
                        pressedDifficulty={pressedAction === "pw-difficulty"}
                        pressedGenerate={pressedAction === "pw-generate"}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="tp-demo-foot">
                <div className="tp-demo-timeline">
                  <motion.span style={{ scaleX: timelineProgress }} />
                </div>
                <span className="tp-demo-foot-note"><ShieldCheck className="tp-demo-mini-icon" />Runs in your browser</span>
                <span className="tp-demo-foot-count">0{sceneIndex + 1} / 03</span>
              </div>
            </div>
          </div>

          {reduced ? null : (
            <FakeCursor x={cursorX} y={cursorY} scale={cursorScale} ripple={ripple} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
