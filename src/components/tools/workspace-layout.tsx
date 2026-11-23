"use client";

import { useTranslations } from "next-intl";

/**
 * Two-pane workspace used by every tool (input 60%, result 40%).
 * The panes stack on mobile so the input stays reachable one-handed.
 * Widths come from CSS (.tp-workspace) so every field can fill its pane.
 *
 * Tools that need a richer tool box can pass `header`, `options` and `status`.
 * The original two-pane DOM is kept for every other tool, so nothing changes
 * for them.
 */
export function WorkspaceLayout({
  input,
  output,
  header,
  options,
  status,
}: {
  input: React.ReactNode;
  output: React.ReactNode;
  header?: React.ReactNode;
  options?: React.ReactNode;
  status?: React.ReactNode;
}) {
  const t = useTranslations("tools");

  const panes = (
    <>
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
    </>
  );

  if (!header && !options && !status) {
    return <div className="tp-workspace">{panes}</div>;
  }

  return (
    <div className="tp-workspace tp-workspace-enhanced">
      {header ? <div className="tp-workspace-head">{header}</div> : null}
      <div className="tp-workspace-body">{panes}</div>
      {options ? <div className="tp-workspace-options">{options}</div> : null}
      {status ? <div className="tp-workspace-status">{status}</div> : null}
    </div>
  );
}
