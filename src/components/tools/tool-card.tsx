import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolIcon } from "@/components/tools/tool-icon";
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

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="tp-card tp-tool-card">
      <span className="tp-tool-top">
        <span className="tp-tool-icon">
          <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
        </span>
        <ArrowUpRight
          className="tp-icon"
          style={{ width: 14, height: 14, color: "var(--accent)", opacity: 0.55 }}
          aria-hidden="true"
        />
      </span>
      <h3 className="tp-tool-title">{tool.title}</h3>
      <p className="tp-tool-desc">{tool.description}</p>
      <span className="tp-tool-cat">{CATEGORY_LABELS[tool.category]}</span>
    </Link>
  );
}
