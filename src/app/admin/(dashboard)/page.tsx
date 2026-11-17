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

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.stats.tools} value={stats.totalTools} />
        <StatCard label={t.stats.requests} value={stats.pendingRequests} />
        <StatCard label={t.stats.posts} value={stats.totalPosts} />
        <StatCard label={t.stats.views} value={stats.viewsToday} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard title={t.activityTitle}>
          {activity.length === 0 ? (
            <EmptyState message={t.activityEmpty} />
          ) : (
            <ol className="flex flex-col divide-y divide-[var(--border)]">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {item.kind === "request"
                        ? t.activityRequest
                        : item.kind === "post"
                          ? t.activityPost
                          : t.activityTool}
                      {item.detail ? ` — ${item.detail}` : ""}
                    </p>
                  </div>
                  <time
                    dateTime={item.at}
                    className="shrink-0 text-xs text-[var(--muted)]"
                  >
                    {formatDate(item.at)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        <div className="flex flex-col gap-6">
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
              {[
                { href: "/admin/requests", label: t.quickReview },
                { href: "/admin/tools", label: t.quickNewTool },
                { href: "/admin/blog", label: t.quickNewPost },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-[10px] border border-[var(--border)] px-4 py-3 text-sm font-medium transition-colors duration-200 hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3"
                  >
                    {item.label}
                    <ArrowRight className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
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
