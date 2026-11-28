"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  HeroValue,
  NumberStepper,
  Stat,
  ToggleSwitch,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
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
  TIP_KEYS,
  type TipId,
} from "./password-strength-checker.logic";

const DEFAULTS = { minLength: DEFAULT_MIN_LENGTH };

export default function PasswordStrengthChecker() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { options, update, reset: resetOptions } = usePersistedOptions("tp-password-strength-options", DEFAULTS);
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

  const clearAll = () => {
    setPassword("");
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setPassword("");
    setShowPassword(false);
    resetOptions();
    inputRef.current?.focus();
  };

  return (
    <ToolShell
      title={tw("password-strength-checker.title")}
      subtitle={tw("password-strength-checker.shortDesc")}
      icon="Shield"
      sampleLabel={tw("password-strength-checker.trySample")}
      resetLabel={tw("password-strength-checker.reset")}
      privacyLabel={tw("password-strength-checker.privacyRibbon")}
      onSample={clearAll}
      onReset={handleReset}
      input={
        <ToolPane
          id="password-strength-input-title"
          title={tw("password-strength-checker.inputTitle")}
          hint={tw("password-strength-checker.inputHint")}
        >
          <ToolField
            label={tw("password-strength-checker.passwordLabel")}
            htmlFor="password-strength-value"
            hint={tw("password-strength-checker.passwordHint")}
          >
            <input
              id="password-strength-value"
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              className={selectClassName}
              dir="ltr"
              autoComplete="new-password"
              value={password}
              placeholder={tw("password-strength-checker.passwordPlaceholder")}
              onChange={(event) => setPassword(event.target.value)}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("password-strength-checker.minLengthLabel")}
              htmlFor="password-strength-min"
              hint={tw("password-strength-checker.minLengthHint")}
            >
              <NumberStepper
                id="password-strength-min"
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
            </ToolField>
            <ToolField
              label={tw("password-strength-checker.showLabel")}
              htmlFor="password-strength-show"
              hint={tw("password-strength-checker.showHint")}
            >
              <div className="tp-check-row">
                <ToggleSwitch
                  id="password-strength-show"
                  label={tw("password-strength-checker.showLabel")}
                  checked={showPassword}
                  onChange={() => setShowPassword((previous) => !previous)}
                />
                <label htmlFor="password-strength-show" className="tp-check-label">
                  {showPassword
                    ? tw("password-strength-checker.showOn")
                    : tw("password-strength-checker.showOff")}
                </label>
              </div>
            </ToolField>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="password-strength-result-title"
          title={tw("password-strength-checker.resultTitle")}
          hint={tw("password-strength-checker.resultHint")}
          result
        >
          <div className="tp-tool-result" aria-live="polite">
            <ToolBadge tone={BAND_TONES[result.band]}>
              {tw(BAND_LABEL_KEYS[result.band])}
            </ToolBadge>
            <HeroValue
              label={tw("password-strength-checker.heroLabel")}
              value={ready ? tw(BAND_LABEL_KEYS[result.band]) : tw("password-strength-checker.bandEmpty")}
              note={ready ? tw("password-strength-checker.heroNote") : undefined}
            />
            <dl className="tp-tool-stats">
              <Stat label={t("characters")} value={password.length} />
              <Stat label={tw("password-strength-checker.entropyLabel")} value={result.entropyBits} />
              <Stat label={tw("password-strength-checker.varietyLabel")} value={`${variety}/4`} />
              <Stat label={tw("password-strength-checker.scoreLabel")} value={`${result.score}/4`} />
            </dl>

            {ready ? (
              <>
                <div className="tp-tool-group">
                  <span className="tp-tool-group-title">{tw("password-strength-checker.checkTitle")}</span>
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
                  <div className="tp-tool-group">
                    <span className="tp-tool-group-title">{tw("password-strength-checker.tipTitle")}</span>
                    <ul className="tp-tool-list">
                      {result.tips.map((tip: TipId) => (
                        <li key={tip}>{tw(TIP_KEYS[tip])}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <ToolEmpty
                icon={<ToolIcon name="Shield" />}
                title={tw("password-strength-checker.emptyTitle")}
                hint={tw("password-strength-checker.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      }
    />
  );
}
