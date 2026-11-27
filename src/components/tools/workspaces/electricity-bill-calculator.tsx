"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  CurrencyPicker,
  HeroValue,
  NumberStepper,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  calculateElectricityBill,
  formatEstimateReport,
  DEFAULT_DAYS_PER_MONTH,
  MAX_APPLIANCES,
  type ApplianceInput,
  type ElectricityBillInput,
  type ElectricityErrorCode,
  type WattageUnit,
} from "./electricity-bill-calculator.logic";

const ERROR_ID = "electricity-bill-calculator-error";
const SAMPLE: ApplianceInput[] = [
  { id: "sample-heater", name: "Heater", power: "2000", hours: "4", days: "" },
  { id: "sample-laptop", name: "Laptop", power: "100", hours: "6", days: "" },
  { id: "sample-fridge", name: "Refrigerator", power: "150", hours: "24", days: "" },
];
const EMPTY_DRAFT: ApplianceInput = { id: "draft", name: "", power: "", hours: "", days: "" };

export default function ElectricityBillCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const nextId = useRef(1);

  const { options, update, reset: resetOptions } = usePersistedOptions<{
    wattageUnit: WattageUnit;
    currency: string;
  }>("toolpika:electricity-bill-calculator", { wattageUnit: "W", currency: "USD" });

  const [rows, setRows] = useState<ApplianceInput[]>([]);
  const [draft, setDraft] = useState<ApplianceInput>({ ...EMPTY_DRAFT });
  const [daysPerMonth, setDaysPerMonth] = useState(DEFAULT_DAYS_PER_MONTH);
  const [rate, setRate] = useState("");

  const input = useMemo<ElectricityBillInput>(
    () => ({ appliances: rows, wattageUnit: options.wattageUnit, daysPerMonth, rate, currency: options.currency }),
    [rows, options.wattageUnit, options.currency, daysPerMonth, rate],
  );
  const calculation = useMemo(() => calculateElectricityBill(input), [input]);
  const value = calculation.value;

  const numberFmt = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );
  const moneyFmt = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );
  const money = useCallback(
    (amount: number) => `${options.currency} ${moneyFmt.format(amount)}`,
    [options.currency, moneyFmt],
  );

  const errorCode: ElectricityErrorCode | undefined = calculation.error?.code;
  const errorText =
    errorCode === "NO_APPLIANCES"
      ? `${tw("electricity-bill-calculator.errorEmpty")} ${tw("electricity-bill-calculator.fixEmpty")}`
      : errorCode === "MISSING_POWER" || errorCode === "MISSING_HOURS" || errorCode === "MISSING_RATE"
        ? `${tw("electricity-bill-calculator.errorMissing")} ${tw("electricity-bill-calculator.fixMissing")}`
        : errorCode === "INVALID_POWER"
          ? `${tw("electricity-bill-calculator.errorPower")} ${tw("electricity-bill-calculator.fixPower")}`
          : errorCode === "INVALID_HOURS"
            ? `${tw("electricity-bill-calculator.errorHours")} ${tw("electricity-bill-calculator.fixHours")}`
            : errorCode === "INVALID_DAYS"
              ? `${tw("electricity-bill-calculator.errorDays")} ${tw("electricity-bill-calculator.fixDays")}`
              : errorCode === "INVALID_RATE"
                ? `${tw("electricity-bill-calculator.errorRate")} ${tw("electricity-bill-calculator.fixRate")}`
                : "";
  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = Boolean(value && !errorText);

  const reportText = useMemo(() => {
    if (!ready || !value) return "";
    return formatEstimateReport(
      value,
      {
        title: tw("electricity-bill-calculator.reportTitle"),
        rate: tw("electricity-bill-calculator.rateLabel"),
        days: tw("electricity-bill-calculator.daysMonthLabel"),
        unit: tw("electricity-bill-calculator.unitKwh"),
        breakdown: tw("electricity-bill-calculator.breakdownTitle"),
        daily: tw("electricity-bill-calculator.dailyKwhLabel"),
        monthly: tw("electricity-bill-calculator.monthlyKwhLabel"),
        yearly: tw("electricity-bill-calculator.yearlyKwhLabel"),
        genericName: tw("electricity-bill-calculator.applianceDefault"),
        note: tw("electricity-bill-calculator.note"),
      },
      { number: (amount) => numberFmt.format(amount), money },
    );
  }, [ready, value, tw, numberFmt, money]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const updateDraft = (patch: Partial<ApplianceInput>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
  };
  const addDraft = () => {
    if (rows.length >= MAX_APPLIANCES || !draft.name.trim()) return;
    setRows((previous) => [...previous, { ...draft, id: `row-${nextId.current++}` }]);
    setDraft({ ...EMPTY_DRAFT });
  };
  const removeRow = (id: string) => {
    setRows((previous) => previous.filter((row) => row.id !== id));
  };

  const handleSample = () => {
    setRows(SAMPLE.map((row) => ({ ...row })));
    setDraft({ ...EMPTY_DRAFT });
    setDaysPerMonth(DEFAULT_DAYS_PER_MONTH);
    setRate("0.25");
    update({ wattageUnit: "W", currency: "USD" });
  };
  const handleReset = () => {
    setRows([]);
    setDraft({ ...EMPTY_DRAFT });
    setDaysPerMonth(DEFAULT_DAYS_PER_MONTH);
    setRate("");
    resetOptions();
  };

  return (
    <ToolShell
      title={tw("electricity-bill-calculator.title")}
      icon="Zap"
      sampleLabel={tw("electricity-bill-calculator.trySample")}
      resetLabel={tw("electricity-bill-calculator.reset")}
      privacyLabel={tw("electricity-bill-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-electricity-input-title"
          title={tw("electricity-bill-calculator.inputTitle")}
          hint={tw("electricity-bill-calculator.inputHint")}
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("electricity-bill-calculator.settingsTitle")}</span>
            <SegmentedControl<WattageUnit>
              label={tw("electricity-bill-calculator.wattageLabel")}
              value={options.wattageUnit}
              options={[
                { value: "W", label: tw("electricity-bill-calculator.wattageW") },
                { value: "kW", label: tw("electricity-bill-calculator.wattageKw") },
              ]}
              onChange={(next) => update({ wattageUnit: next })}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolField label={tw("electricity-bill-calculator.daysMonthLabel")} htmlFor="tp-electricity-days" hint={tw("electricity-bill-calculator.daysMonthHint")}>
                <NumberStepper id="tp-electricity-days" value={daysPerMonth} min={1} max={31} step={1} ariaLabel={tw("electricity-bill-calculator.daysMonthLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setDaysPerMonth} />
              </ToolField>
              <ToolField label={tw("electricity-bill-calculator.rateLabel")} htmlFor="tp-electricity-rate" hint={tw("electricity-bill-calculator.rateHint")}>
                <NumberStepper id="tp-electricity-rate" value={rate} min={0} step={0.01} inputMode="decimal" ariaLabel={tw("electricity-bill-calculator.rateLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} describedBy={describedBy} onValueChange={setRate} />
              </ToolField>
            </div>
            <CurrencyPicker
              id="tp-electricity-currency"
              label={tw("electricity-bill-calculator.currencyLabel")}
              value={options.currency}
              onChange={(next) => update({ currency: next })}
            />
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("electricity-bill-calculator.applianceListTitle")}</span>
            <p className="tp-tool-hint">{tw("electricity-bill-calculator.maxHint")}</p>
          </div>

          <div className="tp-appliance-draft">
            <span className="tp-tool-group-title">{tw("electricity-bill-calculator.newApplianceTitle")}</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolField label={tw("electricity-bill-calculator.nameLabel")} htmlFor="tp-electricity-draft-name">
                <input
                  id="tp-electricity-draft-name"
                  type="text"
                  className="tp-field-input"
                  value={draft.name}
                  aria-label={tw("electricity-bill-calculator.nameLabel")}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                />
              </ToolField>
              <ToolField label={tw("electricity-bill-calculator.powerLabel")} htmlFor="tp-electricity-draft-power">
                <NumberStepper id="tp-electricity-draft-power" value={draft.power} min={0} step={100} inputMode="decimal" ariaLabel={tw("electricity-bill-calculator.powerLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} onValueChange={(next) => updateDraft({ power: next })} />
              </ToolField>
              <ToolField label={tw("electricity-bill-calculator.hoursLabel")} htmlFor="tp-electricity-draft-hours">
                <NumberStepper id="tp-electricity-draft-hours" value={draft.hours} min={0} max={24} step={0.5} inputMode="decimal" ariaLabel={tw("electricity-bill-calculator.hoursLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} onValueChange={(next) => updateDraft({ hours: next })} />
              </ToolField>
              <ToolField label={tw("electricity-bill-calculator.daysOverrideLabel")} htmlFor="tp-electricity-draft-days" hint={tw("electricity-bill-calculator.daysOverrideHint")}>
                <NumberStepper id="tp-electricity-draft-days" value={draft.days} min={1} max={31} step={1} ariaLabel={tw("electricity-bill-calculator.daysOverrideLabel")} increaseLabel={t("stepUp")} decreaseLabel={t("stepDown")} onValueChange={(next) => updateDraft({ days: next })} />
              </ToolField>
            </div>
            <Button type="button" className="tp-appliance-add" onClick={addDraft} disabled={rows.length >= MAX_APPLIANCES || !draft.name.trim()}>
              {tw("electricity-bill-calculator.addAppliance")}
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="tp-tool-hint">{tw("electricity-bill-calculator.emptyListHint")}</p>
          ) : (
            <div className="tp-tool-list">
              {rows.map((row) => (
                <div className="tp-appliance-row" key={row.id}>
                  <strong>{row.name || tw("electricity-bill-calculator.applianceDefault")}</strong>
                  <button type="button" className="tp-appliance-remove" onClick={() => removeRow(row.id)}>
                    {tw("electricity-bill-calculator.removeAppliance")}
                  </button>
                </div>
              ))}
            </div>
          )}

          {errorText ? <p id={ERROR_ID} className="tp-tool-error" role="alert">{errorText}</p> : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-electricity-result-title"
          title={t("result")}
          result
          actions={<CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />}
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Zap aria-hidden="true" />}
                title={errorText ? tw("electricity-bill-calculator.errorTitle") : tw("electricity-bill-calculator.emptyTitle")}
                hint={errorText ? tw("electricity-bill-calculator.emptyErrorHint") : tw("electricity-bill-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("electricity-bill-calculator.heroLabel")}
                value={money(value.monthlyCost)}
                note={`${tw("electricity-bill-calculator.daysMonthLabel")}: ${daysPerMonth}`}
              />

              <dl className="tp-tool-stats">
                <Stat label={tw("electricity-bill-calculator.dailyKwhLabel")} value={`${numberFmt.format(value.dailyKwh)} ${tw("electricity-bill-calculator.unitKwh")}`} />
                <Stat label={tw("electricity-bill-calculator.monthlyKwhLabel")} value={`${numberFmt.format(value.monthlyKwh)} ${tw("electricity-bill-calculator.unitKwh")}`} />
                <Stat label={tw("electricity-bill-calculator.yearlyKwhLabel")} value={`${numberFmt.format(value.yearlyKwh)} ${tw("electricity-bill-calculator.unitKwh")}`} />
                <Stat label={tw("electricity-bill-calculator.yearlyCostLabel")} value={money(value.yearlyCost)} />
              </dl>

              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-group-title">{tw("electricity-bill-calculator.breakdownTitle")}</span>
                <div className="tp-tool-list">
                  {value.appliances.map((item) => (
                    <div className="tp-tool-row tp-tool-row-plain" key={item.id}>
                      <span>{item.name || tw("electricity-bill-calculator.applianceDefault")}</span>
                      <span className="tp-tool-value" dir="ltr">
                        {`${numberFmt.format(item.monthlyKwh)} ${tw("electricity-bill-calculator.unitKwh")} / ${money(item.monthlyCost)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="tp-tool-hint">{tw("electricity-bill-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
