"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const INITIAL_TEXT =
  "The quiet utility of doing one thing well. Every character counted, every second saved — entirely on your device.";
const PASSWORD_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*";

/** A live, interactive product screen for the hero — no fake preview. */
export function HeroWorkbench() {
  const [tab, setTab] = useState<"counter" | "password">("counter");
  const [text, setText] = useState(INITIAL_TEXT);
  const [length, setLength] = useState(16);
  const [password, setPassword] = useState("xK9#mQ2!vL7@pR4z");
  const bezelRef = useRef<HTMLDivElement>(null);

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const sentences = (text.match(/[.!?]+(?:\s|$)/g) ?? []).length;
  const lines = text.split("\n").filter((line) => line.trim()).length;

  const generate = () => {
    const values = new Uint32Array(length);
    if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(values);
    } else {
      for (let i = 0; i < length; i += 1) values[i] = Math.floor(Math.random() * PASSWORD_CHARS.length);
    }
    setPassword(Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join(""));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const el = bezelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--wb-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--wb-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  return (
    <div className="tp-wb-bezel" ref={bezelRef} onPointerMove={onPointerMove}>
      <div className="tp-wb-core">
        <div className="tp-wb-bar">
          <span className="tp-wb-url">toolpika.site</span>
        </div>

        <div className="tp-wb-tabs" role="tablist" aria-label="Try a live tool">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "counter"}
            className={cn("tp-wb-tab", tab === "counter" && "is-active")}
            onClick={() => setTab("counter")}
          >
            Word Counter
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "password"}
            className={cn("tp-wb-tab", tab === "password" && "is-active")}
            onClick={() => setTab("password")}
          >
            Password Generator
          </button>
        </div>

        {tab === "counter" ? (
          <div className="tp-wb-body" role="tabpanel">
            <textarea
              className="tp-wb-editor"
              value={text}
              onChange={(event) => setText(event.target.value)}
              aria-label="Type to test the word counter"
              spellCheck={false}
            />
            <div className="tp-wb-stats">
              <div className="tp-wb-stat is-primary"><b>{words}</b><span>Words</span></div>
              <div className="tp-wb-stat"><b>{characters}</b><span>Characters</span></div>
              <div className="tp-wb-stat"><b>{sentences}</b><span>Sentences</span></div>
              <div className="tp-wb-stat"><b>{lines}</b><span>Lines</span></div>
            </div>
          </div>
        ) : (
          <div className="tp-wb-body tp-wb-body--password" role="tabpanel">
            <div className="tp-wb-password">
              <code>{password}</code>
              <button type="button" className="tp-wb-generate" onClick={generate}>Generate</button>
            </div>
            <label className="tp-wb-length">
              <span>Length <b>{length}</b></span>
              <input
                type="range"
                min={8}
                max={32}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                aria-label="Password length"
              />
            </label>
            <div className="tp-wb-strength" aria-hidden="true">
              <span style={{ width: `${Math.min(100, 35 + length * 2)}%` }} />
            </div>
          </div>
        )}

        <div className="tp-wb-foot">
          <span>Runs right here in your browser</span>
          <Link href={tab === "counter" ? "/tools/word-counter" : "/tools/password-generator"} className="tp-text-link">
            Open tool
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
