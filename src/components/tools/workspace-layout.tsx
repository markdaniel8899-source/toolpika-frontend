"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "./tool-icon";

/**
 * Two-pane workspace used by every tool. Visual language matches the bespoke
 * Word Counter workspace: quiet header, compact pane labels, clear divider.
 */
export function WorkspaceLayout({
  title,
  icon,
  onReset,
  onSample,
  statusRight,
  input,
  output,
}: {
  title: string;
  icon?: string;
  onReset: () => void;
  onSample?: () => void;
  statusRight?: string;
  input: React.ReactNode;
  output: React.ReactNode;
}) {
  const t = useTranslations("tools");

  return (
    <div className="tp-workspace">
      <div className="tp-workspace-bar">
        <div className="tp-workspace-identity">
          {icon ? (
            <span className="tp-workspace-mark" aria-hidden="true">
              <ToolIcon name={icon} className="tp-icon" />
            </span>
          ) : null}
          <span className="tp-workspace-name">{title}</span>
        </div>
        <div className="tp-workspace-bar-actions">
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
