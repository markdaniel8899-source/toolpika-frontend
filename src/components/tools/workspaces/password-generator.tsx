"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { CheckboxRow, CopyButton, OutputEmpty, Stat } from "../workspace-ui";
import {
  assessPassword,
  BAND_LABEL_KEYS,
  CHECK_KEYS,
  CHECK_ORDER,
} from "./password-strength-checker.logic";

/**
 * Character sets exclude look-alike characters (i, l, 1, L, o, 0, O) so a
 * generated password can be read aloud or typed from a screen without
 * guessing.
 */
const SETS = {
  lower: "abcdefghjkmnpqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?",
};

interface Options {
  length: number;
  lower: boolean;
  upper: boolean;
  numbers: boolean;
  symbols: boolean;
}

const DEFAULT_OPTIONS: Options = {
  length: 20,
  lower: true,
  upper: true,
  numbers: true,
  symbols: true,
};

function randomInt(max: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function pick(source: string) {
  return source[randomInt(source.length)];
}

function shuffle(value: string) {
  const characters = [...value];

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [characters[index], characters[target]] = [characters[target], characters[index]];
  }

  return characters.join("");
}

function buildPassword(options: Options) {
  const groups = [
    options.lower ? SETS.lower : "",
    options.upper ? SETS.upper : "",
    options.numbers ? SETS.numbers : "",
    options.symbols ? SETS.symbols : "",
  ].filter(Boolean);

  if (groups.length === 0) return "";

  const pool = groups.join("");
  // One character from every selected group, then fill the rest.
  const required = groups.map((group) => pick(group));
  const rest = Array.from(
    { length: Math.max(0, options.length - required.length) },
    () => pick(pool)
  );

  return shuffle([...required, ...rest].join(""));
}

export default function PasswordGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState("");

  const options: Options = {
    length,
    lower: useLower,
    upper: useUpper,
    numbers: useNumbers,
    symbols: useSymbols,
  };

  // Generate once after hydration: the server and client would otherwise
  // produce different random strings and break the markup match.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPassword(buildPassword(DEFAULT_OPTIONS)));

    return () => cancelAnimationFrame(frame);
  }, []);

  const variety =
    Number(useLower) + Number(useUpper) + Number(useNumbers) + Number(useSymbols);
  const noGroups = variety === 0;

  const assessment = useMemo(
    () => assessPassword(password, 12),
    [password],
  );

  const handleSample = () => {
    setLength(DEFAULT_OPTIONS.length);
    setUseLower(DEFAULT_OPTIONS.lower);
    setUseUpper(DEFAULT_OPTIONS.upper);
    setUseNumbers(DEFAULT_OPTIONS.numbers);
    setUseSymbols(DEFAULT_OPTIONS.symbols);
    setPassword(buildPassword(DEFAULT_OPTIONS));
  };

  const handleReset = () => {
    setLength(DEFAULT_OPTIONS.length);
    setUseLower(DEFAULT_OPTIONS.lower);
    setUseUpper(DEFAULT_OPTIONS.upper);
    setUseNumbers(DEFAULT_OPTIONS.numbers);
    setUseSymbols(DEFAULT_OPTIONS.symbols);
    setPassword(buildPassword(DEFAULT_OPTIONS));
  };

  return (
    <WorkspaceLayout
      title={tw("password-generator.title")}
      icon="Shield"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={password ? `${password.length} ${t("characters")}` : undefined}
      input={
        <div className="tp-password-input">
          <div className="tp-password-length">
            <div className="tp-password-length-head">
              <label htmlFor="password-length">{t("passwordLength")}</label>
              <span className="tp-password-length-value">{length}</span>
            </div>
            <input
              id="password-length"
              type="range"
              min={8}
              max={64}
              step={1}
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="tp-password-range"
            />
          </div>

          <div className="tp-password-groups">
            <CheckboxRow
              id="password-upper"
              label={t("includeUppercase")}
              checked={useUpper}
              onChange={setUseUpper}
            />
            <CheckboxRow
              id="password-lower"
              label={t("includeLowercase")}
              checked={useLower}
              onChange={setUseLower}
            />
            <CheckboxRow
              id="password-numbers"
              label={t("includeNumbers")}
              checked={useNumbers}
              onChange={setUseNumbers}
            />
            <CheckboxRow
              id="password-symbols"
              label={t("includeSymbols")}
              checked={useSymbols}
              onChange={setUseSymbols}
            />
          </div>

          <Button
            type="button"
            className="tp-password-generate"
            disabled={noGroups}
            onClick={() => setPassword(buildPassword(options))}
          >
            <RefreshCw aria-hidden="true" />
            {t("generate")}
          </Button>
          {noGroups ? (
            <p role="alert" className="tp-workspace-error">
              {t("error")}
            </p>
          ) : null}
        </div>
      }
      output={
        password ? (
          <div className="tp-password-output" aria-live="polite">
            <code className="tp-password-value">{password}</code>

            <dl className="tp-password-stats">
              <Stat label={t("passwordLength")} value={password.length} />
              <Stat label={t("strength")} value={tw(BAND_LABEL_KEYS[assessment.band])} />
            </dl>

            <div className="tp-tool-group tp-tool-group--flush">
              <div className="tp-meta-pill" aria-live="polite">
                <span>{tw("password-strength-checker.scoreLabel")}</span>
                <strong dir="ltr">{assessment.score}/4</strong>
                <span aria-hidden="true">•</span>
                <span>{tw("password-strength-checker.entropyLabel")}</span>
                <strong dir="ltr">{assessment.entropyBits}</strong>
              </div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CHECK_ORDER.map((key) => (
                  <li className="tp-check-row" key={key}>
                    {assessment.checks[key]
                      ? <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                      : <X className="h-3.5 w-3.5 text-[var(--danger)]" aria-hidden="true" />}
                    <span className="tp-check-label">{tw(CHECK_KEYS[key])}</span>
                  </li>
                ))}
              </ul>
            </div>

            <CopyButton
              text={password}
              label={t("copy")}
              copiedLabel={t("copied")}
              className="tp-password-copy"
            />
          </div>
        ) : (
          <OutputEmpty message={t("generate")} className="min-h-[200px]" />
        )
      }
    />
  );
}
