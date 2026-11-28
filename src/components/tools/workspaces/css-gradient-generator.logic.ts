/**
 * Pure CSS gradient builder. All values are plain numbers and strings; the
 * module never reads the DOM, clipboard, timers or storage.
 */

export const GRADIENT_MAX_STOPS = 8;
export const GRADIENT_MIN_STOPS = 2;

export type GradientKind = "linear" | "radial";
export type RadialPlacement = "center" | "top" | "corner";

export interface ColorStop {
  id: number;
  color: string;
  /** Percentage along the gradient line, from 0 to 100. */
  position: number;
}

export interface GradientOptions {
  kind: GradientKind;
  /** Angle in degrees for linear gradients. */
  angle: number;
  placement: RadialPlacement;
}

export interface GradientDesign {
  options: GradientOptions;
  stops: ColorStop[];
}

export const DEFAULT_GRADIENT_OPTIONS: GradientOptions = {
  kind: "linear",
  angle: 135,
  placement: "center",
};

export const DEFAULT_GRADIENT_STOPS: ColorStop[] = [
  { id: 1, color: "#5b4bff", position: 0 },
  { id: 2, color: "#22c55e", position: 100 },
];

export const SAMPLE_GRADIENT: GradientDesign = {
  options: { kind: "radial", angle: 135, placement: "corner" },
  stops: [
    { id: 1, color: "#f97316", position: 0 },
    { id: 2, color: "#ec4899", position: 55 },
    { id: 3, color: "#5b4bff", position: 100 },
  ],
};

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampAngle(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((Math.round(value) % 360) + 360) % 360;
}

/** Output order follows position, while the editor keeps the authoring order. */
export function sortedStops(stops: ColorStop[]): ColorStop[] {
  return [...stops].sort((a, b) => a.position - b.position || a.id - b.id);
}

function placementText(placement: RadialPlacement): string {
  if (placement === "top") return "at top";
  if (placement === "corner") return "at top left";
  return "at center";
}

export function buildGradientValue(design: GradientDesign): string {
  const stops = sortedStops(design.stops)
    .map((stop) => `${stop.color} ${clampPercent(stop.position)}%`)
    .join(", ");
  if (!stops) return "none";

  if (design.options.kind === "radial") {
    return `radial-gradient(circle ${placementText(design.options.placement)}, ${stops})`;
  }
  return `linear-gradient(${clampAngle(design.options.angle)}deg, ${stops})`;
}

export function buildGradientCss(
  design: GradientDesign,
  selector = ".gradient",
): string {
  return `${selector} {\n  background: ${buildGradientValue(design)};\n}`;
}

export function nextStopId(stops: ColorStop[]): number {
  return stops.reduce((largest, stop) => Math.max(largest, stop.id), 0) + 1;
}

export function makeStop(id: number, position = 50): ColorStop {
  return { id, color: "#5b4bff", position: clampPercent(position) };
}
