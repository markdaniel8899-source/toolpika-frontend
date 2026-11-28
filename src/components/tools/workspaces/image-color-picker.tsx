"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LoaderCircle, Palette as PaletteIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "../workspace-ui";
import {
  ACCEPTED_TYPES,
  DEFAULT_PALETTE_SIZE,
  MAX_FILE_BYTES,
  MAX_PALETTE_SIZE,
  MIN_PALETTE_SIZE,
  cssVariables,
  formatHsl,
  formatRgb,
  isAcceptedType,
  quantizePalette,
  type PaletteSwatch,
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
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorCode, setErrorCode] = useState<ColorErrorCode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourceRef = useRef<DecodedImage | null>(null);

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

  const extract = useCallback((wanted: number) => {
    const source = sourceRef.current;
    if (!source) return;
    try {
      const canvas = document.createElement("canvas");
      const ratio = source.width / Math.max(1, source.height);
      canvas.width = Math.max(1, Math.min(512, source.width));
      canvas.height = Math.max(1, Math.round(canvas.width / ratio));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setErrorCode("sampleFailed");
        return;
      }
      context.drawImage(source.source, 0, 0, canvas.width, canvas.height);
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
  }, []);

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
        extract(wanted);
        setBusy(false);
      } catch {
        URL.revokeObjectURL(url);
        setErrorCode("decodeFailed");
        setBusy(false);
      }
    },
    [extract, releaseSource],
  );

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
    setLoaded(null);
    setCount(String(DEFAULT_PALETTE_SIZE));
    setPalette([]);
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
  const paletteText = useMemo(
    () => palette.map((swatch) => `${swatch.hex} ${formatRgb(swatch.rgb)} ${formatHsl(swatch.hsl)}`).join("\n"),
    [palette],
  );

  return (
    <ToolShell
      title={tw("image-color-picker.title")}
      subtitle={tw("image-color-picker.shortDesc")}
      icon="Palette"
      sampleLabel={tw("image-color-picker.trySample")}
      resetLabel={tw("image-color-picker.reset")}
      privacyLabel={tw("image-color-picker.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="color-controls-title"
          title={tw("image-color-picker.controlsTitle")}
          hint={tw("image-color-picker.controlsHint")}
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
              void handleFile(event.dataTransfer.files[0], Number(count) || DEFAULT_PALETTE_SIZE);
            }}
          >
            {busy ? <LoaderCircle className="h-5 w-5" aria-hidden="true" /> : <Upload className="h-5 w-5" aria-hidden="true" />}
            <strong>{loaded ? loaded.name : tw("image-color-picker.dropTitle")}</strong>
            <span>{loaded ? tw("image-color-picker.replaceHint") : tw("image-color-picker.dropHint")}</span>
            <Button
              type="button"
              size="sm"
              className="mt-1"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {tw("image-color-picker.chooseFile")}
            </Button>
            <input
              ref={fileInputRef}
              id="color-file"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="sr-only"
              aria-label={tw("image-color-picker.chooseFile")}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? "color-error" : undefined}
              onChange={(event) => {
                void handleFile(event.target.files?.[0], Number(count) || DEFAULT_PALETTE_SIZE);
                event.target.value = "";
              }}
            />
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

          {loaded ? (
            <dl className="tp-tool-stats" aria-live="polite">
              <Stat label={tw("image-color-picker.fileName")} value={loaded.name} />
              <Stat label={tw("image-color-picker.fileSize")} value={`${loaded.size} B`} />
            </dl>
          ) : null}

          {errorMessage ? (
            <p className="tp-tool-error" id="color-error" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="color-stage-title"
          title={tw("image-color-picker.stageTitle")}
          hint={tw("image-color-picker.stageHint")}
          className="order-1"
          result
        >
          <div aria-live="polite" className="tp-tool-result">
            {loaded ? (
              <>
                <div className="tp-tool-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={loaded.url} alt={tw("image-color-picker.previewAlt")} />
                </div>
                <h4 className="tp-tool-group-title">{tw("image-color-picker.paletteTitle")}</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {palette.map((swatch, index) => (
                    <div key={`${swatch.hex}-${index}`} className="tp-tool-group tp-tool-group--flush">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-8 w-8 shrink-0 rounded-md border border-[var(--border)]"
                          style={{ background: swatch.hex }}
                          aria-hidden="true"
                        />
                        <div className="min-w-0" dir="ltr">
                          <strong className="text-sm text-[var(--text)]">{swatch.hex}</strong>
                          <p className="tp-tool-hint">{formatRgb(swatch.rgb)}</p>
                          <p className="tp-tool-hint">{formatHsl(swatch.hsl)}</p>
                        </div>
                        <span className="tp-tool-pill">{swatch.share}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="tp-tool-pane-head">
                  <div className="tp-tool-pane-title">
                    <h3>{tw("image-color-picker.cssTitle")}</h3>
                  </div>
                  <div className="tp-tool-pane-actions">
                    <CopyButton text={css} label={t("copy")} copiedLabel={t("copied")} />
                    <CopyButton text={paletteText} label={tw("image-color-picker.copyPalette")} copiedLabel={t("copied")} />
                  </div>
                </div>
                <textarea
                  id="color-css"
                  className="tp-tool-editor"
                  value={css}
                  readOnly
                  dir="ltr"
                  aria-label={tw("image-color-picker.cssTitle")}
                />
              </>
            ) : (
              <ToolEmpty
                icon={busy ? <LoaderCircle /> : <PaletteIcon />}
                title={busy ? tw("image-color-picker.processing") : tw("image-color-picker.emptyTitle")}
                hint={busy ? tw("image-color-picker.processingHint") : tw("image-color-picker.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
