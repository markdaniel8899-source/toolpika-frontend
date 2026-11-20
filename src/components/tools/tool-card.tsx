"use client";

import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolIcon } from "@/components/tools/tool-icon";
import { WishlistButton } from "@/components/tools/wishlist-button";
import type { Tool, ToolCategory } from "@/lib/tools/registry";

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  text: "Text",
  image: "Images",
  file: "Files",
  code: "Code",
  converter: "Converters",
  security: "Security",
  calculator: "Calculators",
};

export function ToolCard({
  tool,
  style,
}: {
  tool: Tool;
  style?: CSSProperties;
}) {
  return (
    <div className="tp-tool-card-wrap" style={style}>
      <Link href={`/tools/${tool.slug}`} className="tp-card tp-tool-card tp-tool-card-link">
        <span className="tp-tool-top">
          <span className="tp-tool-icon">
            <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
          </span>
          <span className="tp-tool-arrow" aria-hidden="true">
            <ArrowUpRight className="tp-icon" />
          </span>
        </span>
        <h3 className="tp-tool-title">{tool.title}</h3>
        <p className="tp-tool-desc">{tool.description}</p>
        <span className="tp-tool-cat">{CATEGORY_LABELS[tool.category]}</span>
      </Link>
      <WishlistButton slug={tool.slug} title={tool.title} />
    </div>
  );
}
