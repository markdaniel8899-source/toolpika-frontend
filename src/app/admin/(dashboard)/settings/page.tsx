import { adminMessages } from "@/lib/admin/messages";
import { getSettings } from "@/lib/admin/data";
import { PageHeader, SectionCard, StatusPill } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const t = adminMessages.settings;

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const envService = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const envGroq = process.env.GROQ_API_KEY ?? "";

  const keyRows = [
    { label: t.keySupabaseUrl, set: Boolean(envUrl) },
    { label: t.keySupabaseAnon, set: Boolean(envAnon) },
    { label: t.keyServiceRole, set: Boolean(envService) },
    { label: t.keyGroq, set: Boolean(envGroq) },
  ];

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard>
          <SettingsForm
            values={{
              siteName: settings.site_name ?? "Toolpika",
              siteUrl:
                settings.site_url ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://toolpika.site",
              socialGithub: settings.social_github ?? "",
              socialX: settings.social_x ?? "",
              socialLinkedIn: settings.social_linkedin ?? "",
              themeDefault: settings.theme_default ?? "system",
            }}
            copy={{
              siteTitle: t.siteTitle,
              siteNameLabel: t.siteNameLabel,
              siteUrlLabel: t.siteUrlLabel,
              siteUrlHint: t.siteUrlHint,
              socialTitle: t.socialTitle,
              socialHint: t.socialHint,
              socialGithub: t.socialGithub,
              socialX: t.socialX,
              socialLinkedIn: t.socialLinkedIn,
              themeTitle: t.themeTitle,
              themeHint: t.themeHint,
              themeLight: t.themeLight,
              themeDark: t.themeDark,
              themeSystem: t.themeSystem,
              save: adminMessages.common.save,
              saving: adminMessages.common.saving,
              errorSave: adminMessages.common.error,
              saved: adminMessages.common.saved,
            }}
          />
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title={t.keysTitle} description={t.keysHint}>
            <ul className="flex flex-col divide-y divide-[var(--border)]">
              {keyRows.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-[var(--muted)]">{row.label}</span>
                  <StatusPill status={row.set ? "launched" : "draft"} />
                  <span className="sr-only">
                    {row.set ? t.configured : t.missing}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
