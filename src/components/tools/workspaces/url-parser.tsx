"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  selectClassName,
  useCopyShortcut,
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rowCounter = useRef(0);
  const [raw, setRaw] = useState(URL_SAMPLE);
  const [parts, setParts] = useState<UrlParts>(() => {
    const parsed = parseUrl(URL_SAMPLE);
    return parsed.ok ? parsed.parts : freshParts();
  });
  const [pasteBlocked, setPasteBlocked] = useState(false);

  const parsed = useMemo(() => parseUrl(raw), [raw]);
  const reason = parsed.ok ? null : parsed.reason;
  const built = buildUrl(parts);
  const ready = !reason && !isPartsEmpty(parts);
  const errorText = pasteBlocked
    ? tw("url-parser.pasteFailed")
    : reason
      ? `${tw(ERROR_KEYS[reason])} ${tw(FIX_KEYS[reason])}`
      : "";

  useCopyShortcut(() => {
    if (ready) void navigator.clipboard.writeText(built);
  });

  const handleRawChange = (value: string) => {
    const result = parseUrl(value);
    setRaw(value);
    setParts(result.ok ? result.parts : freshParts());
    setPasteBlocked(false);
  };

  const loadSample = () => {
    handleRawChange(URL_SAMPLE);
    inputRef.current?.focus();
  };

  const clearAll = () => {
    handleRawChange("");
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) handleRawChange(text.trim());
      else inputRef.current?.focus();
    } catch {
      setPasteBlocked(true);
      inputRef.current?.focus();
    }
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
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Link" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("url-parser.title")}</span>
            <span className="tp-tool-subtitle">{tw("url-parser.shortDesc")}</span>
          </span>
        </div>
        <div className="tp-meta-pill" aria-live="polite">
          <span>{tw("url-parser.statHost")}</span>
          <strong dir="ltr">{parts.host || tw("url-parser.noHost")}</strong>
          <span aria-hidden="true">•</span>
          <span>{tw("url-parser.statParams")}</span>
          <strong dir="ltr">{parts.params.length}</strong>
        </div>
      </div>

      <div className="tp-tool-group tp-tool-group--flush">
        <div className="tp-industrial-bar">
          <label htmlFor="url-parser-source" className="tp-tool-group-title">
            {tw("url-parser.urlLabel")}
          </label>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={loadSample}>
              {tw("url-parser.sampleAction")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
              {tw("url-parser.pasteAction")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
              {t("clear")}
            </Button>
          </div>
        </div>
        <input
          id="url-parser-source"
          ref={inputRef}
          className={`${selectClassName} w-full`}
          type="text"
          inputMode="url"
          dir="ltr"
          autoComplete="off"
          spellCheck={false}
          value={raw}
          placeholder={tw("url-parser.urlPlaceholder")}
          aria-invalid={Boolean(errorText)}
          aria-describedby={errorText ? ERROR_ID : undefined}
          onChange={(event) => handleRawChange(event.target.value)}
        />
        <p className="tp-tool-hint">{tw("url-parser.urlHint")}</p>
        {errorText ? (
          <p className="tp-tool-notice" id={ERROR_ID} data-tone="warning" role="alert" aria-live="polite">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            {errorText}
          </p>
        ) : null}
      </div>

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="url-parser-edit-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="url-parser-edit-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("url-parser.editTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("url-parser.editHint")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label htmlFor="url-parser-protocol" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text)]">{tw("url-parser.protocolLabel")}</span>
              <input
                id="url-parser-protocol"
                className={selectClassName}
                dir="ltr"
                value={parts.protocol}
                onChange={(event) => updateField("protocol", event.target.value)}
              />
            </label>
            <label htmlFor="url-parser-host" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text)]">{tw("url-parser.hostLabel")}</span>
              <input
                id="url-parser-host"
                className={selectClassName}
                dir="ltr"
                value={parts.host}
                onChange={(event) => updateField("host", event.target.value)}
              />
            </label>
            <label htmlFor="url-parser-path" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text)]">{tw("url-parser.pathLabel")}</span>
              <input
                id="url-parser-path"
                className={selectClassName}
                dir="ltr"
                value={parts.pathname}
                onChange={(event) => updateField("pathname", event.target.value)}
              />
            </label>
            <label htmlFor="url-parser-hash" className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--text)]">{tw("url-parser.hashLabel")}</span>
              <input
                id="url-parser-hash"
                className={selectClassName}
                dir="ltr"
                value={parts.hash}
                onChange={(event) => updateField("hash", event.target.value)}
              />
            </label>
          </div>

          <p className="tp-tool-hint">{tw("url-parser.paramHint")}</p>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="url-parser-param-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="url-parser-param-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("url-parser.paramTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("url-parser.paramHint")}</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addParam}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("url-parser.addParam")}
            </Button>
          </div>

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

          <div className="tp-tool-group tp-tool-group--flush">
            <div className="tp-industrial-bar">
              <div>
                <h4 id="url-parser-result-title" className="text-sm font-semibold text-[var(--text)]">
                  {tw("url-parser.resultTitle")}
                </h4>
                <p className="tp-tool-hint">{tw("url-parser.resultHint")}</p>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton
                  text={ready ? built : ""}
                  label={t("copy")}
                  copiedLabel={t("copied")}
                />
                <DownloadButton
                  content={ready ? built : null}
                  fileName="rebuilt-url.txt"
                  label={t("download")}
                  variant="default"
                />
              </div>
            </div>
            <div aria-live="polite">
              {ready ? (
                <div className="flex flex-col gap-2">
                  <div className="tp-meta-pill">
                    <ToolBadge tone="success">
                      <Check className="me-1 inline h-3 w-3" aria-hidden="true" />
                      {tw("url-parser.validBadge")}
                    </ToolBadge>
                    <span aria-hidden="true">•</span>
                    <strong dir="ltr">{parts.host}</strong>
                    <span aria-hidden="true">•</span>
                    <span dir="ltr">{tw("url-parser.paramCount", { count: parts.params.length })}</span>
                  </div>
                  <div className="tp-output-viewer" role="region" aria-label={tw("url-parser.resultTitle")}>
                    <code dir="ltr">{built}</code>
                  </div>
                </div>
              ) : (
                <ToolEmpty
                  icon={<ToolIcon name="Link" />}
                  title={tw("url-parser.emptyTitle")}
                  hint={errorText || tw("url-parser.emptyHint")}
                />
              )}
            </div>
          </div>
        </section>
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
