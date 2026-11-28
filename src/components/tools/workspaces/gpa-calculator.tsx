"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, Plus, Trash2 } from "lucide-react";
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
  calculateGpa,
  GRADES,
  MAX_CREDITS_PER_COURSE,
  WEIGHTS,
  type CourseRow,
  type Grade,
  type GpaErrorCode,
  type CourseWeight,
} from "./gpa-calculator.logic";

const ERROR_ID = "tp-gpa-error";

const WEIGHT_LABEL_KEYS: Record<CourseWeight, string> = {
  standard: "gpa-calculator.weightStandard",
  honors: "gpa-calculator.weightHonors",
  ap: "gpa-calculator.weightAp",
};

function blankRow(id: string): CourseRow {
  return { id, credits: "", grade: "A", weight: "standard" };
}

export default function GpaCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const locale = useLocale();
  const counter = useRef(0);

  const [rows, setRows] = useState<CourseRow[]>(() => [blankRow("row-initial")]);
  const [priorGpa, setPriorGpa] = useState("");
  const [priorCredits, setPriorCredits] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<{ weighted: boolean }>(
    "toolpika:gpa-calculator",
    { weighted: false },
  );

  const calculation = useMemo(
    () => calculateGpa({
      courses: rows,
      priorGpa,
      priorCredits,
      weighted: options.weighted,
    }),
    [rows, priorGpa, priorCredits, options.weighted],
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
        return `${tw("gpa-calculator.errorPriorGpa")} ${tw("gpa-calculator.fixPrior")}`;
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

  const reportText = useMemo(() => {
    if (!ready) return "";
    return [
      tw("gpa-calculator.reportTitle"),
      `${tw("gpa-calculator.semesterLabel")}: ${nf.format(calculation.semesterGpa ?? 0)}`,
      `${tw("gpa-calculator.cumulativeLabel")}: ${nf.format(calculation.cumulativeGpa ?? 0)}`,
      `${tw("gpa-calculator.creditsLabel")}: ${calculation.totalCredits}`,
      `${tw("gpa-calculator.pointsLabel")}: ${nf.format(calculation.qualityPoints)}`,
      options.weighted ? tw("gpa-calculator.weightedOn") : tw("gpa-calculator.weightedOff"),
    ].join("\n");
  }, [ready, calculation, nf, options.weighted, tw]);

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
      { id: "sample-1", credits: "4", grade: "A", weight: "standard" },
      { id: "sample-2", credits: "3", grade: "B+", weight: "honors" },
      { id: "sample-3", credits: "3", grade: "A-", weight: "standard" },
      { id: "sample-4", credits: "4", grade: "B", weight: "ap" },
    ]);
    setPriorGpa("3.4");
    setPriorCredits("32");
    update({ weighted: false });
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

  return (
    <ToolShell
      title={tw("gpa-calculator.title")}
      icon="GraduationCap"
      subtitle={tw("gpa-calculator.subtitle")}
      sampleLabel={tw("gpa-calculator.trySample")}
      resetLabel={tw("gpa-calculator.reset")}
      privacyLabel={tw("gpa-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-gpa-input-title"
          title={tw("gpa-calculator.inputTitle")}
          hint={tw("gpa-calculator.inputHint")}
        >
          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="tp-tool-label">
                    {tw("gpa-calculator.courseLabel", { index: index + 1 })}
                  </span>
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ToolField
                    label={tw("gpa-calculator.creditsLabel")}
                    htmlFor={`tp-gpa-credits-${row.id}`}
                  >
                    <NumberStepper
                      id={`tp-gpa-credits-${row.id}`}
                      value={row.credits}
                      ariaLabel={tw("gpa-calculator.creditsLabel")}
                      onValueChange={(value) => updateRow(row.id, { credits: value })}
                      {...stepperProps}
                    />
                  </ToolField>
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
                  {options.weighted ? (
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
                  ) : null}
                </div>
              </div>
            ))}

            <Button type="button" variant="secondary" size="sm" onClick={addRow}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("gpa-calculator.addCourse")}
            </Button>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <CheckboxRow
              id="tp-gpa-weighted"
              label={tw("gpa-calculator.weightedLabel")}
              checked={options.weighted}
              onChange={(checked) => update({ weighted: checked })}
            />
            <p className="tp-tool-hint">{tw("gpa-calculator.weightedHint")}</p>

            {errorText ? (
              <p id={ERROR_ID} className="tp-tool-error" role="alert">
                {errorText}
              </p>
            ) : null}
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-gpa-result-title"
          title={t("result")}
          hint={tw("gpa-calculator.resultHint")}
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
                icon={<Calculator aria-hidden="true" />}
                title={errorText ? tw("gpa-calculator.errorTitle") : tw("gpa-calculator.emptyTitle")}
                hint={errorText ? tw("gpa-calculator.errorEmptyHint") : tw("gpa-calculator.emptyHint")}
              />
            </div>
          ) : (
            <div className="tp-tool-result" aria-live="polite">
              <HeroValue
                label={tw("gpa-calculator.semesterLabel")}
                value={nf.format(calculation.semesterGpa ?? 0)}
                note={tw("gpa-calculator.heroNote")}
              />
              <dl className="tp-tool-stats">
                <Stat label={tw("gpa-calculator.cumulativeLabel")} value={nf.format(calculation.cumulativeGpa ?? 0)} />
                <Stat label={tw("gpa-calculator.creditsLabel")} value={calculation.totalCredits} />
                <Stat label={tw("gpa-calculator.pointsLabel")} value={nf.format(calculation.qualityPoints)} />
                <Stat label={tw("gpa-calculator.coursesLabel")} value={calculation.courseCount} />
              </dl>
              <div className="tp-tool-group tp-tool-group--flush">
                <span className="tp-tool-label">{tw("gpa-calculator.formulaTitle")}</span>
                <div className="tp-tool-url whitespace-pre-line">
                  <code dir="ltr">{tw("gpa-calculator.formula")}</code>
                </div>
                <p className="tp-tool-hint">
                  {options.weighted ? tw("gpa-calculator.weightedNote") : tw("gpa-calculator.standardNote")}
                </p>
              </div>
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
