"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  NumberStepper,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolField,
  selectClassName,
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
type ClockFormat = "12" | "24";

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

function ZoneCombobox({
  id,
  label,
  value,
  options,
  placeholder,
  emptyLabel,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  emptyLabel: string;
  onChange: (zone: string) => void;
}) {
  const tw = useTranslations("tools");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  const labelFor = (zone: string) => tw(ZONE_LABEL_KEYS[zone] ?? "timezone-converter.zoneUtc");
  const filtered = options.filter((zone) => {
    const needle = query.trim().toLowerCase();
    return needle === ""
      || labelFor(zone).toLowerCase().includes(needle)
      || zone.toLowerCase().includes(needle);
  });

  const pick = (zone: string) => {
    onChange(zone);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="tp-tool-group tp-tool-group--flush" ref={rootRef}>
      <label htmlFor={id} className="text-sm font-medium text-[var(--text)]">{label}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-label={label}
        autoComplete="off"
        className={selectClassName}
        value={open ? query : (value ? labelFor(value) : "")}
        placeholder={placeholder}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          const first = filtered[0];
          if (event.key === "Enter" && first) {
            event.preventDefault();
            pick(first);
          }
        }}
      />
      {open ? (
        <div
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="flex max-h-44 flex-col gap-1 overflow-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-1"
        >
          {filtered.length === 0 ? (
            <p className="tp-tool-hint" style={{ padding: "6px 8px", margin: 0 }}>{emptyLabel}</p>
          ) : filtered.map((zone) => (
            <button
              key={zone}
              type="button"
              role="option"
              aria-selected={zone === value}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-start text-xs text-[var(--text)] hover:bg-[var(--accent-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              onClick={() => pick(zone)}
            >
              <span>{labelFor(zone)}</span>
              <span className="tp-tool-hint" dir="ltr">{zone}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatClock(timeLabel: string, format: ClockFormat): string {
  if (format === "24" || !timeLabel.includes(":")) return timeLabel;
  const [rawHour, minute] = timeLabel.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour) || !minute) return timeLabel;
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

export default function TimezoneConverter() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [clockFormat, setClockFormat] = useState<ClockFormat>("24");
  const [addingTarget, setAddingTarget] = useState(false);
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

  const offsetText = useCallback(
    (hours: number) => hours === 0
      ? tw("timezone-converter.offsetSame")
      : hours > 0
        ? tw("timezone-converter.offsetAhead", { hours })
        : tw("timezone-converter.offsetBehind", { hours: Math.abs(hours) }),
    [tw],
  );

  const shiftLabel = (hours: number) => hours === 0
    ? tw("timezone-converter.shiftNone")
    : tw("timezone-converter.shiftLabel", { hours: hours > 0 ? `+${hours}` : String(hours) });

  const zoneLabel = useCallback(
    (zone: string) => tw(ZONE_LABEL_KEYS[zone] ?? "timezone-converter.zoneUtc"),
    [tw],
  );

  const reportText = useMemo(() => {
    if (!ready) return "";
    return [
      tw("timezone-converter.reportTitle"),
      `${tw("timezone-converter.baseLabel")}: ${conversion.baseDate} ${conversion.baseTime} ${zoneLabel(options.baseZone)}`,
      "",
      ...conversion.zones.map((zone) =>
        `${zoneLabel(zone.zone)}: ${zone.dateLabel} ${formatClock(zone.timeLabel, clockFormat)} (${offsetText(zone.offsetHours)})`,
      ),
    ].join("\n");
  }, [ready, conversion, options.baseZone, clockFormat, offsetText, tw, zoneLabel]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const handleNow = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    setDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  const handleReset = () => {
    setDate("");
    setTime("");
    setClockFormat("24");
    setAddingTarget(false);
    resetOptions();
  };

  const addTargetZone = (zone: string) => {
    if (!options.selectedZones.includes(zone)) {
      update({ selectedZones: [...options.selectedZones, zone] });
    }
    setAddingTarget(false);
  };

  const removeTargetZone = (zone: string) => {
    update({ selectedZones: options.selectedZones.filter((item) => item !== zone) });
  };

  const availableZones = TIME_ZONES.filter((zone) => !options.selectedZones.includes(zone));
  const formatOptions: { value: ClockFormat; label: string }[] = [
    { value: "12", label: tw("timezone-converter.format12") },
    { value: "24", label: tw("timezone-converter.format24") },
  ];

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Clock" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("timezone-converter.title")}</span>
            <span className="tp-tool-subtitle">{tw("timezone-converter.subtitle")}</span>
          </span>
        </div>
        <ToolBadge tone="accent">
          {tw("timezone-converter.zoneCountBadge", { count: options.selectedZones.length })}
        </ToolBadge>
      </div>

      {errorText ? (
        <p id={ERROR_ID} className="tp-tool-notice" data-tone="danger" role="alert" aria-live="polite">
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-12"
          aria-labelledby="tp-timezone-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-timezone-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("timezone-converter.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("timezone-converter.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleNow}>
                {tw("timezone-converter.resetToNow")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("timezone-converter.dateLabel")} htmlFor="tp-timezone-date">
              <input
                id="tp-timezone-date"
                type="date"
                className={selectClassName}
                value={date}
                aria-describedby={describedBy}
                onChange={(event) => setDate(event.target.value)}
              />
            </ToolField>
            <ToolField label={tw("timezone-converter.timeLabel")} htmlFor="tp-timezone-time">
              <input
                id="tp-timezone-time"
                type="time"
                className={selectClassName}
                value={time}
                aria-describedby={describedBy}
                onChange={(event) => setTime(event.target.value)}
              />
            </ToolField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ZoneCombobox
              id="tp-timezone-base"
              label={tw("timezone-converter.baseZoneLabel")}
              value={options.baseZone}
              options={TIME_ZONES}
              placeholder={tw("timezone-converter.searchPlaceholder")}
              emptyLabel={tw("timezone-converter.noZoneResults")}
              onChange={(zone) => update({ baseZone: zone })}
            />
            <div className="flex flex-col gap-3">
              <details className="tp-tool-group tp-tool-group--flush">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                  {tw("timezone-converter.advancedTitle")}
                </summary>
                <div className="mt-3 flex flex-col gap-3">
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
              </details>
            </div>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-12"
          aria-labelledby="tp-timezone-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-timezone-result-title" className="text-sm font-semibold text-[var(--text)]">
                {t("result")}
              </h3>
              <p className="tp-tool-hint">{tw("timezone-converter.resultHint")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl<ClockFormat>
                label={tw("timezone-converter.formatLabel")}
                value={clockFormat}
                options={formatOptions}
                onChange={setClockFormat}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={availableZones.length === 0}
                onClick={() => setAddingTarget((previous) => !previous)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("timezone-converter.addZone")}
              </Button>
              <CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={reportText || null}
                fileName={tw("timezone-converter.downloadFileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {addingTarget ? (
            <ZoneCombobox
              id="tp-timezone-add-zone"
              label={tw("timezone-converter.addZone")}
              value=""
              options={availableZones}
              placeholder={tw("timezone-converter.searchPlaceholder")}
              emptyLabel={tw("timezone-converter.noZoneResults")}
              onChange={addTargetZone}
            />
          ) : null}

          {ready ? (
            <div
              className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
              aria-live="polite"
            >
              {conversion.zones.map((zone) => {
                const hour = Number(zone.timeLabel.split(":")[0]);
                const isDay = hour >= 6 && hour < 18;
                return (
                  <div
                    key={zone.zone}
                    className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3"
                  >
                    <div className="tp-industrial-bar">
                      <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                        {isDay
                          ? <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                          : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
                        {zoneLabel(zone.zone)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tw("timezone-converter.removeZone", { zone: zoneLabel(zone.zone) })}
                        onClick={() => removeTargetZone(zone.zone)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                    <output dir="ltr" className="font-mono text-base font-semibold text-[var(--text)]">
                      {formatClock(zone.timeLabel, clockFormat)}
                    </output>
                    <span className="tp-tool-hint" dir="ltr">{zone.dateLabel}</span>
                    <div className="tp-industrial-bar">
                      <ToolBadge tone={zone.offsetHours > 0 ? "accent" : zone.offsetHours < 0 ? "warning" : "success"}>
                        {offsetText(zone.offsetHours)}
                      </ToolBadge>
                      <CopyButton
                        text={formatClock(zone.timeLabel, clockFormat)}
                        label={tw("timezone-converter.copyTime")}
                        copiedLabel={t("copied")}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Clock" />}
                title={tw("timezone-converter.emptyTitle")}
                hint={tw("timezone-converter.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("timezone-converter.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
