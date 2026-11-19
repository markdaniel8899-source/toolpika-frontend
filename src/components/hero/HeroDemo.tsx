"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
 * A 600×410 "film set" scaled by one transform. Every cursor target is
 * a coordinate on that set, so the choreography stays exact at any
 * viewport width. No video, no canvas — only React and Framer Motion.
 * ------------------------------------------------------------------ */

const CANVAS_W = 600;
const SCENE_MS = 6800;
const TAB_CENTERS = [144, 300, 456] as const;
const TAB_Y = 72;

const WORD_TEXT = "The quiet utility of doing one thing well.";
const JSON_TEXT = '{"name":"Toolpika","status":"live"}';
const PASSWORD = "T00lp!k@_2026#Secure";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_";

const TYPE_START = 860;
const JSON_TYPE_START = 1360;
const TYPE_CHAR_MS = 52;
const COUNT_MS = 1000;

/* Brief targets. The literal sentence has 8 words / 42 characters;
   change these four numbers for true live counts. */
const WORD_TARGETS = { words: 4, characters: 46, sentences: 1, lines: 1 } as const;

/** Spaces move faster, punctuation pauses — a more human typewriter. */
function charDelay(text: string, index: number) {
  const ch = text[index];
  if (ch === " ") return TYPE_CHAR_MS * 0.55;
  if ('.!?,:;{}[]"'.includes(ch)) return TYPE_CHAR_MS * 1.5;
  return TYPE_CHAR_MS * (0.9 + ((index * 37) % 5) * 0.06);
}

type CursorStop = { at: number; x: number; y: number; click?: boolean };

/** Cursor choreography per tool. Stops marked `click` fire the ripple. */
const CURSOR_STOPS: CursorStop[][] = [
  [
    { at: 80, x: TAB_CENTERS[0], y: TAB_Y },
    { at: 560, x: TAB_CENTERS[0], y: TAB_Y, click: true },
    { at: 760, x: 180, y: 200 },
    { at: 830, x: 180, y: 200, click: true },
    { at: 3780, x: 98, y: 320 },
  ],
  [
    { at: 80, x: TAB_CENTERS[1], y: TAB_Y },
    { at: 560, x: TAB_CENTERS[1], y: TAB_Y, click: true },
    { at: 1240, x: 170, y: 190 },
    { at: 1360, x: 170, y: 190, click: true },
    { at: 3560, x: 440, y: 200 },
  ],
  [
    { at: 80, x: TAB_CENTERS[2], y: TAB_Y },
    { at: 560, x: TAB_CENTERS[2], y: TAB_Y, click: true },
    { at: 960, x: 520, y: 242 },
    { at: 1160, x: 520, y: 242, click: true },
    { at: 2560, x: 250, y: 180 },
  ],
];

/* ---------------------------- hooks -------------------------------- */

/** Reveal text one character at a time, leaving a blinking caret behind. */
function useTypewriter(text: string, startAt: number, reduced: boolean) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (reduced) return;
    let index = 0;
    let timer = 0;
    const step = () => {
      index += 1;
      setTyped(text.slice(0, index));
      if (index < text.length) timer = window.setTimeout(step, charDelay(text, index - 1));
    };
    timer = window.setTimeout(step, startAt);
    return () => window.clearTimeout(timer);
  }, [text, startAt, reduced]);

  return reduced ? text : typed;
}

/** Ease a number from 0 to its target once typing has settled. */
function useCountUp(target: number, start: boolean, reduced: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced || !start) return;
    let frame = 0;
    const beganAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - beganAt) / COUNT_MS);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, start, reduced]);

  return reduced ? target : value;
}

/* -------------------------- fake cursor ---------------------------- */

