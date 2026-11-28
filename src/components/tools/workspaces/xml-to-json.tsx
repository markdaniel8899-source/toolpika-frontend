"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  cleanParserMessage,
  convertXmlElement,
  hasXmlContent,
  XML_TO_JSON_DEFAULTS,
  type XmlElementNode,
  type XmlNode,
  type XmlToJsonOptions,
} from "./xml-to-json.logic";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book id="b1">
    <title>Private XML</title>
    <author>Ada Lovelace</author>
  </book>
  <book id="b2">
    <title>Browser Tools</title>
    <author>Grace Hopper</author>
  </book>
</library>`;

const ERROR_ID = "tp-xml-to-json-error";

interface XmlWorkspaceOptions extends XmlToJsonOptions {
  pretty: boolean;
}

const DEFAULTS: XmlWorkspaceOptions = { ...XML_TO_JSON_DEFAULTS, pretty: true };

/** Convert one DOM element into the plain tree the pure logic expects. */
function toElementNode(element: Element): XmlElementNode {
  const attributes = Array.from(element.attributes).map((attribute) => ({
    name: attribute.name,
    value: attribute.value,
  }));
  const children: XmlNode[] = Array.from(element.childNodes).map((child) => {
    if (child.nodeType === 1) return toElementNode(child as Element);
    return { type: "text", text: child.textContent ?? "" };
  });
  return {
    type: "element",
    name: element.localName || element.nodeName,
    attributes,
    children,
  };
}

type Conversion =
  | { status: "idle" }
  | { status: "error"; detail: string }
  | { status: "ready"; json: string };

export default function XmlToJson() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [input, setInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<XmlWorkspaceOptions>(
    "tp-xml-to-json-options",
    DEFAULTS,
  );

  const conversion = useMemo<Conversion>(() => {
    if (!hasXmlContent(input) || typeof DOMParser === "undefined") {
      return { status: "idle" };
    }
    const document = new DOMParser().parseFromString(input, "application/xml");
    const parserError = document.getElementsByTagName("parsererror")[0];
    if (parserError) {
      return { status: "error", detail: cleanParserMessage(parserError.textContent ?? "") };
    }
    const root = document.documentElement;
    if (!root || root.nodeName === "parsererror") {
      return { status: "error", detail: "" };
    }
    const converted = convertXmlElement(toElementNode(root), options);
    const json = options.pretty
      ? converted.json
      : JSON.stringify(converted.value);
    return { status: "ready", json };
  }, [input, options]);

  const json = conversion.status === "ready" ? conversion.json : "";
  const errorDetail = conversion.status === "error" ? conversion.detail : "";
  const hasError = conversion.status === "error";
  const errorText = hasError
    ? `${tw("xml-to-json.errorParse")}${errorDetail ? ` ${errorDetail}` : ""} ${tw("xml-to-json.fixParse")}`
    : "";

  const handleCopy = useCallback(() => {
    if (!json) return;
    void navigator.clipboard.writeText(json).catch(() => undefined);
  }, [json]);
  useCopyShortcut(handleCopy);

  const clearAll = () => {
    setInput("");
    setUploadError("");
    inputRef.current?.focus();
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setUploadError("");
    resetOptions();
    inputRef.current?.focus();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void file.text().then((text) => {
      setInput(text);
      setUploadError("");
    }).catch(() => setUploadError(tw("xml-to-json.uploadError")));
  };

  const indentOptions = [
    { value: "2", label: tw("xml-to-json.indentTwo") },
    { value: "4", label: tw("xml-to-json.indentFour") },
  ];

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true">
            <ToolIcon name="Braces" />
          </span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("xml-to-json.title")}</span>
            <span className="tp-tool-subtitle">{tw("xml-to-json.shortDesc")}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CheckboxRow
            id="tp-xml-attributes"
            label={tw("xml-to-json.includeAttributes")}
            checked={options.attributes === "prefix"}
            onChange={(checked) => update({ attributes: checked ? "prefix" : "ignore" })}
          />
          <SegmentedControl<string>
            label={tw("xml-to-json.prettyCompactLabel")}
            value={options.pretty ? "pretty" : "compact"}
            options={[
              { value: "pretty", label: tw("xml-to-json.prettyLabel") },
              { value: "compact", label: tw("xml-to-json.compactLabel") },
            ]}
            onChange={(value) => update({ pretty: value === "pretty" })}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".xml,.xsl,.svg,application/xml,text/xml"
            className="hidden"
            aria-label={tw("xml-to-json.uploadXml")}
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            {tw("xml-to-json.uploadXml")}
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={handleSample}>
            {tw("xml-to-json.trySample")}
          </Button>
        </div>
      </div>

      {(hasError || uploadError) ? (
        <p className="tp-tool-notice" id={ERROR_ID} data-tone="danger" role="alert" aria-live="polite">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {uploadError || errorText}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-xml-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-xml-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("xml-to-json.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("xml-to-json.inputHint")}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                {t("clear")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tp-xml-source" className="text-sm font-medium text-[var(--text)]">
              {tw("xml-to-json.inputTitle")}
            </label>
            <textarea
              id="tp-xml-source"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={tw("xml-to-json.placeholder")}
              className="tp-tool-editor"
              rows={12}
              dir="ltr"
              aria-label={tw("xml-to-json.inputTitle")}
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? ERROR_ID : undefined}
              spellCheck={false}
            />
            <p className="tp-tool-hint">{tw("xml-to-json.attributeHint")}</p>
          </div>

          <details className="tp-tool-group tp-tool-group--flush">
            <summary className="tp-tool-group-title">{tw("xml-to-json.advancedTitle")}</summary>
            <div className="flex flex-col gap-2 pt-3">
              <CheckboxRow
                id="tp-xml-trim"
                label={tw("xml-to-json.trimLabel")}
                checked={options.trimText}
                onChange={(trimText) => update({ trimText })}
              />
              <p className="tp-tool-hint">{tw("xml-to-json.trimHint")}</p>
              <SegmentedControl<string>
                label={tw("xml-to-json.indentLabel")}
                value={String(options.indent)}
                options={indentOptions}
                onChange={(value) => update({ indent: value === "4" ? 4 : 2 })}
              />
            </div>
          </details>

          <div className="tp-meta-pill" aria-live="polite">
            <span>{t("characters")}</span>
            <strong dir="ltr">{input.length}</strong>
            <span aria-hidden="true">•</span>
            <span>{tw("xml-to-json.options")}</span>
            <strong dir="ltr">{options.pretty
              ? tw("xml-to-json.prettyLabel")
              : tw("xml-to-json.compactLabel")}</strong>
          </div>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-auto lg:col-span-6"
          aria-labelledby="tp-xml-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-xml-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("xml-to-json.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("xml-to-json.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={json} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={json}
                fileName={tw("xml-to-json.fileName")}
                mimeType="application/json;charset=utf-8"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <div className="tp-meta-pill" aria-live="polite">
            {json ? (
              <ToolBadge tone="success">{tw("xml-to-json.readyBadge")}</ToolBadge>
            ) : null}
          </div>

          {json ? (
            <div className="tp-output-viewer" role="region" aria-label={tw("xml-to-json.resultTitle")} aria-live="polite">
              <code dir="ltr">{json}</code>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<ToolIcon name="Braces" />}
                title={tw("xml-to-json.emptyTitle")}
                hint={tw("xml-to-json.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("xml-to-json.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
