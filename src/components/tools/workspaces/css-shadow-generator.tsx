"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  NumberStepper,
  Stat,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import {
  buildBoxShadow,
  buildShadowCss,
  DEFAULT_SHADOW_LAYERS,
  makeLayer,
  nextLayerId,
  SAMPLE_SHADOW_LAYERS,
  SHADOW_MAX_LAYERS,
  type ShadowLayer,
} from "./css-shadow-generator.logic";

function toNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function CssShadowGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [layers, setLayers] = useState<ShadowLayer[]>(DEFAULT_SHADOW_LAYERS);
  const [error, setError] = useState("");

  const boxShadow = useMemo(() => buildBoxShadow(layers), [layers]);
  const css = useMemo(() => buildShadowCss(layers), [layers]);

  const updateLayer = useCallback(
    (id: number, patch: Partial<ShadowLayer>) => {
      setLayers((previous) =>
        previous.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
      );
    },
    [],
  );

  const addLayer = useCallback(() => {
    if (layers.length >= SHADOW_MAX_LAYERS) {
      setError(`${tw("css-shadow-generator.errorLayers")} ${tw("css-shadow-generator.fixLayers")}`);
      return;
    }
    setError("");
    setLayers((previous) => [...previous, makeLayer(nextLayerId(previous))]);
  }, [layers.length, tw]);

  const removeLayer = useCallback((id: number) => {
    setError("");
    setLayers((previous) =>
      previous.length <= 1 ? previous : previous.filter((layer) => layer.id !== id),
    );
  }, []);

  const handleSample = useCallback(() => {
    setError("");
    setLayers(SAMPLE_SHADOW_LAYERS.map((layer) => ({ ...layer })));
  }, []);

  const handleReset = useCallback(() => {
    setError("");
    setLayers(DEFAULT_SHADOW_LAYERS.map((layer) => ({ ...layer })));
  }, []);

  return (
    <ToolShell
      title={tw("css-shadow-generator.title")}
      subtitle={tw("css-shadow-generator.subtitle")}
      icon="Layers"
      sampleLabel={tw("css-shadow-generator.trySample")}
      resetLabel={tw("css-shadow-generator.reset")}
      privacyLabel={tw("css-shadow-generator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-css-shadow-controls-title"
          title={tw("css-shadow-generator.controlsTitle")}
          hint={tw("css-shadow-generator.controlsHint")}
          className="order-2 lg:order-2"
          actions={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addLayer}
              disabled={layers.length >= SHADOW_MAX_LAYERS}
              aria-describedby={error ? "tp-css-shadow-error" : undefined}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("css-shadow-generator.addLayer")}
            </Button>
          }
        >
          {error ? (
            <p id="tp-css-shadow-error" className="tp-tool-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="tp-tool-group tp-tool-group--flush">
            {layers.map((layer, index) => {
              const number = index + 1;
              return (
                <div className="tp-tool-group tp-tool-group--flush" key={layer.id}>
                  <div className="tp-tool-options-head">
                    <h3>{tw("css-shadow-generator.layerLabel", { number })}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLayer(layer.id)}
                      disabled={layers.length <= 1}
                      aria-label={tw("css-shadow-generator.removeLayer", { number })}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>

                  <CheckboxRow
                    id={`tp-css-shadow-inset-${layer.id}`}
                    label={tw("css-shadow-generator.insetLabel")}
                    checked={layer.inset}
                    onChange={(inset) => updateLayer(layer.id, { inset })}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ToolField
                      label={tw("css-shadow-generator.offsetXLabel")}
                      htmlFor={`tp-css-shadow-x-${layer.id}`}
                    >
                      <NumberStepper
                        id={`tp-css-shadow-x-${layer.id}`}
                        value={String(layer.offsetX)}
                        min={-200}
                        max={200}
                        ariaLabel={tw("css-shadow-generator.offsetXLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) =>
                          updateLayer(layer.id, { offsetX: toNumber(value) })
                        }
                      />
                    </ToolField>
                    <ToolField
                      label={tw("css-shadow-generator.offsetYLabel")}
                      htmlFor={`tp-css-shadow-y-${layer.id}`}
                    >
                      <NumberStepper
                        id={`tp-css-shadow-y-${layer.id}`}
                        value={String(layer.offsetY)}
                        min={-200}
                        max={200}
                        ariaLabel={tw("css-shadow-generator.offsetYLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) =>
                          updateLayer(layer.id, { offsetY: toNumber(value) })
                        }
                      />
                    </ToolField>
                    <ToolField
                      label={tw("css-shadow-generator.blurLabel")}
                      htmlFor={`tp-css-shadow-blur-${layer.id}`}
                    >
                      <NumberStepper
                        id={`tp-css-shadow-blur-${layer.id}`}
                        value={String(layer.blur)}
                        min={0}
                        max={200}
                        ariaLabel={tw("css-shadow-generator.blurLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) =>
                          updateLayer(layer.id, { blur: toNumber(value) })
                        }
                      />
                    </ToolField>
                    <ToolField
                      label={tw("css-shadow-generator.spreadLabel")}
                      htmlFor={`tp-css-shadow-spread-${layer.id}`}
                    >
                      <NumberStepper
                        id={`tp-css-shadow-spread-${layer.id}`}
                        value={String(layer.spread)}
                        min={-200}
                        max={200}
                        ariaLabel={tw("css-shadow-generator.spreadLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) =>
                          updateLayer(layer.id, { spread: toNumber(value) })
                        }
                      />
                    </ToolField>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ToolField
                      label={tw("css-shadow-generator.colorLabel")}
                      htmlFor={`tp-css-shadow-color-${layer.id}`}
                    >
                      <input
                        id={`tp-css-shadow-color-${layer.id}`}
                        type="color"
                        className="tp-color-input"
                        value={layer.color}
                        onChange={(event) =>
                          updateLayer(layer.id, { color: event.target.value })
                        }
                      />
                    </ToolField>
                    <ToolField
                      label={tw("css-shadow-generator.alphaLabel")}
                      htmlFor={`tp-css-shadow-alpha-${layer.id}`}
                    >
                      <NumberStepper
                        id={`tp-css-shadow-alpha-${layer.id}`}
                        value={String(layer.alpha)}
                        min={0}
                        max={100}
                        ariaLabel={tw("css-shadow-generator.alphaLabel")}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(value) =>
                          updateLayer(layer.id, { alpha: toNumber(value) })
                        }
                      />
                    </ToolField>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="tp-tool-hint">{tw("css-shadow-generator.layerHint")}</p>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-css-shadow-result-title"
          title={tw("css-shadow-generator.resultTitle")}
          hint={tw("css-shadow-generator.resultHint")}
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
                label={tw("css-shadow-generator.layerCountLabel")}
                value={layers.length}
              />
            </dl>
          }
        >
          <div aria-live="polite" className="tp-tool-result">
            <div
              className="tp-tool-preview"
              style={{ minHeight: 300 }}
              role="img"
              aria-label={tw("css-shadow-generator.previewAlt")}
            >
              <div
                style={{
                  width: 180,
                  height: 120,
                  borderRadius: 18,
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  boxShadow,
                }}
              />
            </div>
            <textarea
              className="tp-tool-code"
              value={css}
              readOnly
              dir="ltr"
              aria-label={tw("css-shadow-generator.cssLabel")}
            />
          </div>
        </ToolPane>
      }
    />
  );
}
