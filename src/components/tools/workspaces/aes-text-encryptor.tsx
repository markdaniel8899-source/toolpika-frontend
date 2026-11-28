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
  selectClassName,
  useCopyShortcut,
} from "../workspace-ui";
import {
  AES_ITERATIONS,
  AES_IV_BYTES,
  AES_KEY_BITS,
  AES_SALT_BYTES,
  AES_SAMPLE,
  base64ToBytes,
  bytesToBase64,
  checkAesInput,
  formatAesPayload,
  parseAesPayload,
  type AesIssue,
  type AesMode,
} from "./aes-text-encryptor.logic";

const ERROR_ID = "tp-aes-error";

const ERROR_KEYS: Record<AesIssue, string> = {
  emptyText: "aes-text-encryptor.errorEmptyText",
  shortPassphrase: "aes-text-encryptor.errorShortPassphrase",
  format: "aes-text-encryptor.errorFormat",
  base64: "aes-text-encryptor.errorBase64",
  failed: "aes-text-encryptor.errorFailed",
};
const FIX_KEYS: Record<AesIssue, string> = {
  emptyText: "aes-text-encryptor.fixEmptyText",
  shortPassphrase: "aes-text-encryptor.fixShortPassphrase",
  format: "aes-text-encryptor.fixFormat",
  base64: "aes-text-encryptor.fixBase64",
  failed: "aes-text-encryptor.fixFailed",
};

type Status = "idle" | "encrypted" | "decrypted" | "error";

