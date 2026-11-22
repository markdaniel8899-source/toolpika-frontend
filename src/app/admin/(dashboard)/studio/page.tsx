"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Circle,
  Code2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";

import { adminMessages } from "@/lib/admin/messages";
import {
  BackendError,
  autoRunStudio,
  chatStudio,
  createStudioSession,
  getStudioConfig,
  getStudioSession,
  listStudioSessions,
  type StudioBundle,
  type StudioCodeFile,
  type StudioConfig,
  type StudioPipelineStep,
  type StudioSession,
} from "@/lib/backend-client";
import { EmptyState, PageHeader, SectionCard, StatusPill } from "@/components/admin/ui";

const t = adminMessages.studio;

type Toast = { tone: "success" | "error"; text: string } | null;

function firstCodeFile(files: StudioCodeFile[] | undefined): StudioCodeFile | undefined {
  return files?.find((file) => file.kind === "module") ?? files?.[0];
}

function artefactText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Object.keys(value as Record<string, unknown>).length === 0) return null;
  return JSON.stringify(value, null, 2);
}

function stepTone(status: StudioPipelineStep["status"]): string {
  switch (status) {
    case "done":
      return "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]";
    case "error":
      return "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]";
    case "running":
      return "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]";
    default:
      return "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)]";
  }
}

function stepLabel(status: StudioPipelineStep["status"]): string {
  switch (status) {
    case "done":
      return t.stepDone;
    case "error":
      return t.stepError;
    case "running":
      return t.stepRunning;
    case "skipped":
      return t.stepSkipped;
    default:
      return t.stepPending;
  }
}

