"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { SlidingTabs } from "@/components/tools/sliding-tabs";
import { ToolCard } from "@/components/tools/tool-card";
import type { Tool } from "@/lib/tools/registry";

export type CategoryView = {
  slug: string;
  label: string;
  eyebrow: string;
  description: string;
  empty: string;
  tools: Tool[];
};

export function CategoryBrowser({
  views,
  activeSlug,
}: {
  views: CategoryView[];
  activeSlug: string;
}) {
  const tTools = useTranslations("tools");
  const tNav = useTranslations("nav");
  const [active, setActive] = useState(activeSlug);

  const view = views.find((item) => item.slug === active);
  if (!view) return null;

  const handleChange = (slug: string) => {
    setActive(slug);
    // Swap only the slug in the URL. No route load, no scroll reset — the
    // shared indicator glides and the grid swaps instantly, like All Tools.
    const nextPath = window.location.pathname.replace(
      /\/category\/[^/]+\/?$/,
      `/category/${slug}`
    );
    window.history.replaceState(null, "", nextPath);
  };

  return (
    <>
      <section className="tp-page-hero">
        <div className="tp-page-hero-grid">
          <div className="tp-page-title">
            <p className="tp-eyebrow">{view.eyebrow}</p>
            <h1>{view.label}</h1>
            <p>{view.description}</p>
          </div>
          <span className="tp-page-count">
            {tTools("toolCount", { count: view.tools.length })}
          </span>
        </div>
      </section>

      <SlidingTabs
        items={views.map(({ slug, label }) => ({ slug, label }))}
        active={active}
        onChange={handleChange}
        className="tp-tabs-page"
        ariaLabel={tNav("categoriesNav")}
      />

      {view.tools.length > 0 ? (
        <div key={active} className="tp-tool-grid" data-animate="true">
          {view.tools.map((tool, index) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              style={{ "--tp-card-i": index } as CSSProperties}
            />
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 15 }}>{view.empty}</p>
      )}
    </>
  );
}
