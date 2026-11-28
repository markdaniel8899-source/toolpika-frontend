"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Image as ImageIcon, LoaderCircle, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  Stat,
  ToolEmpty,
  ToolPane,
} from "../workspace-ui";
import {
  MAX_FILE_BYTES,
  SIZE_WARNING_BYTES,
  altFromFileName,
  cssSnippet,
  estimateDecodedBytes,
  extensionForMime,
  formatBytes,
  htmlSnippet,
  mimeFromType,
  parseDataUrl,
  parseFileName,
} from "./image-to-base64.logic";

interface SourceImage {
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
}

interface DecodedImage {
  url: string;
  blob: Blob;
  name: string;
  size: number;
  mime: string;
}

type ImageErrorCode = "unsupported" | "tooLarge" | "readFailed" | "decodeFailed";

export default function ImageToBase64() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [source, setSource] = useState<SourceImage | null>(null);
  const [pasted, setPasted] = useState("");
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<ImageErrorCode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const decodedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (decodedUrlRef.current) URL.revokeObjectURL(decodedUrlRef.current);
    };
  }, []);

  const snippets = useMemo(() => {
    if (!source) return { data: "", css: "", html: "" };
    const data = source.dataUrl;
    return {
      data,
      css: cssSnippet(data),
      html: htmlSnippet(data, altFromFileName(source.name, tw("image-to-base64.defaultAlt"))),
    };
  }, [source, tw]);

  const handleFile = (candidate: File | undefined) => {
    if (!candidate) return;
    const mime = mimeFromType(candidate.type);
    if (!mime) {
      setErrorCode("unsupported");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setErrorCode("tooLarge");
      return;
    }

    setErrorCode(null);
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      setSource({ name: candidate.name, mime, size: candidate.size, dataUrl });
      setPasted(dataUrl);
      setDecoded(null);
      setBusy(false);
    };
    reader.onerror = () => {
      setErrorCode("readFailed");
      setBusy(false);
    };
    reader.readAsDataURL(candidate);
  };

  const handleSample = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 200;
    const context = canvas.getContext("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 320, 200);
    gradient.addColorStop(0, "#5b4bff");
    gradient.addColorStop(1, "#8a7cff");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 320, 200);
    context.fillStyle = "#ffffff";
    context.font = "600 22px sans-serif";
    context.fillText("Toolpika sample", 28, 110);
    canvas.toBlob((blob) => {
      if (!blob) return;
      handleFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
    }, "image/png");
  };

  const handleDecode = () => {
    const parsed = parseDataUrl(pasted);
    if (!parsed) {
      setErrorCode("decodeFailed");
      setDecoded(null);
      return;
    }

    setErrorCode(null);
    try {
      const binary = atob(parsed.base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: parsed.mime });
      const url = URL.createObjectURL(blob);
      if (decodedUrlRef.current) URL.revokeObjectURL(decodedUrlRef.current);
      decodedUrlRef.current = url;
      const name = source
        ? `decoded-${parseFileName(source.name).base || tw("image-to-base64.defaultFileName")}.${extensionForMime(parsed.mime)}`
        : `${tw("image-to-base64.defaultFileName")}-decoded.${extensionForMime(parsed.mime)}`;
      setDecoded({ url, blob, name, size: blob.size, mime: parsed.mime });
    } catch {
      setErrorCode("decodeFailed");
      setDecoded(null);
    }
  };

  const handleReset = () => {
    setSource(null);
    setPasted("");
    setDecoded(null);
    setErrorCode(null);
    setDragging(false);
    if (decodedUrlRef.current) {
      URL.revokeObjectURL(decodedUrlRef.current);
      decodedUrlRef.current = null;
    }
  };

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("image-to-base64.errorUnsupported")
      : errorCode === "tooLarge"
        ? tw("image-to-base64.errorTooLarge")
        : errorCode === "readFailed"
          ? tw("image-to-base64.errorRead")
          : tw("image-to-base64.errorDecode")
    : "";

  const encodedBytes = snippets.data ? estimateDecodedBytes(snippets.data.split(",")[1] ?? "") : 0;

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Code" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("image-to-base64.title")}</span>
            <span className="tp-tool-subtitle">{tw("image-to-base64.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("image-to-base64.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("image-to-base64.reset")}
          </Button>
        </div>
      </div>

      {source && source.size > SIZE_WARNING_BYTES ? (
        <p className="tp-tool-notice" data-tone="warning" role="status" aria-live="polite">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {tw("image-to-base64.sizeWarning")}
        </p>
      ) : null}

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="base64-source-title"
          title={tw("image-to-base64.sourceTitle")}
          hint={tw("image-to-base64.sourceHint")}
        >
          <div
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
            {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
            <strong>{source ? source.name : tw("image-to-base64.dropTitle")}</strong>
            <span>{source ? tw("image-to-base64.replaceHint") : tw("image-to-base64.dropHint")}</span>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {tw("image-to-base64.chooseFile")}
            </Button>
            <input
              ref={fileInputRef}
              id="base64-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              aria-label={tw("image-to-base64.chooseFile")}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "base64-error" : undefined}
              onChange={(event) => {
                handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          {source ? (
            <dl className="tp-tool-stats" aria-live="polite">
              <Stat label={tw("image-to-base64.mimeType")} value={source.mime} />
              <Stat label={tw("image-to-base64.fileSize")} value={formatBytes(source.size)} />
              <Stat label={tw("image-to-base64.encodedLength")} value={formatBytes(encodedBytes)} />
            </dl>
          ) : null}

          {errorMessage ? (
            <p className="tp-tool-error" id="base64-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>

        <ToolPane
          id="base64-output-title"
          title={tw("image-to-base64.outputTitle")}
          hint={tw("image-to-base64.outputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-tool-pane-head">
              <div className="tp-tool-pane-title">
                <h3>{tw("image-to-base64.dataTitle")}</h3>
              </div>
              <div className="tp-tool-pane-actions">
                <CopyButton
                  text={snippets.data}
                  label={t("copy")}
                  copiedLabel={t("copied")}
                />
              </div>
            </div>
            <textarea
              id="base64-data"
              className="tp-tool-editor"
              value={snippets.data}
              readOnly
              dir="ltr"
              placeholder={tw("image-to-base64.outputEmpty")}
              aria-label={tw("image-to-base64.dataTitle")}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-tool-pane-head">
              <div className="tp-tool-pane-title">
                <h3>{tw("image-to-base64.cssTitle")}</h3>
              </div>
              <div className="tp-tool-pane-actions">
                <CopyButton text={snippets.css} label={t("copy")} copiedLabel={t("copied")} />
              </div>
            </div>
            <textarea
              id="base64-css"
              className="tp-tool-editor"
              value={snippets.css}
              readOnly
              dir="ltr"
              aria-label={tw("image-to-base64.cssTitle")}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-tool-pane-head">
              <div className="tp-tool-pane-title">
                <h3>{tw("image-to-base64.htmlTitle")}</h3>
              </div>
              <div className="tp-tool-pane-actions">
                <CopyButton text={snippets.html} label={t("copy")} copiedLabel={t("copied")} />
              </div>
            </div>
            <textarea
              id="base64-html"
              className="tp-tool-editor"
              value={snippets.html}
              readOnly
              dir="ltr"
              aria-label={tw("image-to-base64.htmlTitle")}
            />
          </div>
        </ToolPane>

        <ToolPane
          id="base64-decode-title"
          title={tw("image-to-base64.decodeTitle")}
          hint={tw("image-to-base64.decodeHint")}
        >
          <label htmlFor="base64-paste" className="text-sm font-medium text-[var(--text)]">
            {tw("image-to-base64.pasteLabel")}
          </label>
          <textarea
            id="base64-paste"
            className="tp-tool-editor"
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            placeholder={tw("image-to-base64.pastePlaceholder")}
            dir="ltr"
            spellCheck={false}
            aria-label={tw("image-to-base64.pasteLabel")}
            aria-invalid={errorCode === "decodeFailed"}
            aria-describedby={errorCode === "decodeFailed" ? "base64-error" : undefined}
          />
          <Button type="button" size="sm" onClick={handleDecode} disabled={!pasted.trim()}>
            {tw("image-to-base64.decodeButton")}
          </Button>

          <div aria-live="polite">
            {decoded ? (
              <div className="tp-tool-result">
                <div className="tp-tool-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={decoded.url} alt={tw("image-to-base64.decodePreviewAlt")} />
                </div>
                <dl className="tp-tool-stats">
                  <Stat label={tw("image-to-base64.decodedMime")} value={decoded.mime} />
                  <Stat label={tw("image-to-base64.fileSize")} value={formatBytes(decoded.size)} />
                </dl>
                <DownloadButton
                  content={decoded.blob}
                  fileName={decoded.name}
                  label={t("download")}
                  className="tp-full-button"
                />
              </div>
            ) : (
              <ToolEmpty
                icon={<ImageIcon />}
                title={tw("image-to-base64.decodeEmpty")}
                hint={tw("image-to-base64.decodeEmptyHint")}
              />
            )}
          </div>
        </ToolPane>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("image-to-base64.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
