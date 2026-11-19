"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ *
 * The demo is authored on a fixed 560×384 "film set". Every target the
 * fake cursor visits is a pixel coordinate on that set, and the entire
 * set is scaled with one CSS transform so it behaves like a video that
 * shrinks to fit its container. No video file, no canvas — just React.
 * ------------------------------------------------------------------ */

const CANVAS_W = 560;
const SCENE_MS = 6400; // one full loop step; the controller interval
const TAB_CENTERS = [126, 280, 434] as const;
const TAB_Y = 69;

const WORD_TEXT = "The quiet utility of doing one thing well.";
const JSON_TEXT = '{"name":"Toolpika","status":"live"}';
const PASSWORD = "T00lp!k@_2026#Secure";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_";

const TYPE_START = 820;
const JSON_TYPE_START = 1300;
const TYPE_CHAR_MS = 52;
const COUNT_MS = 900;

/* Targets from the brief. The sample sentence actually contains 8 words
   and 42 characters — change these four numbers for true live counts. */
const WORD_TARGETS = { words: 4, characters: 46, sentences: 1, lines: 1 } as const;

type CursorStop = { at: number; x: number; y: number; click?: boolean };

/** Cursor choreography per tool. Stops with `click` fire the ripple. */
const CURSOR_STOPS: CursorStop[][] = [
  [
    { at: 70, x: TAB_CENTERS[0], y: TAB_Y },
    { at: 520, x: TAB_CENTERS[0], y: TAB_Y, click: true },
    { at: 700, x: 150, y: 150 },
    { at: 760, x: 150, y: 150, click: true },
    { at: 3550, x: 92, y: 285 },
  ],
  [
    { at: 70, x: TAB_CENTERS[1], y: TAB_Y },
    { at: 520, x: TAB_CENTERS[1], y: TAB_Y, click: true },
    { at: 1180, x: 150, y: 170 },
    { at: 1300, x: 150, y: 170, click: true },
    { at: 3380, x: 400, y: 200 },
  ],
  [
    { at: 70, x: TAB_CENTERS[2], y: TAB_Y },
    { at: 520, x: TAB_CENTERS[2], y: TAB_Y, click: true },
    { at: 900, x: 488, y: 231 },
    { at: 1100, x: 488, y: 231, click: true },
    { at: 2400, x: 240, y: 170 },
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
      if (index < text.length) timer = window.setTimeout(step, TYPE_CHAR_MS);
    };
    timer = window.setTimeout(step, startAt);
    return () => window.clearTimeout(timer);
  }, [text, startAt, reduced]);

  return reduced ? text : typed;
}

