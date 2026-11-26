"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Fingerprint, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  Stat,
  ToggleSwitch,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DIGEST_BITS,
  applyCasing,
  hmacDigest,
  hmacErrorCode,
  type HmacAlgorithm,
  type HmacErrorCode,
} from "./hmac-generator.logic";

type HmacOptions = {
  algorithm: HmacAlgorithm;
  uppercase: boolean;
};

const DEFAULT_OPTIONS: HmacOptions = { algorithm: "SHA-256", uppercase: false };

export default function HmacGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions(
    "toolpika:hmac-generator:options",
    DEFAULT_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();

  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [digest, setDigest] = useState("");
  const [computing, setComputing] = useState(false);
  const [errorCode, setErrorCode] = useState<HmacErrorCode | null>(null);

  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const requestRef = useRef(0);
  const debouncedMessage = useDebounced(message, 220);
  const debouncedSecret = useDebounced(secret, 220);

  const algorithm = options.algorithm;
  const uppercase = options.uppercase;

  // A newer request invalidates every older promise result.
  useEffect(() => {
    return () => {
      requestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestRef.current;

    const settle = (code: HmacErrorCode | null, value = "") => {
      if (requestRef.current !== requestId) return;
      setErrorCode(code);
      setDigest(value);
      setComputing(false);
    };

    const run = async () => {
      await Promise.resolve();
      if (requestRef.current !== requestId) return;

      setDigest("");
      setErrorCode(null);

      // An empty message or secret has no useful tag to show.
      if (!debouncedMessage || !debouncedSecret) {
        settle(null, "");
        return;
      }

      setComputing(true);
      try {
        const value = await hmacDigest(debouncedMessage, debouncedSecret, algorithm);
        settle(null, value);
      } catch (error) {
        settle(hmacErrorCode(error));
      }
    };

    void run();
  }, [algorithm, debouncedMessage, debouncedSecret]);

  const displayDigest = applyCasing(digest, uppercase);
  const downloadContent = displayDigest ? `${displayDigest}\n` : null;
  const downloadName = `hmac-${algorithm.toLowerCase().replace("-", "")}.txt`;

  const copyShortcut = useCallback(() => {
    if (!displayDigest) return;
    navigator.clipboard.writeText(displayDigest).catch(() => {
      showNotice(tw("hmac-generator.copyUnavailable"));
    });
  }, [displayDigest, showNotice, tw]);
  useCopyShortcut(copyShortcut);

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("hmac-generator.errorUnsupported")
      : errorCode === "insecure"
        ? tw("hmac-generator.errorInsecure")
        : errorCode === "tooLarge"
          ? tw("hmac-generator.errorTooLarge")
          : tw("hmac-generator.errorFailed")
    : "";
  const describedBy = errorMessage ? "hmac-error" : undefined;

  const handleMessageChange = (value: string) => {
    setMessage(value);
    clearNotice();
  };

  const handleSecretChange = (value: string) => {
    setSecret(value);
    clearNotice();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) {
        messageRef.current?.focus();
        return;
      }
      handleMessageChange(message ? `${message}\n${clip}` : clip);
      messageRef.current?.focus();
    } catch {
      showNotice(tw("hmac-generator.pasteUnavailable"));
      messageRef.current?.focus();
    }
  };

  const handleClear = () => {
    handleMessageChange("");
    messageRef.current?.focus();
  };

  const handleSample = () => {
    handleMessageChange(tw("hmac-generator.sampleMessage"));
    setSecret(tw("hmac-generator.sampleSecret"));
    update({ algorithm: "SHA-256", uppercase: false });
    clearNotice();
    messageRef.current?.focus();
  };

  const handleReset = () => {
    setMessage("");
    setSecret("");
    setErrorCode(null);
    setComputing(false);
    resetOptions();
    clearNotice();
    messageRef.current?.focus();
  };

  const algorithmOptions: { value: HmacAlgorithm; label: string }[] = [
    { value: "SHA-1", label: tw("hmac-generator.sha1") },
    { value: "SHA-256", label: tw("hmac-generator.sha256") },
    { value: "SHA-512", label: tw("hmac-generator.sha512") },
  ];

  return (
    <ToolShell
      title={tw("hmac-generator.title")}
      subtitle={tw("hmac-generator.subtitle")}
      icon="Fingerprint"
      sampleLabel={tw("hmac-generator.trySample")}
      resetLabel={tw("hmac-generator.reset")}
      privacyLabel={tw("hmac-generator.privacyLabel")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      input={
        <ToolPane
          id="hmac-input-title"
          title={tw("hmac-generator.inputTitle")}
          hint={tw("hmac-generator.inputHint")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={tw("hmac-generator.paste")}
                onClick={() => void handlePaste()}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t("clear")}
                onClick={handleClear}
                disabled={!message}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="hmac-message" className="tp-tool-label">
              {tw("hmac-generator.messageLabel")}
            </label>
            <textarea
              ref={messageRef}
              id="hmac-message"
              className="tp-tool-editor"
              value={message}
              onChange={(event) => handleMessageChange(event.target.value)}
              placeholder={t("startTyping")}
              spellCheck={false}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={describedBy}
            />
          </div>

          <ToolField
            label={tw("hmac-generator.secretLabel")}
            htmlFor="hmac-secret"
            hint={tw("hmac-generator.secretHint")}
          >
            <input
              id="hmac-secret"
              type="text"
              className="tp-tool-field"
              value={secret}
              onChange={(event) => handleSecretChange(event.target.value)}
              placeholder={tw("hmac-generator.secretPlaceholder")}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={describedBy}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <ToolField label={tw("hmac-generator.algorithm")}>
              <SegmentedControl<HmacAlgorithm>
                label={tw("hmac-generator.algorithm")}
                value={algorithm}
                options={algorithmOptions}
                onChange={(value) => update({ algorithm: value })}
              />
            </ToolField>
            {algorithm === "SHA-1" ? (
              <p className="tp-tool-hint" role="status">
                {tw("hmac-generator.sha1Warning")}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="tp-tool-error" id="hmac-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="hmac-result-title"
          title={t("result")}
          result
          actions={
            <>
              <CopyButton
                text={displayDigest}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={downloadContent}
                fileName={downloadName}
                label={t("download")}
              />
            </>
          }
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-check-row">
              <ToggleSwitch
                id="hmac-uppercase"
                label={tw("hmac-generator.uppercaseLabel")}
                checked={uppercase}
                onChange={() => update({ uppercase: !uppercase })}
              />
              <label htmlFor="hmac-uppercase" className="tp-check-label">
                {tw("hmac-generator.uppercaseLabel")}
              </label>
            </div>
          </div>

          <div aria-live="polite">
            {displayDigest ? (
              <div className="tp-tool-result">
                <pre className="tp-tool-code" tabIndex={0}>
                  {displayDigest}
                </pre>
                <dl className="tp-tool-stats">
                  <Stat label={tw("hmac-generator.bits")} value={DIGEST_BITS[algorithm]} />
                  <Stat label={tw("hmac-generator.bytes")} value={DIGEST_BITS[algorithm] / 8} />
                </dl>
              </div>
            ) : (
              <ToolEmpty
                icon={<Fingerprint />}
                title={computing ? tw("hmac-generator.computing") : tw("hmac-generator.emptyTitle")}
                hint={tw("hmac-generator.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
