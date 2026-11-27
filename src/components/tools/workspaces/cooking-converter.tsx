"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, ChefHat as ChefHatIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  CopyButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateConversion,
  CONVERTER_UNITS,
  convertAmount,
  formatConversionReport,
  INGREDIENT_IDS,
  type ConverterUnit,
  type ConversionKind,
  type IngredientId,
} from "./cooking-converter.logic";

const ERROR_ID = "tp-cooking-converter-error";
const QUICK_AMOUNTS = [0.25, 0.5, 1, 2];

export default function CookingConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState<ConverterUnit>("cup");
  const [to, setTo] = useState<ConverterUnit>("g");
  const [ingredient, setIngredient] = useState<IngredientId>("flour");

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }),
    [locale],
  );

  const unitLabels = useMemo<Record<ConverterUnit, string>>(
    () => ({
      cup: tw("cooking-converter.unitCup"),
      tbsp: tw("cooking-converter.unitTbsp"),
      tsp: tw("cooking-converter.unitTsp"),
      flOz: tw("cooking-converter.unitFlOz"),
      g: tw("cooking-converter.unitG"),
      kg: tw("cooking-converter.unitKg"),
      oz: tw("cooking-converter.unitOz"),
    }),
    [tw],
  );

  const ingredientLabels = useMemo<Record<IngredientId, string>>(
    () => ({
      water: tw("cooking-converter.ingWater"),
      broth: tw("cooking-converter.ingBroth"),
      milk: tw("cooking-converter.ingMilk"),
      flour: tw("cooking-converter.ingFlour"),
      sugar: tw("cooking-converter.ingSugar"),
      brownSugar: tw("cooking-converter.ingBrownSugar"),
      rice: tw("cooking-converter.ingRice"),
      butter: tw("cooking-converter.ingButter"),
      oats: tw("cooking-converter.ingOats"),
    }),
    [tw],
  );

  const kindLabels = useMemo<Record<ConversionKind, string>>(
    () => ({
      volumeToVolume: tw("cooking-converter.kindVolumeVolume"),
      weightToWeight: tw("cooking-converter.kindWeightWeight"),
      volumeToWeight: tw("cooking-converter.kindVolumeWeight"),
      weightToVolume: tw("cooking-converter.kindWeightVolume"),
    }),
    [tw],
  );

  const unitOptions = useMemo(
    () => CONVERTER_UNITS.map((unit) => ({ value: unit, label: unitLabels[unit] })),
    [unitLabels],
  );

  const ingredientOptions = useMemo(
    () =>
      INGREDIENT_IDS.map((item) => ({
        value: item,
        label: ingredientLabels[item],
      })),
    [ingredientLabels],
  );

  const calculation = useMemo(
    () => calculateConversion({ amount, from, to, ingredient }),
    [amount, from, to, ingredient],
  );
  const value = calculation.value;

  const errorText =
    calculation.error?.code === "MISSING_AMOUNT"
      ? `${tw("cooking-converter.errorMissing")} ${tw("cooking-converter.fixMissing")}`
      : calculation.error?.code === "INVALID_AMOUNT"
        ? `${tw("cooking-converter.errorInvalid")} ${tw("cooking-converter.fixInvalid")}`
        : calculation.error?.code === "NEGATIVE_AMOUNT"
          ? `${tw("cooking-converter.errorNegative")} ${tw("cooking-converter.fixNegative")}`
          : "";
  const ready = Boolean(value && !errorText);
  const describedBy = errorText ? ERROR_ID : undefined;

  const heroText = ready && value
    ? `${nf.format(value.result)} ${unitLabels[value.toUnit]}`
    : "";

  const referenceText = useMemo(() => {
    if (!ready || !value) return "";
    const reference = convertAmount(1, value.fromUnit, value.toUnit, value.ingredient);
    return tw("cooking-converter.referenceLine", {
      from: `1 ${unitLabels[value.fromUnit]}`,
      to: `${nf.format(reference)} ${unitLabels[value.toUnit]} ${ingredientLabels[value.ingredient]}`,
    });
  }, [ready, value, tw, unitLabels, ingredientLabels, nf]);

  const reportText = useMemo(() => {
    if (!ready || !value) return "";
    return formatConversionReport(
      value,
      {
        title: tw("cooking-converter.reportTitle"),
        amount: tw("cooking-converter.reportAmount"),
        from: tw("cooking-converter.reportFrom"),
        to: tw("cooking-converter.reportTo"),
        ingredient: tw("cooking-converter.reportIngredient"),
        reference: tw("cooking-converter.reportReference"),
        density: tw("cooking-converter.reportDensity"),
        type: tw("cooking-converter.reportType"),
        perCup: tw("cooking-converter.perCup"),
        gramUnit: unitLabels.g,
        units: unitLabels,
        ingredients: ingredientLabels,
        kinds: kindLabels,
      },
      (number) => nf.format(number),
    );
  }, [ready, value, tw, unitLabels, ingredientLabels, kindLabels, nf]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setAmount("1");
    setFrom("cup");
    setTo("g");
    setIngredient("flour");
  };

  const handleReset = () => {
    setAmount("");
    setFrom("cup");
    setTo("g");
    setIngredient("flour");
  };

  return (
    <ToolShell
      title={tw("cooking-converter.title")}
      icon="ChefHat"
      sampleLabel={tw("cooking-converter.trySample")}
      resetLabel={tw("cooking-converter.reset")}
      privacyLabel={tw("cooking-converter.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-cooking-converter-input-title"
          title={tw("cooking-converter.inputTitle")}
          hint={tw("cooking-converter.inputHint")}
        >
          <ToolField
            label={tw("cooking-converter.amountLabel")}
            htmlFor="tp-cooking-amount"
            hint={tw("cooking-converter.amountHint")}
          >
            <NumberStepper
              id="tp-cooking-amount"
              value={amount}
              step={0.25}
              inputMode="decimal"
              ariaLabel={tw("cooking-converter.amountLabel")}
              increaseLabel={t("stepUp")}
              decreaseLabel={t("stepDown")}
              describedBy={describedBy}
              onValueChange={setAmount}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">{tw("cooking-converter.chipsTitle")}</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((chip) => (
                <Button
                  key={chip}
                  type="button"
                  size="sm"
                  variant={amount === String(chip) ? "default" : "secondary"}
                  aria-label={tw("cooking-converter.chipLabel", {
                    amount: nf.format(chip),
                  })}
                  onClick={() => setAmount(String(chip))}
                >
                  {nf.format(chip)}
                </Button>
              ))}
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">{tw("cooking-converter.unitsTitle")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
              <ToolField label={tw("cooking-converter.fromLabel")}>
                <ThemedSelect
                  value={from}
                  ariaLabel={tw("cooking-converter.fromLabel")}
                  options={unitOptions}
                  onValueChange={(next) => setFrom(next as ConverterUnit)}
                />
              </ToolField>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="tp-swap-button"
                aria-label={tw("cooking-converter.swap")}
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
              >
                <ArrowLeftRight aria-hidden="true" />
              </Button>
              <ToolField label={tw("cooking-converter.toLabel")}>
                <ThemedSelect
                  value={to}
                  ariaLabel={tw("cooking-converter.toLabel")}
                  options={unitOptions}
                  onValueChange={(next) => setTo(next as ConverterUnit)}
                />
              </ToolField>
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("cooking-converter.ingredientLabel")}
            </p>
            <ThemedSelect
              value={ingredient}
              ariaLabel={tw("cooking-converter.ingredientLabel")}
              options={ingredientOptions}
              onValueChange={(next) => setIngredient(next as IngredientId)}
            />
            <p className="tp-tool-hint">{tw("cooking-converter.ingredientHint")}</p>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-cooking-converter-result-title"
          title={t("result")}
          hint={tw("cooking-converter.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={tw("cooking-converter.copyConversion")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ChefHatIcon aria-hidden="true" />}
                title={
                  errorText
                    ? tw("cooking-converter.errorTitle")
                    : tw("cooking-converter.emptyTitle")
                }
                hint={errorText || tw("cooking-converter.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("cooking-converter.resultLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {heroText}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("cooking-converter.kindLabel")}
                  value={kindLabels[value.kind]}
                />
                <Stat
                  label={tw("cooking-converter.densityLabel")}
                  value={`${nf.format(value.gramsPerCup)} ${unitLabels.g} ${tw("cooking-converter.perCup")}`}
                />
                <Stat
                  label={tw("cooking-converter.volumeBaseLabel")}
                  value={`${nf.format(value.fromMl)} ${tw("cooking-converter.unitMl")}`}
                />
              </dl>

              <div className="tp-tool-list">
                <div className="tp-tool-row">
                  <span>{tw("cooking-converter.referenceLabel")}</span>
                  <span className="tp-tool-pill" dir="ltr">
                    {referenceText}
                  </span>
                </div>
              </div>

              <p className="tp-tool-hint">{tw("cooking-converter.densityHint")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
