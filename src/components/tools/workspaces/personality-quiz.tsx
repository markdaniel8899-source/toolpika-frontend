"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import {
  ARCHETYPES,
  OPTION_IDS,
  QUESTIONS,
  TOTAL_STEPS,
  initialAnswers,
  isComplete,
  nextStep,
  previousStep,
  recordAnswer,
  scoreAnswers,
  type AnswerId,
  type Archetype,
} from "./personality-quiz.logic";

interface ArchetypeView {
  name: string;
  tagline: string;
  strengths: string[];
  collaboration: string;
  focusTips: string[];
}

const isArrowKey = (key: string) =>
  key === "ArrowRight" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowUp";

export default function PersonalityQuiz() {
  const tw = useTranslations("tools");
  const t = useTranslations("toolUi");

  const [answers, setAnswers] = useState<(AnswerId | null)[]>(initialAnswers);
  const [step, setStep] = useState(0);
  const [activeOption, setActiveOption] = useState(0);
  const [copied, setCopied] = useState(false);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const copiedTimer = useRef<number | null>(null);

  const result = useMemo(() => scoreAnswers(answers), [answers]);
  const complete = step === TOTAL_STEPS && isComplete(answers);
  const question = QUESTIONS[Math.min(step, TOTAL_STEPS - 1)];
  const hasAnswer = step < TOTAL_STEPS && answers[step] !== null;
  const displayedStep = Math.min(step + 1, TOTAL_STEPS);
  const progress = (step / TOTAL_STEPS) * 100;

  const prompts: string[] = [
    tw("personality-quiz.q1Prompt"),
    tw("personality-quiz.q2Prompt"),
    tw("personality-quiz.q3Prompt"),
    tw("personality-quiz.q4Prompt"),
    tw("personality-quiz.q5Prompt"),
    tw("personality-quiz.q6Prompt"),
    tw("personality-quiz.q7Prompt"),
    tw("personality-quiz.q8Prompt"),
  ];

  const optionLabels: Record<string, string> = {
    "q1-a": tw("personality-quiz.q1a"),
    "q1-b": tw("personality-quiz.q1b"),
    "q1-c": tw("personality-quiz.q1c"),
    "q2-a": tw("personality-quiz.q2a"),
    "q2-b": tw("personality-quiz.q2b"),
    "q2-c": tw("personality-quiz.q2c"),
    "q3-a": tw("personality-quiz.q3a"),
    "q3-b": tw("personality-quiz.q3b"),
    "q3-c": tw("personality-quiz.q3c"),
    "q4-a": tw("personality-quiz.q4a"),
    "q4-b": tw("personality-quiz.q4b"),
    "q4-c": tw("personality-quiz.q4c"),
    "q5-a": tw("personality-quiz.q5a"),
    "q5-b": tw("personality-quiz.q5b"),
    "q5-c": tw("personality-quiz.q5c"),
    "q6-a": tw("personality-quiz.q6a"),
    "q6-b": tw("personality-quiz.q6b"),
    "q6-c": tw("personality-quiz.q6c"),
    "q7-a": tw("personality-quiz.q7a"),
    "q7-b": tw("personality-quiz.q7b"),
    "q7-c": tw("personality-quiz.q7c"),
    "q8-a": tw("personality-quiz.q8a"),
    "q8-b": tw("personality-quiz.q8b"),
    "q8-c": tw("personality-quiz.q8c"),
  };

  const archetypeViews: Record<Archetype, ArchetypeView> = {
    architect: {
      name: tw("personality-quiz.architectName"),
      tagline: tw("personality-quiz.architectTagline"),
      strengths: [
        tw("personality-quiz.architectStrengthOne"),
        tw("personality-quiz.architectStrengthTwo"),
        tw("personality-quiz.architectStrengthThree"),
      ],
      collaboration: tw("personality-quiz.architectCollaboration"),
      focusTips: [
        tw("personality-quiz.architectFocusOne"),
        tw("personality-quiz.architectFocusTwo"),
      ],
    },
    catalyst: {
      name: tw("personality-quiz.catalystName"),
      tagline: tw("personality-quiz.catalystTagline"),
      strengths: [
        tw("personality-quiz.catalystStrengthOne"),
        tw("personality-quiz.catalystStrengthTwo"),
        tw("personality-quiz.catalystStrengthThree"),
      ],
      collaboration: tw("personality-quiz.catalystCollaboration"),
      focusTips: [
        tw("personality-quiz.catalystFocusOne"),
        tw("personality-quiz.catalystFocusTwo"),
      ],
    },
    craftsperson: {
      name: tw("personality-quiz.craftspersonName"),
      tagline: tw("personality-quiz.craftspersonTagline"),
      strengths: [
        tw("personality-quiz.craftspersonStrengthOne"),
        tw("personality-quiz.craftspersonStrengthTwo"),
        tw("personality-quiz.craftspersonStrengthThree"),
      ],
      collaboration: tw("personality-quiz.craftspersonCollaboration"),
      focusTips: [
        tw("personality-quiz.craftspersonFocusOne"),
        tw("personality-quiz.craftspersonFocusTwo"),
      ],
    },
    navigator: {
      name: tw("personality-quiz.navigatorName"),
      tagline: tw("personality-quiz.navigatorTagline"),
      strengths: [
        tw("personality-quiz.navigatorStrengthOne"),
        tw("personality-quiz.navigatorStrengthTwo"),
        tw("personality-quiz.navigatorStrengthThree"),
      ],
      collaboration: tw("personality-quiz.navigatorCollaboration"),
      focusTips: [
        tw("personality-quiz.navigatorFocusOne"),
        tw("personality-quiz.navigatorFocusTwo"),
      ],
    },
  };

  useEffect(() => {
    if (!complete) deckRef.current?.focus({ preventScroll: true });
  }, [step, complete]);

  useEffect(() => {
    return () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  const choose = (optionId: AnswerId) => {
    setAnswers((previous) => recordAnswer(previous, Math.min(step, TOTAL_STEPS - 1), optionId));
    setStep((previous) => nextStep(previous));
    setActiveOption(0);
    setCopied(false);
  };

  const goBack = () => {
    setStep((previous) => previousStep(previous));
    setActiveOption(0);
    setCopied(false);
  };

  const restart = () => {
    setAnswers(initialAnswers());
    setStep(0);
    setActiveOption(0);
    setCopied(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (complete) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "BUTTON" && !target.classList.contains("tp-play-card")) return;
    const count = question.options.length;

    if (isArrowKey(event.key)) {
      event.preventDefault();
      const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      setActiveOption((current) => (current + direction + count) % count);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = question.options[activeOption];
      if (option) choose(option.id);
    }
  };

  const view = result ? archetypeViews[result.winner] : archetypeViews[ARCHETYPES[0]];

  const handleCopy = async () => {
    if (!result) return;
    const lines = [
      view.name,
      view.tagline,
      "",
      `${tw("personality-quiz.strengthsTitle")}: ${view.strengths.join(", ")}`,
      `${tw("personality-quiz.collaborationTitle")}: ${view.collaboration}`,
      `${tw("personality-quiz.focusTitle")}: ${view.focusTips.join(" ")}`,
      "",
      tw("personality-quiz.limitNote"),
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="tp-play">
      <div className="tp-play-head">
        <h2 className="tp-play-title">{tw("personality-quiz.title")}</h2>
        <p className="tp-play-sub">{tw("personality-quiz.subtitle")}</p>
      </div>

      <div className="tp-play-toolbar">
        <span className="tp-play-pill tp-play-pill--active">{tw("personality-quiz.playLabel")}</span>
        <span className="tp-play-count">
          {complete
            ? tw("personality-quiz.completeLabel")
            : tw("personality-quiz.stepOf", { current: displayedStep, total: TOTAL_STEPS })}
        </span>
        <button type="button" className="tp-play-btn tp-play-btn--ghost" onClick={restart}>
          {tw("personality-quiz.restart")}
        </button>
      </div>

      <div
        className="tp-play-progress"
        role="progressbar"
        aria-label={tw("personality-quiz.progressLabel")}
        aria-valuemin={0}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={displayedStep}
      >
        <div className="tp-play-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {complete && result ? (
        <div className="tp-play-result" aria-live="polite">
          <span className="tp-play-tag">{tw("personality-quiz.resultBadge")}</span>
          <h3 className="tp-play-winner">{view.name}</h3>
          <p className="tp-play-sub">{view.tagline}</p>

          <section>
            <h4 className="tp-play-title">{tw("personality-quiz.strengthsTitle")}</h4>
            <div className="tp-play-grid">
              {view.strengths.map((strength) => (
                <span className="tp-play-chip" key={strength}>
                  {strength}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h4 className="tp-play-title">{tw("personality-quiz.collaborationTitle")}</h4>
            <p className="tp-play-answer">{view.collaboration}</p>
          </section>

          <section>
            <h4 className="tp-play-title">{tw("personality-quiz.focusTitle")}</h4>
            <ul>
              {view.focusTips.map((tip) => (
                <li className="tp-play-answer" key={tip}>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <p className="tp-play-count">{tw("personality-quiz.limitNote")}</p>

          <div className="tp-play-toolbar">
            <button
              type="button"
              className="tp-play-btn tp-play-btn--primary"
              onClick={handleCopy}
            >
              {copied ? t("copied") : tw("personality-quiz.copyResult")}
            </button>
            <button type="button" className="tp-play-btn tp-play-btn--ghost" onClick={goBack}>
              {tw("personality-quiz.back")}
            </button>
            <button type="button" className="tp-play-btn tp-play-btn--ghost" onClick={restart}>
              {tw("personality-quiz.restart")}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="tp-play-grid"
          ref={deckRef}
          tabIndex={0}
          role="group"
          aria-label={tw("personality-quiz.promptLabel")}
          onKeyDown={handleKeyDown}
        >
          <h3 className="tp-play-title">{prompts[Math.min(step, TOTAL_STEPS - 1)]}</h3>
          <p className="tp-play-sub">{tw("personality-quiz.promptHint")}</p>

          <div className="tp-play-grid">
            {question.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className={`tp-play-card${index === activeOption ? " tp-play-card--active" : ""}`}
                onClick={() => choose(option.id)}
                onMouseEnter={() => setActiveOption(index)}
                onFocus={() => setActiveOption(index)}
              >
                <span className="tp-play-tile" aria-hidden="true">
                  <span className="tp-play-letter">{OPTION_IDS[index]?.toUpperCase()}</span>
                </span>
                <span className="tp-play-answer">{optionLabels[`${question.id}-${option.id}`]}</span>
              </button>
            ))}
          </div>

          <p className="tp-play-count">{tw("personality-quiz.keyboardHint")}</p>

          <div className="tp-play-toolbar">
            <button
              type="button"
              className="tp-play-btn tp-play-btn--ghost"
              onClick={goBack}
              disabled={step === 0}
            >
              {tw("personality-quiz.back")}
            </button>
            {hasAnswer ? (
              <button
                type="button"
                className="tp-play-btn tp-play-btn--primary"
                onClick={() => setStep((previous) => nextStep(previous))}
              >
                {tw("personality-quiz.next")}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
