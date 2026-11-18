"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getLiveTools } from "@/lib/tools/registry";
import { ToolIcon } from "@/components/tools/tool-icon";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof getLiveTools>>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = "tool-search-results";
  const tools = getLiveTools();

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setQuery(value);
      setActiveIndex(-1);
      if (!value) {
        setResults([]);
        return;
      }
      const lower = value.toLowerCase();
      setResults(
        tools.filter(
          (tool) =>
            tool.title.toLowerCase().includes(lower) ||
            tool.slug.includes(lower) ||
            tool.description.toLowerCase().includes(lower),
        ),
      );
    },
    [tools],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (slug: string) => {
    router.push(`/tools/${slug}`);
    setQuery("");
    setResults([]);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const exact = tools.find((tool) => tool.slug === query);
    if (exact) {
      go(exact.slug);
      return;
    }
    const match = results[activeIndex >= 0 ? activeIndex : 0];
    if (match) go(match.slug);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setResults([]);
      setActiveIndex(-1);
    }
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const maxResults = results.slice(0, 6);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <form onSubmit={handleSubmit}>
        <div className="tp-search">
          <Search className="tp-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `tool-result-${activeIndex}` : undefined}
            aria-label={t("placeholder")}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t("placeholder")}
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              aria-label={t("clear")}
              className="tp-icon-btn tp-icon-only"
              style={{ width: 28, height: 28, border: 0, background: "transparent" }}
            >
              <X className="tp-icon" style={{ width: 14, height: 14 }} aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {isFocused && query && maxResults.length > 0 && (
        <ul id={listboxId} role="listbox" aria-label={t("placeholder")} className="tp-search-results slide-up">
          {maxResults.map((tool, index) => (
            <li key={tool.slug} id={`tool-result-${index}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => go(tool.slug)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn("tp-search-option", index === activeIndex && "is-active")}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                  <ToolIcon name={tool.icon} className="tp-icon" style={{ width: 16, height: 16 }} aria-hidden="true" />
                  <span style={{ fontWeight: 500 }}>{tool.title}</span>
                </span>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{tool.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
