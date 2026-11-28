"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import {
  buildGradientCss,
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
  type ColorStop,
  type GradientKind,
  type GradientOptions,
  type RadialPlacement,
} from "./css-gradient-generator.logic";

function toNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function CssGradientGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [options, setOptions] = useState<GradientOptions>({ ...DEFAULT_GRADIENT_OPTIONS });
  const [stops, setStops] = useState<ColorStop[]>(() =>
    DEFAULT_GRADIENT_STOPS.map((stop) => ({ ...stop })),
  );
  const [error, setError] = useState("");

  const design = useMemo(() => ({ options, stops }), [options, stops]);
  const gradientValue = useMemo(() => buildGradientValue(design), [design]);
  const css = useMemo(() => buildGradientCss(design), [design]);

  const updateOption = useCallback(
    <K extends keyof GradientOptions>(key: K, value: GradientOptions[K]) => {
      setOptions((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const updateStop = useCallback((id: number, patch: Partial<ColorStop>) => {
    setStops((previous) =>
      previous.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    );
  }, []);

  const addStop = useCallback(() => {
    if (stops.length >= GRADIENT_MAX_STOPS) {
      setError(`${tw("css-gradient-generator.errorStops")} ${tw("css-gradient-generator.fixStops")}`);
      return;
    }
    setError("");
    setStops((previous) => {
      const last = previous[previous.length - 1]?.position ?? 100;
      const position = Math.min(100, last + 10);
      return [...previous, makeStop(nextStopId(previous), position)];
    });
  }, [stops.length, tw]);

  const removeStop = useCallback((id: number) => {
    if (stops.length <= GRADIENT_MIN_STOPS) {
      setError(`${tw("css-gradient-generator.errorMin")} ${tw("css-gradient-generator.fixMin")}`);
      return;
    }
    setError("");
    setStops((previous) => previous.filter((stop) => stop.id !== id));
  }, [stops.length, tw]);

  const handleSample = useCallback(() => {
    setError("");
    setOptions({ ...SAMPLE_GRADIENT.options });
    setStops(SAMPLE_GRADIENT.stops.map((stop) => ({ ...stop })));
  }, []);

  const handleReset = useCallback(() => {
    setError("");
    setOptions({ ...DEFAULT_GRADIENT_OPTIONS });
    setStops(DEFAULT_GRADIENT_STOPS.map((stop) => ({ ...stop })));
  }, []);

  return (
    <ToolShell
      title={tw("css-gradient-generator.title")}
      subtitle={tw("css-gradient-generator.subtitle")}
      icon="Palette"
      sampleLabel={tw("css-gradient-generator.trySample")}
      resetLabel={tw("css-gradient-generator.reset")}
      privacyLabel={tw("css-gradient-generator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-css-gradient-controls-title"
          title={tw("css-gradient-generator.controlsTitle")}
          hint={tw("css-gradient-generator.controlsHint")}
          className="order-2 lg:order-2"
          actions={
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
          }
        >
          {error ? (
            <p id="tp-css-gradient-error" className="tp-tool-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<GradientKind>
              label={tw("css-gradient-generator.kindLabel")}
              value={options.kind}
              options={[
                { value: "linear", label: tw("css-gradient-generator.kindLinear") },
                { value: "radial", label: tw("css-gradient-generator.kindRadial") },
              ]}
              onChange={(kind) => {
                setError("");
                updateOption("kind", kind);
              }}
            />
          </div>

          {options.kind === "linear" ? (
            <ToolField
              label={tw("css-gradient-generator.angleLabel")}
              htmlFor="tp-css-gradient-angle"
              hint={tw("css-gradient-generator.angleHint")}
            >
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
          ) : (
            <div className="tp-tool-group tp-tool-group--flush">
              <span className="tp-tool-group-title">
                {tw("css-gradient-generator.placementLabel")}
              </span>
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

          <div className="tp-tool-group tp-tool-group--flush">
            {stops.map((stop, index) => {
              const number = index + 1;
              return (
                <div className="tp-tool-group tp-tool-group--flush" key={stop.id}>
                  <div className="tp-tool-options-head">
                    <h3>{tw("css-gradient-generator.stopLabel", { number })}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStop(stop.id)}
                      disabled={stops.length <= GRADIENT_MIN_STOPS}
                      aria-label={tw("css-gradient-generator.removeStop", { number })}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ToolField
                      label={tw("css-gradient-generator.stopColorLabel")}
                      htmlFor={`tp-css-gradient-color-${stop.id}`}
                    >
                      <input
                        id={`tp-css-gradient-color-${stop.id}`}
                        type="color"
                        className="tp-color-input"
                        value={stop.color}
                        onChange={(event) =>
                          updateStop(stop.id, { color: event.target.value })
                        }
                      />
                    </ToolField>
                    <ToolField
                      label={tw("css-gradient-generator.stopPositionLabel")}
                      htmlFor={`tp-css-gradient-position-${stop.id}`}
                    >
                      <NumberStepper
                        id={`tp-css-gradient-position-${stop.id}`}
                        value={String(stop.position)}
                        min={0}
                        max={100}
                        ariaLabel={tw("css-gradient-generator.stopPositionLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) =>
                          updateStop(stop.id, { position: clampPercent(toNumber(value)) })
                        }
                      />
                    </ToolField>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="tp-tool-hint">{tw("css-gradient-generator.stopHint")}</p>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-css-gradient-result-title"
          title={tw("css-gradient-generator.resultTitle")}
          hint={tw("css-gradient-generator.resultHint")}
          result
          className="order-1 lg:order-1"
          actions={
            <CopyButton
              text={css}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
          footer={
            <dl className="tp-tool-stats">
              <Stat
                label={tw("css-gradient-generator.stopCountLabel")}
                value={stops.length}
              />
            </dl>
          }
        >
          <div aria-live="polite" className="tp-tool-result">
            <div
              className="tp-tool-preview"
              style={{ minHeight: 300, background: gradientValue, border: "none" }}
              role="img"
              aria-label={tw("css-gradient-generator.previewAlt")}
            />
            <textarea
              className="tp-tool-code"
              value={css}
              readOnly
              dir="ltr"
              aria-label={tw("css-gradient-generator.cssLabel")}
            />
          </div>
        </ToolPane>
      }
    />
  );
}
