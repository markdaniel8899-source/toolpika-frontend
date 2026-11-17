"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

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

export default function RequestForm({ labels }: RequestFormProps) {
  const [form, setForm] = useState({
    toolName: "",
    description: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.toolName.trim()) next.toolName = "Tool name is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

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
    // Simulate submission; replace with real Supabase/API call when ready.
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSubmitting(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <>
        <Reveal className="mx-auto mb-6 w-12 h-12 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
          <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
        </Reveal>
        <Reveal delay={100} className="text-center mb-4">
          <h2 className="font-heading text-[24px] font-normal leading-[1.15] tracking-[0.015em] text-[var(--text)]">
            Thanks! We&apos;ll build it soon.
          </h2>
        </Reveal>
        <Reveal delay={180} className="text-center">
          <p className="text-[var(--muted)]">
            We read every request and build the most asked-for tools first.
          </p>
        </Reveal>
        <Reveal delay={260} className="text-center mt-8">
          <Button variant="ghost" asChild className="w-auto mx-auto">
            <Link href="/" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors duration-[var(--dur-fast)]">
              {labels.backHome}
            </Link>
          </Button>
        </Reveal>
      </>
    );
  }

  return (
    <>
      <Card className="mx-auto max-w-[560px] p-0">
        <CardContent className="p-10 sm:p-14">
          <Reveal className="mb-10 text-center">
            <p className="mb-3 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--accent)] text-[11px] font-semibold uppercase tracking-[0.15em] shadow-sm">
              {labels.eyebrow}
            </p>
            <h1 className="font-heading text-[32px] tracking-[-0.02em] text-[var(--text)] sm:text-[40px]">
              {labels.title}
            </h1>
            <p className="mt-4 text-[var(--muted)]">{labels.description}</p>
          </Reveal>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Reveal delay={60}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-name"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {labels.toolNameLabel}
                </label>
                <Input
                  id="tool-name"
                  value={form.toolName}
                  onChange={handleChange("toolName")}
                  placeholder={labels.toolNamePlaceholder}
                  required
                  invalid={Boolean(errors.toolName)}
                />
                {errors.toolName && (
                  <p className="mt-1 text-[11px] text-[var(--danger)]">
                    {errors.toolName}
                  </p>
                )}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-description"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {labels.descriptionLabel}
                </label>
                <textarea
                  id="tool-description"
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder={labels.descriptionPlaceholder}
                  rows={5}
                  required
                  className={cn(
                    "flex min-h-[120px] w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base leading-[1.6] text-[var(--text)] placeholder:text-[var(--muted)]",
                    "transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
                    errors.description
                      ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[3px] focus:ring-[var(--danger)]/30"
                      : "focus:border-[var(--accent)] focus:outline-none focus:ring-[3px] focus:ring-[var(--ring)]",
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-[11px] text-[var(--danger)]">
                    {errors.description}
                  </p>
                )}
              </div>
            </Reveal>

            <Reveal delay={180}>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="tool-email"
                  className="text-sm font-medium text-[var(--text)]"
                >
                  {labels.emailLabel}
                </label>
                <Input
                  id="tool-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder={labels.emailPlaceholder}
                  invalid={Boolean(errors.email)}
                />
                <p className="text-xs text-[var(--muted)]">{labels.emailHint}</p>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-[var(--danger)]">
                    {errors.email}
                  </p>
                )}
              </div>
            </Reveal>

            <Reveal delay={240}>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? labels.submit + "…" : labels.submit}
              </Button>
            </Reveal>
          </form>
        </CardContent>
      </Card>

      <Reveal className="mt-10 text-center">
        <p className="text-sm text-[var(--muted)]">
          <Link
            href="/"
            className="text-[var(--accent)] underline underline-offset-4 hover:opacity-80 transition-colors duration-[var(--dur-fast)]"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {labels.backHome}
          </Link>
        </p>
      </Reveal>
    </>
  );
}
