"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Image as ImageIcon, LoaderCircle, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  DownloadButton,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
} from "../workspace-ui";
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

export default function ExifMetadataRemover() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [original, setOriginal] = useState<OriginalImage | null>(null);
  const [scan, setScan] = useState<ExifScan | null>(null);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("image/png");
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
      await renderClean(next, format, quality);
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
    setFormat("image/png");
    setQuality(0.9);
    setClean(null);
    setErrorCode(null);
    setDragging(false);
    if (cleanUrlRef.current) {
      URL.revokeObjectURL(cleanUrlRef.current);
      cleanUrlRef.current = null;
    }
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
  const downloadName = original
    ? `${parseFileName(original.facts.name).base || tw("exif-metadata-remover.defaultFileName")}-clean.${extensionForFormat(format)}`
    : `${tw("exif-metadata-remover.defaultFileName")}-clean.${extensionForFormat(format)}`;

  const formatOptions = [
    { value: "image/png", label: tw("exif-metadata-remover.formatPng") },
    { value: "image/jpeg", label: tw("exif-metadata-remover.formatJpeg") },
    { value: "image/webp", label: tw("exif-metadata-remover.formatWebp") },
  ];

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="ShieldCheck" />
          </span>
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
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("exif-metadata-remover.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="exif-source-title"
          title={tw("exif-metadata-remover.sourceTitle")}
          hint={tw("exif-metadata-remover.sourceHint")}
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
              void handleFile(event.dataTransfer.files[0]);
            }}
          >
            {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
            <strong>{original ? original.facts.name : tw("exif-metadata-remover.dropTitle")}</strong>
            <span>{original ? tw("exif-metadata-remover.replaceHint") : tw("exif-metadata-remover.dropHint")}</span>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {tw("exif-metadata-remover.chooseFile")}
            </Button>
            <input
              ref={fileInputRef}
              id="exif-file"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              aria-label={tw("exif-metadata-remover.chooseFile")}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "exif-error" : undefined}
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          {original ? (
            <dl className="tp-tool-stats" aria-live="polite">
              <Stat label={tw("exif-metadata-remover.fileName")} value={original.facts.name} />
              <Stat label={tw("exif-metadata-remover.fileType")} value={original.facts.type} />
              <Stat label={tw("exif-metadata-remover.fileSize")} value={formatBytes(original.facts.sizeBytes)} />
              <Stat label={tw("exif-metadata-remover.modified")} value={formatModified(original.facts.lastModified)} />
              <Stat
                label={tw("exif-metadata-remover.dimensions")}
                value={`${original.width} × ${original.height}`}
              />
            </dl>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            <label htmlFor="exif-scan" className="tp-check-label">
              {tw("exif-metadata-remover.scanToggle")}
            </label>
            <input
              id="exif-scan"
              type="checkbox"
              className="tp-checkbox"
              checked={scanEnabled}
              onChange={(event) => handleScanToggle(event.target.checked)}
            />
            <p className="tp-tool-hint">{tw("exif-metadata-remover.scanHint")}</p>
          </div>

          {scan ? (
            <p className="tp-tool-hint" aria-live="polite">
              {scan.markers === 0
                ? tw("exif-metadata-remover.scanNone")
                : `${tw("exif-metadata-remover.scanFound")}: ${scan.markers}`}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="tp-tool-error" id="exif-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>

        <ToolPane
          id="exif-options-title"
          title={tw("exif-metadata-remover.optionsTitle")}
          hint={tw("exif-metadata-remover.optionsHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("exif-metadata-remover.outputFormat")}>
              <ThemedSelect
                value={format}
                onValueChange={(value) => {
                  const next = value as ImageFormat;
                  setFormat(next);
                  if (original) void renderClean(original, next, quality);
                }}
                options={formatOptions}
                ariaLabel={tw("exif-metadata-remover.outputFormat")}
              />
            </ToolField>
            <ToolField
              label={t("quality")}
              hint={format === "image/png" ? tw("exif-metadata-remover.qualityPngHint") : undefined}
            >
              <input
                id="exif-quality"
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                disabled={format === "image/png"}
                aria-label={t("quality")}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setQuality(next);
                  if (original) void renderClean(original, format, next);
                }}
                className="tp-tool-range"
              />
            </ToolField>
          </div>
        </ToolPane>

        <ToolPane
          id="exif-result-title"
          title={tw("exif-metadata-remover.resultTitle")}
          hint={tw("exif-metadata-remover.resultHint")}
          result
        >
          <div aria-live="polite" className="tp-tool-result">
            {clean && original ? (
              <>
                {change && change.savedBytes > 0 ? (
                  <ToolBadge tone="success">{tw("exif-metadata-remover.smaller")}</ToolBadge>
                ) : null}
                <div className="tp-tool-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={clean.url} alt={tw("exif-metadata-remover.previewAlt")} />
                </div>
                <dl className="tp-tool-stats">
                  <Stat label={tw("exif-metadata-remover.originalSize")} value={formatBytes(original.facts.sizeBytes)} />
                  <Stat label={tw("exif-metadata-remover.cleanSize")} value={formatBytes(clean.size)} />
                  <Stat
                    label={tw("exif-metadata-remover.removedBytes")}
                    value={`${change?.savedBytes ?? 0} B`}
                  />
                  <Stat label={tw("exif-metadata-remover.savedPercent")} value={`${change?.percent ?? 0}%`} />
                </dl>
              </>
            ) : (
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <ImageIcon />}
                title={busy ? tw("exif-metadata-remover.processing") : tw("exif-metadata-remover.emptyTitle")}
                hint={busy ? tw("exif-metadata-remover.processingHint") : tw("exif-metadata-remover.emptyHint")}
              />
            )}
          </div>
          <DownloadButton
            content={clean?.blob ?? null}
            fileName={downloadName}
            label={t("download")}
            className="tp-full-button"
          />
        </ToolPane>
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
