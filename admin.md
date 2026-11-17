# 🛡️ ADMIN BLUEPRINT — Toolpika Dashboard

## 1. Access & Security
- **Route:** `/admin` (No locale prefix).
- **Auth:** Supabase Magic Link (Email only).
- **Middleware:** Protects all `/admin/*` routes. Redirects to `/admin/login` if unauthorized.
- **Theme:** Same Porcelain & Violet-Ink palette as frontend.

## 2. Dashboard Pages
### A. Overview (`/admin`)
- 4 Stat Cards: Total Tools, Pending Requests, Total Posts, Today's Views.
- Recent Activity Feed.
- Top 5 Tools (Bar chart).

### B. Tools Management (`/admin/tools`)
- **List View:** Table with Name, Category, Status (Live/Draft), Usage Count, Actions (Edit/Delete).
- **Add/Edit Form:** Title, Slug, Category, Icon (Lucide picker), Description, SEO Meta, Status.

### C. Requests Inbox (`/admin/requests`)
- **List View:** Requested Tool, User Email, Date, Status (New/Building/Launched).
- **Action:** Mark as "Launched" (triggers email to user).

### D. Blog Management (`/admin/blog`)
- **List View:** Title, Status, SEO Score (0-100), Views.
- **Editor:** Markdown/Rich Text. Right sidebar shows SEO checklist (Title length, Meta desc, H-tags).

### E. Analytics (`/admin/analytics`)
- Tool usage over time (Line chart).
- Traffic by Language/Country (Pie chart).

### F. Settings (`/admin/settings`)
- Site Info, Social Links, API Keys (Groq, Supabase), Theme default.

## 3. Supabase Database Schema (Core Tables)
- `profiles`: id, email, role (admin).
- `tools`: id, slug, title, category, icon, description, status, usage_count.
- `tool_requests`: id, tool_name, description, email, status, created_at.
- `posts`: id, slug, title, content, status, seo_score, views, published_at.
- `translations`: id, resource_type, resource_id, locale, translated_content.