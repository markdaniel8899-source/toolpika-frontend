"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardPaste, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

const SAMPLE = "Hello world";

function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeBase64(text: string) {
  const compact = text.replace(/\s+/gu, "");

  if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(compact)) {
    throw new Error("invalid_base64");
  }

  const binary = atob(compact);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Encoder() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<"encode" | "decode" | null>(null);

  const handleReset = () => {
    setInput("");
    setOutput("");
    setFailed(false);
    setMode(null);
  };

  const handleSample = () => {
    setInput(SAMPLE);
    setOutput("");
    setFailed(false);
    setMode("encode");
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInput((previous) => (previous ? `${previous}\n${clip}` : clip));
        setOutput("");
        setFailed(false);
        setMode(null);
      }
    } catch {
      // Clipboard permission can be denied; the editor remains usable.
    }
  };

  const run = (next: "encode" | "decode") => {
    setFailed(false);
    try {
      setOutput(next === "encode" ? encodeBase64(input) : decodeBase64(input));
      setMode(next);
    } catch {
      setOutput("");
      setFailed(true);
      setMode(null);
    }
  };

  return (
    <WorkspaceLayout
      title={tw("base64-encoder.title")}
      icon="Copy"
      onReset={handleReset}
      onSample={handleSample}
      statusRight={output ? `${output.length} ${t("characters")}` : undefined}
      input={
        <div className="flex flex-col gap-3">
          <div className="tp-workspace-inline-actions" style={{ marginTop: 0 }}>
            <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
              <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("paste")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!input}
              onClick={() => {
                setInput("");
                setOutput("");
                setFailed(false);
                setMode(null);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("clear")}
            </Button>
          </div>
          <Textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOutput("");
              setFailed(false);
              setMode(null);
            }}
            placeholder={t("startTyping")}
            aria-label={t("pasteText")}
            spellCheck={false}
            className="min-h-[300px] font-mono text-[13px]"
          />
          <p className="tp-workspace-hint" aria-live="polite">
            {input.length} {t("characters").toLowerCase()}
          </p>
        </div>
      }
      output={
        <div className="flex flex-col gap-4" aria-live="polite">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "encode" ? "default" : "secondary"}
              aria-pressed={mode === "encode"}
              disabled={!input}
              onClick={() => run("encode")}
            >
              {t("encode")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "decode" ? "default" : "secondary"}
              aria-pressed={mode === "decode"}
              disabled={!input}
              onClick={() => run("decode")}
            >
              {t("decode")}
            </Button>
          </div>

          {failed ? (
            <p role="alert" className="tp-workspace-error">
              {t("base64Invalid")}
            </p>
          ) : null}

          {output ? (
            <>
              <Textarea
                value={output}
                readOnly
                aria-label={t("result")}
                spellCheck={false}
                className="min-h-[180px] bg-[var(--bg)] font-mono text-[13px]"
              />
              <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
            </>
          ) : (
            <OutputEmpty message={tw("resultEmpty")} className="min-h-[200px]" />
          )}
        </div>
      }
    />
  );
}
