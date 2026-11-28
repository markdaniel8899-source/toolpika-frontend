"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  NumberStepper,
  ToolBadge,
  ToolEmpty,
  selectClassName,
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

type PersistedOptions = Pick<LineOptions, "numberLines" | "skipEmpty" | "trim" | "startAt">;

export default function LinePrefixSuffix() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const [text, setText] = useState("");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<PersistedOptions>(
    "toolpika:line-prefix-suffix",
    {
      numberLines: DEFAULT_LINE_OPTIONS.numberLines,
      skipEmpty: DEFAULT_LINE_OPTIONS.skipEmpty,
      trim: DEFAULT_LINE_OPTIONS.trim,
      startAt: DEFAULT_LINE_OPTIONS.startAt,
    },
  );

  const result = useMemo(
    () => decorateLines(text, {
      prefix,
      suffix,
      wrapper: "",
      numberLines: options.numberLines,
      skipEmpty: options.skipEmpty,
      trim: options.trim,
      startAt: options.startAt,
    }),
    [text, prefix, suffix, options],
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
    update({ numberLines: false, skipEmpty: true, trim: false, startAt: 1 });
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setText("");
    setPrefix("");
    setSuffix("");
    resetOptions();
    inputRef.current?.focus();
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="ListOrdered" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("line-prefix-suffix.title")}</span>
            <span className="tp-tool-subtitle">{tw("line-prefix-suffix.subtitle")}</span>
          </span>
        </div>
        <ToolBadge tone="accent">{tw("line-prefix-suffix.liveBadge")}</ToolBadge>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
            {tw("line-prefix-suffix.trySample")}
          </Button>
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-12"
          aria-label={tw("line-prefix-suffix.optionsTitle")}
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {tw("line-prefix-suffix.optionsTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("line-prefix-suffix.optionsHint")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="tp-line-prefix" className="text-sm font-medium text-[var(--text)]">
                {tw("line-prefix-suffix.prefixLabel")}
              </label>
              <input
                id="tp-line-prefix"
                className={selectClassName}
                type="text"
                value={prefix}
                placeholder={tw("line-prefix-suffix.prefixPlaceholder")}
                aria-describedby={describedBy}
                onChange={(event) => setPrefix(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="tp-line-suffix" className="text-sm font-medium text-[var(--text)]">
                {tw("line-prefix-suffix.suffixLabel")}
              </label>
              <input
                id="tp-line-suffix"
                className={selectClassName}
                type="text"
                value={suffix}
                placeholder={tw("line-prefix-suffix.suffixPlaceholder")}
                aria-describedby={describedBy}
                onChange={(event) => setSuffix(event.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <CheckboxRow
              id="tp-line-skip-empty"
              label={tw("line-prefix-suffix.skipEmptyLabel")}
              checked={options.skipEmpty}
              onChange={(checked) => update({ skipEmpty: checked })}
            />
            <CheckboxRow
              id="tp-line-trim"
              label={tw("line-prefix-suffix.trimLabel")}
              checked={options.trim}
              onChange={(checked) => update({ trim: checked })}
            />
          </div>
          <details className="tp-tool-group tp-tool-group--flush">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
              {tw("line-prefix-suffix.advancedTitle")}
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CheckboxRow
                id="tp-line-number"
                label={tw("line-prefix-suffix.numberLinesLabel")}
                checked={options.numberLines}
                onChange={(checked) => update({ numberLines: checked })}
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="tp-line-start" className="text-sm font-medium text-[var(--text)]">
                  {tw("line-prefix-suffix.startLabel")}
                </label>
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
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
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
          </details>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-line-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-line-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("line-prefix-suffix.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("line-prefix-suffix.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <label htmlFor="tp-line-text" className="text-sm font-medium text-[var(--text)]">
            {tw("line-prefix-suffix.textLabel")}
          </label>
          <textarea
            id="tp-line-text"
            ref={inputRef}
            className="tp-tool-editor"
            value={text}
            rows={12}
            placeholder={t("startTyping")}
            aria-describedby={describedBy}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
          />
          <div className="tp-meta-pill" aria-live="polite">
            <span>{t("lines")}</span>
            <strong dir="ltr">{nf.format(result.inputLines)}</strong>
          </div>
          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-notice" data-tone="danger" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="tp-line-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-line-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("line-prefix-suffix.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("line-prefix-suffix.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton
                text={ready ? result.output : ""}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={ready ? result.output : null}
                fileName={tw("line-prefix-suffix.downloadFileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <span>{tw("line-prefix-suffix.heroLabel")}</span>
            <strong dir="ltr">{nf.format(result.outputLines)}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("line-prefix-suffix.heroNote")}</span>
          </div>

          {ready ? (
            <div
              className="tp-output-viewer whitespace-pre-line"
              role="region"
              aria-label={tw("line-prefix-suffix.resultTitle")}
              aria-live="polite"
            >
              <code dir="ltr">{result.output}</code>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="ListOrdered" />}
                title={tw("line-prefix-suffix.emptyTitle")}
                hint={errorText
                  ? tw("line-prefix-suffix.errorEmptyHint")
                  : tw("line-prefix-suffix.emptyHint")}
              />
            </div>
          )}
        </section>
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
