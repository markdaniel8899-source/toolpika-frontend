"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { InboxStatus } from "@/components/ui/inbox-status";
import { submitInbox } from "@/lib/inbox/submit";

interface RequestFormProps {
  labels: {
    eyebrow: string;
    title: string;
    description: string;
    toolNameLabel: string;
    toolNamePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailHint: string;
    submit: string;
    backHome: string;
  };
}

const emptyForm = { toolName: "", description: "", email: "" };

export default function RequestForm({ labels }: RequestFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.toolName.trim()) next.toolName = "Tool name is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!category) next.category = "Choose a category.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, category]);

  const handleChange =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
      if (errors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    setStatusMessage("");
    setErrors({});

    const result = await submitInbox({
      type: "tool_request",
      toolName: form.toolName.trim(),
      email: form.email.trim() || undefined,
      description: `Category: ${category}\n\n${form.description.trim()}`,
    });

    if (result.ok) {
      setStatus("idle");
      setSuccess(true);
      setForm(emptyForm);
      setCategory("");
    } else {
      setStatus("error");
      setStatusMessage(result.error ?? "Could not send your request.");
    }
  };

  if (success) {
    return (
      <div className="tp-card tp-form-card" style={{ padding: 40, textAlign: "center" }}>
        <span
          className="tp-icon-tile"
          style={{ width: 44, height: 44, margin: "0 auto 16px", borderRadius: "50%" }}
        >
          <Check className="tp-icon" style={{ width: 19, height: 19 }} aria-hidden="true" />
        </span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em" }}>
          Request received
        </h2>
        <p style={{ maxWidth: 360, margin: "8px auto 20px", color: "var(--muted)", fontSize: 14, lineHeight: 1.65 }}>
          Thank you. We read every request that comes in, and we will reply if yours
          is something we can build well.
        </p>
        <button
          type="button"
          className="tp-btn tp-btn-ghost"
          onClick={() => setSuccess(false)}
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form className="tp-card tp-form-card tp-request-form" onSubmit={handleSubmit} style={{ padding: 28 }} noValidate>
      {/* 2.2: single heading, one step up (28px), Inter bold, var(--text). */}
      {/* 2.1: the "Takes about a minute" corner note is removed entirely. */}
      <h2 className="tp-request-form-title">Tell us what you need</h2>

      {/* 2.3: no visible <label>; soft placeholder + aria-label for a11y. */}
      <div className="tp-field">
        <input
          id="tool-name"
          className="tp-field-input"
          value={form.toolName}
          onChange={handleChange("toolName")}
          placeholder={labels.toolNamePlaceholder}
          aria-label={labels.toolNameLabel}
          required
        />
        {errors.toolName && <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.toolName}</p>}
      </div>

      <div className="tp-field">
        <textarea
          id="tool-description"
          className="tp-field-input"
          value={form.description}
          onChange={handleChange("description")}
          placeholder={labels.descriptionPlaceholder}
          aria-label={labels.descriptionLabel}
          required
        />
        {errors.description && <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.description}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="tp-field">
          <div className="tp-select-wrap">
            <Dropdown
              id="tool-category"
              value={category}
              options={[
                { value: "Text", label: "Text" },
                { value: "Images", label: "Images" },
                { value: "Code", label: "Code" },
                { value: "Converters", label: "Converters" },
                { value: "Security", label: "Security" },
                { value: "Something else", label: "Something else" },
              ]}
              placeholder="Choose a category"
              ariaLabel="Category"
              triggerClassName="tp-category-trigger"
              onChange={(value) => {
                setCategory(value);
                if (errors.category) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.category;
                    return next;
                  });
                }
              }}
            />
          </div>
          {errors.category && <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.category}</p>}
        </div>

        <div className="tp-field">
          <input
            id="tool-email"
            type="email"
            className="tp-field-input"
            value={form.email}
            onChange={handleChange("email")}
            placeholder={labels.emailPlaceholder}
            aria-label={`${labels.emailLabel} (optional)`}
          />
          {errors.email && <p role="alert" style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.email}</p>}
        </div>
      </div>

      <InboxStatus state={status} message={statusMessage} />

      {/* 2.5: the bottom helper note is removed entirely. */}
      <button type="submit" className="tp-btn tp-btn-primary tp-request-submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : labels.submit}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </button>
    </form>
  );
}
