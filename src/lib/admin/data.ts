import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  AdminPost,
  AdminPostView,
  AdminRequest,
  AdminTool,
  ActivityItem,
  OverviewStats,
} from "@/lib/admin/row-types";

/**
 * Admin reads.
 *
 * Every function returns an empty result instead of throwing when the query
 * fails or Supabase is not configured. A dashboard that shows a clear empty
 * state is more useful than one that shows a stack trace, and the error is
 * logged server-side.
 *
 * The guard matters: in the App Router a layout and its page render in
 * parallel, so a page must never assume the layout already stopped the
 * request.
 */

async function rows<T>(
  promise: PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<T[]> {
  const { data, error } = await promise;

  if (error) {
    console.error("[admin] query failed:", error.message);
    return [];
  }

  return (data ?? []) as T[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  sort_order: number;
}

/**
 * Tool categories.
 *
 * Falls back to the public registry so the form still works before the
 * categories table is seeded.
 */
export async function getCategories(): Promise<AdminCategory[]> {
  if (!isSupabaseConfigured()) {
    const { categories } = await import("@/lib/tools/registry");

    return categories.map((category, index) => ({
      id: category.slug,
      slug: category.slug,
      label: category.label,
      icon: null,
      sort_order: index,
    }));
  }

  const supabase = await createClient();

  const fromDb = await rows<AdminCategory>(
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
  );

  if (fromDb.length > 0) return fromDb;

  const { categories } = await import("@/lib/tools/registry");

  return categories.map((category, index) => ({
    id: category.slug,
    slug: category.slug,
    label: category.label,
    icon: null,
    sort_order: index,
  }));
}

export async function getTools(): Promise<AdminTool[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  return rows<AdminTool>(
    supabase
      .from("tools")
      .select("*")
      .order("title", { ascending: true })
  );
}

export async function getRequests(): Promise<AdminRequest[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  return rows<AdminRequest>(
    supabase
      .from("tool_requests")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

export async function getPosts(): Promise<AdminPost[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  return rows<AdminPost>(
    supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false })
  );
}

export async function getPostViews(): Promise<AdminPostView[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  return rows<AdminPostView>(
    supabase
      .from("post_views_daily")
      .select("*")
      .order("day", { ascending: true })
  );
}

export async function getOverviewStats(): Promise<OverviewStats> {
  if (!isSupabaseConfigured()) {
    return {
      totalTools: 0,
      pendingRequests: 0,
      totalPosts: 0,
      viewsToday: 0,
    };
  }

  const supabase = await createClient();

  const [tools, requests, posts, views] = await Promise.all([
    rows<AdminTool>(supabase.from("tools").select("id")),
    rows<AdminRequest>(supabase.from("tool_requests").select("id, status")),
    rows<AdminPost>(supabase.from("posts").select("id")),
    rows<AdminPostView>(
      supabase
        .from("post_views_daily")
        .select("views")
        .eq("day", new Date().toISOString().slice(0, 10))
    ),
  ]);

  return {
    totalTools: tools.length,
    pendingRequests: requests.filter((request) => request.status !== "launched")
      .length,
    totalPosts: posts.length,
    viewsToday: views.reduce((total, row) => total + row.views, 0),
  };
}

/**
 * Recent activity, newest first.
 *
 * Built from the three content tables — there is no separate activity log.
 */
export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const [requests, posts, tools] = await Promise.all([
    getRequests(),
    getPosts(),
    getTools(),
  ]);

  const items: ActivityItem[] = [
    ...requests.slice(0, limit).map((request) => ({
      id: `request-${request.id}`,
      kind: "request" as const,
      label: request.tool_name,
      detail: request.email ?? "",
      at: request.created_at,
    })),
    ...posts.slice(0, limit).map((post) => ({
      id: `post-${post.id}`,
      kind: "post" as const,
      label: post.title,
      detail: post.status,
      at: post.updated_at,
    })),
    ...tools.slice(0, limit).map((tool) => ({
      id: `tool-${tool.id}`,
      kind: "tool" as const,
      label: tool.title,
      detail: tool.status,
      at: tool.updated_at,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

/** Tool usage ordered by the real usage_count column. */
export async function getTopTools(limit = 5): Promise<AdminTool[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();

  return rows<AdminTool>(
    supabase
      .from("tools")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(limit)
  );
}

export interface AdminSetting {
  key: string;
  value: string;
  updated_at: string;
}

/** Site settings as a flat key/value map. */
export async function getSettings(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};

  const supabase = await createClient();

  const settings = await rows<AdminSetting>(
    supabase.from("site_settings").select("*")
  );

  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value])
  );
}
