/**
 * Pure helpers for building CSS box-shadow declarations from layer settings.
 * No DOM, React, clipboard or storage access lives in this module.
 */

export const SHADOW_MAX_LAYERS = 8;

export interface ShadowLayer {
  id: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  inset: boolean;
  /** Six digit hex, for example #0f172a. */
  color: string;
  /** Opacity from 0 to 100. */
  alpha: number;
}

export const DEFAULT_SHADOW_LAYERS: ShadowLayer[] = [
  {
    id: 1,
    offsetX: 0,
    offsetY: 6,
    blur: 16,
    spread: -4,
    inset: false,
    color: "#0f172a",
    alpha: 22,
  },
];

export const SAMPLE_SHADOW_LAYERS: ShadowLayer[] = [
  {
    id: 1,
    offsetX: 0,
    offsetY: 18,
    blur: 32,
    spread: -12,
    inset: false,
    color: "#5b4bff",
    alpha: 32,
  },
  {
    id: 2,
    offsetX: 0,
    offsetY: 2,
    blur: 6,
    spread: 0,
    inset: false,
    color: "#0f172a",
    alpha: 16,
  },
  {
    id: 3,
    offsetX: 0,
    offsetY: 1,
    blur: 0,
    spread: 0,
    inset: true,
    color: "#ffffff",
    alpha: 70,
  },
];

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Convert a hex colour and a percentage opacity into an rgba() string. */
export function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.trim().replace(/^#/u, "");
  const expanded = raw.length === 3
    ? raw.split("").map((character) => character + character).join("")
    : raw;
  const match = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/iu.exec(expanded);
  if (!match) return `rgba(0, 0, 0, ${clampNumber(alpha, 0, 100) / 100})`;

  const red = parseInt(match[1], 16);
  const green = parseInt(match[2], 16);
  const blue = parseInt(match[3], 16);
  const opacity = Math.round(clampNumber(alpha, 0, 100)) / 100;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function formatShadowLayer(layer: ShadowLayer): string {
  const x = Math.round(clampNumber(layer.offsetX, -200, 200));
  const y = Math.round(clampNumber(layer.offsetY, -200, 200));
  const blur = Math.round(clampNumber(layer.blur, 0, 200));
  const spread = Math.round(clampNumber(layer.spread, -200, 200));
  const prefix = layer.inset ? "inset " : "";
  return `${prefix}${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(layer.color, layer.alpha)}`;
}

export function buildBoxShadow(layers: ShadowLayer[]): string {
  if (layers.length === 0) return "none";
  return layers.map(formatShadowLayer).join(", ");
}

/** Full CSS rule shown in the result pane. */
export function buildShadowCss(layers: ShadowLayer[], selector = ".card"): string {
  return `${selector} {\n  box-shadow: ${buildBoxShadow(layers)};\n}`;
}

export function nextLayerId(layers: ShadowLayer[]): number {
  return layers.reduce((largest, layer) => Math.max(largest, layer.id), 0) + 1;
}

export function makeLayer(id: number): ShadowLayer {
  return {
    id,
    offsetX: 0,
    offsetY: 4,
    blur: 12,
    spread: 0,
    inset: false,
    color: "#0f172a",
    alpha: 25,
  };
}
