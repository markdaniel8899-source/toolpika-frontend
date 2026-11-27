"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Coffee as CoffeeIcon } from "lucide-react";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToggleSwitch,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
} from "@/components/tools/workspace-ui";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  calculateCoffee,
  DEFAULT_COFFEE_INPUT,
  formatCoffeeReport,
  macroShares,
  type CoffeeErrorCode,
  type CoffeeInput,
  type CoffeePartId,
  type CupSize,
  type DrinkBase,
  type Macros,
  type Milk,
} from "./coffee-calories-calculator.logic";

const SAMPLE: CoffeeInput = {
  base: "latte",
  size: "medium",
  milk: "oat",
  syrup: 1,
  sugar: 1,
  whipped: true,
};

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

export default function CoffeeCaloriesCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [base, setBase] = useState<DrinkBase>(DEFAULT_COFFEE_INPUT.base);
  const [size, setSize] = useState<CupSize>(DEFAULT_COFFEE_INPUT.size);
  const [milk, setMilk] = useState<Milk>(DEFAULT_COFFEE_INPUT.milk);
  const [syrup, setSyrup] = useState(String(DEFAULT_COFFEE_INPUT.syrup));
  const [sugar, setSugar] = useState(String(DEFAULT_COFFEE_INPUT.sugar));
  const [whipped, setWhipped] = useState(DEFAULT_COFFEE_INPUT.whipped);

  const syrupValue = parseCount(syrup);
  const sugarValue = parseCount(sugar);

  const result = useMemo(
    () => calculateCoffee({
      base,
      size,
      milk,
      syrup: syrupValue,
      sugar: sugarValue,
      whipped,
    }),
    [base, size, milk, syrupValue, sugarValue, whipped],
  );

  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  );

  const baseOptions = useMemo<{ value: DrinkBase; label: string }[]>(() => [
    { value: "espresso", label: tw("coffee-calories-calculator.baseEspresso") },
    { value: "brewed", label: tw("coffee-calories-calculator.baseBrewed") },
    { value: "coldBrew", label: tw("coffee-calories-calculator.baseColdBrew") },
    { value: "latte", label: tw("coffee-calories-calculator.baseLatte") },
    { value: "cappuccino", label: tw("coffee-calories-calculator.baseCappuccino") },
    { value: "mocha", label: tw("coffee-calories-calculator.baseMocha") },
  ], [tw]);

  const milkOptions = useMemo<{ value: Milk; label: string }[]>(() => [
    { value: "none", label: tw("coffee-calories-calculator.milkNone") },
    { value: "whole", label: tw("coffee-calories-calculator.milkWhole") },
    { value: "skim", label: tw("coffee-calories-calculator.milkSkim") },
    { value: "oat", label: tw("coffee-calories-calculator.milkOat") },
    { value: "almond", label: tw("coffee-calories-calculator.milkAlmond") },
  ], [tw]);

  const sizeOptions = useMemo<{ value: CupSize; label: string }[]>(() => [
    { value: "small", label: tw("coffee-calories-calculator.sizeSmall") },
    { value: "medium", label: tw("coffee-calories-calculator.sizeMedium") },
    { value: "large", label: tw("coffee-calories-calculator.sizeLarge") },
  ], [tw]);

  const partLabels = useMemo<Record<CoffeePartId, string>>(() => ({
    coffee: tw("coffee-calories-calculator.partCoffee"),
    milk: tw("coffee-calories-calculator.partMilk"),
    chocolate: tw("coffee-calories-calculator.partChocolate"),
    syrup: tw("coffee-calories-calculator.partSyrup"),
    sugar: tw("coffee-calories-calculator.partSugar"),
    cream: tw("coffee-calories-calculator.partCream"),
  }), [tw]);

  const invalidTyped =
    (syrup.trim().length > 0 && !Number.isFinite(syrupValue)) ||
    (sugar.trim().length > 0 && !Number.isFinite(sugarValue));
  const errorCode: CoffeeErrorCode | undefined = result.error?.code;
  const errorText =
    invalidTyped || errorCode === "INVALID_NUMBER" || errorCode === "INVALID_OPTION"
      ? `${tw("coffee-calories-calculator.errorInvalid")} ${tw("coffee-calories-calculator.fixInvalid")}`
      : errorCode === "OUT_OF_RANGE"
        ? `${tw("coffee-calories-calculator.errorRange")} ${tw("coffee-calories-calculator.fixRange")}`
        : "";
  const ready = !result.error && !errorText;

  const shares = useMemo(() => macroShares(result.macros), [result.macros]);
  const macros: Macros = result.macros;

  const reportText = useMemo(() => {
    if (!ready) return "";
    return formatCoffeeReport(result, {
      title: tw("coffee-calories-calculator.reportTitle"),
      calories: tw("coffee-calories-calculator.caloriesLabel"),
      protein: tw("coffee-calories-calculator.proteinLabel"),
      carbs: tw("coffee-calories-calculator.carbsLabel"),
      fat: tw("coffee-calories-calculator.fatLabel"),
      breakdown: tw("coffee-calories-calculator.breakdownTitle"),
      parts: partLabels,
      note: tw("coffee-calories-calculator.reportNote"),
    });
  }, [ready, result, tw, partLabels]);

  const handleSample = () => {
    setBase(SAMPLE.base);
    setSize(SAMPLE.size);
    setMilk(SAMPLE.milk);
    setSyrup(String(SAMPLE.syrup));
    setSugar(String(SAMPLE.sugar));
    setWhipped(SAMPLE.whipped);
  };

  const handleReset = () => {
    setBase(DEFAULT_COFFEE_INPUT.base);
    setSize(DEFAULT_COFFEE_INPUT.size);
    setMilk(DEFAULT_COFFEE_INPUT.milk);
    setSyrup(String(DEFAULT_COFFEE_INPUT.syrup));
    setSugar(String(DEFAULT_COFFEE_INPUT.sugar));
    setWhipped(DEFAULT_COFFEE_INPUT.whipped);
  };

  return (
    <ToolShell
      title={tw("coffee-calories-calculator.title")}
      icon="Activity"
      sampleLabel={tw("coffee-calories-calculator.trySample")}
      resetLabel={tw("coffee-calories-calculator.reset")}
      privacyLabel={tw("coffee-calories-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-coffee-input-title"
          title={tw("coffee-calories-calculator.inputTitle")}
          hint={tw("coffee-calories-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("coffee-calories-calculator.baseLabel")}
            </p>
            <ThemedSelect
              value={base}
              ariaLabel={tw("coffee-calories-calculator.baseLabel")}
              options={baseOptions}
              onValueChange={(next) => setBase(next as DrinkBase)}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("coffee-calories-calculator.sizeLabel")}
            </p>
            <SegmentedControl<CupSize>
              label={tw("coffee-calories-calculator.sizeLabel")}
              value={size}
              options={sizeOptions}
              onChange={setSize}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <p className="tp-tool-group-title">
              {tw("coffee-calories-calculator.milkLabel")}
            </p>
            <ThemedSelect
              value={milk}
              ariaLabel={tw("coffee-calories-calculator.milkLabel")}
              options={milkOptions}
              onValueChange={(next) => setMilk(next as Milk)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("coffee-calories-calculator.syrupLabel")}
              htmlFor="tp-coffee-syrup"
            >
              <NumberStepper
                id="tp-coffee-syrup"
                value={syrup}
                min={0}
                max={100}
                step={1}
                ariaLabel={tw("coffee-calories-calculator.syrupLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={setSyrup}
              />
            </ToolField>
            <ToolField
              label={tw("coffee-calories-calculator.sugarLabel")}
              htmlFor="tp-coffee-sugar"
            >
              <NumberStepper
                id="tp-coffee-sugar"
                value={sugar}
                min={0}
                max={100}
                step={1}
                ariaLabel={tw("coffee-calories-calculator.sugarLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                onValueChange={setSugar}
              />
            </ToolField>
          </div>

          <div className="tp-check-row">
            <ToggleSwitch
              id="tp-coffee-whipped"
              label={tw("coffee-calories-calculator.whippedLabel")}
              checked={whipped}
              onChange={() => setWhipped((previous) => !previous)}
            />
            <label htmlFor="tp-coffee-whipped" className="tp-check-label">
              {tw("coffee-calories-calculator.whippedLabel")}
            </label>
          </div>

          <p className="tp-tool-hint">{tw("coffee-calories-calculator.additionsHint")}</p>

          {errorText ? (
            <p className="tp-tool-error" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-coffee-result-title"
          title={t("result")}
          hint={tw("coffee-calories-calculator.resultHint")}
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
                icon={<CoffeeIcon aria-hidden="true" />}
                title={tw("coffee-calories-calculator.emptyTitle")}
                hint={errorText || tw("coffee-calories-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("coffee-calories-calculator.caloriesLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {formatter.format(Math.round(macros.kcal))}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("coffee-calories-calculator.proteinLabel")}
                  value={`${formatter.format(macros.protein)} g`}
                />
                <Stat
                  label={tw("coffee-calories-calculator.carbsLabel")}
                  value={`${formatter.format(macros.carbs)} g`}
                />
                <Stat
                  label={tw("coffee-calories-calculator.fatLabel")}
                  value={`${formatter.format(macros.fat)} g`}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("coffee-calories-calculator.macroTitle")}
                </span>
                <div className="tp-tool-list">
                  <MacroBar
                    label={tw("coffee-calories-calculator.proteinLabel")}
                    grams={macros.protein}
                    share={shares.protein}
                    formatter={formatter}
                  />
                  <MacroBar
                    label={tw("coffee-calories-calculator.carbsLabel")}
                    grams={macros.carbs}
                    share={shares.carbs}
                    formatter={formatter}
                  />
                  <MacroBar
                    label={tw("coffee-calories-calculator.fatLabel")}
                    grams={macros.fat}
                    share={shares.fat}
                    formatter={formatter}
                  />
                </div>
                <p className="tp-tool-hint">
                  {tw("coffee-calories-calculator.macroHint")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("coffee-calories-calculator.breakdownTitle")}
                </span>
                <div className="tp-tool-list">
                  {result.parts.map((part) => (
                    <div className="tp-tool-row" key={part.id}>
                      <span>{partLabels[part.id]}</span>
                      <span className="tp-tool-pill" dir="ltr">
                        {formatter.format(Math.round(part.macros.kcal))}
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
