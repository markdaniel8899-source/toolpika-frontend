# 🎨 LAYOUT BLUEPRINT — Toolpika Frontend

## 1. Global Layout (Applies to all pages)
- **Header:** Sticky, backdrop-blur. Contains Logo (Big Apple NF), Nav Links (Inter), Search Icon, Theme Toggle (Sun/Moon), and Language Selector (Dropdown).
- **Footer:** 4-column grid (Brand, Tools, Company, Legal). Clean, minimal, `--surface` background.
- **Container:** Max-width 1120px, centered, padding 24px.

## 2. Homepage (`/[locale]/page.tsx`)
- **Hero Section:** 
  - H1: "Find the right tool in seconds" (Inter + Big Apple NF mix).
  - Subtext: Muted color.
  - **Mega Search Bar:** Centered, large, with `/` shortcut hint.
  - **Chips:** Quick access buttons for top tools.
- **Popular Tools Section:** Ranked list (1 to 8) with usage count.
- **Categories Grid (`dir`):** 4-column grid. Each card has an icon, title, and list of top 5 tools inside that category.
- **Request Section:** "Can't find what you need?" CTA box with a button linking to `/request`.

## 3. Tool Page (`/[locale]/tools/[slug]/page.tsx`)
- **Breadcrumbs:** Home > Category > Tool Name.
- **Header:** Tool Title + Short Description.
- **Workspace (Split View - Desktop):**
  - **Left (60%):** Input area (Textarea / Drag & Drop zone) + Action Button.
  - **Right (40%):** Settings panel (Toggles, Sliders, Dropdowns) + Output area.
- **SEO Content (Bottom):** "How to use" steps, FAQs (Accordion), and related tools.

## 4. Request Page (`/[locale]/request/page.tsx`)
- Simple, focused form: Tool Name, Description, Email (optional).
- Success state: "Thanks! We'll build it soon."

## 5. UI Component Rules (Strict)
- **Buttons:** Primary (`--accent-fill`), Secondary (Border `--border`), Ghost (Transparent).
- **Cards:** `--surface` bg, `--border` border, 14px radius. Hover: `translate-y-[-2px]`, border becomes `--accent`.
- **Inputs:** `--surface` bg, `--border` border. Focus: `--accent` border + subtle ring.
- **Typography:** Body = Inter (16px, 1.6 line-height). Headings = Big Apple NF (tight tracking).