"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  HeroValue,
  Stat,
  ToolEmpty,
  ToolField,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  ROMAN_EXAMPLES,
  convertRoman,
  type RomanErrorCode,
} from "./roman-numeral-converter.logic";

const ERROR_ID = "tp-roman-error";

export default function RomanNumeralConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");

  const conversion = useMemo(() => (input.trim() ? convertRoman(input) : null), [input]);
  const ready = conversion?.ok ? conversion : null;
  const code: RomanErrorCode | null = conversion && !conversion.ok ? conversion.code : null;

  const resultText = useMemo(() => {
    if (!ready) return "";
    return ready.direction === "number"
      ? ready.numeral
      : String(ready.value);
  }, [ready]);

  const handleCopy = useCallback(() => {
    if (!resultText) return;
    void navigator.clipboard.writeText(resultText).catch(() => undefined);
  }, [resultText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => setInput("1994");
  const handleReset = () => setInput("");

  const messages: Record<RomanErrorCode, { error: string; fix: string }> = {
    empty: {
      error: tw("roman-numeral-converter.errorEmpty"),
      fix: tw("roman-numeral-converter.fixEmpty"),
    },
    invalidChars: {
      error: tw("roman-numeral-converter.errorChars"),
      fix: tw("roman-numeral-converter.fixChars"),
    },
    notInteger: {
      error: tw("roman-numeral-converter.errorInteger"),
      fix: tw("roman-numeral-converter.fixInteger"),
    },
    outOfRange: {
      error: tw("roman-numeral-converter.errorRange"),
      fix: tw("roman-numeral-converter.fixRange"),
    },
    tooManyRepeats: {
      error: tw("roman-numeral-converter.errorRepeats"),
      fix: tw("roman-numeral-converter.fixRepeats"),
    },
    badOrder: {
      error: tw("roman-numeral-converter.errorOrder"),
      fix: tw("roman-numeral-converter.fixOrder"),
    },
  };

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Type" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("roman-numeral-converter.title")}</span>
            <span className="tp-tool-subtitle">{tw("roman-numeral-converter.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("roman-numeral-converter.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("roman-numeral-converter.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <section className="tp-tool-pane" aria-labelledby="tp-roman-input-title">
          <div className="tp-tool-pane-head">
            <div className="tp-tool-pane-title">
              <h3 id="tp-roman-input-title">{tw("roman-numeral-converter.inputTitle")}</h3>
              <p className="tp-tool-pane-hint">{tw("roman-numeral-converter.inputHint")}</p>
            </div>
          </div>
          <div className="tp-tool-pane-body">
            <ToolField
              label={tw("roman-numeral-converter.valueLabel")}
              htmlFor="tp-roman-input"
              hint={tw("roman-numeral-converter.valueHint")}
            >
              <input
                id="tp-roman-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={tw("roman-numeral-converter.placeholder")}
                aria-invalid={code ? true : undefined}
                aria-describedby={code ? ERROR_ID : undefined}
                spellCheck={false}
                dir="ltr"
                className="tp-field-input font-mono text-[13px]"
              />
            </ToolField>

            {code ? (
              <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
                {messages[code].error}
                {" "}
                {messages[code].fix}
              </p>
            ) : null}

            <div className="tp-tool-group tp-tool-group--flush">
              <span className="tp-tool-group-title">
                {tw("roman-numeral-converter.examplesLabel")}
              </span>
              <div className="flex flex-wrap gap-2">
                {ROMAN_EXAMPLES.map((example) => (
                  <Button
                    key={example.value}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setInput(String(example.value))}
                  >
                    {`${example.numeral} = ${example.value}`}
                  </Button>
                ))}
              </div>
              <p className="tp-tool-hint">{tw("roman-numeral-converter.examplesHint")}</p>
            </div>
          </div>
        </section>

        <section
          className="tp-tool-pane tp-tool-pane--result"
          aria-labelledby="tp-roman-result-title"
        >
          <div className="tp-tool-pane-head">
            <div className="tp-tool-pane-title">
              <h3 id="tp-roman-result-title">{t("result")}</h3>
              <p className="tp-tool-pane-hint">{tw("roman-numeral-converter.resultHint")}</p>
            </div>
            {ready ? (
              <div className="tp-tool-pane-actions">
                <CopyButton text={resultText} label={t("copy")} copiedLabel={t("copied")} />
              </div>
            ) : null}
          </div>
          <div className="tp-tool-pane-body">
            {ready ? (
              <div className="tp-tool-result" aria-live="polite">
                <HeroValue
                  label={
                    ready.direction === "number"
                      ? tw("roman-numeral-converter.heroNumeral")
                      : tw("roman-numeral-converter.heroValue")
                  }
                  value={resultText}
                  note={tw("roman-numeral-converter.heroNote")}
                />
                <dl className="tp-tool-stats">
                  <Stat
                    label={tw("roman-numeral-converter.statInput")}
                    value={input.trim().toUpperCase()}
                  />
                  <Stat
                    label={tw("roman-numeral-converter.statDirection")}
                    value={
                      ready.direction === "number"
                        ? tw("roman-numeral-converter.directionNumber")
                        : tw("roman-numeral-converter.directionRoman")
                    }
                  />
                </dl>
              </div>
            ) : (
              <div aria-live="polite">
                <ToolEmpty
                  icon={<Type aria-hidden="true" />}
                  title={tw("roman-numeral-converter.emptyTitle")}
                  hint={tw("roman-numeral-converter.emptyHint")}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("roman-numeral-converter.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
