"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

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
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [failed, setFailed] = useState(false);

  const run = (mode: "encode" | "decode") => {
    setFailed(false);

    try {
      setOutput(mode === "encode" ? encodeBase64(input) : decodeBase64(input));
    } catch {
      setOutput("");
      setFailed(true);
    }
  };

  return (
    <WorkspaceLayout
      input={
        <Textarea
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setFailed(false);
          }}
          placeholder={t("pasteText")}
          aria-label={t("pasteText")}
          spellCheck={false}
          className="min-h-[320px] resize-y font-mono text-[13px]"
        />
      }
      output={
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!input} onClick={() => run("encode")}>
              {t("encode")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!input}
              onClick={() => run("decode")}
            >
              {t("decode")}
            </Button>
          </div>

          {failed ? (
            <p role="alert" className="text-sm text-[var(--danger)]">
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
                className="min-h-[200px] resize-y bg-[var(--bg)] font-mono text-[13px]"
              />
              <div className="flex flex-wrap gap-2">
                <CopyButton text={output} label={t("copy")} copiedLabel={t("copied")} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInput("");
                    setOutput("");
                    setFailed(false);
                  }}
                >
                  {t("clear")}
                </Button>
              </div>
            </>
          ) : (
            <OutputEmpty message={t("pasteText")} className="min-h-[200px]" />
          )}
        </div>
      }
    />
  );
}