interface RunInput {
  mode: AesMode;
  text: string;
  passphrase: string;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: new Uint8Array(salt), iterations: AES_ITERATIONS },
    material,
    { name: "AES-GCM", length: AES_KEY_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export default function AesTextEncryptor() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const runCounter = useRef(0);
  const [mode, setMode] = useState<AesMode>("encrypt");
  const [text, setText] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [issue, setIssue] = useState<AesIssue | null>(null);

  const errorText = issue
    ? `${tw(ERROR_KEYS[issue])} ${tw(FIX_KEYS[issue])}`
    : "";
  const statusText =
    status === "encrypted"
      ? tw("aes-text-encryptor.statusEncrypted")
      : status === "decrypted"
        ? tw("aes-text-encryptor.statusDecrypted")
        : status === "error"
          ? t("error")
          : "";

  useCopyShortcut(() => {
    if (output) void navigator.clipboard.writeText(output);
  });

  const run = useCallback(async (input: RunInput) => {
    const id = runCounter.current + 1;
    runCounter.current = id;
    const commit = (next: { status: Status; issue: AesIssue | null; output: string }) => {
      if (id !== runCounter.current) return;
      setStatus(next.status);
      setIssue(next.issue);
      setOutput(next.output);
    };

    const problem = checkAesInput(input.mode, input.text, input.passphrase);
    if (problem) {
      commit({ status: "error", issue: problem, output: "" });
      return;
    }

    try {
      if (input.mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(AES_SALT_BYTES));
        const iv = crypto.getRandomValues(new Uint8Array(AES_IV_BYTES));
        const key = await deriveAesKey(input.passphrase, salt);
        const cipher = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: new Uint8Array(iv) },
          key,
          new TextEncoder().encode(input.text),
        );
        commit({
          status: "encrypted",
          issue: null,
          output: formatAesPayload({
            salt: bytesToBase64(salt),
            iv: bytesToBase64(iv),
            cipher: bytesToBase64(new Uint8Array(cipher)),
          }),
        });
        return;
      }

      const payload = parseAesPayload(input.text);
      const salt = payload ? base64ToBytes(payload.salt) : null;
      const iv = payload ? base64ToBytes(payload.iv) : null;
      const cipher = payload ? base64ToBytes(payload.cipher) : null;
      if (!payload || !salt || !iv || !cipher) {
        commit({ status: "error", issue: "format", output: "" });
        return;
      }
      const key = await deriveAesKey(input.passphrase, salt);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        key,
        new Uint8Array(cipher),
      );
      commit({ status: "decrypted", issue: null, output: new TextDecoder().decode(plain) });
    } catch {
      commit({ status: "error", issue: "failed", output: "" });
    }
  }, []);

  const current = (patch: Partial<RunInput> = {}): RunInput => ({ mode, text, passphrase, ...patch });

  const handleClear = () => {
    runCounter.current += 1;
    setText("");
    setPassphrase("");
    setOutput("");
    setStatus("idle");
    setIssue(null);
    textRef.current?.focus();
  };

  const handleSample = () => {
    setMode("encrypt");
    setText(AES_SAMPLE);
    const samplePassphrase = tw("aes-text-encryptor.samplePassphrase");
    setPassphrase(samplePassphrase);
    void run({ mode: "encrypt", text: AES_SAMPLE, passphrase: samplePassphrase });
    textRef.current?.focus();
  };

  const handleModeChange = (next: AesMode) => {
    setMode(next);
    setOutput("");
    setStatus("idle");
    setIssue(null);
    if (text.trim() && passphrase) void run({ mode: next, text, passphrase });
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Lock" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("aes-text-encryptor.title")}</span>
            <span className="tp-tool-subtitle">{tw("aes-text-encryptor.shortDesc")}</span>
          </span>
        </div>
        <SegmentedControl<AesMode>
          label={tw("aes-text-encryptor.modeLabel")}
          value={mode}
          options={[
            { value: "encrypt", label: tw("aes-text-encryptor.modeEncrypt") },
            { value: "decrypt", label: tw("aes-text-encryptor.modeDecrypt") },
          ]}
          onChange={handleModeChange}
        />
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="default" size="sm" onClick={handleSample}>
            {tw("aes-text-encryptor.sampleAction")}
          </Button>
        </div>
      </div>

      {errorText ? (
        <p className="tp-tool-notice" id={ERROR_ID} data-tone="danger" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-aes-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-aes-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("aes-text-encryptor.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("aes-text-encryptor.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-aes-text" className="text-sm font-medium text-[var(--text)]">
              {tw("aes-text-encryptor.textLabel")}
            </label>
            <textarea
              id="tp-aes-text"
              ref={textRef}
              className="tp-tool-editor"
              rows={6}
              dir="ltr"
              value={text}
              placeholder={tw("aes-text-encryptor.textPlaceholder")}
              aria-invalid={Boolean(errorText)}
              aria-describedby={errorText ? ERROR_ID : undefined}
              spellCheck={false}
              onChange={(event) => {
                const value = event.target.value;
                setText(value);
                void run(current({ text: value }));
              }}
            />
            <p className="tp-tool-hint">{tw("aes-text-encryptor.textHint")}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="tp-industrial-bar">
              <label htmlFor="tp-aes-passphrase" className="text-sm font-medium text-[var(--text)]">
                {tw("aes-text-encryptor.passphraseLabel")}
              </label>
              <ToolBadge tone="accent">{tw("aes-text-encryptor.aesGcmBadge")}</ToolBadge>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="tp-aes-passphrase"
                type={showPassphrase ? "text" : "password"}
                className={`${selectClassName} min-w-0 flex-1`}
                dir="ltr"
                autoComplete="new-password"
                value={passphrase}
                placeholder={tw("aes-text-encryptor.passphrasePlaceholder")}
                aria-invalid={Boolean(errorText)}
                aria-describedby={errorText ? ERROR_ID : undefined}
                onChange={(event) => {
                  const value = event.target.value;
                  setPassphrase(value);
                  void run(current({ passphrase: value }));
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={showPassphrase
                  ? tw("aes-text-encryptor.hideAction")
                  : tw("aes-text-encryptor.showAction")}
                onClick={() => setShowPassphrase((previous) => !previous)}
              >
                {showPassphrase
                  ? tw("aes-text-encryptor.hideAction")
                  : tw("aes-text-encryptor.showAction")}
              </Button>
            </div>
            <p className="tp-tool-hint">{tw("aes-text-encryptor.passphraseHint")}</p>
          </div>

          <div className="tp-meta-pill">
            <span>{tw("aes-text-encryptor.algorithmNote")}</span>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="tp-aes-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-aes-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("aes-text-encryptor.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("aes-text-encryptor.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={output}
                fileName={mode === "encrypt" ? "encrypted.txt" : "decrypted.txt"}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <strong dir="ltr">{tw("aes-text-encryptor.aesGcmBadge")}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("aes-text-encryptor.keyBits", { bits: AES_KEY_BITS })}</span>
            <span aria-hidden="true">•</span>
            <span>{tw("aes-text-encryptor.footerHint")}</span>
          </div>

          {statusText ? <ToolBadge tone={status === "error" ? "danger" : "success"}>{statusText}</ToolBadge> : null}

          {output ? (
            <div className="flex min-h-0 flex-col gap-2" aria-live="polite">
              <span className="tp-tool-label">
                {mode === "encrypt"
                  ? tw("aes-text-encryptor.statusEncrypted")
                  : tw("aes-text-encryptor.statusDecrypted")}
              </span>
              <div className="tp-output-viewer" role="region" aria-label={tw("aes-text-encryptor.resultTitle")}>
                <code dir="ltr">{output}</code>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Lock" />}
                title={tw("aes-text-encryptor.emptyTitle")}
                hint={tw("aes-text-encryptor.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("aes-text-encryptor.privacyRibbon")}
        </span>
        <span className="tp-tool-hint">{tw("aes-text-encryptor.shortcutHint")}</span>
      </div>
    </div>
  );
}
