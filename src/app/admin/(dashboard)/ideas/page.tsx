"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Send,
} from "lucide-react";

import { adminMessages } from "@/lib/admin/messages";
import { PageHeader } from "@/components/admin/ui";
import {
  BackendError,
  chatWithStrategist,
  listIdeas,
  updateIdeaStatus,
  type ChatTurn,
  type ToolIdea,
} from "@/lib/backend-client";

const t = adminMessages.ideas;
const RESEARCH_INTENT =
  /(research|scout|trend(?:ing|s)?|find\s+(?:trending\s+)?(?:tool\s+)?ideas?)/i;

type Toast = { tone: "success" | "error"; text: string } | null;

function statusClasses(value: string): string {
  switch (value.toLowerCase()) {
    case "new":
      return "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]";
    case "rejected":
      return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
    default:
      return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]";
  }
}

function difficultyClasses(value: string): string {
  switch (value.toLowerCase()) {
    case "easy":
      return "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
    case "hard":
      return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
    default:
      return "border-[#d9a520] bg-[#d9a520]/10 text-[#a97b12]";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function AdminIdeasPage() {
  const [messages, setMessages] = useState<ChatTurn[]>([
    { role: "assistant", content: t.chatEmpty },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ideas, setIdeas] = useState<ToolIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [unreachable, setUnreachable] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const notify = useCallback((next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 4000);
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      const down = error instanceof BackendError && error.status === 0;
      setUnreachable(down);
      notify({
        tone: "error",
        text: down
          ? t.backendDown
          : error instanceof Error
            ? error.message
            : String(error),
      });
    },
    [notify],
  );

  const loadIdeas = useCallback(async () => {
    setLoadingIdeas(true);
    try {
      setIdeas(await listIdeas());
      setUnreachable(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoadingIdeas(false);
    }
  }, [handleError]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadIdeas();
    });
    return () => {
      active = false;
    };
  }, [loadIdeas]);

  useEffect(() => {
    const element = chatRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, busy]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const userTurn: ChatTurn = { role: "user", content: text };
    const history = messages;
    setMessages((previous) => [...previous, userTurn]);
    setInput("");
    setBusy(true);

    try {
      const result = await chatWithStrategist(
        text,
        RESEARCH_INTENT.test(text) ? "research" : "chat",
        history,
      );
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: result.reply },
      ]);
      if (result.action === "run_research") {
        setIdeas(await listIdeas());
        setOpenId(null);
        notify({ tone: "success", text: result.reply });
      }
      setUnreachable(false);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : String(error),
        },
      ]);
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy(idea: ToolIdea) {
    const text = `${idea.tool_name}\n\n${idea.short_description}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(idea.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      notify({ tone: "error", text: "Clipboard is not available." });
    }
  }

  async function handleReviewed(idea: ToolIdea) {
    try {
      const updated = await updateIdeaStatus(idea.id, "reviewed");
      setIdeas((previous) =>
        previous.map((item) => (item.id === idea.id ? updated : item)),
      );
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {toast ? (
        <div
          role="status"
          className={`mb-5 flex items-center gap-2 rounded-[12px] border px-4 py-3 text-[13px] ${
            toast.tone === "success"
              ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
              : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
          }`}
        >
          {toast.tone === "success" ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {toast.text}
        </div>
      ) : null}

      {/* 40% - Strategy chat */}
      <section className="mb-6 flex min-h-[320px] flex-col rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-sans text-[17px] font-semibold tracking-[-0.02em]">
              {t.chatTitle}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">
              {t.chatSubtitle}
            </p>
          </div>
        </div>

        <div
          ref={chatRef}
          className="flex max-h-[280px] min-h-[180px] flex-1 flex-col gap-3 overflow-y-auto pr-2"
        >
          {messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-[13px] leading-[1.6] ${
                item.role === "user"
                  ? "self-end bg-[var(--accent)] text-[var(--accent-fg)]"
                  : "self-start border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]"
              }`}
            >
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] opacity-70">
                {item.role === "user" ? t.you : t.assistant}
              </p>
              <p className="whitespace-pre-wrap break-words">{item.content}</p>
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-2 self-start rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-[12px] text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t.researching}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSend} className="mt-4 flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.chatPlaceholder}
            aria-label={t.chatPlaceholder}
            className="tp-field-input flex-1"
            disabled={busy || unreachable}
          />
          <button
            type="submit"
            className="tp-admin-btn shrink-0"
            disabled={busy || !input.trim() || unreachable}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{busy ? t.thinking : t.send}</span>
          </button>
        </form>
      </section>

      {/* 60% - Research reports */}
      <section>
        <div className="mb-4">
          <h2 className="font-sans text-[17px] font-semibold tracking-[-0.02em]">
            {t.reportsTitle}
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--muted)]">
            {t.reportsSubtitle}
          </p>
        </div>

        {loadingIdeas ? (
          <div className="flex items-center gap-2 py-10 text-[13px] text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {adminMessages.common.loading}
          </div>
        ) : ideas.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-5 py-12 text-center text-[13px] text-[var(--muted)]">
            {t.empty}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {ideas.map((idea) => {
              const open = openId === idea.id;
              const details = idea.report_details ?? {};
              const volume = idea.search_volume || details.search_volume || "N/A";
              const competition =
                idea.competition || details.competition || "N/A";
              const audience = details.target_audience || "—";
              return (
                <article
                  key={idea.id}
                  className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : idea.id)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[15px] font-semibold">
                        {idea.tool_name}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(idea.status)}`}
                      >
                        {idea.status === "new" ? t.newBadge : idea.status}
                      </span>
                      {String(volume).toLowerCase() === "high" ? (
                        <span className="inline-flex rounded-full border border-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--success)]">
                          {t.highDemand}
                        </span>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${difficultyClasses(idea.estimated_difficulty)}`}
                    >
                      {idea.estimated_difficulty}
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      open
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-4 border-t border-[var(--border)] px-5 py-5">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                            {t.purpose}
                          </p>
                          <p className="mt-1 text-[13px] leading-[1.6]">
                            {idea.short_description}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                            {t.whyTrending}
                          </p>
                          <p className="mt-1 text-[13px] italic leading-[1.6] text-[var(--muted)]">
                            {idea.why_trending}
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                            {t.stats}
                          </p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                                {t.searchVolume}
                              </p>
                              <p className="mt-0.5 text-[13px] font-semibold">
                                {volume}
                              </p>
                            </div>
                            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                                {t.competition}
                              </p>
                              <p className="mt-0.5 text-[13px] font-semibold">
                                {competition}
                              </p>
                            </div>
                            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                                {t.audience}
                              </p>
                              <p className="mt-0.5 text-[13px] font-semibold">
                                {audience}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-[var(--muted)]">
                            {formatDate(idea.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCopy(idea)}
                            className="tp-admin-btn"
                          >
                            {copiedId === idea.id ? (
                              <Check className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                            {copiedId === idea.id ? t.copied : t.copyIdea}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReviewed(idea)}
                            disabled={idea.status === "reviewed"}
                            className="tp-admin-btn tp-admin-btn-secondary"
                          >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {t.markReviewed}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
