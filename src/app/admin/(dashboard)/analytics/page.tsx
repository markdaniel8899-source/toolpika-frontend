import { adminMessages } from "@/lib/admin/messages";
import { getPostViews, getPosts } from "@/lib/admin/data";
import { PageHeader, SectionCard, StatCard } from "@/components/admin/ui";
import { LineChart, PieChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [posts, dailyViews] = await Promise.all([
    getPosts(),
    getPostViews(),
  ]);
  const t = adminMessages.analytics;

  // Views per day, summed across posts. Only real rows count.
  const viewsByDay = new Map<string, number>();

  for (const row of dailyViews) {
    viewsByDay.set(row.day, (viewsByDay.get(row.day) ?? 0) + row.views);
  }

  const series = [...viewsByDay.entries()]
    .map(([day, value]) => ({ label: day, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const totalViews = posts.reduce((total, post) => total + post.views, 0);

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.totalViews} value={totalViews} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title={t.viewsOverTime}>
          <LineChart data={series} emptyLabel={t.viewsOverTimeEmpty} />
        </SectionCard>

        <SectionCard title={t.trafficTitle}>
          <PieChart data={[]} emptyLabel={t.trafficEmpty} />
          <p className="mt-4 text-sm leading-[1.6] text-[var(--muted)]">
            {t.privacyNote}
          </p>
        </SectionCard>
      </div>
    </>
  );
}
