"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  usePersistedOptions,
} from "@/components/tools/workspace-ui";
import {
  cleanParserMessage,
  convertXmlElement,
  hasXmlContent,
  XML_TO_JSON_DEFAULTS,
  type AttributeMode,
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
  const [input, setInput] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<XmlToJsonOptions>(
    "tp-xml-to-json-options",
    XML_TO_JSON_DEFAULTS,
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
    return { status: "ready", json: convertXmlElement(toElementNode(root), options).json };
  }, [input, options]);

  const json = conversion.status === "ready" ? conversion.json : "";
  const errorDetail = conversion.status === "error" ? conversion.detail : "";
  const hasError = conversion.status === "error";

  const handleCopy = useCallback(() => {
    if (!json) return;
    void navigator.clipboard.writeText(json).catch(() => undefined);
  }, [json]);
  useCopyShortcut(handleCopy);

  const handleSample = () => {
    setInput(SAMPLE);
    resetOptions();
  };

  const handleReset = () => {
    setInput("");
    resetOptions();
  };

  const attributeOptions: { value: AttributeMode; label: string }[] = [
    { value: "prefix", label: tw("xml-to-json.attributePrefix") },
    { value: "ignore", label: tw("xml-to-json.attributeIgnore") },
  ];
  const indentOptions = [
    { value: "2", label: tw("xml-to-json.indentTwo") },
    { value: "4", label: tw("xml-to-json.indentFour") },
  ];

  return (
    <ToolShell
      title={tw("xml-to-json.title")}
      subtitle={tw("xml-to-json.shortDesc")}
      icon="Braces"
      sampleLabel={tw("xml-to-json.trySample")}
      resetLabel={tw("xml-to-json.reset")}
      privacyLabel={tw("xml-to-json.privacyRibbon")}
      onSample={handleSample}
      onReset={handleReset}
      input={
        <ToolPane
          id="tp-xml-to-json-input-title"
          title={tw("xml-to-json.inputTitle")}
          hint={tw("xml-to-json.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!input}
              onClick={() => setInput("")}
            >
              {t("clear")}
            </Button>
          }
        >
          <textarea
            id="tp-xml-to-json-source"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={tw("xml-to-json.placeholder")}
            aria-label={tw("xml-to-json.inputTitle")}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? ERROR_ID : undefined}
            spellCheck={false}
            className="tp-tool-editor"
          />

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("xml-to-json.options")}</span>
            <SegmentedControl<AttributeMode>
              label={tw("xml-to-json.attributeLabel")}
              value={options.attributes}
              options={attributeOptions}
              onChange={(attributes) => update({ attributes })}
            />
            <p className="tp-tool-hint">{tw("xml-to-json.attributeHint")}</p>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("xml-to-json.textTitle")}</span>
            <CheckboxRow
              id="tp-xml-to-json-trim"
              label={tw("xml-to-json.trimLabel")}
              checked={options.trimText}
              onChange={(trimText) => update({ trimText })}
            />
            <p className="tp-tool-hint">{tw("xml-to-json.trimHint")}</p>
          </div>

          <div className="tp-tool-group tp-tool-group--flush">
            <span className="tp-tool-group-title">{tw("xml-to-json.indentLabel")}</span>
            <SegmentedControl<string>
              label={tw("xml-to-json.indentLabel")}
              value={String(options.indent)}
              options={indentOptions}
              onChange={(value) => update({ indent: value === "4" ? 4 : 2 })}
            />
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-xml-to-json-result-title"
          title={tw("xml-to-json.resultTitle")}
          hint={tw("xml-to-json.resultHint")}
          result
          actions={
            <>
              <CopyButton text={json} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={json}
                fileName={tw("xml-to-json.fileName")}
                label={t("download")}
              />
            </>
          }
          footer={
            json ? <ToolBadge tone="success">{tw("xml-to-json.readyBadge")}</ToolBadge> : null
          }
        >
          {hasError ? (
            <p id={ERROR_ID} className="tp-tool-error" role="alert" aria-live="polite">
              {tw("xml-to-json.errorParse")}
              {errorDetail ? ` ${errorDetail}` : ""}
              {" "}
              {tw("xml-to-json.fixParse")}
            </p>
          ) : null}
          {json ? (
            <div className="tp-tool-result" aria-live="polite">
              <textarea
                value={json}
                readOnly
                aria-label={tw("xml-to-json.resultTitle")}
                spellCheck={false}
                dir="ltr"
                className="tp-tool-editor"
              />
            </div>
          ) : hasError ? null : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Code aria-hidden="true" />}
                title={tw("xml-to-json.emptyTitle")}
                hint={tw("xml-to-json.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
