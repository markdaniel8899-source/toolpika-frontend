"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  ToolEmpty,
  ToolField,
  usePersistedOptions,
} from "../workspace-ui";
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
  const { options, update, reset: resetOptions } = usePersistedOptions<RobotsOptions>(
    "toolpika:robots-txt-generator",
    DEFAULT_ROBOTS_OPTIONS,
  );

  const [groups, setGroups] = useState<RobotsGroup[]>(() =>
    DEFAULT_ROBOTS_GROUPS.map((group) => ({ ...group })),
  );
  const [openGroupId, setOpenGroupId] = useState<number | null>(
    DEFAULT_ROBOTS_GROUPS[0]?.id ?? null,
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

  const updateGroup = (id: number, patch: Partial<RobotsGroup>) => {
    setGroups((previous) =>
      previous.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    );
  };

  const addRule = () => {
    const id = nextGroupId(groups);
    setGroups((previous) => [...previous, makeGroup(id)]);
    setOpenGroupId(id);
  };

  const removeGroup = (id: number) => {
    if (groups.length <= 1) return;
    const remaining = groups.filter((group) => group.id !== id);
    setGroups(remaining);
    if (openGroupId === id) setOpenGroupId(remaining[0]?.id ?? null);
  };

  const applyDefaultPolicy = (policy: "allow" | "disallow") => {
    const target = groups.find((group) => group.userAgent === "*") ?? groups[0];
    if (!target) return;
    updateGroup(target.id, policy === "allow"
      ? { userAgent: "*", allow: "/", disallow: "" }
      : { userAgent: "*", allow: "", disallow: "/" });
    setOpenGroupId(target.id);
  };

  const handleSample = () => {
    setGroups(SAMPLE_ROBOTS_GROUPS.map((group) => ({ ...group })));
    setOpenGroupId(SAMPLE_ROBOTS_GROUPS[0]?.id ?? null);
    update(SAMPLE_ROBOTS_OPTIONS);
  };

  const handleClear = () => {
    setGroups(DEFAULT_ROBOTS_GROUPS.map((group) => ({ ...group })));
    setOpenGroupId(DEFAULT_ROBOTS_GROUPS[0]?.id ?? null);
    resetOptions();
  };

  const describedBy = message ? ERROR_ID : undefined;

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="FileText" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("robots-txt-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("robots-txt-generator.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-meta-pill" aria-live="polite">
          <span>{tw("robots-txt-generator.groupCountLabel")}</span>
          <strong dir="ltr">{groups.filter((group) => group.userAgent.trim()).length}</strong>
          <span aria-hidden="true">•</span>
          <span>{tw("robots-txt-generator.directiveCountLabel")}</span>
          <strong dir="ltr">{directiveCount}</strong>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="default" size="sm" onClick={handleSample}>
            {tw("robots-txt-generator.trySample")}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="tp-tool-notice" id={ERROR_ID} data-tone="warning" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {message}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-robots-rules-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-robots-rules-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("robots-txt-generator.rulesTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("robots-txt-generator.rulesHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-industrial-bar">
              <span className="tp-tool-group-title">{tw("robots-txt-generator.defaultPolicyLabel")}</span>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => applyDefaultPolicy("allow")}>
                  {tw("robots-txt-generator.policyAllowAll")}
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => applyDefaultPolicy("disallow")}>
                  {tw("robots-txt-generator.policyDisallowAll")}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("robots-txt-generator.crawlDelayLabel")} htmlFor="tp-robots-delay" hint={tw("robots-txt-generator.delayHint")}>
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
            <ToolField label={tw("robots-txt-generator.sitemapLabel")} htmlFor="tp-robots-sitemap">
              <input
                id="tp-robots-sitemap"
                className="tp-field-input"
                type="url"
                inputMode="url"
                value={options.sitemap}
                onChange={(event) => update({ sitemap: event.target.value })}
                placeholder={tw("robots-txt-generator.sitemapPlaceholder")}
                aria-label={tw("robots-txt-generator.sitemapLabel")}
                aria-describedby={describedBy}
                spellCheck={false}
                dir="ltr"
              />
            </ToolField>
          </div>

          <div className="tp-industrial-bar">
            <span className="tp-tool-group-title">{tw("robots-txt-generator.sitemapTitle")}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addRule}
              aria-describedby={describedBy}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("robots-txt-generator.addRule")}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {groups.map((group, index) => {
              const number = index + 1;
              const open = openGroupId === group.id;
              return (
                <details key={group.id} className="tp-tool-group tp-tool-group--flush" open={open}>
                  <summary
                    className="tp-tool-group-title flex cursor-pointer items-center justify-between gap-2"
                    onClick={(event) => {
                      event.preventDefault();
                      setOpenGroupId(open ? null : group.id);
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span>{tw("robots-txt-generator.groupLabel", { number })}</span>
                      <strong className="truncate max-w-[180px]" dir="ltr">
                        {group.userAgent || tw("robots-txt-generator.agentPlaceholder")}
                      </strong>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removeGroup(group.id);
                      }}
                      disabled={groups.length <= 1}
                      aria-label={tw("robots-txt-generator.removeGroup", { number })}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </summary>

                  <div className="mt-3 flex flex-col gap-3">
                    <ToolField label={tw("robots-txt-generator.agentLabel")} htmlFor={`tp-robots-agent-${group.id}`} hint={tw("robots-txt-generator.agentHint")}>
                      <input
                        id={`tp-robots-agent-${group.id}`}
                        className="tp-field-input"
                        value={group.userAgent}
                        aria-label={tw("robots-txt-generator.agentLabel")}
                        aria-describedby={describedBy}
                        onChange={(event) => updateGroup(group.id, { userAgent: event.target.value })}
                        placeholder={tw("robots-txt-generator.agentPlaceholder")}
                        spellCheck={false}
                        dir="ltr"
                      />
                    </ToolField>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ToolField label={tw("robots-txt-generator.allowLabel")} htmlFor={`tp-robots-allow-${group.id}`} hint={tw("robots-txt-generator.pathHint")}>
                        <textarea
                          id={`tp-robots-allow-${group.id}`}
                          className="tp-tool-editor"
                          style={{ minHeight: 72 }}
                          value={group.allow}
                          onChange={(event) => updateGroup(group.id, { allow: event.target.value })}
                          placeholder={tw("robots-txt-generator.allowPlaceholder")}
                          aria-label={tw("robots-txt-generator.allowLabel")}
                          aria-describedby={describedBy}
                          spellCheck={false}
                          dir="ltr"
                        />
                      </ToolField>
                      <ToolField label={tw("robots-txt-generator.disallowLabel")} htmlFor={`tp-robots-disallow-${group.id}`} hint={tw("robots-txt-generator.pathHint")}>
                        <textarea
                          id={`tp-robots-disallow-${group.id}`}
                          className="tp-tool-editor"
                          style={{ minHeight: 72 }}
                          value={group.disallow}
                          onChange={(event) => updateGroup(group.id, { disallow: event.target.value })}
                          placeholder={tw("robots-txt-generator.disallowPlaceholder")}
                          aria-label={tw("robots-txt-generator.disallowLabel")}
                          aria-describedby={describedBy}
                          spellCheck={false}
                          dir="ltr"
                        />
                      </ToolField>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-robots-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-robots-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("robots-txt-generator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("robots-txt-generator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={output}
                fileName="robots.txt"
                mimeType="text/plain;charset=utf-8"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {output ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3" aria-live="polite">
              <div className="tp-meta-pill">
                <span>{tw("robots-txt-generator.groupCountLabel")}</span>
                <strong dir="ltr">{groups.filter((group) => group.userAgent.trim()).length}</strong>
                <span aria-hidden="true">•</span>
                <span>{tw("robots-txt-generator.directiveCountLabel")}</span>
                <strong dir="ltr">{directiveCount}</strong>
              </div>
              <div className="tp-output-viewer" role="region" aria-label={tw("robots-txt-generator.outputLabel")}>
                <code dir="ltr">{output}</code>
              </div>
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
        </section>
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
