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
      <div className="tp-request-card tp-request-success">
        <span className="tp-request-success-icon">
          <Check className="tp-icon" aria-hidden="true" />
        </span>
        <h2>Request received</h2>
        <p>
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
    <form className="tp-request-card tp-request-form" onSubmit={handleSubmit} noValidate>
      <div className="tp-request-card-head">
        <h2 className="tp-request-form-title">Tell us what you need</h2>
        <p className="tp-request-card-sub">A short note is enough to get started.</p>
      </div>

      <div className="tp-request-fields">
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
          {errors.toolName && <p role="alert" className="tp-request-error">{errors.toolName}</p>}
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
          {errors.description && <p role="alert" className="tp-request-error">{errors.description}</p>}
        </div>

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
          {errors.category && <p role="alert" className="tp-request-error">{errors.category}</p>}
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
          {errors.email && <p role="alert" className="tp-request-error">{errors.email}</p>}
        </div>
      </div>

      <InboxStatus state={status} message={statusMessage} />

      <button type="submit" className="tp-btn tp-btn-primary tp-request-submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : labels.submit}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </button>
    </form>
  );
}