/** Word Counter: ease a number from 0 to its target once typing settles. */
function useCountUp(target: number, start: boolean, reduced: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced || !start) return;
    let frame = 0;
    const beganAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - beganAt) / COUNT_MS);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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
        animate={{ x, y, scale: pressed ? 0.86 : 1 }}
        transition={{
          x: { type: "spring", stiffness: 380, damping: 30, mass: 0.55 },
          y: { type: "spring", stiffness: 380, damping: 30, mass: 0.55 },
          scale: { duration: 0.12 },
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 2.5 4 19l4.6-4.5 3 6.6 2.6-1.2-3-6.5H18z"
            fill="var(--surface)"
            stroke="var(--text)"
            strokeWidth="1.4"
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
            initial={{ opacity: 0.9, scale: 0.3 }}
            animate={{ opacity: 0, scale: 1.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
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

function WordCounterScene({ reduced }: { reduced: boolean }) {
  const typed = useTypewriter(WORD_TEXT, TYPE_START, reduced);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (typed.length !== WORD_TEXT.length) return;
    const timer = window.setTimeout(() => setCounting(true), reduced ? 0 : 420);
    return () => window.clearTimeout(timer);
  }, [typed, reduced]);

  const words = useCountUp(WORD_TARGETS.words, counting, reduced);
  const characters = useCountUp(WORD_TARGETS.characters, counting, reduced);
  const sentences = useCountUp(WORD_TARGETS.sentences, counting, reduced);
  const lines = useCountUp(WORD_TARGETS.lines, counting, reduced);

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-editor">
        <span>{typed}</span>
        <Caret />
      </div>
      <div className="tp-demo-stats">
        <div className="tp-demo-stat is-primary"><b>{words}</b><span>Words</span></div>
        <div className="tp-demo-stat"><b>{characters}</b><span>Characters</span></div>
        <div className="tp-demo-stat"><b>{sentences}</b><span>Sentences</span></div>
        <div className="tp-demo-stat"><b>{lines}</b><span>Lines</span></div>
      </div>
    </div>
  );
}

function JsonFormatterScene({ reduced }: { reduced: boolean }) {
  const typed = useTypewriter(JSON_TEXT, JSON_TYPE_START, reduced);
  const [formatted, setFormatted] = useState(false);

  useEffect(() => {
    if (typed.length !== JSON_TEXT.length) return;
    const timer = window.setTimeout(() => setFormatted(true), reduced ? 0 : 160);
    return () => window.clearTimeout(timer);
  }, [typed, reduced]);

  const output = [
    <span key="open" className="tp-demo-punc">{"{"}</span>,
    <span key="name">
      {"  "}<span className="tp-demo-key">{'"name"'}</span>
      <span className="tp-demo-punc">: </span>
      <span className="tp-demo-str">{'"Toolpika"'}</span>
      <span className="tp-demo-punc">,</span>
    </span>,
    <span key="status">
      {"  "}<span className="tp-demo-key">{'"status"'}</span>
      <span className="tp-demo-punc">: </span>
      <span className="tp-demo-str">{'"live"'}</span>
    </span>,
    <span key="close" className="tp-demo-punc">{"}"}</span>,
  ];

  return (
    <div className="tp-demo-scene">
      <div className="tp-demo-panels">
        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head"><span>Input</span><span>JSON</span></div>
          <div className="tp-demo-panel-body">
            <pre className="tp-demo-code"><span>{typed}</span><Caret /></pre>
          </div>
        </div>
        <div className="tp-demo-panel">
          <div className="tp-demo-panel-head"><span>Output</span><span className="tp-demo-ok">Ready</span></div>
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
                      initial={reduced ? false : { opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: reduced ? 0 : 0.22, delay: reduced ? 0 : index * 0.08 }}
                    >
                      {line}
                    </motion.span>
                  ))}
                </motion.pre>
              ) : (
                <motion.span
                  key="empty"
                  className="tp-demo-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Formatted output appears here…
                </motion.span>
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
        if (ticks >= 12) {
          window.clearInterval(scrambleTimer);
          setValue(PASSWORD);
          setStrength(100);
        }
      }, 55);
    }, 1100);
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
          <span className="tp-demo-pw-badge">{settled ? "STRONG" : "…"}</span>
        </div>
        <button type="button" className="tp-demo-generate" tabIndex={-1}>Generate</button>
        <div className="tp-demo-strength">
          <div className="tp-demo-strength-head"><span>Strength</span><span>{settled ? "Very strong" : "Checking…"}</span></div>
          <div className="tp-demo-strength-track">
            <motion.span
              className="tp-demo-strength-fill"
              initial={false}
              animate={{ width: `${strength}%` }}
              transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- shell ------------------------------- */

export function HeroDemo() {
  const reduced = useReducedMotion() ?? false;
  const [toolIndex, setToolIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cursor, setCursor] = useState({ x: 500, y: 330, press: 0, pressed: false });
  const [scale, setScale] = useState(0.7);
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

  /* Tab lights up on the click, not on the cut. */
  useEffect(() => {
    if (reduced) return;
    const timer = window.setTimeout(() => setActiveTab(toolIndex), 520);
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
            140,
          ));
        }
      }, stop.at));
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toolIndex, reduced]);

  return (
    <motion.div
      className="tp-demo-float"
      animate={reduced ? undefined : { y: [0, -6, 0] }}
      transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
              </div>

              <div className="tp-demo-tabs">
                {["Word Counter", "JSON Formatter", "Password Generator"].map((label, index) => (
                  <span
                    key={label}
                    className={`tp-demo-tab${shownTab === index ? " is-active" : ""}`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="tp-demo-stage">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={toolIndex}
                    className="tp-demo-scene-wrap"
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: reduced ? 0 : 0.32, ease: [0.23, 1, 0.32, 1] }}
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
                <div className="tp-demo-progress">
                  {[0, 1, 2].map((index) => (
                    <motion.span
                      key={index}
                      className="tp-demo-progress-dot"
                      initial={false}
                      animate={{
                        width: shownTab === index ? 18 : 6,
                        opacity: shownTab === index ? 1 : 0.4,
                      }}
                      transition={{ duration: reduced ? 0 : 0.3 }}
                    />
                  ))}
                </div>
                <span className="tp-demo-foot-label">Runs in your browser</span>
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
