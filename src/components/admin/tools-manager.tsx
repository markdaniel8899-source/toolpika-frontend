"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteTool, saveTool } from "@/app/admin/actions";
import type { AdminTool } from "@/lib/admin/row-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, EmptyState, StatusPill } from "@/components/admin/ui";

export interface ToolFormCopy {
  add: string;
  editTitle: string;
  formTitle: string;
  nameLabel: string;
  slugLabel: string;
  categoryLabel: string;
  iconLabel: string;
  iconHint: string;
  descriptionLabel: string;
  seoTitle: string;
  seoDescription: string;
  statusLabel: string;
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

export interface ToolManagerCopy extends ToolFormCopy {
  title: string;
  category: string;
  allCategories: string;
  status: string;
  usage: string;
  actions: string;
  empty: string;
  statusLive: string;
  statusDraft: string;
  statusHidden: string;
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
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

export function ToolsManager({
  tools,
  categories,
  copy,
}: {
  tools: AdminTool[];
  categories: { slug: string; label: string }[];
  copy: ToolManagerCopy;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminTool | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const visibleTools = categoryFilter
    ? tools.filter((tool) => tool.category === categoryFilter)
    : tools;
  const [state, formAction] = useActionState(saveTool, {
    status: "idle" as const,
  });

  const close = () => {
    setFormOpen(false);
    setEditing(null);
    router.refresh();
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (tool: AdminTool) => {
    setEditing(tool);
    setFormOpen(true);
  };

  const errorMessage =
    state.status === "error"
      ? state.message === "invalid_slug"
        ? copy.errorSlug
        : state.message === "missing_fields"
          ? copy.errorMissing
          : copy.errorSave
      : null;

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
              {editing ? copy.editTitle : copy.formTitle}
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
            className="flex flex-col gap-5"
          >
            {editing ? (
              <input type="hidden" name="id" value={editing.id} />
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-title"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.nameLabel}
                </label>
                <input
                  id="tool-title"
                  name="title"
                  required
                  defaultValue={editing?.title ?? ""}
                  className={fieldClass()}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-slug"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.slugLabel}
                </label>
                <input
                  id="tool-slug"
                  name="slug"
                  required
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  defaultValue={editing?.slug ?? ""}
                  className={fieldClass()}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-category"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.categoryLabel}
                </label>
                <Select name="category" defaultValue={editing?.category ?? ""}>
                  <SelectTrigger
                    id="tool-category"
                    className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  >
                    <SelectValue placeholder={copy.categoryLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-status"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.statusLabel}
                </label>
                <Select name="status" defaultValue={editing?.status ?? "draft"}>
                  <SelectTrigger
                    id="tool-status"
                    className="h-11 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">{copy.statusLive}</SelectItem>
                    <SelectItem value="draft">{copy.statusDraft}</SelectItem>
                    <SelectItem value="hidden">{copy.statusHidden}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-icon"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.iconLabel}
                </label>
                <input
                  id="tool-icon"
                  name="icon"
                  defaultValue={editing?.icon ?? ""}
                  placeholder="FileText"
                  className={fieldClass()}
                />
                <p className="text-xs text-[var(--muted)]">{copy.iconHint}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="tool-description"
                className="text-sm font-medium text-[var(--text)]"
              >
                {copy.descriptionLabel}
              </label>
              <textarea
                id="tool-description"
                name="description"
                required
                rows={3}
                defaultValue={editing?.description ?? ""}
                className="flex min-h-[100px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-[1.6] text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-seo-title"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.seoTitle}
                </label>
                <input
                  id="tool-seo-title"
                  name="seoTitle"
                  defaultValue={editing?.seo_title ?? ""}
                  className={fieldClass()}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-seo-description"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {copy.seoDescription}
                </label>
                <textarea
                  id="tool-seo-description"
                  name="seoDescription"
                  rows={2}
                  defaultValue={editing?.seo_description ?? ""}
                  className="flex min-h-[80px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-[1.6] text-[var(--text)] transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm"
                />
              </div>
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

            <div className="flex gap-3">
              <SubmitButton label={copy.save} pendingLabel={copy.saving} />
              <button
                type="button"
                onClick={close}
                className="tp-admin-btn-secondary"
              >
                {copy.cancel}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="tool-category-filter" className="text-sm text-[var(--muted)]">
          {copy.category}
        </label>
        <select
          id="tool-category-filter"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-10 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
        >
          <option value="">{copy.allCategories}</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {visibleTools.length === 0 ? (
        <EmptyState message={copy.empty} />
      ) : (
        <DataTable
          headers={[
            copy.title,
            copy.category,
            copy.status,
            copy.usage,
            copy.actions,
          ]}
        >
          {visibleTools.map((tool) => (
            <tr key={tool.id} data-ui className="border-b border-[var(--border)] last:border-0">
              <td className="px-3 py-3 first:pl-0 last:pr-0">
                <p className="font-medium">{tool.title}</p>
                <p className="text-xs text-[var(--muted)]">{tool.slug}</p>
              </td>
              <td className="px-3 py-3 text-[var(--muted)]">{tool.category}</td>
              <td className="px-3 py-3">
                <StatusPill status={tool.status} />
              </td>
              <td className="px-3 py-3 tabular-nums">{tool.usage_count}</td>
              <td className="px-3 py-3 last:pr-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(tool)}
                    className="tp-admin-icon"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{copy.editTitle}</span>
                  </button>
                  <form
                    action={async () => {
                      if (window.confirm(copy.deleteConfirm)) {
                        await deleteTool(tool.id);
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
