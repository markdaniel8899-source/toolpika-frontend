"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Braces, ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CodeOutput,
  SegmentedControl,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
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

  const handleReset = () => {
    setInput("");
    setOptions(DEFAULT_OPTIONS);
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
    } catch {
      // Clipboard permission can be denied; the editor remains usable.
    }
    inputRef.current?.focus();
  };

  return (
    <ToolShell
      title={tw("json-to-typescript.title")}
      subtitle={tw("json-to-typescript.shortDesc")}
      icon="Braces"
      sampleLabel={tw("json-to-typescript.trySample")}
      resetLabel={tw("json-to-typescript.reset")}
      privacyLabel={tw("json-to-typescript.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="ts-input-title"
          title={tw("json-to-typescript.inputTitle")}
          hint={tw("json-to-typescript.inputHint")}
          actions={
            <div className="tp-tool-inline-actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void handlePaste()}
                aria-label={tw("json-to-typescript.paste")}
              >
                <ClipboardPaste aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={!input}
                onClick={handleReset}
                aria-label={t("clear")}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          }
          footer={
            <span aria-live="polite">
              {input.length} {t("characters").toLowerCase()}
            </span>
          }
        >
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
          {errorMessage ? (
            <p className="tp-tool-error" id="ts-input-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="tp-tool-options-head">
            <h3>{t("options")}</h3>
          </div>
          <div className="tp-tool-options-grid tp-tool-options-grid--single">
            <ToolField label={tw("json-to-typescript.rootName")} hint={tw("json-to-typescript.rootNameHint")}>
              <input
                id="ts-root-name"
                type="text"
                className={selectClassName}
                value={options.rootName}
                autoComplete="off"
                dir="ltr"
                placeholder="Root"
                aria-label={tw("json-to-typescript.rootName")}
                onChange={(event) =>
                  setOptions((previous) => ({ ...previous, rootName: event.target.value }))
                }
              />
            </ToolField>

            <div className="tp-tool-group">
              <p className="tp-tool-group-title">{tw("json-to-typescript.styleTitle")}</p>
              <SegmentedControl<RootStyle>
                label={tw("json-to-typescript.styleTitle")}
                value={options.style}
                options={[
                  { value: "interface", label: tw("json-to-typescript.styleInterface") },
                  { value: "type", label: tw("json-to-typescript.styleType") },
                ]}
                onChange={(style) => setOptions((previous) => ({ ...previous, style }))}
              />
            </div>

            <div className="tp-tool-group">
              <CheckboxRow
                id="ts-optional"
                label={tw("json-to-typescript.optionalFields")}
                checked={options.optional}
                onChange={(optional) => setOptions((previous) => ({ ...previous, optional }))}
              />
              <CheckboxRow
                id="ts-nullable"
                label={tw("json-to-typescript.nullableTypes")}
                checked={options.nullable}
                onChange={(nullable) => setOptions((previous) => ({ ...previous, nullable }))}
              />
            </div>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="ts-result-title"
          title={t("result")}
          hint={tw("json-to-typescript.resultHint")}
          result
        >
          {result && result.ok ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat label={tw("json-to-typescript.typeName")} value={result.typeName} />
                <Stat label={tw("json-to-typescript.fieldCount")} value={result.fieldCount} />
                <Stat
                  label={tw("json-to-typescript.rootKind")}
                  value={
                    result.rootKind === "object"
                      ? tw("json-to-typescript.kindObject")
                      : result.rootKind === "array"
                        ? tw("json-to-typescript.kindArray")
                        : tw("json-to-typescript.kindScalar")
                  }
                />
              </dl>
              <CodeOutput
                code={result.code}
                language="js"
                label={t("result")}
                fileName="types.ts"
                mimeType="text/typescript;charset=utf-8"
              />
            </div>
          ) : reason ? null : (
            <ToolEmpty
              icon={<Braces aria-hidden="true" />}
              title={tw("json-to-typescript.emptyTitle")}
              hint={tw("json-to-typescript.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
