"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
} from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
};

const SAMPLE_TEXT =
  "A quiet interface leaves room for the work itself, and a good tool gets out of the way once it has done its job.";

function createPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

function convertCase(text: string, mode: string) {
  if (!text.trim()) return "";
  const words = text.trim().split(/\s+/);
  if (mode === "upper") return text.toUpperCase();
  if (mode === "lower") return text.toLowerCase();
  if (mode === "title")
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  if (mode === "camel")
    return words
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      )
      .join("");
  return text;
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const [sample, setSample] = useState(SAMPLE_TEXT);
  const [caseText, setCaseText] = useState("Make this text useful");
  const [caseMode, setCaseMode] = useState("title");
  const [password, setPassword] = useState("vK7!mQ2#rT9@xL4w");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reducedMotion || paused || slides.length === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [index, paused, reducedMotion, slides.length]);

  const go = (next: number) => setIndex((next + slides.length) % slides.length);
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);

  const words = sample.trim() ? sample.trim().split(/\s+/).length : 0;
  const reading = Math.max(1, Math.ceil(words / 200));

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the text stays selectable.
    }
  };

  if (slides.length === 0) return null;

  return (
    <aside
      className="tp-carousel"
      aria-label="Featured tools"
      onFocusCapture={pause}
      onPointerDownCapture={pause}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          resume();
        }
      }}
      onPointerLeave={resume}
    >
      <div className="tp-carousel-head">
        <span className="tp-micro">Tool spotlight</span>
        <div className="tp-carousel-controls">
          <button
            type="button"
            className="tp-carousel-btn"
            onClick={() => go(index - 1)}
            aria-label="Previous featured tool"
          >
            <ChevronLeft className="tp-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tp-carousel-btn"
            onClick={() => go(index + 1)}
            aria-label="Next featured tool"
          >
            <ChevronRight className="tp-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="tp-carousel-track">
        {slides.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <article
              key={slide.slug}
              className={cn("tp-carousel-slide", active && "is-active")}
              aria-hidden={!active}
              inert={!active}
            >
              <div className="tp-slide-meta">
                <span className="tp-slide-icon">
                  <ToolIcon name={slide.icon} className="tp-icon" aria-hidden="true" />
                </span>
                <span className="tp-slide-cat">{slide.category}</span>
              </div>
              <p className="tp-slide-title">{slide.title}</p>
              <p className="tp-slide-copy">{slide.description}</p>

              <div className="tp-slide-preview">
                {slide.slug === "word-counter" ? (
                  <>
                    <textarea
                      aria-label="Sample text"
                      value={sample}
                      onChange={(event) => setSample(event.target.value)}
                      className="tp-mini-input"
                      rows={2}
                    />
                    <div className="tp-mini-stats" style={{ marginTop: 10 }}>
                      <div className="tp-mini-stat">
                        <span className="tp-mini-label">Words</span>
                        <span className="tp-mini-value">{words}</span>
                      </div>
                      <div className="tp-mini-stat">
                        <span className="tp-mini-label">Characters</span>
                        <span className="tp-mini-value">{sample.length}</span>
                      </div>
                      <div className="tp-mini-stat">
                        <span className="tp-mini-label">Reading</span>
                        <span className="tp-mini-value">{reading} min</span>
                      </div>
                    </div>
                  </>
                ) : slide.slug === "case-converter" ? (
                  <>
                    <input
                      aria-label="Text to convert"
                      value={caseText}
                      onChange={(event) => setCaseText(event.target.value)}
                      className="tp-mini-input"
                    />
                    <div className="tp-mini-row">
                      <select
                        aria-label="Case mode"
                        value={caseMode}
                        onChange={(event) => setCaseMode(event.target.value)}
                        className="tp-mini-select"
                      >
                        <option value="title">Title Case</option>
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                        <option value="camel">camelCase</option>
                      </select>
                      <span className="tp-mini-output">{convertCase(caseText, caseMode)}</span>
                    </div>
                  </>
                ) : slide.slug === "password-generator" ? (
                  <>
                    <div className="tp-mini-row">
                      <code className="tp-mini-password">{password}</code>
                      <button
                        type="button"
                        className="tp-mini-action"
                        onClick={() => setPassword(createPassword())}
                        aria-label="Generate a new password"
                      >
                        <RefreshCw className="tp-icon" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="tp-mini-action"
                        onClick={copyPassword}
                        aria-label="Copy password"
                      >
                        {copied ? (
                          <Check className="tp-icon" aria-hidden="true" />
                        ) : (
                          <Copy className="tp-icon" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, flex: 1 }}>
                        {[0, 1, 2, 3].map((bar) => (
                          <span
                            key={bar}
                            style={{ height: 4, borderRadius: 99, background: "var(--accent)", opacity: 0.75 }}
                          />
                        ))}
                      </div>
                      <span style={{ color: "var(--muted)", fontSize: 13 }}>
                        {copied ? "Copied" : "Strong, 16 characters"}
                      </span>
                    </div>
                  </>
                ) : (
                  <pre className="tp-mini-code">
                    <code>
                      <span style={{ color: "var(--accent)" }}>{'"local"'}</span>: true
                      {"\n"}
                      <span style={{ color: "var(--accent)" }}>{'"upload"'}</span>: false
                    </code>
                  </pre>
                )}
              </div>

              <Link href={`/tools/${slide.slug}`} className="tp-text-link" style={{ marginTop: 16 }}>
                Open {slide.title}
                <ArrowRight className="tp-icon" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </div>

      <div className="tp-carousel-foot">
        <div className="tp-carousel-dots" aria-label="Choose a featured tool">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.slug}
              type="button"
              className="tp-carousel-dot"
              aria-label={`Show ${slide.title}`}
              aria-pressed={dotIndex === index}
              onClick={() => go(dotIndex)}
            />
          ))}
        </div>
        <Link href="/all-tools" className="tp-text-link" style={{ fontSize: 13 }}>
          All tools
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
