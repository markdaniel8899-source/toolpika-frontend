"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  HeroValue,
  Stat,
  ToolField,
  ToolPane,
  ToolShell,
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
} from "./chmod-calculator.logic";

const OCTAL_ERROR_ID = "tp-chmod-octal-error";

export default function ChmodCalculator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [state, setState] = useState<ChmodState>(() => ({
    owner: { ...DEFAULT_CHMOD_STATE.owner },
    group: { ...DEFAULT_CHMOD_STATE.group },
    public: { ...DEFAULT_CHMOD_STATE.public },
  }));
  const [octal, setOctal] = useState(numericMode(DEFAULT_CHMOD_STATE));
  const [error, setError] = useState("");

  const numeric = useMemo(() => numericMode(state), [state]);
  const symbolic = useMemo(() => symbolicMode(state), [state]);
  const command = useMemo(() => chmodCommand(state), [state]);

  const setPermission = useCallback(
    (permissionClass: PermissionClass, kind: "read" | "write" | "execute", value: boolean) => {
      const next: ChmodState = {
        ...state,
        [permissionClass]: { ...state[permissionClass], [kind]: value },
      };
      setState(next);
      setOctal(numericMode(next));
      setError("");
    },
    [state],
  );

  const applyOctal = useCallback(() => {
    const parsed = parseOctalMode(octal);
    if (!parsed) {
      setError(`${tw("chmod-calculator.errorOctal")} ${tw("chmod-calculator.fixOctal")}`);
      return;
    }
    setError("");
    setState(parsed);
    setOctal(numericMode(parsed));
  }, [octal, tw]);

  const handleSample = useCallback(() => {
    const next = {
      owner: { ...SAMPLE_CHMOD_STATE.owner },
      group: { ...SAMPLE_CHMOD_STATE.group },
      public: { ...SAMPLE_CHMOD_STATE.public },
    };
    setState(next);
    setOctal(numericMode(next));
    setError("");
  }, []);

  const handleReset = useCallback(() => {
    const next = {
      owner: { ...DEFAULT_CHMOD_STATE.owner },
      group: { ...DEFAULT_CHMOD_STATE.group },
      public: { ...DEFAULT_CHMOD_STATE.public },
    };
    setState(next);
    setOctal(numericMode(next));
    setError("");
  }, []);

  return (
    <ToolShell
      title={tw("chmod-calculator.title")}
      subtitle={tw("chmod-calculator.subtitle")}
      icon="KeyRound"
      sampleLabel={tw("chmod-calculator.trySample")}
      resetLabel={tw("chmod-calculator.reset")}
      privacyLabel={tw("chmod-calculator.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-chmod-input-title"
          title={tw("chmod-calculator.inputTitle")}
          hint={tw("chmod-calculator.inputHint")}
        >
          {error ? (
            <p id={OCTAL_ERROR_ID} className="tp-tool-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <p className="tp-tool-hint">
                  {tw("chmod-calculator.classSummary", {
                    digits: permissionDigit(state[permissionClass]),
                    chars: permissionChars(state[permissionClass]),
                  })}
                </p>
              </div>
            ))}
          </div>

          <ToolField
            label={tw("chmod-calculator.octalLabel")}
            htmlFor="tp-chmod-octal"
            hint={tw("chmod-calculator.octalHint")}
          >
            <div className="tp-tool-inline-actions">
              <input
                id="tp-chmod-octal"
                className="tp-tool-field"
                inputMode="numeric"
                autoComplete="off"
                value={octal}
                onChange={(event) => setOctal(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyOctal();
                }}
                aria-describedby={error ? OCTAL_ERROR_ID : undefined}
                dir="ltr"
              />
              <Button type="button" size="sm" onClick={applyOctal}>
                {tw("chmod-calculator.apply")}
              </Button>
            </div>
          </ToolField>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-chmod-result-title"
          title={tw("chmod-calculator.resultTitle")}
          hint={tw("chmod-calculator.resultHint")}
          result
          actions={
            <CopyButton
              text={command}
              label={t("copy")}
              copiedLabel={t("copied")}
            />
          }
        >
          <div className="tp-tool-result" aria-live="polite">
            <HeroValue
              label={tw("chmod-calculator.numericLabel")}
              value={numeric}
              note={tw("chmod-calculator.numericNote")}
            />
            <dl className="tp-tool-stats">
              <Stat label={tw("chmod-calculator.symbolicLabel")} value={symbolic} />
              <Stat
                label={tw("chmod-calculator.ownerStat")}
                value={`${permissionDigit(state.owner)} · ${permissionChars(state.owner)}`}
              />
              <Stat
                label={tw("chmod-calculator.groupStat")}
                value={`${permissionDigit(state.group)} · ${permissionChars(state.group)}`}
              />
              <Stat
                label={tw("chmod-calculator.publicStat")}
                value={`${permissionDigit(state.public)} · ${permissionChars(state.public)}`}
              />
            </dl>
            <div className="flex flex-col gap-1">
              <span className="tp-tool-label">{tw("chmod-calculator.commandLabel")}</span>
              <div className="tp-tool-url" dir="ltr">
                <code>{command}</code>
              </div>
            </div>
          </div>
        </ToolPane>
      }
    />
  );
}
