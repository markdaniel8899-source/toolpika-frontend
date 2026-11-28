"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  HeroValue,
  NumberStepper,
  selectClassName,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  convertTimes,
  MAX_HOUR_SHIFT,
  TIME_ZONES,
  type TimeErrorCode,
} from "./timezone-converter.logic";

const ERROR_ID = "tp-timezone-error";
const QUICK_SHIFTS = [-8, -4, 0, 1, 4, 8] as const;

const ZONE_LABEL_KEYS: Record<string, string> = {
  UTC: "timezone-converter.zoneUtc",
  "America/Los_Angeles": "timezone-converter.zoneLosAngeles",
  "America/New_York": "timezone-converter.zoneNewYork",
  "Europe/London": "timezone-converter.zoneLondon",
  "Europe/Berlin": "timezone-converter.zoneBerlin",
  "Asia/Kolkata": "timezone-converter.zoneKolkata",
  "Asia/Tokyo": "timezone-converter.zoneTokyo",
  "Australia/Sydney": "timezone-converter.zoneSydney",
};

export default function TimezoneConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<{
    baseZone: string;
    selectedZones: string[];
    hourShift: number;
  }>("toolpika:timezone-converter", {
    baseZone: "UTC",
    selectedZones: ["UTC", "America/New_York", "Asia/Tokyo"],
    hourShift: 0,
  });

  const conversion = useMemo(
    () => convertTimes({
      date,
      time,
      baseZone: options.baseZone,
      selectedZones: options.selectedZones,
      hourShift: options.hourShift,
    }, locale),
    [date, time, options, locale],
  );

  const errorText = (() => {
    const code: TimeErrorCode | undefined = conversion.error?.code;
    switch (code) {
      case "EMPTY_DATE":
        return `${tw("timezone-converter.errorEmptyDate")} ${tw("timezone-converter.fixDate")}`;
      case "INVALID_DATE":
        return `${tw("timezone-converter.errorInvalidDate")} ${tw("timezone-converter.fixDate")}`;
      case "INVALID_TIME":
        return `${tw("timezone-converter.errorInvalidTime")} ${tw("timezone-converter.fixTime")}`;
      case "EMPTY_ZONES":
        return `${tw("timezone-converter.errorEmptyZones")} ${tw("timezone-converter.fixZones")}`;
      case "INVALID_BASE_ZONE":
        return `${tw("timezone-converter.errorBaseZone")} ${tw("timezone-converter.fixZones")}`;
      default:
        return "";
    }
  })();

  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = conversion.zones.length > 0 && !errorText;

  const shiftLabel = (hours: number) => hours === 0
    ? tw("timezone-converter.shiftNone")
    : tw("timezone-converter.shiftLabel", { hours: hours > 0 ? `+${hours}` : String(hours) });

  const offsetText = useCallback(
    (hours: number) => hours === 0
      ? tw("timezone-converter.offsetSame")
      : hours > 0
        ? tw("timezone-converter.offsetAhead", { hours })
        : tw("timezone-converter.offsetBehind", { hours: Math.abs(hours) }),
    [tw],
  );

  const reportText = useMemo(() => {
    if (!ready) return "";
    return [
      tw("timezone-converter.reportTitle"),
      `${tw("timezone-converter.baseLabel")}: ${conversion.baseDate} ${conversion.baseTime} ${tw(ZONE_LABEL_KEYS[options.baseZone] ?? "timezone-converter.zoneUtc")}`,
      "",
      ...conversion.zones.map((zone) =>
        `${tw(ZONE_LABEL_KEYS[zone.zone] ?? "timezone-converter.zoneUtc")}: ${zone.dateLabel} ${zone.timeLabel} (${offsetText(zone.offsetHours)})`,
      ),
    ].join("\n");
  }, [ready, conversion, options.baseZone, offsetText, tw]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const toggleZone = (zone: string, checked: boolean) => {
    const next = checked
      ? [...options.selectedZones, zone]
      : options.selectedZones.filter((item) => item !== zone);
    update({ selectedZones: next });
  };

  const handleSample = () => {
    setDate("2026-11-28");
    setTime("09:30");
    update({
      baseZone: "Europe/London",
      selectedZones: ["UTC", "America/New_York", "Asia/Tokyo", "Australia/Sydney"],
      hourShift: 0,
    });
  };

  const handleReset = () => {
    setDate("");
    setTime("");
    resetOptions();
  };

  return (
    <ToolShell
      title={tw("timezone-converter.title")}
      icon="Clock"
      subtitle={tw("timezone-converter.subtitle")}
      sampleLabel={tw("timezone-converter.trySample")}
      resetLabel={tw("timezone-converter.reset")}
      privacyLabel={tw("timezone-converter.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-timezone-input-title"
          title={tw("timezone-converter.inputTitle")}
          hint={tw("timezone-converter.inputHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("timezone-converter.dateLabel")} htmlFor="tp-timezone-date">
              <input
                id="tp-timezone-date"
                type="date"
                className="tp-field-input"
                value={date}
                aria-describedby={describedBy}
                onChange={(event) => setDate(event.target.value)}
              />
            </ToolField>
            <ToolField label={tw("timezone-converter.timeLabel")} htmlFor="tp-timezone-time">
              <input
                id="tp-timezone-time"
                type="time"
                className="tp-field-input"
                value={time}
                aria-describedby={describedBy}
                onChange={(event) => setTime(event.target.value)}
              />
            </ToolField>
            <ToolField label={tw("timezone-converter.baseZoneLabel")} htmlFor="tp-timezone-base">
              <select
                id="tp-timezone-base"
                className={selectClassName}
                value={options.baseZone}
                aria-describedby={describedBy}
                onChange={(event) => update({ baseZone: event.target.value })}
              >
                {TIME_ZONES.map((zone) => (
                  <option key={zone} value={zone}>{tw(ZONE_LABEL_KEYS[zone])}</option>
                ))}
              </select>
            </ToolField>
            <ToolField
              label={tw("timezone-converter.shiftLabelField")}
              htmlFor="tp-timezone-shift"
              hint={tw("timezone-converter.shiftHint")}
            >
              <NumberStepper
                id="tp-timezone-shift"
                value={String(options.hourShift)}
                ariaLabel={tw("timezone-converter.shiftLabelField")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
                describedBy={describedBy}
                min={-MAX_HOUR_SHIFT}
                max={MAX_HOUR_SHIFT}
                onValueChange={(value) => update({ hourShift: value === "" ? 0 : Number(value) })}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("timezone-converter.quickShiftLabel")}</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_SHIFTS.map((hours) => (
                <Button
                  key={hours}
                  type="button"
                  size="sm"
                  variant={options.hourShift === hours ? "default" : "secondary"}
                  onClick={() => update({ hourShift: hours })}
                >
                  {shiftLabel(hours)}
                </Button>
              ))}
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("timezone-converter.zonesLabel")}</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TIME_ZONES.map((zone) => (
                <CheckboxRow
                  key={zone}
                  id={`tp-timezone-zone-${zone}`}
                  label={tw(ZONE_LABEL_KEYS[zone])}
                  checked={options.selectedZones.includes(zone)}
                  onChange={(checked) => toggleZone(zone, checked)}
                />
              ))}
            </div>
            <p className="tp-tool-hint">{tw("timezone-converter.zonesHint")}</p>
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
          id="tp-timezone-result-title"
          title={t("result")}
          hint={tw("timezone-converter.resultHint")}
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
                icon={<Clock aria-hidden="true" />}
                title={errorText ? tw("timezone-converter.errorTitle") : tw("timezone-converter.emptyTitle")}
                hint={errorText ? tw("timezone-converter.errorEmptyHint") : tw("timezone-converter.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("timezone-converter.convertedLabel")}
                value={conversion.zones[0]?.timeLabel ?? ""}
                note={tw("timezone-converter.heroNote")}
              />
              <dl className="tp-tool-stats">
                <Stat label={tw("timezone-converter.dateLabel")} value={conversion.zones[0]?.dateLabel ?? ""} />
                <Stat label={tw("timezone-converter.zoneCountLabel")} value={conversion.zones.length} />
                <Stat label={tw("timezone-converter.shiftLabelField")} value={shiftLabel(options.hourShift)} />
              </dl>
              <ul className="flex flex-col gap-2">
                {conversion.zones.map((zone) => (
                  <li
                    key={zone.zone}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <span className="tp-tool-label">{tw(ZONE_LABEL_KEYS[zone.zone] ?? "timezone-converter.zoneUtc")}</span>
                    <span dir="ltr" className="font-mono text-sm text-[var(--text)]">
                      {zone.dateLabel} · {zone.timeLabel}
                    </span>
                    <span className="tp-tool-hint">{offsetText(zone.offsetHours)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
