"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Hash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DownloadButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyFeedback,
  useCopyShortcut,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  DEFAULT_UUID_OPTIONS,
  UUID_MAX_COUNT,
  UUID_MIN_COUNT,
  UUID_SEPARATORS,
  formatUuids,
  generateUuids,
  type UuidOptions,
  type UuidSeparator,
  type UuidVersion,
} from "./uuid-generator.logic";

type VersionChoice = "4" | "7" | "nil";

function parseVersion(choice: VersionChoice): UuidVersion {
  return choice === "nil" ? "nil" : choice === "4" ? 4 : 7;
}

export default function UuidGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions<UuidOptions>(
    "tp-uuid-generator-options",
    DEFAULT_UUID_OPTIONS,
  );
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  // A null draft means "show the persisted option"; while typing, the draft
  // temporarily overrides it so an empty or partial number stays editable.
  const [countDraft, setCountDraft] = useState<string | null>(null);
  const countValue = countDraft ?? String(options.count);
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { copied, copy, reset: resetCopy } = useCopyFeedback();

  const versionLabel = (version: UuidVersion) => {
    if (version === 7) return tw("uuid-generator.version7");
    if (version === "nil") return tw("uuid-generator.versionNil");
    return tw("uuid-generator.version4");
  };

  const displayed = useMemo(
    () => (options.uppercase ? identifiers.map((value) => value.toUpperCase()) : identifiers),
    [identifiers, options.uppercase],
  );

  const output = useMemo(
    () => formatUuids(displayed, UUID_SEPARATORS[options.separator]),
    [displayed, options.separator],
  );

  const handleGenerate = useCallback(() => {
    try {
      setIdentifiers(generateUuids(options.count, options.version));
      resetCopy();
      clearNotice();
    } catch {
      showNotice(tw("uuid-generator.generateFailed"));
    }
  }, [clearNotice, options.count, options.version, resetCopy, showNotice, tw]);

  const handleSample = useCallback(() => {
    try {
      setIdentifiers(
        generateUuids(DEFAULT_UUID_OPTIONS.count, DEFAULT_UUID_OPTIONS.version),
      );
      resetOptions();
      setCountDraft(null);
      resetCopy();
      clearNotice();
    } catch {
      showNotice(tw("uuid-generator.generateFailed"));
    }
  }, [clearNotice, resetCopy, resetOptions, showNotice, tw]);

  const handleReset = useCallback(() => {
    resetOptions();
    setCountDraft(null);
    setIdentifiers([]);
    resetCopy();
    clearNotice();
  }, [clearNotice, resetCopy, resetOptions]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    void copy(output).then((ok) => {
      if (!ok) showNotice(tw("uuid-generator.copyFailed"));
    });
  }, [copy, output, showNotice, tw]);

  useCopyShortcut(handleCopy);

  const handleCountChange = (value: string) => {
    setCountDraft(value);
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= UUID_MIN_COUNT && parsed <= UUID_MAX_COUNT) {
      update({ count: parsed });
    }
  };

  const handleCountBlur = () => {
    if (countDraft === null) return;
    const parsed = Number(countDraft);
    const next = Number.isFinite(parsed)
      ? Math.min(UUID_MAX_COUNT, Math.max(UUID_MIN_COUNT, Math.floor(parsed)))
      : DEFAULT_UUID_OPTIONS.count;
    setCountDraft(null);
    update({ count: next });
  };

  return (
    <ToolShell
      title={tw("uuid-generator.title")}
      subtitle={tw("uuid-generator.subtitle")}
      icon="Hash"
      sampleLabel={tw("uuid-generator.trySample")}
      resetLabel={tw("uuid-generator.reset")}
      privacyLabel={tw("uuid-generator.privacy")}
      shortcutHint={tw("uuid-generator.shortcut")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      noticeTone="danger"
      input={
        <ToolPane
          id="uuid-setup-title"
          title={tw("uuid-generator.setupTitle")}
          hint={tw("uuid-generator.setupHint")}
        >
          <Button type="button" onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {tw("uuid-generator.generate")}
          </Button>
        </ToolPane>
      }
      result={
        <ToolPane
          id="uuid-result-title"
          title={t("result")}
          hint={tw("uuid-generator.resultHint")}
          result
          actions={
            <>
              <ToolBadge tone="accent">{`${versionLabel(options.version)} · ${displayed.length}`}</ToolBadge>
              <Button type="button" size="sm" variant="secondary" onClick={handleCopy} disabled={!output}>
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? t("copied") : t("copy")}
              </Button>
              <DownloadButton
                content={output || null}
                fileName={tw("uuid-generator.downloadName")}
                label={t("download")}
              />
            </>
          }
          footer={
            <span aria-live="polite">{`${displayed.length} ${tw("uuid-generator.countUnit")}`}</span>
          }
        >
          {displayed.length === 0 ? (
            <ToolEmpty
              icon={<Hash aria-hidden="true" />}
              title={tw("uuid-generator.emptyTitle")}
              hint={tw("uuid-generator.emptyHint")}
            />
          ) : (
            <ol className="tp-tool-list tp-tool-result" aria-live="polite">
              {displayed.map((value, index) => (
                <li className="tp-tool-row" key={`${index}-${value}`}>
                  <span className="tp-tool-pill" dir="ltr">
                    {index + 1}
                  </span>
                  <code dir="ltr">{value}</code>
                </li>
              ))}
            </ol>
          )}
        </ToolPane>
      }
      options={
        <>
          <div className="tp-tool-options-head">
            <h3>{tw("uuid-generator.optionsTitle")}</h3>
          </div>
          <div className="tp-tool-options-grid">
            <ToolField
              label={tw("uuid-generator.countTitle")}
              htmlFor="uuid-count"
            >
              <input
                id="uuid-count"
                type="number"
                inputMode="numeric"
                min={UUID_MIN_COUNT}
                max={UUID_MAX_COUNT}
                step={1}
                className="tp-tool-field"
                value={countValue}
                onChange={(event) => handleCountChange(event.target.value)}
                onBlur={handleCountBlur}
              />
            </ToolField>
            <div className="tp-tool-group tp-tool-group--flush">
              <p className="tp-tool-group-title">{tw("uuid-generator.versionTitle")}</p>
              <SegmentedControl<VersionChoice>
                label={tw("uuid-generator.versionTitle")}
                value={options.version === "nil" ? "nil" : (String(options.version) as VersionChoice)}
                options={[
                  { value: "4", label: tw("uuid-generator.version4") },
                  { value: "7", label: tw("uuid-generator.version7") },
                  { value: "nil", label: tw("uuid-generator.versionNil") },
                ]}
                onChange={(choice) => update({ version: parseVersion(choice) })}
              />
            </div>
            <ToolField label={tw("uuid-generator.separatorTitle")} htmlFor="uuid-separator">
              <select
                id="uuid-separator"
                className="tp-tool-select"
                value={options.separator}
                onChange={(event) => update({ separator: event.target.value as UuidSeparator })}
              >
                <option value="newline">{tw("uuid-generator.valueNewline")}</option>
                <option value="comma">{tw("uuid-generator.valueComma")}</option>
                <option value="space">{tw("uuid-generator.valueSpace")}</option>
              </select>
            </ToolField>
            <div className="tp-tool-group tp-tool-group--flush">
              <p className="tp-tool-group-title">{tw("uuid-generator.caseTitle")}</p>
              <label className="tp-tool-check" htmlFor="uuid-uppercase">
                <input
                  id="uuid-uppercase"
                  type="checkbox"
                  checked={options.uppercase}
                  onChange={(event) => update({ uppercase: event.target.checked })}
                />
                {tw("uuid-generator.uppercaseLabel")}
              </label>
            </div>
          </div>
        </>
      }
    />
  );
}
