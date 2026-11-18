"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/tools/tool-card";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/tools/registry";

type CategoryTab = { slug: string; label: string };

export function AllToolsBrowser({
  tools,
  categories,
}: {
  tools: Tool[];
  categories: CategoryTab[];
}) {
  const [active, setActive] = useState("all");
  const reduceMotion = useReducedMotion();

  const visible = active === "all" ? tools : tools.filter((tool) => tool.category === active);

  const tabs = [{ slug: "all", label: "All tools" }, ...categories];

  return (
    <>
      <div className="tp-tabs tp-tabs-centered" aria-label="Filter tools">
        {tabs.map((tab) => {
          const isActive = active === tab.slug;
          return (
            <button
              key={tab.slug}
              type="button"
              className={cn("tp-tab", isActive && "is-active")}
              aria-pressed={isActive}
              onClick={() => setActive(tab.slug)}
            >
              {isActive && (
                <motion.span
                  layoutId="all-tools-tab-highlight"
                  className="tp-tab-highlight"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 34 }
                  }
                />
              )}
              <span className="tp-tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="tp-suggestions" aria-label="Suggestions">
        <Link href="/popular" className="tp-suggestion">
          <span className="tp-suggestion-pill">
            <Flame className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
            Popular
          </span>
          <p>Tools people come back to most.</p>
        </Link>
        <Link href="/new" className="tp-suggestion">
          <span className="tp-suggestion-pill">
            <Sparkles className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
            New
          </span>
          <p>The latest additions to the collection.</p>
        </Link>
      </div>

      <div className="tp-tool-grid">
        {visible.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </>
  );
}
