"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveSettings } from "@/app/admin/actions";

export interface SettingsCopy {
  siteTitle: string;
  siteNameLabel: string;
  siteUrlLabel: string;
  siteUrlHint: string;
  socialTitle: string;
  socialHint: string;
  socialGithub: string;
  socialX: string;
  socialLinkedIn: string;
  themeTitle: string;
  themeHint: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  save: string;
  saving: string;
  errorSave: string;
  saved: string;
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
      className="inline-flex items-center justify-center rounded-[10px] bg-[var(--accent-fill)] px-5 py-2.5 text-sm font-bold text-[var(--on-accent)] transition-all duration-200 hover:bg-[var(--accent-fill-hover)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-3 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function fieldClass() {
  return "flex h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 md:text-sm";
}

export function SettingsForm({
  values,
  copy,
}: {
  values: {
    siteName: string;
    siteUrl: string;
    socialGithub: string;
    socialX: string;
    socialLinkedIn: string;
    themeDefault: string;
  };
  copy: SettingsCopy;
}) {
  const [state, formAction] = useActionState(saveSettings, {
    status: "idle" as const,
  });
  const [themeDefault, setThemeDefault] = useState(values.themeDefault);

  function applyThemeDefault(value: string) {
    setThemeDefault(value);
    if (value === "system") {
      try {
        localStorage.removeItem("theme");
      } catch {
        // Storage may be blocked.
      }
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", systemDark ? "dark" : "light");
      return;
    }
    document.documentElement.setAttribute("data-theme", value);
    try {
      localStorage.setItem("theme", value);
    } catch {
      // Storage may be blocked; the attribute still updates.
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-display text-[20px] font-bold tracking-[-0.02em]">
          {copy.siteTitle}
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="settings-site-name"
              className="text-sm font-medium text-[var(--text)]"
            >
              {copy.siteNameLabel}
            </label>
            <input
              id="settings-site-name"
              name="siteName"
              defaultValue={values.siteName}
              className={fieldClass()}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="settings-site-url"
              className="text-sm font-medium text-[var(--text)]"
            >
              {copy.siteUrlLabel}
            </label>
            <input
              id="settings-site-url"
              name="siteUrl"
              type="url"
              defaultValue={values.siteUrl}
              className={fieldClass()}
            />
            <p className="text-xs text-[var(--muted)]">{copy.siteUrlHint}</p>
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-display text-[20px] font-bold tracking-[-0.02em]">
          {copy.socialTitle}
        </legend>
        <p className="text-sm text-[var(--muted)]">{copy.socialHint}</p>

        <div className="grid gap-5 sm:grid-cols-3">
          {(
            [
              ["socialGithub", copy.socialGithub, values.socialGithub],
              ["socialX", copy.socialX, values.socialX],
              ["socialLinkedIn", copy.socialLinkedIn, values.socialLinkedIn],
            ] as const
          ).map(([name, label, value]) => (
            <div key={name} className="flex flex-col gap-2">
              <label
                htmlFor={`settings-${name}`}
                className="text-sm font-medium text-[var(--text)]"
              >
                {label}
              </label>
              <input
                id={`settings-${name}`}
                name={name}
                type="url"
                defaultValue={value}
                className={fieldClass()}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-5">
        <legend className="mb-1 font-display text-[20px] font-bold tracking-[-0.02em]">
          {copy.themeTitle}
        </legend>
        <p className="text-sm text-[var(--muted)]">{copy.themeHint}</p>

        <div className="flex flex-col gap-2">
          {(
            [
              ["system", copy.themeSystem],
              ["light", copy.themeLight],
              ["dark", copy.themeDark],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-3 rounded-[10px] border border-[var(--border)] px-4 py-3 text-sm"
            >
              <input
                type="radio"
                name="themeDefault"
                value={value}
                checked={themeDefault === value}
                onChange={() => applyThemeDefault(value)}
                className="h-4 w-4 accent-[var(--accent-fill)]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {copy.errorSave}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p role="status" className="text-sm text-[var(--success)]">
          {copy.saved}
        </p>
      ) : null}

      <SubmitButton label={copy.save} pendingLabel={copy.saving} />
    </form>
  );
}
