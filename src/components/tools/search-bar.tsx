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

  const maxResults = results.slice(0, 6);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <form onSubmit={handleSubmit} className="relative w-full max-w-[640px]">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--muted)]"
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
          className={`
            w-full h-[56px] rounded-[14px] border border-[var(--border)] bg-[var(--surface)]
            pl-11 pr-10 text-[16px] text-[var(--text)] placeholder-[var(--muted)]
            transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]
            focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)]
          `}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
          /
        </span>
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full text-[var(--muted)] transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
            aria-label={t("clear")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
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
          className="z-20 w-full max-w-[640px] overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
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
                  "flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-[var(--dur-fast)]",
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
