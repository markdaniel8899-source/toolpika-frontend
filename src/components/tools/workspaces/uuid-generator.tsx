"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, Hash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DownloadButton,
  SegmentedControl,
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
  generateUuids,
  type UuidVersion,
} from "./uuid-generator.logic";

type VersionChoice = "4" | "7" | "nil";
type UuidSetup = { count: number; version: UuidVersion };

const DEFAULT_SETUP: UuidSetup = {
  count: DEFAULT_UUID_OPTIONS.count,
  version: DEFAULT_UUID_OPTIONS.version,
};

function parseVersion(choice: VersionChoice): UuidVersion {
  return choice === "nil" ? "nil" : choice === "4" ? 4 : 7;
}

export default function UuidGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update, reset: resetOptions } = usePersistedOptions<UuidSetup>(
    "tp-uuid-generator-options",
    DEFAULT_SETUP,
  );
  const [identifiers, setIdentifiers] = useState<string[]>([]);
  // A null draft shows the persisted count; a string draft keeps partial input editable.
  const [countDraft, setCountDraft] = useState<string | null>(null);
  const countValue = countDraft ?? String(options.count);
  const { notice, showNotice, clearNotice } = useToolNotice();
  const { copied, copy, reset: resetCopy } = useCopyFeedback();

  const output = useMemo(() => identifiers.join("\n"), [identifiers]);

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
      setIdentifiers(generateUuids(DEFAULT_SETUP.count, DEFAULT_SETUP.version));
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
      : DEFAULT_SETUP.count;
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
          actions={
            <Button type="button" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {tw("uuid-generator.generate")}
            </Button>
          }
        >
          <div className="tp-tool-options-grid">
            <ToolField label={tw("uuid-generator.countTitle")} htmlFor="uuid-count">
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
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="uuid-result-title"
          title={t("result")}
          result
          actions={
            <>
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
            <span aria-live="polite">{`${identifiers.length} ${tw("uuid-generator.countUnit")}`}</span>
          }
        >
          {identifiers.length === 0 ? (
            <ToolEmpty
              icon={<Hash aria-hidden="true" />}
              title={tw("uuid-generator.emptyTitle")}
              hint={tw("uuid-generator.emptyHint")}
            />
          ) : (
            <ol className="tp-tool-list tp-tool-result" aria-live="polite">
              {identifiers.map((value, index) => (
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
    />
  );
}
