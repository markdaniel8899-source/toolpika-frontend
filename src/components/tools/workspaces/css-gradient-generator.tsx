"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CopyButton, NumberStepper, SegmentedControl, ToolField } from "../workspace-ui";
import {
  buildGradientValue,
  clampAngle,
  clampPercent,
  DEFAULT_GRADIENT_OPTIONS,
  DEFAULT_GRADIENT_STOPS,
  GRADIENT_MAX_STOPS,
  GRADIENT_MIN_STOPS,
  makeStop,
  nextStopId,
  SAMPLE_GRADIENT,
  sortedStops,
  type ColorStop,
  type GradientKind,
  type RadialPlacement,
} from "./css-gradient-generator.logic";

type GradientUiKind = GradientKind | "conic";

interface GradientUiOptions {
  kind: GradientUiKind;
  angle: number;
  placement: RadialPlacement;
}

function toNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function CssGradientGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [options, setOptions] = useState<GradientUiOptions>({ ...DEFAULT_GRADIENT_OPTIONS });
  const [stops, setStops] = useState<ColorStop[]>(() =>
    DEFAULT_GRADIENT_STOPS.map((stop) => ({ ...stop })),
  );
  const [openStopId, setOpenStopId] = useState<number | null>(
    DEFAULT_GRADIENT_STOPS[0]?.id ?? null,
  );
  const [error, setError] = useState("");
  const barRef = useRef<HTMLDivElement | null>(null);
  const draggingIdRef = useRef<number | null>(null);

  const gradientValue = useMemo(() => {
    const text = sortedStops(stops)
      .map((stop) => `${stop.color} ${clampPercent(stop.position)}%`)
      .join(", ");
    if (options.kind === "conic") {
      const at = options.placement === "top"
        ? "at top"
        : options.placement === "corner"
          ? "at top left"
          : "at center";
      return `conic-gradient(from ${clampAngle(options.angle)}deg ${at}, ${text})`;
    }
    return buildGradientValue({ options: { ...options, kind: options.kind }, stops });
  }, [options, stops]);

  const css = useMemo(
    () => `.gradient {\n  background: ${gradientValue};\n}`,
    [gradientValue],
  );

  const updateOption = <K extends keyof GradientUiOptions>(key: K, value: GradientUiOptions[K]) => {
    setOptions((previous) => ({ ...previous, [key]: value }));
  };

  const updateStop = (id: number, patch: Partial<ColorStop>) => {
    setStops((previous) =>
      previous.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    );
  };

  const addStop = () => {
    if (stops.length >= GRADIENT_MAX_STOPS) {
      setError(`${tw("css-gradient-generator.errorStops")} ${tw("css-gradient-generator.fixStops")}`);
      return;
    }
    setError("");
    const last = stops[stops.length - 1]?.position ?? 100;
    const id = nextStopId(stops);
    setStops((previous) => [...previous, makeStop(id, Math.min(100, last + 10))]);
    setOpenStopId(id);
  };

  const removeStop = (id: number) => {
    if (stops.length <= GRADIENT_MIN_STOPS) {
      setError(`${tw("css-gradient-generator.errorMin")} ${tw("css-gradient-generator.fixMin")}`);
      return;
    }
    setError("");
    const remaining = stops.filter((stop) => stop.id !== id);
    setStops(remaining);
    if (openStopId === id) setOpenStopId(remaining[0]?.id ?? null);
  };

  const handleSample = () => {
    setError("");
    setOptions({ ...SAMPLE_GRADIENT.options });
    setStops(SAMPLE_GRADIENT.stops.map((stop) => ({ ...stop })));
    setOpenStopId(SAMPLE_GRADIENT.stops[0]?.id ?? null);
  };

  const handleClear = () => {
    setError("");
    setOptions({ ...DEFAULT_GRADIENT_OPTIONS });
    setStops(DEFAULT_GRADIENT_STOPS.map((stop) => ({ ...stop })));
    setOpenStopId(DEFAULT_GRADIENT_STOPS[0]?.id ?? null);
  };

  const moveStop = (id: number, clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const percent = Math.round(((clientX - rect.left) / rect.width) * 100);
    updateStop(id, { position: clampPercent(percent) });
  };

  const anglePresets = [45, 90, 135, 180];

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Palette" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("css-gradient-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("css-gradient-generator.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-meta-pill" aria-live="polite">
          <span>{tw("css-gradient-generator.stopCountLabel")}</span>
          <strong dir="ltr">{stops.length}</strong>
          <span aria-hidden="true">•</span>
          <span dir="ltr">{clampAngle(options.angle)}°</span>
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-css-gradient-stage-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-css-gradient-stage-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("css-gradient-generator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("css-gradient-generator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
                {tw("css-gradient-generator.trySample")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div
            className="tp-stage"
            style={{ minHeight: 220, background: gradientValue, border: "none" }}
            role="img"
            aria-label={tw("css-gradient-generator.previewAlt")}
            aria-live="polite"
          />

          <div
            ref={barRef}
            className="relative h-8 w-full rounded-lg border border-[var(--border)]"
            style={{ background: gradientValue }}
            aria-label={tw("css-gradient-generator.stopLabel", { number: stops.length })}
          >
            {sortedStops(stops).map((stop) => (
              <button
                key={stop.id}
                type="button"
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow"
                style={{ left: `${clampPercent(stop.position)}%`, background: stop.color }}
                aria-label={`${tw("css-gradient-generator.stopLabel", { number: stops.findIndex((item) => item.id === stop.id) + 1 })} ${clampPercent(stop.position)}%`}
                onPointerDown={(event) => {
                  draggingIdRef.current = stop.id;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setOpenStopId(stop.id);
                }}
                onPointerMove={(event) => {
                  if (draggingIdRef.current === stop.id) moveStop(stop.id, event.clientX);
                }}
                onPointerUp={(event) => {
                  draggingIdRef.current = null;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => {
                  draggingIdRef.current = null;
                }}
              />
            ))}
          </div>
          <p className="tp-tool-hint">{tw("css-gradient-generator.stopHint")}</p>

          <div className="tp-industrial-bar">
            <span className="tp-tool-group-title">{tw("css-gradient-generator.cssLabel")}</span>
            <CopyButton
              text={css}
              label={tw("css-gradient-generator.copyCss")}
              copiedLabel={t("copied")}
            />
          </div>
          <div className="tp-output-viewer" role="region" aria-label={tw("css-gradient-generator.cssLabel")} aria-live="polite" style={{ minHeight: 84, maxHeight: 140 }}>
            <code dir="ltr">{css}</code>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-css-gradient-controls-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-css-gradient-controls-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("css-gradient-generator.controlsTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("css-gradient-generator.controlsHint")}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addStop}
              disabled={stops.length >= GRADIENT_MAX_STOPS}
              aria-describedby={error ? "tp-css-gradient-error" : undefined}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("css-gradient-generator.addStop")}
            </Button>
          </div>

          {error ? (
            <p id="tp-css-gradient-error" className="tp-tool-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<GradientUiKind>
              label={tw("css-gradient-generator.kindLabel")}
              value={options.kind}
              options={[
                { value: "linear", label: tw("css-gradient-generator.kindLinear") },
                { value: "radial", label: tw("css-gradient-generator.kindRadial") },
                { value: "conic", label: tw("css-gradient-generator.kindConic") },
              ]}
              onChange={(kind) => {
                setError("");
                updateOption("kind", kind);
              }}
            />
          </div>

          {options.kind !== "radial" ? (
            <div className="tp-tool-group tp-tool-group--flush">
              <ToolField label={tw("css-gradient-generator.angleLabel")} htmlFor="tp-css-gradient-angle">
                <NumberStepper
                  id="tp-css-gradient-angle"
                  value={String(options.angle)}
                  min={0}
                  max={360}
                  ariaLabel={tw("css-gradient-generator.angleLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  onValueChange={(value) => updateOption("angle", clampAngle(toNumber(value)))}
                />
              </ToolField>
              <div className="flex flex-wrap gap-2">
                {anglePresets.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    size="sm"
                    variant={options.angle === preset ? "default" : "secondary"}
                    aria-label={`${tw("css-gradient-generator.angleLabel")} ${preset}`}
                    onClick={() => updateOption("angle", preset)}
                  >
                    {preset}°
                  </Button>
                ))}
              </div>
              <p className="tp-tool-hint">{tw("css-gradient-generator.angleHint")}</p>
            </div>
          ) : (
            <div className="tp-tool-group tp-tool-group--flush">
              <span className="tp-tool-group-title">{tw("css-gradient-generator.placementLabel")}</span>
              <SegmentedControl<RadialPlacement>
                label={tw("css-gradient-generator.placementLabel")}
                value={options.placement}
                options={[
                  { value: "center", label: tw("css-gradient-generator.placementCenter") },
                  { value: "top", label: tw("css-gradient-generator.placementTop") },
                  { value: "corner", label: tw("css-gradient-generator.placementCorner") },
                ]}
                onChange={(placement) => updateOption("placement", placement)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {stops.map((stop, index) => {
              const number = index + 1;
              const open = openStopId === stop.id;
              return (
                <details key={stop.id} className="tp-tool-group tp-tool-group--flush" open={open}>
                  <summary
                    className="tp-tool-group-title flex cursor-pointer items-center justify-between gap-2"
                    onClick={(event) => {
                      event.preventDefault();
                      setOpenStopId(open ? null : stop.id);
                    }}
                  >
                    <span className="flex items-center gap-2" dir="ltr">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-[var(--border)]"
                        style={{ background: stop.color }}
                        aria-hidden="true"
                      />
                      {tw("css-gradient-generator.stopLabel", { number })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        removeStop(stop.id);
                      }}
                      disabled={stops.length <= GRADIENT_MIN_STOPS}
                      aria-label={tw("css-gradient-generator.removeStop", { number })}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </summary>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ToolField label={tw("css-gradient-generator.stopColorLabel")} htmlFor={`tp-css-gradient-color-${stop.id}`}>
                      <input
                        id={`tp-css-gradient-color-${stop.id}`}
                        type="color"
                        className="tp-color-input"
                        value={stop.color}
                        aria-label={tw("css-gradient-generator.stopColorLabel")}
                        onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                      />
                    </ToolField>
                    <ToolField label={tw("css-gradient-generator.stopHexLabel")} htmlFor={`tp-css-gradient-hex-${stop.id}`}>
                      <input
                        id={`tp-css-gradient-hex-${stop.id}`}
                        type="text"
                        className="tp-field-input"
                        value={stop.color.toUpperCase()}
                        dir="ltr"
                        spellCheck={false}
                        aria-label={tw("css-gradient-generator.stopHexLabel")}
                        onChange={(event) => {
                          const value = event.target.value.trim();
                          if (/^#?[0-9a-fA-F]{6}$/u.test(value)) {
                            updateStop(stop.id, { color: `#${value.replace(/^#/u, "")}` });
                          }
                        }}
                      />
                    </ToolField>
                    <ToolField label={tw("css-gradient-generator.stopPositionLabel")} htmlFor={`tp-css-gradient-position-${stop.id}`}>
                      <NumberStepper
                        id={`tp-css-gradient-position-${stop.id}`}
                        value={String(stop.position)}
                        min={0}
                        max={100}
                        ariaLabel={tw("css-gradient-generator.stopPositionLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) => updateStop(stop.id, { position: clampPercent(toNumber(value)) })}
                      />
                    </ToolField>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("css-gradient-generator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
