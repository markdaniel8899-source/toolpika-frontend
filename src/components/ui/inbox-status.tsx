import { AlertCircle, CheckCircle2 } from "lucide-react";

/** Shared success/error message for the request and contact forms. */
export function InboxStatus({
  state,
  message,
}: {
  state: "idle" | "sending" | "sent" | "error";
  message: string;
}) {
  if (state !== "sent" && state !== "error") {
    if (state === "sending") {
      return (
        <p role="status" style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 12.5 }}>
          Sending...
        </p>
      );
    }
    return null;
  }

  const isError = state === "error";

  return (
    <p
      role={isError ? "alert" : "status"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        margin: "10px 0 0",
        color: isError ? "var(--danger)" : "var(--success)",
        fontSize: 12.5,
        lineHeight: 1.5,
      }}
    >
      {isError ? (
        <AlertCircle className="tp-icon" style={{ width: 14, height: 14 }} aria-hidden="true" />
      ) : (
        <CheckCircle2 className="tp-icon" style={{ width: 14, height: 14 }} aria-hidden="true" />
      )}
      {message}
    </p>
  );
}
