"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Braces, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolEmpty,
  selectClassName,
} from "../workspace-ui";
import {
  DEFAULT_OPTIONS,
  SAMPLE_JSON,
  jsonToTypeScript,
  type RootStyle,
  type TsOptions,
} from "./json-to-typescript.logic";

export default function JsonToTypeScript() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");

  const [input, setInput] = useState("");
  const [options, setOptions] = useState<TsOptions>(DEFAULT_OPTIONS);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const result = useMemo(
    () => (input.trim() ? jsonToTypeScript(input, options) : null),
    [input, options],
  );

  const reason = result && !result.ok ? result.reason : null;
  const errorMessage = reason === "invalidJson"
    ? tw("json-to-typescript.errorInvalidJson")
    : reason === "empty"
      ? tw("json-to-typescript.errorEmpty")
      : "";

  const handleSample = () => {
    setInput(SAMPLE_JSON);
    setOptions(DEFAULT_OPTIONS);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInput("");
    inputRef.current?.focus();
  };

  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      setInput(JSON.stringify(JSON.parse(input), null, 2));
    } catch {
      // Keep the source visible when it cannot be parsed yet.
    }
    inputRef.current?.focus();
  };

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Braces" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("json-to-typescript.title")}</span>
            <span className="tp-tool-subtitle">{tw("json-to-typescript.shortDesc")}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="ts-root-name"
            className="flex items-center gap-2 text-xs font-medium text-[var(--text)]"
          >
            {tw("json-to-typescript.rootName")}
            <input
              id="ts-root-name"
              type="text"
              className={`${selectClassName} w-28`}
              value={options.rootName}
              autoComplete="off"
              dir="ltr"
              placeholder="Root"
              aria-label={tw("json-to-typescript.rootName")}
              onChange={(event) =>
                setOptions((previous) => ({ ...previous, rootName: event.target.value }))
              }
            />
          </label>
          <SegmentedControl<RootStyle>
            label={tw("json-to-typescript.styleTitle")}
            value={options.style}
            options={[
              { value: "interface", label: tw("json-to-typescript.styleInterface") },
              { value: "type", label: tw("json-to-typescript.styleType") },
            ]}
            onChange={(style) => setOptions((previous) => ({ ...previous, style }))}
          />
          <CheckboxRow
            id="ts-optional"
            label={tw("json-to-typescript.optionalFields")}
            checked={options.optional}
            onChange={(optional) => setOptions((previous) => ({ ...previous, optional }))}
          />
        </div>
      </div>

      {errorMessage ? (
        <p
          className="tp-tool-notice"
          id="ts-input-error"
          data-tone="warning"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="ts-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="ts-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("json-to-typescript.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("json-to-typescript.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
                {tw("json-to-typescript.trySample")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleFormat} disabled={!input}>
                {t("formatJson")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!input}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <textarea
            id="ts-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={tw("json-to-typescript.inputPlaceholder")}
            aria-label={tw("json-to-typescript.inputTitle")}
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "ts-input-error" : undefined}
            spellCheck={false}
            dir="ltr"
          />

          <div className="tp-meta-pill" aria-live="polite">
            <span dir="ltr">{input.length} {t("characters").toLowerCase()}</span>
            {result?.ok ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{t("jsonValid")}</span>
              </>
            ) : null}
          </div>

          <details className="tp-tool-group tp-tool-group--flush">
            <summary className="tp-tool-group-title cursor-pointer">
              {tw("json-to-typescript.advancedOptions")}
            </summary>
            <div className="mt-3">
              <CheckboxRow
                id="ts-nullable"
                label={tw("json-to-typescript.nullableTypes")}
                checked={options.nullable}
                onChange={(nullable) => setOptions((previous) => ({ ...previous, nullable }))}
              />
            </div>
          </details>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="ts-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="ts-result-title" className="text-sm font-semibold text-[var(--text)]">
                {t("result")}
              </h3>
              <p className="tp-tool-hint">{tw("json-to-typescript.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton
                text={result?.ok ? result.code : ""}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={result?.ok ? result.code : null}
                fileName="types.ts"
                mimeType="text/typescript;charset=utf-8"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          {result?.ok ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3" aria-live="polite">
              <div className="tp-meta-pill">
                <strong dir="ltr">{result.typeName}</strong>
                <span aria-hidden="true">•</span>
                <span dir="ltr">{result.fieldCount} {tw("json-to-typescript.fieldCount").toLowerCase()}</span>
                <span aria-hidden="true">•</span>
                <span>
                  {result.rootKind === "object"
                    ? tw("json-to-typescript.kindObject")
                    : result.rootKind === "array"
                      ? tw("json-to-typescript.kindArray")
                      : tw("json-to-typescript.kindScalar")}
                </span>
              </div>
              <div
                className="tp-output-viewer"
                role="region"
                aria-label={t("result")}
              >
                <code dir="ltr">{result.code}</code>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Braces aria-hidden="true" />}
                title={tw("json-to-typescript.emptyTitle")}
                hint={errorMessage || tw("json-to-typescript.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("json-to-typescript.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
