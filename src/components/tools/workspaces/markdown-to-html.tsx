"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CodeOutput, OutputEmpty, Stat } from "../workspace-ui";

const SAMPLE = [
  "# A safe heading",
  "",
  "Markdown becomes **bold**, *italic* and `inline code`.",
  "",
  "- First item",
  "- Second item",
  "",
  "1. One",
  "2. Two",
  "",
  "> A quoted thought.",
  "",
  "Read more at [Toolpika](https://toolpika.com).",
  "",
  "```js",
  'console.log("hello");',
  "```",
].join("\n");

/** Escape before composing any markup so raw user HTML can never execute. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}

/** Only well-known safe schemes and relative links become href values. */
function safeHref(value: string): string | null {
  const url = value.trim();
  if (!url) return null;
  if (/^(?:https?:|mailto:|tel:)/iu.test(url)) return url;
  if (/^(?:#|\/|\.{1,2}\/)/u.test(url)) return url;
  if (/^[a-z][a-z\d+.-]*:/iu.test(url)) return null;
  return url;
}

function inlineMarkdown(value: string): string {
  const codeSpans: string[] = [];

  // Extract code first so markdown inside it stays literal.
  let text = escapeHtml(value).replace(/`([^`]+)`/gu, (_match, code: string) => {
    const token = `\u0000${codeSpans.length}\u0000`;
    codeSpans.push(`<code>${code}</code>`);
    return token;
  });

  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/gu,
    (match, label: string, rawUrl: string) => {
      const href = safeHref(rawUrl);
      return href
        ? `<a href="${href}" rel="noopener noreferrer">${label}</a>`
        : match;
    },
  );

  text = text
    .replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
    .replace(/__([^_]+)__/gu, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/gu, "<em>$1</em>")
    .replace(/_([^_]+)_/gu, "<em>$1</em>");

  return text.replace(/\u0000(\d+)\u0000/gu, (_match, index: string) => {
    return codeSpans[Number(index)] ?? "";
  });
}

function renderParagraph(lines: string[]): string {
  let content = "";

  lines.forEach((line, index) => {
    const hardBreak = /\s{2,}$/u.test(line);
    const cleaned = hardBreak ? line.replace(/\s{2,}$/u, "") : line;
    content += inlineMarkdown(cleaned);
    if (index < lines.length - 1) {
      content += hardBreak ? "<br />" : " ";
    }
  });

  return `<p>${content}</p>`;
}

/**
 * Small, dependency-free Markdown to HTML converter. Pure: no DOM, no network.
 * Every text fragment is escaped before markup is composed, so <script> and
 * other raw HTML in the input are emitted as inert text.
 */
export function markdownToHtml(markdown: string): string {
  // NUL characters are used as internal placeholders and never appear in output.
  const source = markdown.replace(/\u0000/gu, "").replace(/\r\n?/gu, "\n");
  const lines = source.split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let index = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(renderParagraph(paragraph));
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      flushParagraph();
      index += 1;
      continue;
    }

    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/u);
    if (fence) {
      flushParagraph();
      const marker = fence[1];
      const language = fence[2] ?? "";
      const code: string[] = [];
      index += 1;

      while (index < lines.length) {
        const candidate = lines[index].trim();
        const closes =
          candidate.length >= marker.length &&
          [...candidate].every((character) => character === marker[0]);
        if (closes) {
          index += 1;
          break;
        }
        code.push(lines[index]);
        index += 1;
      }

      const attributes = language
        ? ` class="language-${escapeHtml(language)}"`
        : "";
      blocks.push(`<pre><code${attributes}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/u);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s{0,3}>\s?/u.test(line)) {
      flushParagraph();
      const quoted: string[] = [];
      while (index < lines.length && /^\s{0,3}>\s?/u.test(lines[index])) {
        quoted.push(lines[index].replace(/^\s{0,3}>\s?/u, ""));
        index += 1;
      }
      blocks.push(`<blockquote>${renderParagraph(quoted)}</blockquote>`);
      continue;
    }

    const unordered = /^\s{0,3}[-*+]\s+(.+)$/u;
    if (unordered.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && unordered.test(lines[index])) {
        const match = lines[index].match(unordered);
        items.push(`<li>${inlineMarkdown(match?.[1] ?? "")}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    const ordered = /^\s{0,3}\d+[.)]\s+(.+)$/u;
    if (ordered.test(line)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && ordered.test(lines[index])) {
        const match = lines[index].match(ordered);
        items.push(`<li>${inlineMarkdown(match?.[1] ?? "")}</li>`);
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  flushParagraph();
  return blocks.join("\n");
}

export default function MarkdownToHtml() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const html = useMemo(() => (input.trim() ? markdownToHtml(input) : ""), [input]);
  const stats = useMemo(() => {
    const trimmed = input.trim();
    return {
      characters: input.length,
      words: trimmed ? trimmed.split(/\s+/u).length : 0,
      lines: input ? input.split(/\r\n|\r|\n/u).length : 0,
    };
  }, [input]);

  const status = error
    ? t("statusError")
    : html
      ? t("statusReady")
      : t("statusIdle");

  const handleReset = () => {
    setInput("");
    setError(false);
    inputRef.current?.focus();
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setError(false);
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
        setError(false);
      }
    } catch {
      setError(true);
    }
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInput("");
    setError(false);
    inputRef.current?.focus();
  };

  return (
    <WorkspaceLayout
      title={t("markdown-to-html.title")}
      icon="Code"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={html ? `${html.length} ${tu("characters")}` : undefined}
      input={
        <div className="flex min-w-0 flex-col gap-3">
          <div
            className="tp-workspace-inline-actions justify-end"
            style={{ marginTop: 0 }}
          >
            <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              {t("paste")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!input}
              onClick={handleClear}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
                        setError(false);
            }}
            placeholder={tu("startTyping")}
            aria-label={tu("pasteText")}
            spellCheck={false}
            className="min-h-[300px] min-w-0 font-mono text-[13px]"
          />
          <p className="tp-workspace-hint break-words" aria-live="polite">
            {stats.characters} {tu("characters").toLowerCase()} · {stats.words}{" "}
            {tu("words").toLowerCase()} · {stats.lines} {tu("lines").toLowerCase()}
          </p>
          {error ? (
            <p className="tp-workspace-error break-words" role="alert">
              {tu("error")}
            </p>
          ) : null}
        </div>
      }
      output={
        <div className="flex min-w-0 flex-col gap-3 overflow-hidden">
          {html ? (
            <CodeOutput
              code={html}
              language="html"
              storageKey="tp-markdown-to-html-code-view"
              label={tu("result")}
              fileName="converted.html"
              mimeType="text/html;charset=utf-8"
              className="min-w-0 max-w-full"
            />
          ) : (
            <OutputEmpty message={t("resultEmpty")} className="min-h-[220px]" />
          )}

          {html ? (
            <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="min-w-0 overflow-hidden">
                <Stat label={tu("characters")} value={html.length} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <Stat label={tu("words")} value={stats.words} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <Stat label={tu("lines")} value={html.split("\n").length} />
              </div>
            </dl>
          ) : null}

          <p className="tp-workspace-hint break-words" role="status" aria-live="polite">
            {status}
          </p>
          <p className="tp-workspace-hint break-words">
            {t("markdown-to-html.unsafeNote")}
          </p>
        </div>
      }
    />
  );
}
