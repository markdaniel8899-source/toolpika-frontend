"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRequestStatus } from "@/app/admin/actions";
import type { AdminRequest, InboxStatus } from "@/lib/admin/row-types";
import { DataTable, EmptyState } from "@/components/admin/ui";

export interface RequestsCopy {
  toolName: string;
  userEmail: string;
  date: string;
  status: string;
  typeLabel: string;
  typeToolRequest: string;
  typeContact: string;
  filterAll: string;
  filterToolRequests: string;
  filterContact: string;
  statusNew: string;
  statusInProgress: string;
  statusResolved: string;
  statusRejected: string;
  empty: string;
  statusNote: string;
}

type Filter = "all" | "tool_request" | "contact";

const STATUS_OPTIONS: InboxStatus[] = [
  "new",
  "in_progress",
  "resolved",
  "rejected",
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TypeBadge({
  type,
  copy,
}: {
  type: AdminRequest["type"];
  copy: RequestsCopy;
}) {
  const isRequest = type === "tool_request";
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]"
      style={{
        borderColor: isRequest ? "var(--accent)" : "var(--info)",
        color: isRequest ? "var(--accent)" : "var(--info)",
        background: isRequest ? "var(--accent-soft)" : "var(--surface-2)",
      }}
    >
      {isRequest ? copy.typeToolRequest : copy.typeContact}
    </span>
  );
}

export function RequestsInbox({
  requests,
  copy,
}: {
  requests: AdminRequest[];
  copy: RequestsCopy;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, startTransition] = useTransition();

  const visible =
    filter === "all"
      ? requests
      : requests.filter((request) => request.type === filter);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: copy.filterAll },
    { value: "tool_request", label: copy.filterToolRequests },
    { value: "contact", label: copy.filterContact },
  ];

  const setStatus = (id: string, status: InboxStatus) => {
    startTransition(async () => {
      await updateRequestStatus(id, status);
      router.refresh();
    });
  };

  return (
    <>
      <p className="mb-4 text-sm leading-[1.6] text-[var(--muted)]">
        {copy.statusNote}
      </p>

      <div
        role="tablist"
        aria-label={copy.typeLabel}
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}
      >
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={filter === item.value ? "tp-tab is-active" : "tp-tab"}
            data-active={filter === item.value ? "true" : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState message={copy.empty} />
      ) : (
        <DataTable
          headers={[
            copy.typeLabel,
            copy.toolName,
            copy.userEmail,
            copy.date,
            copy.status,
          ]}
        >
          {visible.map((request) => (
            <tr
              key={request.id}
              className="border-b border-[var(--border)] align-top last:border-0"
            >
              <td className="px-3 py-3 first:pl-0">
                <TypeBadge type={request.type} copy={copy} />
              </td>
              <td className="px-3 py-3">
                <p className="font-medium">
                  {request.tool_name ?? request.name ?? "Message"}
                </p>
                <p className="mt-1 max-w-md text-xs leading-[1.6] text-[var(--muted)]">
                  {request.description}
                </p>
              </td>
              <td className="px-3 py-3 text-[var(--muted)]">
                {request.email ?? ""}
              </td>
              <td className="px-3 py-3 text-[var(--muted)]">
                <time dateTime={request.created_at}>
                  {formatDate(request.created_at)}
                </time>
              </td>
              <td className="px-3 py-3 last:pr-0">
                <select
                  aria-label={copy.status}
                  value={request.status}
                  disabled={pending}
                  onChange={(event) =>
                    setStatus(request.id, event.target.value as InboxStatus)
                  }
                  className="tp-field-input"
                  style={{ width: "auto", minWidth: 140, height: 36, fontSize: 12.5 }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "new"
                        ? copy.statusNew
                        : option === "in_progress"
                          ? copy.statusInProgress
                          : option === "resolved"
                            ? copy.statusResolved
                            : copy.statusRejected}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
