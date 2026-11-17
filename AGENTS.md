# Toolpika — Agent Instructions

Toolpika is a fast, privacy-first online tools website. This file is the entry point for any agent working in this repository.

## Read first

1. `.agents/README.md` — skill index, project snapshot, workflow, definition of done.
2. `layout.md`, `admin.md`, `i18n.md` — page, admin and locale blueprints.
3. The brief(s) matching the current task in `.agents/`.
4. `.agents/design-constitution.md` — locked design system and engineering rules.
5. Load the full skill with the `skill` tool using the exact id when doing substantial work.

## Non-negotiable project rules

- **Process files in the browser by default.** No upload unless the feature truly requires it; never claim "local" if a server is involved.
- **Never store tool files** or their contents. Approved profile avatars (if enabled) are the only upload; they are never tool data.
- **Mobile first.** Every flow must work one-handed on a real phone.
- **Accessibility is a baseline**, not a polish task: WCAG 2.2 AA, keyboard-complete flows, visible focus.
- **No fake proof.** No invented testimonials, user counts, reviews, certifications or security claims.
- **No generic AI copy.** Plain, specific language; no "seamless", "elevate", "unleash".
- **One design direction.** Follow the decision recorded in `.agents/README.md`; do not blend styles.
- **One page per tool intent.** Real content, unique metadata, structured data, internal links.
- **Performance is a feature.** Lazy-load tool libraries; run heavy work off the main thread; no layout shift.
- **Security by default.** Treat files, text, HTML, URLs and archives as hostile; validate and cap before processing.

## Design constitution (locked)

Full rules: `.agents/design-constitution.md`. The short version:

- **Direction:** Porcelain & Violet-Ink only. Do not blend other palettes, type systems or radii.
- **Fonts:** Inter (`font-sans`, 90%) + Big Apple NF (`font-display`, hero/section titles only). Never inline `font-family`.
- **Colors:** only `var(--bg)`, `var(--surface)`, `var(--text)`, `var(--muted)`, `var(--border)`, `var(--accent*)`. No hex values in components. 60-30-10.
- **Theme:** `data-theme` on `<html>`, blocking head script, `localStorage` + system fallback, no FOUC.
- **Motion:** 200–300ms, subtle lifts only; `prefers-reduced-motion` disables it.
- **Components:** Lucide icons, shadcn/ui primitives, 10/14px radii, 2px accent focus outline with 3px offset.
- **Tools:** 100% client-side. No server calls for tool execution.

## Architecture assumptions

- Next.js 16 App Router + TypeScript (strict, no `any`) + Tailwind CSS v3, deployed on Vercel at `toolpika.site`.
- Next 16 ships version-accurate docs at `frontend/node_modules/next/dist/docs/`. Read them before using a framework API; do not rely on older Next.js memory (`middleware.ts` → `proxy.ts`, `next/root-params`, etc.).
- shadcn/ui is the component layer (components owned in-repo); design tokens live in `app/globals.css`.
- Server Components by default; `"use client"` only on small interactive islands.
- `next-intl` with a `[locale]` segment: `en` (default), `de`, `fr`, `es`, `pt-BR`, `ru`, `tr`, `it`, `ar` (RTL), `hi`. Locale prefix is always present.
- Tool routes live at `app/[locale]/tools/[slug]/page.tsx`; admin routes live at `/admin` without a locale prefix.
- A typed tool registry drives routes, search, sitemap, metadata and related tools.
- Supabase provides Auth (magic link), Postgres and RLS for admin content, tool requests, blog posts, translations and analytics. Never tool files.
- Groq (Llama 3 70B) is used only for the translation pipeline, never in the tool runtime.

## Before shipping a tool

Check the tool against `.agents/README.md` §6 (definition of done), then run the relevant QA briefs:

- `playwright-cli` for the tool flow.
- `agent-browser` for exploratory/mobile checks.
- `performance` for bundle and main-thread behavior.
- `vercel-react-best-practices` for bundle/waterfall review.
- `web-design-guidelines` for the final interface audit.
- `seo-aeo-best-practices` for metadata/schema.
- `design-constitution` for tokens, typography, motion and component classes.

## Updating the docs

- Keep project rules in `AGENTS.md` and `.agents/README.md` in sync.
- Change `.agents/design-constitution.md` first; then sync this file, the README and any affected brief.
- Add a skill brief only when it changes how we build.
- Record design-direction decisions and stack changes in `.agents/README.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
