"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { submitToolRequest } from "./actions";

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
  const [submitting, setSubmitting] = useState(false);
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
    setSubmitting(true);
    setErrors({});
    const result = await submitToolRequest(form);
    setSubmitting(false);
    if (result.ok) {
      setSuccess(true);
      setForm(emptyForm);
      setCategory("");
    } else {
      setErrors({ form: result.error });
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
    <form className="tp-card tp-form-card" onSubmit={handleSubmit} style={{ padding: 28 }} noValidate>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>
          Tell us what you need
        </h2>
        <span style={{ color: "var(--muted-2)", fontSize: 12.5 }}>Takes about a minute</span>
      </div>

      <div className="tp-field">
        <label className="tp-field-label" htmlFor="tool-name">{labels.toolNameLabel}</label>
        <input
          id="tool-name"
          className="tp-field-input"
          value={form.toolName}
          onChange={handleChange("toolName")}
          placeholder={labels.toolNamePlaceholder}
          required
        />
        {errors.toolName && <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.toolName}</p>}
      </div>

      <div className="tp-field">
        <label className="tp-field-label" htmlFor="tool-description">{labels.descriptionLabel}</label>
        <textarea
          id="tool-description"
          className="tp-field-input"
          value={form.description}
          onChange={handleChange("description")}
          placeholder={labels.descriptionPlaceholder}
          required
        />
        {errors.description && <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.description}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="tp-field">
          <label className="tp-field-label is-soft" htmlFor="tool-category">Category</label>
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
              placeholder="Choose one"
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
          {errors.category && <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.category}</p>}
        </div>

        <div className="tp-field">
          <label className="tp-field-label" htmlFor="tool-email">
            Email <span style={{ color: "var(--muted-2)", fontSize: 11.5, fontWeight: 400 }}>Optional</span>
          </label>
          <input
            id="tool-email"
            type="email"
            className="tp-field-input"
            value={form.email}
            onChange={handleChange("email")}
            placeholder={labels.emailPlaceholder}
          />
          {errors.email && <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>{errors.email}</p>}
        </div>
      </div>

      {errors.form && (
        <p role="alert" style={{ margin: "0 0 16px", color: "var(--danger)", fontSize: 13 }}>
          {errors.form}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 24 }}>
        <p style={{ maxWidth: 250, margin: 0, color: "var(--muted-2)", fontSize: 12.5, lineHeight: 1.55 }}>
          No account needed. We only use your email if we need to ask a follow-up about this request.
        </p>
        <button type="submit" className="tp-btn tp-btn-primary" disabled={submitting}>
          {submitting ? "Sending…" : labels.submit}
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
