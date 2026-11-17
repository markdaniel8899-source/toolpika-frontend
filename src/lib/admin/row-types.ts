export interface AdminTool {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: string | null;
  description: string;
  status: "draft" | "live" | "hidden";
  usage_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRequest {
  id: string;
  tool_name: string;
  description: string;
  email: string | null;
  status: "new" | "building" | "launched";
  created_at: string;
  updated_at: string;
}

export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  seo_title: string | null;
  seo_description: string | null;
  seo_score: number | null;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPostView {
  post_id: string;
  day: string;
  views: number;
}

export interface ActivityItem {
  id: string;
  kind: "request" | "post" | "tool";
  label: string;
  detail: string;
  at: string;
}

export interface OverviewStats {
  totalTools: number;
  pendingRequests: number;
  totalPosts: number;
  viewsToday: number;
}
