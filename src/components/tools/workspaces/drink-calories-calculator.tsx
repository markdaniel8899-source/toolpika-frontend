"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Droplets } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  calculateDrink,
  DEFAULT_DRINK_INPUT,
  drinksByCategory,
  findDrink,
  formatDrinkReport,
  type DrinkCategory,
  type DrinkErrorCode,
} from "./drink-calories-calculator.logic";

const ERROR_ID = "tp-drink-error";

// A neutral worked example, not a recommended drink.
const SAMPLE = {
  category: "smoothie" as DrinkCategory,
  drinkId: "fruitSmoothie",
  servingMl: 400,
  count: 2,
};

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function DrinkCaloriesCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [category, setCategory] = useState<DrinkCategory>(
    DEFAULT_DRINK_INPUT.category,
  );
  const [drinkId, setDrinkId] = useState(DEFAULT_DRINK_INPUT.drinkId);
  const [servingMl, setServingMl] = useState("");
  const [count, setCount] = useState("");

  const parsedServing = parseValue(servingMl);
  const parsedCount = parseValue(count);
  const invalid =
    (servingMl.trim().length > 0 && parsedServing === null) ||
    (count.trim().length > 0 && parsedCount === null);
  const allFilled = servingMl.trim().length > 0 && count.trim().length > 0;

  const calculation = useMemo(
    () =>
      calculateDrink({
        category,
        drinkId,
        servingMl: parsedServing ?? Number.NaN,
        count: parsedCount ?? Number.NaN,
      }),
    [category, drinkId, parsedServing, parsedCount],
  );

  const errorCode: DrinkErrorCode | undefined = calculation.error;
  const errorText = invalid
    ? `${tw("drink-calories-calculator.errorInvalid")} ${tw("drink-calories-calculator.fixInvalid")}`
    : errorCode === "INVALID_OPTION"
      ? `${tw("drink-calories-calculator.errorOption")} ${tw("drink-calories-calculator.fixOption")}`
      : errorCode === "INVALID_NUMBER"
        ? `${tw("drink-calories-calculator.errorInvalid")} ${tw("drink-calories-calculator.fixInvalid")}`
        : errorCode === "OUT_OF_RANGE"
          ? `${tw("drink-calories-calculator.errorRange")} ${tw("drink-calories-calculator.fixRange")}`
          : "";
  const ready = allFilled && !calculation.error && !errorText;
  const describedBy = errorText ? ERROR_ID : undefined;

  const whole = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const categoryLabels = useMemo<Record<DrinkCategory, string>>(
    () => ({
      soft: tw("drink-calories-calculator.categorySoft"),
      juice: tw("drink-calories-calculator.categoryJuice"),
      energy: tw("drink-calories-calculator.categoryEnergy"),
      smoothie: tw("drink-calories-calculator.categorySmoothie"),
      alcohol: tw("drink-calories-calculator.categoryAlcohol"),
    }),
    [tw],
  );

  const drinkLabels = useMemo<Record<string, string>>(
    () => ({
      cola: tw("drink-calories-calculator.drinkCola"),
      lemonSoda: tw("drink-calories-calculator.drinkLemonSoda"),
      sweetIcedTea: tw("drink-calories-calculator.drinkSweetIcedTea"),
      orangeJuice: tw("drink-calories-calculator.drinkOrangeJuice"),
      appleJuice: tw("drink-calories-calculator.drinkAppleJuice"),
      cranberryCocktail: tw("drink-calories-calculator.drinkCranberryCocktail"),
      energyDrink: tw("drink-calories-calculator.drinkEnergyDrink"),
      sugarFreeEnergy: tw("drink-calories-calculator.drinkSugarFreeEnergy"),
      sportsDrink: tw("drink-calories-calculator.drinkSportsDrink"),
      fruitSmoothie: tw("drink-calories-calculator.drinkFruitSmoothie"),
      berrySmoothie: tw("drink-calories-calculator.drinkBerrySmoothie"),
      greenSmoothie: tw("drink-calories-calculator.drinkGreenSmoothie"),
      beer: tw("drink-calories-calculator.drinkBeer"),
      redWine: tw("drink-calories-calculator.drinkRedWine"),
      margarita: tw("drink-calories-calculator.drinkMargarita"),
    }),
    [tw],
  );

  const categoryOptions = useMemo(
    () =>
      (["soft", "juice", "energy", "smoothie", "alcohol"] as DrinkCategory[]).map(
        (value) => ({ value, label: categoryLabels[value] }),
      ),
    [categoryLabels],
  );

  const drinkOptions = useMemo(
    () =>
      drinksByCategory(category).map((drink) => ({
        value: drink.id,
        label: drinkLabels[drink.id] ?? drink.id,
        group: categoryLabels[category],
      })),
    [category, categoryLabels, drinkLabels],
  );

  const drinkName = drinkLabels[drinkId] ?? drinkId;
  const reportText = useMemo(() => {
    if (!ready) return "";
    return formatDrinkReport(
      calculation,
      {
        category,
        drinkId,
        servingMl: parsedServing ?? 0,
        count: parsedCount ?? 0,
      },
      drinkName,
      categoryLabels[category],
      {
        title: tw("drink-calories-calculator.reportTitle"),
        drink: tw("drink-calories-calculator.drinkLabel"),
        category: tw("drink-calories-calculator.categoryLabel"),
        per100: tw("drink-calories-calculator.per100Label"),
        serving: tw("drink-calories-calculator.servingLabel"),
        count: tw("drink-calories-calculator.countLabel"),
        perServing: tw("drink-calories-calculator.perServingLabel"),
        total: tw("drink-calories-calculator.totalLabel"),
        breakdown: tw("drink-calories-calculator.breakdownTitle"),
        unitMl: tw("drink-calories-calculator.unitMl"),
        unitKcal: tw("drink-calories-calculator.unitKcal"),
        note: tw("drink-calories-calculator.reportNote"),
      },
    );
  }, [ready, calculation, category, drinkId, parsedServing, parsedCount, drinkName, categoryLabels, tw]);

  const handleCategory = (next: DrinkCategory) => {
    const first = drinksByCategory(next)[0];
    setCategory(next);
    setDrinkId(first.id);
    setServingMl(String(first.typicalMl));
  };

  const handleDrink = (next: string) => {
    setDrinkId(next);
    const chosen = findDrink(next);
    if (chosen) setServingMl(String(chosen.typicalMl));
  };

  const handleSample = () => {
    setCategory(SAMPLE.category);
    setDrinkId(SAMPLE.drinkId);
    setServingMl(String(SAMPLE.servingMl));
    setCount(String(SAMPLE.count));
  };

  const handleReset = () => {
    const first = drinksByCategory(DEFAULT_DRINK_INPUT.category)[0];
    setCategory(DEFAULT_DRINK_INPUT.category);
    setDrinkId(first.id);
    setServingMl("");
    setCount("");
  };

  return (
    <ToolShell
      title={tw("drink-calories-calculator.title")}
      icon="Droplets"
      sampleLabel={tw("drink-calories-calculator.trySample")}
      resetLabel={tw("drink-calories-calculator.reset")}
      privacyLabel={tw("drink-calories-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-drink-input-title"
          title={tw("drink-calories-calculator.inputTitle")}
          hint={tw("drink-calories-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("drink-calories-calculator.categoryLabel")}
            </p>
            <SegmentedControl<DrinkCategory>
              label={tw("drink-calories-calculator.categoryLabel")}
              value={category}
              options={categoryOptions}
              onChange={handleCategory}
            />
          </div>

          <ToolField label={tw("drink-calories-calculator.drinkLabel")} hint={tw("drink-calories-calculator.drinkHint")}>
            <ThemedSelect
              value={drinkId}
              ariaLabel={tw("drink-calories-calculator.drinkLabel")}
              options={drinkOptions}
              onValueChange={handleDrink}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("drink-calories-calculator.servingLabel")}
              htmlFor="tp-drink-serving"
              hint={tw("drink-calories-calculator.servingHint")}
            >
              <NumberStepper
                id="tp-drink-serving"
                value={servingMl}
                min={50}
                max={2000}
                step={50}
                inputMode="numeric"
                ariaLabel={tw("drink-calories-calculator.servingLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setServingMl}
              />
            </ToolField>
            <ToolField
              label={tw("drink-calories-calculator.countLabel")}
              htmlFor="tp-drink-count"
              hint={tw("drink-calories-calculator.countHint")}
            >
              <NumberStepper
                id="tp-drink-count"
                value={count}
                min={1}
                max={50}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("drink-calories-calculator.countLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setCount}
              />
            </ToolField>
          </div>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-drink-result-title"
          title={t("result")}
          hint={tw("drink-calories-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Droplets aria-hidden="true" />}
                title={
                  errorText
                    ? tw("drink-calories-calculator.errorTitle")
                    : tw("drink-calories-calculator.emptyTitle")
                }
                hint={errorText || tw("drink-calories-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("drink-calories-calculator.totalLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {whole.format(Math.round(calculation.totalKcal))} {tw("drink-calories-calculator.unitKcal")}
                </output>
              </div>

              <ToolBadge tone="accent">{drinkName}</ToolBadge>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("drink-calories-calculator.perServingLabel")}
                  value={`${whole.format(Math.round(calculation.kcalPerServing))} ${tw("drink-calories-calculator.unitKcal")}`}
                />
                <Stat
                  label={tw("drink-calories-calculator.servingLabel")}
                  value={`${whole.format(parsedServing ?? 0)} ${tw("drink-calories-calculator.unitMl")}`}
                />
                <Stat
                  label={tw("drink-calories-calculator.countLabel")}
                  value={whole.format(parsedCount ?? 0)}
                />
                <Stat
                  label={tw("drink-calories-calculator.per100Label")}
                  value={`${calculation.drink.kcalPer100Ml} ${tw("drink-calories-calculator.unitKcal")}`}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("drink-calories-calculator.breakdownTitle")}
                </span>
                <div className="tp-tool-list">
                  <div className="tp-tool-row">
                    <span>{tw("drink-calories-calculator.per100Label")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {calculation.drink.kcalPer100Ml} {tw("drink-calories-calculator.unitKcal")}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("drink-calories-calculator.servingLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {whole.format(parsedServing ?? 0)} {tw("drink-calories-calculator.unitMl")}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("drink-calories-calculator.countLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {whole.format(parsedCount ?? 0)}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("drink-calories-calculator.perServingLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {whole.format(Math.round(calculation.kcalPerServing))} {tw("drink-calories-calculator.unitKcal")}
                    </span>
                  </div>
                  <div className="tp-tool-row">
                    <span>{tw("drink-calories-calculator.totalLabel")}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {whole.format(Math.round(calculation.totalKcal))} {tw("drink-calories-calculator.unitKcal")}
                    </span>
                  </div>
                </div>
                <p className="tp-tool-hint">
                  {tw("drink-calories-calculator.reportNote")}
                </p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
