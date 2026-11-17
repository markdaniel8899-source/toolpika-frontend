"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceLayout } from "../workspace-layout";
import { Stat } from "../workspace-ui";

export default function WordCounter() {
  const t = useTranslations("toolUi");
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/gu, "").length;
    const sentences = trimmed
      ? text.split(/[.!?…]+/u).filter((part) => part.trim().length > 0).length
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n\s*\n/).filter((part) => part.trim().length > 0).length
      : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));

    return { words, characters, charactersNoSpaces, sentences, paragraphs, lines, minutes };
  }, [text]);

  return (
    <WorkspaceLayout
      input={
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("pasteText")}
          aria-label={t("pasteText")}
          className="min-h-[320px] resize-y"
        />
      }
      output={
        <dl className="grid grid-cols-2 gap-3">
          <Stat label={t("words")} value={stats.words} />
          <Stat label={t("characters")} value={stats.characters} />
          <Stat label={t("charactersNoSpaces")} value={stats.charactersNoSpaces} />
          <Stat label={t("sentences")} value={stats.sentences} />
          <Stat label={t("paragraphs")} value={stats.paragraphs} />
          <Stat label={t("lines")} value={stats.lines} />
          <div className="col-span-2">
            <Stat
              label={t("readingTime")}
              value={t("minuteShort", { count: stats.minutes })}
            />
          </div>
        </dl>
      }
    />
  );
}
