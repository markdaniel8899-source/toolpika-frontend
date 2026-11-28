"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Eye, EyeOff, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CheckboxRow, CopyButton, NumberStepper, ToolField } from "../workspace-ui";
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

  const [layers, setLayers] = useState<ShadowLayer[]>(() =>
    DEFAULT_SHADOW_LAYERS.map((layer) => ({ ...layer })),
  );
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const [openLayerId, setOpenLayerId] = useState<number | null>(
    DEFAULT_SHADOW_LAYERS[0]?.id ?? null,
  );
  const [stageColor, setStageColor] = useState("#e9eaf3");
  const [cardColor, setCardColor] = useState("#ffffff");
  const [error, setError] = useState("");

  const visibleLayers = useMemo(
    () => layers.filter((layer) => !hiddenIds.includes(layer.id)),
    [layers, hiddenIds],
  );
  const boxShadow = useMemo(() => buildBoxShadow(visibleLayers), [visibleLayers]);
  const css = useMemo(() => buildShadowCss(visibleLayers), [visibleLayers]);

  const updateLayer = (id: number, patch: Partial<ShadowLayer>) => {
    setLayers((previous) =>
      previous.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
    );
  };

  const toggleHidden = (id: number) => {
    setHiddenIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  const addLayer = () => {
    if (layers.length >= SHADOW_MAX_LAYERS) {
      setError(`${tw("css-shadow-generator.errorLayers")} ${tw("css-shadow-generator.fixLayers")}`);
      return;
    }
    setError("");
    const newId = nextLayerId(layers);
    setLayers((previous) => [...previous, makeLayer(newId)]);
    setOpenLayerId(newId);
  };

  const removeLayer = (id: number) => {
    if (layers.length <= 1) return;
    setError("");
    const remaining = layers.filter((layer) => layer.id !== id);
    setLayers(remaining);
    if (openLayerId === id) setOpenLayerId(remaining[0]?.id ?? null);
    setHiddenIds((previous) => previous.filter((item) => item !== id));
  };

  const handleSample = () => {
    setError("");
    setLayers(SAMPLE_SHADOW_LAYERS.map((layer) => ({ ...layer })));
    setHiddenIds([]);
    setOpenLayerId(SAMPLE_SHADOW_LAYERS[0]?.id ?? null);
  };

  const handleClear = () => {
    setError("");
    setLayers(DEFAULT_SHADOW_LAYERS.map((layer) => ({ ...layer })));
    setHiddenIds([]);
    setOpenLayerId(DEFAULT_SHADOW_LAYERS[0]?.id ?? null);
    setStageColor("#e9eaf3");
    setCardColor("#ffffff");
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Layers" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("css-shadow-generator.title")}</span>
            <span className="tp-tool-subtitle">{tw("css-shadow-generator.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-meta-pill" aria-live="polite">
          <span>{tw("css-shadow-generator.layerCountLabel")}</span>
          <strong dir="ltr">{visibleLayers.length}</strong>
          <span aria-hidden="true">•</span>
          <span>{tw("css-shadow-generator.maxLayers", { count: SHADOW_MAX_LAYERS })}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
            {tw("css-shadow-generator.trySample")}
          </Button>
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-css-shadow-stage-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-css-shadow-stage-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("css-shadow-generator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("css-shadow-generator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div
            className="tp-stage"
            style={{ backgroundColor: stageColor }}
            role="img"
            aria-label={tw("css-shadow-generator.previewAlt")}
            aria-live="polite"
          >
            <div
              style={{
                width: 180,
                height: 120,
                borderRadius: 18,
                background: cardColor,
                border: "1px solid var(--border)",
                boxShadow,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text)]" htmlFor="tp-css-shadow-stage-color">
              {tw("css-shadow-generator.stageColorLabel")}
              <input
                id="tp-css-shadow-stage-color"
                type="color"
                className="tp-color-input"
                value={stageColor}
                aria-label={tw("css-shadow-generator.stageColorLabel")}
                onChange={(event) => setStageColor(event.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text)]" htmlFor="tp-css-shadow-card-color">
              {tw("css-shadow-generator.cardColorLabel")}
              <input
                id="tp-css-shadow-card-color"
                type="color"
                className="tp-color-input"
                value={cardColor}
                aria-label={tw("css-shadow-generator.cardColorLabel")}
                onChange={(event) => setCardColor(event.target.value)}
              />
            </label>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <span>{tw("css-shadow-generator.layerCountLabel")}</span>
            <strong dir="ltr">{visibleLayers.length}</strong>
            {hiddenIds.length ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{tw("css-shadow-generator.hiddenLayers", { count: hiddenIds.length })}</span>
              </>
            ) : null}
          </div>

          <div className="tp-industrial-bar">
            <span className="tp-tool-group-title">{tw("css-shadow-generator.cssLabel")}</span>
            <CopyButton
              text={css}
              label={tw("css-shadow-generator.copyCss")}
              copiedLabel={t("copied")}
            />
          </div>
          <div className="tp-output-viewer" role="region" aria-label={tw("css-shadow-generator.cssLabel")} aria-live="polite" style={{ minHeight: 84, maxHeight: 140 }}>
            <code dir="ltr">{css}</code>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-css-shadow-controls-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-css-shadow-controls-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("css-shadow-generator.controlsTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("css-shadow-generator.controlsHint")}</p>
            </div>
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
          </div>

          {error ? (
            <p id="tp-css-shadow-error" className="tp-tool-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {layers.map((layer, index) => {
              const number = index + 1;
              const hidden = hiddenIds.includes(layer.id);
              const open = openLayerId === layer.id;
              return (
                <details key={layer.id} className="tp-tool-group tp-tool-group--flush" open={open}>
                  <summary
                    className="tp-tool-group-title flex cursor-pointer items-center justify-between gap-2"
                    onClick={(event) => {
                      event.preventDefault();
                      setOpenLayerId(open ? null : layer.id);
                    }}
                  >
                    <span dir="ltr">{tw("css-shadow-generator.layerLabel", { number })}</span>
                    <span className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleHidden(layer.id);
                        }}
                        aria-label={hidden
                          ? tw("css-shadow-generator.showLayer", { number })
                          : tw("css-shadow-generator.hideLayer", { number })}
                        aria-pressed={hidden}
                      >
                        {hidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        disabled={layers.length <= 1}
                        aria-label={tw("css-shadow-generator.removeLayer", { number })}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </span>
                  </summary>

                  <div className="mt-3 flex flex-col gap-3">
                    <CheckboxRow
                      id={`tp-css-shadow-inset-${layer.id}`}
                      label={tw("css-shadow-generator.insetLabel")}
                      checked={layer.inset}
                      onChange={(inset) => updateLayer(layer.id, { inset })}
                    />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ToolField label={tw("css-shadow-generator.offsetXLabel")} htmlFor={`tp-css-shadow-x-${layer.id}`}>
                        <NumberStepper
                          id={`tp-css-shadow-x-${layer.id}`}
                          value={String(layer.offsetX)}
                          min={-200}
                          max={200}
                          ariaLabel={tw("css-shadow-generator.offsetXLabel")}
                          increaseLabel={t("stepUp")}
                          decreaseLabel={t("stepDown")}
                          onValueChange={(value) => updateLayer(layer.id, { offsetX: toNumber(value) })}
                        />
                      </ToolField>
                      <ToolField label={tw("css-shadow-generator.offsetYLabel")} htmlFor={`tp-css-shadow-y-${layer.id}`}>
                        <NumberStepper
                          id={`tp-css-shadow-y-${layer.id}`}
                          value={String(layer.offsetY)}
                          min={-200}
                          max={200}
                          ariaLabel={tw("css-shadow-generator.offsetYLabel")}
                          increaseLabel={t("stepUp")}
                          decreaseLabel={t("stepDown")}
                          onValueChange={(value) => updateLayer(layer.id, { offsetY: toNumber(value) })}
                        />
                      </ToolField>
                      <ToolField label={tw("css-shadow-generator.blurLabel")} htmlFor={`tp-css-shadow-blur-${layer.id}`}>
                        <NumberStepper
                          id={`tp-css-shadow-blur-${layer.id}`}
                          value={String(layer.blur)}
                          min={0}
                          max={200}
                          ariaLabel={tw("css-shadow-generator.blurLabel")}
                          increaseLabel={t("stepUp")}
                          decreaseLabel={t("stepDown")}
                          onValueChange={(value) => updateLayer(layer.id, { blur: toNumber(value) })}
                        />
                      </ToolField>
                      <ToolField label={tw("css-shadow-generator.spreadLabel")} htmlFor={`tp-css-shadow-spread-${layer.id}`}>
                        <NumberStepper
                          id={`tp-css-shadow-spread-${layer.id}`}
                          value={String(layer.spread)}
                          min={-200}
                          max={200}
                          ariaLabel={tw("css-shadow-generator.spreadLabel")}
                          increaseLabel={t("stepUp")}
                          decreaseLabel={t("stepDown")}
                          onValueChange={(value) => updateLayer(layer.id, { spread: toNumber(value) })}
                        />
                      </ToolField>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ToolField label={tw("css-shadow-generator.colorLabel")} htmlFor={`tp-css-shadow-color-${layer.id}`}>
                        <input
                          id={`tp-css-shadow-color-${layer.id}`}
                          type="color"
                          className="tp-color-input"
                          value={layer.color}
                          aria-label={tw("css-shadow-generator.colorLabel")}
                          onChange={(event) => updateLayer(layer.id, { color: event.target.value })}
                        />
                      </ToolField>
                      <ToolField label={tw("css-shadow-generator.alphaLabel")} htmlFor={`tp-css-shadow-alpha-${layer.id}`}>
                        <NumberStepper
                          id={`tp-css-shadow-alpha-${layer.id}`}
                          value={String(layer.alpha)}
                          min={0}
                          max={100}
                          ariaLabel={tw("css-shadow-generator.alphaLabel")}
                          increaseLabel={t("stepUp")}
                          decreaseLabel={t("stepDown")}
                          onValueChange={(value) => updateLayer(layer.id, { alpha: toNumber(value) })}
                        />
                      </ToolField>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>

          <p className="tp-tool-hint">{tw("css-shadow-generator.layerHint")}</p>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("css-shadow-generator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
