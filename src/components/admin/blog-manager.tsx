"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Check, CircleDashed, Pencil, Plus, Trash2, X } from "lucide-react";
import { deletePost, savePost } from "@/app/admin/actions";
import { getSeoChecks, scoreSeo } from "@/lib/admin/seo";
import type { AdminPost } from "@/lib/admin/row-types";
import { DataTable, EmptyState, StatusPill } from "@/components/admin/ui";

export interface PostEditorCopy {
  add: string;
  editorTitle: string;
  title: string;
  slug: string;
  contentLabel: string;
  contentPlaceholder: string;
  seoTitle: string;
  seoDescription: string;
  seoChecklist: string;
  seoTitleLength: string;
  seoTitleOk: string;
  seoTitleShort: string;
  seoTitleLong: string;
  seoDescLength: string;
  seoDescOk: string;
  seoDescShort: string;
  seoDescLong: string;
  seoHeadings: string;
  seoHeadingsOk: string;
  seoHeadingsMissing: string;
  publish: string;
  unpublish: string;
  save: string;
  saving: string;
  cancel: string;
  delete: string;
  deleteConfirm: string;
  errorMissing: string;
  errorSlug: string;
  errorSave: string;
  saved: string;
}

export interface BlogManagerCopy extends PostEditorCopy {
  listTitle: string;
  status: string;
  seoScore: string;
  views: string;
  empty: string;
  statusPublished: string;
  statusDraft: string;
  actions: string;
}

