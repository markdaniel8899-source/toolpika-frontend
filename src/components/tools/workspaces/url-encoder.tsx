"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { CopyButton, OutputEmpty } from "../workspace-ui";

export default function UrlEncoder() {
  const t = useTranslations("toolUi");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [failed, setFailed] = useState(false);

  const run = (mode: "encode" | "decode") => {
    setFailed(false);

    try {
      setOutput(
        mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input)
      );
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
          className="min-h-[320px]  font-mono text-[13px]"
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
              {t("urlInvalid")}
            </p>
          ) : null}

          {output ? (
            <>
              <Textarea
                value={output}
                readOnly
                aria-label={t("result")}
                spellCheck={false}
                className="min-h-[200px]  bg-[var(--bg)] font-mono text-[13px]"
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
