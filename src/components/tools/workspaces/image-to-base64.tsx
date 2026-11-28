"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent as ReactDragEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CopyButton, DownloadButton, SegmentedControl, ToolEmpty } from "../workspace-ui";
import {
  MAX_FILE_BYTES,
  SIZE_WARNING_BYTES,
  altFromFileName,
  cssSnippet,
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
type ConversionMode = "encode" | "decode";
type SnippetTab = "data" | "css" | "html";

export default function ImageToBase64() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [mode, setMode] = useState<ConversionMode>("encode");
  const [source, setSource] = useState<SourceImage | null>(null);
  const [pasted, setPasted] = useState("");
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [tab, setTab] = useState<SnippetTab>("data");
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

  const activeSnippet = tab === "data" ? snippets.data : tab === "css" ? snippets.css : snippets.html;
  const activeLabel = tab === "data"
    ? tw("image-to-base64.dataTitle")
    : tab === "css"
      ? tw("image-to-base64.cssTitle")
      : tw("image-to-base64.htmlTitle");

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

  const decodeFrom = (value: string) => {
    setPasted(value);
    const parsed = parseDataUrl(value);
    if (!parsed) {
      setErrorCode(value.trim() ? "decodeFailed" : null);
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
    if (mode === "encode") {
      canvas.toBlob((blob) => {
        if (blob) handleFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
      }, "image/png");
    } else {
      decodeFrom(canvas.toDataURL("image/png"));
    }
  };

  const handleReset = () => {
    setSource(null);
    setPasted("");
    setDecoded(null);
    setTab("data");
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

  const dropHandlers = {
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      handleFile(event.dataTransfer.files[0]);
    },
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Code" /></span>
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
            {t("clear")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-options">
        <SegmentedControl<ConversionMode>
          label={tw("image-to-base64.modeLabel")}
          value={mode}
          options={[
            { value: "encode", label: tw("image-to-base64.modeEncode") },
            { value: "decode", label: tw("image-to-base64.modeDecode") },
          ]}
          onChange={setMode}
        />
      </div>

      {errorMessage ? (
        <p className="tp-tool-notice" id="base64-error" data-tone="warning" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      {source && source.size > SIZE_WARNING_BYTES ? (
        <p className="tp-tool-notice" data-tone="warning" role="status" aria-live="polite">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {tw("image-to-base64.sizeWarning")}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        {mode === "encode" ? (
          <>
            <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-5" aria-labelledby="base64-source-title">
              <div className="tp-industrial-bar">
                <div>
                  <h3 id="base64-source-title" className="text-sm font-semibold text-[var(--text)]">
                    {tw("image-to-base64.sourceTitle")}
                  </h3>
                  <p className="tp-tool-hint">{tw("image-to-base64.sourceHint")}</p>
                </div>
              </div>

              {source ? (
                <div className="tp-stage" aria-live="polite">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={source.dataUrl} alt={tw("image-to-base64.sourceTitle")} className="max-h-[40vh] max-w-full object-contain" />
                </div>
              ) : (
                <div className="tp-tool-drop" data-dragging={dragging ? "true" : undefined} {...dropHandlers}>
                  {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
                  <p>{tw("image-to-base64.dropTitle")}</p>
                  <p className="tp-tool-hint">{tw("image-to-base64.dropHint")}</p>
                  <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                    {t("chooseImage")}
                  </Button>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="base64-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleInput}
                aria-label={tw("image-to-base64.chooseFile")}
                aria-invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? "base64-error" : undefined}
              />

              {source ? (
                <div className="tp-meta-pill" aria-live="polite">
                  <strong className="truncate max-w-[180px]">{source.name}</strong>
                  <span aria-hidden="true">•</span>
                  <span dir="ltr">{source.mime}</span>
                  <span aria-hidden="true">•</span>
                  <span dir="ltr">{formatBytes(source.size)}</span>
                </div>
              ) : null}

              {source ? (
                <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => fileInputRef.current?.click()}>
                  {t("chooseImage")}
                </Button>
              ) : null}
            </section>

            <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-7" aria-labelledby="base64-output-title">
              <div className="tp-industrial-bar">
                <div>
                  <h3 id="base64-output-title" className="text-sm font-semibold text-[var(--text)]">
                    {tw("image-to-base64.outputTitle")}
                  </h3>
                  <p className="tp-tool-hint">{tw("image-to-base64.outputHint")}</p>
                </div>
                <CopyButton
                  text={activeSnippet}
                  label={tw("image-to-base64.copySnippet")}
                  copiedLabel={t("copied")}
                />
              </div>

              <SegmentedControl<SnippetTab>
                label={tw("image-to-base64.outputTitle")}
                value={tab}
                options={[
                  { value: "data", label: tw("image-to-base64.dataTitle") },
                  { value: "css", label: tw("image-to-base64.cssTitle") },
                  { value: "html", label: tw("image-to-base64.htmlTitle") },
                ]}
                onChange={setTab}
              />

              <div
                className="tp-output-viewer"
                role="region"
                aria-label={activeLabel}
                aria-live="polite"
              >
                <code dir="ltr">{activeSnippet || tw("image-to-base64.outputEmpty")}</code>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-5" aria-labelledby="base64-decode-title">
              <div className="tp-industrial-bar">
                <div>
                  <h3 id="base64-decode-title" className="text-sm font-semibold text-[var(--text)]">
                    {tw("image-to-base64.decodeTitle")}
                  </h3>
                  <p className="tp-tool-hint">{tw("image-to-base64.decodeHint")}</p>
                </div>
              </div>

              <label htmlFor="base64-paste" className="text-sm font-medium text-[var(--text)]">
                {tw("image-to-base64.pasteLabel")}
              </label>
              <textarea
                id="base64-paste"
                className="tp-tool-editor"
                value={pasted}
                onChange={(event) => decodeFrom(event.target.value)}
                placeholder={tw("image-to-base64.pastePlaceholder")}
                dir="ltr"
                spellCheck={false}
                aria-label={tw("image-to-base64.pasteLabel")}
                aria-invalid={errorCode === "decodeFailed"}
                aria-describedby={errorCode === "decodeFailed" ? "base64-error" : undefined}
              />
              <p className="tp-tool-hint">{tw("image-to-base64.decodeHint")}</p>
            </section>

            <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-7" aria-labelledby="base64-decoded-title">
              <div className="tp-industrial-bar">
                <h3 id="base64-decoded-title" className="text-sm font-semibold text-[var(--text)]">
                  {t("result")}
                </h3>
              </div>

              <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3">
                {decoded ? (
                  <>
                    <div className="tp-stage">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={decoded.url} alt={tw("image-to-base64.decodePreviewAlt")} className="max-h-[46vh] max-w-full object-contain" />
                    </div>
                    <div className="tp-meta-pill">
                      <strong className="truncate max-w-[180px]">{decoded.name}</strong>
                      <span aria-hidden="true">•</span>
                      <span dir="ltr">{decoded.mime}</span>
                      <span aria-hidden="true">•</span>
                      <span dir="ltr">{formatBytes(decoded.size)}</span>
                    </div>
                    <DownloadButton
                      content={decoded.blob}
                      fileName={decoded.name}
                      label={t("download")}
                      variant="default"
                      className="tp-full-button"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <ToolEmpty
                      icon={<ImageIcon />}
                      title={tw("image-to-base64.decodeEmpty")}
                      hint={tw("image-to-base64.decodeEmptyHint")}
                    />
                  </div>
                )}
              </div>
            </section>
          </>
        )}
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
