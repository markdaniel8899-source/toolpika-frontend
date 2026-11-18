"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { submitContactMessage } from "./actions";

export type ContactCopy = {
  name: string;
  email: string;
  message: string;
  submit: string;
  note: string;
};

export function ContactForm({ copy }: { copy: ContactCopy }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");

    const result = await submitContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
    });

    if (result.ok) {
      setStatus("sent");
      event.currentTarget.reset();
    } else {
      setError(result.error);
      setStatus("error");
    }
  };

  return (
    <form className="tp-atlas-card" onSubmit={handleSubmit}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="tp-atlas-input" name="name" placeholder={copy.name} required />
        <input className="tp-atlas-input" name="email" type="email" placeholder={copy.email} required />
        <textarea
          className="tp-atlas-input"
          name="message"
          rows={7}
          placeholder={copy.message}
          style={{ minHeight: 180, resize: "none" }}
          required
        />
      </div>

      {error && (
        <p role="alert" style={{ margin: "10px 0 0", color: "var(--danger)", fontSize: 12.5 }}>
          {error}
        </p>
      )}

      <button type="submit" className="tp-btn tp-btn-primary" style={{ width: "100%", marginTop: 18, height: 48 }} disabled={status === "sending"}>
        {status === "sent" ? (
          <>
            Message sent
            <Check className="tp-icon" aria-hidden="true" />
          </>
        ) : (
          <>
            {status === "sending" ? "Sending..." : copy.submit}
            <ArrowRight className="tp-icon" aria-hidden="true" />
          </>
        )}
      </button>

      <p style={{ margin: "10px 0 0", color: "var(--muted-2)", fontSize: 12.5, textAlign: "center" }}>
        {status === "sent" ? "Thanks. We will read your message." : copy.note}
      </p>
    </form>
  );
}
