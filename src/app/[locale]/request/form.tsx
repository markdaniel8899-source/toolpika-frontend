"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("request");
  const [form, setForm] = useState(emptyForm);
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.toolName.trim()) next.toolName = t("errorNameRequired");
    if (!form.description.trim()) next.description = t("errorDescriptionRequired");
    if (!category) next.category = t("errorCategoryRequired");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = t("errorEmailInvalid");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form, category, t]);

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
      setStatusMessage(result.error ?? t("errorGeneric"));
    }
  };

  if (success) {
    return (
      <div className="tp-request-card tp-request-success">
        <span className="tp-request-success-icon">
          <Check className="tp-icon" aria-hidden="true" />
        </span>
        <h2>{t("successTitle")}</h2>
        <p>{t("successBody")}</p>
        <button
          type="button"
          className="tp-btn tp-btn-ghost"
          onClick={() => setSuccess(false)}
        >
          {t("sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form className="tp-request-card tp-request-form" onSubmit={handleSubmit} noValidate>
      <div className="tp-request-card-head">
        <h2 className="tp-request-form-title">{t("formTitle")}</h2>
        <p className="tp-request-card-sub">{t("formSubtitle")}</p>
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
                { value: t("categoryOptions.text"), label: t("categoryOptions.text") },
                { value: t("categoryOptions.image"), label: t("categoryOptions.image") },
                { value: t("categoryOptions.code"), label: t("categoryOptions.code") },
                { value: t("categoryOptions.converter"), label: t("categoryOptions.converter") },
                { value: t("categoryOptions.security"), label: t("categoryOptions.security") },
                { value: t("categoryOptions.other"), label: t("categoryOptions.other") },
              ]}
              placeholder={t("categoryPlaceholder")}
              ariaLabel={t("categoryAriaLabel")}
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
        {status === "sending" ? t("sending") : labels.submit}
        <ArrowRight className="tp-icon" aria-hidden="true" />
      </button>
    </form>
  );
}
