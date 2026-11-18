import { createClient } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/supabase/config";
import { categories } from "@/lib/tools/registry";
import type {
  AdminPost,
  AdminPostView,
  AdminRequest,
  AdminTool,
  ActivityItem,
  OverviewStats,
} from "@/lib/admin/row-types";

/**
 * Minimal admin reads. The schema only has: profiles, tools, inbox_messages.
 * Other pages degrade to empty states instead of querying missing tables.
 */

async function rows<T>(
  promise: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  assertSupabaseConfigured();
  const { data, error } = await promise;
  if (error) throw new Error(`[admin] query failed: ${error.message}`);
  return (data ?? []) as T[];
}

export interface AdminCategory {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  sort_order: number;
}

export async function getCategories(): Promise<AdminCategory[]> {
  return categories.map((category, index) => ({
    id: category.slug,
    slug: category.slug,
    label: category.label,
    icon: null,
    sort_order: index,
  }));
}

export async function getTools(): Promise<AdminTool[]> {
  const supabase = await createClient();
  return rows<AdminTool>(
    supabase.from("tools").select("*").order("title", { ascending: true }),
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
  return [];
}

export async function getPostViews(): Promise<AdminPostView[]> {
  return [];
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const supabase = await createClient();
  const [tools, requests] = await Promise.all([
    rows<AdminTool>(supabase.from("tools").select("id")),
    rows<AdminRequest>(supabase.from("inbox_messages").select("id, status")),
  ]);

  return {
    totalTools: tools.length,
    pendingRequests: requests.filter(
      (request) => request.status === "new" || request.status === "in_progress",
    ).length,
    totalPosts: 0,
    viewsToday: 0,
  };
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const [requests, tools] = await Promise.all([getRequests(), getTools()]);

  const items: ActivityItem[] = [
    ...requests.slice(0, limit).map((request) => ({
      id: `request-${request.id}`,
      kind: "request" as const,
      label: request.tool_name ?? request.name ?? "Message",
      detail: request.email ?? "",
      at: request.created_at,
    })),
    ...tools.slice(0, limit).map((tool) => ({
      id: `tool-${tool.id}`,
      kind: "tool" as const,
      label: tool.title,
      detail: tool.status,
      at: tool.updated_at ?? tool.created_at,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

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

export async function getSettings(): Promise<Record<string, string>> {
  return {};
}
