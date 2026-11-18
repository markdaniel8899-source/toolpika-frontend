"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { getLiveTools } from "@/lib/tools/registry";
import { ToolIcon } from "@/components/tools/tool-icon";

const RECENT_KEY = "tp-recent-tools";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const tools = useMemo(() => getLiveTools(), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setQuery("");
      setActive(0);
      try {
        setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]);
      } catch {
        setRecent([]);
      }
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools.slice(0, 6);
    return tools
      .filter(
        (tool) =>
          tool.title.toLowerCase().includes(q) ||
          tool.slug.includes(q) ||
          tool.description.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, tools]);

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/tools/${slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) =>
        index <= 0 ? Math.max(results.length - 1, 0) : index - 1,
      );
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].slug);
    }
  };

  if (!open) return null;

  return (
    <div
      className="tp-command-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="tp-command" role="dialog" aria-modal="true" aria-label="Search tools">
        <div className="tp-command-head">
          <Search className="tp-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search tools..."
            aria-label="Search tools"
          />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close">
            <X className="tp-icon" aria-hidden="true" />
          </button>
        </div>

        <div className="tp-command-body">
          {!query && recent.length > 0 ? (
            <>
              <p className="tp-command-label">Recently used</p>
              {recent
                .map((slug) => tools.find((tool) => tool.slug === slug))
                .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
                .slice(0, 3)
                .map((tool) => (
                  <button
                    key={`recent-${tool.slug}`}
                    type="button"
                    className="tp-command-item"
                    onClick={() => go(tool.slug)}
                  >
                    <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
                    <span>{tool.title}</span>
                    <ArrowRight className="tp-icon" aria-hidden="true" />
                  </button>
                ))}
            </>
          ) : null}

          <p className="tp-command-label">{query ? "Tools" : "All tools"}</p>
          {results.map((tool, index) => (
            <button
              key={tool.slug}
              type="button"
              className={`tp-command-item${index === active ? " is-active" : ""}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(tool.slug)}
            >
              <ToolIcon name={tool.icon} className="tp-icon" aria-hidden="true" />
              <span>{tool.title}</span>
              {index === active ? (
                <CornerDownLeft className="tp-icon" aria-hidden="true" />
              ) : (
                <ArrowRight className="tp-icon" aria-hidden="true" />
              )}
            </button>
          ))}
          {results.length === 0 ? (
            <p className="tp-command-empty">No tools found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
