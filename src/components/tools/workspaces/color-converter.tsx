"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty, ToolField } from "../workspace-ui";

const SAMPLE = "#4A90E2";

const HEX_SHORT = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_LONG = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FN =
  /^rgb\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*\)$/i;
const HSL_FN =
  /^hsl\(\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([+-]?\d+(?:\.\d+)?)\s*%?\s*,\s*([+-]?\d+(?:\.\d+)?)\s*%?\s*\)$/i;

export interface RgbChannels {
  r: number;
  g: number;
  b: number;
}

export interface HslChannels {
  h: number;
  s: number;
  l: number;
}

/**
 * Pure, deterministic lookup of common English color names to RGB bytes.
 * Keys are lowercase; callers normalise the input before looking it up.
 */
export const COLOR_NAMES: Readonly<Record<string, RgbChannels>> = Object.freeze({
  aqua: { r: 0, g: 255, b: 255 },
  beige: { r: 245, g: 245, b: 220 },
  black: { r: 0, g: 0, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  brown: { r: 165, g: 42, b: 42 },
  coral: { r: 255, g: 127, b: 80 },
  crimson: { r: 220, g: 20, b: 60 },
  cyan: { r: 0, g: 255, b: 255 },
  fuchsia: { r: 255, g: 0, b: 255 },
  gold: { r: 255, g: 215, b: 0 },
  gray: { r: 128, g: 128, b: 128 },
  green: { r: 0, g: 128, b: 0 },
  grey: { r: 128, g: 128, b: 128 },
  indigo: { r: 75, g: 0, b: 130 },
  khaki: { r: 240, g: 230, b: 140 },
  lavender: { r: 230, g: 230, b: 250 },
  lime: { r: 0, g: 255, b: 0 },
  magenta: { r: 255, g: 0, b: 255 },
  maroon: { r: 128, g: 0, b: 0 },
  navy: { r: 0, g: 0, b: 128 },
  olive: { r: 128, g: 128, b: 0 },
  orange: { r: 255, g: 165, b: 0 },
  pink: { r: 255, g: 192, b: 203 },
  plum: { r: 221, g: 160, b: 221 },
  purple: { r: 128, g: 0, b: 128 },
  red: { r: 255, g: 0, b: 0 },
  salmon: { r: 250, g: 128, b: 114 },
  silver: { r: 192, g: 192, b: 192 },
  skyblue: { r: 135, g: 206, b: 235 },
  tan: { r: 210, g: 180, b: 140 },
  teal: { r: 0, g: 128, b: 128 },
  turquoise: { r: 64, g: 224, b: 208 },
  violet: { r: 238, g: 130, b: 238 },
  white: { r: 255, g: 255, b: 255 },
  yellow: { r: 255, g: 255, b: 0 },
});

export interface NormalizedColor {
  hex: string;
  rgb: RgbChannels;
  rgbText: string;
  hsl: HslChannels;
  hslText: string;
}

export type ColorErrorReason = "invalidHex" | "outOfRange" | "malformed" | null;

interface ParsedColor {
  color: NormalizedColor | null;
  error: ColorErrorReason;
}

function clampChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

/** Pure: RGB bytes to a canonical uppercase `#RRGGBB` string. */
export function rgbToHex({ r, g, b }: RgbChannels) {
  const part = (channel: number) =>
    clampChannel(channel).toString(16).toUpperCase().padStart(2, "0");

  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Pure: RGB bytes to rounded HSL (degrees, whole percentages). */
export function rgbToHsl({ r, g, b }: RgbChannels): HslChannels {
  const red = clampChannel(r) / 255;
  const green = clampChannel(g) / 255;
  const blue = clampChannel(b) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  let hue = 0;
  if (delta > 0) {
    if (max === red) {
      hue = ((green - blue) / delta) % 6;
    } else if (max === green) {
      hue = (blue - red) / delta + 2;
    } else {
      hue = (red - green) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: Math.round(hue) % 360,
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

/** Pure: HSL values to rounded RGB bytes. */
export function hslToRgb({ h, s, l }: HslChannels): RgbChannels {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clampPercent(s) / 100;
  const lightness = clampPercent(l) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const secondary = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = lightness - chroma / 2;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) {
    red = chroma;
    green = secondary;
  } else if (hue < 120) {
    red = secondary;
    green = chroma;
  } else if (hue < 180) {
    green = chroma;
    blue = secondary;
  } else if (hue < 240) {
    green = secondary;
    blue = chroma;
  } else if (hue < 300) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}

function fromRgb(rgb: RgbChannels): NormalizedColor {
  const channels = {
    r: clampChannel(rgb.r),
    g: clampChannel(rgb.g),
    b: clampChannel(rgb.b),
  };
  const hsl = rgbToHsl(channels);

  return {
    hex: rgbToHex(channels),
    rgb: channels,
    rgbText: `rgb(${channels.r}, ${channels.g}, ${channels.b})`,
    hsl,
    hslText: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  };
}

function parseColor(input: string): ParsedColor {
  const value = input.trim();
  if (!value) return { color: null, error: null };

  const short = HEX_SHORT.exec(value);
  if (short) {
    const expand = (digit: string) => parseInt(`${digit}${digit}`, 16);
    return {
      color: fromRgb({
        r: expand(short[1]),
        g: expand(short[2]),
        b: expand(short[3]),
      }),
      error: null,
    };
  }

  const long = HEX_LONG.exec(value);
  if (long) {
    return {
      color: fromRgb({
        r: parseInt(long[1], 16),
        g: parseInt(long[2], 16),
        b: parseInt(long[3], 16),
      }),
      error: null,
    };
  }

  if (value.startsWith("#")) return { color: null, error: "invalidHex" };

  if (/^rgba?\b/iu.test(value)) {
    const match = RGB_FN.exec(value);
    if (!match) return { color: null, error: "malformed" };

    const channels = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (channels.some((channel) => channel < 0 || channel > 255)) {
      return { color: null, error: "outOfRange" };
    }

    return {
      color: fromRgb({ r: channels[0], g: channels[1], b: channels[2] }),
      error: null,
    };
  }

  if (/^hsla?\b/iu.test(value)) {
    const match = HSL_FN.exec(value);
    if (!match) return { color: null, error: "malformed" };

    const h = Number(match[1]);
    const s = Number(match[2]);
    const l = Number(match[3]);
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) {
      return { color: null, error: "outOfRange" };
    }

    return { color: fromRgb(hslToRgb({ h, s, l })), error: null };
  }

  const name = value.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(COLOR_NAMES, name)) {
    return { color: fromRgb(COLOR_NAMES[name]), error: null };
  }

  return { color: null, error: "malformed" };
}

/** Pure: accepts HEX / RGB / HSL text or a common color name; null if invalid. */
export function normalizeColor(input: string): NormalizedColor | null {
  return parseColor(input).color;
}

/** Pure: reason a non-empty color input could not be parsed. */
export function colorErrorReason(input: string): ColorErrorReason {
  return parseColor(input).error;
}

function ColorRow({
  label,
  value,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
          {label}
        </span>
        <output className="mt-1 block break-words font-mono text-[13px] leading-[1.5] text-[var(--text)] [overflow-wrap:anywhere]">
          {value}
        </output>
      </div>
      <CopyButton
        text={value}
        label={copyLabel}
        copiedLabel={copiedLabel}
        className="shrink-0"
      />
    </div>
  );
}

export default function ColorConverter() {
  const t = useTranslations("tools");
  const tu = useTranslations("toolUi");
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const color = useMemo(() => normalizeColor(value), [value]);
  const reason = useMemo(() => colorErrorReason(value), [value]);
  const hasError = value.trim().length > 0 && color === null;

  const handleSample = () => {
    setValue(SAMPLE);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <WorkspaceLayout
      title={t("color-converter.title")}
      icon="Wand2"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={
        hasError ? t("statusError") : color ? t("statusReady") : t("statusIdle")
      }
      input={
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!value}
              onClick={() => {
                setValue("");
                inputRef.current?.focus();
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>

          <ToolField label={tu("value")} htmlFor="color-input">
            <input
              id="color-input"
              ref={inputRef}
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="#4A90E2, rgb(74, 144, 226), hsl(212, 70%, 59%) or red"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? "color-error" : undefined}
              spellCheck={false}
              className="tp-field-input min-w-0 font-mono text-[13px]"
            />
          </ToolField>

          {hasError ? (
            <p
              id="color-error"
              role="alert"
              className="tp-workspace-error break-words"
              data-reason={reason ?? undefined}
            >
              {t("color-converter.invalidColor")}
            </p>
          ) : null}
        </div>
      }
      output={
        color ? (
          <div className="flex min-w-0 flex-col gap-4 overflow-hidden" aria-live="polite">
            <div className="flex min-w-0 flex-wrap items-center gap-3 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-4 sm:gap-4">
              <span
                className="h-14 w-14 shrink-0 rounded-[10px] border border-[var(--border)] sm:h-16 sm:w-16"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--muted)]">
                  {t("color-converter.preview")}
                </span>
                <code className="mt-1 block break-words font-mono text-base font-semibold leading-[1.4] text-[var(--text)] [overflow-wrap:anywhere] sm:text-lg">
                  {color.hex}
                </code>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3">
              <ColorRow
                label="HEX"
                value={color.hex}
                copyLabel={t("color-converter.copyHex")}
                copiedLabel={tu("copied")}
              />
              <ColorRow
                label="RGB"
                value={color.rgbText}
                copyLabel={t("color-converter.copyRgb")}
                copiedLabel={tu("copied")}
              />
              <ColorRow
                label="HSL"
                value={color.hslText}
                copyLabel={t("color-converter.copyHsl")}
                copiedLabel={tu("copied")}
              />
            </div>
          </div>
        ) : (
          <OutputEmpty message={t("resultEmpty")} className="min-h-[200px]" />
        )
      }
    />
  );
}
