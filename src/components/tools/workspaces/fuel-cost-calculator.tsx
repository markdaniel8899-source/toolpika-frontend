"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Fuel as FuelIcon } from "lucide-react";
import {
  CheckboxRow,
  CopyButton,
  HeroValue,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateFuelCost,
  DEFAULTS,
  formatFuelReport,
  priceUnitFor,
  type DistanceUnit,
  type EfficiencyUnit,
  type FuelPriceUnit,
} from "./fuel-cost-calculator.logic";

const ERROR_ID = "fuel-cost-calculator-error";
const EFFICIENCY_UNITS: readonly EfficiencyUnit[] = ["kmpl", "lp100", "mpgUs", "mpgUk"];
const EFFICIENCY_LABEL_KEYS: Record<EfficiencyUnit, string> = {
  kmpl: "effKmpl", lp100: "effLp100", mpgUs: "effMpgUs", mpgUk: "effMpgUk",
};
const PRICE_LABEL_KEYS: Record<FuelPriceUnit, string> = {
  liter: "priceLiter", usGallon: "priceUsGallon", imperialGallon: "priceImperialGallon",
};

export default function FuelCostCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [efficiencyUnit, setEfficiencyUnit] = useState<EfficiencyUnit>("lp100");
  const [efficiency, setEfficiency] = useState("");
  const [price, setPrice] = useState("");
  const [roundTrip, setRoundTrip] = useState(false);
  const [split, setSplit] = useState("");

  const input = useMemo(
    () => ({ distance, distanceUnit, efficiencyUnit, efficiency, price, roundTrip, split }),
    [distance, distanceUnit, efficiencyUnit, efficiency, price, roundTrip, split],
  );
  const calculation = useMemo(() => calculateFuelCost(input), [input]);
  const estimate = calculation.value;

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );
  const volume = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }),
    [locale],
  );
  const priceUnit = priceUnitFor(efficiencyUnit);
  const priceUnitLabel = tw(`fuel-cost-calculator.${PRICE_LABEL_KEYS[priceUnit]}`);
  const distanceOptions = useMemo(
    () => [
      { value: "km" as const, label: tw("fuel-cost-calculator.distanceKm") },
      { value: "mi" as const, label: tw("fuel-cost-calculator.distanceMi") },
    ],
    [tw],
  );
  const efficiencyOptions = useMemo(
    () => EFFICIENCY_UNITS.map((value) => ({ value, label: tw(`fuel-cost-calculator.${EFFICIENCY_LABEL_KEYS[value]}`) })),
    [tw],
  );
  const distanceUnitLabel = distanceUnit === "km" ? tw("fuel-cost-calculator.unitKm") : tw("fuel-cost-calculator.unitMi");
  const efficiencyUnitLabel = tw(`fuel-cost-calculator.${EFFICIENCY_LABEL_KEYS[efficiencyUnit]}`);

  const errorText = useMemo(() => {
    const code = calculation.error?.code;
    if (code === "MISSING_DISTANCE" || code === "MISSING_EFFICIENCY" || code === "MISSING_PRICE" || code === "MISSING_SPLIT") {
      return `${tw("fuel-cost-calculator.errorMissing")} ${tw("fuel-cost-calculator.fixMissing")}`;
    }
    if (code === "INVALID_NUMBER") return `${tw("fuel-cost-calculator.errorInvalid")} ${tw("fuel-cost-calculator.fixInvalid")}`;
    if (code === "NOT_POSITIVE") return `${tw("fuel-cost-calculator.errorNotPositive")} ${tw("fuel-cost-calculator.fixNotPositive")}`;
    if (code === "INVALID_SPLIT") return `${tw("fuel-cost-calculator.errorSplit")} ${tw("fuel-cost-calculator.fixSplit")}`;
    return "";
  }, [calculation.error, tw]);
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = Boolean(estimate && !errorText);

  const reportText = useMemo(() => {
    if (!ready || !estimate) return "";
    return formatFuelReport(
      estimate,
      input,
      {
        title: tw("fuel-cost-calculator.reportTitle"),
        distance: tw("fuel-cost-calculator.distanceLabel"),
        efficiency: tw("fuel-cost-calculator.efficiencyLabel"),
        price: tw("fuel-cost-calculator.priceLabel"),
        roundTrip: tw("fuel-cost-calculator.roundTripLabel"),
        split: tw("fuel-cost-calculator.splitLabel"),
        fuel: tw("fuel-cost-calculator.fuelLitersLabel"),
        cost: tw("fuel-cost-calculator.costLabel"),
        perPerson: tw("fuel-cost-calculator.costPerPersonLabel"),
        perKm: tw("fuel-cost-calculator.costPerKmLabel"),
        note: tw("fuel-cost-calculator.reportNote"),
        roundTripOn: tw("fuel-cost-calculator.roundTripOn"),
        roundTripOff: tw("fuel-cost-calculator.roundTripOff"),
      },
      distanceUnitLabel,
      efficiencyUnitLabel,
      priceUnitLabel,
      (value) => money.format(value),
    );
  }, [ready, estimate, input, tw, distanceUnitLabel, efficiencyUnitLabel, priceUnitLabel, money]);

  const handleCopy = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setDistance(DEFAULTS.distance);
    setDistanceUnit(DEFAULTS.distanceUnit);
    setEfficiencyUnit(DEFAULTS.efficiencyUnit);
    setEfficiency(DEFAULTS.efficiency);
    setPrice(DEFAULTS.price);
    setRoundTrip(DEFAULTS.roundTrip);
    setSplit(DEFAULTS.split);
  };
  const handleReset = () => {
    setDistance("");
    setDistanceUnit("km");
    setEfficiencyUnit("lp100");
    setEfficiency("");
    setPrice("");
    setRoundTrip(false);
    setSplit("");
  };

  return (
    <ToolShell
      title={tw("fuel-cost-calculator.title")}
      icon="Fuel"
      sampleLabel={tw("fuel-cost-calculator.trySample")}
      resetLabel={tw("fuel-cost-calculator.reset")}
      privacyLabel={tw("fuel-cost-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane id="tp-fuel-cost-input-title" title={tw("fuel-cost-calculator.inputTitle")} hint={tw("fuel-cost-calculator.inputHint")}>
          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("fuel-cost-calculator.tripSection")}</span>
            <SegmentedControl<DistanceUnit> label={tw("fuel-cost-calculator.distanceUnitLabel")} value={distanceUnit} options={distanceOptions} onChange={setDistanceUnit} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolField label={tw("fuel-cost-calculator.distanceLabel")} htmlFor="tp-fuel-distance" hint={tw("fuel-cost-calculator.distanceHint")}>
                <NumberStepper id="tp-fuel-distance" value={distance} min={0} step={10} inputMode="decimal" ariaLabel={tw("fuel-cost-calculator.distanceLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setDistance} />
              </ToolField>
              <ToolField label={tw("fuel-cost-calculator.splitLabel")} htmlFor="tp-fuel-split" hint={tw("fuel-cost-calculator.splitHint")}>
                <NumberStepper id="tp-fuel-split" value={split} min={1} step={1} inputMode="numeric" ariaLabel={tw("fuel-cost-calculator.splitLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setSplit} />
              </ToolField>
            </div>
            <CheckboxRow id="tp-fuel-round-trip" label={tw("fuel-cost-calculator.roundTripLabel")} checked={roundTrip} onChange={setRoundTrip} />
            <p className="tp-tool-hint">{tw("fuel-cost-calculator.roundTripHint")}</p>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("fuel-cost-calculator.vehicleSection")}</span>
            <SegmentedControl<EfficiencyUnit> label={tw("fuel-cost-calculator.efficiencyUnitLabel")} value={efficiencyUnit} options={efficiencyOptions} onChange={setEfficiencyUnit} />
            <ToolField label={tw("fuel-cost-calculator.efficiencyLabel")} htmlFor="tp-fuel-efficiency" hint={tw("fuel-cost-calculator.efficiencyHint")}>
              <NumberStepper id="tp-fuel-efficiency" value={efficiency} min={0} step={0.5} inputMode="decimal" ariaLabel={tw("fuel-cost-calculator.efficiencyLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setEfficiency} />
            </ToolField>
            <p className="tp-tool-hint">{tw("fuel-cost-calculator.efficiencyUnitHint")}</p>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("fuel-cost-calculator.costSection")}</span>
            <ToolField label={tw("fuel-cost-calculator.priceLabel")} htmlFor="tp-fuel-price" hint={`${tw("fuel-cost-calculator.priceHint")} ${priceUnitLabel}`}>
              <NumberStepper id="tp-fuel-price" value={price} min={0} step={0.05} inputMode="decimal" ariaLabel={`${tw("fuel-cost-calculator.priceLabel")} ${priceUnitLabel}`} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setPrice} />
            </ToolField>
          </div>

          {errorText ? <p id={ERROR_ID} className="tp-tool-error" role="alert">{errorText}</p> : null}
        </ToolPane>
      }
      result={
        <ToolPane id="tp-fuel-cost-result-title" title={t("result")} hint={tw("fuel-cost-calculator.resultHint")} result actions={<CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />}>
          {!ready || !estimate ? (
            <div aria-live="polite">
              <ToolEmpty icon={<FuelIcon aria-hidden="true" />} title={errorText ? tw("fuel-cost-calculator.errorTitle") : tw("fuel-cost-calculator.emptyTitle")} hint={errorText || tw("fuel-cost-calculator.emptyHint")} />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue label={tw("fuel-cost-calculator.costLabel")} value={money.format(estimate.cost)} note={`${tw("fuel-cost-calculator.fuelLitersLabel")}: ${volume.format(estimate.litersNeeded)} L`} />
              <dl className="tp-tool-stats">
                <Stat label={tw("fuel-cost-calculator.fuelGallonsLabel")} value={`${volume.format(estimate.gallonsNeeded)} gal`} />
                <Stat label={tw("fuel-cost-calculator.costPerPersonLabel")} value={money.format(estimate.costPerPerson)} />
                <Stat label={tw("fuel-cost-calculator.costPerKmLabel")} value={money.format(estimate.costPerKm)} />
              </dl>
              {estimate.roundTrip ? <p className="tp-tool-hint">{tw("fuel-cost-calculator.roundTripNote")}</p> : null}
              <p className="tp-tool-hint">{tw("fuel-cost-calculator.reportNote")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
