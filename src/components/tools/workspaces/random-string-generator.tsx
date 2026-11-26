"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  NumberStepper,
  Stat,
  ToggleSwitch,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULT_OPTIONS,
  LIMITS,
  generateBatch,
  joinBatch,
  randomStringErrorCode,
  type RandomStringErrorCode,
  type RandomStringOptions,
} from "./random-string-generator.logic";

export default function RandomStringGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions<RandomStringOptions>(
    "toolpika:random-string-generator",
    DEFAULT_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();

  const [results, setResults] = useState<string[]>([]);
  const [errorCode, setErrorCode] = useState<RandomStringErrorCode | null>(null);

  const noCharset = !options.lower && !options.upper && !options.digits && !options.symbols;
  const outputText = joinBatch(results);
  const downloadContent = outputText ? `${outputText}\n` : null;

  const generateWith = useCallback(
    (next: RandomStringOptions) => {
      clearNotice();
      try {
        setResults(generateBatch(next));
        setErrorCode(null);
      } catch (error) {
        setResults([]);
        setErrorCode(randomStringErrorCode(error));
      }
    },
    [clearNotice],
  );

  const handleGenerate = useCallback(() => {
    generateWith(options);
  }, [generateWith, options]);

  const copyShortcut = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).catch(() => {
      showNotice(tw("random-string-generator.copyUnavailable"));
    });
  }, [outputText, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  const errorMessage = noCharset
    ? tw("random-string-generator.errorNoCharset")
    : errorCode === "unsupported"
      ? tw("random-string-generator.errorUnsupported")
      : errorCode === "invalidRange"
        ? tw("random-string-generator.errorInvalidRange")
        : errorCode === "failed"
          ? tw("random-string-generator.errorFailed")
          : "";

  const updateNumber = (field: "length" | "count", value: string) => {
    if (value.trim() === "") return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    const next = Math.trunc(parsed);
    if (field === "length") update({ length: next });
    else update({ count: next });
  };

  const handleSample = () => {
    update(DEFAULT_OPTIONS);
    generateWith(DEFAULT_OPTIONS);
  };

  const handleReset = () => {
    resetOptions();
    setResults([]);
    setErrorCode(null);
    clearNotice();
  };

  return (
    <ToolShell
      title={tw("random-string-generator.title")}
      subtitle={tw("random-string-generator.subtitle")}
      icon="Shuffle"
      sampleLabel={tw("random-string-generator.trySample")}
      resetLabel={tw("random-string-generator.reset")}
      privacyLabel={tw("random-string-generator.privacyLabel")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="random-string-settings-title"
          title={tw("random-string-generator.settingsTitle")}
          hint={tw("random-string-generator.settingsHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <ToolField label={tw("random-string-generator.lengthLabel")} htmlFor="rs-length">
              <NumberStepper
                id="rs-length"
                value={String(options.length)}
                min={LIMITS.length.min}
                max={LIMITS.length.max}
                ariaLabel={tw("random-string-generator.lengthLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(value) => updateNumber("length", value)}
              />
            </ToolField>

            <ToolField label={tw("random-string-generator.countLabel")} htmlFor="rs-count">
              <NumberStepper
                id="rs-count"
                value={String(options.count)}
                min={LIMITS.count.min}
                max={LIMITS.count.max}
                ariaLabel={tw("random-string-generator.countLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(value) => updateNumber("count", value)}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group">
            <p className="tp-tool-group-title" id="rs-charsets-title">
              {tw("random-string-generator.charsetsTitle")}
            </p>
            <div role="group" aria-labelledby="rs-charsets-title">
              <CheckboxRow
                id="rs-lower"
                label={tw("random-string-generator.lowerLabel")}
                checked={options.lower}
                onChange={(checked) => update({ lower: checked })}
              />
              <CheckboxRow
                id="rs-upper"
                label={tw("random-string-generator.upperLabel")}
                checked={options.upper}
                onChange={(checked) => update({ upper: checked })}
              />
              <CheckboxRow
                id="rs-digits"
                label={tw("random-string-generator.digitsLabel")}
                checked={options.digits}
                onChange={(checked) => update({ digits: checked })}
              />
              <CheckboxRow
                id="rs-symbols"
                label={tw("random-string-generator.symbolsLabel")}
                checked={options.symbols}
                onChange={(checked) => update({ symbols: checked })}
              />
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-check-row">
              <ToggleSwitch
                id="rs-look-alike"
                label={tw("random-string-generator.lookAlikeLabel")}
                checked={options.excludeLookAlike}
                onChange={() => update({ excludeLookAlike: !options.excludeLookAlike })}
              />
              <label htmlFor="rs-look-alike" className="tp-check-label">
                {tw("random-string-generator.lookAlikeLabel")}
              </label>
            </div>
            <p className="tp-tool-hint">{tw("random-string-generator.lookAlikeHint")}</p>
          </div>

          <Button type="button" onClick={handleGenerate} disabled={noCharset}>
            {tw("random-string-generator.generate")}
          </Button>

          {errorMessage ? (
            <p className="tp-tool-error" id="rs-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="random-string-result-title"
          title={tw("random-string-generator.resultTitle")}
          result
          actions={
            <>
              <CopyButton
                text={outputText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={downloadContent}
                fileName="random-strings.txt"
                label={t("download")}
              />
            </>
          }
        >
          <div aria-live="polite">
            {results.length > 0 ? (
              <div className="tp-tool-result">
                <textarea
                  className="tp-tool-code tp-tool-code--tall"
                  value={outputText}
                  readOnly
                  spellCheck={false}
                  aria-label={tw("random-string-generator.outputLabel")}
                />
                <dl className="tp-tool-stats tp-tool-stats--inline">
                  <Stat label={tw("random-string-generator.batchLabel")} value={results.length} />
                  <Stat label={tw("random-string-generator.lengthLabel")} value={results[0]?.length ?? 0} />
                  <Stat label={tw("random-string-generator.totalLabel")} value={outputText.length} />
                </dl>
              </div>
            ) : (
              <ToolEmpty
                icon={<Shuffle />}
                title={tw("random-string-generator.emptyTitle")}
                hint={tw("random-string-generator.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
