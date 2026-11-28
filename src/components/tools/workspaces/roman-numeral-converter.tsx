"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  HeroValue,
  ToolBadge,
  ToolEmpty,
  selectClassName,
  useCopyShortcut,
} from "../workspace-ui";
import {
  convertRoman,
  fromRoman,
  ROMAN_EXAMPLES,
  toRoman,
  type RomanErrorCode,
} from "./roman-numeral-converter.logic";

const ERROR_ID = "tp-roman-error";

/** Show each populated decimal place as its Roman group and value. */
function breakdown(value: number): string {
  const places = [
    Math.floor(value / 1000) * 1000,
    Math.floor((value % 1000) / 100) * 100,
    Math.floor((value % 100) / 10) * 10,
    value % 10,
  ].filter((amount) => amount > 0);
  return places
    .map((amount) => `${toRoman(amount)} (${amount})`)
    .join(" + ");
}

export default function RomanNumeralConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const numberRef = useRef<HTMLInputElement | null>(null);
  const [numberText, setNumberText] = useState("");
  const [romanText, setRomanText] = useState("");
  const [active, setActive] = useState<"number" | "roman">("number");

  const source = active === "number" ? numberText : romanText;
  const conversion = useMemo(
    () => (source.trim() ? convertRoman(source) : null),
    [source],
  );
  const ready = conversion?.ok ? conversion : null;
  const code: RomanErrorCode | null = conversion && !conversion.ok ? conversion.code : null;

  const resultText = useMemo(() => {
    if (!ready) return "";
    return ready.direction === "number" ? ready.numeral : String(ready.value);
  }, [ready]);

  const breakdownText = useMemo(
    () => (ready ? `${ready.value} = ${breakdown(ready.value)}` : ""),
    [ready],
  );

  const handleCopy = () => {
    if (!resultText) return;
    void navigator.clipboard.writeText(resultText).catch(() => undefined);
  };
  useCopyShortcut(handleCopy);

  const onNumberChange = (value: string) => {
    setActive("number");
    setNumberText(value);
    if (!value.trim()) {
      setRomanText("");
      return;
    }
    const parsed = Number(value);
    setRomanText(Number.isInteger(parsed) ? (toRoman(parsed) ?? "") : "");
  };

  const onRomanChange = (value: string) => {
    setActive("roman");
    setRomanText(value);
    if (!value.trim()) {
      setNumberText("");
      return;
    }
    const parsed = fromRoman(value);
    setNumberText(parsed === null ? "" : String(parsed));
  };

  const applyExample = (value: number) => {
    setNumberText(String(value));
    setRomanText(toRoman(value) ?? "");
    setActive("number");
  };

  const clearAll = () => {
    setNumberText("");
    setRomanText("");
    setActive("number");
    numberRef.current?.focus();
  };

  const handleSample = () => {
    applyExample(1994);
    numberRef.current?.focus();
  };

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
  const errorText = code ? `${messages[code].error} ${messages[code].fix}` : "";

  return (
    <div className="tp-tool mx-auto w-full max-w-3xl">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Type" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("roman-numeral-converter.title")}</span>
            <span className="tp-tool-subtitle">{tw("roman-numeral-converter.shortDesc")}</span>
          </span>
        </div>
        <ToolBadge tone="accent">{tw("roman-numeral-converter.heroNote")}</ToolBadge>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
            {tw("roman-numeral-converter.trySample")}
          </Button>
        </div>
      </div>

      {errorText ? (
        <p className="tp-tool-notice" id={ERROR_ID} data-tone="danger" role="alert" aria-live="polite">
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3"
          aria-labelledby="tp-roman-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-roman-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("roman-numeral-converter.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("roman-numeral-converter.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="tp-roman-number" className="text-sm font-medium text-[var(--text)]">
                {tw("roman-numeral-converter.numberLabel")}
              </label>
              <input
                id="tp-roman-number"
                ref={numberRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={numberText}
                onChange={(event) => onNumberChange(event.target.value)}
                placeholder={tw("roman-numeral-converter.placeholder")}
                className={`${selectClassName} font-mono text-[13px]`}
                dir="ltr"
                spellCheck={false}
                aria-invalid={Boolean(code) || undefined}
                aria-describedby={code ? ERROR_ID : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="tp-roman-roman" className="text-sm font-medium text-[var(--text)]">
                {tw("roman-numeral-converter.romanLabel")}
              </label>
              <input
                id="tp-roman-roman"
                type="text"
                inputMode="text"
                autoComplete="off"
                value={romanText}
                onChange={(event) => onRomanChange(event.target.value)}
                placeholder={tw("roman-numeral-converter.placeholder")}
                className={`${selectClassName} font-mono text-[13px]`}
                dir="ltr"
                spellCheck={false}
                aria-invalid={Boolean(code) || undefined}
                aria-describedby={code ? ERROR_ID : undefined}
              />
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("roman-numeral-converter.examplesLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {ROMAN_EXAMPLES.map((example) => (
                <Button
                  key={example.value}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => applyExample(example.value)}
                >
                  {`${example.numeral} = ${example.value}`}
                </Button>
              ))}
            </div>
            <p className="tp-tool-hint">{tw("roman-numeral-converter.examplesHint")}</p>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3"
          aria-labelledby="tp-roman-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-roman-result-title" className="text-sm font-semibold text-[var(--text)]">
                {t("result")}
              </h3>
              <p className="tp-tool-hint">{tw("roman-numeral-converter.resultHint")}</p>
            </div>
            {ready ? (
              <CopyButton text={resultText} label={t("copy")} copiedLabel={t("copied")} />
            ) : null}
          </div>

          {ready ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <HeroValue
                label={ready.direction === "number"
                  ? tw("roman-numeral-converter.heroNumeral")
                  : tw("roman-numeral-converter.heroValue")}
                value={resultText}
                note={tw("roman-numeral-converter.heroNote")}
              />
              <div className="tp-meta-pill">
                <span>{tw("roman-numeral-converter.breakdownLabel")}</span>
                <strong dir="ltr">{breakdownText}</strong>
              </div>
              <div className="tp-meta-pill">
                <span>{tw("roman-numeral-converter.statInput")}</span>
                <strong dir="ltr">{ready.direction === "number" ? numberText.trim() : romanText.trim().toUpperCase()}</strong>
                <span aria-hidden="true">•</span>
                <span>{tw("roman-numeral-converter.statDirection")}</span>
                <strong dir="ltr">{ready.direction === "number"
                  ? tw("roman-numeral-converter.directionNumber")
                  : tw("roman-numeral-converter.directionRoman")}</strong>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Type" />}
                title={tw("roman-numeral-converter.emptyTitle")}
                hint={tw("roman-numeral-converter.emptyHint")}
              />
            </div>
          )}
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
