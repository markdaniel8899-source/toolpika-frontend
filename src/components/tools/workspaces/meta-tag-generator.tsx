"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CodeOutput,
  selectClassName,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  buildMetaTags,
  type RobotsDirective,
} from "./meta-tag-generator.logic";

const ROBOTS_VALUES: RobotsDirective[] = [
  "index, follow",
  "noindex, follow",
  "index, nofollow",
  "noindex, nofollow",
];

export default function MetaTagGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState<RobotsDirective>("index, follow");
  const [themeColor, setThemeColor] = useState("");
  const { notice, showNotice } = useToolNotice();

  const delayedTitle = useDebounced(title);
  const delayedDescription = useDebounced(description);
  const delayedCanonical = useDebounced(canonicalUrl);
  const delayedTheme = useDebounced(themeColor);

  const result = useMemo(
    () =>
      buildMetaTags({
        title: delayedTitle,
        description: delayedDescription,
        canonicalUrl: delayedCanonical,
        robots,
        themeColor: delayedTheme,
      }),
    [delayedTitle, delayedDescription, delayedCanonical, robots, delayedTheme],
  );

  const code = result.html;

  const handleCopy = useCallback(() => {
    if (!code) return;
    void (async () => {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        showNotice(tw("meta-tag-generator.clipboardUnavailable"));
      }
    })();
  }, [code, showNotice, tw]);

  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setTitle(tw("meta-tag-generator.sampleTitle"));
    setDescription(tw("meta-tag-generator.sampleDescription"));
    setCanonicalUrl(tw("meta-tag-generator.sampleCanonicalUrl"));
    setRobots("index, follow");
    setThemeColor(tw("meta-tag-generator.sampleThemeColor"));
  }, [tw]);

  const handleClear = useCallback(() => {
    setTitle("");
    setDescription("");
    setCanonicalUrl("");
    setRobots("index, follow");
    setThemeColor("");
  }, []);

  const robotsOptions = [
    { value: ROBOTS_VALUES[0], label: tw("meta-tag-generator.robotsIndexFollow") },
    { value: ROBOTS_VALUES[1], label: tw("meta-tag-generator.robotsNoindexFollow") },
    { value: ROBOTS_VALUES[2], label: tw("meta-tag-generator.robotsIndexNofollow") },
    { value: ROBOTS_VALUES[3], label: tw("meta-tag-generator.robotsNoindexNofollow") },
  ];

  const isEmpty = !title && !description && !canonicalUrl && !themeColor;

  return (
    <ToolShell
      title={tw("meta-tag-generator.title")}
      subtitle={tw("meta-tag-generator.subtitle")}
      icon="Code"
      sampleLabel={tw("meta-tag-generator.trySample")}
      resetLabel={tw("meta-tag-generator.reset")}
      privacyLabel={tw("privacyRibbon")}
      onSample={handleSample}
      onReset={handleClear}
      notice={notice}
      noticeTone="warning"
      input={
        <ToolPane
          id="tp-meta-tag-input-title"
          title={tw("meta-tag-generator.inputTitle")}
          hint={tw("meta-tag-generator.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label={t("clear")}
            >
              {t("clear")}
            </Button>
          }
        >
          <ToolField
            label={tw("meta-tag-generator.titleLabel")}
            htmlFor="tp-meta-title"
          >
            <input
              id="tp-meta-title"
              className="tp-tool-field"
              type="text"
              value={title}
              placeholder={tw("meta-tag-generator.titlePlaceholder")}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setTitle(event.target.value)}
            />
          </ToolField>

          <ToolField
            label={tw("meta-tag-generator.descriptionLabel")}
            htmlFor="tp-meta-description"
          >
            <textarea
              id="tp-meta-description"
              className="tp-tool-editor"
              rows={3}
              value={description}
              placeholder={tw("meta-tag-generator.descriptionPlaceholder")}
              spellCheck={false}
              onChange={(event) => setDescription(event.target.value)}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("meta-tag-generator.canonicalLabel")}
              htmlFor="tp-meta-canonical"
            >
              <input
                id="tp-meta-canonical"
                className="tp-tool-field"
                type="url"
                inputMode="url"
                value={canonicalUrl}
                placeholder={tw("meta-tag-generator.canonicalPlaceholder")}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setCanonicalUrl(event.target.value)}
              />
            </ToolField>

            <ToolField
              label={tw("meta-tag-generator.robotsLabel")}
              htmlFor="tp-meta-robots"
            >
              <select
                id="tp-meta-robots"
                className={selectClassName}
                value={robots}
                onChange={(event) => setRobots(event.target.value as RobotsDirective)}
              >
                {robotsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ToolField>

            <ToolField
              label={tw("meta-tag-generator.themeLabel")}
              htmlFor="tp-meta-theme"
              hint={tw("meta-tag-generator.themeHint")}
            >
              <input
                id="tp-meta-theme"
                className="tp-tool-field"
                type="text"
                value={themeColor}
                placeholder={tw("meta-tag-generator.themePlaceholder")}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setThemeColor(event.target.value)}
              />
            </ToolField>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-meta-tag-result-title"
          title={tw("meta-tag-generator.resultTitle")}
          hint={tw("meta-tag-generator.resultHint")}
          result
        >
          {code ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("meta-tag-generator.tagCountLabel")}
                  value={result.tagCount}
                />
              </dl>
              <CodeOutput
                code={code}
                language="html"
                label={t("result")}
                fileName={tw("meta-tag-generator.fileName")}
                mimeType="text/html;charset=utf-8"
              />
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Code aria-hidden="true" />}
                title={tw("meta-tag-generator.emptyTitle")}
                hint={tw("meta-tag-generator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
