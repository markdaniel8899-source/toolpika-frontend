"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Hash, X } from "lucide-react";
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
  countCharacters,
  DEFAULT_FREQUENCY_OPTIONS,
  formatFrequencyText,
  type FrequencyErrorCode,
  type FrequencyOptions,
  type FrequencyRow,
} from "./character-frequency-counter.logic";

const SAMPLE_TEXT = "banana bandana banana\nBanana!";
const ERROR_ID = "tp-frequency-error";

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
        className={cn("tp-tool-switch", checked && "is-checked")}
      >
        <span className="tp-tool-switch-knob" aria-hidden="true" />
      </button>
      <label htmlFor={id} className="cursor-pointer text-xs text-[var(--text)]">
        {label}
      </label>
    </div>
  );
}

export default function CharacterFrequencyCounter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [text, setText] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<FrequencyOptions>(
    "toolpika:character-frequency-counter",
    DEFAULT_FREQUENCY_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { copied, copy, reset: resetCopy } = useCopyFeedback();

  const input = useDebounced(
    useMemo(() => ({ text, options }), [text, options]),
    180,
  );

  const result = useMemo(
    () => countCharacters(input.text, input.options),
    [input],
  );

  const errorMessage = (code: FrequencyErrorCode | undefined) => {
    switch (code) {
      case "TOO_LARGE":
        return `${tw("character-frequency-counter.errorTooLarge")} ${tw("character-frequency-counter.fixTooLarge")}`;
      default:
        return "";
    }
  };
  const errorText = errorMessage(result.error?.code);
  const ready = text.length > 0 && !result.error;
  const describedBy = errorText ? ERROR_ID : undefined;

  const labelFor = useCallback(
    (row: FrequencyRow) => {
      switch (row.whitespace) {
        case "space":
          return tw("character-frequency-counter.spaceLabel");
        case "tab":
          return tw("character-frequency-counter.tabLabel");
        case "newline":
          return tw("character-frequency-counter.newlineLabel");
        case "return":
          return tw("character-frequency-counter.returnLabel");
        default:
          return row.char;
      }
    },
    [tw],
  );

  const tableText = useMemo(
    () =>
      formatFrequencyText(result.rows, labelFor, {
        character: tw("character-frequency-counter.columnCharacter"),
        count: tw("character-frequency-counter.columnCount"),
        share: tw("character-frequency-counter.columnShare"),
      }),
    [labelFor, result.rows, tw],
  );

  const handleCopy = useCallback(() => {
    if (!ready || !tableText) return;
    void copy(tableText);
  }, [copy, ready, tableText]);
  useCopyShortcut(handleCopy);

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText((previous) => (previous ? `${previous}\n${clip}` : clip));
        resetCopy();
      }
    } catch {
      showNotice(tw("character-frequency-counter.pasteUnavailable"));
    }
  };

  const handleSample = () => {
    setText(SAMPLE_TEXT);
    update(DEFAULT_FREQUENCY_OPTIONS);
    resetCopy();
    clearNotice();
  };

  const handleReset = () => {
    setText("");
    resetOptions();
    resetCopy();
    clearNotice();
  };

  return (
    <ToolShell
      title={tw("character-frequency-counter.title")}
      icon="Hash"
      sampleLabel={tw("character-frequency-counter.trySample")}
      resetLabel={tw("character-frequency-counter.reset")}
      privacyLabel={tw("character-frequency-counter.privacyRibbon")}
      notice={notice}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="cfc-input-title"
          title={tw("character-frequency-counter.inputTitle")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button type="button" variant="ghost" size="icon" onClick={() => void handlePaste()} aria-label={tw("character-frequency-counter.paste")}>
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setText("");
                  resetCopy();
                }}
                disabled={!text}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
        >
          <div>
            <label className="tp-tool-label" htmlFor="cfc-text">
              {tw("character-frequency-counter.textLabel")}
            </label>
            <textarea
              id="cfc-text"
              className="tp-tool-editor"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                resetCopy();
              }}
              placeholder={t("startTyping")}
              aria-describedby={describedBy}
              spellCheck={false}
            />
          </div>

          <div className="tp-tool-group">
            <p className="tp-tool-group-title">{tw("character-frequency-counter.optionsTitle")}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <InlineSwitch
                id="cfc-case"
                label={tw("character-frequency-counter.ignoreCase")}
                checked={options.ignoreCase}
                onChange={() => {
                  update({ ignoreCase: !options.ignoreCase });
                  resetCopy();
                }}
              />
              <InlineSwitch
                id="cfc-spaces"
                label={tw("character-frequency-counter.ignoreSpaces")}
                checked={options.ignoreSpaces}
                onChange={() => {
                  update({ ignoreSpaces: !options.ignoreSpaces });
                  resetCopy();
                }}
              />
              <InlineSwitch
                id="cfc-punctuation"
                label={tw("character-frequency-counter.includePunctuation")}
                checked={options.includePunctuation}
                onChange={() => {
                  update({ includePunctuation: !options.includePunctuation });
                  resetCopy();
                }}
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
          id="cfc-result-title"
          title={t("result")}
          result
          actions={
            <>
              {ready ? (
                <ToolBadge tone="accent">
                  {tw("character-frequency-counter.totalCount", { count: result.total })}
                </ToolBadge>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!ready || result.rows.length === 0}
              >
                {copied ? t("copied") : t("copy")}
              </Button>
              <DownloadButton
                content={ready ? tableText : null}
                fileName="character-frequency.txt"
                label={t("download")}
              />
            </>
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Hash aria-hidden="true" />}
                title={
                  errorText
                    ? tw("character-frequency-counter.errorTitle")
                    : tw("character-frequency-counter.emptyTitle")
                }
                hint={
                  errorText
                    ? tw("character-frequency-counter.errorEmptyHint")
                    : tw("character-frequency-counter.emptyHint")
                }
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              {result.rows.length === 0 ? (
                <ToolEmpty
                  icon={<Hash aria-hidden="true" />}
                  title={tw("character-frequency-counter.emptyTitle")}
                  hint={tw("character-frequency-counter.emptyHint")}
                />
              ) : (
                <div
                  className="tp-tool-list"
                  role="table"
                  aria-label={tw("character-frequency-counter.tableLabel")}
                >
                  <div className="tp-tool-row" role="row">
                    <span role="columnheader">{tw("character-frequency-counter.columnCharacter")}</span>
                    <span role="columnheader">{tw("character-frequency-counter.columnCount")}</span>
                    <span role="columnheader">{tw("character-frequency-counter.columnShare")}</span>
                  </div>
                  {result.rows.map((row) => (
                    <div className="tp-tool-row" role="row" key={row.key}>
                      <span role="cell" className="tp-tool-pill">
                        {labelFor(row)}
                      </span>
                      <span role="cell">{row.count}</span>
                      <span role="cell">{row.percent}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
