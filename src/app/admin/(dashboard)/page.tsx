import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminMessages } from "@/lib/admin/messages";
import {
  getOverviewStats,
  getRecentActivity,
  getTopTools,
} from "@/lib/admin/data";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/admin/ui";
import { BarChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

const ACTIVITY_DOT: Record<string, string> = {
  request: "bg-[var(--accent)]",
  post: "bg-[var(--success)]",
  tool: "bg-[var(--muted-2)]",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOverviewPage() {
  const [stats, activity, topTools] = await Promise.all([
    getOverviewStats(),
    getRecentActivity(),
    getTopTools(5),
  ]);

  const t = adminMessages.overview;

  const quickLinks = [
    { href: "/admin/requests", label: t.quickReview },
    { href: "/admin/tools", label: t.quickNewTool },
    { href: "/admin/blog", label: t.quickNewPost },
  ];

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.stats.tools} value={stats.totalTools} />
        <StatCard label={t.stats.requests} value={stats.pendingRequests} />
        <StatCard label={t.stats.posts} value={stats.totalPosts} />
        <StatCard label={t.stats.views} value={stats.viewsToday} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_1fr]">
        <SectionCard title={t.activityTitle}>
          {activity.length === 0 ? (
            <EmptyState message={t.activityEmpty} />
          ) : (
            <ol className="flex flex-col">
              {activity.map((item) => {
                const label =
                  item.kind === "request"
                    ? t.activityRequest
                    : item.kind === "post"
                      ? t.activityPost
                      : t.activityTool;
                const dot = ACTIVITY_DOT[item.kind] ?? ACTIVITY_DOT.tool;

                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 border-b border-[var(--border)] py-3 last:border-b-0 first:pt-0 last:pb-0"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium leading-snug">
                        {item.label}
                      </p>
                      <p className="mt-1 truncate text-[11px] leading-[1.5] text-[var(--muted)]">
                        {label}
                        {item.detail ? ` · ${item.detail}` : ""}
                      </p>
                    </div>
                    <time
                      dateTime={item.at}
                      className="shrink-0 whitespace-nowrap text-[11px] tabular-nums text-[var(--muted)]"
                    >
                      {formatDate(item.at)}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </SectionCard>

        <div className="flex flex-col gap-5">
          <SectionCard title={t.topToolsTitle}>
            <BarChart
              data={topTools.map((tool) => ({
                label: tool.title,
                value: tool.usage_count,
              }))}
              emptyLabel={t.topToolsEmpty}
            />
          </SectionCard>

          <SectionCard title={t.quickLinks}>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between rounded-[10px] border border-[var(--border)] px-4 py-3 text-[13px] font-medium transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--accent-wash)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
                  >
                    {item.label}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
