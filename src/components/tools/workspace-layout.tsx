"use client";

import { useTranslations } from "next-intl";

/**
 * Two-pane workspace used by every tool (layout.md §3: input 60%, result 40%).
 * The panes stack on mobile so the input stays reachable one-handed.
 */
export function WorkspaceLayout({
  input,
  output,
}: {
  input: React.ReactNode;
  output: React.ReactNode;
}) {
  const t = useTranslations("tools");

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <section className="flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 lg:w-[60%]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
          {t("input")}
        </h2>
        {input}
      </section>

      <section className="flex-1 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-6 lg:w-[40%]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
          {t("result")}
        </h2>
        {output}
      </section>
    </div>
  );
}
