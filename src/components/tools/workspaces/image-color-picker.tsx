"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Image as ImageIcon, LoaderCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CopyButton, NumberStepper, ToolEmpty, ToolField } from "../workspace-ui";
import {
  ACCEPTED_TYPES,
  DEFAULT_PALETTE_SIZE,
  MAX_FILE_BYTES,
  MAX_PALETTE_SIZE,
  MIN_PALETTE_SIZE,
  cssVariables,
  formatBytes,
  formatHsl,
  formatRgb,
  isAcceptedType,
  quantizePalette,
  rgbToHex,
  rgbToHsl,
  type Hsl,
  type PaletteSwatch,
  type Rgb,
} from "./image-color-picker.logic";

interface LoadedImage {
  url: string;
  name: string;
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

interface PickedColor {
  hex: string;
  rgb: Rgb;
  hsl: Hsl;
}

type ColorErrorCode = "unsupported" | "tooLarge" | "decodeFailed" | "sampleFailed";

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

export default function ImageColorPicker() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [count, setCount] = useState(String(DEFAULT_PALETTE_SIZE));
  const [palette, setPalette] = useState<PaletteSwatch[]>([]);
  const [selected, setSelected] = useState<PickedColor | null>(null);
  const [loupe, setLoupe] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<ColorErrorCode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourceRef = useRef<DecodedImage | null>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const releaseSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => releaseSource();
  }, [releaseSource]);

  useEffect(() => {
    if (!loaded) return;
    return () => URL.revokeObjectURL(loaded.url);
  }, [loaded]);

  const buildSampleCanvas = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return null;
    const canvas = document.createElement("canvas");
    const ratio = source.width / Math.max(1, source.height);
    canvas.width = Math.max(1, Math.min(512, source.width));
    canvas.height = Math.max(1, Math.round(canvas.width / ratio));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(source.source, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

  const extract = useCallback((wanted: number) => {
    const canvas = buildSampleCanvas();
    if (!canvas) {
      setErrorCode("sampleFailed");
      return;
    }
    try {
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setErrorCode("sampleFailed");
        return;
      }
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const result = quantizePalette(data, wanted);
      if (result.length === 0) {
        setErrorCode("sampleFailed");
        return;
      }
      setErrorCode(null);
      setPalette(result);
    } catch {
      setErrorCode("sampleFailed");
    }
  }, [buildSampleCanvas]);

  const handleFile = useCallback(
    async (candidate: File | undefined, wanted: number) => {
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
        setLoaded({
          url,
          name: candidate.name,
          size: candidate.size,
          width: decoded.width,
          height: decoded.height,
        });
        pixelCanvasRef.current = buildSampleCanvas();
        setSelected(null);
        setLoupe(null);
        extract(wanted);
        setBusy(false);
      } catch {
        URL.revokeObjectURL(url);
        setErrorCode("decodeFailed");
        setBusy(false);
      }
    },
    [extract, buildSampleCanvas, releaseSource],
  );

  const pickAt = (event: ReactPointerEvent<HTMLImageElement>) => {
    const canvas = pixelCanvasRef.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!canvas || rect.width === 0 || rect.height === 0) return;
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor((event.nativeEvent.offsetX / rect.width) * canvas.width)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor((event.nativeEvent.offsetY / rect.height) * canvas.height)));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const pixel = context.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const a = pixel[3];
    if (a < 128) return;
    const rgb: Rgb = { r, g, b };
    setSelected({ hex: rgbToHex(rgb), rgb, hsl: rgbToHsl(rgb) });
    setLoupe({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
  };

  const handleSample = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const context = canvas.getContext("2d");
    if (!context) return;
    const stops = ["#5b4bff", "#8a7cff", "#ffb27a", "#2ec4b6", "#1b1b2f"];
    stops.forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(0, (index * canvas.height) / stops.length, canvas.width, canvas.height / stops.length + 1);
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      void handleFile(new File([blob], "toolpika-palette-sample.png", { type: "image/png" }), Number(count) || DEFAULT_PALETTE_SIZE);
    }, "image/png");
  };

  const handleCount = (value: string) => {
    const wanted = Math.max(MIN_PALETTE_SIZE, Math.min(MAX_PALETTE_SIZE, Number(value) || DEFAULT_PALETTE_SIZE));
    setCount(String(wanted));
    extract(wanted);
  };

  const handleReset = () => {
    releaseSource();
    pixelCanvasRef.current = null;
    setLoaded(null);
    setCount(String(DEFAULT_PALETTE_SIZE));
    setPalette([]);
    setSelected(null);
    setLoupe(null);
    setErrorCode(null);
    setDragging(false);
  };

  const errorMessage = errorCode
    ? errorCode === "unsupported"
      ? tw("image-color-picker.errorUnsupported")
      : errorCode === "tooLarge"
        ? tw("image-color-picker.errorTooLarge")
        : errorCode === "decodeFailed"
          ? tw("image-color-picker.errorDecode")
          : tw("image-color-picker.errorSample")
    : "";

  const css = useMemo(() => cssVariables(palette), [palette]);

  const dropHandlers = {
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true); },
    onDragLeave: () => setDragging(false),
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      void handleFile(event.dataTransfer.files[0], Number(count) || DEFAULT_PALETTE_SIZE);
    },
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Palette" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("image-color-picker.title")}</span>
            <span className="tp-tool-subtitle">{tw("image-color-picker.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("image-color-picker.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            {t("clear")}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="tp-tool-notice" id="color-error" data-tone="warning" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6" aria-labelledby="color-stage-title">
          <div className="tp-industrial-bar">
            <div>
              <h3 id="color-stage-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("image-color-picker.stageTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("image-color-picker.pickHint")}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              {tw("image-color-picker.replaceImage")}
            </Button>
          </div>

          {loaded ? (
            <div className="tp-stage" aria-live="polite">
              <div className="relative inline-block max-w-full" style={{ lineHeight: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={loaded.url}
                  alt={tw("image-color-picker.previewAlt")}
                  className="block max-h-[44vh] max-w-full cursor-crosshair"
                  onPointerMove={pickAt}
                  onPointerDown={pickAt}
                />
                {selected && loupe ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 h-10 w-10 rounded-full border-2 border-[var(--surface)] shadow-lg"
                    style={{
                      left: loupe.x,
                      top: loupe.y,
                      transform: "translate(-50%, -50%)",
                      background: selected.hex,
                    }}
                  />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="tp-tool-drop" data-dragging={dragging ? "true" : undefined} {...dropHandlers}>
              {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
              <p>{tw("image-color-picker.dropTitle")}</p>
              <p className="tp-tool-hint">{tw("image-color-picker.dropHint")}</p>
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()}>
                {t("chooseImage")}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            id="color-file"
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => {
              void handleFile(event.target.files?.[0], Number(count) || DEFAULT_PALETTE_SIZE);
              event.target.value = "";
            }}
            aria-label={tw("image-color-picker.chooseFile")}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "color-error" : undefined}
          />

          {!loaded ? (
            <div className="flex items-center justify-center">
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <ImageIcon />}
                title={busy ? tw("image-color-picker.processing") : tw("image-color-picker.emptyTitle")}
                hint={busy ? tw("image-color-picker.processingHint") : tw("image-color-picker.emptyHint")}
              />
            </div>
          ) : null}

          {loaded ? (
            <div className="tp-meta-pill" aria-live="polite">
              <strong className="truncate max-w-[180px]">{loaded.name}</strong>
              <span aria-hidden="true">•</span>
              <span dir="ltr">{formatBytes(loaded.size)}</span>
            </div>
          ) : null}
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden lg:col-span-6" aria-labelledby="color-palette-title">
          <div className="tp-industrial-bar">
            <h3 id="color-palette-title" className="text-sm font-semibold text-[var(--text)]">
              {tw("image-color-picker.paletteTitle")}
            </h3>
          </div>

          <ToolField label={tw("image-color-picker.colorCount")} hint={tw("image-color-picker.colorCountHint")}>
            <NumberStepper
              id="color-count"
              value={count}
              min={MIN_PALETTE_SIZE}
              max={MAX_PALETTE_SIZE}
              ariaLabel={tw("image-color-picker.colorCount")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              onValueChange={handleCount}
            />
          </ToolField>

          {palette.length > 0 ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label={tw("image-color-picker.paletteTitle")}>
              {palette.map((swatch, index) => (
                <button
                  key={`${swatch.hex}-${index}`}
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] px-2 py-1 text-xs"
                  onClick={() => setSelected({ hex: swatch.hex, rgb: swatch.rgb, hsl: swatch.hsl })}
                  aria-label={`${swatch.hex} ${swatch.share}%`}
                >
                  <span className="h-5 w-5 shrink-0 rounded-full border border-[var(--border)]" style={{ background: swatch.hex }} aria-hidden="true" />
                  <span dir="ltr">{swatch.hex}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("image-color-picker.selectedColor")}</span>
            {selected ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="h-7 w-7 shrink-0 rounded-md border border-[var(--border)]" style={{ background: selected.hex }} aria-hidden="true" />
                  <code className="min-w-0 flex-1 text-xs text-[var(--text)]" dir="ltr">{selected.hex}</code>
                  <CopyButton text={selected.hex} label={t("copy")} copiedLabel={t("copied")} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="min-w-0 flex-1 text-xs text-[var(--text)]" dir="ltr">{formatRgb(selected.rgb)}</code>
                  <CopyButton text={formatRgb(selected.rgb)} label={t("copy")} copiedLabel={t("copied")} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="min-w-0 flex-1 text-xs text-[var(--text)]" dir="ltr">{formatHsl(selected.hsl)}</code>
                  <CopyButton text={formatHsl(selected.hsl)} label={t("copy")} copiedLabel={t("copied")} />
                </div>
              </div>
            ) : (
              <p className="tp-tool-hint">{tw("image-color-picker.pickHint")}</p>
            )}
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-industrial-bar">
              <span className="tp-tool-group-title">{tw("image-color-picker.cssTitle")}</span>
              <CopyButton text={css} label={tw("image-color-picker.copyCss")} copiedLabel={t("copied")} />
            </div>
            <div className="tp-output-viewer" role="region" aria-label={tw("image-color-picker.cssTitle")}>
              <code dir="ltr">{css}</code>
            </div>
          </div>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("image-color-picker.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
