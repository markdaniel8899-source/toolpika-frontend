"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  NumberStepper,
  ToolBadge,
  ToolEmpty,
  selectClassName,
  usePersistedOptions,
} from "../workspace-ui";
import {
  assessPassword,
  BAND_LABEL_KEYS,
  BAND_TONES,
  CHECK_KEYS,
  CHECK_ORDER,
  DEFAULT_MIN_LENGTH,
  PASSWORD_SAMPLE,
  TIP_KEYS,
  type TipId,
} from "./password-strength-checker.logic";

const DEFAULTS = { minLength: DEFAULT_MIN_LENGTH };
const TONE_COLORS: Record<(typeof BAND_TONES)[keyof typeof BAND_TONES], string> = {
  neutral: "var(--border)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  accent: "var(--accent)",
  success: "var(--success)",
};

export default function PasswordStrengthChecker() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { options, update } = usePersistedOptions("tp-password-strength-options", DEFAULTS);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const result = useMemo(
    () => assessPassword(password, options.minLength),
    [password, options.minLength],
  );
  const ready = password.length > 0;
  const variety = [
    result.checks.lower,
    result.checks.upper,
    result.checks.numbers,
    result.checks.symbols,
  ].filter(Boolean).length;
  const meterColor = ready ? TONE_COLORS[BAND_TONES[result.band]] : TONE_COLORS.neutral;

  const handleClear = () => {
    setPassword("");
    inputRef.current?.focus();
  };

  const handleSample = () => {
    setPassword(PASSWORD_SAMPLE);
    inputRef.current?.focus();
  };

  return (
    <div className="tp-tool mx-auto w-full max-w-3xl">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Shield" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("password-strength-checker.title")}</span>
            <span className="tp-tool-subtitle">{tw("password-strength-checker.shortDesc")}</span>
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <ToolBadge tone={BAND_TONES[result.band]}>{tw(BAND_LABEL_KEYS[result.band])}</ToolBadge>
          <Button type="button" size="sm" onClick={handleSample}>
            {tw("password-strength-checker.generateExample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            {t("clear")}
          </Button>
        </div>
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4">
        <section className="flex min-h-0 min-w-0 flex-col gap-3" aria-labelledby="tp-password-input-title">
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-password-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("password-strength-checker.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("password-strength-checker.inputHint")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-password-value" className="text-sm font-medium text-[var(--text)]">
              {tw("password-strength-checker.passwordLabel")}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="tp-password-value"
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                className={`${selectClassName} min-w-0 flex-1`}
                dir="ltr"
                autoComplete="new-password"
                value={password}
                placeholder={tw("password-strength-checker.passwordPlaceholder")}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={showPassword
                  ? tw("password-strength-checker.hideAction")
                  : tw("password-strength-checker.showAction")}
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword
                  ? tw("password-strength-checker.hideAction")
                  : tw("password-strength-checker.showAction")}
              </Button>
            </div>
            <p className="tp-tool-hint">{tw("password-strength-checker.passwordHint")}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label htmlFor="tp-password-min" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text)]">
                {tw("password-strength-checker.minLengthLabel")}
              </span>
              <NumberStepper
                id="tp-password-min"
                value={String(options.minLength)}
                onValueChange={(value) => {
                  if (!value.trim()) return;
                  const parsed = Number(value);
                  if (Number.isFinite(parsed)) update({ minLength: Math.min(32, Math.max(4, Math.round(parsed))) });
                }}
                min={4}
                max={32}
                ariaLabel={tw("password-strength-checker.minLengthLabel")}
                increaseLabel={t("stepUp")}
                decreaseLabel={t("stepDown")}
              />
              <span className="tp-tool-hint">{tw("password-strength-checker.minLengthHint")}</span>
            </label>
            <div className="tp-tool-group tp-tool-group--flush">
              <span className="tp-tool-group-title">{tw("password-strength-checker.heroLabel")}</span>
              <div
                className="flex gap-1"
                role="progressbar"
                aria-valuenow={result.score}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-label={tw("password-strength-checker.heroLabel")}
              >
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ backgroundColor: step <= result.score ? meterColor : "var(--border)" }}
                  />
                ))}
              </div>
              <p className="tp-tool-hint">{tw("password-strength-checker.heroNote")}</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 min-w-0 flex-col gap-3" aria-labelledby="tp-password-result-title">
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-password-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("password-strength-checker.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("password-strength-checker.resultHint")}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2" aria-live="polite">
            <div className="tp-meta-pill">
              <span>{t("characters")}</span>
              <strong dir="ltr">{password.length}</strong>
            </div>
            <div className="tp-meta-pill">
              <span>{tw("password-strength-checker.entropyLabel")}</span>
              <strong dir="ltr">{result.entropyBits}</strong>
            </div>
            <div className="tp-meta-pill">
              <span>{tw("password-strength-checker.varietyLabel")}</span>
              <strong dir="ltr">{variety}/4</strong>
            </div>
          </div>

          {ready ? (
            <div aria-live="polite">
              <div className="tp-tool-group tp-tool-group--flush">
                <div className="tp-industrial-bar">
                  <span className="tp-tool-group-title">{tw("password-strength-checker.checkTitle")}</span>
                  <span className="tp-meta-pill">
                    <span>{tw("password-strength-checker.scoreLabel")}</span>
                    <strong dir="ltr">{result.score}/4</strong>
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CHECK_ORDER.map((key) => {
                    const passed = result.checks[key];
                    return (
                      <li className="tp-check-row" key={key}>
                        {passed ? (
                          <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden="true" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-[var(--danger)]" aria-hidden="true" />
                        )}
                        <span className="tp-check-label">{tw(CHECK_KEYS[key])}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {result.tips.length > 0 ? (
                <div className="tp-tool-group tp-tool-group--flush">
                  <span className="tp-tool-group-title">{tw("password-strength-checker.tipTitle")}</span>
                  <ul className="tp-tool-list">
                    {result.tips.map((tip: TipId) => (
                      <li key={tip}>{tw(TIP_KEYS[tip])}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Shield aria-hidden="true" />}
                title={tw("password-strength-checker.emptyTitle")}
                hint={tw("password-strength-checker.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("password-strength-checker.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
