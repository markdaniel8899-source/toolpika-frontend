"use client";

import { useState } from "react";
import { Flame, Sparkles } from "lucide-react";
import { SlidingTabs } from "@/components/tools/sliding-tabs";

const PRIMARY_ITEMS = [
  { slug: "all", label: "All tools" },
  { slug: "text", label: "Text" },
  { slug: "image", label: "Images" },
  { slug: "code", label: "Code" },
];

const QUICK_ITEMS = [
  {
    slug: "popular",
    label: "Popular",
    icon: <Flame className="tp-icon tp-tab-icon" aria-hidden="true" />,
  },
  {
    slug: "new",
    label: "New",
    icon: <Sparkles className="tp-icon tp-tab-icon" aria-hidden="true" />,
  },
];

const SPEEDS = [
  { label: "Slow", value: 700 },
  { label: "Normal", value: 420 },
  { label: "Fast", value: 220 },
];

export default function TabStyleDemoPage() {
  const [active, setActive] = useState("all");
  const [duration, setDuration] = useState(420);

  return (
    <main className="tp-container tp-section">
      <p className="tp-eyebrow">Live mockup</p>
      <h1 className="tp-section-title tp-section-title-lg">Filter tab styles</h1>
      <p style={{ maxWidth: 520, marginTop: 12, color: "var(--muted)", fontSize: 15 }}>
        Click any tab to test the glide. The indicator is one measured element per
        row, so the background cannot repeat or remount.
      </p>

      <div className="tp-tab-demo-controls">
        <span>Glide speed</span>
        <div className="tp-tab-demo-speed">
          {SPEEDS.map((speed) => (
            <button
              key={speed.value}
              type="button"
              aria-pressed={duration === speed.value}
              onClick={() => setDuration(speed.value)}
            >
              {speed.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tp-tab-demo-grid">
        <section className="tp-tab-demo-card">
          <h2>Classic white</h2>
          <p>Original look — white pills, thin border, small lift on hover.</p>
          <SlidingTabs
            items={PRIMARY_ITEMS}
            active={active}
            onChange={setActive}
            variant="classic"
            duration={duration}
            ariaLabel="Classic white tabs"
          />
          <SlidingTabs
            items={QUICK_ITEMS}
            active={active}
            onChange={setActive}
            variant="classic"
            duration={duration}
            className="tp-tabs-secondary"
            ariaLabel="Classic white quick filters"
          />
        </section>

        <section className="tp-tab-demo-card">
          <h2>Soft surface</h2>
          <p>Borderless neutral pills with a deeper moving accent fill.</p>
          <SlidingTabs
            items={PRIMARY_ITEMS}
            active={active}
            onChange={setActive}
            variant="soft"
            duration={duration}
            ariaLabel="Soft surface tabs"
          />
          <SlidingTabs
            items={QUICK_ITEMS}
            active={active}
            onChange={setActive}
            variant="soft"
            duration={duration}
            className="tp-tabs-secondary"
            ariaLabel="Soft surface quick filters"
          />
        </section>

        <section className="tp-tab-demo-card">
          <h2>Outline tint</h2>
          <p>Transparent resting pills, soft accent fill on the active one.</p>
          <SlidingTabs
            items={PRIMARY_ITEMS}
            active={active}
            onChange={setActive}
            variant="outline"
            duration={duration}
            ariaLabel="Outline tint tabs"
          />
          <SlidingTabs
            items={QUICK_ITEMS}
            active={active}
            onChange={setActive}
            variant="outline"
            duration={duration}
            className="tp-tabs-secondary"
            ariaLabel="Outline tint quick filters"
          />
        </section>
      </div>
    </main>
  );
}
