"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export type ContactCopy = {
  name: string;
  email: string;
  message: string;
  submit: string;
  note: string;
};

export function ContactForm({ copy }: { copy: ContactCopy }) {
  const [opened, setOpened] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const subject = `Toolpika contact: ${name}`;
    const body = `${message}\n\nFrom: ${email}`;
    window.location.href = `mailto:hello@toolpika.site?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
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
          style={{ minHeight: 180, resize: "vertical" }}
          required
        />
      </div>
      <button type="submit" className="tp-btn tp-btn-primary" style={{ width: "100%", marginTop: 18, height: 48 }}>
        {copy.submit}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </button>
      <p style={{ margin: "10px 0 0", color: "var(--muted-2)", fontSize: 12.5, textAlign: "center" }}>
        {opened ? "Your email draft is ready. Send it from your mail app." : copy.note}
      </p>
    </form>
  );
}
