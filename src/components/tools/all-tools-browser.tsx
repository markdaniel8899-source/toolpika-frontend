"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { cn } from "@/lib/utils";
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

  // 3.4 - grid content swaps instantly on tab change; only the accent
  // indicator moves (handled by the layoutId pill below), no page transition.
  const visible = (() => {
    if (active === "all") return tools;
    if (active === "popular") return tools.slice(0, 8);
    if (active === "new") return tools.slice(-4).reverse();
    return tools.filter((tool) => tool.category === active);
  })();

  const tabs = [{ slug: "all", label: "All tools" }, ...categories];

  /** One tab button with a single shared sliding indicator. */
  const renderTab = (slug: string, label: string, icon?: React.ReactNode) => {
    const isActive = active === slug;
    return (
      <button
        key={slug}
        type="button"
        className={cn("tp-tab", isActive && "is-active")}
        aria-pressed={isActive}
        onClick={() => setActive(slug)}
      >
        {isActive && (
          <motion.span
            layoutId="all-tools-tab-highlight"
            className="tp-tab-highlight"
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        )}
        <span className="tp-tab-label tp-tab-inline">
          {icon}
          {label}
        </span>
      </button>
    );
  };

  return (
    <>
      <div className="tp-tabs" aria-label="Filter tools">
        {tabs.map((tab) => renderTab(tab.slug, tab.label))}
      </div>

      {/* Popular / New live on the next line, in the exact same tab format.
          Clicking them only slides the active background, never navigates. */}
      <div className="tp-tabs tp-tabs-secondary" aria-label="Quick filters">
        {renderTab(
          "popular",
          "Popular",
          <Flame className="tp-icon tp-tab-icon" aria-hidden="true" />,
        )}
        {renderTab(
          "new",
          "New",
          <Sparkles className="tp-icon tp-tab-icon" aria-hidden="true" />,
        )}
      </div>

      <div className="tp-tool-grid">
        {visible.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </>
  );
}
