"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceLayout } from "../workspace-layout";
import { OutputEmpty, ToolField, selectClassName } from "../workspace-ui";

type Category = "length" | "weight" | "temperature";

const LENGTH: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const WEIGHT: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

const TEMPERATURE = ["c", "f", "k"] as const;

const DEFAULTS: Record<Category, [string, string]> = {
  length: ["m", "ft"],
  weight: ["kg", "lb"],
  temperature: ["c", "f"],
};

function toCelsius(value: number, unit: string) {
  if (unit === "f") return ((value - 32) * 5) / 9;
  if (unit === "k") return value - 273.15;
  return value;
}

function fromCelsius(value: number, unit: string) {
  if (unit === "f") return (value * 9) / 5 + 32;
  if (unit === "k") return value + 273.15;
  return value;
}

export default function UnitConverter() {
  const t = useTranslations("toolUi");
  const locale = useLocale();
  const [category, setCategory] = useState<Category>("length");
  const [value, setValue] = useState("1");
  const [from, setFrom] = useState(DEFAULTS.length[0]);
  const [to, setTo] = useState(DEFAULTS.length[1]);

  const units = useMemo(() => {
    if (category === "length") return Object.keys(LENGTH);
    if (category === "weight") return Object.keys(WEIGHT);
    return [...TEMPERATURE];
  }, [category]);

  const result = useMemo(() => {
    const numeric = Number(value);
    if (!value.trim() || Number.isNaN(numeric)) return null;

    if (category === "temperature") {
      return fromCelsius(toCelsius(numeric, from), to);
    }

    const table = category === "length" ? LENGTH : WEIGHT;
    if (!table[from] || !table[to]) return null;

    return (numeric * table[from]) / table[to];
  }, [category, value, from, to]);

  const formatted =
    result === null
      ? null
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(result);

  const selectCategory = (next: Category) => {
    setCategory(next);
    setFrom(DEFAULTS[next][0]);
    setTo(DEFAULTS[next][1]);
  };

  return (
    <WorkspaceLayout
      input={
        <div className="flex flex-col gap-5">
          <div
            role="group"
            aria-label={t("value")}
            className="grid grid-cols-3 gap-2"
          >
            {(["length", "weight", "temperature"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={category === item ? "default" : "secondary"}
                aria-pressed={category === item}
                onClick={() => selectCategory(item)}
              >
                {t(item)}
              </Button>
            ))}
          </div>

          <ToolField label={t("value")} htmlFor="unit-value">
            <Input
              id="unit-value"
              type="number"
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </ToolField>

          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <ToolField label={t("from")} htmlFor="unit-from">
              <select
                id="unit-from"
                className={selectClassName}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </ToolField>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label={t("swap")}
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
            >
              <ArrowLeftRight aria-hidden="true" />
            </Button>

            <ToolField label={t("to")} htmlFor="unit-to">
              <select
                id="unit-to"
                className={selectClassName}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </ToolField>
          </div>
        </div>
      }
      output={
        formatted ? (
          <div className="flex h-full flex-col justify-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              {value} {from} = {to}
            </p>
            <output className="break-words font-sans text-[40px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {formatted}
              <span className="ml-2 text-[20px] text-[var(--muted)]">{to}</span>
            </output>
          </div>
        ) : (
          <OutputEmpty message={t("value")} className="min-h-[200px]" />
        )
      }
    />
  );
}
