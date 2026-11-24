"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { CheckboxRow, CopyButton, OutputEmpty } from "../workspace-ui";

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
  const strength =
    length >= 16 && variety >= 3
      ? "strengthStrong"
      : length >= 12 && variety >= 2
        ? "strengthGood"
        : "strengthWeak";

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
      onReset={handleReset}
      onSample={handleSample}
      status={password ? tw("statusReady") : tw("statusIdle")}
      statusRight={password ? `${password.length} ${t("passwordLength")}` : undefined}
      input={
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-length"
                className="text-sm font-medium text-[var(--text)]"
              >
                {t("passwordLength")}
              </label>
              <span className="text-sm font-bold tabular-nums">{length}</span>
            </div>
            <input
              id="password-length"
              type="range"
              min={8}
              max={64}
              step={1}
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              className="w-full accent-[var(--accent-fill)]"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
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
          <div className="flex flex-col gap-4" aria-live="polite">
            <code className="block break-all rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4 font-mono text-[16px] leading-[1.6] text-[var(--text)]">
              {password}
            </code>

            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                <dt className="text-xs text-[var(--muted)]">{t("passwordLength")}</dt>
                <dd className="mt-1 font-sans text-[24px] font-bold leading-none tabular-nums">
                  {password.length}
                </dd>
              </div>
              <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                <dt className="text-xs text-[var(--muted)]">{t("strength")}</dt>
                <dd className="mt-1 text-sm font-bold text-[var(--success)]">
                  {t(strength)}
                </dd>
              </div>
            </dl>

            <CopyButton text={password} label={t("copy")} copiedLabel={t("copied")} />
          </div>
        ) : (
          <OutputEmpty message={t("generate")} className="min-h-[200px]" />
        )
      }
    />
  );
}
