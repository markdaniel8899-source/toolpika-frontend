import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/config";
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
 * Production rule: no fake or seeded rows. A missing configuration or a
 * failed query throws, and the dashboard error boundary shows a clear state.
 * Empty tables legitimately return empty arrays.
 */

async function rows<T>(
  promise: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  assertSupabaseConfigured();
  const { data, error } = await promise;

  if (error) {
    throw new Error(`[admin] query failed: ${error.message}`);
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

/** Tool categories from Supabase. No registry fallback. */
export async function getCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();

  return rows<AdminCategory>(
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  );
}

export async function getTools(): Promise<AdminTool[]> {
  const supabase = await createClient();

  return rows<AdminTool>(
    supabase
      .from("tools")
      .select("*")
      .order("title", { ascending: true }),
  );
}

export async function getRequests(): Promise<AdminRequest[]> {
  const supabase = await createClient();

  return rows<AdminRequest>(
    supabase
      .from("inbox_messages")
      .select("*")
      .order("created_at", { ascending: false }),
  );
}

export async function getPosts(): Promise<AdminPost[]> {
  const supabase = await createClient();

  return rows<AdminPost>(
    supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false }),
  );
}

export async function getPostViews(): Promise<AdminPostView[]> {
  const supabase = await createClient();

  return rows<AdminPostView>(
    supabase
      .from("post_views_daily")
      .select("*")
      .order("day", { ascending: true }),
  );
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const supabase = await createClient();

  const [tools, requests, posts, views] = await Promise.all([
    rows<AdminTool>(supabase.from("tools").select("id")),
    rows<AdminRequest>(supabase.from("inbox_messages").select("id, status")),
    rows<AdminPost>(supabase.from("posts").select("id")),
    rows<AdminPostView>(
      supabase
        .from("post_views_daily")
        .select("views")
        .eq("day", new Date().toISOString().slice(0, 10)),
    ),
  ]);

  return {
    totalTools: tools.length,
    pendingRequests: requests.filter(
      (request) => request.status === "new" || request.status === "in_progress",
    ).length,
    totalPosts: posts.length,
    viewsToday: views.reduce((total, row) => total + row.views, 0),
  };
}

/** Recent activity, newest first. Built from the three real content tables. */
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
      label: request.tool_name ?? request.name ?? "Message",
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
  const supabase = await createClient();

  return rows<AdminTool>(
    supabase
      .from("tools")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(limit),
  );
}

export interface AdminSetting {
  key: string;
  value: string;
  updated_at: string;
}

/** Site settings as a flat key/value map. */
export async function getSettings(): Promise<Record<string, string>> {
  const supabase = await createClient();

  const settings = await rows<AdminSetting>(
    supabase.from("site_settings").select("*"),
  );

  return Object.fromEntries(
    settings.map((setting) => [setting.key, setting.value]),
  );
}
