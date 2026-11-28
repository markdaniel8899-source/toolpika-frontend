"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
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
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  selectClassName,
  useCopyFeedback,
  useCopyShortcut,
} from "../workspace-ui";

type Status = "idle" | "encrypted" | "decrypted" | "error";

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
  const [mode, setMode] = useState<AesMode>("encrypt");
  const [text, setText] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [issue, setIssue] = useState<AesIssue | null>(null);
  const [busy, setBusy] = useState(false);
  const { copy } = useCopyFeedback();

  const errorText = issue
    ? `${tw(ERROR_KEYS[issue])} ${tw(FIX_KEYS[issue])}`
    : "";

  useCopyShortcut(() => {
    if (output) void copy(output);
  });

  const clearAll = () => {
    setText("");
    setOutput("");
    setStatus("idle");
    setIssue(null);
    textRef.current?.focus();
  };

  const loadSample = () => {
    setMode("encrypt");
    setText(AES_SAMPLE);
    setOutput("");
    setStatus("idle");
    setIssue(null);
    textRef.current?.focus();
  };

  const handleReset = () => {
    setMode("encrypt");
    setText("");
    setPassphrase("");
    setOutput("");
    setStatus("idle");
    setIssue(null);
    textRef.current?.focus();
  };

  const handleRun = async () => {
    const problem = checkAesInput(mode, text, passphrase);
    if (problem) {
      setIssue(problem);
      setStatus("error");
      return;
    }

    setBusy(true);
    setIssue(null);
    try {
      if (mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(AES_SALT_BYTES));
        const iv = crypto.getRandomValues(new Uint8Array(AES_IV_BYTES));
        const key = await deriveAesKey(passphrase, salt);
        const cipher = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: new Uint8Array(iv) },
          key,
          new TextEncoder().encode(text),
        );
        setOutput(formatAesPayload({
          salt: bytesToBase64(salt),
          iv: bytesToBase64(iv),
          cipher: bytesToBase64(new Uint8Array(cipher)),
        }));
        setStatus("encrypted");
      } else {
        const payload = parseAesPayload(text);
        if (!payload) {
          setIssue("format");
          setStatus("error");
          return;
        }
        const salt = base64ToBytes(payload.salt);
        const iv = base64ToBytes(payload.iv);
        const cipher = base64ToBytes(payload.cipher);
        if (!salt || !iv || !cipher) {
          setIssue("base64");
          setStatus("error");
          return;
        }
        const key = await deriveAesKey(passphrase, salt);
        const plain = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(iv) },
          key,
          new Uint8Array(cipher),
        );
        setOutput(new TextDecoder().decode(plain));
        setStatus("decrypted");
      }
    } catch {
      setIssue("failed");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const statusText =
    status === "encrypted"
      ? tw("aes-text-encryptor.statusEncrypted")
      : status === "decrypted"
        ? tw("aes-text-encryptor.statusDecrypted")
        : "";

  return (
    <ToolShell
      title={tw("aes-text-encryptor.title")}
      subtitle={tw("aes-text-encryptor.shortDesc")}
      icon="Lock"
      sampleLabel={tw("aes-text-encryptor.trySample")}
      resetLabel={tw("aes-text-encryptor.reset")}
      privacyLabel={tw("aes-text-encryptor.privacyRibbon")}
      onSample={clearAll}
      onReset={handleReset}
      ribbonRight={<span className="tp-tool-hint">{tw("aes-text-encryptor.shortcutHint")}</span>}
      input={
        <ToolPane
          id="aes-text-encryptor-input-title"
          title={tw("aes-text-encryptor.inputTitle")}
          hint={tw("aes-text-encryptor.inputHint")}
          actions={
            <Button type="button" variant="secondary" size="sm" onClick={loadSample}>
              {tw("aes-text-encryptor.sampleAction")}
            </Button>
          }
          footer={<span aria-live="polite">{tw("aes-text-encryptor.footerHint")}</span>}
        >
          <SegmentedControl<AesMode>
            label={tw("aes-text-encryptor.modeLabel")}
            value={mode}
            options={[
              { value: "encrypt", label: tw("aes-text-encryptor.modeEncrypt") },
              { value: "decrypt", label: tw("aes-text-encryptor.modeDecrypt") },
            ]}
            onChange={(next) => {
              setMode(next);
              setOutput("");
              setStatus("idle");
              setIssue(null);
            }}
          />

          <ToolField
            label={tw("aes-text-encryptor.textLabel")}
            htmlFor="aes-text-encryptor-text"
            hint={tw("aes-text-encryptor.textHint")}
          >
            <textarea
              id="aes-text-encryptor-text"
              ref={textRef}
              className={`${selectClassName} tp-tool-editor`}
              rows={6}
              dir="ltr"
              value={text}
              placeholder={tw("aes-text-encryptor.textPlaceholder")}
              aria-describedby={errorText ? "aes-text-encryptor-error" : undefined}
              aria-invalid={Boolean(errorText)}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
            />
          </ToolField>

          <ToolField
            label={tw("aes-text-encryptor.passphraseLabel")}
            htmlFor="aes-text-encryptor-passphrase"
            hint={tw("aes-text-encryptor.passphraseHint")}
          >
            <input
              id="aes-text-encryptor-passphrase"
              type="password"
              className={selectClassName}
              dir="ltr"
              autoComplete="new-password"
              value={passphrase}
              aria-describedby={errorText ? "aes-text-encryptor-error" : undefined}
              placeholder={tw("aes-text-encryptor.passphrasePlaceholder")}
              onChange={(event) => setPassphrase(event.target.value)}
            />
          </ToolField>

          {errorText ? (
            <p id="aes-text-encryptor-error" className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}

          <Button type="button" onClick={() => void handleRun()} disabled={busy}>
            {busy
              ? tw("aes-text-encryptor.working")
              : mode === "encrypt"
                ? t("encode")
                : t("decode")}
          </Button>
          <p className="tp-tool-hint">{tw("aes-text-encryptor.algorithmNote")}</p>
        </ToolPane>
      }
      result={
        <ToolPane
          id="aes-text-encryptor-result-title"
          title={tw("aes-text-encryptor.resultTitle")}
          hint={tw("aes-text-encryptor.resultHint")}
          result
          actions={
            <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            {statusText ? <ToolBadge tone="success">{statusText}</ToolBadge> : null}
            {output ? (
              <>
                <textarea
                  className={`${selectClassName} tp-tool-editor`}
                  rows={6}
                  dir="ltr"
                  readOnly
                  value={output}
                  aria-label={tw("aes-text-encryptor.resultTitle")}
                />
                <DownloadButton
                  content={output}
                  fileName={mode === "encrypt" ? "encrypted.txt" : "decrypted.txt"}
                  label={t("download")}
                />
              </>
            ) : (
              <ToolEmpty
                icon={<ToolIcon name="Lock" />}
                title={tw("aes-text-encryptor.emptyTitle")}
                hint={tw("aes-text-encryptor.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
