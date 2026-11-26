"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CheckboxRow,
  DownloadButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  usePersistedOptions,
} from "../workspace-ui";
import {
  ACCEPTED_TYPES,
  MAX_CANVAS_SIDE,
  MAX_FILE_BYTES,
  extensionForFormat,
  fitWithin,
  formatBytes,
  parseFileName,
  type AspectLock,
  type ImageFormat,
} from "./image-resizer.logic";

type ResizeOptions = {
  width: string;
  height: string;
  lock: AspectLock;
  format: ImageFormat;
  quality: number;
};

interface LoadedImage {
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

interface OutputImage {
  url: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

type ResizeErrorCode = "unsupported" | "tooLarge" | "decodeFailed" | "canvasLimit" | "resizeFailed";

const DEFAULT_OPTIONS: ResizeOptions = {
  width: "",
  height: "",
  lock: "auto",
  format: "image/jpeg",
  quality: 0.82,
};

/** Decode a file once; the browser adapter stays inside this client component. */
async function decodeSource(file: File, url: string): Promise<DecodedImage> {
  if (typeof globalThis.createImageBitmap === "function") {
    try {
      const bitmap = await globalThis.createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Older browsers may reject some files; fall back to an Image element.
    }
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new globalThis.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("decode_failed"));
    element.src = url;
  });

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => undefined,
  };
}

function cssToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function parseDimension(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default function ImageResizer() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions(
    "toolpika:image-resizer:options",
    DEFAULT_OPTIONS,
  );

  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [output, setOutput] = useState<OutputImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<ResizeErrorCode | null>(null);

  const sourceRef = useRef<DecodedImage | null>(null);
  const renderIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const releaseSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  // Object URLs belong to the file itself, not to a particular output render.
  useEffect(() => {
    if (!loaded) return;
    return () => URL.revokeObjectURL(loaded.url);
  }, [loaded]);

  useEffect(() => {
    return () => releaseSource();
  }, [releaseSource]);

  // Re-encode on every option change. A request id discards stale renders.
  useEffect(() => {
    const source = sourceRef.current;
    if (!loaded || !source) return;

    const requestId = ++renderIdRef.current;
    let outputUrl: string | null = null;
    setOutput(null);
    setErrorCode(null);
    setBusy(true);

    const target = fitWithin(
      loaded.width,
      loaded.height,
      parseDimension(options.width),
      parseDimension(options.height),
      options.lock,
    );

    const fail = (code: ResizeErrorCode) => {
      if (requestRefMismatch()) return;
      setErrorCode(code);
      setBusy(false);
    };

    const requestRefMismatch = () => requestId !== renderIdRef.current;

    if (target.width > MAX_CANVAS_SIDE || target.height > MAX_CANVAS_SIDE) {
      fail("canvasLimit");
      return () => {
        renderIdRef.current += 1;
      };
    }

    const run = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = target.width;
        canvas.height = target.height;
        const context = canvas.getContext("2d");
        if (!context) {
          fail("resizeFailed");
          return;
        }

        // JPEG has no alpha channel; flatten onto the page surface token.
        if (options.format === "image/jpeg") {
          const surface = cssToken("--surface") || cssToken("--background");
          if (surface) {
            context.fillStyle = surface;
            context.fillRect(0, 0, target.width, target.height);
          }
        }

        context.drawImage(source.source, 0, 0, target.width, target.height);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, options.format, options.quality);
        });

        if (!blob) {
          fail("resizeFailed");
          return;
        }
        if (requestRefMismatch()) return;

        outputUrl = URL.createObjectURL(blob);
        setOutput({
          url: outputUrl,
          blob,
          size: blob.size,
          width: target.width,
          height: target.height,
        });
        setBusy(false);
      } catch {
        fail("resizeFailed");
      }
    };

    void run();

    return () => {
      renderIdRef.current += 1;
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [loaded, options]);

  const loadFile = useCallback(
    async (candidate: File | undefined) => {
      if (!candidate) return;

      if (!(ACCEPTED_TYPES as readonly string[]).includes(candidate.type)) {
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
        const decoded = await decodeSource(candidate, url);
        releaseSource();
        sourceRef.current = decoded;
        setLoaded({
          url,
          name: candidate.name,
          size: candidate.size,
          width: decoded.width,
          height: decoded.height,
        });
        update({
          width: String(decoded.width),
          height: String(decoded.height),
          lock: "auto",
        });
      } catch {
        URL.revokeObjectURL(url);
        setErrorCode("decodeFailed");
        setBusy(false);
      }
    },
    [releaseSource, update],
  );

  const handleSample = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext("2d");
      if (!context) {
        setErrorCode("resizeFailed");
        return;
      }

      const accent = cssToken("--accent");
      const raised = cssToken("--surface-raised") || cssToken("--surface");
      const textColor = cssToken("--text");

      if (accent && raised) {
        const gradient = context.createLinearGradient(0, 0, 640, 360);
        gradient.addColorStop(0, accent);
        gradient.addColorStop(1, raised);
        context.fillStyle = gradient;
        context.fillRect(0, 0, 640, 360);
      }
      if (textColor) {
        context.fillStyle = textColor;
        context.font = "600 32px sans-serif";
        context.fillText("Toolpika sample image", 48, 190);
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      if (!blob) {
        setErrorCode("resizeFailed");
        return;
      }

      await loadFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
    } catch {
      setErrorCode("resizeFailed");
    }
  };

  const handleReset = () => {
    setLoaded(null);
    setOutput(null);
    setErrorCode(null);
    setDragging(false);
    releaseSource();
    resetOptions();
  };

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("image-resizer.errorUnsupported")
      : errorCode === "tooLarge"
        ? tw("image-resizer.errorTooLarge")
        : errorCode === "decodeFailed"
          ? tw("image-resizer.errorDecode")
          : errorCode === "canvasLimit"
            ? tw("image-resizer.errorCanvasLimit")
            : tw("image-resizer.errorResize")
    : "";

  const savedPercent =
    loaded && output && loaded.size > 0
      ? Math.max(0, Math.round((1 - output.size / loaded.size) * 100))
      : 0;

  const downloadName = loaded
    ? `${parseFileName(loaded.name).base || tw("image-resizer.defaultFileName")}-resized.${extensionForFormat(options.format)}`
    : `${tw("image-resizer.defaultFileName")}-resized.${extensionForFormat(options.format)}`;

  // A blank first option keeps the trigger readable before a size is chosen.
  // Selecting a size only writes width and height, so the lock mode stays put.
  const dimensionOptions: { value: string; label: string; group?: string }[] = [
    { value: "", label: tw("image-resizer.customDimensionsSelect") },
    { value: "640x480", label: tw("image-resizer.sizeSmall"), group: tw("image-resizer.groupCommon") },
    { value: "1280x720|medium", label: tw("image-resizer.sizeMedium"), group: tw("image-resizer.groupCommon") },
    { value: "1920x1080|large", label: tw("image-resizer.sizeLarge"), group: tw("image-resizer.groupCommon") },
    { value: "1920x1080|web-hero", label: tw("image-resizer.sizeWebHero"), group: tw("image-resizer.groupWeb") },
    { value: "800x600", label: tw("image-resizer.sizeBlogPost"), group: tw("image-resizer.groupWeb") },
    { value: "1280x720|youtube", label: tw("image-resizer.sizeYouTube"), group: tw("image-resizer.groupSocial") },
    { value: "1200x630", label: tw("image-resizer.sizeFacebook"), group: tw("image-resizer.groupSocial") },
    { value: "1200x1200", label: tw("image-resizer.sizeLinkedIn"), group: tw("image-resizer.groupSocial") },
    { value: "1080x1080", label: tw("image-resizer.sizeInstagramSquare"), group: tw("image-resizer.groupInstagram") },
    { value: "1080x1350", label: tw("image-resizer.sizeInstagramPortrait"), group: tw("image-resizer.groupInstagram") },
    { value: "1080x566", label: tw("image-resizer.sizeInstagramLandscape"), group: tw("image-resizer.groupInstagram") },
    { value: "1080x1920", label: tw("image-resizer.sizeInstagramStory"), group: tw("image-resizer.groupInstagram") },
  ];

  const customDimensionValue =
    options.width && options.height ? `${options.width}x${options.height}` : "";

  const handleCustomDimensions = (value: string) => {
    const [size] = value.split("|");
    const [width, height] = size.split("x");
    if (!width || !height) return;
    update({ width, height });
  };

  const formatOptions: { value: ImageFormat; label: string }[] = [
    { value: "image/jpeg", label: tw("image-resizer.formatJpeg") },
    { value: "image/png", label: tw("image-resizer.formatPng") },
    { value: "image/webp", label: tw("image-resizer.formatWebp") },
  ];

  return (
    <ToolShell
      title={tw("image-resizer.title")}
      subtitle={tw("image-resizer.subtitle")}
      icon="Maximize2"
      sampleLabel={tw("image-resizer.trySample")}
      resetLabel={tw("image-resizer.reset")}
      privacyLabel={tw("image-resizer.privacyLabel")}
      onSample={() => void handleSample()}
      onReset={handleReset}
      input={
        <ToolPane
          id="resize-input-title"
          title={tw("image-resizer.inputTitle")}
          hint={tw("image-resizer.inputHint")}
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
              void loadFile(event.dataTransfer.files[0]);
            }}
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            <strong>{loaded ? loaded.name : tw("image-resizer.dropZoneTitle")}</strong>
            <span>{loaded ? tw("image-resizer.fileHint") : tw("image-resizer.dropZoneHint")}</span>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              onClick={(event) => {
                // The zone is a div, not a label, so this opens the picker once.
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {tw("image-resizer.chooseFiles")}
            </Button>
            <input
              ref={fileInputRef}
              id="resize-file"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              aria-label={tw("image-resizer.chooseFiles")}
              onChange={(event) => {
                void loadFile(event.target.files?.[0]);
                event.target.value = "";
              }}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "resize-error" : undefined}
            />
          </div>

          <ToolField label={tw("image-resizer.customDimensions")}>
            <ThemedSelect
              value={customDimensionValue}
              ariaLabel={tw("image-resizer.customDimensions")}
              options={dimensionOptions}
              onValueChange={handleCustomDimensions}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("image-resizer.width")}>
              <NumberStepper
                id="resize-width"
                value={options.width}
                min={1}
                max={MAX_CANVAS_SIDE}
                ariaLabel={tw("image-resizer.width")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(next) => update({ width: next })}
              />
            </ToolField>
            <ToolField label={tw("image-resizer.height")}>
              <NumberStepper
                id="resize-height"
                value={options.height}
                min={1}
                max={MAX_CANVAS_SIDE}
                ariaLabel={tw("image-resizer.height")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(next) => update({ height: next })}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <CheckboxRow
              id="resize-keep-aspect"
              label={tw("image-resizer.keepAspectRatio")}
              checked={options.lock === "auto"}
              onChange={(checked) => update({ lock: checked ? "auto" : "free" })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("image-resizer.format")}>
              <ThemedSelect
                value={options.format}
                ariaLabel={tw("image-resizer.format")}
                onValueChange={(next) => update({ format: next as ImageFormat })}
                options={formatOptions}
              />
            </ToolField>
            <ToolField
              label={t("quality")}
              hint={
                options.format === "image/png"
                  ? tw("image-resizer.qualityPngHint")
                  : tw("image-resizer.qualityHint")
              }
            >
              <div className="tp-lorem-count-row">
                <input
                  id="resize-quality"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  className="tp-tool-range"
                  value={options.quality}
                  disabled={options.format === "image/png"}
                  aria-label={t("quality")}
                  onChange={(event) => update({ quality: Number(event.target.value) })}
                />
                <span className="tp-tool-pill">
                  {Math.round(options.quality * 100)}%
                </span>
              </div>
            </ToolField>
          </div>

          {loaded ? (
            <dl className="tp-tool-stats">
              <Stat label={tw("image-resizer.originalSize")} value={formatBytes(loaded.size)} />
              <Stat
                label={tw("image-resizer.originalDimensions")}
                value={`${loaded.width} × ${loaded.height}`}
              />
            </dl>
          ) : null}

          {errorMessage ? (
            <p className="tp-tool-error" id="resize-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane id="resize-result-title" title={t("result")} result>
          <div aria-live="polite">
            {output ? (
              <div className="tp-tool-result">
                <div className="tp-tool-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={output.url} alt={tw("image-resizer.previewAlt")} />
                </div>
                <dl className="tp-tool-stats">
                  <Stat
                    label={tw("image-resizer.outputDimensions")}
                    value={`${output.width} × ${output.height}`}
                  />
                  <Stat label={tw("image-resizer.outputSize")} value={formatBytes(output.size)} />
                  <Stat label={tw("image-resizer.savedPercent")} value={`${savedPercent}%`} />
                </dl>
              </div>
            ) : (
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <ImageIcon />}
                title={busy ? tw("image-resizer.processing") : tw("image-resizer.emptyTitle")}
                hint={busy ? tw("image-resizer.processingHint") : tw("image-resizer.emptyHint")}
              />
            )}
          </div>

          <DownloadButton
            content={output?.blob ?? null}
            fileName={downloadName}
            label={t("download")}
            className="tp-full-button"
          />
        </ToolPane>
      }
    />
  );
}
