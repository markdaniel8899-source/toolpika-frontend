"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolField,
  selectClassName,
  useCopyShortcut,
} from "../workspace-ui";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  checkIterations,
  checkPassphrase,
  constantTimeEqual,
  DEFAULT_ITERATIONS,
  formatHash,
  ITERATION_OPTIONS,
  KEY_LENGTH_OPTIONS,
  parseHash,
  PBKDF2_DIGEST_BYTES,
  PBKDF2_SALT_BYTES,
  PBKDF2_SAMPLE,
  type HashMode,
  type Pbkdf2Algorithm,
} from "./bcrypt-generator.logic";

const ERROR_ID = "tp-pbkdf2-error";

type Status = "idle" | "generated" | "matched" | "failed" | "error";
type Issue = "empty" | "short" | "iterations" | "salt" | "hash" | "crypto";
type OutputFormat = "hex" | "base64";

const ERROR_KEYS: Record<Issue, string> = {
  empty: "bcrypt-generator.errorEmpty",
  short: "bcrypt-generator.errorShort",
  iterations: "bcrypt-generator.errorIterations",
  salt: "bcrypt-generator.errorSalt",
  hash: "bcrypt-generator.errorHash",
  crypto: "bcrypt-generator.errorCrypto",
};
const FIX_KEYS: Record<Issue, string> = {
  empty: "bcrypt-generator.fixEmpty",
  short: "bcrypt-generator.fixShort",
  iterations: "bcrypt-generator.fixIterations",
  salt: "bcrypt-generator.fixSalt",
  hash: "bcrypt-generator.fixHashAlgorithm",
  crypto: "bcrypt-generator.fixCrypto",
};

interface RunInput {
  mode: HashMode;
  passphrase: string;
  salt: string;
  iterations: string;
  keyLength: number;
  algorithm: Pbkdf2Algorithm;
  outputFormat: OutputFormat;
  stored: string;
}

interface RunResult {
  status: Status;
  issue: Issue | null;
  derived: string;
  portable: string;
  nextSalt?: string;
}

async function derivePbkdf2(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  algorithm: Pbkdf2Algorithm,
  lengthBits: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: algorithm, salt: new Uint8Array(salt), iterations },
    material,
    lengthBits,
  );
  return new Uint8Array(bits);
}

