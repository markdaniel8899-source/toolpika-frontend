"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  Stat,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  useCopyFeedback,
  useCopyShortcut,
  selectClassName,
} from "../workspace-ui";
import {
  buildUrl,
  EMPTY_URL_PARTS,
  isPartsEmpty,
  nextParamId,
  parseUrl,
  URL_SAMPLE,
  type UrlParseReason,
  type UrlParts,
} from "./url-parser.logic";

const ERROR_ID = "url-parser-error";
const ERROR_KEYS: Record<UrlParseReason, string> = {
  empty: "url-parser.errorEmpty",
  relative: "url-parser.errorRelative",
  invalid: "url-parser.errorInvalid",
};
const FIX_KEYS: Record<UrlParseReason, string> = {
  empty: "url-parser.fixEmpty",
  relative: "url-parser.fixRelative",
  invalid: "url-parser.fixInvalid",
};

function freshParts(): UrlParts {
  return { ...EMPTY_URL_PARTS, params: [] };
}

export default function UrlParser() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const rowCounter = useRef(0);
  const [raw, setRaw] = useState(URL_SAMPLE);
  const [parts, setParts] = useState<UrlParts>(() => {
    const parsed = parseUrl(URL_SAMPLE);
    return parsed.ok ? parsed.parts : freshParts();
  });
  const { copied, copy } = useCopyFeedback();

  const parsed = useMemo(() => parseUrl(raw), [raw]);
  const reason = parsed.ok ? null : parsed.reason;
  const errorText = reason
    ? `${tw(ERROR_KEYS[reason])} ${tw(FIX_KEYS[reason])}`
    : "";
  const built = buildUrl(parts);
  const ready = !reason && !isPartsEmpty(parts);

  useCopyShortcut(() => {
    if (ready) void copy(built);
  });

  const loadSample = () => {
    const result = parseUrl(URL_SAMPLE);
    setRaw(URL_SAMPLE);
    setParts(result.ok ? result.parts : freshParts());
    inputRef.current?.focus();
  };

  const clearAll = () => {
    setRaw("");
    setParts(freshParts());
    inputRef.current?.focus();
  };

  const handleRawChange = (value: string) => {
    const result = parseUrl(value);
    setRaw(value);
    setParts(result.ok ? result.parts : freshParts());
  };

  const updateField = (field: "protocol" | "host" | "pathname" | "hash", value: string) => {
    setParts((previous) => ({ ...previous, [field]: value }));
  };

  const updateParam = (id: string, patch: Partial<{ key: string; value: string }>) => {
    setParts((previous) => ({
      ...previous,
      params: previous.params.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const addParam = () => {
    rowCounter.current += 1;
    const row = { id: nextParamId(rowCounter.current), key: "", value: "" };
    setParts((previous) => ({ ...previous, params: [...previous.params, row] }));
  };

  const removeParam = (id: string) => {
    setParts((previous) => ({
      ...previous,
      params: previous.params.filter((row) => row.id !== id),
    }));
  };

  return (
    <div className="tp-tool">
      <div className="tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Link" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("url-parser.title")}</span>
            <span className="tp-tool-subtitle">{tw("url-parser.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-tool-actions">
          <Button type="button" size="sm" onClick={loadSample}>
            {tw("url-parser.sampleAction")}
          </Button>
          <Button type="button" size="sm" onClick={clearAll}>
            {tw("url-parser.trySample")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={loadSample}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            {tw("url-parser.reset")}
          </Button>
        </div>
      </div>

      <div className="tp-tool-body tp-tool-body--stacked">
        <ToolPane
          id="url-parser-source-title"
          title={tw("url-parser.inputTitle")}
          hint={tw("url-parser.inputHint")}
        >
          <div className="flex flex-col gap-2">
            <label className="tp-tool-label" htmlFor="url-parser-source">
              {tw("url-parser.urlLabel")}
            </label>
            <textarea
              id="url-parser-source"
              ref={inputRef}
              className={`${selectClassName} tp-tool-editor`}
              rows={3}
              dir="ltr"
              value={raw}
              placeholder={tw("url-parser.urlPlaceholder")}
              aria-describedby={errorText ? ERROR_ID : undefined}
              aria-invalid={Boolean(errorText)}
              onChange={(event) => handleRawChange(event.target.value)}
              spellCheck={false}
            />
            <p className="tp-tool-hint">{tw("url-parser.urlHint")}</p>
            {errorText ? (
              <p id={ERROR_ID} className="tp-tool-error" role="alert">
                {errorText}
              </p>
            ) : null}
          </div>
        </ToolPane>

        <ToolPane
          id="url-parser-edit-title"
          title={tw("url-parser.editTitle")}
          hint={tw("url-parser.editHint")}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("url-parser.protocolLabel")} htmlFor="url-parser-protocol">
              <input
                id="url-parser-protocol"
                className={selectClassName}
                dir="ltr"
                value={parts.protocol}
                onChange={(event) => updateField("protocol", event.target.value)}
              />
            </ToolField>
            <ToolField label={tw("url-parser.hostLabel")} htmlFor="url-parser-host">
              <input
                id="url-parser-host"
                className={selectClassName}
                dir="ltr"
                value={parts.host}
                onChange={(event) => updateField("host", event.target.value)}
              />
            </ToolField>
            <ToolField label={tw("url-parser.pathLabel")} htmlFor="url-parser-path">
              <input
                id="url-parser-path"
                className={selectClassName}
                dir="ltr"
                value={parts.pathname}
                onChange={(event) => updateField("pathname", event.target.value)}
              />
            </ToolField>
            <ToolField label={tw("url-parser.hashLabel")} htmlFor="url-parser-hash">
              <input
                id="url-parser-hash"
                className={selectClassName}
                dir="ltr"
                value={parts.hash}
                onChange={(event) => updateField("hash", event.target.value)}
              />
            </ToolField>
          </div>

          <div className="tp-tool-group">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="tp-tool-group-title">{tw("url-parser.paramTitle")}</span>
              <Button type="button" variant="secondary" size="sm" onClick={addParam}>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("url-parser.addParam")}
              </Button>
            </div>
            <p className="tp-tool-hint">{tw("url-parser.paramHint")}</p>
            {parts.params.length === 0 ? (
              <p className="tp-tool-hint">{tw("url-parser.noParams")}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {parts.params.map((row) => (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]" key={row.id}>
                    <input
                      className={selectClassName}
                      dir="ltr"
                      value={row.key}
                      aria-label={tw("url-parser.keyLabel")}
                      placeholder={tw("url-parser.keyLabel")}
                      onChange={(event) => updateParam(row.id, { key: event.target.value })}
                    />
                    <input
                      className={selectClassName}
                      dir="ltr"
                      value={row.value}
                      aria-label={tw("url-parser.valueLabel")}
                      placeholder={tw("url-parser.valueLabel")}
                      onChange={(event) => updateParam(row.id, { value: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={tw("url-parser.removeParam")}
                      onClick={() => removeParam(row.id)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ToolPane>

        <ToolPane
          id="url-parser-result-title"
          title={tw("url-parser.resultTitle")}
          hint={tw("url-parser.resultHint")}
          actions={
            <CopyButton
              text={ready ? built : ""}
              label={t("copy")}
              copiedLabel={t("copied")}
              className={copied ? "is-copied" : undefined}
            />
          }
        >
          <div aria-live="polite">
            {ready ? (
              <div className="tp-tool-result">
                <ToolBadge tone="success">
                  <Check className="me-1 inline h-3 w-3" aria-hidden="true" />
                  {tw("url-parser.validBadge")}
                </ToolBadge>
                <output dir="ltr" className="block min-w-0 break-words font-mono text-sm leading-relaxed text-[var(--text)]">
                  {built}
                </output>
                <dl className="tp-tool-stats">
                  <Stat label={tw("url-parser.statHost")} value={parts.host || "-"} />
                  <Stat label={tw("url-parser.statParams")} value={parts.params.length} />
                </dl>
                <DownloadButton
                  content={ready ? built : null}
                  fileName="rebuilt-url.txt"
                  label={t("download")}
                />
              </div>
            ) : (
              <ToolEmpty
                icon={<ToolIcon name="Link" />}
                title={tw("url-parser.emptyTitle")}
                hint={tw("url-parser.emptyHint")}
              />
            )}
          </div>
        </ToolPane>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("url-parser.privacyRibbon")}
        </span>
        <span className="tp-tool-hint">{tw("url-parser.shortcutHint")}</span>
      </div>
    </div>
  );
}