function FakeCursor({ x, y, press, pressed }: { x: number; y: number; press: number; pressed: boolean }) {
  return (
    <>
      <motion.div
        className="tp-demo-cursor"
        initial={false}
        animate={{ x, y, scale: pressed ? 0.84 : 1 }}
        transition={{
          x: { type: "spring", stiffness: 240, damping: 26, mass: 0.7 },
          y: { type: "spring", stiffness: 240, damping: 26, mass: 0.7 },
          scale: { duration: 0.16, ease: "easeOut" },
        }}
      >
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 2.5 4 19l4.6-4.5 3 6.6 2.6-1.2-3-6.5H18z"
            fill="var(--surface)"
            stroke="var(--text)"
            strokeWidth="1.35"
            strokeLinejoin="round"
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
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (typed.length !== WORD_TEXT.length) return;
    const timer = window.setTimeout(() => setCounting(true), reduced ? 0 : 480);
    return () => window.clearTimeout(timer);
  }, [typed, reduced]);

  const values = [
    useCountUp(WORD_TARGETS.words, counting, reduced),
    useCountUp(WORD_TARGETS.characters, counting, reduced),
    useCountUp(WORD_TARGETS.sentences, counting, reduced),
    useCountUp(WORD_TARGETS.lines, counting, reduced),
  ];

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-docbar">
        <span className="tp-demo-docbar-title"><FileText className="tp-demo-mini-icon" />Untitled note</span>
        <span className="tp-demo-docbar-meta"><CircleCheck className="tp-demo-mini-icon" />Saved locally</span>
      </div>

      <div className="tp-demo-editor">
        <span>{typed}</span>
        <Caret />
        <span className="tp-demo-editor-pulse" />
      </div>

      <div className="tp-demo-stats">
        {STAT_META.map(({ Icon, label }, index) => (
          <div key={label} className={`tp-demo-stat${index === 0 ? " is-primary" : ""}`}>
            <b>{values[index]}</b>
            <span><Icon className="tp-demo-mini-icon" />{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonFormatterScene({ reduced }: { reduced: boolean }) {
  const typed = useTypewriter(JSON_TEXT, JSON_TYPE_START, reduced);
  const [formatted, setFormatted] = useState(false);

  useEffect(() => {
    if (typed.length !== JSON_TEXT.length) return;
    const timer = window.setTimeout(() => setFormatted(true), reduced ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [typed, reduced]);

  const output: ReactNode[] = [
    <span key="l1"><span className="tp-demo-line-no">1</span><span className="tp-demo-punc">{"{"}</span></span>,
    <span key="l2">
      <span className="tp-demo-line-no">2</span>
      {"  "}<span className="tp-demo-key">{'"name"'}</span>
      <span className="tp-demo-punc">: </span>
      <span className="tp-demo-str">{'"Toolpika"'}</span>
      <span className="tp-demo-punc">,</span>
    </span>,
    <span key="l3">
      <span className="tp-demo-line-no">3</span>
      {"  "}<span className="tp-demo-key">{'"status"'}</span>
      <span className="tp-demo-punc">: </span>
      <span className="tp-demo-str">{'"live"'}</span>
    </span>,
    <span key="l4"><span className="tp-demo-line-no">4</span><span className="tp-demo-punc">{"}"}</span></span>,
  ];

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-panels">
        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head">
            <span><Braces className="tp-demo-mini-icon" />Input</span>
            <span className="tp-demo-panel-tag">RAW</span>
          </div>
          <div className="tp-demo-panel-body">
            <pre className="tp-demo-code"><span>{typed}</span><Caret /></pre>
          </div>
        </div>

        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head">
            <span><CircleCheck className="tp-demo-mini-icon" />Output</span>
            <span className={formatted ? "tp-demo-panel-tag is-valid" : "tp-demo-panel-tag"}>
              {formatted ? "VALID" : "WAITING"}
            </span>
          </div>
          <div className="tp-demo-panel-body">
            <AnimatePresence mode="wait">
              {formatted ? (
                <motion.pre
                  key="pretty"
                  className="tp-demo-code"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduced ? 0 : 0.2 }}
                >
                  {output.map((line, index) => (
                    <motion.span
                      className="tp-demo-code-line"
                      key={index}
                      initial={reduced ? false : { opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reduced ? 0 : 0.28, delay: reduced ? 0 : index * 0.09 }}
                    >
                      {line}
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

function PasswordScene({ reduced }: { reduced: boolean }) {
  const [value, setValue] = useState(reduced ? PASSWORD : "");
  const [strength, setStrength] = useState(reduced ? 100 : 0);

  useEffect(() => {
    if (reduced) return;
    let scrambleTimer = 0;
    const start = window.setTimeout(() => {
      let ticks = 0;
      scrambleTimer = window.setInterval(() => {
        ticks += 1;
        let next = "";
        for (let i = 0; i < PASSWORD.length; i += 1) {
          next += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        setValue(next);
        if (ticks >= 15) {
          window.clearInterval(scrambleTimer);
          setValue(PASSWORD);
          setStrength(100);
        }
      }, 48);
    }, 1160);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(scrambleTimer);
    };
  }, [reduced]);

  const settled = value === PASSWORD;

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-pw-wrap">
        <div className="tp-demo-pw-box">
          <span className="tp-demo-pw-value">{value}</span>
          <span className="tp-demo-copy" aria-hidden="true"><Copy className="tp-demo-mini-icon" /></span>
        </div>

        <div className="tp-demo-pw-actions">
          <span className="tp-demo-pw-note"><ShieldCheck className="tp-demo-mini-icon" />Generated on your device</span>
          <span className="tp-demo-generate"><KeyRound className="tp-demo-mini-icon" />Generate</span>
        </div>

        <div className="tp-demo-strength">
          <div className="tp-demo-strength-head">
            <span>Strength</span>
            <span className="tp-demo-strength-label">{settled ? "Very strong" : "Checking…"}</span>
          </div>
          <div className="tp-demo-strength-bars">
            {[0, 1, 2, 3].map((index) => (
              <motion.span
                key={index}
                className="tp-demo-strength-bar"
                initial={false}
                animate={{ opacity: strength > index * 25 ? 1 : 0.2 }}
                transition={{ duration: reduced ? 0 : 0.32, delay: reduced ? 0 : index * 0.08 }}
              />
            ))}
          </div>
          <div className="tp-demo-strength-foot">
            <span>{PASSWORD.length} characters</span>
            <span className="tp-demo-pw-badge">{settled ? "STRONG" : "…"}</span>
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
  const [cursor, setCursor] = useState({ x: 540, y: 360, press: 0, pressed: false });
  const [scale, setScale] = useState(0.88);
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
    const timers: number[] = [];
    CURSOR_STOPS[toolIndex].forEach((stop) => {
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
                <span className="tp-demo-live"><span className="tp-demo-live-dot" />Live demo</span>
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

          {reduced ? null : (
            <FakeCursor x={cursor.x} y={cursor.y} press={cursor.press} pressed={cursor.pressed} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
