"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Cake } from "lucide-react";
import {
  CopyButton,
  DatePartsPicker,
  HeroValue,
  Stat,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
} from "@/components/tools/workspace-ui";
import {
  calculateAge,
  formatAgeReport,
  toDateString,
  type AgeErrorCode,
} from "./age-calculator.logic";

const ERROR_ID = "tp-age-error";
const SAMPLE = { birth: "1990-06-15", asOf: "2026-11-27" };

export default function AgeCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [birth, setBirth] = useState("");
  const [asOf, setAsOf] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAsOf(toDateString(new Date())));
    return () => cancelAnimationFrame(frame);
  }, []);

  const input = useMemo(() => ({ birth, asOf }), [birth, asOf]);
  const calculation = useMemo(() => calculateAge(input), [input]);
  const value = calculation.value;

  const errorCode: AgeErrorCode | undefined = calculation.error?.code;
  const errorText =
    errorCode === "MISSING_BIRTH"
      ? `${tw("age-calculator.errorMissing")} ${tw("age-calculator.fixMissing")}`
      : errorCode === "INVALID_BIRTH" || errorCode === "INVALID_AS_OF"
        ? `${tw("age-calculator.errorInvalid")} ${tw("age-calculator.fixInvalid")}`
        : errorCode === "ORDER"
          ? `${tw("age-calculator.errorOrder")} ${tw("age-calculator.fixOrder")}`
          : "";
  const ready = Boolean(value && !errorText);
  const describedBy = errorText ? ERROR_ID : undefined;

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const weekdayFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }),
    [locale],
  );
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    [locale],
  );
  const weekdayOf = useCallback(
    (iso: string) => {
      const [year, month, day] = iso.split("-").map(Number);
      const date = new Date(0);
      date.setUTCFullYear(year, month - 1, day);
      date.setUTCHours(0, 0, 0, 0);
      return weekdayFormat.format(date);
    },
    [weekdayFormat],
  );
  const formatDate = useCallback(
    (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`)),
    [dateFormat],
  );

  const heroText = useMemo(() => {
    if (!value) return "";
    return [
      `${nf.format(value.years)} ${tw("age-calculator.unitYears")}`,
      `${nf.format(value.months)} ${tw("age-calculator.unitMonths")}`,
      `${nf.format(value.days)} ${tw("age-calculator.unitDays")}`,
    ].join(", ");
  }, [value, nf, tw]);

  const reportText = useMemo(() => {
    if (!ready || !value) return "";
    return formatAgeReport(
      input,
      value,
      {
        title: tw("age-calculator.reportTitle"),
        birth: tw("age-calculator.birthLabel"),
        asOf: tw("age-calculator.asOfLabel"),
        age: tw("age-calculator.heroLabel"),
        totalDays: tw("age-calculator.totalDaysLabel"),
        weeks: tw("age-calculator.wholeWeeksLabel"),
        calendarMonths: tw("age-calculator.calendarMonthsLabel"),
        birthWeekday: tw("age-calculator.birthWeekdayLabel"),
        nextBirthday: tw("age-calculator.nextBirthdayLabel"),
        nextBirthdayDays: tw("age-calculator.nextBirthdayDaysLabel"),
        nextBirthdayWeekday: tw("age-calculator.nextBirthdayWeekdayLabel"),
        note: tw("age-calculator.reportNote"),
      },
      {
        age: heroText,
        totalDays: `${nf.format(value.totalDays)} ${tw("age-calculator.unitDays")}`,
        weeks: `${nf.format(value.weeks)} ${tw("age-calculator.unitWeeks")} + ${nf.format(value.weekDays)} ${tw("age-calculator.unitDays")}`,
        calendarMonths: `${nf.format(value.calendarMonths)} ${tw("age-calculator.unitMonths")} + ${nf.format(value.monthDays)} ${tw("age-calculator.unitDays")}`,
        birthWeekday: weekdayOf(birth),
        nextBirthdayDays: nf.format(value.nextBirthdayDays),
        nextBirthdayWeekday: weekdayOf(value.nextBirthday),
      },
    );
  }, [ready, value, input, tw, heroText, nf, weekdayOf, birth]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleSample = () => {
    setBirth(SAMPLE.birth);
    setAsOf(SAMPLE.asOf);
  };
  const handleReset = () => {
    setBirth("");
    setAsOf(toDateString(new Date()));
  };

  return (
    <ToolShell
      title={tw("age-calculator.title")}
      icon="Cake"
      sampleLabel={tw("age-calculator.trySample")}
      resetLabel={tw("age-calculator.reset")}
      privacyLabel={tw("age-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-age-input-title"
          title={tw("age-calculator.inputTitle")}
          hint={tw("age-calculator.inputHint")}
        >
          <DatePartsPicker
            id="tp-age-birth"
            label={tw("age-calculator.birthLabel")}
            value={birth}
            onChange={setBirth}
            locale={locale}
            hint={tw("age-calculator.birthHint")}
            ariaDescribedBy={describedBy}
            minYear={1900}
          />
          <DatePartsPicker
            id="tp-age-as-of"
            label={tw("age-calculator.asOfLabel")}
            value={asOf}
            onChange={setAsOf}
            locale={locale}
            hint={tw("age-calculator.asOfHint")}
            ariaDescribedBy={describedBy}
            todayLabel={t("today")}
            onToday={() => setAsOf(toDateString(new Date()))}
            minYear={1900}
          />
          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert">
              {errorText}
            </p>
          ) : null}
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-age-result-title"
          title={t("result")}
          hint={tw("age-calculator.resultHint")}
          result
          actions={<CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />}
        >
          {!ready || !value ? (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Cake aria-hidden="true" />}
                title={errorText ? tw("age-calculator.errorTitle") : tw("age-calculator.emptyTitle")}
                hint={errorText || tw("age-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("age-calculator.heroLabel")}
                value={heroText}
                note={`${tw("age-calculator.birthLabel")}: ${birth}`}
              />

              <dl className="tp-tool-stats">
                <Stat label={tw("age-calculator.totalDaysLabel")} value={`${nf.format(value.totalDays)} ${tw("age-calculator.unitDays")}`} />
                <Stat
                  label={tw("age-calculator.wholeWeeksLabel")}
                  value={`${nf.format(value.weeks)} ${tw("age-calculator.unitWeekShort")} ${nf.format(value.weekDays)} ${tw("age-calculator.unitDayShort")}`}
                />
                <Stat
                  label={tw("age-calculator.calendarMonthsLabel")}
                  value={`${nf.format(value.calendarMonths)} ${tw("age-calculator.unitMonthShort")} ${nf.format(value.monthDays)} ${tw("age-calculator.unitDayShort")}`}
                />
                <Stat
                  label={tw("age-calculator.nextBirthdayDaysLabel")}
                  value={`${nf.format(value.nextBirthdayDays)} ${tw("age-calculator.unitDays")}`}
                />
              </dl>

              <div className="tp-tool-list">
                <div className="tp-tool-row tp-tool-row-plain">
                  <span>{tw("age-calculator.birthWeekdayLabel")}</span>
                  <span className="tp-tool-value" dir="ltr">{weekdayOf(birth)}</span>
                </div>
                <div className="tp-tool-row tp-tool-row-plain">
                  <span>{tw("age-calculator.nextBirthdayLabel")}</span>
                  <span className="tp-tool-value" dir="ltr">{formatDate(value.nextBirthday)}</span>
                </div>
                <div className="tp-tool-row tp-tool-row-plain">
                  <span>{tw("age-calculator.nextBirthdayWeekdayLabel")}</span>
                  <span className="tp-tool-value" dir="ltr">{weekdayOf(value.nextBirthday)}</span>
                </div>
              </div>

              <p className="tp-tool-hint">{tw("age-calculator.note")}</p>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
