"use client";

import { useTranslations } from "next-intl";

/**
 * Two-pane workspace used by every tool (input 60%, result 40%).
 * The panes stack on mobile so the input stays reachable one-handed.
 * Widths come from CSS (.tp-workspace) so every field can fill its pane.
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
    <div className="tp-workspace">
      <section className="tp-workspace-pane tp-workspace-input">
        <div className="tp-pane-head">
          <h2>{t("input")}</h2>
        </div>
        {input}
      </section>

      <section className="tp-workspace-pane tp-workspace-output">
        <div className="tp-pane-head">
          <h2>{t("result")}</h2>
        </div>
        {output}
      </section>
    </div>
  );
}
