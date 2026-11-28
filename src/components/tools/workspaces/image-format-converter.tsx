"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Download, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { DownloadButton, SegmentedControl, Stat, ToolEmpty } from "@/components/tools/workspace-ui";
import {
  clampQuality,
  formatBytes,
  formatDelta,
  isAcceptedType,
  isLossy,
  MAX_FILE_BYTES,
  outputFileName,
  sizeDelta,
  type OutputFormat,
} from "./image-format-converter.logic";

interface OriginalImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

interface ConvertedImage {
  url: string;
  blob: Blob;
  width: number;
  height: number;
}

type ErrorCode = "type" | "size" | "decode" | "failed" | "unsupported";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode_failed"));
    image.src = url;
  });
}

function detectAvif(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/avif").startsWith("data:image/avif");
  } catch {
    return false;
  }
}

export default function ImageFormatConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [original, setOriginal] = useState<OriginalImage | null>(null);
  const [converted, setConverted] = useState<ConvertedImage | null>(null);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [quality, setQuality] = useState(80);
  const [background, setBackground] = useState("#ffffff");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [avifSupported, setAvifSupported] = useState(true);
  const [dragging, setDragging] = useState(false);

  const originalUrlRef = useRef<string | null>(null);
  const convertedUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAvifSupported(detectAvif()), 0);
    return () => {
      clearTimeout(timer);
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
    };
  }, []);

  const convert = useCallback(async (
    source: OriginalImage,
    targetFormat: OutputFormat,
    targetQuality: number,
    fill: string,
  ) => {
    setBusy(true);
    setErrorCode(null);
    try {
      const image = await loadImage(source.url);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("no_context");

      if (targetFormat === "image/jpeg") {
        context.fillStyle = fill || "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          resolve,
          targetFormat,
          isLossy(targetFormat) ? clampQuality(targetQuality) / 100 : undefined,
        );
      });
      if (!blob) throw new Error("encode_failed");

      if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
      const url = URL.createObjectURL(blob);
      convertedUrlRef.current = url;
      setConverted({ url, blob, width: canvas.width, height: canvas.height });
    } catch {
      setErrorCode("failed");
      setConverted(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!isAcceptedType(file.type)) {
      setErrorCode("type");
      setConverted(null);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorCode("size");
      setConverted(null);
      return;
    }
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    const url = URL.createObjectURL(file);
    originalUrlRef.current = url;
    loadImage(url).then((image) => {
      const source: OriginalImage = {
        file,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      setOriginal(source);
      void convert(source, format, quality, background);
    }).catch(() => {
      setErrorCode("decode");
      setConverted(null);
    });
  }, [convert, format, quality, background]);

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSample = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, 640, 360);
    gradient.addColorStop(0, "#5b4bff");
    gradient.addColorStop(1, "#8a7cff");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 640, 360);
    context.fillStyle = "#ffffff";
    context.font = "600 32px sans-serif";
    context.fillText("Toolpika sample image", 48, 190);
    canvas.toBlob((blob) => {
      if (blob) handleFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
    }, "image/png");
  };

  const handleReset = () => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (convertedUrlRef.current) URL.revokeObjectURL(convertedUrlRef.current);
    originalUrlRef.current = null;
    convertedUrlRef.current = null;
    setOriginal(null);
    setConverted(null);
    setFormat("image/webp");
    setQuality(80);
    setBackground("#ffffff");
    setErrorCode(null);
  };

  const changeFormat = (next: OutputFormat) => {
    if (next === "image/avif" && !avifSupported) {
      setErrorCode("unsupported");
      return;
    }
    setFormat(next);
    if (original) void convert(original, next, quality, background);
  };

  const changeQuality = (next: number) => {
    const value = clampQuality(next);
    setQuality(value);
    if (original && isLossy(format)) void convert(original, format, value, background);
  };

  const changeBackground = (next: string) => {
    setBackground(next);
    if (original && format === "image/jpeg") void convert(original, format, quality, next);
  };

  const errorText = errorCode === "type"
    ? `${tw("image-format-converter.errorType")} ${tw("image-format-converter.fixType")}`
    : errorCode === "size"
      ? `${tw("image-format-converter.errorSize")} ${tw("image-format-converter.fixSize")}`
      : errorCode === "decode"
        ? `${tw("image-format-converter.errorDecode")} ${tw("image-format-converter.fixDecode")}`
        : errorCode === "unsupported"
          ? `${tw("image-format-converter.errorAvif")} ${tw("image-format-converter.fixAvif")}`
          : errorCode === "failed"
            ? `${tw("image-format-converter.errorFailed")} ${tw("image-format-converter.fixFailed")}`
            : "";

  const delta = original && converted ? sizeDelta(original.file.size, converted.blob.size) : null;
  const fileName = original ? outputFileName(original.file.name, format) : "";

  const formatOptions = [
    { value: "image/webp" as const, label: tw("image-format-converter.formatWebp") },
    { value: "image/jpeg" as const, label: tw("image-format-converter.formatJpeg") },
    { value: "image/png" as const, label: tw("image-format-converter.formatPng") },
    { value: "image/avif" as const, label: tw("image-format-converter.formatAvif") },
  ];

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Image" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("image-format-converter.title")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("image-format-converter.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("image-format-converter.reset")}
          </Button>
        </div>
      </div>

      {errorText ? (
        <p className="tp-tool-notice" data-tone="warning" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorText}
        </p>
      ) : null}

      <div className="tp-tool-body tp-tool-body--stacked">
        <section className="tp-tool-pane" aria-labelledby="tp-image-format-input-title">
          <div className="tp-tool-pane-head">
            <div className="tp-tool-pane-title">
              <h3 id="tp-image-format-input-title">{tw("image-format-converter.inputTitle")}</h3>
              <p className="tp-tool-pane-hint">{tw("image-format-converter.inputHint")}</p>
            </div>
          </div>
          <div className="tp-tool-pane-body">
            <div
              className={`tp-drop-zone${dragging ? " is-dragging" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-5 w-5" aria-hidden="true" />
              <p>{tw("image-format-converter.uploadLabel")}</p>
              <p className="tp-tool-hint">{tw("image-format-converter.dropHint")}</p>
              <input
                ref={fileInputRef}
                id="tp-image-format-file"
                type="file"
                accept={["image/jpeg", "image/png", "image/webp", "image/avif", "image/bmp"].join(",")}
                className="sr-only"
                onChange={handleInput}
                aria-label={tw("image-format-converter.uploadLabel")}
              />
              <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                {t("chooseImage")}
              </Button>
            </div>

            <div className="tp-tool-group tp-tool-group--flush">
              <span className="tp-tool-group-title">{tw("image-format-converter.formatLabel")}</span>
              <SegmentedControl<OutputFormat>
                label={tw("image-format-converter.formatLabel")}
                value={format}
                options={formatOptions}
                onChange={changeFormat}
              />
              {format === "image/avif" && !avifSupported ? (
                <p className="tp-tool-hint">{tw("image-format-converter.avifCapability")}</p>
              ) : null}
              {!isLossy(format) ? (
                <p className="tp-tool-hint">{tw("image-format-converter.losslessNote")}</p>
              ) : null}
            </div>

            {isLossy(format) ? (
              <div className="tp-tool-group tp-tool-group--flush">
                <div className="flex items-center justify-between gap-2">
                  <span className="tp-tool-group-title">{tw("image-format-converter.qualityLabel")}</span>
                  <span className="tp-tool-value" dir="ltr">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={quality}
                  className="tp-tool-range"
                  aria-label={tw("image-format-converter.qualityLabel")}
                  onChange={(event) => changeQuality(Number(event.target.value))}
                />
                <div className="flex flex-wrap gap-2">
                  {[50, 75, 90].map((preset) => (
                    <Button key={preset} type="button" size="sm" variant="secondary" onClick={() => changeQuality(preset)}>
                      {preset}%
                    </Button>
                  ))}
                </div>
                <p className="tp-tool-hint">{tw("image-format-converter.qualityHint")}</p>
              </div>
            ) : null}

            {format === "image/jpeg" ? (
              <div className="tp-tool-group tp-tool-group--flush">
                <label className="tp-tool-label" htmlFor="tp-image-format-background">
                  {tw("image-format-converter.backgroundLabel")}
                </label>
                <div className="tp-color-row">
                  <input
                    id="tp-image-format-background"
                    type="color"
                    value={background}
                    className="tp-color-input"
                    onChange={(event) => changeBackground(event.target.value)}
                    aria-label={tw("image-format-converter.backgroundLabel")}
                  />
                  <input
                    type="text"
                    className="tp-field-input"
                    value={background}
                    aria-label={tw("image-format-converter.backgroundHexLabel")}
                    onChange={(event) => changeBackground(event.target.value)}
                  />
                </div>
                <p className="tp-tool-hint">{tw("image-format-converter.backgroundHint")}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="tp-tool-pane tp-tool-pane--result" aria-labelledby="tp-image-format-result-title">
          <div className="tp-tool-pane-head">
            <div className="tp-tool-pane-title">
              <h3 id="tp-image-format-result-title">{t("results")}</h3>
              <p className="tp-tool-pane-hint">{tw("image-format-converter.resultHint")}</p>
            </div>
            {converted ? (
              <div className="tp-tool-pane-actions">
                <DownloadButton content={converted.blob} fileName={fileName} label={tw("image-format-converter.downloadLabel")} />
              </div>
            ) : null}
          </div>
          <div className="tp-tool-pane-body">
            {!original || !converted ? (
              <ToolEmpty icon={<Download aria-hidden="true" />} title={busy ? tw("image-format-converter.busyTitle") : tw("image-format-converter.emptyTitle")} hint={tw("image-format-converter.emptyHint")} />
            ) : (
              <div className="tp-tool-result" aria-live="polite">
                <div className="tp-image-preview-grid">
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={original.url} alt={tw("image-format-converter.originalPreview")} />
                    <figcaption>{tw("image-format-converter.originalLabel")}</figcaption>
                  </figure>
                  <figure>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={converted.url} alt={tw("image-format-converter.convertedPreview")} />
                    <figcaption>{tw("image-format-converter.convertedLabel")}</figcaption>
                  </figure>
                </div>

                <dl className="tp-tool-stats">
                  <Stat label={tw("image-format-converter.dimensionsLabel")} value={`${original.width} × ${original.height}`} />
                  <Stat label={tw("image-format-converter.originalSizeLabel")} value={formatBytes(original.file.size)} />
                  <Stat label={tw("image-format-converter.convertedSizeLabel")} value={formatBytes(converted.blob.size)} />
                  <Stat label={tw("image-format-converter.deltaLabel")} value={delta ? formatDelta(delta) : "0 B"} />
                </dl>

                <div className="tp-tool-group tp-tool-group--flush">
                  <span className="tp-tool-group-title">{tw("image-format-converter.fileLabel")}</span>
                  <div className="tp-tool-url"><code dir="ltr">{fileName}</code></div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("image-format-converter.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
