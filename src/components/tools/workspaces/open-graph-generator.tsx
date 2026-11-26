"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CodeOutput,
  selectClassName,
  Stat,
  ToolEmpty,
  ToolField,
  ToolPane,
  ToolShell,
  useCopyShortcut,
  useDebounced,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  buildOpenGraphTags,
  type OgType,
  type TwitterCard,
} from "./open-graph-generator.logic";

const OG_TYPES: OgType[] = ["website", "article", "product", "profile"];
const CARD_TYPES: TwitterCard[] = [
  "summary",
  "summary_large_image",
  "app",
  "player",
];

export default function OpenGraphGenerator() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<OgType>("website");
  const [image, setImage] = useState("");
  const [card, setCard] = useState<TwitterCard>("summary_large_image");
  const { notice, showNotice } = useToolNotice();

  const delayedTitle = useDebounced(title);
  const delayedDescription = useDebounced(description);
  const delayedUrl = useDebounced(url);
  const delayedImage = useDebounced(image);

  const result = useMemo(
    () =>
      buildOpenGraphTags({
        title: delayedTitle,
        description: delayedDescription,
        url: delayedUrl,
        type,
        image: delayedImage,
        twitterCard: card,
      }),
    [delayedTitle, delayedDescription, delayedUrl, type, delayedImage, card],
  );

  const code = result.html;

  const handleCopy = useCallback(() => {
    if (!code) return;
    void (async () => {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        showNotice(tw("open-graph-generator.clipboardUnavailable"));
      }
    })();
  }, [code, showNotice, tw]);

  useCopyShortcut(handleCopy);

  const handleSample = useCallback(() => {
    setTitle(tw("open-graph-generator.sampleTitle"));
    setDescription(tw("open-graph-generator.sampleDescription"));
    setUrl(tw("open-graph-generator.sampleUrl"));
    setType("article");
    setImage(tw("open-graph-generator.sampleImage"));
    setCard("summary_large_image");
  }, [tw]);

  const handleClear = useCallback(() => {
    setTitle("");
    setDescription("");
    setUrl("");
    setType("website");
    setImage("");
    setCard("summary_large_image");
  }, []);

  const typeOptions = [
    { value: OG_TYPES[0], label: tw("open-graph-generator.typeWebsite") },
    { value: OG_TYPES[1], label: tw("open-graph-generator.typeArticle") },
    { value: OG_TYPES[2], label: tw("open-graph-generator.typeProduct") },
    { value: OG_TYPES[3], label: tw("open-graph-generator.typeProfile") },
  ];
  const cardOptions = [
    { value: CARD_TYPES[0], label: tw("open-graph-generator.cardSummary") },
    { value: CARD_TYPES[1], label: tw("open-graph-generator.cardSummaryLarge") },
    { value: CARD_TYPES[2], label: tw("open-graph-generator.cardApp") },
    { value: CARD_TYPES[3], label: tw("open-graph-generator.cardPlayer") },
  ];

  const isEmpty = !title && !description && !url && !image;

  return (
    <ToolShell
      title={tw("open-graph-generator.title")}
      subtitle={tw("open-graph-generator.subtitle")}
      icon="Globe"
      sampleLabel={tw("open-graph-generator.trySample")}
      resetLabel={tw("open-graph-generator.reset")}
      privacyLabel={tw("privacyRibbon")}
      onSample={handleSample}
      onReset={handleClear}
      notice={notice}
      noticeTone="warning"
      input={
        <ToolPane
          id="tp-open-graph-input-title"
          title={tw("open-graph-generator.inputTitle")}
          hint={tw("open-graph-generator.inputHint")}
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isEmpty}
              aria-label={t("clear")}
            >
              {t("clear")}
            </Button>
          }
        >
          <ToolField
            label={tw("open-graph-generator.titleLabel")}
            htmlFor="tp-og-title"
          >
            <input
              id="tp-og-title"
              className="tp-tool-field"
              type="text"
              value={title}
              placeholder={tw("open-graph-generator.titlePlaceholder")}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setTitle(event.target.value)}
            />
          </ToolField>

          <ToolField
            label={tw("open-graph-generator.descriptionLabel")}
            htmlFor="tp-og-description"
          >
            <textarea
              id="tp-og-description"
              className="tp-tool-editor"
              rows={3}
              value={description}
              placeholder={tw("open-graph-generator.descriptionPlaceholder")}
              spellCheck={false}
              onChange={(event) => setDescription(event.target.value)}
            />
          </ToolField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ToolField
              label={tw("open-graph-generator.urlLabel")}
              htmlFor="tp-og-url"
            >
              <input
                id="tp-og-url"
                className="tp-tool-field"
                type="url"
                inputMode="url"
                value={url}
                placeholder={tw("open-graph-generator.urlPlaceholder")}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setUrl(event.target.value)}
              />
            </ToolField>

            <ToolField
              label={tw("open-graph-generator.typeLabel")}
              htmlFor="tp-og-type"
              hint={tw("open-graph-generator.typeHint")}
            >
              <select
                id="tp-og-type"
                className={selectClassName}
                value={type}
                onChange={(event) => setType(event.target.value as OgType)}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ToolField>

            <ToolField
              label={tw("open-graph-generator.imageLabel")}
              htmlFor="tp-og-image"
              hint={tw("open-graph-generator.imageHint")}
            >
              <input
                id="tp-og-image"
                className="tp-tool-field"
                type="url"
                inputMode="url"
                value={image}
                placeholder={tw("open-graph-generator.imagePlaceholder")}
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setImage(event.target.value)}
              />
            </ToolField>

            <ToolField
              label={tw("open-graph-generator.cardLabel")}
              htmlFor="tp-og-card"
              hint={tw("open-graph-generator.cardHint")}
            >
              <select
                id="tp-og-card"
                className={selectClassName}
                value={card}
                onChange={(event) => setCard(event.target.value as TwitterCard)}
              >
                {cardOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ToolField>
          </div>
        </ToolPane>
      }
      result={
        <ToolPane
          id="tp-open-graph-result-title"
          title={tw("open-graph-generator.resultTitle")}
          hint={tw("open-graph-generator.resultHint")}
          result
        >
          {code ? (
            <div className="tp-tool-result" aria-live="polite">
              <dl className="tp-tool-stats">
                <Stat
                  label={tw("open-graph-generator.tagCountLabel")}
                  value={result.tagCount}
                />
              </dl>
              <CodeOutput
                code={code}
                language="html"
                label={t("result")}
                fileName={tw("open-graph-generator.fileName")}
                mimeType="text/html;charset=utf-8"
              />
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Globe aria-hidden="true" />}
                title={tw("open-graph-generator.emptyTitle")}
                hint={tw("open-graph-generator.emptyHint")}
              />
            </div>
          )}
        </ToolPane>
      }
    />
  );
}
