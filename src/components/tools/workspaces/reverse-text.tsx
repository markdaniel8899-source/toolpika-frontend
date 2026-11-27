"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownUp } from "lucide-react";
import {
  CheckboxRow,
  CopyButton,
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
  calculateReverseText,
  type ReverseMode,
  type ReverseTextResult,
} from "./reverse-text.logic";

const ERROR_ID = "tp-reverse-text-error";

export default function ReverseText() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const { options, update, reset: resetOptions } = usePersistedOptions<{
    mode: ReverseMode;
    trimWhitespace: boolean;
    preserveCase: boolean;
  }>("toolpika:reverse-text", {
    mode: "characters",
    trimWhitespace: false,
    preserveCase: false,
  });
  const mode = options.mode;
  const trimWhitespace = options.trimWhitespace;
  const preserveCase = options.preserveCase;

  const [text, setText] = useState("");

  const input = useMemo(
    () => ({ text, mode, trimWhitespace, preserveCase }),
    [text, mode, trimWhitespace, preserveCase],
  );
  const calculation: ReverseTextResult = useMemo(
    () => calculateReverseText(input),
    [input],
  );
  const value = calculation.value;

  const errorText = calculation.error
    ? `${tw("reverse-text.errorEmpty")} ${tw("reverse-text.fixEmpty")}`
    : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = Boolean(value && !errorText);

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const modeLabel =
    mode === "characters"
      ? tw("reverse-text.modeCharacters")
      : mode === "words"
        ? tw("reverse-text.modeWords")
        : mode === "lines"
          ? tw("reverse-text.modeLines")
          : tw("reverse-text.modeLetters");

  const handleCopyShortcut = useCallback(() => {
    if (value?.output) void navigator.clipboard.writeText(value.output).catch(() => {});
  }, [value]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    update({ mode: "words", trimWhitespace: false, preserveCase: false });
    setText(tw("reverse-text.sampleText"));
  };

  const handleReset = () => {
    resetOptions();
    setText("");
  };

  return (
    <ToolShell
      title={tw("reverse-text.title")}
      icon="ArrowDownUp"
      sampleLabel={tw("reverse-text.trySample")}
      resetLabel={tw("reverse-text.reset")}
      privacyLabel={tw("reverse-text.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-reverse-text-input-title"
          title={tw("reverse-text.inputTitle")}
          hint={tw("reverse-text.inputHint")}
        >
          <ToolField
            label={tw("reverse-text.textLabel")}
            htmlFor="tp-reverse-text-text"
            hint={tw("reverse-text.textHint")}
          >
            <textarea
              id="tp-reverse-text-text"
              className="tp-field-input"
              value={text}
              rows={5}
              placeholder={tw("reverse-text.textPlaceholder")}
              aria-describedby={describedBy}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<ReverseMode>
              label={tw("reverse-text.modeLabel")}
              value={mode}
              options={[
                { value: "characters", label: tw("reverse-text.modeCharacters") },
                { value: "words", label: tw("reverse-text.modeWords") },
                { value: "lines", label: tw("reverse-text.modeLines") },
                { value: "letters", label: tw("reverse-text.modeLetters") },
              ]}
              onChange={(next) => update({ mode: next })}
            />
            <CheckboxRow
              id="tp-reverse-text-trim"
              label={tw("reverse-text.trimLabel")}
              checked={trimWhitespace}
              onChange={(checked) => update({ trimWhitespace: checked })}
            />
            <p className="tp-tool-hint">{tw("reverse-text.trimHint")}</p>
            <CheckboxRow
              id="tp-reverse-text-case"
              label={tw("reverse-text.preserveCaseLabel")}
              checked={preserveCase}
              onChange={(checked) => update({ preserveCase: checked })}
            />
            <p className="tp-tool-hint">{tw("reverse-text.preserveCaseHint")}</p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-reverse-text-result-title"
          title={t("result")}
          result
          actions={
            <CopyButton
              text={ready && value ? value.output : ""}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ArrowDownUp aria-hidden="true" />}
                title={
                  errorText
                    ? tw("reverse-text.errorTitle")
                    : tw("reverse-text.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("reverse-text.errorHint")
                    : tw("reverse-text.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("reverse-text.heroLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">
                  {modeLabel}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("reverse-text.charactersLabel")}
                  value={nf.format(value.characters)}
                />
                <Stat
                  label={tw("reverse-text.wordsLabel")}
                  value={nf.format(value.words)}
                />
                <Stat
                  label={tw("reverse-text.outputCharactersLabel")}
                  value={nf.format(value.outputCharacters)}
                />
              </dl>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("reverse-text.previewLabel")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{value.output}</code>
                </div>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
