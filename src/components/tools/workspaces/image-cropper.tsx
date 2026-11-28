"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  DownloadButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "../workspace-ui";
import {
  ACCEPTED_TYPES,
  MAX_CANVAS_SIDE,
  MAX_FILE_BYTES,
  ASPECT_PRESETS,
  cropBoxPercent,
  cropForPreset,
  extensionForFormat,
  formatBytes,
  initialCropBox,
  isAcceptedType,
  normalizeCropBox,
  outputSize,
  parseFileName,
  type AspectPreset,
  type CropBox,
  type ImageFormat,
  type SourceSize,
} from "./image-cropper.logic";

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

type CropErrorCode = "unsupported" | "tooLarge" | "decodeFailed" | "canvasLimit" | "renderFailed";

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

function surfaceColor(): string {
  const root = getComputedStyle(document.documentElement);
  return root.getPropertyValue("--surface").trim() || root.getPropertyValue("--background").trim() || "#ffffff";
}

export default function ImageCropper() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [box, setBox] = useState<CropBox>({ x: 0, y: 0, width: 1, height: 1 });
  const [preset, setPreset] = useState<AspectPreset>("free");
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState(0.9);
  const [circle, setCircle] = useState(false);
  const [output, setOutput] = useState<OutputImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<CropErrorCode | null>(null);

  const sourceRef = useRef<DecodedImage | null>(null);
  const outputUrlRef = useRef<string | null>(null);
  const renderIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; box: CropBox } | null>(null);

  const releaseSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      releaseSource();
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    };
  }, [releaseSource]);

  useEffect(() => {
    if (!loaded) return;
    return () => URL.revokeObjectURL(loaded.url);
  }, [loaded]);

  const renderCrop = useCallback(
    async (
      nextBox: CropBox,
      nextFormat: ImageFormat,
      nextQuality: number,
      nextCircle: boolean,
    ) => {
      const source = sourceRef.current;
      if (!source) return;

      const requestId = ++renderIdRef.current;
      setBusy(true);
      setErrorCode(null);

      try {
        const size = outputSize(nextBox);
        if (size.width > MAX_CANVAS_SIDE || size.height > MAX_CANVAS_SIDE) {
          if (requestId === renderIdRef.current) {
            setErrorCode("canvasLimit");
            setBusy(false);
          }
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = size.width;
        canvas.height = size.height;
        const context = canvas.getContext("2d");
        if (!context) {
          if (requestId === renderIdRef.current) {
            setErrorCode("renderFailed");
            setBusy(false);
          }
          return;
        }

        if (nextCircle) {
          context.save();
          context.beginPath();
          context.arc(
            size.width / 2,
            size.height / 2,
            Math.min(size.width, size.height) / 2,
            0,
            Math.PI * 2,
          );
          context.clip();
        } else if (nextFormat === "image/jpeg") {
          context.fillStyle = surfaceColor();
          context.fillRect(0, 0, size.width, size.height);
        }

        context.drawImage(
          source.source,
          nextBox.x,
          nextBox.y,
          size.width,
          size.height,
          0,
          0,
          size.width,
          size.height,
        );
        if (nextCircle) context.restore();

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
        if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
        outputUrlRef.current = url;
        setOutput({ url, blob, size: blob.size, ...size });
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

  const loadFile = useCallback(
    async (candidate: File | undefined) => {
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
        const decoded = await decodeSource(candidate, url);
        releaseSource();
        sourceRef.current = decoded;
        const size: SourceSize = { width: decoded.width, height: decoded.height };
        const start = initialCropBox(size, preset);
        setLoaded({
          url,
          name: candidate.name,
          size: candidate.size,
          width: decoded.width,
          height: decoded.height,
        });
        setPreset("free");
        setBox(start);
        await renderCrop(start, format, quality, circle);
      } catch {
        URL.revokeObjectURL(url);
        setErrorCode("decodeFailed");
        setBusy(false);
      }
    },
    [circle, format, preset, quality, releaseSource, renderCrop],
  );

  const updateBox = useCallback(
    (next: CropBox) => {
      if (!loaded) return;
      const size: SourceSize = { width: loaded.width, height: loaded.height };
      const normalized = normalizeCropBox(next, size, preset);
      setBox(normalized);
      void renderCrop(normalized, format, quality, circle);
    },
    [circle, format, loaded, preset, quality, renderCrop],
  );

  const handlePreset = (value: string) => {
    const nextPreset = value as AspectPreset;
    if (!loaded) {
      setPreset(nextPreset);
      return;
    }
    const size: SourceSize = { width: loaded.width, height: loaded.height };
    const next = cropForPreset(box, size, nextPreset);
    setPreset(nextPreset);
    setBox(next);
    void renderCrop(next, format, quality, circle);
  };

  const handleSample = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext("2d");
      if (!context) return;
      const gradient = context.createLinearGradient(0, 0, 640, 480);
      gradient.addColorStop(0, "#5b4bff");
      gradient.addColorStop(1, "#8a7cff");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 640, 480);
      context.fillStyle = "#ffffff";
      context.font = "600 30px sans-serif";
      context.fillText("Toolpika sample image", 56, 250);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      await loadFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
    } catch {
      setErrorCode("decodeFailed");
    }
  };

  const handleReset = () => {
    renderIdRef.current += 1;
    setLoaded(null);
    setBox({ x: 0, y: 0, width: 1, height: 1 });
    setPreset("free");
    setFormat("image/png");
    setQuality(0.9);
    setCircle(false);
    setOutput(null);
    setErrorCode(null);
    setDragging(false);
    releaseSource();
  };

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("image-cropper.errorUnsupported")
      : errorCode === "tooLarge"
        ? tw("image-cropper.errorTooLarge")
        : errorCode === "decodeFailed"
          ? tw("image-cropper.errorDecode")
          : errorCode === "canvasLimit"
            ? tw("image-cropper.errorCanvasLimit")
            : tw("image-cropper.errorRender")
    : "";

  const percent = loaded ? cropBoxPercent(box, { width: loaded.width, height: loaded.height }) : null;
  const downloadName = `${loaded ? parseFileName(loaded.name).base || tw("image-cropper.defaultFileName") : tw("image-cropper.defaultFileName")}-crop.${extensionForFormat(format)}`;

  const presetOptions = ASPECT_PRESETS.map((value) => ({
    value,
    label:
      value === "free"
        ? tw("image-cropper.presetFree")
        : value === "1:1"
          ? tw("image-cropper.presetSquare")
          : value === "4:3"
            ? tw("image-cropper.presetFourThree")
            : value === "16:9"
              ? tw("image-cropper.presetSixteenNine")
              : tw("image-cropper.presetThreeFour"),
  }));

  const formatOptions = [
    { value: "image/png", label: tw("image-cropper.formatPng") },
    { value: "image/jpeg", label: tw("image-cropper.formatJpeg") },
    { value: "image/webp", label: tw("image-cropper.formatWebp") },
  ];

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!loaded) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, box };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !loaded || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const deltaX = ((event.clientX - drag.startX) / rect.width) * loaded.width;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * loaded.height;
    updateBox({ ...drag.box, x: drag.box.x + deltaX, y: drag.box.y + deltaY });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <ToolShell
      title={tw("image-cropper.title")}
      subtitle={tw("image-cropper.shortDesc")}
      icon="Crop"
      sampleLabel={tw("image-cropper.trySample")}
      resetLabel={tw("image-cropper.reset")}
      privacyLabel={tw("image-cropper.privacyRibbon")}
      onSample={() => void handleSample()}
      onReset={handleReset}
      input={
        <ToolPane
          id="crop-controls-title"
          title={tw("image-cropper.controlsTitle")}
          hint={tw("image-cropper.controlsHint")}
          className="order-2"
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
            <strong>{loaded ? loaded.name : tw("image-cropper.dropTitle")}</strong>
            <span>{loaded ? tw("image-cropper.replaceHint") : tw("image-cropper.dropHint")}</span>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {tw("image-cropper.chooseFile")}
            </Button>
            <input
              ref={fileInputRef}
              id="crop-file"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              aria-label={tw("image-cropper.chooseFile")}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "crop-error" : undefined}
              onChange={(event) => {
                void loadFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </div>

          <ToolField label={tw("image-cropper.presets")}>
            <ThemedSelect
              value={preset}
              onValueChange={handlePreset}
              options={presetOptions}
              ariaLabel={tw("image-cropper.presets")}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("image-cropper.cropX")}>
              <NumberStepper
                id="crop-x"
                value={String(box.x)}
                min={0}
                max={loaded ? loaded.width - box.width : 0}
                ariaLabel={tw("image-cropper.cropX")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(value) => updateBox({ ...box, x: Number(value) || 0 })}
              />
            </ToolField>
            <ToolField label={tw("image-cropper.cropY")}>
              <NumberStepper
                id="crop-y"
                value={String(box.y)}
                min={0}
                max={loaded ? loaded.height - box.height : 0}
                ariaLabel={tw("image-cropper.cropY")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(value) => updateBox({ ...box, y: Number(value) || 0 })}
              />
            </ToolField>
            <ToolField label={tw("image-cropper.cropWidth")}>
              <NumberStepper
                id="crop-width"
                value={String(box.width)}
                min={1}
                max={loaded ? loaded.width : 1}
                ariaLabel={tw("image-cropper.cropWidth")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(value) => updateBox({ ...box, width: Number(value) || 1 })}
              />
            </ToolField>
            <ToolField label={tw("image-cropper.cropHeight")}>
              <NumberStepper
                id="crop-height"
                value={String(box.height)}
                min={1}
                max={loaded ? loaded.height : 1}
                ariaLabel={tw("image-cropper.cropHeight")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={(value) => updateBox({ ...box, height: Number(value) || 1 })}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <ToolField label={tw("image-cropper.circleCrop")}>
              <input
                id="crop-circle"
                type="checkbox"
                className="tp-checkbox"
                checked={circle}
                aria-label={tw("image-cropper.circleCrop")}
                onChange={(event) => {
                  setCircle(event.target.checked);
                  void renderCrop(box, format, quality, event.target.checked);
                }}
              />
            </ToolField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("image-cropper.outputFormat")}>
              <ThemedSelect
                value={format}
                onValueChange={(value) => {
                  const nextFormat = value as ImageFormat;
                  setFormat(nextFormat);
                  void renderCrop(box, nextFormat, quality, circle);
                }}
                options={formatOptions}
                ariaLabel={tw("image-cropper.outputFormat")}
              />
            </ToolField>
            <ToolField
              label={t("quality")}
              hint={format === "image/png" ? tw("image-cropper.qualityPngHint") : undefined}
            >
              <input
                id="crop-quality"
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                disabled={format === "image/png"}
                aria-label={t("quality")}
                onChange={(event) => {
                  const nextQuality = Number(event.target.value);
                  setQuality(nextQuality);
                  void renderCrop(box, format, nextQuality, circle);
                }}
                className="tp-tool-range"
              />
            </ToolField>
          </div>

          {errorMessage ? (
            <p className="tp-tool-error" id="crop-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="crop-stage-title"
          title={tw("image-cropper.stageTitle")}
          hint={tw("image-cropper.stageHint")}
          className="order-1"
          result
        >
          <div aria-live="polite" className="tp-tool-result">
            {loaded ? (
              <>
                <div
                  ref={stageRef}
                  className="relative inline-block max-w-full"
                  style={{ lineHeight: 0 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={loaded.url}
                    alt={tw("image-cropper.previewAlt")}
                    className="block max-h-[320px] max-w-full"
                  />
                  {percent ? (
                    <div
                      role="presentation"
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      className="absolute cursor-move border-2 border-[var(--accent)]"
                      style={{
                        left: `${percent.left}%`,
                        top: `${percent.top}%`,
                        width: `${percent.width}%`,
                        height: `${percent.height}%`,
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        boxShadow: "0 0 0 9999px color-mix(in srgb, var(--text) 22%, transparent)",
                        borderRadius: circle ? "50%" : "4px",
                        touchAction: "none",
                      }}
                    />
                  ) : null}
                </div>
                <p className="tp-tool-hint">{tw("image-cropper.dragHint")}</p>
                <dl className="tp-tool-stats">
                  <Stat
                    label={tw("image-cropper.cropPixels")}
                    value={`${box.width} × ${box.height}`}
                  />
                  <Stat label={tw("image-cropper.originalSize")} value={formatBytes(loaded.size)} />
                  <Stat label={tw("image-cropper.outputSize")} value={formatBytes(output?.size ?? 0)} />
                </dl>
              </>
            ) : (
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <ImageIcon />}
                title={busy ? tw("image-cropper.processing") : tw("image-cropper.emptyTitle")}
                hint={busy ? tw("image-cropper.processingHint") : tw("image-cropper.emptyHint")}
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
