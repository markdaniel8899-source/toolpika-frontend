"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Flame, Sparkles } from "lucide-react";
import { SlidingTabs } from "@/components/tools/sliding-tabs";
import { ToolCard } from "@/components/tools/tool-card";
import type { Tool } from "@/lib/tools/registry";

type CategoryTab = { slug: string; label: string };
type Filter = string;

export function AllToolsBrowser({
  tools,
  categories,
}: {
  tools: Tool[];
  categories: CategoryTab[];
}) {
  const [active, setActive] = useState<Filter>("all");

  // Grid content swaps instantly on tab change; only the shared indicator
  // glides, measured from the active button so it never loops or remounts.
  const visible = (() => {
    if (active === "all") return tools;
    if (active === "popular") return tools.slice(0, 8);
    if (active === "new") return tools.slice(-4).reverse();
    return tools.filter((tool) => tool.category === active);
  })();

  const primaryItems = [{ slug: "all", label: "All tools" }, ...categories];
  const secondaryItems = [
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

  return (
    <>
      <SlidingTabs
        items={primaryItems}
        active={active}
        onChange={setActive}
        ariaLabel="Filter tools"
      />
      <SlidingTabs
        items={secondaryItems}
        active={active}
        onChange={setActive}
        className="tp-tabs-secondary"
        ariaLabel="Quick filters"
      />

      {/* key={active} remounts the grid so the staggered card entrance
          replays on every tab switch instead of cards popping in instantly. */}
      <div key={active} className="tp-tool-grid" data-animate="true">
        {visible.map((tool, index) => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            style={{ "--tp-card-i": index } as CSSProperties}
          />
        ))}
      </div>
    </>
  );
}
