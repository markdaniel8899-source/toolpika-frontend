"use client";

import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolIcon } from "@/components/tools/tool-icon";
import { WishlistButton } from "@/components/tools/wishlist-button";
import {
  categoryKey,
  toolDescriptionKey,
  toolTitleKey,
  type Tool,
} from "@/lib/tools/registry";

export function ToolCard({
  tool,
  style,
}: {
  tool: Tool;
  style?: CSSProperties;
}) {
  const t = useTranslations("tools");
  const title = t(toolTitleKey(tool));

  return (
    <div className="tp-tool-card-wrap" style={style}>
      <Link href={`/tools/${tool.slug}`} className="tp-card tp-tool-card tp-tool-card-link">
        <span className="tp-tool-top">
          <span className="tp-tool-icon">
            <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
          </span>
          <span className="tp-tool-arrow" aria-hidden="true">
            <ArrowRight className="tp-icon" />
          </span>
        </span>
        <h3 className="tp-tool-title">{title}</h3>
        <p className="tp-tool-desc">{t(toolDescriptionKey(tool))}</p>
        <span className="tp-tool-cat">{t(categoryKey(tool.category))}</span>
      </Link>
      <WishlistButton slug={tool.slug} title={title} />
    </div>
  );
}
