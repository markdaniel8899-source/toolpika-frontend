# Toolpika Web

Next.js 16 App Router frontend for `toolpika.site`. Tools run in the browser;
Supabase powers admin content only.

This is the **`toolpika-frontend`** repo, deployed on Vercel. The SQL schema and
future Oracle Cloud automation live in the separate
[`toolpika-backend`](https://github.com/markdaniel8899-source/toolpika-backend)
repo.

## Stack

| Layer          | Choice                                        |
| -------------- | --------------------------------------------- |
| Framework      | Next.js 16.4 (App Router, Turbopack)          |
| Language       | TypeScript (strict)                           |
| Styling        | Tailwind CSS 3.4 + tokens in `globals.css`    |
| Components     | shadcn/ui, owned in `src/components/ui/`      |
| i18n           | next-intl 4.15, 10 locales, `/en/...` URLs     |
| Icons          | lucide-react                                  |
| Motion         | CSS transitions, 200–300ms, reduced-motion off |
| Backend        | Supabase (Auth, Postgres, RLS)                |
| Translations   | Groq (Llama 3 70B), build-time pipeline       |

## Commands

```bash
npm install
npm run dev        # http://localhost:3000 -> /en
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run build
npm run start

npm run check:locales   # locale files match en.json
npm run check:messages  # used keys exist
npm run translate       # Groq pipeline (reads .env.local)
```

## Environment

```bash
cp .env.example .env.local
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are only needed
for the admin dashboard. The public site builds and runs without them.

## Routes

### Public — always locale-prefixed

| Route                          | Page                                      |
| ------------------------------ | ----------------------------------------- |
| `/[locale]`                    | Homepage: hero, search, popular, categories |
| `/[locale]/popular`            | Popular tools list                        |
| `/[locale]/new`                | Newest tools                              |
| `/[locale]/guides`             | Guides index                              |
| `/[locale]/request`            | Request a tool                            |
| `/[locale]/about`              | About                                     |
| `/[locale]/privacy`            | Privacy policy                            |
| `/[locale]/terms`              | Terms of use                              |
| `/[locale]/contact`            | Contact                                   |
| `/[locale]/category/[slug]`    | Category listing                          |
| `/[locale]/tools/[slug]`       | Tool page: workspace, how-to, FAQ, related |
| `/sitemap.xml`, `/robots.txt`  | Generated from the tool registry          |

Locales: `en` (default), `de`, `fr`, `es`, `pt-BR`, `ru`, `tr`, `it`, `ar`
(RTL), `hi`.

### Tools

All eight live tools run entirely in the browser and are code-split per slug
(`src/components/tools/workspaces/`): word counter, case converter, image
compressor, JSON formatter, unit converter, password generator, URL encoder
and Base64 encoder.

They share the two-pane input/result shell. Tool strings live in the `toolUi`
namespace of every locale file, so adding a locale keeps the workspaces
translated.

### Admin — no locale prefix

| Route               | Page                                    |
| ------------------- | --------------------------------------- |
| `/admin/login`      | Magic-link sign-in                      |
| `/admin`            | Overview: stats, activity, top tools    |
| `/admin/tools`      | Tools table and add/edit form           |
| `/admin/requests`   | Requests inbox                          |
| `/admin/blog`       | Posts list and editor with SEO checklist |
| `/admin/analytics`  | Post views charts                       |
| `/admin/settings`   | Site details, social links, key status  |

`src/proxy.ts` guards every `/admin/*` route: no session redirects to
`/admin/login`, and a signed-in account whose `profiles.role` is not `admin`
is redirected too. Pages additionally call `requireAdmin()` server-side, and
Supabase RLS blocks the data itself.

## Source map

```txt
src/app/[locale]/layout.tsx      site root layout: fonts, theme script, dir/lang
src/app/[locale]/page.tsx        homepage
src/app/[locale]/tools/[slug]/   tool page
src/app/admin/layout.tsx         admin root layout (second root layout)
src/app/admin/(dashboard)/       admin pages, guarded by requireAdmin()
src/app/admin/actions.ts         server actions (auth, tools, requests, posts, settings)
src/app/globals.css              design tokens + base layer (only place with hex)
src/app/sitemap.ts               sitemap with hreflang alternates
src/app/robots.ts                robots, disallows /admin
src/components/ui/               shadcn/ui primitives, restyled to the tokens
src/components/admin/            dashboard shell, forms and SVG charts
src/components/tools/            workspace dispatcher, shared panes, one client component per tool
src/i18n/                        routing, request config, locale-aware navigation
src/lib/tools/registry.ts        typed tool registry (routes, search, sitemap)
src/lib/supabase/                browser client, server client, admin guard
src/lib/admin/                   admin data reads, SEO scoring, message helper
src/proxy.ts                     next-intl middleware + /admin auth guard
scripts/                         locale checks + Groq translation pipeline
messages/<locale>.json           UI strings per locale (10 locales)
messages/admin.json              dashboard strings (English only)
public/fonts/                    licensed Big Apple NF file (original OTF)
```

## Database

The schema is kept in the separate
[`toolpika-backend`](https://github.com/markdaniel8899-source/toolpika-backend)
repo. Clone it and apply the files in order:

```bash
git clone https://github.com/markdaniel8899-source/toolpika-backend.git
cd toolpika-backend

psql "$SUPABASE_DB_URL" -f database/001_initial_schema.sql
psql "$SUPABASE_DB_URL" -f database/002_rls_policies.sql
psql "$SUPABASE_DB_URL" -f database/003_seed.sql
```

Or paste each file into the Supabase SQL editor in the same order.

Then promote your own account:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Translation pipeline

The script reads `.env.local` through Node's `--env-file` flag (Node 20+):

```bash
npm run translate
npm run translate -- --locale de
npm run translate -- --dry-run
```

## Checks

```bash
npm run check:locales      # every locale matches en.json
npm run check:messages     # no key is used but undefined
```

## Notes

- The locale prefix is always present. `/` redirects to the negotiated locale.
- `data-theme` is set on `<html>` by a blocking head script; the toggle
  persists in `localStorage` and falls back to the system preference.
- Big Apple NF ships as the original OTF. The font EULA forbids conversion or
  subsetting, so the file is served unmodified.
- The tool registry carries no usage counts. Run counts live in Supabase and
  are never invented.
