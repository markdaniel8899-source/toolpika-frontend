"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ClipboardPaste, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CodeOutput,
  SegmentedControl,
  ToolBadge,
  ToolEmpty,
  ToolPane,
  ToolShell,
  useDebounced,
  usePersistedOptions,
  useToolNotice,
} from "@/components/tools/workspace-ui";
import {
  SAMPLE_JWT,
  decodeJwt,
  isJwtError,
  type JwtClaim,
  type JwtDecoded,
  type JwtErrorCode,
} from "./jwt-decoder.logic";

type View = "header" | "payload" | "claims";
type TimeState = "expired" | "valid" | "future";
type JwtOptions = { view: View };

const DEFAULT_JWT_OPTIONS: JwtOptions = { view: "payload" };

/** atob is safe to call here: this component only runs in the browser. */
const atobAdapter = (value: string): string => atob(value);

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
}

function timeState(claim: JwtClaim, now: number): TimeState | null {
  if (claim.tone !== "time" || !claim.name) return null;
  const timestamp = Date.parse(claim.value);
  if (!Number.isFinite(timestamp)) return null;
  if (claim.name === "exp") return timestamp < now ? "expired" : "valid";
  if (claim.name === "nbf") return timestamp > now ? "future" : "valid";
  return null;
}

export default function JwtDecoder() {
  const t = useTranslations("toolUi");
  const tw = useTranslations("tools");
  const [token, setToken] = useState("");
  const { options, update } = usePersistedOptions<JwtOptions>(
    "tp-jwt-decoder-options",
    DEFAULT_JWT_OPTIONS,
  );
  const { notice, showNotice, clearNotice } = useToolNotice();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const debouncedToken = useDebounced(token);

  const claimLabel = useCallback((name?: string) => {
    switch (name) {
      case "exp":
        return tw("jwt-decoder.claimExp");
      case "iat":
        return tw("jwt-decoder.claimIat");
      case "nbf":
        return tw("jwt-decoder.claimNbf");
      case "sub":
        return tw("jwt-decoder.claimSub");
      case "iss":
        return tw("jwt-decoder.claimIss");
      case "aud":
        return tw("jwt-decoder.claimAud");
      case "jti":
        return tw("jwt-decoder.claimJti");
      case "name":
        return tw("jwt-decoder.claimName");
      case "email":
        return tw("jwt-decoder.claimEmail");
      case "scope":
        return tw("jwt-decoder.claimScope");
      default:
        return name ?? "";
    }
  }, [tw]);

  const result = useMemo(
    () => (debouncedToken.trim() ? decodeJwt(debouncedToken, atobAdapter) : null),
    [debouncedToken],
  );
  const errorCode: JwtErrorCode | null = result && isJwtError(result) ? result.code : null;
  const decoded: JwtDecoded | null = result && !isJwtError(result) ? result : null;

  const viewContent = useMemo(() => {
    if (!decoded) return "";
    if (options.view === "claims") {
      return decoded.claims.map((claim) => `${claimLabel(claim.name)}: ${claim.value}`).join("\n");
    }
    return pretty(options.view === "header" ? decoded.header : decoded.payload);
  }, [claimLabel, decoded, options.view]);

  const errorHint = (code: JwtErrorCode) => {
    if (code === "FORMAT") return tw("jwt-decoder.errorFormat");
    if (code === "BASE64") return tw("jwt-decoder.errorBase64");
    return tw("jwt-decoder.errorJson");
  };

  const handlePaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        const clean = clip.trim();
        setToken((previous) => (previous ? `${previous}\n${clean}` : clean));
      }
    } catch {
      showNotice(tw("jwt-decoder.pasteFailed"));
    }
    inputRef.current?.focus();
  }, [showNotice, tw]);

  const handleClear = useCallback(() => {
    setToken("");
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleSample = useCallback(() => {
    setToken(SAMPLE_JWT);
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  const handleReset = useCallback(() => {
    setToken("");
    clearNotice();
    inputRef.current?.focus();
  }, [clearNotice]);

  return (
    <ToolShell
      title={tw("jwt-decoder.title")}
      subtitle={tw("jwt-decoder.subtitle")}
      icon="KeyRound"
      sampleLabel={tw("jwt-decoder.trySample")}
      resetLabel={tw("jwt-decoder.reset")}
      privacyLabel={tw("jwt-decoder.privacy")}
      onSample={handleSample}
      onReset={handleReset}
      notice={notice}
      noticeTone="danger"
      input={
        <ToolPane
          id="jwt-input-title"
          title={tw("jwt-decoder.inputTitle")}
          hint={tw("jwt-decoder.inputHint")}
          actions={
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => void handlePaste()}>
                <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" />
                {tw("jwt-decoder.paste")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!token}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {t("clear")}
              </Button>
            </>
          }
        >
          <textarea
            ref={inputRef}
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
                        clearNotice();
            }}
            aria-label={tw("jwt-decoder.inputTitle")}
            aria-describedby={errorCode ? "jwt-error" : undefined}
            placeholder={tw("jwt-decoder.placeholder")}
            spellCheck={false}
            dir="ltr"
            className="tp-tool-editor"
          />
        </ToolPane>
      }
      result={
        <ToolPane
          id="jwt-result-title"
          title={tw("jwt-decoder.resultTitle")}
          result
        >
          <div className="tp-tool-group tp-tool-group--flush">
            <SegmentedControl<View>
              label={tw("jwt-decoder.resultTitle")}
              value={options.view}
              options={[
                { value: "header", label: tw("jwt-decoder.viewHeader") },
                { value: "payload", label: tw("jwt-decoder.viewPayload") },
                { value: "claims", label: tw("jwt-decoder.viewClaims") },
              ]}
              onChange={(view) => update({ view })}
            />
          </div>
          {decoded ? (
            <p className="tp-tool-notice" role="note">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {tw("jwt-decoder.notVerifiedNotice")}
            </p>
          ) : null}
          {errorCode ? (
            <p className="tp-tool-error" id="jwt-error" role="alert">
              {errorHint(errorCode)}
            </p>
          ) : null}
          {decoded ? (
            options.view === "claims" ? (
              decoded.claims.length ? (
                <ol className="tp-tool-list tp-tool-result" aria-live="polite">
                  {decoded.claims.map((claim, index) => {
                    const state = timeState(claim, decoded.now);
                    return (
                      <li className="tp-tool-row" key={`${claim.name ?? "claim"}-${index}`}>
                        <span className="tp-tool-pill">{claimLabel(claim.name)}</span>
                        <span dir="ltr">{claim.value}</span>
                        {state ? (
                          <ToolBadge
                            tone={state === "expired" ? "danger" : state === "future" ? "warning" : "success"}
                          >
                            {state === "expired"
                              ? tw("jwt-decoder.expired")
                              : state === "future"
                                ? tw("jwt-decoder.notYetValid")
                                : tw("jwt-decoder.valid")}
                          </ToolBadge>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="tp-tool-hint">{tw("jwt-decoder.claimsEmpty")}</p>
              )
            ) : (
              <CodeOutput
                code={viewContent}
                language="json"
                storageKey="tp-jwt-decoder-code-view"
                label={t("result")}
                fileName="jwt-decoded.json"
                mimeType="application/json;charset=utf-8"
              />
            )
          ) : errorCode ? (
            <ToolEmpty
              icon={<AlertCircle aria-hidden="true" />}
              title={tw("jwt-decoder.invalidTitle")}
              hint={errorHint(errorCode)}
            />
          ) : (
            <ToolEmpty
              icon={<KeyRound aria-hidden="true" />}
              title={tw("jwt-decoder.emptyTitle")}
              hint={tw("jwt-decoder.emptyHint")}
            />
          )}
        </ToolPane>
      }
    />
  );
}
