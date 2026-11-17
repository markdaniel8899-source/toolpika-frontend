"use client";

import { useTransition } from "react";
import { CheckCircle2, Hammer, RotateCcw } from "lucide-react";
import { updateRequestStatus } from "@/app/admin/actions";
import type { AdminRequest } from "@/lib/admin/row-types";
import { DataTable, EmptyState, StatusPill } from "@/components/admin/ui";

export interface RequestsCopy {
  toolName: string;
  userEmail: string;
  date: string;
  status: string;
  empty: string;
  markBuilding: string;
  markLaunched: string;
  reopen: string;
  launchedNote: string;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RequestsInbox({
  requests,
  copy,
}: {
  requests: AdminRequest[];
  copy: RequestsCopy;
}) {
  const [pending, startTransition] = useTransition();

  const setStatus = (id: string, status: "new" | "building" | "launched") => {
    startTransition(async () => {
      await updateRequestStatus(id, status);
    });
  };

  if (requests.length === 0) {
    return <EmptyState message={copy.empty} />;
  }

  return (
    <>
      <p className="mb-6 text-sm leading-[1.6] text-[var(--muted)]">
        {copy.launchedNote}
      </p>

      <DataTable
        headers={[
          copy.toolName,
          copy.userEmail,
          copy.date,
          copy.status,
          "",
        ]}
      >
        {requests.map((request) => (
          <tr
            key={request.id}
            className="border-b border-[var(--border)] align-top last:border-0"
          >
            <td className="px-3 py-3 first:pl-0 last:pr-0">
              <p className="font-medium">{request.tool_name}</p>
              <p className="mt-1 max-w-md text-xs leading-[1.6] text-[var(--muted)]">
                {request.description}
              </p>
            </td>
            <td className="px-3 py-3 text-[var(--muted)]">
              {request.email ?? "—"}
            </td>
            <td className="px-3 py-3 text-[var(--muted)]">
              <time dateTime={request.created_at}>
                {formatDate(request.created_at)}
              </time>
            </td>
            <td className="px-3 py-3">
              <StatusPill status={request.status} />
            </td>
            <td className="px-3 py-3 last:pr-0">
              <div className="flex flex-wrap items-center gap-2">
                {request.status === "new" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(request.id, "building")}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition-colors duration-200 hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:opacity-60"
                  >
                    <Hammer className="h-3.5 w-3.5" aria-hidden="true" />
                    {copy.markBuilding}
                  </button>
                ) : null}

                {request.status !== "launched" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(request.id, "launched")}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition-colors duration-200 hover:border-[var(--success)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {copy.markLaunched}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setStatus(request.id, "new")}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--muted)] transition-colors duration-200 hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    {copy.reopen}
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  );
}