function SubmitButton({
  label,
  pendingLabel,
  name,
  value,
}: {
  label: string;
  pendingLabel: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className="tp-admin-btn"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function fieldClass() {
  return "flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm";
}

export function BlogManager({
  posts,
  copy,
}: {
  posts: AdminPost[];
  copy: BlogManagerCopy;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [state, formAction] = useActionState(savePost, {
    status: "idle" as const,
  });

  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [content, setContent] = useState("");

  const checks = useMemo(
    () => getSeoChecks({ title, seoTitle, seoDescription, content }),
    [title, seoTitle, seoDescription, content]
  );

  const liveScore = useMemo(
    () => scoreSeo({ title, seoTitle, seoDescription, content }),
    [title, seoTitle, seoDescription, content]
  );

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setSeoTitle("");
    setSeoDescription("");
    setContent("");
    setFormOpen(true);
  };

  const openEdit = (post: AdminPost) => {
    setEditing(post);
    setTitle(post.title);
    setSeoTitle(post.seo_title ?? "");
    setSeoDescription(post.seo_description ?? "");
    setContent(post.content);
    setFormOpen(true);
  };

  const close = () => {
    setFormOpen(false);
    setEditing(null);
    router.refresh();
  };

  const errorMessage =
    state.status === "error"
      ? state.message === "invalid_slug"
        ? copy.errorSlug
        : state.message === "missing_fields"
          ? copy.errorMissing
          : copy.errorSave
      : null;

  const isPublished = editing?.status === "published";

  const checkCopy = (id: "title" | "description" | "headings", ok: boolean, length: number) => {
    if (id === "title") {
      return {
        label: copy.seoTitleLength,
        detail: `${ok ? copy.seoTitleOk : length < 30 ? copy.seoTitleShort : copy.seoTitleLong} (${length})`,
      };
    }

    if (id === "description") {
      return {
        label: copy.seoDescLength,
        detail: `${ok ? copy.seoDescOk : length < 70 ? copy.seoDescShort : copy.seoDescLong} (${length})`,
      };
    }

    return {
      label: copy.seoHeadings,
      detail: ok ? copy.seoHeadingsOk : copy.seoHeadingsMissing,
    };
  };

  return (
    <>
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="tp-admin-btn"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {copy.add}
        </button>
      </div>

      {formOpen ? (
        <section className="mb-8 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-[20px] font-bold tracking-[-0.02em]">
              {copy.editorTitle}
            </h2>
            <button
              type="button"
              onClick={close}
              className="tp-admin-icon"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{copy.cancel}</span>
            </button>
          </div>

          <form
            key={editing?.id ?? "new"}
            action={formAction}
            className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"
          >
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="post-title"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.title}
                </label>
                <input
                  id="post-title"
                  name="title"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={fieldClass()}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="post-slug"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.slug}
                </label>
                <input
                  id="post-slug"
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  defaultValue={editing?.slug ?? ""}
                  className={fieldClass()}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="post-content"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.contentLabel}
                </label>
                <textarea
                  id="post-content"
                  name="content"
                  required
                  rows={16}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={copy.contentPlaceholder}
                  className="flex min-h-[320px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-[1.6] text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="post-seo-title"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.seoTitle}
                </label>
                <input
                  id="post-seo-title"
                  name="seoTitle"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  className={fieldClass()}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="post-seo-description"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.seoDescription}
                </label>
                <textarea
                  id="post-seo-description"
                  name="seoDescription"
                  rows={3}
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  className="flex min-h-[90px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-[1.6] text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
                />
              </div>

              {errorMessage ? (
                <p role="alert" className="text-sm text-[var(--danger)]">
                  {errorMessage}
                </p>
              ) : null}
              {state.status === "success" ? (
                <p role="status" className="text-sm text-[var(--success)]">
                  {copy.saved}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <SubmitButton
                  label={copy.save}
                  pendingLabel={copy.saving}
                  name="status"
                  value={editing?.status ?? "draft"}
                />
                <SubmitButton
                  label={isPublished ? copy.unpublish : copy.publish}
                  pendingLabel={copy.saving}
                  name="status"
                  value={isPublished ? "draft" : "published"}
                />
                <button
                  type="button"
                  onClick={close}
                  className="tp-admin-btn-secondary"
                >
                  {copy.cancel}
                </button>
              </div>
            </div>

            {/* SEO checklist sidebar */}
            <aside className="h-fit rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h3 className="font-display text-[18px] font-bold tracking-[-0.02em]">
                  {copy.seoChecklist}
                </h3>
                <span className="font-sans text-[24px] font-bold tabular-nums">
                  {liveScore}
                  <span className="text-sm text-[var(--muted)]">/100</span>
                </span>
              </div>

              <ul className="flex flex-col gap-3">
                {checks.map((check) => {
                  const text = checkCopy(check.id, check.ok, check.length);

                  return (
                    <li key={check.id} className="flex gap-2.5">
                      {check.ok ? (
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]"
                          aria-hidden="true"
                        />
                      ) : (
                        <CircleDashed
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--text)]">
                          {text.label}
                        </span>
                        <span className="block text-xs leading-[1.5] text-[var(--muted)]">
                          {text.detail}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </form>
        </section>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState message={copy.empty} />
      ) : (
        <DataTable
          headers={[
            copy.listTitle,
            copy.status,
            copy.seoScore,
            copy.views,
            copy.actions,
          ]}
        >
          {posts.map((post) => (
            <tr key={post.id} data-ui className="border-b border-[var(--border)] last:border-0">
              <td className="px-3 py-3 first:pl-0 last:pr-0">
                <p className="font-medium">{post.title}</p>
                <p className="text-xs text-[var(--muted)]">{post.slug}</p>
              </td>
              <td className="px-3 py-3">
                <StatusPill status={post.status} />
              </td>
              <td className="px-3 py-3 tabular-nums">
                {post.seo_score ?? 0}
              </td>
              <td className="px-3 py-3 tabular-nums">{post.views}</td>
              <td className="px-3 py-3 last:pr-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="tp-admin-icon"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{copy.editorTitle}</span>
                  </button>
                  <form
                    action={async () => {
                      if (window.confirm(copy.deleteConfirm)) {
                        await deletePost(post.id);
                        router.refresh();
                      }
                    }}
                  >
                    <button
                      type="submit"
                      className="tp-admin-icon"
                      data-danger="true"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{copy.delete}</span>
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