export default function AdminStudioPage() {
  const [bundle, setBundle] = useState<StudioBundle | null>(null);
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [idea, setIdea] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [autoPlan, setAutoPlan] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<"chat" | "session" | "auto" | null>(null);
  const [loading, setLoading] = useState(true);
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
          ? t.backendDownHint
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
      const [sessionList, studioConfig] = await Promise.all([
        listStudioSessions(),
        getStudioConfig().catch(() => null),
      ]);
      setSessions(sessionList);
      setConfig(studioConfig);
      setUnreachable(false);
      if (sessionList.length > 0) {
        setBundle(await getStudioSession(sessionList[0].id));
      } else {
        setShowNew(true);
      }
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

  // While the backend runs the pipeline, poll for the latest step statuses.
  const running = Boolean(bundle?.pipeline?.running);
  useEffect(() => {
    if (!running || !bundle?.session?.id) return;
    const sessionId = bundle.session.id;
    const timer = window.setInterval(() => {
      void getStudioSession(sessionId)
        .then(setBundle)
        .catch(() => undefined);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [running, bundle?.session?.id]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("session");
    try {
      const result = await createStudioSession({
        idea: idea.trim() || undefined,
        source_url: sourceUrl.trim() || undefined,
      });
      setBundle(result);
      setSessions((previous) => [result.session, ...previous]);
      setIdea("");
      setSourceUrl("");
      setShowNew(false);
      setUnreachable(false);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleSelect(sessionId: string) {
    setBusy("session");
    try {
      setBundle(await getStudioSession(sessionId));
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bundle || !message.trim()) return;
    const text = message.trim();
    setMessage("");
    setBusy("chat");
    try {
      const result = await chatStudio(bundle.session.id, text, autoPlan);
      setBundle(result);
      setSessions((previous) =>
        previous.map((item) =>
          item.id === result.session.id ? result.session : item,
        ),
      );
      setUnreachable(false);
    } catch (error) {
      setMessage(text);
      handleError(error);
    } finally {
      setBusy(null);
    }
  }

  async function handleAutoRun() {
    if (!bundle) return;
    setBusy("auto");
    try {
      const result = await autoRunStudio(bundle.session.id, {
        idea: bundle.session.idea ?? undefined,
        source_url: bundle.session.source_url ?? undefined,
      });
      setBundle(result);
      notify({ tone: "success", text: t.stepSuccess });
      setUnreachable(false);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(null);
    }
  }

  const draft = bundle?.draft;
  const codeFile = firstCodeFile(draft?.code_files);
  const context = bundle?.context;
  const pipeline = bundle?.pipeline;
  const isBusy = busy !== null;
  const steps = pipeline?.steps ?? [];

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
            disabled={loading}
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

      {unreachable ? (
        <div className="mb-6 flex items-start gap-3 rounded-[12px] border border-[var(--danger)] bg-[var(--danger)]/10 px-4 py-3 text-[13px] text-[var(--danger)]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="font-semibold">{t.backendDown}</p>
        </div>
      ) : null}

      {/* 1. Chat first - this is where the tool is decided. */}
      <SectionCard
        title={t.chatTitle}
        description={t.chatDescription}
        className="mb-6"
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {sessions.length > 0 ? (
            <select
              value={bundle?.session.id ?? ""}
              onChange={(event) => void handleSelect(event.target.value)}
              aria-label={t.sessionLabel}
              className="tp-field-input w-auto min-w-[200px]"
              disabled={isBusy}
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            onClick={() => setShowNew((value) => !value)}
            className="tp-admin-btn tp-admin-btn-secondary"
            disabled={isBusy}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.newSession}
          </button>
          {!bundle ? <span className="text-[12px] text-[var(--muted)]">{t.noSessions}</span> : null}
        </div>

        {showNew ? (
          <form onSubmit={handleCreate} className="mb-5 flex flex-col gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <input
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder={t.ideaPlaceholder}
              aria-label={t.ideaLabel}
              className="tp-field-input"
              type="text"
            />
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder={t.urlPlaceholder}
              aria-label={t.urlLabel}
              className="tp-field-input"
              type="url"
            />
            <button
              type="submit"
              className="tp-admin-btn self-start"
              disabled={isBusy || !idea.trim()}
            >
              {busy === "session" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {busy === "session" ? t.starting : t.startSession}
            </button>
          </form>
        ) : null}

        {bundle ? (
          <>
            <div className="mb-4 flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
              {bundle.messages.length === 0 ? (
                <EmptyState message={t.noMessages} />
              ) : (
                bundle.messages.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-[12px] border px-4 py-3 text-[13px] leading-[1.6] ${
                      item.role === "user"
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface-2)]"
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                      {item.role === "user" ? t.you : t.assistant}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{item.content}</p>
                    {artefactText(item.artifacts) ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] text-[var(--muted)]">
                          {t.qa}
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-[8px] bg-[var(--bg)] p-3 text-[11px] leading-[1.5]">
                          {artefactText(item.artifacts)}
                        </pre>
                      </details>
                    ) : null}
                  </article>
                ))
              )}
            </div>

            <form onSubmit={handleChat} className="flex flex-col gap-3">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t.messagePlaceholder}
                aria-label={t.messagePlaceholder}
                className="tp-field-input min-h-[96px] resize-y"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={autoPlan}
                    onChange={(event) => setAutoPlan(event.target.checked)}
                    className="h-4 w-4 accent-[var(--accent-fill)]"
                  />
                  {t.autoPlan}
                </label>
                <button
                  type="submit"
                  className="tp-admin-btn"
                  disabled={isBusy || !message.trim() || unreachable}
                >
                  {busy === "chat" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy === "chat" ? t.sending : t.send}
                </button>
              </div>
            </form>
          </>
        ) : (
          <EmptyState message={t.pipelineIdle} />
        )}
      </SectionCard>

      {/* 2. Pipeline visualisation directly under the chat box. */}
      <SectionCard
        title={t.pipelineTitle}
        description={t.pipelineDescription}
        className="mb-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {pipeline?.running ? (
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${stepTone("running")}`}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                {t.pipelineRunning}
              </span>
            ) : steps.some((step) => step.status === "error") ? (
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${stepTone("error")}`}>
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {t.pipelineError}
              </span>
            ) : steps.length > 0 && steps.every((step) => step.status === "done") ? (
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${stepTone("done")}`}>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {t.pipelineDone}
              </span>
            ) : (
              <span className="text-[12px] text-[var(--muted)]">{t.pipelineIdle}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleAutoRun()}
            className="tp-admin-btn tp-admin-btn-secondary"
            disabled={!bundle || isBusy || unreachable}
          >
            {busy === "auto" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            {busy === "auto" ? t.runningPipeline : t.runPipeline}
          </button>
        </div>

        {steps.length === 0 ? (
          <EmptyState message={t.pipelineIdle} />
        ) : (
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li
                key={step.key}
                className={`rounded-[12px] border px-4 py-3 ${stepTone(step.status)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">{step.label}</p>
                      <p className="text-[11px] opacity-80">{step.stage}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    {step.status === "running" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : step.status === "done" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : step.status === "error" ? (
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Circle className="h-3 w-3" aria-hidden="true" />
                    )}
                    {stepLabel(step.status)}
                  </span>
                </div>
                {step.logs.length > 0 ? (
                  <details className="mt-2" open={step.status === "error"}>
                    <summary className="cursor-pointer text-[11px] font-semibold opacity-90">
                      {t.logs} ({step.logs.length})
                    </summary>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-[8px] bg-[var(--bg)] p-3 text-[11px] leading-[1.5] text-[var(--text)]">
                      {step.logs.join("\n")}
                    </pre>
                  </details>
                ) : step.status === "error" ? (
                  <p className="mt-2 text-[11px]">{t.noLogs}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      {/* 3. Supporting details. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <SectionCard title={t.draftTitle} className="mb-0">
          {draft ? (
            <div className="flex flex-col gap-4 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={draft.status} />
                <span className="text-[12px] text-[var(--muted)]">
                  {bundle?.session.stage}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-[var(--muted)]">{t.slug}</p>
                <p className="font-semibold">{draft.slug}</p>
              </div>
              {draft.qa && Object.keys(draft.qa).length > 0 ? (
                <details>
                  <summary className="cursor-pointer text-[12px] font-semibold">
                    {t.qa}
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-[8px] bg-[var(--bg)] p-3 text-[11px]">
                    {JSON.stringify(draft.qa, null, 2)}
                  </pre>
                </details>
              ) : null}
              {draft.code_files && draft.code_files.length > 0 ? (
                <div>
                  <p className="mb-1 text-[11px] text-[var(--muted)]">{t.files}</p>
                  <ul className="flex flex-col gap-1 text-[11px]">
                    {draft.code_files.map((file) => (
                      <li key={file.path} className="break-all">
                        {file.path}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {codeFile ? (
                <details>
                  <summary className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold">
                    <Code2 className="h-4 w-4" aria-hidden="true" />
                    {t.code}
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-[8px] bg-[var(--bg)] p-3 text-[11px] leading-[1.5]">
                    {codeFile.content}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : (
            <EmptyState message={t.draftEmpty} />
          )}
        </SectionCard>

        <SectionCard title={t.contextTitle} className="mb-0">
          {context ? (
            <div className="flex flex-col gap-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">{t.toolCount}</span>
                <span className="font-semibold tabular-nums">{context.tool_count ?? 0}</span>
              </div>
              <div>
                <p className="mb-1 text-[var(--muted)]">{t.availableTools}</p>
                <p className="break-words text-[11px]">
                  {(context.tools ?? [])
                    .map((tool) => tool.name || tool.slug)
                    .join(", ") || "—"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">{t.locales}</span>
                <span className="text-right text-[11px]">
                  {(context.locales ?? []).join(", ") || "—"}
                </span>
              </div>
              <div>
                <p className="mb-1 text-[var(--muted)]">{t.relevant}</p>
                <p className="break-words text-[11px]">
                  {(context.relevant_slugs ?? []).join(", ") || "—"}
                </p>
              </div>
              {config ? (
                <div className="border-t border-[var(--border)] pt-3 text-[11px]">
                  <p className="text-[var(--muted)]">{t.model}</p>
                  <p className="break-all">{config.model}</p>
                  <p className="mt-2 text-[var(--muted)]">{t.translationModel}</p>
                  <p>{config.translation_model}</p>
                  <p className="mt-2 text-[var(--muted)]">{t.frontendPath}</p>
                  <p>
                    {config.frontend_path_configured
                      ? t.frontendPathReady
                      : t.frontendPathMissing}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--muted)]">{t.contextEmpty}</p>
          )}
        </SectionCard>
      </div>
    </>
  );
}
