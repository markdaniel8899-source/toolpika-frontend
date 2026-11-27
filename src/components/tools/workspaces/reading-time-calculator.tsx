"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
} from "@/components/tools/workspace-ui";
import {
  calculateReading,
  DEFAULTS,
  formatDuration,
} from "./reading-time-calculator.logic";

const ERROR_ID = "tp-reading-time-error";

const SAMPLE_TEXT = [
  "Reading time is an estimate, not a stopwatch reading. It depends on how dense the text is and how familiar the reader is with the topic.",
  "",
  "Enter a passage below, set a reading speed and a speaking speed, then compare the two times. The same passage always takes longer to say aloud than to read silently.",
].join("\n");

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function ReadingTimeCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [text, setText] = useState("");
  const [readingWpm, setReadingWpm] = useState(String(DEFAULTS.readingWpm));
  const [speakingWpm, setSpeakingWpm] = useState(String(DEFAULTS.speakingWpm));

  const debouncedText = useDebounced(text, 180);
  const parsedReading = parseValue(readingWpm);
  const parsedSpeaking = parseValue(speakingWpm);
  const wpmInvalid = [readingWpm, speakingWpm].some(
    (value) => value.trim() !== "" && parseValue(value) === null,
  );

  const result = useMemo(
    () =>
      parsedReading !== null && parsedSpeaking !== null
        ? calculateReading(debouncedText, parsedReading, parsedSpeaking)
        : null,
    [debouncedText, parsedReading, parsedSpeaking],
  );

  const errorCode = result?.error?.code;
  const errorText = wpmInvalid || errorCode === "INVALID_WPM"
    ? `${tw("reading-time-calculator.errorWpm")} ${tw("reading-time-calculator.fixWpm")}`
    : errorCode === "TOO_LARGE"
      ? `${tw("reading-time-calculator.errorTooLarge")} ${tw("reading-time-calculator.fixTooLarge")}`
      : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = debouncedText.trim().length > 0 && !!result && !result.error && !wpmInvalid;

  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const minuteLabel = tw("reading-time-calculator.unitMinutes");
  const secondLabel = tw("reading-time-calculator.unitSeconds");

  const readingTime = result && !result.error
    ? formatDuration(result.readingSeconds, minuteLabel, secondLabel)
    : "";
  const speakingTime = result && !result.error
    ? formatDuration(result.speakingSeconds, minuteLabel, secondLabel)
    : "";

  const summary = useMemo(() => {
    if (!ready || !result) return "";
    return [
      tw("reading-time-calculator.summaryLabel"),
      `${t("words")}: ${whole.format(result.words)}`,
      `${t("characters")}: ${whole.format(result.characters)}`,
      `${t("charactersNoSpaces")}: ${whole.format(result.charactersNoSpaces)}`,
      `${tw("reading-time-calculator.heroLabel")}: ${readingTime}`,
      `${tw("reading-time-calculator.speakingLabel")}: ${speakingTime}`,
      "",
      tw("reading-time-calculator.assumptionNote"),
    ].join("\n");
  }, [ready, result, whole, t, tw, readingTime, speakingTime]);

  const handleCopy = useCallback(() => {
    if (summary) void navigator.clipboard.writeText(summary).catch(() => {});
  }, [summary]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setText(SAMPLE_TEXT);
    setReadingWpm(String(DEFAULTS.readingWpm));
    setSpeakingWpm(String(DEFAULTS.speakingWpm));
  };

  const handleClear = () => {
    setText("");
    setReadingWpm(String(DEFAULTS.readingWpm));
    setSpeakingWpm(String(DEFAULTS.speakingWpm));
  };

  return (
    <ToolShell
      title={tw("reading-time-calculator.title")}
      icon="Clock"
      sampleLabel={tw("reading-time-calculator.trySample")}
      resetLabel={tw("reading-time-calculator.clear")}
      privacyLabel={tw("reading-time-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleClear}
      input={
        <ToolPane
          id="tp-reading-input-title"
          title={tw("reading-time-calculator.inputTitle")}
          hint={tw("reading-time-calculator.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setText("")}
              disabled={!text}
              aria-label={t("clear")}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <div>
            <label className="tp-tool-label" htmlFor="tp-reading-text">
              {tw("reading-time-calculator.textLabel")}
            </label>
            <textarea
              id="tp-reading-text"
              className="tp-tool-editor"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={t("startTyping")}
              spellCheck={false}
              aria-invalid={Boolean(errorText)}
              aria-describedby={describedBy}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("reading-time-calculator.readingWpmLabel")}
              htmlFor="tp-reading-wpm"
              hint={tw("reading-time-calculator.readingWpmHint")}
            >
              <NumberStepper
                id="tp-reading-wpm"
                value={readingWpm}
                min={1}
                max={1000}
                step={10}
                inputMode="numeric"
                ariaLabel={tw("reading-time-calculator.readingWpmLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setReadingWpm}
              />
            </ToolField>

            <ToolField
              label={tw("reading-time-calculator.speakingWpmLabel")}
              htmlFor="tp-speaking-wpm"
              hint={tw("reading-time-calculator.speakingWpmHint")}
            >
              <NumberStepper
                id="tp-speaking-wpm"
                value={speakingWpm}
                min={1}
                max={1000}
                step={10}
                inputMode="numeric"
                ariaLabel={tw("reading-time-calculator.speakingWpmLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setSpeakingWpm}
              />
            </ToolField>
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
          id="tp-reading-result-title"
          title={t("result")}
          hint={tw("reading-time-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={summary}
              label={tw("reading-time-calculator.copySummary")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !result ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Clock aria-hidden="true" />}
                title={errorText
                  ? tw("reading-time-calculator.errorTitle")
                  : tw("reading-time-calculator.emptyTitle")}
                hint={errorText
                  ? tw("reading-time-calculator.errorEmptyHint")
                  : tw("reading-time-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("reading-time-calculator.heroLabel")}</span>
                <output dir="ltr" className="tp-tool-pill">{readingTime}</output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("reading-time-calculator.speakingLabel")}
                  value={speakingTime}
                />
                <Stat label={t("words")} value={whole.format(result.words)} />
                <Stat label={t("characters")} value={whole.format(result.characters)} />
                <Stat
                  label={t("charactersNoSpaces")}
                  value={whole.format(result.charactersNoSpaces)}
                />
              </dl>

              <p className="tp-tool-hint">{tw("reading-time-calculator.assumptionNote")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
