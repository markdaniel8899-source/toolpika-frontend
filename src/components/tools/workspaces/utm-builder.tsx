"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CopyButton,
  DownloadButton,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import { buildUtmUrl, parseUtmUrl, type UtmBuildResult } from "./utm-builder.logic";

const ERROR_ID = "tp-utm-error";

export default function UtmBuilder() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [baseUrl, setBaseUrl] = useState("");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
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
      buildUtmUrl({
        baseUrl: delayedBase,
        source: delayedSource,
        medium: delayedMedium,
        campaign: delayedCampaign,
        term: delayedTerm,
        content: delayedContent,
      }),
    [
      delayedBase,
      delayedSource,
      delayedMedium,
      delayedCampaign,
      delayedTerm,
      delayedContent,
    ],
  );

  const resultText = calculation.url;

  const errorText =
    calculation.error === "INVALID_URL"
      ? tw("utm-builder.errorInvalidUrl")
      : calculation.error === "MISSING_REQUIRED"
        ? tw("utm-builder.errorRequired")
        : "";

  const missingRequired = calculation.error === "MISSING_REQUIRED";
  const describedBy = errorText ? ERROR_ID : undefined;

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
        >
          <ToolField label={tw("utm-builder.baseUrlLabel")} htmlFor="tp-utm-base">
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
              aria-invalid={calculation.error === "INVALID_URL" || missingRequired}
              aria-describedby={describedBy}
              onChange={(event) => setBaseUrl(event.target.value)}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField label={tw("utm-builder.sourceLabel")} htmlFor="tp-utm-source">
              <input
                id="tp-utm-source"
                className="tp-tool-field"
                placeholder={tw("utm-builder.sourcePlaceholder")}
                value={source}
                aria-invalid={missingRequired}
                aria-describedby={describedBy}
                onChange={(event) => setSource(event.target.value)}
              />
            </ToolField>

            <ToolField label={tw("utm-builder.mediumLabel")} htmlFor="tp-utm-medium">
              <input
                id="tp-utm-medium"
                className="tp-tool-field"
                placeholder={tw("utm-builder.mediumPlaceholder")}
                value={medium}
                aria-invalid={missingRequired}
                aria-describedby={describedBy}
                onChange={(event) => setMedium(event.target.value)}
              />
            </ToolField>

            <ToolField label={tw("utm-builder.campaignLabel")} htmlFor="tp-utm-campaign">
              <input
                id="tp-utm-campaign"
                className="tp-tool-field"
                placeholder={tw("utm-builder.campaignPlaceholder")}
                value={campaign}
                aria-invalid={missingRequired}
                aria-describedby={describedBy}
                onChange={(event) => setCampaign(event.target.value)}
              />
            </ToolField>

            <ToolField label={tw("utm-builder.termLabel")} htmlFor="tp-utm-term">
              <input
                id="tp-utm-term"
                className="tp-tool-field"
                placeholder={tw("utm-builder.termPlaceholder")}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
              />
            </ToolField>

            <ToolField label={tw("utm-builder.contentLabel")} htmlFor="tp-utm-content">
              <input
                id="tp-utm-content"
                className="tp-tool-field"
                placeholder={tw("utm-builder.contentPlaceholder")}
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </ToolField>
          </div>

          {errorText ? (
            <p
              id={ERROR_ID}
              className="tp-tool-error"
              role="status"
              aria-live="polite"
            >
              {errorText}
            </p>
          ) : null}
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
        >
          {resultText ? (
            <div className="tp-tool-result">
              <div className="tp-tool-url">
                <code aria-live="polite">{resultText}</code>
              </div>
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Link2 />}
                title={tw("utm-builder.emptyTitle")}
                hint={tw("utm-builder.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
