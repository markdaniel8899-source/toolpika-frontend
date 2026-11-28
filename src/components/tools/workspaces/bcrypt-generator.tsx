"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  base64ToBytes,
  bytesToBase64,
  checkIterations,
  checkPassphrase,
  constantTimeEqual,
  DEFAULT_ITERATIONS,
  formatHash,
  ITERATION_OPTIONS,
  parseHash,
  PBKDF2_DIGEST_BYTES,
  PBKDF2_SALT_BYTES,
  type HashMode,
} from "./bcrypt-generator.logic";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  selectClassName,
  useCopyFeedback,
  useCopyShortcut,
} from "../workspace-ui";

type Status = "idle" | "generated" | "matched" | "failed" | "error";
type Issue = "empty" | "short" | "iterations" | "hash" | "crypto";

const ERROR_KEYS: Record<Issue, string> = {
  empty: "bcrypt-generator.errorEmpty",
  short: "bcrypt-generator.errorShort",
  iterations: "bcrypt-generator.errorIterations",
  hash: "bcrypt-generator.errorHash",
  crypto: "bcrypt-generator.errorCrypto",
};
const FIX_KEYS: Record<Issue, string> = {
  empty: "bcrypt-generator.fixEmpty",
  short: "bcrypt-generator.fixShort",
  iterations: "bcrypt-generator.fixIterations",
  hash: "bcrypt-generator.fixHash",
  crypto: "bcrypt-generator.fixCrypto",
};

