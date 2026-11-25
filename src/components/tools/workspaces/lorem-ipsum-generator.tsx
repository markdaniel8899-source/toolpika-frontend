"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULT_LOREM_OPTIONS,
  LOREM_LIMITS,
  SAMPLE_LOREM_OPTIONS,
  countWords,
  generateLorem,
  type LoremOptions,
  type LoremType,
} from "./lorem-ipsum-generator.logic";

export default function LoremIpsumGenerator() {
  const tw = useTranslations("tools");
  const t = useTranslations("toolUi");
  const { options, update, reset } = usePersistedOptions<LoremOptions>(
    "toolpika:lorem-ipsum-generator",
    DEFAULT_LOREM_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();

  const debouncedOptions = useDebounced(options, 120);
  const text = useMemo(() => generateLorem(debouncedOptions), [debouncedOptions]);
  const paragraphs = text ? text.split(/\n\s*\n/u).length : 0;

  const countField: "paragraphs" | "sentencesPerParagraph" | "wordsPerSentence" =
    options.type === "words"
      ? "wordsPerSentence"
      : options.type === "sentences"
        ? "sentencesPerParagraph"
        : "paragraphs";
  const limits = LOREM_LIMITS[countField];
  const count = options[countField];

  const setCount = useCallback(
    (value: number) => {
      const next = Math.min(
        limits.max,
        Math.max(limits.min, Math.trunc(value) || limits.min),
      );
      if (countField === "paragraphs") update({ paragraphs: next });
      else if (countField === "sentencesPerParagraph")
        update({ sentencesPerParagraph: next });
      else update({ wordsPerSentence: next });
    },
    [countField, limits.max, limits.min, update],
  );

  const handleNewSeed = useCallback(() => {
    const nextSeed = ((options.seed || 1) + 7919) % 1000000;
    update({ seed: nextSeed });
    showNotice(tw("lorem-ipsum-generator.seedNotice"));
  }, [options.seed, showNotice, tw, update]);

  const handleSample = useCallback(() => {
    update(SAMPLE_LOREM_OPTIONS);
    clearNotice();
  }, [clearNotice, update]);

  const handleReset = useCallback(() => {
    reset();
    clearNotice();
  }, [clearNotice, reset]);

  const copyShortcut = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {
      showNotice(tw("lorem-ipsum-generator.copyUnavailable"));
    });
  }, [showNotice, text, tw]);
  useCopyShortcut(copyShortcut);

  return (
    <ToolShell
      title={tw("lorem-ipsum-generator.title")}
      subtitle={tw("lorem-ipsum-generator.subtitle")}
      icon="Braces"
      sampleLabel={tw("lorem-ipsum-generator.trySample")}
      resetLabel={tw("lorem-ipsum-generator.reset")}
      privacyLabel={tw("lorem-ipsum-generator.privacyRibbon")}
      shortcutHint={tw("lorem-ipsum-generator.shortcutHint")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="lorem-output-title"
          title={tw("lorem-ipsum-generator.outputTitle")}
          hint={tw("lorem-ipsum-generator.outputHint")}
          actions={
            <>
              <CopyButton
                text={text}
                label={tw("lorem-ipsum-generator.copy")}
                copiedLabel={tw("lorem-ipsum-generator.copied")}
              />
              <DownloadButton
                content={text}
                fileName="lorem-ipsum.txt"
                label={tw("lorem-ipsum-generator.download")}
              />
            </>
          }
        >
          <textarea
            className="tp-tool-code tp-tool-code--tall"
            value={text}
            readOnly
            spellCheck={false}
            aria-label={tw("lorem-ipsum-generator.generatedTextLabel")}
          />
        </ToolPane>
      }
      result={
        <ToolPane
          id="lorem-summary-title"
          title={tw("lorem-ipsum-generator.summaryTitle")}
          hint={tw("lorem-ipsum-generator.summaryHint")}
          result
          actions={
            <ToolBadge tone={text ? "success" : "neutral"}>
              {text
                ? tw("lorem-ipsum-generator.statusReady")
                : tw("lorem-ipsum-generator.statusIdle")}
            </ToolBadge>
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            <dl className="tp-tool-stats">
              <Stat label={t("words")} value={countWords(text)} />
              <Stat label={t("characters")} value={text.length} />
              <Stat label={t("paragraphs")} value={paragraphs} />
            </dl>
            <Button type="button" size="sm" onClick={handleNewSeed}>
              <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("lorem-ipsum-generator.newSeed")}
            </Button>
          </div>
        </ToolPane>
      }
      options={
        <>
          <div className="tp-tool-options-head">
            <h3>{tw("lorem-ipsum-generator.optionsTitle")}</h3>
          </div>
          <div className="tp-tool-options-grid">
            <div className="tp-tool-group">
              <p className="tp-tool-group-title">
                {tw("lorem-ipsum-generator.countGroup")}
              </p>
              <label className="tp-tool-label" htmlFor="lorem-count-range">
                {tw("lorem-ipsum-generator.countLabel")}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  id="lorem-count-range"
                  type="range"
                  className="tp-tool-range"
                  min={limits.min}
                  max={limits.max}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                />
                <input
                  type="number"
                  className="tp-tool-field"
                  style={{ maxWidth: 84 }}
                  min={limits.min}
                  max={limits.max}
                  value={count}
                  aria-label={tw("lorem-ipsum-generator.countNumberLabel")}
                  onChange={(event) => setCount(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="tp-tool-group">
              <p className="tp-tool-group-title">
                {tw("lorem-ipsum-generator.typeGroup")}
              </p>
              <SegmentedControl<LoremType>
                label={tw("lorem-ipsum-generator.typeLabel")}
                value={options.type}
                options={[
                  {
                    value: "paragraphs",
                    label: tw("lorem-ipsum-generator.typeOptionParagraphs"),
                  },
                  {
                    value: "sentences",
                    label: tw("lorem-ipsum-generator.typeOptionSentences"),
                  },
                  {
                    value: "words",
                    label: tw("lorem-ipsum-generator.typeOptionWords"),
                  },
                ]}
                onChange={(type) => update({ type })}
              />
            </div>

            <div className="tp-tool-group">
              <p className="tp-tool-group-title">
                {tw("lorem-ipsum-generator.seedGroup")}
              </p>
              <label className="tp-tool-check">
                <input
                  type="checkbox"
                  checked={options.startWithLorem}
                  onChange={(event) =>
                    update({ startWithLorem: event.target.checked })
                  }
                />
                {tw("lorem-ipsum-generator.startWithLorem")}
              </label>
            </div>
          </div>
        </>
      }
    />
  );
}
