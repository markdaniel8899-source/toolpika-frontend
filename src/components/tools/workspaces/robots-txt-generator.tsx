"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, FileText, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  buildRobotsTxt,
  DEFAULT_ROBOTS_GROUPS,
  DEFAULT_ROBOTS_OPTIONS,
  makeGroup,
  nextGroupId,
  SAMPLE_ROBOTS_GROUPS,
  SAMPLE_ROBOTS_OPTIONS,
  validateRobots,
  type RobotsGroup,
  type RobotsOptions,
} from "./robots-txt-generator.logic";

const ERROR_ID = "tp-robots-error";

export default function RobotsTxtGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const { options, update, reset: resetOptions } =
    usePersistedOptions<RobotsOptions>(
      "toolpika:robots-txt-generator",
      DEFAULT_ROBOTS_OPTIONS,
    );
  const [groups, setGroups] = useState<RobotsGroup[]>(() =>
    DEFAULT_ROBOTS_GROUPS.map((group) => ({ ...group })),
  );

  const hasContent = groups.some(
    (group) => group.userAgent.trim() || group.allow.trim() || group.disallow.trim(),
  ) || Boolean(options.crawlDelay.trim() || options.sitemap.trim());

  const issue = useMemo(
    () => (hasContent ? validateRobots(groups, options) : null),
    [groups, options, hasContent],
  );

  const message = useMemo(() => {
    if (!issue) return "";
    const pair = {
      EMPTY: ["errorEmpty", "fixEmpty"],
      AGENT: ["errorAgent", "fixAgent"],
      PATH: ["errorPath", "fixPath"],
      DELAY: ["errorDelay", "fixDelay"],
      SITEMAP: ["errorSitemap", "fixSitemap"],
    }[issue.code] as [string, string];
    return `${tw(`robots-txt-generator.${pair[0]}`)} ${tw(`robots-txt-generator.${pair[1]}`)}`;
  }, [issue, tw]);

  const output = useMemo(
    () => (issue || !hasContent ? "" : buildRobotsTxt(groups, options)),
    [groups, options, issue, hasContent],
  );

  const directiveCount = useMemo(() => {
    let count = 0;
    for (const group of groups) {
      if (group.userAgent.trim()) count += 1;
      count += group.allow.split("\n").filter((line) => line.trim()).length;
      count += group.disallow.split("\n").filter((line) => line.trim()).length;
    }
    if (options.crawlDelay.trim()) count += 1;
    if (options.sitemap.trim()) count += 1;
    return count;
  }, [groups, options]);

  const updateGroup = useCallback((id: number, patch: Partial<RobotsGroup>) => {
    setGroups((previous) =>
      previous.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    );
  }, []);

  const addGroup = useCallback(() => {
    setGroups((previous) => [...previous, makeGroup(nextGroupId(previous))]);
  }, []);

  const removeGroup = useCallback((id: number) => {
    setGroups((previous) =>
      previous.length <= 1 ? previous : previous.filter((group) => group.id !== id),
    );
  }, []);

  const handleSample = useCallback(() => {
    setGroups(SAMPLE_ROBOTS_GROUPS.map((group) => ({ ...group })));
    update(SAMPLE_ROBOTS_OPTIONS);
  }, [update]);

  const handleReset = useCallback(() => {
    setGroups(DEFAULT_ROBOTS_GROUPS.map((group) => ({ ...group })));
    resetOptions();
  }, [resetOptions]);

  const describedBy = message ? ERROR_ID : undefined;

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="FileText" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("robots-txt-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("robots-txt-generator.subtitle")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("robots-txt-generator.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("robots-txt-generator.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="tp-robots-rules-title"
          title={tw("robots-txt-generator.rulesTitle")}
          hint={tw("robots-txt-generator.rulesHint")}
          actions={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addGroup}
              aria-describedby={describedBy}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("robots-txt-generator.addGroup")}
            </Button>
          }
        >
          {message ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {message}
            </p>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            {groups.map((group, index) => {
              const number = index + 1;
              return (
                <div className="tp-tool-group tp-tool-group--flush" key={group.id}>
                  <div className="tp-tool-options-head">
                    <h3>{tw("robots-txt-generator.groupLabel", { number })}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGroup(group.id)}
                      disabled={groups.length <= 1}
                      aria-label={tw("robots-txt-generator.removeGroup", { number })}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ToolField
                      label={tw("robots-txt-generator.agentLabel")}
                      htmlFor={`tp-robots-agent-${group.id}`}
                      hint={tw("robots-txt-generator.agentHint")}
                    >
                      <input
                        id={`tp-robots-agent-${group.id}`}
                        className="tp-tool-field"
                        value={group.userAgent}
                        aria-describedby={describedBy}
                        onChange={(event) =>
                          updateGroup(group.id, { userAgent: event.target.value })
                        }
                        placeholder={tw("robots-txt-generator.agentPlaceholder")}
                        spellCheck={false}
                      />
                    </ToolField>
                    <ToolField
                      label={tw("robots-txt-generator.allowLabel")}
                      htmlFor={`tp-robots-allow-${group.id}`}
                      hint={tw("robots-txt-generator.pathHint")}
                    >
                      <textarea
                        id={`tp-robots-allow-${group.id}`}
                        className="tp-tool-editor"
                        style={{ minHeight: 72 }}
                        value={group.allow}
                        onChange={(event) =>
                          updateGroup(group.id, { allow: event.target.value })
                        }
                        placeholder={tw("robots-txt-generator.allowPlaceholder")}
                        aria-describedby={describedBy}
                        spellCheck={false}
                      />
                    </ToolField>
                    <ToolField
                      label={tw("robots-txt-generator.disallowLabel")}
                      htmlFor={`tp-robots-disallow-${group.id}`}
                      hint={tw("robots-txt-generator.pathHint")}
                    >
                      <textarea
                        id={`tp-robots-disallow-${group.id}`}
                        className="tp-tool-editor"
                        style={{ minHeight: 72 }}
                        value={group.disallow}
                        onChange={(event) =>
                          updateGroup(group.id, { disallow: event.target.value })
                        }
                        placeholder={tw("robots-txt-generator.disallowPlaceholder")}
                        aria-describedby={describedBy}
                        spellCheck={false}
                      />
                    </ToolField>
                  </div>
                </div>
              );
            })}
          </div>
        </ToolPane>

        <ToolPane
          id="tp-robots-sitemap-title"
          title={tw("robots-txt-generator.sitemapTitle")}
          hint={tw("robots-txt-generator.sitemapHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("robots-txt-generator.crawlDelayLabel")}
              htmlFor="tp-robots-delay"
              hint={tw("robots-txt-generator.delayHint")}
            >
              <NumberStepper
                id="tp-robots-delay"
                value={options.crawlDelay}
                min={0}
                ariaLabel={tw("robots-txt-generator.crawlDelayLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={(crawlDelay) => update({ crawlDelay })}
              />
            </ToolField>
            <ToolField
              label={tw("robots-txt-generator.sitemapLabel")}
              htmlFor="tp-robots-sitemap"
            >
              <input
                id="tp-robots-sitemap"
                className="tp-tool-field"
                type="url"
                inputMode="url"
                value={options.sitemap}
                onChange={(event) => update({ sitemap: event.target.value })}
                placeholder={tw("robots-txt-generator.sitemapPlaceholder")}
                aria-describedby={describedBy}
                spellCheck={false}
              />
            </ToolField>
          </div>
        </ToolPane>

        <ToolPane
          id="tp-robots-result-title"
          title={tw("robots-txt-generator.resultTitle")}
          hint={tw("robots-txt-generator.resultHint")}
          result
          actions={
            <>
              <CopyButton
                text={output}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={output}
                fileName="robots.txt"
                mimeType="text/plain;charset=utf-8"
                label={t("download")}
                disabled={!output}
              />
            </>
          }
          footer={
            <dl className="tp-tool-stats">
              <Stat label={tw("robots-txt-generator.groupCountLabel")} value={groups.filter((group) => group.userAgent.trim()).length} />
              <Stat label={tw("robots-txt-generator.directiveCountLabel")} value={directiveCount} />
            </dl>
          }
        >
          {output ? (
            <div aria-live="polite" className="tp-tool-result">
              <textarea
                className="tp-tool-code tp-tool-code--tall"
                value={output}
                readOnly
                dir="ltr"
                aria-label={tw("robots-txt-generator.outputLabel")}
              />
              <p className="tp-tool-hint">{tw("robots-txt-generator.outputHint")}</p>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<FileText aria-hidden="true" />}
                title={tw("robots-txt-generator.emptyTitle")}
                hint={tw("robots-txt-generator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("robots-txt-generator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
