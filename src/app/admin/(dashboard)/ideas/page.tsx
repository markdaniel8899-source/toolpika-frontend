"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Search } from "lucide-react";

import { adminMessages } from "@/lib/admin/messages";
import { PageHeader } from "@/components/admin/ui";
import {
  BackendError,
  listIdeas,
  runResearch,
  updateIdeaStatus,
  type IdeaStatus,
  type ToolIdea,
} from "@/lib/backend-client";

const t = adminMessages.ideas;

type Toast = { tone: "success" | "error"; text: string } | null;

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

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = useState<ToolIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [unreachable, setUnreachable] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 5000);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setIdeas(await listIdeas());
      setUnreachable(false);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function handleResearch() {
    setRunning(true);
    try {
      const result = await runResearch();
      setIdeas(result.ideas);
      setUnreachable(false);
      notify({ tone: "success", text: `${t.researchDone}: ${result.ideas.length}` });
    } catch (error) {
      handleError(error);
    } finally {
      setRunning(false);
    }
  }

  async function handleStatus(id: string, status: IdeaStatus) {
    setUpdatingId(id);
    try {
      const updated = await updateIdeaStatus(id, status);
      setIdeas((previous) =>
        previous.map((idea) => (idea.id === id ? updated : idea)),
      );
    } catch (error) {
      handleError(error);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="tp-admin-btn tp-admin-btn-secondary"
            disabled={loading || running}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {adminMessages.common.loading}
          </button>
        }
      />

      {toast ? (
        <div
          role="status"
          className={`mb-6 flex items-center gap-2 rounded-[12px] border px-4 py-3 text-[13px] ${
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
        <p className="text-[13px] text-[var(--muted)]">{t.actionHint}</p>
        <button
          type="button"
          onClick={() => void handleResearch()}
          className="tp-admin-btn"
          disabled={running || unreachable}
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          {running ? t.researching : t.researchNow}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-[13px] text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {adminMessages.common.loading}
        </div>
      ) : ideas.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--surface-2)] px-5 py-12 text-center text-[13px] text-[var(--muted)]">
          {t.empty}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ideas.map((idea) => (
            <article
              key={idea.id}
              className="flex flex-col gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-sans text-[18px] font-semibold leading-snug tracking-[-0.02em]">
                  {idea.tool_name}
                </h2>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(idea.status)}`}
                >
                  {idea.status}
                </span>
              </div>

              <div>
                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
                  {idea.category}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  {t.whyTrending}
                </p>
                <p className="mt-1 text-[13px] italic leading-[1.6] text-[var(--muted)]">
                  {idea.why_trending}
                </p>
              </div>

              <p className="text-[13px] leading-[1.6] text-[var(--text)]">
                {idea.short_description}
              </p>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${difficultyClasses(idea.estimated_difficulty)}`}
                  >
                    {idea.estimated_difficulty}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {formatDate(idea.created_at)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["reviewed", "building", "rejected"] as Exclude<
                    IdeaStatus,
                    "new"
                  >[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => void handleStatus(idea.id, status)}
                        disabled={updatingId === idea.id || idea.status === status}
                        className="tp-admin-btn tp-admin-btn-secondary px-3 py-1.5 text-[11px]"
                      >
                        {updatingId === idea.id ? "…" : t[status]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
