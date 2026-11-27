"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  HeroValue,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateTextRepeater,
  MAX_REPEATS,
  MIN_REPEATS,
  type Separator,
} from "./text-repeater.logic";

const ERROR_ID = "tp-text-repeater-error";
const QUICK_COUNTS = [5, 10, 25, 50, 100] as const;

export default function TextRepeater() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<{
    separator: Separator;
    numberLines: boolean;
  }>("toolpika:text-repeater", { separator: "newline", numberLines: false });
  const separator = options.separator;
  const numberLines = options.numberLines;

  const [text, setText] = useState("");
  const [count, setCount] = useState("5");
  const [customDelimiter, setCustomDelimiter] = useState("");

  const input = useMemo(
    () => ({ text, count, separator, customDelimiter, numberLines }),
    [text, count, separator, customDelimiter, numberLines],
  );
  const calculation = useMemo(() => calculateTextRepeater(input), [input]);
  const value = calculation.value;

  const errorText =
    calculation.error?.code === "EMPTY_TEXT"
      ? `${tw("text-repeater.errorEmpty")} ${tw("text-repeater.fixEmpty")}`
      : calculation.error?.code === "INVALID_COUNT"
        ? `${tw("text-repeater.errorCountInvalid")} ${tw("text-repeater.fixCount")}`
        : calculation.error?.code === "COUNT_OUT_OF_RANGE"
          ? `${tw("text-repeater.errorCountRange")} ${tw("text-repeater.fixCountRange")}`
          : calculation.error?.code === "EMPTY_DELIMITER"
            ? `${tw("text-repeater.errorDelimiter")} ${tw("text-repeater.fixDelimiter")}`
            : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = Boolean(value && !errorText);

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const handleCopyShortcut = useCallback(() => {
    if (value?.output) void navigator.clipboard.writeText(value.output).catch(() => {});
  }, [value]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ separator: "newline", numberLines: true });
    setText(tw("text-repeater.sampleText"));
    setCount("5");
    setCustomDelimiter("");
  };
  const handleReset = () => {
    resetOptions();
    setText("");
    setCount("5");
    setCustomDelimiter("");
  };

  return (
    <ToolShell
      title={tw("text-repeater.title")}
      icon="Repeat2"
      sampleLabel={tw("text-repeater.trySample")}
      resetLabel={tw("text-repeater.reset")}
      privacyLabel={tw("text-repeater.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane id="tp-text-repeater-input-title" title={tw("text-repeater.inputTitle")} hint={tw("text-repeater.inputHint")}>
          <ToolField label={tw("text-repeater.textLabel")} htmlFor="tp-text-repeater-text" hint={tw("text-repeater.textHint")}>
            <textarea
              id="tp-text-repeater-text"
              className="tp-field-input tp-tool-editor"
              value={text}
              rows={4}
              placeholder={tw("text-repeater.textPlaceholder")}
              aria-describedby={describedBy}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("text-repeater.quickLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_COUNTS.map((quick) => (
                <Button key={quick} type="button" size="sm" variant={count === String(quick) ? "default" : "secondary"} onClick={() => setCount(String(quick))}>
                  {nf.format(quick)}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolField label={tw("text-repeater.countLabel")} htmlFor="tp-text-repeater-count" hint={tw("text-repeater.countHint")}>
                <NumberStepper id="tp-text-repeater-count" value={count} min={MIN_REPEATS} max={MAX_REPEATS} ariaLabel={tw("text-repeater.countLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setCount} />
              </ToolField>
              {separator === "custom" ? (
                <ToolField label={tw("text-repeater.customLabel")} htmlFor="tp-text-repeater-delimiter" hint={tw("text-repeater.customHint")}>
                  <input id="tp-text-repeater-delimiter" type="text" className="tp-field-input" value={customDelimiter} placeholder={tw("text-repeater.customPlaceholder")} aria-describedby={describedBy} onChange={(event) => setCustomDelimiter(event.target.value)} spellCheck={false} autoComplete="off" />
                </ToolField>
              ) : null}
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<Separator>
              label={tw("text-repeater.separatorLabel")}
              value={separator}
              options={[
                { value: "newline", label: tw("text-repeater.separatorNewline") },
                { value: "space", label: tw("text-repeater.separatorSpace") },
                { value: "comma", label: tw("text-repeater.separatorComma") },
                { value: "custom", label: tw("text-repeater.separatorCustom") },
              ]}
              onChange={(next) => update({ separator: next })}
            />
            <CheckboxRow id="tp-text-repeater-number" label={tw("text-repeater.numberLinesLabel")} checked={numberLines} onChange={(checked) => update({ numberLines: checked })} />
            <p className="tp-tool-hint">{tw("text-repeater.numberLinesHint")}</p>
          </div>

          {errorText ? <p id={ERROR_ID} className="tp-tool-error" role="alert">{errorText}</p> : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-text-repeater-result-title"
          title={t("result")}
          result
          actions={
            <>
              <CopyButton text={ready && value ? value.output : ""} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton content={ready && value ? value.output : null} fileName={tw("text-repeater.downloadFileName")} label={tw("text-repeater.downloadLabel")} />
            </>
          }
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty icon={<Repeat2 aria-hidden="true" />} title={errorText ? tw("text-repeater.errorTitle") : tw("text-repeater.emptyTitle")} hint={errorText ? tw("text-repeater.errorHint") : tw("text-repeater.emptyHint")} />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue label={tw("text-repeater.heroLabel")} value={`${nf.format(value.repeats)} ${tw("text-repeater.copiesLabel")}`} note={`${tw("text-repeater.outputCharactersLabel")}: ${nf.format(value.outputCharacters)}`} />
              <dl className="tp-tool-stats">
                <Stat label={tw("text-repeater.inputCharactersLabel")} value={nf.format(value.inputCharacters)} />
                <Stat label={tw("text-repeater.inputLinesLabel")} value={nf.format(value.inputLines)} />
                <Stat label={tw("text-repeater.outputCharactersLabel")} value={nf.format(value.outputCharacters)} />
                <Stat label={t("lines")} value={nf.format(value.outputLines)} />
              </dl>
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("text-repeater.previewLabel")}</span>
                <div className="tp-tool-code whitespace-pre-line"><code dir="ltr">{value.output}</code></div>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
