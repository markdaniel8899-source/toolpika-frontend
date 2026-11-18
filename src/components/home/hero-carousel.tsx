"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reducedMotion || paused || slides.length === 0) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [index, paused, reducedMotion, slides.length]);

  const go = (next: number) => {
    setIndex((next + slides.length) % slides.length);
  };

  if (slides.length === 0) return null;

  return (
    <aside
      className="tp-carousel"
      aria-label="Featured tools"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
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
              <div className="tp-slide-preview" aria-hidden="true">
                {slide.slug === "word-counter" ? (
                  <div className="tp-mini-stats">
                    <div className="tp-mini-stat">
                      <span className="tp-mini-label">Words</span>
                      <span className="tp-mini-value">1,284</span>
                    </div>
                    <div className="tp-mini-stat">
                      <span className="tp-mini-label">Characters</span>
                      <span className="tp-mini-value">7,402</span>
                    </div>
                    <div className="tp-mini-stat">
                      <span className="tp-mini-label">Reading</span>
                      <span className="tp-mini-value">6 min</span>
                    </div>
                  </div>
                ) : slide.slug === "json-formatter" ? (
                  <pre
                    style={{
                      margin: 0,
                      overflow: "hidden",
                      color: "var(--text)",
                      fontFamily: 'ui-monospace, "SFMono-Regular", Consolas, monospace',
                      fontSize: 11.5,
                      lineHeight: 1.75,
                      whiteSpace: "pre",
                    }}
                  >
                    <code>
                      <span style={{ color: "var(--muted-2)" }}>{"{"}</span>
                      {"\n  "}
                      <span style={{ color: "var(--accent)" }}>{'"name"'}</span>
                      : <span>{'"toolpika"'}</span>,{"\n  "}
                      <span style={{ color: "var(--accent)" }}>{'"local"'}</span>
                      : <span style={{ color: "var(--muted)" }}>true</span>
                      ,{"\n  "}
                      <span style={{ color: "var(--accent)" }}>{'"upload"'}</span>
                      : <span style={{ color: "var(--muted)" }}>false</span>
                      {"\n"}
                      <span style={{ color: "var(--muted-2)" }}>{"}"}</span>
                    </code>
                  </pre>
                ) : (
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 9,
                        background: "var(--surface)",
                      }}
                    >
                      <code style={{ fontSize: 13, letterSpacing: "0.02em" }}>vK7!mQ2#rT9@xL4w</code>
                      <ArrowRight className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginTop: 10 }}>
                      {[0, 1, 2, 3].map((bar) => (
                        <span
                          key={bar}
                          style={{ height: 4, borderRadius: 99, background: "var(--accent)", opacity: 0.75 }}
                        />
                      ))}
                    </div>
                    <span style={{ display: "block", marginTop: 8, color: "var(--muted-2)", fontSize: 11.5 }}>
                      Strong, 16 characters
                    </span>
                  </div>
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
        <Link href="/all-tools" className="tp-text-link" style={{ fontSize: 12.5 }}>
          All tools
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
}
