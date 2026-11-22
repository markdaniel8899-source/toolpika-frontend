"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Code2,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import { adminMessages } from "@/lib/admin/messages";
import {
  BackendError,
  applyStudio,
  chatStudio,
  createStudioSession,
  generateStudio,
  getStudioConfig,
  getStudioSession,
  listStudioSessions,
  planStudio,
  publishStudio,
  translateStudio,
  type StudioBundle,
  type StudioCodeFile,
  type StudioConfig,
  type StudioSession,
} from "@/lib/backend-client";
import { EmptyState, PageHeader, SectionCard, StatusPill } from "@/components/admin/ui";

const t = adminMessages.studio;

type Toast = { tone: "success" | "error"; text: string } | null;
type StepName = "plan" | "generate" | "apply" | "translate" | "publish";

function firstCodeFile(files: StudioCodeFile[] | undefined): StudioCodeFile | undefined {
  return files?.find((file) => file.kind === "module") ?? files?.[0];
}

function artefactText(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const keys = Object.keys(value as Record<string, unknown>);
  if (keys.length === 0) return null;
  return JSON.stringify(value, null, 2);
}

export default function AdminStudioPage() {
  const [bundle, setBundle] = useState<StudioBundle | null>(null);
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [idea, setIdea] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState("");
  const [autoPlan, setAutoPlan] = useState(true);
  const [busy, setBusy] = useState<StepName | "chat" | "session" | null>(null);
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
        const latest = await getStudioSession(sessionList[0].id);
        setBundle(latest);
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
      setUnreachable(false);
      notify({ tone: "success", text: t.stepSuccess });
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

  async function runStep(step: StepName) {
    if (!bundle) return;
    const sessionId = bundle.session.id;
    setBusy(step);
    try {
      const result = await (() => {
        switch (step) {
          case "plan":
            return planStudio(sessionId);
          case "generate":
            return generateStudio(sessionId);
          case "apply":
            return applyStudio(sessionId);
          case "translate":
            return translateStudio(sessionId);
          case "publish":
            return publishStudio(sessionId);
        }
      })();
      setBundle(result);
      setUnreachable(false);
      notify({ tone: "success", text: t.stepSuccess });
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(null);
    }
  }

  const draft = bundle?.draft;
  const hasDraft = Boolean(draft);
  const hasSpec = Boolean(draft?.spec);
  const codeFile = firstCodeFile(draft?.code_files);
  const context = bundle?.context;
  const isBusy = busy !== null;

  const steps: { key: StepName; label: string; loading: string; disabled: boolean }[] = [
    { key: "plan", label: t.plan, loading: t.planning, disabled: !bundle },
    { key: "generate", label: t.generate, loading: t.generating, disabled: !hasDraft },
    {
      key: "apply",
      label: t.apply,
      loading: t.applying,
      disabled: !hasDraft || !codeFile,
    },
    { key: "translate", label: t.translate, loading: t.translating, disabled: !hasSpec },
    { key: "publish", label: t.publish, loading: t.publishing, disabled: !hasSpec },
  ];

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

      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SectionCard title={t.sessionsTitle} className="mb-0">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
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
              disabled={isBusy}
            >
              {busy === "session" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {busy === "session" ? t.starting : t.startSession}
            </button>
          </form>

          {sessions.length > 0 ? (
            <div className="mt-4 flex flex-col gap-2">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => void handleSelect(session.id)}
                  className={`tp-admin-status-row flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2.5 text-left ${
                    bundle?.session.id === session.id
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] bg-[var(--surface)]"
                  }`}
                >
                  <span className="min-w-0 truncate text-[13px] font-semibold">
                    {session.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--muted)]">
                    {session.stage}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--muted)]">{t.noSessions}</p>
          )}
        </SectionCard>

        <SectionCard title={t.contextTitle} className="mb-0">
          {context ? (
            <div className="flex flex-col gap-3 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--muted)]">{t.toolCount}</span>
                <span className="font-semibold tabular-nums">{context.tool_count ?? 0}</span>
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
                <>
                  <div className="border-t border-[var(--border)] pt-3">
                    <p className="text-[11px] text-[var(--muted)]">{t.model}</p>
                    <p className="break-all text-[11px]">{config.model}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--muted)]">{t.translationModel}</p>
                    <p className="text-[11px]">{config.translation_model}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--muted)]">{t.frontendPath}</p>
                    <p className="text-[11px]">
                      {config.frontend_path_configured
                        ? t.frontendPathReady
                        : t.frontendPathMissing}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-[13px] text-[var(--muted)]">{t.contextEmpty}</p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title={t.actionsTitle}
        description={t.actionsDescription}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <button
              key={step.key}
              type="button"
              onClick={() => void runStep(step.key)}
              className="tp-admin-btn tp-admin-btn-secondary"
              disabled={step.disabled || isBusy || unreachable}
            >
              {busy === step.key ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : step.key === "generate" ? (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              ) : null}
              {busy === step.key ? step.loading : step.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] leading-[1.6] text-[var(--muted)]">
          {t.codeNote}
        </p>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <SectionCard
          title={t.chatTitle}
          description={t.chatDescription}
          className="mb-0"
        >
          {bundle ? (
            <>
              <div className="mb-4 flex max-h-[480px] flex-col gap-3 overflow-y-auto pr-1">
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
            <EmptyState message={t.draftEmpty} />
          )}
        </SectionCard>

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
      </div>
    </>
  );
}
