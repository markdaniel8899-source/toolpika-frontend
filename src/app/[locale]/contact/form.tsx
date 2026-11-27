"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { InboxStatus } from "@/components/ui/inbox-status";
import { submitInbox } from "@/lib/inbox/submit";

export type ContactCopy = {
  name: string;
  email: string;
  message: string;
  submit: string;
  note: string;
  sending: string;
  sent: string;
  genericError: string;
};

export function ContactForm({ copy }: { copy: ContactCopy }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("sending");
    setStatusMessage("");

    const result = await submitInbox({
      type: "contact",
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      description: String(data.get("message") ?? "").trim(),
    });

    if (result.ok) {
      setStatus("sent");
      setStatusMessage(copy.sent);
      form.reset();
    } else {
      setStatus("error");
      setStatusMessage(result.error ?? copy.genericError);
    }
  };

  return (
    <form className="tp-atlas-card" onSubmit={handleSubmit} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input className="tp-atlas-input" name="name" aria-label={copy.name} autoComplete="name" placeholder={copy.name} required />
        <input className="tp-atlas-input" name="email" type="email" aria-label={copy.email} autoComplete="email" placeholder={copy.email} required />
        <textarea
          className="tp-atlas-input"
          name="message"
          rows={7}
          aria-label={copy.message}
          placeholder={copy.message}
          style={{ minHeight: 180, resize: "none" }}
          required
        />
      </div>

      <InboxStatus state={status} message={statusMessage} />

      <button type="submit" className="tp-btn tp-btn-primary" style={{ width: "100%", marginTop: 18, height: 48 }} disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.submit}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </button>
      <p style={{ margin: "10px 0 0", color: "var(--muted-2)", fontSize: 12.5, textAlign: "center" }}>
        {copy.note}
      </p>
    </form>
  );
}
