"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getLiveTools } from "@/lib/tools/registry";
import { ToolIcon } from "@/components/tools/tool-icon";

export function SearchBar() {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReturnType<typeof getLiveTools>>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
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
            tool.description.toLowerCase().includes(lower)
        )
      );
    },
    [tools]
  );

  // "/" focuses the search input from anywhere on the page.
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
    if (match) {
      go(match.slug);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        index <= 0 ? results.length - 1 : index - 1
      );
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

  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const maxResults = results.slice(0, 6);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <form onSubmit={handleSubmit} className="relative w-full max-w-[700px]">
        <div className="relative w-full rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <Search
            className="absolute left-[24px] top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `tool-result-${activeIndex}` : undefined
            }
            aria-label={t("placeholder")}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="w-full pr-[64px] pl-[52px] py-3 bg-transparent border-none text-[18px] text-[var(--text)] placeholder-[var(--muted)] focus:outline-none sm:text-[18px]"
          />
          <span className="absolute right-[24px] top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg)] text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
            /
          </span>
          {query && (
            <button
              type="button"
              onClick={clear}
              className="absolute right-[24px] top-1/2 -translate-y-1/2 h-5 w-5 rounded-full text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
              aria-label={t("clear")}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {isFocused && (
          <div className="absolute inset-0 rounded-[14px] border border-[var(--accent)] shadow-[0_0_0_4px_rgba(91,75,255,0.1)] pointer-events-none" aria-hidden="true" />
        )}
      </form>

      {query && (
        <p className="sr-only" role="status" aria-live="polite">
          {results.length
            ? t("results", { count: results.length })
            : t("noResults")}
        </p>
      )}

      {query && maxResults.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("placeholder")}
          className="z-20 w-full max-w-[700px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
        >
          {maxResults.map((tool, index) => (
            <li
              key={tool.slug}
              id={`tool-result-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onClick={() => go(tool.slug)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-200",
                  index === activeIndex
                    ? "bg-[var(--bg)]"
                    : "hover:bg-[var(--bg)]",
                )}
              >
                <div className="flex items-center gap-3">
                  <ToolIcon name={tool.icon} className="h-4 w-4 text-[var(--accent)]" />
                  <span className="font-medium text-[var(--text)]">
                    {tool.title}
                  </span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  {tool.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
