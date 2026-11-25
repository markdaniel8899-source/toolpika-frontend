"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardPaste, Clock, Copy, FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DownloadButton,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyFeedback,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "../workspace-ui";
import {
  DIGEST_BITS,
  MAX_FILE_BYTES,
  MAX_TEXT_CHARS,
  formatBytes,
  hashErrorCode,
  hashFile,
  hashText,
  type HashAlgorithm,
  type HashErrorCode,
} from "./hash-generator.logic";

type HashOptions = {
  algorithm: HashAlgorithm;
};

type Source = { kind: "text" } | { kind: "file"; name: string; size: number };

const DEFAULT_OPTIONS: HashOptions = { algorithm: "SHA-256" };
const SAMPLE_TEXT = "hello";

export default function HashGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions(
    "toolpika:hash-generator:options",
    DEFAULT_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { copied, copy, reset: resetCopied } = useCopyFeedback();

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<Source>({ kind: "text" });
  const [dragging, setDragging] = useState(false);
  const [digest, setDigest] = useState("");
  const [hashing, setHashing] = useState(false);
  const [errorCode, setErrorCode] = useState<HashErrorCode | null>(null);

  const debouncedText = useDebounced(text, 220);
  const requestRef = useRef(0);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  const algorithm = options.algorithm;

  // A newer request invalidates every older promise result.
  useEffect(() => {
    return () => {
      requestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestRef.current;

    const settle = (code: HashErrorCode | null, value = "") => {
      if (requestRef.current !== requestId) return;
      setErrorCode(code);
      setDigest(value);
      setHashing(false);
    };

    const run = async () => {
      // Defer the state update so a new input can cancel this request first.
      await Promise.resolve();
      if (requestRef.current !== requestId) return;

      setDigest("");
      setErrorCode(null);
      setHashing(true);

      try {
        let value = "";
        if (source.kind === "file") {
          if (!file || file.size > MAX_FILE_BYTES) {
            settle("fileTooLarge");
            return;
          }
          value = await hashFile(file, algorithm);
        } else {
          if (debouncedText.length > MAX_TEXT_CHARS) {
            settle("textTooLarge");
            return;
          }
          value = await hashText(debouncedText, algorithm);
        }
        settle(null, value);
      } catch (error) {
        settle(hashErrorCode(error));
      }
    };

    void run();
  }, [algorithm, debouncedText, file, source.kind]);

  const handleCopy = useCallback(() => {
    if (!digest) return;
    void copy(digest).then((ok) => {
      if (!ok) showNotice(tw("hash-generator.copyUnavailable"));
    });
  }, [copy, digest, showNotice, tw]);

  useCopyShortcut(handleCopy);

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("hash-generator.errorUnsupported")
      : errorCode === "insecure"
        ? tw("hash-generator.errorInsecure")
        : errorCode === "textTooLarge"
          ? tw("hash-generator.errorTextTooLarge")
          : errorCode === "fileTooLarge"
            ? tw("hash-generator.errorFileTooLarge")
            : tw("hash-generator.errorFailed")
    : "";

  const handleTextChange = (value: string) => {
    setFile(null);
    setSource({ kind: "text" });
    setText(value);
    resetCopied();
    clearNotice();
  };

  const handleFile = (candidate: File | undefined) => {
    if (!candidate) return;
    setErrorCode(null);
    clearNotice();
    resetCopied();

    if (candidate.size > MAX_FILE_BYTES) {
      setErrorCode("fileTooLarge");
      return;
    }

    setText("");
    setFile(candidate);
    setSource({
      kind: "file",
      name: candidate.name,
      size: candidate.size,
    });
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) {
        textRef.current?.focus();
        return;
      }
      handleTextChange(text ? `${text}\n${clip}` : clip);
      textRef.current?.focus();
    } catch {
      showNotice(tw("hash-generator.pasteUnavailable"));
      textRef.current?.focus();
    }
  };

  const handleClear = () => {
    handleTextChange("");
    textRef.current?.focus();
  };

  const handleSample = () => {
    handleTextChange(SAMPLE_TEXT);
    update({ algorithm: "SHA-256" });
    textRef.current?.focus();
  };

  const handleReset = () => {
    setFile(null);
    setSource({ kind: "text" });
    setText("");
    setErrorCode(null);
    setDragging(false);
    resetCopied();
    resetOptions();
    clearNotice();
    textRef.current?.focus();
  };

  const bits = DIGEST_BITS[algorithm];
  const statusLabel = hashing
    ? tw("hash-generator.hashing")
    : digest
      ? tw("hash-generator.ready")
      : tw("hash-generator.waiting");
  const statusTone = hashing ? "accent" : digest ? "success" : "neutral";
  const isFileSource = source.kind === "file" && file !== null;
  const downloadContent = digest ? `${algorithm}: ${digest}\n` : null;

  const algorithmOptions: { value: HashAlgorithm; label: string }[] = [
    { value: "SHA-256", label: tw("hash-generator.sha256") },
    { value: "SHA-512", label: tw("hash-generator.sha512") },
    { value: "SHA-1", label: tw("hash-generator.sha1") },
  ];

  return (
    <ToolShell
      title={tw("hash-generator.title")}
      subtitle={tw("hash-generator.subtitle")}
      icon="Fingerprint"
      sampleLabel={tw("hash-generator.trySample")}
      resetLabel={tw("hash-generator.reset")}
      privacyLabel={tw("hash-generator.privacyLabel")}
      shortcutHint={tw("hash-generator.shortcutHint")}
      onSample={handleSample}
      onReset={handleReset}
      notice={
        errorMessage
          ? undefined
          : algorithm === "SHA-1"
            ? tw("hash-generator.sha1Warning")
            : notice || undefined
      }
      noticeTone="warning"
      input={
        <ToolPane
          id="hash-input-title"
          title={tw("hash-generator.inputTitle")}
          hint={tw("hash-generator.inputHint")}
          actions={
            <>
              <Button type="button" size="sm" variant="ghost" onClick={() => void handlePaste()}>
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("hash-generator.paste")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
                disabled={!text && !file}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("clear")}
              </Button>
            </>
          }
          footer={
            isFileSource
              ? `${file.name} · ${formatBytes(file.size)}`
              : `${t("characters")}: ${text.length} / ${MAX_TEXT_CHARS}`
          }
        >
          <textarea
            ref={textRef}
            id="hash-text"
            className="tp-tool-editor"
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            spellCheck={false}
          />

          <label
            className="tp-tool-drop"
            data-dragging={dragging ? "true" : undefined}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              handleFile(event.dataTransfer.files[0]);
            }}
          >
            <FileUp className="h-5 w-5" aria-hidden="true" />
            <strong>
              {isFileSource ? file.name : tw("hash-generator.chooseFile")}
            </strong>
            <span>
              {isFileSource
                ? `${formatBytes(file.size)} · ${tw("hash-generator.fileHint")}`
                : tw("hash-generator.dropFile")}
            </span>
            <input
              id="hash-file"
              type="file"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>

          {errorMessage ? (
            <p className="tp-tool-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="hash-result-title"
          title={t("result")}
          hint={tw("hash-generator.resultHint")}
          result
          actions={
            <>
              <ToolBadge tone={statusTone}>{statusLabel}</ToolBadge>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                disabled={!digest}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? t("copied") : t("copy")}
              </Button>
              <DownloadButton
                content={downloadContent}
                fileName={`hash-${algorithm.toLowerCase()}.txt`}
                label={t("download")}
              />
            </>
          }
        >
          {digest ? (
            <div className="tp-tool-result">
              <pre className="tp-tool-code" tabIndex={0} aria-live="polite">
                {digest}
              </pre>
              <dl className="tp-tool-stats">
                <Stat label={tw("hash-generator.bits")} value={bits} />
                <Stat label={tw("hash-generator.bytes")} value={bits / 8} />
              </dl>
            </div>
          ) : (
            <ToolEmpty
              icon={<Clock />}
              title={hashing ? tw("hash-generator.hashing") : tw("hash-generator.emptyTitle")}
              hint={tw("hash-generator.emptyHint")}
            />
          )}
        </ToolPane>
      }
      options={
        <>
          <div className="tp-tool-options-head">
            <h3>{tw("hash-generator.optionsTitle")}</h3>
          </div>
          <div className="tp-tool-options-grid">
            <ToolField label={tw("hash-generator.algorithm")}>
              <SegmentedControl
                label={tw("hash-generator.algorithm")}
                value={algorithm}
                options={algorithmOptions}
                onChange={(value) => update({ algorithm: value })}
              />
            </ToolField>
          </div>
        </>
      }
    />
  );
}
