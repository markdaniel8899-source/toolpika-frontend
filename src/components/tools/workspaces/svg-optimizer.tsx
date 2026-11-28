"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent as ReactDragEvent } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, Code, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolIcon } from "@/components/tools/tool-icon";
import {
  CopyButton,
  DownloadButton,
  SegmentedControl,
  ToolEmpty,
  usePersistedOptions,
} from "../workspace-ui";
import {
  DEFAULT_SVG_OPTIMIZE_OPTIONS,
  optimizeSvg,
  SAMPLE_SVG,
  SvgOptimizeError,
  type SvgOptimizeOptions,
  type SvgOptimizeResult,
} from "./svg-optimizer.logic";

type Evaluation =
  | { result: SvgOptimizeResult; error: "" }
  | { result: null; error: string };
type OutputTab = "code" | "preview";

export default function SvgOptimizer() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const { options, update } = usePersistedOptions<SvgOptimizeOptions>(
    "toolpika:svg-optimizer",
    DEFAULT_SVG_OPTIMIZE_OPTIONS,
  );

  const [input, setInput] = useState("");
  const [tab, setTab] = useState<OutputTab>("code");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const evaluation = useMemo<Evaluation>(() => {
    if (!input.trim()) return { result: null, error: "" };
    try {
      return { result: optimizeSvg(input, options), error: "" };
    } catch (caught) {
      if (caught instanceof SvgOptimizeError) {
        const code = caught.code;
        if (code === "TOO_LARGE") {
          return {
            result: null,
            error: `${tw("svg-optimizer.errorTooLarge")} ${tw("svg-optimizer.fixTooLarge")}`,
          };
        }
        if (code === "NOT_SVG") {
          return {
            result: null,
            error: `${tw("svg-optimizer.errorRoot")} ${tw("svg-optimizer.fixRoot")}`,
          };
        }
        if (code === "UNBALANCED") {
          return {
            result: null,
            error: `${tw("svg-optimizer.errorUnbalanced")} ${tw("svg-optimizer.fixUnbalanced")}`,
          };
        }
      }
      return {
        result: null,
        error: `${tw("svg-optimizer.errorGeneric")} ${tw("svg-optimizer.fixGeneric")}`,
      };
    }
  }, [input, options, tw]);

  const result = evaluation.result;
  const output = result?.output ?? "";

  const handleSample = () => {
    setInput(SAMPLE_SVG);
    setTab("code");
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInput("");
    setTab("code");
    setDragging(false);
    inputRef.current?.focus();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void file.text().then((text) => {
      setInput(text);
      setTab("code");
    });
  };

  const dropHandlers = {
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      void file.text().then((text) => {
        setInput(text);
        setTab("code");
      });
    },
  };

  const describedBy = evaluation.error ? "tp-svg-optimizer-error" : undefined;
  const activeLabel = tab === "code"
    ? tw("svg-optimizer.outputLabel")
    : tw("svg-optimizer.previewAlt");

  return (
    <div className="tp-tool">
      <div className="tp-industrial-bar tp-tool-bar">
        <div className="tp-tool-identity">
          <span className="tp-tool-mark" aria-hidden="true"><ToolIcon name="Code" /></span>
          <span className="tp-tool-identity-text">
            <span className="tp-tool-name">{tw("svg-optimizer.title")}</span>
            <span className="tp-tool-subtitle">{tw("svg-optimizer.shortDesc")}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {result ? (
            <div className="tp-meta-pill" aria-live="polite">
              <span>{tw("svg-optimizer.beforeLabel")}</span>
              <span dir="ltr">{result.inputBytes} B</span>
              <span aria-hidden="true">•</span>
              <span>{tw("svg-optimizer.afterLabel")}</span>
              <span dir="ltr">{result.outputBytes} B</span>
              <span aria-hidden="true">•</span>
              <span>{tw("svg-optimizer.savedLabel")}</span>
              <strong dir="ltr">{result.savedPercent}%</strong>
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-1.5">
            <Button type="button" size="sm" onClick={handleSample}>
              {tw("svg-optimizer.trySample")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!input}>
              {t("clear")}
            </Button>
          </div>
        </div>
      </div>

      {evaluation.error ? (
        <p
          className="tp-tool-notice"
          id="tp-svg-optimizer-error"
          data-tone="warning"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {evaluation.error}
        </p>
      ) : null}

      <div className="tp-industrial grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-svg-optimizer-input-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-svg-optimizer-input-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("svg-optimizer.inputTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("svg-optimizer.inputHint")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("options")}>
            <Button type="button" size="sm" variant={options.removeComments ? "default" : "secondary"} aria-pressed={options.removeComments} onClick={() => update({ removeComments: !options.removeComments })}>{tw("svg-optimizer.removeComments")}</Button>
            <Button type="button" size="sm" variant={options.removeMetadata ? "default" : "secondary"} aria-pressed={options.removeMetadata} onClick={() => update({ removeMetadata: !options.removeMetadata })}>{tw("svg-optimizer.removeMetadata")}</Button>
            <Button type="button" size="sm" variant={options.collapseWhitespace ? "default" : "secondary"} aria-pressed={options.collapseWhitespace} onClick={() => update({ collapseWhitespace: !options.collapseWhitespace })}>{tw("svg-optimizer.collapseWhitespace")}</Button>
            <Button type="button" size="sm" variant={options.jsxAttributes ? "default" : "secondary"} aria-pressed={options.jsxAttributes} onClick={() => update({ jsxAttributes: !options.jsxAttributes })}>{tw("svg-optimizer.jsxAttributes")}</Button>
          </div>

          <div className="tp-tool-drop tp-tool-drop--compact" data-dragging={dragging ? "true" : undefined} {...dropHandlers}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            <p className="tp-tool-hint">{tw("svg-optimizer.dropShort")}</p>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
              {tw("svg-optimizer.chooseSvg")}
            </Button>
          </div>
          <input
            ref={fileRef}
            id="tp-svg-optimizer-file"
            type="file"
            accept=".svg,image/svg+xml"
            className="sr-only"
            onChange={handleFile}
            aria-label={tw("svg-optimizer.chooseSvg")}
          />

          <textarea
            id="tp-svg-optimizer-input"
            ref={inputRef}
            className="tp-tool-editor"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("startTyping")}
            aria-label={tw("svg-optimizer.svgLabel")}
            aria-invalid={Boolean(evaluation.error)}
            aria-describedby={describedBy}
            spellCheck={false}
            dir="ltr"
          />

          <p className="tp-tool-hint">{tw("svg-optimizer.optionsHint")}</p>
        </section>

        <section
          className="flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden lg:col-span-6"
          aria-labelledby="tp-svg-optimizer-result-title"
        >
          <div className="tp-industrial-bar">
            <div>
              <h3 id="tp-svg-optimizer-result-title" className="text-sm font-semibold text-[var(--text)]">
                {tw("svg-optimizer.resultTitle")}
              </h3>
              <p className="tp-tool-hint">{tw("svg-optimizer.resultHint")}</p>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
              <DownloadButton
                content={output}
                fileName="optimized.svg"
                mimeType="image/svg+xml;charset=utf-8"
                label={t("download")}
                variant="default"
              />
            </div>
          </div>

          <SegmentedControl<OutputTab>
            label={tw("svg-optimizer.resultTitle")}
            value={tab}
            options={[
              { value: "code", label: tw("svg-optimizer.tabCode") },
              { value: "preview", label: tw("svg-optimizer.tabPreview") },
            ]}
            onChange={setTab}
          />

          {result ? (
            <div className="flex min-h-0 flex-1 flex-col" aria-live="polite">
              {tab === "code" ? (
                <div className="tp-output-viewer" role="region" aria-label={activeLabel}>
                  <code dir="ltr">{output}</code>
                </div>
              ) : (
                <div
                  className="tp-stage"
                  role="img"
                  aria-label={activeLabel}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(output)}`}
                    alt={tw("svg-optimizer.previewAlt")}
                    className="max-h-[46vh] max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div aria-live="polite">
              <ToolEmpty
                icon={<Code aria-hidden="true" />}
                title={tw("svg-optimizer.emptyTitle")}
                hint={tw("svg-optimizer.emptyHint")}
              />
            </div>
          )}
        </section>
      </div>

      <div className="tp-tool-ribbon">
        <span className="tp-tool-ribbon-note">
          <Check className="h-[13px] w-[13px]" aria-hidden="true" />
          {tw("svg-optimizer.privacyRibbon")}
        </span>
      </div>
    </div>
  );
}
