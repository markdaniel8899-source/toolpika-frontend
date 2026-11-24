"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Two-pane workspace used by every tool (input 60%, result 40%).
 * The panes stack on mobile so the input stays reachable one-handed.
 * Widths come from CSS (.tp-workspace) so every field can fill its pane.
 */
export function WorkspaceLayout({
  title,
  onReset,
  onSample,
  status,
  statusRight,
  input,
  output,
}: {
  title: string;
  onReset: () => void;
  onSample?: () => void;
  status?: string;
  statusRight?: string;
  input: React.ReactNode;
  output: React.ReactNode;
}) {
  const t = useTranslations("tools");

  return (
    <div className="tp-workspace">
      <div className="tp-workspace-bar">
        <span className="tp-workspace-name">{title}</span>
        <div className="tp-workspace-bar-actions">
          {status ? (
            <span className="tp-status-pill" role="status" aria-live="polite">
              {status}
            </span>
          ) : null}
          {onSample ? (
            <Button type="button" size="sm" onClick={onSample}>
              {t("trySample")}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {t("reset")}
          </Button>
        </div>
      </div>

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

      <div className="tp-workspace-ribbon">
        <span className="tp-workspace-ribbon-note">
          <ShieldCheck className="h-[13px] w-[13px]" aria-hidden="true" />
          {t("privacyRibbon")}
        </span>
        {statusRight ? (
          <span className="tp-workspace-ribbon-status">{statusRight}</span>
        ) : null}
      </div>
    </div>
  );
}