async function derivePbkdf2(passphrase: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations },
    material,
    PBKDF2_DIGEST_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export default function BcryptGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const passphraseRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<HashMode>("generate");
  const [passphrase, setPassphrase] = useState("");
  const [iterations, setIterations] = useState(String(DEFAULT_ITERATIONS));
  const [stored, setStored] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [issue, setIssue] = useState<Issue | null>(null);
  const [busy, setBusy] = useState(false);
  const { copy } = useCopyFeedback();

  const errorText = issue
    ? `${tw(ERROR_KEYS[issue])} ${tw(FIX_KEYS[issue])}`
    : "";

  useCopyShortcut(() => {
    if (output) void copy(output);
  });

  const clearAll = () => {
    setPassphrase("");
    setStored("");
    setOutput("");
    setStatus("idle");
    setIssue(null);
    passphraseRef.current?.focus();
  };

  const handleReset = () => {
    clearAll();
    setMode("generate");
    setIterations(String(DEFAULT_ITERATIONS));
  };

  const handleGenerate = async () => {
    const passphraseIssue = checkPassphrase(passphrase);
    if (passphraseIssue) {
      setIssue(passphraseIssue);
      setStatus("error");
      return;
    }
    const rounds = Number(iterations);
    if (!checkIterations(rounds)) {
      setIssue("iterations");
      setStatus("error");
      return;
    }

    setBusy(true);
    setIssue(null);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
      const digest = await derivePbkdf2(passphrase, salt, rounds);
      setOutput(formatHash({ iterations: rounds, salt: bytesToBase64(salt), digest: bytesToBase64(digest) }));
      setStatus("generated");
    } catch {
      setIssue("crypto");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    const passphraseIssue = checkPassphrase(passphrase);
    if (passphraseIssue) {
      setIssue(passphraseIssue);
      setStatus("error");
      return;
    }
    const parts = parseHash(stored);
    if (!parts) {
      setIssue("hash");
      setStatus("error");
      return;
    }
    const salt = base64ToBytes(parts.salt);
    if (!salt) {
      setIssue("hash");
      setStatus("error");
      return;
    }

    setBusy(true);
    setIssue(null);
    try {
      const digest = await derivePbkdf2(passphrase, salt, parts.iterations);
      const matches = constantTimeEqual(bytesToBase64(digest), parts.digest);
      setOutput(stored.trim());
      setStatus(matches ? "matched" : "failed");
    } catch {
      setIssue("crypto");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const run = () => {
    if (mode === "generate") void handleGenerate();
    else void handleVerify();
  };

  const statusText =
    status === "generated"
      ? tw("bcrypt-generator.statusGenerated")
      : status === "matched"
        ? tw("bcrypt-generator.statusMatched")
        : status === "failed"
          ? tw("bcrypt-generator.statusFailed")
          : "";
  const statusTone: "neutral" | "danger" | "warning" | "accent" | "success" =
    status === "matched" || status === "generated"
      ? "success"
      : status === "failed"
        ? "danger"
        : status === "error"
          ? "warning"
          : "neutral";

  return (
    <ToolShell
      title={tw("bcrypt-generator.title")}
      subtitle={tw("bcrypt-generator.shortDesc")}
      icon="KeyRound"
      sampleLabel={tw("bcrypt-generator.trySample")}
      resetLabel={tw("bcrypt-generator.reset")}
      privacyLabel={tw("bcrypt-generator.privacyRibbon")}
      onSample={clearAll}
      onReset={handleReset}
      notice={tw("bcrypt-generator.algorithmNote")}
      noticeTone="warning"
      ribbonRight={<span className="tp-tool-hint">{tw("bcrypt-generator.shortcutHint")}</span>}
      input={
        <ToolPane
          id="bcrypt-generator-input-title"
          title={tw("bcrypt-generator.inputTitle")}
          hint={tw("bcrypt-generator.inputHint")}
          footer={<span aria-live="polite">{tw("bcrypt-generator.footerHint")}</span>}
        >
          <SegmentedControl<HashMode>
            label={tw("bcrypt-generator.modeLabel")}
            value={mode}
            options={[
              { value: "generate", label: tw("bcrypt-generator.modeGenerate") },
              { value: "verify", label: tw("bcrypt-generator.modeVerify") },
            ]}
            onChange={(next) => {
              setMode(next);
              setStatus("idle");
              setIssue(null);
            }}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("bcrypt-generator.passphraseLabel")}
              htmlFor="bcrypt-generator-passphrase"
              hint={tw("bcrypt-generator.passphraseHint")}
            >
              <input
                id="bcrypt-generator-passphrase"
                ref={passphraseRef}
                type="password"
                className={selectClassName}
                dir="ltr"
                autoComplete="new-password"
                value={passphrase}
                aria-describedby={errorText ? "bcrypt-generator-error" : undefined}
                aria-invalid={Boolean(errorText)}
                placeholder={tw("bcrypt-generator.passphrasePlaceholder")}
                onChange={(event) => setPassphrase(event.target.value)}
              />
            </ToolField>

            {mode === "generate" ? (
              <ToolField
                label={tw("bcrypt-generator.iterationsLabel")}
                htmlFor="bcrypt-generator-iterations"
                hint={tw("bcrypt-generator.iterationsHint")}
              >
                <select
                  id="bcrypt-generator-iterations"
                  className={selectClassName}
                  value={iterations}
                  onChange={(event) => setIterations(event.target.value)}
                >
                  {ITERATION_OPTIONS.map((value) => (
                    <option key={value} value={value}>{value.toLocaleString("en-US")}</option>
                  ))}
                </select>
              </ToolField>
            ) : null}
          </div>

          {mode === "verify" ? (
            <ToolField
              label={tw("bcrypt-generator.hashLabel")}
              htmlFor="bcrypt-generator-hash"
              hint={tw("bcrypt-generator.hashHint")}
            >
              <textarea
                id="bcrypt-generator-hash"
                className={`${selectClassName} tp-tool-editor`}
                dir="ltr"
                rows={4}
                value={stored}
                aria-describedby={errorText ? "bcrypt-generator-error" : undefined}
                placeholder={tw("bcrypt-generator.hashPlaceholder")}
                onChange={(event) => setStored(event.target.value)}
                spellCheck={false}
              />
            </ToolField>
          ) : null}

          {errorText ? (
            <p id="bcrypt-generator-error" className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}

          <Button type="button" onClick={run} disabled={busy}>
            {busy
              ? tw("bcrypt-generator.working")
              : mode === "generate"
                ? tw("bcrypt-generator.generateAction")
                : tw("bcrypt-generator.verifyAction")}
          </Button>
        </ToolPane>
      }
      result={
        <ToolPane
          id="bcrypt-generator-result-title"
          title={tw("bcrypt-generator.resultTitle")}
          hint={tw("bcrypt-generator.resultHint")}
          result
          actions={
            <CopyButton
              text={output}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            {statusText ? <ToolBadge tone={statusTone}>{statusText}</ToolBadge> : null}
            <dl className="tp-tool-stats">
              <Stat label={tw("bcrypt-generator.algorithmLabel")} value={tw("bcrypt-generator.algorithmValue")} />
              <Stat
                label={tw("bcrypt-generator.roundsLabel")}
                value={mode === "generate" ? Number(iterations).toLocaleString("en-US") : tw("bcrypt-generator.fromHash")}
              />
            </dl>
            {output ? (
              <>
                <textarea
                  className={`${selectClassName} tp-tool-editor`}
                  dir="ltr"
                  rows={5}
                  readOnly
                  value={output}
                  aria-label={tw("bcrypt-generator.resultTitle")}
                />
                <DownloadButton content={output} fileName="pbkdf2-hash.txt" label={t("download")} />
              </>
            ) : (
              <ToolEmpty
                icon={<ToolIcon name="KeyRound" />}
                title={tw("bcrypt-generator.emptyTitle")}
                hint={tw("bcrypt-generator.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
