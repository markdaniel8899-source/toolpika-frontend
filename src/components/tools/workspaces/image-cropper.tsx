"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  DownloadButton,
  NumberStepper,
  SegmentedControl,
  ToolEmpty,
  ToolField,
} from "../workspace-ui";
import {
  ACCEPTED_TYPES,
  MAX_CANVAS_SIDE,
  MAX_FILE_BYTES,
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
type CropShape = "rectangle" | "circle" | "rounded" | "square" | "pill" | "triangle";

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
  const [shape, setShape] = useState<CropShape>("rectangle");
  const [output, setOutput] = useState<OutputImage | null>(null);
  const [variations, setVariations] = useState<Partial<Record<ImageFormat, Blob>>>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<CropErrorCode | null>(null);

  const sourceRef = useRef<DecodedImage | null>(null);
  const outputUrlRef = useRef<string | null>(null);
  const renderIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    box: CropBox;
    handle: "move" | "nw" | "ne" | "sw" | "se";
  } | null>(null);

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
      nextShape: CropShape,
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

        const clipped = nextShape !== "rectangle" && nextShape !== "square";
        if (clipped) {
          context.save();
          context.beginPath();
          if (nextShape === "circle") {
            context.arc(
              size.width / 2,
              size.height / 2,
              Math.min(size.width, size.height) / 2,
              0,
              Math.PI * 2,
            );
          } else if (nextShape === "triangle") {
            context.moveTo(size.width / 2, 0);
            context.lineTo(size.width, size.height);
            context.lineTo(0, size.height);
            context.closePath();
          } else {
            const radius = nextShape === "pill"
              ? Math.min(size.width, size.height) / 2
              : Math.min(size.width, size.height) * 0.16;
            context.moveTo(radius, 0);
            context.lineTo(size.width - radius, 0);
            context.quadraticCurveTo(size.width, 0, size.width, radius);
            context.lineTo(size.width, size.height - radius);
            context.quadraticCurveTo(size.width, size.height, size.width - radius, size.height);
            context.lineTo(radius, size.height);
            context.quadraticCurveTo(0, size.height, 0, size.height - radius);
            context.lineTo(0, radius);
            context.quadraticCurveTo(0, 0, radius, 0);
            context.closePath();
          }
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
        if (clipped) context.restore();

        const encoded: Partial<Record<ImageFormat, Blob>> = {};
        for (const candidate of ["image/png", "image/jpeg", "image/webp"] as ImageFormat[]) {
          const encodedBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, candidate, candidate === "image/png" ? undefined : nextQuality);
          });
          if (encodedBlob) encoded[candidate] = encodedBlob;
        }
        if (requestId !== renderIdRef.current) return;
        const blob = encoded[nextFormat] ?? encoded["image/png"];
        if (!blob) {
          setErrorCode("renderFailed");
          setBusy(false);
          return;
        }
        setVariations(encoded);

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
        setBox(start);
        await renderCrop(start, format, quality, shape);
      } catch {
        URL.revokeObjectURL(url);
        setErrorCode("decodeFailed");
        setBusy(false);
      }
    },
    [shape, format, preset, quality, releaseSource, renderCrop],
  );

  const updateBox = useCallback(
    (next: CropBox) => {
      if (!loaded) return;
      const size: SourceSize = { width: loaded.width, height: loaded.height };
      const normalized = normalizeCropBox(next, size, preset);
      setBox(normalized);
      void renderCrop(normalized, format, quality, shape);
    },
    [shape, format, loaded, preset, quality, renderCrop],
  );

  const chooseAspect = (value: AspectPreset) => {
    setShape("rectangle");
    if (!loaded) {
      setPreset(value);
      return;
    }
    const size: SourceSize = { width: loaded.width, height: loaded.height };
    const next = cropForPreset(box, size, value);
    setPreset(value);
    setBox(next);
    void renderCrop(next, format, quality, "rectangle");
  };

  const chooseCircle = () => {
    if (!loaded) {
      setPreset("1:1");
      setShape("circle");
      return;
    }
    const size: SourceSize = { width: loaded.width, height: loaded.height };
    const next = cropForPreset(box, size, "1:1");
    setPreset("1:1");
    setShape("circle");
    setBox(next);
    void renderCrop(next, format, quality, "circle");
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
    setShape("rectangle");
    setOutput(null);
    setVariations({});
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
  const activePill = shape === "circle" ? "circle" : preset;

  const aspectPills: { value: AspectPreset | "circle"; label: string }[] = [
    { value: "free", label: tw("image-cropper.presetFree") },
    { value: "1:1", label: tw("image-cropper.presetSquare") },
    { value: "4:3", label: tw("image-cropper.presetFourThree") },
    { value: "16:9", label: tw("image-cropper.presetSixteenNine") },
    { value: "3:4", label: tw("image-cropper.presetThreeFour") },
    { value: "circle", label: tw("image-cropper.shapeCircle") },
  ];

  const formatOptions = [
    { value: "image/png", label: tw("image-cropper.formatPng") },
    { value: "image/jpeg", label: tw("image-cropper.formatJpeg") },
    { value: "image/webp", label: tw("image-cropper.formatWebp") },
  ];

  const startDrag = (
    event: ReactPointerEvent<HTMLElement>,
    handle: "move" | "nw" | "ne" | "sw" | "se",
  ) => {
    if (!loaded) return;
    event.stopPropagation();
    dragRef.current = { startX: event.clientX, startY: event.clientY, box, handle };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !loaded || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const deltaX = ((event.clientX - drag.startX) / rect.width) * loaded.width;
    const deltaY = ((event.clientY - drag.startY) / rect.height) * loaded.height;
    const start = drag.box;
    if (drag.handle === "move") {
      updateBox({ ...start, x: start.x + deltaX, y: start.y + deltaY });
      return;
    }
    const next = { ...start };
    if (drag.handle === "se") {
      next.width = start.width + deltaX;
      next.height = start.height + deltaY;
    } else if (drag.handle === "sw") {
      next.x = start.x + deltaX;
      next.width = start.width - deltaX;
      next.height = start.height + deltaY;
    } else if (drag.handle === "ne") {
      next.y = start.y + deltaY;
      next.width = start.width + deltaX;
      next.height = start.height - deltaY;
    } else {
      next.x = start.x + deltaX;
      next.y = start.y + deltaY;
      next.width = start.width - deltaX;
      next.height = start.height - deltaY;
    }
    updateBox(next);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const dropHandlers = {
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      void loadFile(event.dataTransfer.files[0]);
    },
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Crop" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("image-cropper.title")}</span>
            <span className="tp-tool-subtitle">{tw("image-cropper.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={() => void handleSample()}>
            {tw("image-cropper.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            {t("clear")}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="tp-tool-notice" id="crop-error" data-tone="warning" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-7" aria-labelledby="crop-stage-title">
          <div className="tp-industrial-bar">
            <div>
              <h3 id="crop-stage-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("image-cropper.stageTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("image-cropper.stageHint")}</p>
            </div>
          </div>

          {loaded ? (
            <div className="tp-stage" aria-live="polite">
              <div ref={stageRef} className="relative inline-block max-w-full" style={{ lineHeight: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loaded.url}
                  alt={tw("image-cropper.previewAlt")}
                  className="block max-h-[44vh] max-w-full"
                />
                {percent ? (
                  <div
                    role="presentation"
                    onPointerDown={(event) => startDrag(event, "move")}
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
                      borderRadius: shape === "circle" ? "50%" : shape === "pill" ? "999px" : shape === "rounded" ? "16%" : shape === "triangle" ? "0" : "4px",
                      touchAction: "none",
                    }}
                  >
                    {(["nw", "ne", "sw", "se"] as const).map((handle) => (
                      <span
                        key={handle}
                        className={`tp-crop-handle tp-crop-handle--${handle}`}
                        role="presentation"
                        onPointerDown={(event) => startDrag(event, handle)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="tp-tool-drop" data-dragging={dragging ? "true" : undefined} {...dropHandlers}>
              {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
              <p>{tw("image-cropper.dropTitle")}</p>
              <p className="tp-tool-hint">{tw("image-cropper.dropHint")}</p>
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                {t("chooseImage")}
              </Button>
            </div>
          )}

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

          {!loaded ? (
            <div className="flex items-center justify-center">
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <ImageIcon />}
                title={busy ? tw("image-cropper.processing") : tw("image-cropper.emptyTitle")}
                hint={busy ? tw("image-cropper.processingHint") : tw("image-cropper.emptyHint")}
              />
            </div>
          ) : null}

          {loaded ? (
            <>
              <p className="tp-tool-hint">{tw("image-cropper.dragHint")}</p>
              <div className="tp-meta-pill" aria-live="polite">
                <span>{tw("image-cropper.cropPixels")}:</span>
                <strong dir="ltr">{box.width} × {box.height} px</strong>
                <span aria-hidden="true">•</span>
                <span>{tw("image-cropper.outputSize")}:</span>
                <span dir="ltr">{formatBytes(output?.size ?? 0)}</span>
              </div>
            </>
          ) : null}
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden lg:col-span-5" aria-labelledby="crop-controls-title">
          <div className="tp-industrial-bar">
            <h3 id="crop-controls-title" className="text-sm font-semibold text-[var(--text)]">
              {tw("image-cropper.controlsTitle")}
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              {tw("image-cropper.replaceImage")}
            </Button>
          </div>

          <ToolField label={tw("image-cropper.presets")}>
            <div className="flex flex-wrap gap-2" role="group" aria-label={tw("image-cropper.presets")}>
              {aspectPills.map((pill) => (
                <Button
                  key={pill.value}
                  type="button"
                  size="sm"
                  variant={activePill === pill.value ? "default" : "secondary"}
                  className="rounded-full"
                  aria-pressed={activePill === pill.value}
                  onClick={() => {
                    if (pill.value === "circle") chooseCircle();
                    else chooseAspect(pill.value);
                  }}
                >
                  {pill.label}
                </Button>
              ))}
            </div>
          </ToolField>

          <details className="tp-tool-group tp-tool-group--flush">
            <summary className="tp-tool-group-title cursor-pointer">
              {tw("image-cropper.precisionExport")}
            </summary>
            <div className="mt-3 flex flex-col gap-3">
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
                <span className="tp-tool-group-title">{tw("image-cropper.shapeLabel")}</span>
                <SegmentedControl<CropShape>
                  label={tw("image-cropper.shapeLabel")}
                  value={shape}
                  options={[
                    { value: "rectangle", label: tw("image-cropper.shapeRectangle") },
                    { value: "square", label: tw("image-cropper.shapeSquare") },
                    { value: "circle", label: tw("image-cropper.shapeCircle") },
                    { value: "rounded", label: tw("image-cropper.shapeRounded") },
                    { value: "pill", label: tw("image-cropper.shapePill") },
                    { value: "triangle", label: tw("image-cropper.shapeTriangle") },
                  ]}
                  onChange={(next) => {
                    setShape(next);
                    if (next === "square" && loaded) {
                      const nextBox = cropForPreset(box, { width: loaded.width, height: loaded.height }, "1:1");
                      setPreset("1:1");
                      setBox(nextBox);
                      void renderCrop(nextBox, format, quality, next);
                    } else {
                      void renderCrop(box, format, quality, next);
                    }
                  }}
                />
                <p className="tp-tool-hint">{tw("image-cropper.shapeHint")}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ToolField label={tw("image-cropper.outputFormat")}>
                  <ThemedSelect
                    value={format}
                    onValueChange={(value) => {
                      const nextFormat = value as ImageFormat;
                      setFormat(nextFormat);
                      void renderCrop(box, nextFormat, quality, shape);
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
                      void renderCrop(box, format, nextQuality, shape);
                    }}
                    className="tp-tool-range"
                  />
                </ToolField>
              </div>
            </div>
          </details>

          <DownloadButton
            content={output?.blob ?? null}
            fileName={downloadName}
            label={tw("image-cropper.downloadCropped")}
            variant="default"
            className="tp-full-button"
          />

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("image-cropper.downloadVariations")}</span>
            <div className="flex flex-wrap gap-2">
              {(["image/png", "image/jpeg", "image/webp"] as ImageFormat[]).map((candidate) => (
                <DownloadButton
                  key={candidate}
                  content={variations[candidate] ?? null}
                  fileName={`${downloadName.replace(/\.[^.]+$/u, "")}.${extensionForFormat(candidate)}`}
                  label={candidate === "image/png"
                    ? tw("image-cropper.formatPng")
                    : candidate === "image/jpeg"
                      ? tw("image-cropper.formatJpeg")
                      : tw("image-cropper.formatWebp")}
                  variant="default"
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("image-cropper.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
