"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  NumberStepper,
  SegmentedControl,
  Stat,
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
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="lorem-settings-title"
          title={tw("lorem-ipsum-generator.settingsTitle")}
        >
          <div className="tp-tool-group">
            <p className="tp-tool-group-title">
              {tw("lorem-ipsum-generator.typeLabel")}
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
            <label className="tp-tool-label" htmlFor="lorem-count-range">
              {tw("lorem-ipsum-generator.countLabel")}
            </label>
            <div className="tp-lorem-count-row">
              <input
                id="lorem-count-range"
                type="range"
                className="tp-tool-range"
                min={limits.min}
                max={limits.max}
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              />
              <NumberStepper
                id="lorem-count-number"
                value={String(count)}
                min={limits.min}
                max={limits.max}
                ariaLabel={tw("lorem-ipsum-generator.countNumberLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(next) => setCount(Number(next))}
              />
            </div>
          </div>

          <CheckboxRow
            id="lorem-start"
            label={tw("lorem-ipsum-generator.startWithLorem")}
            checked={options.startWithLorem}
            onChange={(checked) => update({ startWithLorem: checked })}
          />
        </ToolPane>
      }
      result={
        <ToolPane
          id="lorem-result-title"
          title={tw("lorem-ipsum-generator.resultTitle")}
          result
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
          <div className="tp-tool-result" aria-live="polite">
            <textarea
              className="tp-tool-code tp-tool-code--tall"
              value={text}
              readOnly
              spellCheck={false}
              aria-label={tw("lorem-ipsum-generator.generatedTextLabel")}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <dl className="tp-tool-stats tp-tool-stats--inline">
                <Stat label={t("words")} value={countWords(text)} />
                <Stat label={t("characters")} value={text.length} />
              </dl>
              <Button type="button" size="sm" onClick={handleNewSeed}>
                <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("lorem-ipsum-generator.newSeed")}
              </Button>
            </div>
          </div>
        </ToolPane>
      }
    />
  );
}
