"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  ToolBadge,
  selectClassName,
} from "@/components/tools/workspace-ui";
import {
  chmodCommand,
  DEFAULT_CHMOD_STATE,
  numericMode,
  parseOctalMode,
  PERMISSION_CLASSES,
  PERMISSION_KINDS,
  permissionChars,
  permissionDigit,
  SAMPLE_CHMOD_STATE,
  symbolicMode,
  type ChmodState,
  type PermissionClass,
  type PermissionKind,
} from "./chmod-calculator.logic";

const ERROR_ID = "tp-chmod-octal-error";
const PRESETS = ["644", "755", "777", "600"] as const;

function cloneState(source: ChmodState): ChmodState {
  return {
    owner: { ...source.owner },
    group: { ...source.group },
    public: { ...source.public },
  };
}

export default function ChmodCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [state, setState] = useState<ChmodState>(() => cloneState(DEFAULT_CHMOD_STATE));
  const [octal, setOctal] = useState(() => numericMode(DEFAULT_CHMOD_STATE));

  const parsedOctal = useMemo(() => parseOctalMode(octal), [octal]);
  const numeric = useMemo(() => numericMode(state), [state]);
  const symbolic = useMemo(() => symbolicMode(state), [state]);
  const command = useMemo(() => chmodCommand(state), [state]);
  const errorText = parsedOctal
    ? ""
    : `${tw("chmod-calculator.errorOctal")} ${tw("chmod-calculator.fixOctal")}`;

  const applyState = useCallback((next: ChmodState) => {
    setState(next);
    setOctal(numericMode(next));
  }, []);

  const setPermission = useCallback(
    (permissionClass: PermissionClass, kind: PermissionKind, value: boolean) => {
      applyState({
        ...state,
        [permissionClass]: { ...state[permissionClass], [kind]: value },
      });
    },
    [applyState, state],
  );

  const handleOctalChange = (value: string) => {
    setOctal(value);
    const parsed = parseOctalMode(value);
    if (parsed) setState(parsed);
  };

  const handleSample = useCallback(() => applyState(cloneState(SAMPLE_CHMOD_STATE)), [applyState]);
  const handleClear = useCallback(() => applyState(cloneState(DEFAULT_CHMOD_STATE)), [applyState]);

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="KeyRound" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("chmod-calculator.title")}</span>
            <span className="tp-tool-subtitle">{tw("chmod-calculator.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-meta-pill" aria-live="polite">
          <span>{tw("chmod-calculator.symbolicLabel")}</span>
          <strong dir="ltr">{symbolic}</strong>
          <span aria-hidden="true">•</span>
          <span>{tw("chmod-calculator.numericLabel")}</span>
          <strong dir="ltr">{numeric}</strong>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="default" size="sm" onClick={handleSample}>
            {tw("chmod-calculator.trySample")}
          </Button>
        </div>
      </div>

      {errorText ? (
        <p
          className="tp-tool-notice"
          id={ERROR_ID}
          data-tone="warning"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-chmod-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-chmod-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("chmod-calculator.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("chmod-calculator.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-industrial-bar">
              <span className="tp-tool-group-title">{tw("chmod-calculator.presetsLabel")}</span>
              <div className="flex flex-wrap gap-1">
                {PRESETS.map((preset) => {
                  const parsed = parseOctalMode(preset);
                  return (
                    <Button
                      key={preset}
                      type="button"
                      variant="secondary"
                      size="sm"
                      aria-pressed={parsed ? numericMode(parsed) === numeric : false}
                      onClick={() => {
                        if (parsed) applyState(parsed);
                      }}
                    >
                      {preset}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PERMISSION_CLASSES.map((permissionClass) => (
              <div className="tp-tool-group tp-tool-group--flush" key={permissionClass}>
                <span className="tp-tool-group-title">
                  {tw(`chmod-calculator.class${permissionClass.charAt(0).toUpperCase()}${permissionClass.slice(1)}`)}
                </span>
                {PERMISSION_KINDS.map((kind) => (
                  <CheckboxRow
                    key={kind}
                    id={`tp-chmod-${permissionClass}-${kind}`}
                    label={tw(`chmod-calculator.kind${kind.charAt(0).toUpperCase()}${kind.slice(1)}`)}
                    checked={state[permissionClass][kind]}
                    onChange={(value) => setPermission(permissionClass, kind, value)}
                  />
                ))}
                <div className="tp-meta-pill">
                  <strong dir="ltr">{permissionDigit(state[permissionClass])}</strong>
                  <span aria-hidden="true">•</span>
                  <span dir="ltr">{permissionChars(state[permissionClass])}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-chmod-octal" className="text-sm font-medium text-[var(--text)]">
              {tw("chmod-calculator.octalLabel")}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="tp-chmod-octal"
                className={`${selectClassName} min-w-0 flex-1`}
                inputMode="numeric"
                autoComplete="off"
                value={octal}
                onChange={(event) => handleOctalChange(event.target.value)}
                aria-invalid={Boolean(errorText)}
                aria-describedby={errorText ? ERROR_ID : undefined}
                dir="ltr"
              />
              <span className="tp-meta-pill" aria-hidden="true">
                <strong dir="ltr">{symbolic}</strong>
              </span>
            </div>
            <p className="tp-tool-hint">{tw("chmod-calculator.octalHint")}</p>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="tp-chmod-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-chmod-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("chmod-calculator.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("chmod-calculator.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={command} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={command}
                fileName="chmod-command.txt"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            <strong dir="ltr">{numeric}</strong>
            <span aria-hidden="true">•</span>
            <span dir="ltr">{symbolic}</span>
            {PERMISSION_CLASSES.map((permissionClass) => (
              <span key={permissionClass} dir="ltr">
                {tw(`chmod-calculator.class${permissionClass.charAt(0).toUpperCase()}${permissionClass.slice(1)}`)}{" "}
                {permissionDigit(state[permissionClass])} · {permissionChars(state[permissionClass])}
              </span>
            ))}
          </div>

          <ToolBadge tone="accent">{symbolic}</ToolBadge>

          <div className="flex min-h-0 flex-col gap-2">
            <span className="tp-tool-label">{tw("chmod-calculator.commandLabel")}</span>
            <div className="tp-output-viewer" role="region" aria-label={tw("chmod-calculator.commandLabel")}>
              <code dir="ltr">{command}</code>
            </div>
          </div>
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("chmod-calculator.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
