"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreSeo } from "@/lib/admin/seo";
import type { FormState } from "@/lib/admin/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

/* -------------------------------------------------------------------------- */
/* Auth - Supabase Auth only                                                  */
/* -------------------------------------------------------------------------- */

export type AdminLoginState = {
  status: "idle" | "error";
  message?: string;
};

/** Signs in with Supabase Auth. Always redirects to /admin on success. */
export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/admin");
}

/* -------------------------------------------------------------------------- */
/* Tools                                                                      */
/* -------------------------------------------------------------------------- */

const TOOL_STATUSES = ["draft", "live", "hidden"] as const;
type ToolStatus = (typeof TOOL_STATUSES)[number];

function readToolForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();

  return {
    id: id || null,
    title,
    slug,
    category,
    icon,
    description,
    status: (TOOL_STATUSES as readonly string[]).includes(status)
      ? (status as ToolStatus)
      : "draft",
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
  };
}

export async function saveTool(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();

  const values = readToolForm(formData);

  if (!values.title || !values.slug || !values.category || !values.description) {
    return { status: "error", message: "missing_fields" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) {
    return { status: "error", message: "invalid_slug" };
  }

  const supabase = await createClient();

  const payload = {
    title: values.title,
    slug: values.slug,
    category: values.category,
    icon: values.icon || null,
    description: values.description,
    status: values.status,
    seo_title: values.seoTitle,
    seo_description: values.seoDescription,
  };

  // Registry-backed rows use a placeholder id until they are saved once;
  // upserting by slug keeps them editable without a database id.
  const isRegistryPlaceholder = values.id?.startsWith("registry-") ?? false;
  const query = !values.id || isRegistryPlaceholder
    ? supabase.from("tools").upsert(payload, { onConflict: "slug" })
    : supabase.from("tools").update(payload).eq("id", values.id);

  const { error } = await query;

  if (error) {
    return { status: "error", message: "save_failed" };
  }

  revalidatePath("/admin/tools");
  revalidatePath("/admin");

  return { status: "success" };
}

export async function deleteTool(id: string): Promise<void> {
  const supabase = await requireUser();
  // Registry-backed rows have no database row yet, so there is nothing to delete.
  if (id.startsWith("registry-")) return;
  await supabase.from("tools").delete().eq("id", id);

  revalidatePath("/admin/tools");
  revalidatePath("/admin");
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

const REQUEST_STATUSES = [
  "new",
  "in_progress",
  "resolved",
  "rejected",
] as const;
type RequestStatus = (typeof REQUEST_STATUSES)[number];

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<void> {
  await requireUser();

  if (!REQUEST_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("inbox_messages").update({ status }).eq("id", id);

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

/** Permanently removes a tool request or contact message from the inbox. */
export async function deleteRequest(id: string): Promise<void> {
  const supabase = await requireUser();

  await supabase.from("inbox_messages").delete().eq("id", id);

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
}

/* -------------------------------------------------------------------------- */
/* Blog                                                                       */
/* -------------------------------------------------------------------------- */

const POST_STATUSES = ["draft", "published"] as const;
type PostStatus = (typeof POST_STATUSES)[number];

export async function savePost(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const status = String(formData.get("status") ?? "draft");

  if (!title || !slug || !content) {
    return { status: "error", message: "missing_fields" };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { status: "error", message: "invalid_slug" };
  }

  const seoScore = scoreSeo({ title, seoTitle, seoDescription, content });
  const nextStatus = (POST_STATUSES as readonly string[]).includes(status)
    ? (status as PostStatus)
    : "draft";

  const supabase = await createClient();

  // Keep the first publish date when a published post is saved again; clear it
  // when the post goes back to draft.
  let publishedAt: string | null = nextStatus === "published"
    ? new Date().toISOString()
    : null;

  if (id) {
    const { data: existing } = await supabase
      .from("posts")
      .select("status, published_at")
      .eq("id", id)
      .maybeSingle();

    if (
      nextStatus === "published" &&
      existing?.status === "published" &&
      existing.published_at
    ) {
      publishedAt = existing.published_at;
    }
  }

  const payload = {
    title,
    slug,
    content,
    status: nextStatus,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    seo_score: seoScore,
    published_at: publishedAt,
  };

  const query = id
    ? supabase.from("posts").update(payload).eq("id", id)
    : supabase.from("posts").insert(payload);

  const { error } = await query;

  if (error) {
    return { status: "error", message: "save_failed" };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/admin");

  return { status: "success" };
}

export async function deletePost(id: string): Promise<void> {
  const supabase = await requireUser();
  await supabase.from("posts").delete().eq("id", id);

  revalidatePath("/admin/blog");
  revalidatePath("/admin");
}

/* -------------------------------------------------------------------------- */
/* Site settings                                                              */
/* -------------------------------------------------------------------------- */

const SETTING_KEYS = [
  "siteName",
  "siteUrl",
  "socialGithub",
  "socialX",
  "socialLinkedIn",
  "themeDefault",
] as const;

/** Persists every settings field to the site_settings table (key/value). */
export async function saveSettings(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  void _prev;
  const supabase = await requireUser();

  const rows = SETTING_KEYS.map((key) => ({
    key,
    value: String(formData.get(key) ?? "").trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("site_settings").upsert(rows, {
    onConflict: "key",
  });

  if (error) {
    return { status: "error", message: "save_failed" };
  }

  revalidatePath("/admin/settings");
  return { status: "success" };
}
