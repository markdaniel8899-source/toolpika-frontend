"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardPaste, Copy, Regex, X } from "lucide-react";
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
import {
  highlightSegments,
  testRegex,
  type RegexErrorCode,
} from "./regex-tester.logic";

const SAMPLE_PATTERN = "(\\w+)@(\\w+\\.\\w+)";
const SAMPLE_TEXT = "Contact ada@example.com or grace@site.org";
const FLAG_ORDER = ["g", "i", "m", "s", "u"] as const;
const ERROR_ID = "tp-regex-error";

export default function RegexTester() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const { options, update } = usePersistedOptions<{ flags: string }>(
    "tp-regex-tester-flags",
    { flags: "" },
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { copied, copy, reset } = useCopyFeedback();

  const debouncedInput = useDebounced(
    useMemo(
      () => ({ pattern, flags: options.flags, text }),
      [pattern, options.flags, text],
    ),
    180,
  );

  const result = useMemo(
    () =>
      testRegex(debouncedInput.pattern, debouncedInput.flags, debouncedInput.text),
    [debouncedInput],
  );

  const segments = useMemo(
    () => highlightSegments(debouncedInput.text, result.matches),
    [debouncedInput.text, result.matches],
  );

  const matchesText = useMemo(() => {
    if (result.matches.length === 0) return "";
    return result.matches
      .map((item, index) =>
        [
          tw("regex-tester.matchHeading", { index: index + 1 }),
          `${tw("regex-tester.textLabel")}: ${item.match}`,
          `${tw("regex-tester.positionLabel")}: ${item.index}`,
          `${tw("regex-tester.groupsLabel")}: ${
            item.groups.length > 0
              ? item.groups.join(", ")
              : tw("regex-tester.noGroups")
          }`,
        ].join("\n"),
      )
      .join("\n\n");
  }, [result.matches, tw]);

  const handleCopy = useCallback(() => {
    if (matchesText) void copy(matchesText);
  }, [copy, matchesText]);
  useCopyShortcut(handleCopy);

  const toggleFlag = (flag: string) => {
    const current = options.flags;
    const next = current.includes(flag)
      ? current.replace(flag, "")
      : `${current}${flag}`;
    update({
      flags: FLAG_ORDER.filter((item) => next.includes(item)).join(""),
    });
    reset();
  };

  const handleSample = () => {
    setPattern(SAMPLE_PATTERN);
    setText(SAMPLE_TEXT);
    update({ flags: "g" });
    reset();
    clearNotice();
  };

  const handleReset = () => {
    setPattern("");
    setText("");
    update({ flags: "" });
    reset();
    clearNotice();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) return;
      setText((previous) => (previous ? `${previous}\n${clip}` : clip));
      reset();
    } catch {
      showNotice(tw("regex-tester.pasteUnavailable"));
    }
  };

  const flagOptions = [
    { value: "g", label: tw("regex-tester.flagGlobal") },
    { value: "i", label: tw("regex-tester.flagIgnore") },
    { value: "m", label: tw("regex-tester.flagMultiline") },
    { value: "s", label: tw("regex-tester.flagDotAll") },
    { value: "u", label: tw("regex-tester.flagUnicode") },
  ];

  const ready = pattern.length > 0 && text.length > 0;
  const errorMessage = (code: RegexErrorCode | undefined) => {
    switch (code) {
      case "INVALID_PATTERN":
        return `${tw("regex-tester.errorPattern")} ${tw("regex-tester.fixPattern")}`;
      case "INVALID_FLAG":
        return `${tw("regex-tester.errorFlag")} ${tw("regex-tester.fixFlag")}`;
      case "TOO_MANY_MATCHES":
        return `${tw("regex-tester.errorLimit")} ${tw("regex-tester.fixLimit")}`;
      default:
        return "";
    }
  };
  const errorText = errorMessage(result.error?.code);
  const describedBy = errorText ? ERROR_ID : undefined;
  const countVisible =
    ready &&
    result.error?.code !== "INVALID_PATTERN" &&
    result.error?.code !== "INVALID_FLAG";

  const preview = (
    <div>
      <p className="tp-tool-label">{tw("regex-tester.previewLabel")}</p>
      <p className="tp-tool-code" style={{ minHeight: 64 }}>
        {segments.map((segment, index) =>
          segment.hit ? (
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
  );

  const matchList = (
    <ul className="tp-tool-list">
      {result.matches.map((item, index) => (
        <li className="tp-tool-row" key={`${item.index}-${index}`}>
          <span className="tp-tool-pill">
            {item.match || tw("regex-tester.emptyMatch")}
          </span>
          <span className="flex flex-wrap justify-end gap-1">
            <span>{tw("regex-tester.indexPill", { index: item.index })}</span>
            {item.groups.map((group, groupIndex) => (
              <span key={groupIndex}>
                {tw("regex-tester.groupPill", {
                  index: groupIndex + 1,
                  value: group || tw("regex-tester.emptyGroup"),
                })}
              </span>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <ToolShell
      title={tw("regex-tester.title")}
      icon="Regex"
      sampleLabel={tw("regex-tester.trySample")}
      resetLabel={tw("regex-tester.reset")}
      privacyLabel={tw("regex-tester.privacyRibbon")}
      notice={notice}
      noticeTone="danger"
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-regex-input-title"
          title={tw("regex-tester.inputTitle")}
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handlePaste()}
              >
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("regex-tester.paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText("");
                  reset();
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
            <label className="tp-tool-label" htmlFor="tp-regex-pattern">
              {tw("regex-tester.patternLabel")}
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              <span className="tp-tool-pill" aria-hidden="true">/</span>
              <input
                id="tp-regex-pattern"
                className="tp-tool-field"
                value={pattern}
                onChange={(event) => {
                  setPattern(event.target.value);
                  reset();
                }}
                placeholder={tw("regex-tester.patternPlaceholder")}
                aria-invalid={
                  result.error?.code === "INVALID_PATTERN" ||
                  result.error?.code === "INVALID_FLAG"
                }
                aria-describedby={describedBy}
                spellCheck={false}
                autoComplete="off"
              />
              <span className="tp-tool-pill" aria-hidden="true">
                /{options.flags}
              </span>
            </div>
          </div>

          <div className="tp-tool-group">
            <p className="tp-tool-group-title">{tw("regex-tester.flagsLabel")}</p>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {flagOptions.map((flag) => (
                <label
                  key={flag.value}
                  className="tp-tool-check"
                  aria-label={flag.label}
                >
                  <input
                    type="checkbox"
                    checked={options.flags.includes(flag.value)}
                    onChange={() => toggleFlag(flag.value)}
                  />
                  <span aria-hidden="true">{flag.value}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="tp-tool-label" htmlFor="tp-regex-text">
              {tw("regex-tester.testStringLabel")}
            </label>
            <textarea
              id="tp-regex-text"
              className="tp-tool-editor"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                reset();
              }}
              placeholder={tw("regex-tester.testStringPlaceholder")}
              aria-describedby={describedBy}
              spellCheck={false}
            />
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-regex-result-title"
          title={t("result")}
          result
          actions={
            <>
              {countVisible ? (
                <ToolBadge tone="accent">
                  {tw("regex-tester.matchCount", {
                    count: result.matches.length,
                  })}
                </ToolBadge>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!matchesText}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? t("copied") : tw("regex-tester.copyMatches")}
              </Button>
              <DownloadButton
                content={matchesText}
                fileName="regex-matches.txt"
                label={tw("regex-tester.downloadMatches")}
              />
            </>
          }
        >
          {!ready ? (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Regex aria-hidden="true" />}
                title={tw("regex-tester.emptyTitle")}
                hint={tw("regex-tester.emptyHint")}
              />
            </div>
          ) : result.error?.code === "TOO_MANY_MATCHES" ? (
            <div className="tp-tool-result" aria-live="polite">
              <p id={ERROR_ID} className="tp-tool-error" role="alert">
                {errorText}
              </p>
              {preview}
              {matchList}
            </div>
          ) : result.error ? (
            <div className="tp-tool-result" aria-live="polite">
              <p id={ERROR_ID} className="tp-tool-error" role="alert">
                {errorText}
              </p>
              <ToolEmpty
                icon={<Regex aria-hidden="true" />}
                title={tw("regex-tester.errorTitle")}
                hint={tw("regex-tester.errorEmptyHint")}
              />
            </div>
          ) : result.matches.length === 0 ? (
            <div className="tp-tool-result" aria-live="polite">
              <ToolEmpty
                icon={<Regex aria-hidden="true" />}
                title={tw("regex-tester.noMatches")}
                hint={tw("regex-tester.noMatchesHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              {preview}
              {matchList}
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
