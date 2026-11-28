"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  HeroValue,
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
  calculateGpa,
  GRADES,
  MAX_CREDITS_PER_COURSE,
  WEIGHTS,
  type CourseRow,
  type GpaErrorCode,
  type GpaScale,
  type Grade,
  type CourseWeight,
} from "./gpa-calculator.logic";

const ERROR_ID = "tp-gpa-error";

const WEIGHT_LABEL_KEYS: Record<CourseWeight, string> = {
  standard: "gpa-calculator.weightStandard",
  honors: "gpa-calculator.weightHonors",
  ap: "gpa-calculator.weightAp",
};

type ScaleChoice = "4" | "5";

interface GpaOptions {
  scale: GpaScale;
  weighted: boolean;
}

function blankRow(id: string): CourseRow {
  return { id, name: "", credits: "", grade: "A", weight: "standard" };
}

export default function GpaCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const counter = useRef(0);

  const [rows, setRows] = useState<CourseRow[]>(() => [blankRow("row-initial")]);
  const [priorGpa, setPriorGpa] = useState("");
  const [priorCredits, setPriorCredits] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<GpaOptions>(
    "toolpika:gpa-calculator",
    { scale: 4, weighted: false },
  );

  const calculation = useMemo(
    () => calculateGpa({
      courses: rows,
      priorGpa,
      priorCredits,
      weighted: options.weighted,
      scale: options.scale,
    }),
    [rows, priorGpa, priorCredits, options],
  );

  const errorText = (() => {
    const code: GpaErrorCode | undefined = calculation.error?.code;
    switch (code) {
      case "NO_COURSES":
        return `${tw("gpa-calculator.errorNoCourses")} ${tw("gpa-calculator.fixNoCourses")}`;
      case "EMPTY_CREDITS":
        return `${tw("gpa-calculator.errorEmptyCredits")} ${tw("gpa-calculator.fixCredits")}`;
      case "INVALID_CREDITS":
        return `${tw("gpa-calculator.errorInvalidCredits")} ${tw("gpa-calculator.fixCredits")}`;
      case "CREDITS_OUT_OF_RANGE":
        return `${tw("gpa-calculator.errorCreditsRange", { max: MAX_CREDITS_PER_COURSE })} ${tw("gpa-calculator.fixCredits")}`;
      case "INVALID_GRADE":
        return `${tw("gpa-calculator.errorGrade")} ${tw("gpa-calculator.fixGrade")}`;
      case "INVALID_PRIOR_GPA":
        return `${tw("gpa-calculator.errorPriorGpaScale", { max: options.scale })} ${tw("gpa-calculator.fixPrior")}`;
      case "INVALID_PRIOR_CREDITS":
        return `${tw("gpa-calculator.errorPriorCredits")} ${tw("gpa-calculator.fixPrior")}`;
      case "PRIOR_PAIR_INCOMPLETE":
        return `${tw("gpa-calculator.errorPriorPair")} ${tw("gpa-calculator.fixPrior")}`;
      default:
        return "";
    }
  })();

  const describedBy = errorText ? ERROR_ID : undefined;
  const ready = !errorText && calculation.semesterGpa !== null;

  const nf = useMemo(
    () => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );
  const scaleLabel = tw("gpa-calculator.scaleLabel", { max: options.scale });

  const reportText = useMemo(() => {
    if (!ready) return "";
    return [
      tw("gpa-calculator.reportTitle"),
      `${tw("gpa-calculator.semesterLabel")}: ${nf.format(calculation.semesterGpa ?? 0)}`,
      `${tw("gpa-calculator.cumulativeLabel")}: ${nf.format(calculation.cumulativeGpa ?? 0)}`,
      `${tw("gpa-calculator.creditsLabel")}: ${calculation.totalCredits}`,
      `${tw("gpa-calculator.pointsLabel")}: ${nf.format(calculation.qualityPoints)}`,
      scaleLabel,
      options.weighted ? tw("gpa-calculator.weightedOn") : tw("gpa-calculator.weightedOff"),
    ].join("\n");
  }, [ready, calculation, nf, options.weighted, scaleLabel, tw]);

  const handleCopyShortcut = useCallback(() => {
    if (reportText) void navigator.clipboard.writeText(reportText).catch(() => {});
  }, [reportText]);
  useCopyShortcut(handleCopyShortcut);

  const updateRow = (id: string, patch: Partial<CourseRow>) => {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    counter.current += 1;
    setRows((previous) => [...previous, blankRow(`new-${counter.current}`)]);
  };

  const removeRow = (id: string) => {
    setRows((previous) => previous.filter((row) => row.id !== id));
  };

  const handleSample = () => {
    setRows([
      { id: "sample-1", name: "Algebra", credits: "4", grade: "A", weight: "standard" },
      { id: "sample-2", name: "Biology", credits: "3", grade: "B+", weight: "honors" },
      { id: "sample-3", name: "History", credits: "3", grade: "A-", weight: "standard" },
      { id: "sample-4", name: "Physics", credits: "4", grade: "B", weight: "ap" },
    ]);
    setPriorGpa("3.4");
    setPriorCredits("32");
    update({ scale: 4, weighted: false });
  };

  const handleReset = () => {
    counter.current += 1;
    setRows([blankRow(`new-${counter.current}`)]);
    setPriorGpa("");
    setPriorCredits("");
    resetOptions();
  };

  const stepperProps = {
    min: 0,
    step: 1,
    inputMode: "decimal" as const,
    increaseLabel: t("stepUp"),
    decreaseLabel: t("stepDown"),
    describedBy,
  };

  const scaleOptions: { value: ScaleChoice; label: string }[] = [
    { value: "4", label: tw("gpa-calculator.scaleLabel", { max: 4 }) },
    { value: "5", label: tw("gpa-calculator.scaleLabel", { max: 5 }) },
  ];

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="GraduationCap" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("gpa-calculator.title")}</span>
            <span className="tp-tool-subtitle">{tw("gpa-calculator.subtitle")}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl<ScaleChoice>
            label={tw("gpa-calculator.scaleTitle")}
            value={String(options.scale) as ScaleChoice}
            options={scaleOptions}
            onChange={(value) => update({ scale: Number(value) as GpaScale })}
          />
          <ToolBadge tone="accent">{scaleLabel}</ToolBadge>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="default" size="sm" onClick={handleSample}>
            {tw("gpa-calculator.trySample")}
          </Button>
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-7"
          aria-labelledby="tp-gpa-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-gpa-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("gpa-calculator.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("gpa-calculator.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="flex flex-wrap items-end gap-2 rounded-[10px] border-b border-[var(--border)] pb-2"
              >
                <div className="min-w-[140px] flex-1">
                  <ToolField
                    label={tw("gpa-calculator.courseLabel", { index: index + 1 })}
                    htmlFor={`tp-gpa-name-${row.id}`}
                  >
                    <input
                      id={`tp-gpa-name-${row.id}`}
                      className={selectClassName}
                      type="text"
                      value={row.name}
                      placeholder={tw("gpa-calculator.courseNamePlaceholder")}
                      aria-describedby={describedBy}
                      onChange={(event) => updateRow(row.id, { name: event.target.value })}
                      autoComplete="off"
                    />
                  </ToolField>
                </div>
                <div className="w-[92px]">
                  <ToolField
                    label={tw("gpa-calculator.creditsLabel")}
                    htmlFor={`tp-gpa-credits-${row.id}`}
                  >
                    <NumberStepper
                      id={`tp-gpa-credits-${row.id}`}
                      value={row.credits}
                      ariaLabel={`${tw("gpa-calculator.creditsLabel")} ${tw("gpa-calculator.courseLabel", { index: index + 1 })}`}
                      onValueChange={(value) => updateRow(row.id, { credits: value })}
                      {...stepperProps}
                    />
                  </ToolField>
                </div>
                <div className="w-[88px]">
                  <ToolField label={tw("gpa-calculator.gradeLabel")} htmlFor={`tp-gpa-grade-${row.id}`}>
                    <select
                      id={`tp-gpa-grade-${row.id}`}
                      className={selectClassName}
                      value={row.grade}
                      aria-describedby={describedBy}
                      onChange={(event) => updateRow(row.id, { grade: event.target.value as Grade })}
                    >
                      {GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                  </ToolField>
                </div>
                {options.weighted ? (
                  <div className="w-[128px]">
                    <ToolField label={tw("gpa-calculator.weightLabel")} htmlFor={`tp-gpa-weight-${row.id}`}>
                      <select
                        id={`tp-gpa-weight-${row.id}`}
                        className={selectClassName}
                        value={row.weight}
                        onChange={(event) => updateRow(row.id, { weight: event.target.value as CourseWeight })}
                      >
                        {WEIGHTS.map((weight) => (
                          <option key={weight} value={weight}>
                            {tw(WEIGHT_LABEL_KEYS[weight])}
                          </option>
                        ))}
                      </select>
                    </ToolField>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={rows.length === 1}
                  aria-label={tw("gpa-calculator.removeCourse", { index: index + 1 })}
                  onClick={() => removeRow(row.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("gpa-calculator.addCourse")}
          </Button>

          <details className="tp-tool-group tp-tool-group--flush">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
              {tw("gpa-calculator.advancedTitle")}
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ToolField
                label={tw("gpa-calculator.priorGpaLabel")}
                htmlFor="tp-gpa-prior-gpa"
                hint={tw("gpa-calculator.priorHint")}
              >
                <NumberStepper
                  id="tp-gpa-prior-gpa"
                  value={priorGpa}
                  ariaLabel={tw("gpa-calculator.priorGpaLabel")}
                  onValueChange={setPriorGpa}
                  {...stepperProps}
                />
              </ToolField>
              <ToolField
                label={tw("gpa-calculator.priorCreditsLabel")}
                htmlFor="tp-gpa-prior-credits"
                hint={tw("gpa-calculator.priorHint")}
              >
                <NumberStepper
                  id="tp-gpa-prior-credits"
                  value={priorCredits}
                  ariaLabel={tw("gpa-calculator.priorCreditsLabel")}
                  onValueChange={setPriorCredits}
                  {...stepperProps}
                />
              </ToolField>
            </div>
            <div className="mt-3 flex flex-col gap-1">
              <CheckboxRow
                id="tp-gpa-weighted"
                label={tw("gpa-calculator.weightedLabel")}
                checked={options.weighted}
                onChange={(checked) => update({ weighted: checked })}
              />
              <p className="tp-tool-hint">{tw("gpa-calculator.weightedHint")}</p>
            </div>
          </details>

          {errorText ? (
            <p id={ERROR_ID} className="tp-tool-notice" data-tone="danger" role="alert" aria-live="polite">
              {errorText}
            </p>
          ) : null}
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 self-start overflow-auto lg:col-span-5 lg:sticky lg:top-4"
          aria-labelledby="tp-gpa-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-gpa-result-title" className="text-sm font-semibold text-[var(--text)]">
                {t("result")}
              </h3>
              <p className="tp-tool-hint">{tw("gpa-calculator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={reportText} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={reportText || null}
                fileName={tw("gpa-calculator.downloadFileName")}
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {ready ? (
            <div className="flex flex-col gap-3" aria-live="polite">
              <HeroValue
                label={tw("gpa-calculator.semesterLabel")}
                value={nf.format(calculation.semesterGpa ?? 0)}
                note={tw("gpa-calculator.heroNote")}
              />
              <div className="flex flex-wrap gap-2">
                <div className="tp-meta-pill">
                  <span>{tw("gpa-calculator.creditsLabel")}</span>
                  <strong dir="ltr">{calculation.totalCredits}</strong>
                </div>
                <div className="tp-meta-pill">
                  <span>{tw("gpa-calculator.pointsLabel")}</span>
                  <strong dir="ltr">{nf.format(calculation.qualityPoints)}</strong>
                </div>
                <div className="tp-meta-pill">
                  <span>{tw("gpa-calculator.cumulativeLabel")}</span>
                  <strong dir="ltr">{nf.format(calculation.cumulativeGpa ?? 0)}</strong>
                </div>
              </div>
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("gpa-calculator.formulaTitle")}</span>
                <div className="tp-output-viewer whitespace-pre-line" role="region" aria-label={tw("gpa-calculator.formulaTitle")}>
                  <code dir="ltr">{tw("gpa-calculator.formula")}</code>
                </div>
                <p className="tp-tool-hint">
                  {options.weighted ? tw("gpa-calculator.weightedNote") : tw("gpa-calculator.standardNote")}
                </p>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="GraduationCap" />}
                title={errorText ? tw("gpa-calculator.errorTitle") : tw("gpa-calculator.emptyTitle")}
                hint={errorText ? tw("gpa-calculator.errorEmptyHint") : tw("gpa-calculator.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("gpa-calculator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
