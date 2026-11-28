"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent as ReactDragEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Image as ImageIcon, LoaderCircle, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { DownloadButton, SegmentedControl, ToolBadge, ToolEmpty } from "../workspace-ui";
import {
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
  extensionForFormat,
  formatBytes,
  formatModified,
  isAcceptedType,
  parseFileName,
  scanForExif,
  sizeChange,
  type ExifScan,
  type FileFacts,
  type ImageFormat,
} from "./exif-metadata-remover.logic";

interface OriginalImage {
  facts: FileFacts;
  url: string;
  width: number;
  height: number;
}

interface CleanImage {
  url: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
}

type ExifErrorCode = "unsupported" | "tooLarge" | "decodeFailed" | "renderFailed";
type OutputChoice = "original" | ImageFormat;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new globalThis.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode_failed"));
    image.src = src;
  });
}

function surfaceColor(): string {
  const root = getComputedStyle(document.documentElement);
  return root.getPropertyValue("--surface").trim() || root.getPropertyValue("--background").trim() || "#ffffff";
}

/** Keep Original re-encodes in the source format; every other choice is explicit. */
function resolvedFormat(choice: OutputChoice, sourceType: string): ImageFormat {
  if (choice !== "original") return choice;
  return isAcceptedType(sourceType) ? (sourceType as ImageFormat) : "image/png";
}