export default function BcryptGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const runCounter = useRef(0);
  const [mode, setMode] = useState<HashMode>("generate");
  const [passphrase, setPassphrase] = useState("");
  const [salt, setSalt] = useState("");
  const [iterations, setIterations] = useState(String(DEFAULT_ITERATIONS));
  const [keyLength, setKeyLength] = useState<number>(PBKDF2_DIGEST_BYTES);
  const [algorithm, setAlgorithm] = useState<Pbkdf2Algorithm>("SHA-256");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("base64");
  const [stored, setStored] = useState("");
  const [derived, setDerived] = useState("");
  const [portable, setPortable] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [issue, setIssue] = useState<Issue | null>(null);

  const errorText = issue
    ? `${tw(ERROR_KEYS[issue])} ${tw(FIX_KEYS[issue])}`
    : "";
  const storedKeyLength = mode === "verify" ? parseHash(stored)?.keyLength : undefined;
  const statusText =
    status === "generated"
      ? tw("bcrypt-generator.statusGenerated")
      : status === "matched"
        ? tw("bcrypt-generator.statusMatched")
        : status === "failed"
          ? tw("bcrypt-generator.statusFailed")
          : status === "error"
            ? t("error")
            : "";
  const statusTone: "neutral" | "danger" | "warning" | "accent" | "success" =
    status === "matched" || status === "generated"
      ? "success"
      : status === "failed"
        ? "danger"
        : status === "error"
          ? "warning"
          : "neutral";

  useCopyShortcut(() => {
    const text = derived || portable;
    if (text) void navigator.clipboard.writeText(text);
  });

  const run = useCallback(async (input: RunInput) => {
    const id = runCounter.current + 1;
    runCounter.current = id;
    const commit = (result: RunResult) => {
      if (id !== runCounter.current) return;
      setStatus(result.status);
      setIssue(result.issue);
      setDerived(result.derived);
      setPortable(result.portable);
      if (result.nextSalt !== undefined) setSalt(result.nextSalt);
    };
    const formatBytes = (bytes: Uint8Array) =>
      input.outputFormat === "hex" ? bytesToHex(bytes) : bytesToBase64(bytes);

    const passphraseIssue = checkPassphrase(input.passphrase);
    if (passphraseIssue) {
      commit({ status: "error", issue: passphraseIssue, derived: "", portable: "" });
      return;
    }

    if (input.mode === "generate") {
      const rounds = Number(input.iterations);
      if (!checkIterations(rounds)) {
        commit({ status: "error", issue: "iterations", derived: "", portable: "" });
        return;
      }
      const supplied = input.salt.trim();
      const saltBytes = supplied
        ? base64ToBytes(supplied)
        : crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
      if (!saltBytes) {
        commit({ status: "error", issue: "salt", derived: "", portable: "" });
        return;
      }
      const saltText = supplied || bytesToBase64(saltBytes);
      try {
        const raw = await derivePbkdf2(input.passphrase, saltBytes, rounds, input.algorithm, input.keyLength * 8);
        commit({
          status: "generated",
          issue: null,
          derived: formatBytes(raw),
          portable: formatHash({
            iterations: rounds,
            salt: saltText,
            digest: bytesToBase64(raw),
            algorithm: input.algorithm,
            keyLength: raw.byteLength,
          }),
          nextSalt: supplied ? undefined : saltText,
        });
      } catch {
        commit({ status: "error", issue: "crypto", derived: "", portable: "" });
      }
      return;
    }

    const parts = parseHash(input.stored);
    const saltBytes = parts ? base64ToBytes(parts.salt) : null;
    if (!parts || !saltBytes) {
      commit({ status: "error", issue: "hash", derived: "", portable: "" });
      return;
    }
    try {
      const raw = await derivePbkdf2(
        input.passphrase,
        saltBytes,
        parts.iterations,
        parts.algorithm,
        parts.keyLength * 8,
      );
      const matches = constantTimeEqual(bytesToBase64(raw), parts.digest);
      commit({
        status: matches ? "matched" : "failed",
        issue: null,
        derived: formatBytes(raw),
        portable: input.stored.trim(),
      });
    } catch {
      commit({ status: "error", issue: "crypto", derived: "", portable: "" });
    }
  }, []);

  const current = (patch: Partial<RunInput> = {}): RunInput => ({
    mode,
    passphrase,
    salt,
    iterations,
    keyLength,
    algorithm,
    outputFormat,
    stored,
    ...patch,
  });

  const handleClear = () => {
    runCounter.current += 1;
    setPassphrase("");
    setSalt("");
    setStored("");
    setDerived("");
    setPortable("");
    setStatus("idle");
    setIssue(null);
  };

  const handleSample = () => {
    setPassphrase(PBKDF2_SAMPLE);
    void run(current({ passphrase: PBKDF2_SAMPLE }));
  };

  const handleModeChange = (next: HashMode) => {
    runCounter.current += 1;
    setMode(next);
    setDerived("");
    setPortable("");
    setStatus("idle");
    setIssue(null);
  };

  const handleRandomSalt = () => {
    const fresh = bytesToBase64(crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES)));
    setSalt(fresh);
    void run(current({ salt: fresh }));
  };

  const handleOutputFormatChange = (next: OutputFormat) => {
    setOutputFormat(next);
    void run(current({ outputFormat: next }));
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="KeyRound" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("bcrypt-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("bcrypt-generator.shortDesc")}</span>
          </span>
        </div>
        <SegmentedControl<HashMode>
          label={tw("bcrypt-generator.modeLabel")}
          value={mode}
          options={[
            { value: "generate", label: tw("bcrypt-generator.modeGenerate") },
            { value: "verify", label: tw("bcrypt-generator.modeVerify") },
          ]}
          onChange={handleModeChange}
        />
      </div>

      <p className="tp-tool-notice" data-tone="warning" role="status" aria-live="polite">
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
        {tw("bcrypt-generator.algorithmNoteCurrent")}
      </p>

      {errorText ? (
        <p className="tp-tool-notice" id={ERROR_ID} data-tone="danger" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-5"
          aria-labelledby="tp-pbkdf2-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-pbkdf2-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("bcrypt-generator.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("bcrypt-generator.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
                {tw("bcrypt-generator.sampleAction")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <ToolField
            label={tw("bcrypt-generator.passphraseLabel")}
            htmlFor="tp-pbkdf2-passphrase"
            hint={tw("bcrypt-generator.passphraseHint")}
          >
            <input
              id="tp-pbkdf2-passphrase"
              type="password"
              className={selectClassName}
              dir="ltr"
              autoComplete="new-password"
              value={passphrase}
              placeholder={tw("bcrypt-generator.passphrasePlaceholder")}
              aria-invalid={Boolean(errorText)}
              aria-describedby={errorText ? ERROR_ID : undefined}
              onChange={(event) => {
                const value = event.target.value;
                setPassphrase(value);
                void run(current({ passphrase: value }));
              }}
            />
          </ToolField>

          {mode === "generate" ? (
            <>
              <ToolField
                label={tw("bcrypt-generator.saltLabel")}
                htmlFor="tp-pbkdf2-salt"
                hint={tw("bcrypt-generator.saltHint")}
              >
                <div className="flex items-center gap-2">
                  <input
                    id="tp-pbkdf2-salt"
                    className={`${selectClassName} min-w-0 flex-1`}
                    dir="ltr"
                    autoComplete="off"
                    spellCheck={false}
                    value={salt}
                    placeholder={tw("bcrypt-generator.saltPlaceholder")}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSalt(value);
                      void run(current({ salt: value }));
                    }}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={handleRandomSalt}>
                    {tw("bcrypt-generator.randomSalt")}
                  </Button>
                </div>
              </ToolField>

              <ToolField
                label={tw("bcrypt-generator.iterationsLabel")}
                htmlFor="tp-pbkdf2-iterations"
                hint={tw("bcrypt-generator.iterationsHint")}
              >
                <select
                  id="tp-pbkdf2-iterations"
                  className={selectClassName}
                  value={iterations}
                  onChange={(event) => {
                    const value = event.target.value;
                    setIterations(value);
                    void run(current({ iterations: value }));
                  }}
                >
                  {ITERATION_OPTIONS.map((value) => (
                    <option key={value} value={value}>{value.toLocaleString("en-US")}</option>
                  ))}
                </select>
              </ToolField>

              <details className="tp-tool-group tp-tool-group--flush">
                <summary className="tp-tool-group-title cursor-pointer">
                  {tw("bcrypt-generator.advancedOptions")}
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <ToolField
                    label={tw("bcrypt-generator.keyLengthLabel")}
                    htmlFor="tp-pbkdf2-key-length"
                    hint={tw("bcrypt-generator.keyLengthHint")}
                  >
                    <select
                      id="tp-pbkdf2-key-length"
                      className={selectClassName}
                      value={keyLength}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setKeyLength(value);
                        void run(current({ keyLength: value }));
                      }}
                    >
                      {KEY_LENGTH_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {tw("bcrypt-generator.byteCount", { count: value })}
                        </option>
                      ))}
                    </select>
                  </ToolField>
                  <div className="tp-tool-group tp-tool-group--flush">
                    <span className="tp-tool-group-title">{tw("bcrypt-generator.algorithmLabel")}</span>
                    <SegmentedControl<Pbkdf2Algorithm>
                      label={tw("bcrypt-generator.algorithmLabel")}
                      value={algorithm}
                      options={[
                        { value: "SHA-256", label: tw("bcrypt-generator.algorithmSha256") },
                        { value: "SHA-512", label: tw("bcrypt-generator.algorithmSha512") },
                      ]}
                      onChange={(next) => {
                        setAlgorithm(next);
                        void run(current({ algorithm: next }));
                      }}
                    />
                  </div>
                </div>
              </details>
            </>
          ) : (
            <ToolField
              label={tw("bcrypt-generator.hashLabel")}
              htmlFor="tp-pbkdf2-hash"
              hint={tw("bcrypt-generator.hashHint")}
            >
              <textarea
                id="tp-pbkdf2-hash"
                className={`${selectClassName} tp-tool-editor`}
                dir="ltr"
                rows={4}
                value={stored}
                placeholder={tw("bcrypt-generator.hashPlaceholder")}
                spellCheck={false}
                aria-invalid={Boolean(errorText)}
                aria-describedby={errorText ? ERROR_ID : undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setStored(value);
                  void run(current({ stored: value }));
                }}
              />
            </ToolField>
          )}

          <p className="tp-tool-hint">{tw("bcrypt-generator.footerHint")}</p>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-7"
          aria-labelledby="tp-pbkdf2-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-pbkdf2-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("bcrypt-generator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("bcrypt-generator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={derived} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={portable}
                fileName="pbkdf2-hash.txt"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <div className="tp-industrial-bar">
            <SegmentedControl<OutputFormat>
              label={tw("bcrypt-generator.outputFormatLabel")}
              value={outputFormat}
              options={[
                { value: "base64", label: tw("bcrypt-generator.outputBase64") },
                { value: "hex", label: tw("bcrypt-generator.outputHex") },
              ]}
              onChange={handleOutputFormatChange}
            />
            <div className="tp-meta-pill" aria-live="polite">
              <span>{tw("bcrypt-generator.algorithmLabel")}</span>
              <strong dir="ltr">{algorithm}</strong>
              <span aria-hidden="true">•</span>
              <span>{tw("bcrypt-generator.roundsLabel")}</span>
              <strong dir="ltr">
                {mode === "generate" ? Number(iterations).toLocaleString("en-US") : tw("bcrypt-generator.fromHash")}
              </strong>
              <span aria-hidden="true">•</span>
              <span>{tw("bcrypt-generator.keyLengthLabel")}</span>
              <strong dir="ltr">
                {storedKeyLength ?? (mode === "generate" ? keyLength : tw("bcrypt-generator.fromHash"))}
              </strong>
            </div>
          </div>

          {status !== "idle" ? <ToolBadge tone={statusTone}>{statusText}</ToolBadge> : null}

          {derived ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <span className="tp-tool-label">{tw("bcrypt-generator.derivedKeyLabel")}</span>
              <div className="tp-output-viewer" role="region" aria-label={tw("bcrypt-generator.derivedKeyLabel")}>
                <code dir="ltr">{derived}</code>
              </div>
              <div className="tp-meta-pill">
                <span>{tw("bcrypt-generator.portableLabel")}</span>
                <strong dir="ltr">{portable}</strong>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="KeyRound" />}
                title={tw("bcrypt-generator.emptyTitle")}
                hint={tw("bcrypt-generator.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("bcrypt-generator.privacyRibbon")}
        </span>
        <span className="tp-tool-hint">{tw("bcrypt-generator.shortcutHint")}</span>
      </div>
    </div>
  );
}
