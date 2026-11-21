"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, Play, RefreshCw, Send } from "lucide-react";

import { adminMessages } from "@/lib/admin/messages";
import {
  BackendError,
  getBackendConfig,
  getPipelineStatus,
  listBackendTools,
  translateTool,
  triggerPipeline,
  type BackendConfig,
  type BackendTool,
  type PipelineRun,
} from "@/lib/backend-client";
import { EmptyState, PageHeader, SectionCard } from "@/components/admin/ui";

const t = adminMessages.pipeline;

type Toast = { tone: "success" | "error"; text: string } | null;

function runSlug(run: PipelineRun): string {
  const details = run.details;
  if (details && typeof details.slug === "string" && details.slug) {
    return details.slug;
  }
  return run.stage || "—";
}

function runStatus(run: PipelineRun): string {
  if (typeof run.status === "string") return run.status;
  return run.stage || "unknown";
}

function statusTone(status: string): string {
  const value = status.toLowerCase();
  if (["success", "published", "complete"].includes(value)) {
    return "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
  }
  if (["error", "failed", "qa_failed"].includes(value)) {
    return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
  }
  return "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]";
}

export default function AdminPipelinePage() {
  const [topic, setTopic] = useState("");
  const [starting, setStarting] = useState(false);
  const [translatingSlug, setTranslatingSlug] = useState<string | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [tools, setTools] = useState<BackendTool[]>([]);
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const notify = useCallback((next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [status, toolRows, backendConfig] = await Promise.all([
        getPipelineStatus(),
        listBackendTools(),
        getBackendConfig().catch(() => null),
      ]);
      setRuns(status.recent_runs ?? []);
      setTools(toolRows ?? []);
      setConfig(backendConfig);
      setUnreachable(false);
    } catch (error) {
      const down = error instanceof BackendError && error.status === 0;
      setUnreachable(down);
      if (!down) notify({ tone: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    // Defer to a microtask so the first data fetch does not set state
    // synchronously inside the effect body.
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  async function handleStart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStarting(true);
    try {
      const result = await triggerPipeline(topic);
      if (!result.success) {
        notify({ tone: "error", text: result.logs.join(" · ") || t.startFailed });
      } else {
        notify({ tone: "success", text: `${t.startSuccess}${result.slug ? `: ${result.slug}` : ""}` });
        setTopic("");
      }
      await load();
    } catch (error) {
      const down = error instanceof BackendError && error.status === 0;
      setUnreachable(down);
      notify({
        tone: "error",
        text: down ? t.backendDownHint : error instanceof Error ? error.message : String(error),
      });
    } finally {
      setStarting(false);
    }
  }

  async function handleTranslate(slug: string) {
    setTranslatingSlug(slug);
    try {
      const result = await translateTool(slug);
      notify({
        tone: result.success ? "success" : "error",
        text: result.success
          ? `${t.translateSuccess}: ${slug}`
          : `${t.translateFailed}: ${result.failed_locales.join(", ")}`,
      });
      await load();
    } catch (error) {
      const down = error instanceof BackendError && error.status === 0;
      setUnreachable(down);
      notify({
        tone: "error",
        text: down ? t.backendDownHint : error instanceof Error ? error.message : String(error),
      });
    } finally {
      setTranslatingSlug(null);
    }
  }

  const queue = tools.filter(
    (tool) => tool.translation_status && tool.translation_status !== "published",
  );

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        action={
          <button type="button" onClick={() => void load()} className="tp-admin-btn tp-admin-btn-secondary" disabled={loading}>
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

      {unreachable ? (
        <div className="mb-6 flex items-start gap-3 rounded-[12px] border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-[13px] text-[var(--danger)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t.backendDown}</p>
            <p className="mt-1 text-[var(--muted)]">{t.backendDownHint}</p>
          </div>
        </div>
      ) : null}

      <SectionCard title={t.triggerTitle} description={t.triggerDescription} className="mb-6">
        <form onSubmit={handleStart} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">{t.topicLabel}</span>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={t.topicPlaceholder}
              className="tp-field-input"
              type="text"
            />
          </label>
          <button type="submit" className="tp-admin-btn" disabled={starting || unreachable}>
            {starting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            {starting ? t.starting : t.start}
          </button>
        </form>
        {config ? (
          <p className="mt-3 text-[12px] text-[var(--muted)]">
            {t.configuredLocales}: {config.available_locales.join(" · ")}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title={t.statusTitle} description={t.statusDescription} className="mb-6">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-[13px] text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {adminMessages.common.loading}
          </div>
        ) : runs.length === 0 ? (
          <EmptyState message={t.noRuns} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                  <th className="py-2.5 pr-4 font-semibold">{t.slug}</th>
                  <th className="py-2.5 pr-4 font-semibold">{t.status}</th>
                  <th className="py-2.5 font-semibold">{t.timestamp}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, index) => (
                  <tr key={`${runSlug(run)}-${index}`} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 font-medium">{runSlug(run)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(runStatus(run))}`}>
                        {runStatus(run)}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--muted)]">
                      {run.created_at ? new Date(run.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t.queueTitle} description={t.queueDescription}>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-[13px] text-[var(--muted)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {adminMessages.common.loading}
          </div>
        ) : queue.length === 0 ? (
          <EmptyState message={t.noQueue} />
        ) : (
          <div className="flex flex-col gap-2">
            {queue.map((tool) => (
              <div
                key={tool.slug}
                className="tp-admin-status-row flex items-center justify-between gap-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{tool.slug}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {tool.translation_status ?? "pending"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleTranslate(tool.slug)}
                  disabled={translatingSlug === tool.slug || unreachable}
                  className="tp-admin-btn tp-admin-btn-secondary"
                >
                  {translatingSlug === tool.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {translatingSlug === tool.slug ? t.translating : t.forceTranslate}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
