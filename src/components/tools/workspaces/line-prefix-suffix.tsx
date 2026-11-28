"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ListOrdered, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  HeroValue,
  NumberStepper,
  ToolEmpty,
  ToolField,
  ToolPane,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  decorateLines,
  DEFAULT_LINE_OPTIONS,
  type LineErrorCode,
  type LineOptions,
} from "./line-prefix-suffix.logic";

const ERROR_ID = "tp-line-prefix-suffix-error";
const QUICK_STARTS = [1, 10, 100] as const;

type PersistedOptions = Pick<LineOptions, "numberLines" | "skipEmpty" | "startAt">;

export default function LinePrefixSuffix() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [text, setText] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [wrapper, setWrapper] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<PersistedOptions>(
    "toolpika:line-prefix-suffix",
    {
      numberLines: DEFAULT_LINE_OPTIONS.numberLines,
      skipEmpty: DEFAULT_LINE_OPTIONS.skipEmpty,
      startAt: DEFAULT_LINE_OPTIONS.startAt,
    },
  );

  const result = useMemo(
    () => decorateLines(text, {
      prefix,
      suffix,
      wrapper,
      numberLines: options.numberLines,
      skipEmpty: options.skipEmpty,
      startAt: options.startAt,
    }),
    [text, prefix, suffix, wrapper, options],
  );

  const errorText = (() => {
    const code: LineErrorCode | undefined = result.error?.code;
    switch (code) {
      case "EMPTY_TEXT":
        return `${tw("line-prefix-suffix.errorEmpty")} ${tw("line-prefix-suffix.fixEmpty")}`;
      case "NOTHING_TO_ADD":
        return `${tw("line-prefix-suffix.errorNothing")} ${tw("line-prefix-suffix.fixNothing")}`;
      case "INVALID_START":
        return `${tw("line-prefix-suffix.errorStart")} ${tw("line-prefix-suffix.fixStart")}`;
      default:
        return "";
    }
  })();

  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = result.outputLines > 0 && !errorText;
  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const handleCopyShortcut = useCallback(() => {
    if (result.output && !result.error) void navigator.clipboard.writeText(result.output).catch(() => {});
  }, [result.error, result.output]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setText(tw("line-prefix-suffix.sampleText"));
    setPrefix(tw("line-prefix-suffix.samplePrefix"));
    setSuffix("");
    setWrapper(tw("line-prefix-suffix.sampleWrapper"));
    update({ numberLines: true, skipEmpty: true, startAt: 1 });
  };

  const handleReset = () => {
    setText("");
    setPrefix("");
    setSuffix("");
    setWrapper("");
    resetOptions();
  };

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="ListOrdered" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("line-prefix-suffix.title")}</span>
            <span className="tp-tool-subtitle">{tw("line-prefix-suffix.subtitle")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("line-prefix-suffix.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("line-prefix-suffix.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="tp-line-input-title"
          title={tw("line-prefix-suffix.inputTitle")}
          hint={tw("line-prefix-suffix.inputHint")}
        >
          <div className="flex flex-col gap-2">
            <label className="tp-tool-label" htmlFor="tp-line-text">
              {tw("line-prefix-suffix.textLabel")}
            </label>
            <textarea
              id="tp-line-text"
              className="tp-field-input tp-tool-editor"
              value={text}
              rows={5}
              placeholder={t("startTyping")}
              aria-describedby={describedBy}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
            />
            <p className="tp-tool-hint">
              {nf.format(result.inputLines)} {t("lines")}
            </p>
          </div>
        </ToolPane>

        <ToolPane
          id="tp-line-options-title"
          title={tw("line-prefix-suffix.optionsTitle")}
          hint={tw("line-prefix-suffix.optionsHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("line-prefix-suffix.prefixLabel")}
              htmlFor="tp-line-prefix"
              hint={tw("line-prefix-suffix.prefixHint")}
            >
              <input
                id="tp-line-prefix"
                className="tp-field-input"
                type="text"
                value={prefix}
                placeholder={tw("line-prefix-suffix.prefixPlaceholder")}
                aria-describedby={describedBy}
                onChange={(event) => setPrefix(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </ToolField>

            <ToolField
              label={tw("line-prefix-suffix.suffixLabel")}
              htmlFor="tp-line-suffix"
              hint={tw("line-prefix-suffix.suffixHint")}
            >
              <input
                id="tp-line-suffix"
                className="tp-field-input"
                type="text"
                value={suffix}
                placeholder={tw("line-prefix-suffix.suffixPlaceholder")}
                aria-describedby={describedBy}
                onChange={(event) => setSuffix(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </ToolField>

            <ToolField
              label={tw("line-prefix-suffix.wrapperLabel")}
              htmlFor="tp-line-wrapper"
              hint={tw("line-prefix-suffix.wrapperHint")}
            >
              <input
                id="tp-line-wrapper"
                className="tp-field-input"
                type="text"
                value={wrapper}
                placeholder={tw("line-prefix-suffix.wrapperPlaceholder")}
                aria-describedby={describedBy}
                onChange={(event) => setWrapper(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </ToolField>

            <ToolField
              label={tw("line-prefix-suffix.startLabel")}
              htmlFor="tp-line-start"
              hint={tw("line-prefix-suffix.startHint")}
            >
              <NumberStepper
                id="tp-line-start"
                value={String(options.startAt)}
                ariaLabel={tw("line-prefix-suffix.startLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                min={1}
                max={9999}
                onValueChange={(value) => update({ startAt: Number(value) })}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("line-prefix-suffix.quickStartLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_STARTS.map((quick) => (
                <Button
                  key={quick}
                  type="button"
                  size="sm"
                  variant={options.startAt === quick ? "default" : "secondary"}
                  onClick={() => update({ startAt: quick })}
                >
                  {nf.format(quick)}
                </Button>
              ))}
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <CheckboxRow
              id="tp-line-number"
              label={tw("line-prefix-suffix.numberLinesLabel")}
              checked={options.numberLines}
              onChange={(checked) => update({ numberLines: checked })}
            />
            <CheckboxRow
              id="tp-line-skip-empty"
              label={tw("line-prefix-suffix.skipEmptyLabel")}
              checked={options.skipEmpty}
              onChange={(checked) => update({ skipEmpty: checked })}
            />
            <p className="tp-tool-hint">{tw("line-prefix-suffix.skipEmptyHint")}</p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>

        <ToolPane
          id="tp-line-result-title"
          title={tw("line-prefix-suffix.resultTitle")}
          hint={tw("line-prefix-suffix.resultHint")}
          actions={
            <>
              <CopyButton
                text={ready ? result.output : ""}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={ready ? result.output : null}
                fileName={tw("line-prefix-suffix.downloadFileName")}
                label={t("download")}
              />
            </>
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ListOrdered aria-hidden="true" />}
                title={tw("line-prefix-suffix.emptyTitle")}
                hint={errorText
                  ? tw("line-prefix-suffix.errorEmptyHint")
                  : tw("line-prefix-suffix.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("line-prefix-suffix.heroLabel")}
                value={nf.format(result.outputLines)}
                note={tw("line-prefix-suffix.heroNote")}
              />
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("line-prefix-suffix.previewLabel")}</span>
                <div className="tp-tool-code whitespace-pre-line">
                  <code dir="ltr">{result.output}</code>
                </div>
              </div>
            </div>
          )}
        </ToolPane>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("line-prefix-suffix.privacyRibbon")}
        </span>
        <span className="tp-tool-hint">{tw("line-prefix-suffix.shortcutHint")}</span>
      </div>
    </div>
  );
}
