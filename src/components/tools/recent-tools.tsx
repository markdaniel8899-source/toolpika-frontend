"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getLiveTools } from "@/lib/tools/registry";

const RECENT_KEY = "tp-recent-tools";

export function RecentTools() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
        setSlugs(Array.isArray(parsed) ? parsed.slice(0, 4) : []);
      } catch {
        setSlugs([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (slugs.length === 0) return null;

  const tools = getLiveTools();
  const recent = slugs
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));

  if (recent.length === 0) return null;

  return (
    <section className="tp-container" style={{ paddingBottom: 8 }}>
      <div className="tp-recent">
        <span className="tp-micro">
          <Clock3 className="tp-icon" style={{ width: 14, height: 14, color: "var(--accent)" }} aria-hidden="true" />
          Recently used
        </span>
        <div className="tp-recent-links">
          {recent.map((tool) => (
            <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tp-tab">
              {tool.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