export default function ExifMetadataRemover() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [original, setOriginal] = useState<OriginalImage | null>(null);
  const [scan, setScan] = useState<ExifScan | null>(null);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [format, setFormat] = useState<OutputChoice>("original");
  const [quality, setQuality] = useState(0.9);
  const [clean, setClean] = useState<CleanImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<ExifErrorCode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cleanUrlRef = useRef<string | null>(null);
  const renderIdRef = useRef(0);
  const bytesRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    return () => {
      if (cleanUrlRef.current) URL.revokeObjectURL(cleanUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!original) return;
    return () => URL.revokeObjectURL(original.url);
  }, [original]);

  const renderClean = useCallback(
    async (image: OriginalImage, nextFormat: ImageFormat, nextQuality: number) => {
      const requestId = ++renderIdRef.current;
      setBusy(true);
      setErrorCode(null);
      try {
        const decoded = await loadImage(image.url);
        if (requestId !== renderIdRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = decoded.naturalWidth;
        canvas.height = decoded.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          setErrorCode("renderFailed");
          setBusy(false);
          return;
        }
        if (nextFormat === "image/jpeg") {
          context.fillStyle = surfaceColor();
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(decoded, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, nextFormat, nextQuality);
        });
        if (requestId !== renderIdRef.current) return;
        if (!blob) {
          setErrorCode("renderFailed");
          setBusy(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        if (cleanUrlRef.current) URL.revokeObjectURL(cleanUrlRef.current);
        cleanUrlRef.current = url;
        setClean({
          url,
          blob,
          size: blob.size,
          width: decoded.naturalWidth,
          height: decoded.naturalHeight,
        });
        setBusy(false);
      } catch {
        if (requestId === renderIdRef.current) {
          setErrorCode("renderFailed");
          setBusy(false);
        }
      }
    },
    [],
  );

  const handleFile = async (candidate: File | undefined) => {
    if (!candidate) return;
    if (!isAcceptedType(candidate.type)) {
      setErrorCode("unsupported");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setErrorCode("tooLarge");
      return;
    }

    setErrorCode(null);
    setBusy(true);
    const url = URL.createObjectURL(candidate);
    try {
      const decoded = await loadImage(url);
      const facts: FileFacts = {
        name: candidate.name,
        type: candidate.type,
        sizeBytes: candidate.size,
        lastModified: candidate.lastModified,
      };
      const next: OriginalImage = {
        facts,
        url,
        width: decoded.naturalWidth,
        height: decoded.naturalHeight,
      };
      bytesRef.current = new Uint8Array(await candidate.arrayBuffer());
      setOriginal(next);
      setScan(scanEnabled ? scanForExif(bytesRef.current) : null);
      await renderClean(next, resolvedFormat(format, candidate.type), quality);
    } catch {
      URL.revokeObjectURL(url);
      setErrorCode("decodeFailed");
      setBusy(false);
    }
  };

  const handleScanToggle = (checked: boolean) => {
    setScanEnabled(checked);
    setScan(checked && bytesRef.current ? scanForExif(bytesRef.current) : null);
  };

  const handleSample = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 640, 480);
    gradient.addColorStop(0, "#3d7dff");
    gradient.addColorStop(1, "#7ba8ff");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 640, 480);
    context.fillStyle = "#ffffff";
    context.font = "600 30px sans-serif";
    context.fillText("Toolpika sample image", 56, 250);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    await handleFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
  };

  const handleReset = () => {
    renderIdRef.current += 1;
    bytesRef.current = null;
    setOriginal(null);
    setScan(null);
    setScanEnabled(false);
    setFormat("original");
    setQuality(0.9);
    setClean(null);
    setErrorCode(null);
    setDragging(false);
    if (cleanUrlRef.current) {
      URL.revokeObjectURL(cleanUrlRef.current);
      cleanUrlRef.current = null;
    }
  };

  const changeFormat = (next: OutputChoice) => {
    setFormat(next);
    if (original) void renderClean(original, resolvedFormat(next, original.facts.type), quality);
  };

  const changeQuality = (next: number) => {
    setQuality(next);
    if (original) void renderClean(original, resolvedFormat(format, original.facts.type), next);
  };

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("exif-metadata-remover.errorUnsupported")
      : errorCode === "tooLarge"
        ? tw("exif-metadata-remover.errorTooLarge")
        : errorCode === "decodeFailed"
          ? tw("exif-metadata-remover.errorDecode")
          : tw("exif-metadata-remover.errorRender")
    : "";

  const change = original && clean ? sizeChange(original.facts.sizeBytes, clean.size) : null;
  const effectiveFormat = original ? resolvedFormat(format, original.facts.type) : "image/png";
  const downloadName = original
    ? `${parseFileName(original.facts.name).base || tw("exif-metadata-remover.defaultFileName")}-clean.${extensionForFormat(effectiveFormat)}`
    : `${tw("exif-metadata-remover.defaultFileName")}-clean.${extensionForFormat(effectiveFormat)}`;

  const formatOptions: { value: OutputChoice; label: string }[] = [
    { value: "original", label: tw("exif-metadata-remover.formatOriginal") },
    { value: "image/jpeg", label: tw("exif-metadata-remover.formatJpeg") },
    { value: "image/png", label: tw("exif-metadata-remover.formatPng") },
    { value: "image/webp", label: tw("exif-metadata-remover.formatWebp") },
  ];

  const dropHandlers = {
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      void handleFile(event.dataTransfer.files[0]);
    },
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="ShieldCheck" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("exif-metadata-remover.title")}</span>
            <span className="tp-tool-subtitle">{tw("exif-metadata-remover.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={() => void handleSample()}>
            {tw("exif-metadata-remover.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            {t("clear")}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="tp-tool-notice" id="exif-error" data-tone="warning" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-5" aria-labelledby="exif-source-title">
          <div className="tp-industrial-bar">
            <div>
              <h3 id="exif-source-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("exif-metadata-remover.sourceTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("exif-metadata-remover.sourceHint")}</p>
            </div>
          </div>

          {original ? (
            <div className="tp-stage" aria-live="polite">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={clean?.url ?? original.url}
                alt={tw("exif-metadata-remover.previewAlt")}
                className="max-h-[46vh] max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="tp-tool-drop" data-dragging={dragging ? "true" : undefined} {...dropHandlers}>
              {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
              <p>{tw("exif-metadata-remover.dropTitle")}</p>
              <p className="tp-tool-hint">{tw("exif-metadata-remover.dropHint")}</p>
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                {t("chooseImage")}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            id="exif-file"
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={handleInput}
            aria-label={tw("exif-metadata-remover.chooseFile")}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "exif-error" : undefined}
          />

          {!original ? (
            <div className="flex items-center justify-center">
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <ImageIcon />}
                title={busy ? tw("exif-metadata-remover.processing") : tw("exif-metadata-remover.emptyTitle")}
                hint={busy ? tw("exif-metadata-remover.processingHint") : tw("exif-metadata-remover.emptyHint")}
              />
            </div>
          ) : null}

          {original ? (
            <div className="tp-meta-pill" aria-live="polite">
              <strong className="truncate max-w-[180px]">{original.facts.name}</strong>
              <span aria-hidden="true">•</span>
              <span dir="ltr">{formatBytes(original.facts.sizeBytes)}</span>
              {clean ? (
                <>
                  <span aria-hidden="true">•</span>
                  <span dir="ltr">{formatBytes(clean.size)}</span>
                </>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden lg:col-span-7" aria-labelledby="exif-options-title">
          <div className="tp-industrial-bar">
            <h3 id="exif-options-title" className="text-sm font-semibold text-[var(--text)]">
              {tw("exif-metadata-remover.optionsTitle")}
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              {tw("exif-metadata-remover.replaceImage")}
            </Button>
          </div>

          {original ? (
            <div className="tp-tool-group tp-tool-group--flush">
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                <dt className="text-[var(--muted)]">{tw("exif-metadata-remover.fileName")}</dt>
                <dd className="min-w-0 truncate text-right text-[var(--text)]" dir="ltr">{original.facts.name}</dd>
                <dt className="text-[var(--muted)]">{tw("exif-metadata-remover.fileType")}</dt>
                <dd className="min-w-0 truncate text-right text-[var(--text)]" dir="ltr">{original.facts.type}</dd>
                <dt className="text-[var(--muted)]">{tw("exif-metadata-remover.fileSize")}</dt>
                <dd className="min-w-0 truncate text-right text-[var(--text)]" dir="ltr">{formatBytes(original.facts.sizeBytes)}</dd>
                <dt className="text-[var(--muted)]">{tw("exif-metadata-remover.modified")}</dt>
                <dd className="min-w-0 truncate text-right text-[var(--text)]" dir="ltr">{formatModified(original.facts.lastModified)}</dd>
                <dt className="text-[var(--muted)]">{tw("exif-metadata-remover.dimensions")}</dt>
                <dd className="min-w-0 truncate text-right text-[var(--text)]" dir="ltr">{original.width} × {original.height}</dd>
              </dl>

              <div className="tp-check-row mt-3">
                <input
                  id="exif-scan"
                  type="checkbox"
                  className="tp-checkbox"
                  checked={scanEnabled}
                  onChange={(event) => handleScanToggle(event.target.checked)}
                  aria-label={tw("exif-metadata-remover.scanToggle")}
                  aria-describedby="exif-scan-hint"
                />
                <label htmlFor="exif-scan" className="tp-check-label">{tw("exif-metadata-remover.scanToggle")}</label>
              </div>
              <p className="tp-tool-hint" id="exif-scan-hint">{tw("exif-metadata-remover.scanHint")}</p>

              {scan ? (
                <p className="tp-tool-hint" aria-live="polite">
                  {scan.markers === 0
                    ? tw("exif-metadata-remover.scanNone")
                    : `${tw("exif-metadata-remover.scanFound")}: ${scan.markers}`}
                </p>
              ) : null}

              {clean ? (
                <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
                  <ToolBadge tone="success">{tw("exif-metadata-remover.cleanBanner")}</ToolBadge>
                  {change && change.savedBytes > 0 ? (
                    <ToolBadge tone="success">{tw("exif-metadata-remover.smaller")}</ToolBadge>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("exif-metadata-remover.outputFormat")}</span>
            <SegmentedControl<OutputChoice>
              label={tw("exif-metadata-remover.outputFormat")}
              value={format}
              options={formatOptions}
              onChange={changeFormat}
            />
          </div>

          <details className="tp-tool-group tp-tool-group--flush">
            <summary className="tp-tool-group-title cursor-pointer">
              {tw("exif-metadata-remover.advancedOptions")}
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="exif-quality" className="tp-tool-group-title">{t("quality")}</label>
                <span className="tp-tool-value" dir="ltr">{Math.round(quality * 100)}%</span>
              </div>
              <input
                id="exif-quality"
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                disabled={!original || effectiveFormat === "image/png"}
                aria-label={t("quality")}
                onChange={(event) => changeQuality(Number(event.target.value))}
                className="tp-tool-range"
              />
              {effectiveFormat === "image/png" ? (
                <p className="tp-tool-hint">{tw("exif-metadata-remover.qualityPngHint")}</p>
              ) : null}
            </div>
          </details>

          <DownloadButton
            content={clean?.blob ?? null}
            fileName={downloadName}
            label={tw("exif-metadata-remover.stripDownload")}
            variant="default"
            className="tp-full-button"
          />
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <ShieldCheck className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("exif-metadata-remover.privacyRibbon")}
        </span>
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("exif-metadata-remover.ribbonNote")}
        </span>
      </div>
    </div>
  );
}
