import { adminMessages } from "@/lib/admin/messages";
import { getSiteUrl } from "@/lib/site-url";
import { PageHeader, SectionCard, StatusPill } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const t = adminMessages.settings;

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const envGroq = process.env.GROQ_API_KEY ?? "";

  const keyRows = [
    { label: t.keySupabaseUrl, set: Boolean(envUrl) },
    { label: t.keySupabaseAnon, set: Boolean(envAnon) },
    { label: t.keyGroq, set: Boolean(envGroq) },
  ];

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard>
          <SettingsForm
            values={{
              siteName: "Toolpika",
              siteUrl: getSiteUrl(),
              socialGithub: "",
              socialX: "",
              socialLinkedIn: "",
              themeDefault: "system",
            }}
            copy={{
              ...t,
              save: adminMessages.common.save,
              saving: adminMessages.common.saving,
              errorSave: adminMessages.common.error,
              saved: adminMessages.common.saved,
            }}
          />
        </SectionCard>

        <SectionCard title={t.keysTitle} description={t.keysHint}>
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {keyRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-sm text-[var(--muted)]">{row.label}</span>
                <StatusPill status={row.set ? "live" : "draft"} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
