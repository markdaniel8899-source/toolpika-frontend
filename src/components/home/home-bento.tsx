"use client";

import { useState } from "react";
import { ArrowUpRight, Braces } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolIcon } from "@/components/tools/tool-icon";
import { categories, getLiveTools } from "@/lib/tools/registry";

export function HomeBento() {
  const [text, setText] = useState("Small tools, one job each, and nothing to learn.");
  const tools = getLiveTools();
  const featuredSlugs = ["word-counter", "json-formatter", "case-converter", "image-compressor", "unit-converter", "password-generator"];
  const featured = featuredSlugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  return (
    <section className="tp-container tp-section">
      <div className="tp-section-head">
        <div>
          <p className="tp-eyebrow">The collection</p>
          <h2 className="tp-section-title">Popular tools</h2>
        </div>
        <Link href="/all-tools" className="tp-text-link">
          View all tools
          <ArrowUpRight className="tp-icon tp-card-arrow" aria-hidden="true" />
        </Link>
      </div>

      <div className="tp-bento">
        <Link href="/tools/word-counter" className="tp-card tp-bento-large">
          <span className="tp-tool-top">
            <span className="tp-tool-icon">
              <ToolIcon name="FileText" className="tp-icon" aria-hidden="true" />
            </span>
            <ArrowUpRight className="tp-icon tp-card-arrow" aria-hidden="true" />
          </span>
          <h3 className="tp-tool-title">Word Counter</h3>
          <p className="tp-tool-desc">Count words and characters as you type.</p>
          <div className="tp-bento-demo" onClick={(event) => event.preventDefault()}>
            <textarea
              aria-label="Try the word counter"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={3}
            />
            <div className="tp-bento-numbers">
              <span><strong>{words}</strong> words</span>
              <span><strong>{chars}</strong> chars</span>
            </div>
          </div>
        </Link>

        <Link href="/tools/json-formatter" className="tp-card tp-bento-wide">
          <span className="tp-tool-top">
            <span className="tp-tool-icon"><Braces className="tp-icon" aria-hidden="true" /></span>
            <ArrowUpRight className="tp-icon tp-card-arrow" aria-hidden="true" />
          </span>
          <h3 className="tp-tool-title">JSON Formatter</h3>
          <p className="tp-tool-desc">Format, validate and minify JSON in your browser.</p>
        </Link>

        {featured.slice(2).map((tool) => (
          <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tp-card tp-bento-small">
            <span className="tp-tool-top">
              <span className="tp-tool-icon">
                <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
              </span>
              <ArrowUpRight className="tp-icon tp-card-arrow" aria-hidden="true" />
            </span>
            <h3 className="tp-tool-title">{tool.title}</h3>
            <p className="tp-tool-desc">{tool.description}</p>
          </Link>
        ))}
      </div>

      <div className="tp-bento-categories">
        {categories.map((category) => (
          <Link key={category.slug} href={`/category/${category.slug}`} className="tp-tab">
            {category.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
