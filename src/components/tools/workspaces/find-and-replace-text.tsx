"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Regex, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyFeedback,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REPLACE_OPTIONS,
  replaceText,
  type ReplaceErrorCode,
  type ReplaceOptions,
} from "./find-and-replace-text.logic";

const SAMPLE_TEXT =
  "The cat sat on the mat. Another cat nearby.\nCategory is a different word.";
const SAMPLE_FIND = "cat";
const SAMPLE_REPLACE = "dog";
const ERROR_ID = "tp-find-replace-error";

function InlineSwitch({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors motion-reduce:transition-none",
          checked
            ? "border-[var(--accent-fill)] bg-[var(--accent-fill)]"
            : "border-[var(--border-strong)] bg-[var(--surface)]",
        )}
      >
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 rounded-full bg-[var(--on-accent)] shadow-sm transition-transform motion-reduce:transition-none"
          style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-xs text-[var(--text)]">
        {label}
      </label>
    </div>
  );
}

export default function FindAndReplaceText() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<ReplaceOptions>(
    "toolpika:find-and-replace-text",
    DEFAULT_REPLACE_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { copied, copy, reset: resetCopy } = useCopyFeedback();

  const input = useDebounced(
    useMemo(
      () => ({ text, find, replacement, options }),
      [text, find, replacement, options],
    ),
    180,
  );

  const result = useMemo(
    () => replaceText(input.text, input.find, input.replacement, input.options),
    [input],
  );

  const errorMessage = (code: ReplaceErrorCode | undefined) => {
    switch (code) {
      case "EMPTY_FIND":
        return `${tw("find-and-replace-text.errorEmptyFind")} ${tw("find-and-replace-text.fixEmptyFind")}`;
      case "INVALID_REGEX":
        return `${tw("find-and-replace-text.errorInvalidRegex")} ${tw("find-and-replace-text.fixInvalidRegex")}`;
      case "TOO_LARGE":
        return `${tw("find-and-replace-text.errorTooLarge")} ${tw("find-and-replace-text.fixTooLarge")}`;
      default:
        return "";
    }
  };
  const errorText = errorMessage(result.error?.code);
  const ready = text.length > 0 && find.length > 0 && !result.error;
  const matchCount = ready ? result.hits.length : 0;
  const describedBy = errorText ? ERROR_ID : undefined;

  const handleCopy = useCallback(() => {
    if (!ready || !result.output) return;
    void copy(result.output);
  }, [copy, ready, result.output]);
  useCopyShortcut(handleCopy);

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((previous) => (previous ? `${previous}\n${clip}` : clip));
        resetCopy();
      }
    } catch {
      showNotice(tw("find-and-replace-text.pasteUnavailable"));
    }
  };

  const handleSample = () => {
    setText(SAMPLE_TEXT);
    setFind(SAMPLE_FIND);
    setReplacement(SAMPLE_REPLACE);
    update(DEFAULT_REPLACE_OPTIONS);
    resetCopy();
    clearNotice();
  };

  const handleReset = () => {
    setText("");
    setFind("");
    setReplacement("");
    resetOptions();
    resetCopy();
    clearNotice();
  };

  const switchCase = () => {
    update({ caseSensitive: !options.caseSensitive });
    resetCopy();
  };
  const switchWord = () => {
    update({ wholeWord: !options.wholeWord });
    resetCopy();
  };
  const switchRegex = () => {
    update({ regexMode: !options.regexMode });
    resetCopy();
  };

  return (
    <ToolShell
      title={tw("find-and-replace-text.title")}
      icon="Regex"
      sampleLabel={tw("find-and-replace-text.trySample")}
      resetLabel={tw("find-and-replace-text.reset")}
      privacyLabel={tw("find-and-replace-text.privacyRibbon")}
      shortcutHint={tw("find-and-replace-text.shortcutHint")}
      notice={notice}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="fr-input-title"
          title={tw("find-and-replace-text.inputTitle")}
          actions={
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("find-and-replace-text.paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText("");
                  resetCopy();
                }}
                disabled={!text}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("clear")}
              </Button>
            </>
          }
        >
          <div>
            <label className="tp-tool-label" htmlFor="fr-text">
              {tw("find-and-replace-text.textLabel")}
            </label>
            <textarea
              id="fr-text"
              className="tp-tool-editor"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                resetCopy();
              }}
              placeholder={t("startTyping")}
              spellCheck={false}
            />
          </div>

          <div className="tp-tool-group">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 12,
              }}
            >
              <div className="flex flex-col gap-2">
                <label className="tp-tool-label" htmlFor="fr-find">
                  {tw("find-and-replace-text.findLabel")}
                </label>
                <input
                  id="fr-find"
                  className="tp-tool-field"
                  value={find}
                  onChange={(event) => {
                    setFind(event.target.value);
                    resetCopy();
                  }}
                  placeholder={tw("find-and-replace-text.findPlaceholder")}
                  aria-invalid={Boolean(errorText)}
                  aria-describedby={describedBy}
                  spellCheck={false}
                  autoComplete="off"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="tp-tool-label" htmlFor="fr-replace">
                  {tw("find-and-replace-text.replaceLabel")}
                </label>
                <input
                  id="fr-replace"
                  className="tp-tool-field"
                  value={replacement}
                  onChange={(event) => {
                    setReplacement(event.target.value);
                    resetCopy();
                  }}
                  placeholder={tw("find-and-replace-text.replacePlaceholder")}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="tp-tool-group">
            <p className="tp-tool-group-title">{tw("find-and-replace-text.optionsTitle")}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <InlineSwitch
                id="fr-case"
                label={tw("find-and-replace-text.caseSensitive")}
                checked={options.caseSensitive}
                onChange={switchCase}
              />
              <InlineSwitch
                id="fr-word"
                label={tw("find-and-replace-text.wholeWord")}
                checked={options.wholeWord}
                onChange={switchWord}
              />
              <InlineSwitch
                id="fr-regex"
                label={tw("find-and-replace-text.regexMode")}
                checked={options.regexMode}
                onChange={switchRegex}
              />
            </div>
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
          id="fr-result-title"
          title={t("result")}
          result
          actions={
            <>
              {ready ? (
                <ToolBadge tone="accent">
                  {tw("find-and-replace-text.matchCount", { count: matchCount })}
                </ToolBadge>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!ready || !result.output}
              >
                {copied ? t("copied") : t("copy")}
              </Button>
              <DownloadButton
                content={ready ? result.output : null}
                fileName="replaced-text.txt"
                label={t("download")}
              />
            </>
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Regex aria-hidden="true" />}
                title={
                  errorText
                    ? tw("find-and-replace-text.errorTitle")
                    : tw("find-and-replace-text.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("find-and-replace-text.errorEmptyHint")
                    : tw("find-and-replace-text.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              {matchCount === 0 ? (
                <ToolEmpty
                  icon={<Regex aria-hidden="true" />}
                  title={tw("find-and-replace-text.noMatchesTitle")}
                  hint={tw("find-and-replace-text.noMatchesHint")}
                />
              ) : (
                <>
                  <div>
                    <p className="tp-tool-label">{tw("find-and-replace-text.previewLabel")}</p>
                    <p className="tp-tool-code" style={{ minHeight: 120 }}>
                      {result.segments.map((segment, index) =>
                        segment.replaced ? (
                          <mark
                            key={index}
                            className="tp-tool-highlight"
                            data-tone="success"
                          >
                            {segment.text}
                          </mark>
                        ) : (
                          <span key={index}>{segment.text}</span>
                        ),
                      )}
                    </p>
                  </div>
                  {result.truncated ? (
                    <p className="tp-tool-hint">{tw("find-and-replace-text.truncatedHint")}</p>
                  ) : null}
                </>
              )}
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
