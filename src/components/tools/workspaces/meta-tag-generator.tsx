"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Code } from "lucide-react";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CodeOutput,
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

const THEME_PALETTE = [
  "#0F172A",
  "#111827",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#16A34A",
  "#0D9488",
  "#0891B2",
  "#F8FAFC",
] as const;

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const match = /^#?([0-9a-fA-F]{6})$/u.exec(trimmed);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

export default function MetaTagGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState<RobotsDirective>("index, follow");
  const [themeColor, setThemeColor] = useState("");
  const { notice, showNotice } = useToolNotice();

  const delayed = useDebounced(
    useMemo(
      () => ({ title, description, canonicalUrl, robots, themeColor }),
      [title, description, canonicalUrl, robots, themeColor],
    ),
  );
  const result = useMemo(() => buildMetaTags(delayed), [delayed]);
  const code = result.html;
  const colorPickerValue = normalizeHexColor(themeColor) ?? "#0F172A";

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

  const handleReset = useCallback(() => {
    setTitle("");
    setDescription("");
    setCanonicalUrl("");
    setRobots("index, follow");
    setThemeColor("");
  }, []);

  return (
    <ToolShell
      title={tw("meta-tag-generator.title")}
      icon="Code"
      sampleLabel={tw("meta-tag-generator.trySample")}
      resetLabel={tw("meta-tag-generator.reset")}
      privacyLabel={tw("privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      noticeTone="warning"
      input={
        <ToolPane
          id="tp-meta-tag-input-title"
          title={tw("meta-tag-generator.inputTitle")}
          hint={tw("meta-tag-generator.inputHint")}
        >
          <div className="flex flex-col gap-4">
            <ToolField label={tw("meta-tag-generator.titleLabel")} htmlFor="tp-meta-title">
              <input
                id="tp-meta-title"
                className="tp-tool-field"
                type="text"
                value={title}
                placeholder={tw("meta-tag-generator.titlePlaceholder")}
                autoComplete="off"
                onChange={(event) => setTitle(event.target.value)}
              />
            </ToolField>

            <ToolField
              label={tw("meta-tag-generator.descriptionLabel")}
              htmlFor="tp-meta-description"
            >
              <textarea
                id="tp-meta-description"
                className="tp-tool-field min-h-[104px] resize-y py-3"
                value={description}
                placeholder={tw("meta-tag-generator.descriptionPlaceholder")}
                onChange={(event) => setDescription(event.target.value)}
              />
            </ToolField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ToolField
                label={tw("meta-tag-generator.canonicalLabel")}
                htmlFor="tp-meta-canonical"
              >
                <input
                  id="tp-meta-canonical"
                  className="tp-tool-field"
                  type="url"
                  value={canonicalUrl}
                  placeholder={tw("meta-tag-generator.canonicalPlaceholder")}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setCanonicalUrl(event.target.value)}
                />
              </ToolField>

              <ToolField label={tw("meta-tag-generator.robotsLabel")}>
                <ThemedSelect
                  value={robots}
                  onValueChange={(value) => setRobots(value as RobotsDirective)}
                  options={ROBOTS_VALUES.map((value) => ({
                    value,
                    label: tw(`meta-tag-generator.robots${robotsKey(value)}`),
                  }))}
                  ariaLabel={tw("meta-tag-generator.robotsLabel")}
                />
              </ToolField>
            </div>

            <ToolField
              label={tw("meta-tag-generator.themeLabel")}
              htmlFor="tp-meta-theme"
              hint={tw("meta-tag-generator.themeHint")}
            >
              <div className="tp-meta-color-palette">
                <div
                  className="tp-meta-color-swatches"
                  role="group"
                  aria-label={tw("meta-tag-generator.themeLabel")}
                >
                  {THEME_PALETTE.map((color) => {
                    const active = normalizeHexColor(themeColor) === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        className="tp-meta-swatch"
                        style={{ backgroundColor: color }}
                        aria-label={color}
                        aria-pressed={active}
                        title={color}
                        onClick={() => setThemeColor(color)}
                      />
                    );
                  })}
                </div>
                <div className="tp-meta-color-custom">
                  <input
                    type="color"
                    className="tp-meta-color-picker"
                    value={colorPickerValue}
                    aria-label={tw("meta-tag-generator.themeLabel")}
                    onChange={(event) => setThemeColor(event.target.value.toUpperCase())}
                  />
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
                </div>
              </div>
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
                <Stat label={tw("meta-tag-generator.tagCountLabel")} value={result.tagCount} />
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

function robotsKey(value: RobotsDirective): string {
  switch (value) {
    case "index, follow":
      return "IndexFollow";
    case "noindex, follow":
      return "NoindexFollow";
    case "index, nofollow":
      return "IndexNofollow";
    case "noindex, nofollow":
      return "NoindexNofollow";
  }
}
