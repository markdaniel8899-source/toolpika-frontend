import { adminMessages } from "@/lib/admin/messages";
import { getSiteUrl } from "@/lib/site-url";
import { getSettings } from "@/lib/admin/data";
import { PageHeader, SectionCard, StatusPill } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const t = adminMessages.settings;

  const [settings, envUrl, envAnon] = await Promise.all([
    getSettings(),
    Promise.resolve(process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""),
    Promise.resolve(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""),
  ]);

  const keyRows = [
    { label: t.keySupabaseUrl, set: Boolean(envUrl) },
    { label: t.keySupabaseAnon, set: Boolean(envAnon) },
  ];

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard>
          <SettingsForm
            values={{
              siteName: settings.siteName || "Toolpika",
              siteUrl: settings.siteUrl || getSiteUrl(),
              socialGithub: settings.socialGithub ?? "",
              socialX: settings.socialX ?? "",
              socialLinkedIn: settings.socialLinkedIn ?? "",
              themeDefault: settings.themeDefault || "system",
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
          <div className="flex flex-col gap-1">
            {keyRows.map((row) => (
              <div
                key={row.label}
                className="tp-admin-status-row flex items-center justify-between gap-4 rounded-[10px] px-3 py-2.5"
              >
                <span className="text-[13px] text-[var(--muted)]">{row.label}</span>
                <StatusPill status={row.set ? "live" : "draft"} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
