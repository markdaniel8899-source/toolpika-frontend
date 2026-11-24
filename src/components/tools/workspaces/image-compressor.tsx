"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageDown, Upload } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { OutputEmpty, Stat } from "../workspace-ui";

const MAX_BYTES = 20 * 1024 * 1024;

interface OriginalFile {
  url: string;
  name: string;
  size: number;
}

interface CompressedFile {
  url: string;
  size: number;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode_failed"));
    image.src = src;
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageCompressor() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [original, setOriginal] = useState<OriginalFile | null>(null);
  const [compressed, setCompressed] = useState<CompressedFile | null>(null);
  const [quality, setQuality] = useState(70);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<"imageTooLarge" | "imageFailed" | null>(
    null
  );
  const [dimensions, setDimensions] = useState<string | null>(null);

  const handleSample = async () => {
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

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return;
    handleFile(new File([blob], "toolpika-sample.png", { type: "image/png" }));
  };

  // Release the original object URL when the file changes or the tool unmounts.
  useEffect(() => {
    if (!original) return;

    return () => URL.revokeObjectURL(original.url);
  }, [original]);

  // Re-encode whenever the file or quality changes. `compressed` is cleared by
  // the handlers that change the input, never synchronously from an effect.
  useEffect(() => {
    if (!original) return;

    let cancelled = false;
    let compressedUrl: string | null = null;

    const run = async () => {
      setBusy(true);
      setErrorCode(null);

      try {
        const image = await loadImage(original.url);
        if (!cancelled) {
          setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
        }
        const maxSide = 4096;
        const scale = Math.min(
          1,
          maxSide / Math.max(image.naturalWidth, image.naturalHeight)
        );
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("no_context");

        // JPEG has no alpha channel; flatten transparency onto white.
        context.fillStyle = "white";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality / 100)
        );

        if (!blob || cancelled) return;

        compressedUrl = URL.createObjectURL(blob);
        setCompressed({ url: compressedUrl, size: blob.size });
      } catch {
        if (!cancelled) setErrorCode("imageFailed");
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      setCompressed(null);
      if (compressedUrl) URL.revokeObjectURL(compressedUrl);
    };
  }, [original, quality]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorCode("imageFailed");
      return;
    }

    if (file.size > MAX_BYTES) {
      setErrorCode("imageTooLarge");
      return;
    }

    setErrorCode(null);
    setCompressed(null);
    setDimensions(null);
    setOriginal({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    });
  };

  const savedPercent =
    original && compressed && original.size > 0
      ? Math.max(0, Math.round((1 - compressed.size / original.size) * 100))
      : 0;

  const downloadName = original
    ? `${original.name.replace(/\.[^.]+$/, "")}-compressed.jpg`
    : "compressed.jpg";

  const handleReset = () => {
    setOriginal(null);
    setCompressed(null);
    setQuality(70);
    setErrorCode(null);
    setDimensions(null);
  };

  return (
    <WorkspaceLayout
      title={tw("image-compressor.title")}
      icon="Image"
      onReset={handleReset}
      onSample={() => void handleSample()}
      statusRight={compressed ? `${savedPercent}%` : undefined}
      input={
        <div className="flex flex-col gap-4">
          <label
            htmlFor="image-input"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files[0]);
            }}
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--bg)] p-6 text-center transition-colors hover:border-[var(--accent)]"
          >
            <Upload className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            <span className="font-medium text-[var(--text)]">
              {t("chooseImage")}
            </span>
            <span className="text-sm text-[var(--muted)]">{t("dropImage")}</span>
            <input
              id="image-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>

          {errorCode ? (
            <p role="alert" className="text-sm text-[var(--danger)]">
              {t(errorCode)}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="image-quality"
                className="text-sm font-medium text-[var(--text)]"
              >
                {t("quality")}
              </label>
              <span className="text-sm font-bold tabular-nums">{quality}%</span>
            </div>
            <input
              id="image-quality"
              type="range"
              min={10}
              max={90}
              step={5}
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="w-full accent-[var(--accent-fill)]"
            />
          </div>

          <p className="tp-workspace-hint" aria-live="polite">
            {dimensions ? `${t("original")}: ${dimensions}` : t("imageNote")}
          </p>
        </div>
      }
      output={
        <div className="flex flex-col gap-4" aria-live="polite">
          {compressed ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={compressed.url}
                alt=""
                className="max-h-[200px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg)] object-contain"
              />
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat label={t("original")} value={formatBytes(original?.size ?? 0)} />
                <Stat label={t("compressed")} value={formatBytes(compressed.size)} />
                <Stat label={t("saved")} value={`${savedPercent}%`} />
              </dl>
              <a
                href={compressed.url}
                download={downloadName}
                className={buttonVariants({ variant: "default", size: "default" })}
              >
                <ImageDown aria-hidden="true" />
                {t("download")}
              </a>
            </>
          ) : (
            <OutputEmpty
              message={busy ? tw("live") : t("chooseImage")}
              className="min-h-[200px]"
            />
          )}

          {original ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="tp-workspace-clear"
              onClick={() => {
                setOriginal(null);
                setCompressed(null);
                setDimensions(null);
                setErrorCode(null);
              }}
            >
              {t("clear")}
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
