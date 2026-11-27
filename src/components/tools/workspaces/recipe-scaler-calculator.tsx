"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Utensils, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
} from "@/components/tools/workspace-ui";
import {
  calculateRecipe,
  DEFAULTS,
  formatFactor,
  formatRecipeReport,
  MULTIPLIER_CHIPS,
  type MultiplierChip,
  type RecipeErrorCode,
} from "./recipe-scaler-calculator.logic";

const ERROR_ID = "tp-recipe-scaler-error";

const SAMPLE_RECIPE = [
  "2 cups vegetable broth",
  "1/2 cup diced onion",
  "1 1/2 tbsp olive oil",
  "Salt and pepper to taste",
].join("\n");

function parseValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export default function RecipeScalerCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [text, setText] = useState("");
  const [baseServings, setBaseServings] = useState(String(DEFAULTS.baseServings));
  const [desiredServings, setDesiredServings] = useState(String(DEFAULTS.desiredServings));

  const debouncedText = useDebounced(text, 180);
  const parsedBase = parseValue(baseServings);
  const parsedDesired = parseValue(desiredServings);
  const typedInvalid = [baseServings, desiredServings].some(
    (raw) => raw.trim() !== "" && parseValue(raw) === null,
  );

  const result = useMemo(
    () =>
      parsedBase !== null && parsedDesired !== null
        ? calculateRecipe({ text: debouncedText, baseServings: parsedBase, desiredServings: parsedDesired })
        : null,
    [debouncedText, parsedBase, parsedDesired],
  );

  const errorCode: RecipeErrorCode | undefined = result?.error?.code;
  const errorText =
    typedInvalid || errorCode === "INVALID_NUMBER"
      ? `${tw("recipe-scaler-calculator.errorInvalid")} ${tw("recipe-scaler-calculator.fixInvalid")}`
      : errorCode === "OUT_OF_RANGE"
        ? `${tw("recipe-scaler-calculator.errorRange")} ${tw("recipe-scaler-calculator.fixRange")}`
        : errorCode === "EMPTY" && debouncedText.trim().length > 0
          ? `${tw("recipe-scaler-calculator.errorEmpty")} ${tw("recipe-scaler-calculator.fixEmpty")}`
          : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready =
    debouncedText.trim().length > 0 && !!result && !result.error && !typedInvalid;

  const activeChip: MultiplierChip | "" = useMemo(() => {
    if (parsedBase === null || parsedBase <= 0 || parsedDesired === null) return "";
    return MULTIPLIER_CHIPS.find(
      (chip) => Math.abs(Number(chip) * parsedBase - parsedDesired) < 0.001,
    ) ?? "";
  }, [parsedBase, parsedDesired]);

  const chipOptions = useMemo<{ value: MultiplierChip | ""; label: string }[]>(() => [
    { value: "0.5", label: tw("recipe-scaler-calculator.multHalf") },
    { value: "1", label: tw("recipe-scaler-calculator.multOne") },
    { value: "2", label: tw("recipe-scaler-calculator.multTwo") },
    { value: "3", label: tw("recipe-scaler-calculator.multThree") },
  ], [tw]);

  const handleChip = (chip: MultiplierChip | "") => {
    if (!chip) return;
    const base = parsedBase !== null && parsedBase > 0 ? parsedBase : DEFAULTS.baseServings;
    setDesiredServings(String(Math.round(base * Number(chip) * 100) / 100));
  };

  const reportText = useMemo(() => {
    if (!ready || !result || parsedBase === null || parsedDesired === null) return "";
    return formatRecipeReport(result, {
      text: debouncedText,
      baseServings: parsedBase,
      desiredServings: parsedDesired,
    }, {
      title: tw("recipe-scaler-calculator.reportTitle"),
      original: tw("recipe-scaler-calculator.reportOriginal"),
      desired: tw("recipe-scaler-calculator.reportDesired"),
      factor: tw("recipe-scaler-calculator.reportFactor"),
      note: tw("recipe-scaler-calculator.note"),
    });
  }, [ready, result, debouncedText, parsedBase, parsedDesired, tw]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setText(SAMPLE_RECIPE);
    setBaseServings(String(DEFAULTS.baseServings));
    setDesiredServings(String(DEFAULTS.desiredServings));
  };

  const handleReset = () => {
    setText("");
    setBaseServings(String(DEFAULTS.baseServings));
    setDesiredServings(String(DEFAULTS.desiredServings));
  };

  return (
    <ToolShell
      title={tw("recipe-scaler-calculator.title")}
      icon="Utensils"
      sampleLabel={tw("recipe-scaler-calculator.trySample")}
      resetLabel={tw("recipe-scaler-calculator.reset")}
      privacyLabel={tw("recipe-scaler-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-recipe-input-title"
          title={tw("recipe-scaler-calculator.inputTitle")}
          hint={tw("recipe-scaler-calculator.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setText("")}
              disabled={!text}
              aria-label={t("clear")}
            >
              <X aria-hidden="true" />
            </Button>
          }
        >
          <div>
            <label className="tp-tool-label" htmlFor="tp-recipe-ingredients">
              {tw("recipe-scaler-calculator.ingredientsLabel")}
            </label>
            <textarea
              id="tp-recipe-ingredients"
              className="tp-tool-editor"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={tw("recipe-scaler-calculator.ingredientsPlaceholder")}
              spellCheck={false}
              aria-invalid={Boolean(errorText)}
              aria-describedby={describedBy}
            />
            <p className="tp-tool-hint">{tw("recipe-scaler-calculator.ingredientsHint")}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("recipe-scaler-calculator.originalServingsLabel")}
              htmlFor="tp-recipe-original"
              hint={tw("recipe-scaler-calculator.originalHint")}
            >
              <NumberStepper
                id="tp-recipe-original"
                value={baseServings}
                min={1}
                max={100}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("recipe-scaler-calculator.originalServingsLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setBaseServings}
              />
            </ToolField>
            <ToolField
              label={tw("recipe-scaler-calculator.desiredServingsLabel")}
              htmlFor="tp-recipe-desired"
              hint={tw("recipe-scaler-calculator.desiredHint")}
            >
              <NumberStepper
                id="tp-recipe-desired"
                value={desiredServings}
                min={1}
                max={200}
                step={1}
                inputMode="numeric"
                ariaLabel={tw("recipe-scaler-calculator.desiredServingsLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                onValueChange={setDesiredServings}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<MultiplierChip | "">
              label={tw("recipe-scaler-calculator.multiplierLabel")}
              value={activeChip}
              options={chipOptions}
              onChange={handleChip}
            />
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
          id="tp-recipe-result-title"
          title={t("result")}
          hint={tw("recipe-scaler-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={reportText}
              label={tw("recipe-scaler-calculator.copyRecipe")}
              copiedLabel={t("copied")}
            />
          }
        >
          {!ready || !result ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Utensils aria-hidden="true" />}
                title={errorText
                  ? tw("recipe-scaler-calculator.errorTitle")
                  : tw("recipe-scaler-calculator.emptyTitle")}
                hint={errorText
                  ? tw("recipe-scaler-calculator.emptyErrorHint")
                  : tw("recipe-scaler-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">
                  {tw("recipe-scaler-calculator.factorLabel")}
                </span>
                <output dir="ltr" className="tp-tool-pill">
                  {formatFactor(result.factor)}{tw("recipe-scaler-calculator.timesSuffix")}
                </output>
              </div>

              <dl className="tp-tool-stats">
                <Stat
                  label={tw("recipe-scaler-calculator.statOriginal")}
                  value={parsedBase ?? 0}
                />
                <Stat
                  label={tw("recipe-scaler-calculator.statDesired")}
                  value={parsedDesired ?? 0}
                />
                <Stat
                  label={tw("recipe-scaler-calculator.statIngredients")}
                  value={result.lines.length}
                />
                <Stat
                  label={tw("recipe-scaler-calculator.statChanged")}
                  value={result.changedCount}
                />
              </dl>

              <div className="flex flex-col gap-2">
                <span className="tp-tool-group-title">
                  {tw("recipe-scaler-calculator.scaledTitle")}
                </span>
                <div className="tp-tool-list">
                  {result.lines.map((line, index) => (
                    <div className="tp-tool-row" key={`${index}-${line.original}`}>
                      <span>{line.scaled}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="tp-tool-hint">{tw("recipe-scaler-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
