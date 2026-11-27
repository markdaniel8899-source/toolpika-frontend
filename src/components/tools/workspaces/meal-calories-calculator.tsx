"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Utensils as MealIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import {
  calculateMeal,
  filterFoods,
  FOODS,
  formatMealReport,
  macroShares,
  QUICK_FOOD_IDS,
  validateMeal,
  type FoodId,
  type Macros,
  type MealEntry,
  type MealErrorCode,
} from "./meal-calories-calculator.logic";

function parseCount(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return Number.NaN;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

function MacroBar({
  label,
  grams,
  share,
  formatter,
}: {
  label: string;
  grams: number;
  share: number;
  formatter: Intl.NumberFormat;
}) {
  return (
    <div className="tp-tool-row">
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span>{label}</span>
          <span className="tp-tool-pill" dir="ltr">{`${formatter.format(grams)} g`}</span>
        </div>
        <div
          className="tp-tool-progress"
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={share}
        >
          <span style={{ width: `${share}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function MealCaloriesCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const nextKey = useRef(0);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MealEntry[]>([]);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("0");
  const [customProtein, setCustomProtein] = useState("0");
  const [customCarbs, setCustomCarbs] = useState("0");
  const [customFat, setCustomFat] = useState("0");
  const [customError, setCustomError] = useState<MealErrorCode | null>(null);

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  );

  const foodLabels = useMemo<Record<FoodId, string>>(() => ({
    apple: tw("meal-calories-calculator.foodApple"),
    banana: tw("meal-calories-calculator.foodBanana"),
    egg: tw("meal-calories-calculator.foodEgg"),
    chickenBreast: tw("meal-calories-calculator.foodChickenBreast"),
    whiteRice: tw("meal-calories-calculator.foodWhiteRice"),
    wholeWheatBread: tw("meal-calories-calculator.foodWholeWheatBread"),
    greekYogurt: tw("meal-calories-calculator.foodGreekYogurt"),
    almonds: tw("meal-calories-calculator.foodAlmonds"),
    salmon: tw("meal-calories-calculator.foodSalmon"),
    broccoli: tw("meal-calories-calculator.foodBroccoli"),
    avocado: tw("meal-calories-calculator.foodAvocado"),
    pasta: tw("meal-calories-calculator.foodPasta"),
    milk: tw("meal-calories-calculator.foodMilk"),
    cheddar: tw("meal-calories-calculator.foodCheddar"),
    tofu: tw("meal-calories-calculator.foodTofu"),
    lentils: tw("meal-calories-calculator.foodLentils"),
  }), [tw]);

  const matches = useMemo(() => filterFoods(query, foodLabels), [query, foodLabels]);
  const result = useMemo(() => calculateMeal(items), [items]);
  const shares = useMemo(() => macroShares(result.macros), [result.macros]);
  const macros: Macros = result.macros;
  const hasItems = items.length > 0;

  const errorText = (code: MealErrorCode | undefined): string => {
    if (!code) return "";
    if (code === "EMPTY_NAME") {
      return `${tw("meal-calories-calculator.errorEmptyName")} ${tw("meal-calories-calculator.fixEmptyName")}`;
    }
    if (code === "TOO_MANY_ITEMS") {
      return `${tw("meal-calories-calculator.errorTooMany")} ${tw("meal-calories-calculator.fixTooMany")}`;
    }
    if (code === "INVALID_NUMBER") {
      return `${tw("meal-calories-calculator.errorInvalid")} ${tw("meal-calories-calculator.fixInvalid")}`;
    }
    return `${tw("meal-calories-calculator.errorRange")} ${tw("meal-calories-calculator.fixRange")}`;
  };

  const ready = hasItems && !result.error;

  const reportText = useMemo(() => {
    if (!ready) return "";
    return formatMealReport(result, {
      title: tw("meal-calories-calculator.reportTitle"),
      total: tw("meal-calories-calculator.totalLabel"),
      protein: tw("meal-calories-calculator.proteinLabel"),
      carbs: tw("meal-calories-calculator.carbsLabel"),
      fat: tw("meal-calories-calculator.fatLabel"),
      times: tw("meal-calories-calculator.times"),
      unit: tw("meal-calories-calculator.unitKcal"),
      note: tw("meal-calories-calculator.reportNote"),
    });
  }, [ready, result, tw]);

  const addFood = (id: FoodId) => {
    const food = FOODS.find((row) => row.id === id);
    if (!food) return;
    const key = `food:${nextKey.current++}`;
    setItems((previous) => [...previous, {
      key,
      name: foodLabels[id],
      kcal: food.kcal,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      quantity: 1,
    }]);
  };

  const clearCustom = () => {
    setCustomName("");
    setCustomKcal("0");
    setCustomProtein("0");
    setCustomCarbs("0");
    setCustomFat("0");
    setCustomError(null);
  };

  const addCustom = () => {
    const candidate: MealEntry = {
      key: `custom:${nextKey.current++}`,
      name: customName.trim(),
      kcal: parseCount(customKcal),
      protein: parseCount(customProtein),
      carbs: parseCount(customCarbs),
      fat: parseCount(customFat),
      quantity: 1,
    };
    const problem = validateMeal([candidate]);
    if (problem) {
      setCustomError(problem);
      return;
    }
    setItems((previous) => [...previous, candidate]);
    clearCustom();
  };

  const setQuantity = (key: string, raw: string) => {
    setItems((previous) => previous.map((item) => (
      item.key === key ? { ...item, quantity: parseCount(raw) } : item
    )));
  };

  const handleSample = () => {
    setQuery("");
    clearCustom();
    const key = () => `sample:${nextKey.current++}`;
    setItems([
      { key: key(), name: foodLabels.chickenBreast, kcal: 165, protein: 31, carbs: 0, fat: 3.6, quantity: 1 },
      { key: key(), name: foodLabels.whiteRice, kcal: 206, protein: 4.3, carbs: 45, fat: 0.4, quantity: 1 },
      { key: key(), name: foodLabels.broccoli, kcal: 55, protein: 3.7, carbs: 11, fat: 0.6, quantity: 1 },
    ]);
  };

  const handleClear = () => {
    setQuery("");
    setItems([]);
    clearCustom();
  };

  return (
    <ToolShell
      title={tw("meal-calories-calculator.title")}
      icon="Gauge"
      sampleLabel={tw("meal-calories-calculator.trySample")}
      resetLabel={t("clear")}
      privacyLabel={tw("meal-calories-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleClear}
      input={
        <ToolPane
          id="tp-meal-input-title"
          title={tw("meal-calories-calculator.inputTitle")}
          hint={tw("meal-calories-calculator.inputHint")}
        >
          <ToolField
            label={tw("meal-calories-calculator.searchLabel")}
            htmlFor="tp-meal-search"
            hint={tw("meal-calories-calculator.searchHint")}
          >
            <input
              id="tp-meal-search"
              className="tp-field-input"
              type="text"
              autoComplete="off"
              value={query}
              placeholder={tw("meal-calories-calculator.searchPlaceholder")}
              aria-label={tw("meal-calories-calculator.searchLabel")}
              onChange={(event) => setQuery(event.target.value)}
            />
          </ToolField>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("meal-calories-calculator.quickTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_FOOD_IDS.map((id) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addFood(id)}
                >
                  {foodLabels[id]}
                </Button>
              ))}
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("meal-calories-calculator.resultsTitle")}
            </p>
            {matches.length > 0 ? (
              <div className="tp-tool-list">
                {matches.map((food) => (
                  <div className="tp-tool-row" key={food.id}>
                    <span>{foodLabels[food.id]}</span>
                    <span className="tp-tool-pill" dir="ltr">
                      {`${formatter.format(food.kcal)} ${tw("meal-calories-calculator.unitKcal")}`}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => addFood(food.id)}
                    >
                      {tw("meal-calories-calculator.addFood")}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tp-tool-hint">{tw("meal-calories-calculator.searchEmpty")}</p>
            )}
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("meal-calories-calculator.customTitle")}
            </p>
            <ToolField
              label={tw("meal-calories-calculator.customNameLabel")}
              htmlFor="tp-meal-custom-name"
            >
              <input
                id="tp-meal-custom-name"
                className="tp-field-input"
                type="text"
                autoComplete="off"
                value={customName}
                placeholder={tw("meal-calories-calculator.customNamePlaceholder")}
                onChange={(event) => {
                  setCustomName(event.target.value);
                  setCustomError(null);
                }}
              />
            </ToolField>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ToolField label={tw("meal-calories-calculator.customKcalLabel")} htmlFor="tp-meal-custom-kcal">
                <NumberStepper
                  id="tp-meal-custom-kcal"
                  value={customKcal}
                  min={0}
                  max={5000}
                  step={10}
                  ariaLabel={tw("meal-calories-calculator.customKcalLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  onValueChange={(next) => { setCustomKcal(next); setCustomError(null); }}
                />
              </ToolField>
              <ToolField label={tw("meal-calories-calculator.customProteinLabel")} htmlFor="tp-meal-custom-protein">
                <NumberStepper
                  id="tp-meal-custom-protein"
                  value={customProtein}
                  min={0}
                  max={500}
                  step={0.5}
                  inputMode="decimal"
                  ariaLabel={tw("meal-calories-calculator.customProteinLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  onValueChange={(next) => { setCustomProtein(next); setCustomError(null); }}
                />
              </ToolField>
              <ToolField label={tw("meal-calories-calculator.customCarbsLabel")} htmlFor="tp-meal-custom-carbs">
                <NumberStepper
                  id="tp-meal-custom-carbs"
                  value={customCarbs}
                  min={0}
                  max={500}
                  step={0.5}
                  inputMode="decimal"
                  ariaLabel={tw("meal-calories-calculator.customCarbsLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  onValueChange={(next) => { setCustomCarbs(next); setCustomError(null); }}
                />
              </ToolField>
              <ToolField label={tw("meal-calories-calculator.customFatLabel")} htmlFor="tp-meal-custom-fat">
                <NumberStepper
                  id="tp-meal-custom-fat"
                  value={customFat}
                  min={0}
                  max={500}
                  step={0.5}
                  inputMode="decimal"
                  ariaLabel={tw("meal-calories-calculator.customFatLabel")}
                  increaseLabel={t("stepUp")}
                  decreaseLabel={t("stepDown")}
                  onValueChange={(next) => { setCustomFat(next); setCustomError(null); }}
                />
              </ToolField>
            </div>
            <p className="tp-tool-hint">{tw("meal-calories-calculator.customHint")}</p>
            <Button type="button" size="sm" variant="secondary" onClick={addCustom}>
              {tw("meal-calories-calculator.customAdd")}
            </Button>
            {customError ? (
              <p className="tp-tool-error" role="alert" aria-live="polite">
                {errorText(customError)}
              </p>
            ) : null}
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("meal-calories-calculator.mealTitle")}
            </p>
            {hasItems ? (
              <div className="tp-tool-list">
                {items.map((item, index) => (
                  <div className="tp-tool-row" key={item.key}>
                    <div className="flex w-full flex-wrap items-center gap-2">
                      <span className="min-w-[90px] flex-1">{item.name}</span>
                      <NumberStepper
                        id={`tp-meal-qty-${index}`}
                        className="w-[88px]"
                        value={String(item.quantity)}
                        min={0}
                        max={99}
                        step={0.5}
                        inputMode="decimal"
                        ariaLabel={tw("meal-calories-calculator.quantityLabel", { item: item.name })}
                        increaseLabel={t("stepUp")}
                        decreaseLabel={t("stepDown")}
                        onValueChange={(next) => setQuantity(item.key, next)}
                      />
                      <span className="tp-tool-pill" dir="ltr">
                        {`${formatter.format(Math.round(item.kcal * item.quantity))} ${tw("meal-calories-calculator.unitKcal")}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tw("meal-calories-calculator.removeItem", { item: item.name })}
                        onClick={() => setItems((previous) => previous.filter((row) => row.key !== item.key))}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tp-tool-hint">{tw("meal-calories-calculator.mealEmpty")}</p>
            )}
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-meal-result-title"
          title={t("result")}
          hint={tw("meal-calories-calculator.resultHint")}
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
                icon={<MealIcon aria-hidden="true" />}
                title={
                  result.error
                    ? tw("meal-calories-calculator.errorTitle")
                    : tw("meal-calories-calculator.emptyTitle")
                }
                hint={result.error ? errorText(result.error.code) : tw("meal-calories-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("meal-calories-calculator.totalLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {`${formatter.format(Math.round(macros.kcal))} ${tw("meal-calories-calculator.unitKcal")}`}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("meal-calories-calculator.proteinLabel")}
                  value={`${formatter.format(macros.protein)} g`}
                />
                <Stat
                  label={tw("meal-calories-calculator.carbsLabel")}
                  value={`${formatter.format(macros.carbs)} g`}
                />
                <Stat
                  label={tw("meal-calories-calculator.fatLabel")}
                  value={`${formatter.format(macros.fat)} g`}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("meal-calories-calculator.macroTitle")}
                </span>
                <div className="tp-tool-list">
                  <MacroBar
                    label={tw("meal-calories-calculator.proteinLabel")}
                    grams={macros.protein}
                    share={shares.protein}
                    formatter={formatter}
                  />
                  <MacroBar
                    label={tw("meal-calories-calculator.carbsLabel")}
                    grams={macros.carbs}
                    share={shares.carbs}
                    formatter={formatter}
                  />
                  <MacroBar
                    label={tw("meal-calories-calculator.fatLabel")}
                    grams={macros.fat}
                    share={shares.fat}
                    formatter={formatter}
                  />
                </div>
                <p className="tp-tool-hint">
                  {tw("meal-calories-calculator.macroHint")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("meal-calories-calculator.summaryTitle")}
                </span>
                <div className="tp-tool-list">
                  {result.lines.map((line) => (
                    <div className="tp-tool-row" key={line.key}>
                      <span>
                        {`${line.name} ${tw("meal-calories-calculator.times")} ${line.quantity}`}
                      </span>
                      <span className="tp-tool-pill" dir="ltr">
                        {`${formatter.format(Math.round(line.macros.kcal))} ${tw("meal-calories-calculator.unitKcal")}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
