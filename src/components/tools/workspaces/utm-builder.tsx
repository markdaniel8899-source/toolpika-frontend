"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CheckboxRow,
  CopyButton,
  DownloadButton,
  ToolBadge,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import { buildUtmUrl, parseUtmUrl, type UtmBuildResult } from "./utm-builder.logic";

type UtmOptions = { lowerCase: boolean; keepFragment: boolean };

export default function UtmBuilder() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const { options, update, reset: resetOptions } = usePersistedOptions<UtmOptions>(
    "toolpika:utm-builder:options",
    { lowerCase: false, keepFragment: false },
  );
  const { notice, showNotice } = useToolNotice();
  const baseRef = useRef<HTMLInputElement | null>(null);

  const delayedBase = useDebounced(baseUrl);
  const delayedSource = useDebounced(source);
  const delayedMedium = useDebounced(medium);
  const delayedCampaign = useDebounced(campaign);
  const delayedTerm = useDebounced(term);
  const delayedContent = useDebounced(content);

  const calculation = useMemo<UtmBuildResult>(
    () =>
      buildUtmUrl(
        {
          baseUrl: delayedBase,
          source: delayedSource,
          medium: delayedMedium,
          campaign: delayedCampaign,
          term: delayedTerm,
          content: delayedContent,
        },
        {
          lowerCaseValues: options.lowerCase,
          keepFragment: options.keepFragment,
        },
      ),
    [
      delayedBase,
      delayedSource,
      delayedMedium,
      delayedCampaign,
      delayedTerm,
      delayedContent,
      options.lowerCase,
      options.keepFragment,
    ],
  );

  const resultText = useMemo(() => {
    if (!calculation.url) return "";
    const valueOf = (key: string) =>
      calculation.params.find((param) => param.key === key)?.value ?? "";
    return tw("utm-builder.copyText", {
      url: calculation.url,
      source: valueOf("utm_source"),
      medium: valueOf("utm_medium"),
      campaign: valueOf("utm_campaign"),
    });
  }, [calculation, tw]);

  const handleCopy = useCallback(() => {
    if (!resultText) return;
    void (async () => {
      try {
        await navigator.clipboard.writeText(resultText);
      } catch {
        showNotice(tw("utm-builder.clipboardUnavailable"));
      }
    })();
  }, [resultText, showNotice, tw]);

  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setBaseUrl("https://example.com/pricing?ref=home");
    setSource("newsletter");
    setMedium("email");
    setCampaign("spring_sale");
    setTerm("");
    setContent("");
  }, []);

  const handleClear = useCallback(() => {
    setBaseUrl("");
    setSource("");
    setMedium("");
    setCampaign("");
    setTerm("");
    setContent("");
    baseRef.current?.focus();
  }, []);

  const handlePasteUrl = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      const parsed = parseUtmUrl(clip);
      if (!parsed) {
        showNotice(tw("utm-builder.pasteInvalid"));
      } else {
        setBaseUrl(parsed.baseUrl);
        setSource(parsed.source);
        setMedium(parsed.medium);
        setCampaign(parsed.campaign);
        setTerm(parsed.term);
        setContent(parsed.content);
      }
    } catch {
      showNotice(tw("utm-builder.clipboardUnavailable"));
    }
    baseRef.current?.focus();
  }, [showNotice, tw]);

  const errorHint =
    calculation.error === "INVALID_URL"
      ? tw("utm-builder.errorInvalidUrl")
      : calculation.error === "MISSING_REQUIRED"
        ? tw("utm-builder.errorRequired")
        : "";

  const requiredError = (value: string, fieldLabel: string) =>
    calculation.error === "MISSING_REQUIRED" && !value.trim()
      ? tw("utm-builder.errorRequiredField", { field: fieldLabel })
      : "";

  const statusBadge =
    calculation.error === "INVALID_URL" || calculation.error === "MISSING_REQUIRED" ? (
      <ToolBadge tone="danger">{tw("utm-builder.statusError")}</ToolBadge>
    ) : calculation.url ? (
      <ToolBadge tone="success">{tw("utm-builder.statusReady")}</ToolBadge>
    ) : (
      <ToolBadge>{tw("utm-builder.statusIdle")}</ToolBadge>
    );

  return (
    <ToolShell
      title={tw("utm-builder.title")}
      icon="Link2"
      sampleLabel={tw("utm-builder.trySample")}
      resetLabel={tw("utm-builder.reset")}
      privacyLabel={tw("privacyRibbon")}
      shortcutHint={tw("utm-builder.shortcutHint")}
      onSample={handleSample}
      onReset={handleClear}
      notice={notice}
      noticeTone="warning"
      input={
        <ToolPane
          id="tp-utm-input-title"
          title={tw("utm-builder.inputTitle")}
          hint={tw("utm-builder.inputHint")}
          actions={
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handlePasteUrl()}
              >
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("utm-builder.pasteUrl")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!baseUrl && !source && !medium && !campaign && !term && !content}
              >
                {t("clear")}
              </Button>
            </>
          }
          footer={<span>{tw("utm-builder.fieldNote")}</span>}
        >
          <ToolField
            label={tw("utm-builder.baseUrlLabel")}
            htmlFor="tp-utm-base"
            hint={tw("utm-builder.baseUrlHint")}
          >
            <input
              id="tp-utm-base"
              ref={baseRef}
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="tp-tool-field"
              placeholder={tw("utm-builder.baseUrlPlaceholder")}
              value={baseUrl}
              aria-invalid={calculation.error === "INVALID_URL" || (calculation.error === "MISSING_REQUIRED" && !baseUrl.trim())}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
            {errorHint ? (
              <p className="tp-tool-error" role="alert">
                {errorHint}
              </p>
            ) : null}
            {requiredError(baseUrl, tw("utm-builder.baseUrlLabel")) ? (
              <p className="tp-tool-error" role="alert">
                {requiredError(baseUrl, tw("utm-builder.baseUrlLabel"))}
              </p>
            ) : null}
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("utm-builder.sourceLabel")} htmlFor="tp-utm-source">
              <input
                id="tp-utm-source"
                className="tp-tool-field"
                placeholder={tw("utm-builder.sourcePlaceholder")}
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />
              {requiredError(source, tw("utm-builder.sourceLabel")) ? (
                <p className="tp-tool-error">{requiredError(source, tw("utm-builder.sourceLabel"))}</p>
              ) : null}
            </ToolField>

            <ToolField label={tw("utm-builder.mediumLabel")} htmlFor="tp-utm-medium">
              <input
                id="tp-utm-medium"
                className="tp-tool-field"
                placeholder={tw("utm-builder.mediumPlaceholder")}
                value={medium}
                onChange={(event) => setMedium(event.target.value)}
              />
              {requiredError(medium, tw("utm-builder.mediumLabel")) ? (
                <p className="tp-tool-error">{requiredError(medium, tw("utm-builder.mediumLabel"))}</p>
              ) : null}
            </ToolField>

            <ToolField label={tw("utm-builder.campaignLabel")} htmlFor="tp-utm-campaign">
              <input
                id="tp-utm-campaign"
                className="tp-tool-field"
                placeholder={tw("utm-builder.campaignPlaceholder")}
                value={campaign}
                onChange={(event) => setCampaign(event.target.value)}
              />
              {requiredError(campaign, tw("utm-builder.campaignLabel")) ? (
                <p className="tp-tool-error">{requiredError(campaign, tw("utm-builder.campaignLabel"))}</p>
              ) : null}
            </ToolField>

            <ToolField
              label={tw("utm-builder.termLabel")}
              htmlFor="tp-utm-term"
              hint={tw("utm-builder.optionalHint")}
            >
              <input
                id="tp-utm-term"
                className="tp-tool-field"
                placeholder={tw("utm-builder.termPlaceholder")}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
              />
            </ToolField>

            <ToolField
              label={tw("utm-builder.contentLabel")}
              htmlFor="tp-utm-content"
              hint={tw("utm-builder.optionalHint")}
            >
              <input
                id="tp-utm-content"
                className="tp-tool-field"
                placeholder={tw("utm-builder.contentPlaceholder")}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </ToolField>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-utm-result-title"
          title={tw("utm-builder.resultTitle")}
          hint={tw("utm-builder.resultHint")}
          result
          actions={
            <>
              {statusBadge}
              <CopyButton
                text={resultText}
                label={t("copy")}
                copiedLabel={t("copied")}
              />
              <DownloadButton
                content={resultText}
                fileName={tw("utm-builder.fileName")}
                label={t("download")}
                disabled={!resultText}
              />
            </>
          }
          footer={<span>{tw("utm-builder.resultNote")}</span>}
        >
          {calculation.url ? (
            <div className="tp-tool-result">
              <div className="tp-tool-url">
                <code aria-live="polite">{calculation.url}</code>
              </div>

              <div className="flex flex-col gap-1">
                <span className="tp-tool-label">{tw("utm-builder.paramsTitle")}</span>
                <ul className="tp-tool-list">
                  {calculation.params.map((param) => (
                    <li className="tp-tool-row" key={param.key}>
                      <span>{param.key}</span>
                      <strong>{param.value}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <ToolEmpty
              icon={<Link2 />}
              title={calculation.error === "EMPTY" ? tw("utm-builder.emptyTitle") : tw("utm-builder.errorTitle")}
              hint={calculation.error === "EMPTY" ? tw("utm-builder.emptyHint") : errorHint}
            />
          )}
        </ToolPane>
      }
      options={
        <>
          <div className="tp-tool-options-head">
            <h3>{tw("utm-builder.optionsTitle")}</h3>
            <Button type="button" variant="ghost" size="sm" onClick={resetOptions}>
              {tw("utm-builder.resetOptions")}
            </Button>
          </div>
          <div className="tp-tool-options-grid">
            <CheckboxRow
              id="tp-utm-lower"
              label={tw("utm-builder.lowerCaseLabel")}
              checked={options.lowerCase}
              onChange={(checked) => update({ lowerCase: checked })}
            />
            <CheckboxRow
              id="tp-utm-fragment"
              label={tw("utm-builder.keepFragmentLabel")}
              checked={options.keepFragment}
              onChange={(checked) => update({ keepFragment: checked })}
            />
          </div>
        </>
      }
    />
  );
}
