# Theme Switch Performance Audit

Scope: `frontend/` — why the layout stutters when switching light/dark, and why
the site feels slow in general. All paths below are relative to `frontend/`.

Status: **audit only**. No performance fix has been applied. The only code
change made alongside this document is the card-arrow direction fix
(`ArrowUpRight` → `ArrowRight` on the home category cards).

---

## 1. How theming works

Theme is stored as a `data-theme` attribute on `<html>` plus a `theme` key in
`localStorage`. There is **no React theme context** and no `next-themes`.

### 1.1 Pre-paint script — `src/components/theme-script.tsx`

```tsx
"use client";

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var theme =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`;

export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
```

### 1.2 Public toggle — `src/components/layout/header.tsx` (lines 77–89)

```tsx
const toggleTheme = () => {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  root.classList.add("theme-transition");
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage can be blocked; the attribute still updates for this session.
  }
  window.setTimeout(() => root.classList.remove("theme-transition"), 240);
};
```

### 1.3 Admin toggle — `src/components/admin/admin-theme-toggle.tsx` (lines 15–29)

```tsx
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";

  root.classList.add("theme-transition");
  root.setAttribute("data-theme", next);
  window.setTimeout(() => root.classList.remove("theme-transition"), 240);

  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage can be blocked; the attribute still updates for this session.
  }
}
```

### 1.4 Admin settings default — `src/components/admin/settings-form.tsx` (lines 71–95)

```tsx
function applyThemeDefault(value: string) {
  setThemeDefault(value);
  if (value === "system") {
    try {
      localStorage.removeItem("theme");
    } catch {
      // Storage may be blocked.
    }
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.setAttribute("data-theme", systemDark ? "dark" : "light");
    window.setTimeout(() => root.classList.remove("theme-transition"), 240);
    return;
  }
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.setAttribute("data-theme", value);
  window.setTimeout(() => root.classList.remove("theme-transition"), 240);
  try {
    localStorage.setItem("theme", value);
  } catch {
    // Storage may be blocked; the attribute still updates.
  }
}
```

### 1.5 Theme variables — `src/app/globals.css` (lines 11–134)

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  --bg: #f7f5f1;
  --surface: #ffffff;
  --surface-2: #f1efe9;
  --text: #14151a;
  --muted: #6b6c75;
  --muted-2: #6e6f78;
  --border: #e5e2db;
  --border-strong: #d2cec5;

  --accent: #5b4bff;
  --accent-hover: #5747e8;
  --accent-fill: #5b4bff;
  --accent-fill-hover: #4a3ae8;
  --on-accent: #ffffff;
  --accent-fg: #ffffff;
  --accent-soft: #efedff;
  --accent-wash: #f5f3ff;

  /* Dark philosophy band — intentionally dark in both themes. */
  --philosophy-bg: #0b0b12;
  --philosophy-text: #f5f4f0;
  --philosophy-muted: rgba(245, 244, 240, 0.62);
  --philosophy-line: rgba(245, 244, 240, 0.14);
  --philosophy-accent: #b9aeff;
  --philosophy-glow: rgba(107, 92, 255, 0.22);

  --nav-ink: #45434f;
  --cta-bg: var(--accent-wash);
  --footer-bg: #0b0b12;
  --footer-text: #f5f4f0;
  --footer-muted: rgba(245, 244, 240, 0.62);

  --field-bg: #faf9ff;
  --focus-ring: rgba(107, 92, 255, 0.32);
  --field-shadow: 0 10px 28px rgba(44, 36, 92, 0.12);
  --card-shadow: 0 2px 8px rgba(20, 16, 50, 0.05);
  --card-lift-shadow: 0 3px 8px rgba(20, 16, 50, 0.06), 0 16px 38px rgba(107, 92, 255, 0.12);
  --card-glow: rgba(107, 92, 255, 0.1);
  --card-glass: color-mix(in srgb, var(--surface) 94%, transparent);
  --card-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.55);

  --shadow-sm: 0 1px 2px rgba(23, 24, 28, 0.05);
  --shadow-md: var(--card-lift-shadow);
  --soft-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  --dur-fast: 150ms;
  --dur-base: 220ms;
  --dur-slow: 400ms;
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-reveal: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.4, 0.5, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}

[data-theme="dark"] {
  color-scheme: dark;

  --bg: #0b0c0f;
  --surface: #121318;
  --surface-2: #17181e;
  --text: #f6f6f7;
  --muted: #9ea0aa;
  --muted-2: #7c7e88;
  --border: #26272f;
  --border-strong: #353741;

  --accent: #6a5bff;
  --accent-hover: #a697ff;
  --accent-fill: #6a5bff;
  --accent-fill-hover: #5b4bff;
  --on-accent: #ffffff;
  --accent-fg: #ffffff;
  --accent-soft: rgba(143, 125, 255, 0.14);
  --accent-wash: #171625;

  --philosophy-bg: #08080e;
  --philosophy-text: #f5f3ef;
  --philosophy-muted: rgba(245, 243, 239, 0.62);
  --philosophy-line: rgba(245, 243, 239, 0.14);
  --philosophy-accent: #c4b5ff;
  --philosophy-glow: rgba(107, 92, 255, 0.26);

  --nav-ink: #cbc7d4;
  --cta-bg: var(--surface-2);
  --footer-bg: #08080e;
  --footer-text: #f5f3ef;
  --footer-muted: rgba(245, 243, 239, 0.62);

  --field-bg: #1b1c24;
  --focus-ring: rgba(143, 125, 255, 0.42);
  --field-shadow: 0 14px 36px rgba(0, 0, 0, 0.45);
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  --card-lift-shadow: 0 3px 10px rgba(0, 0, 0, 0.4), 0 18px 42px rgba(143, 125, 255, 0.14);
  --card-glow: rgba(143, 125, 255, 0.14);
  --card-glass: color-mix(in srgb, var(--surface) 84%, transparent);
  --card-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.05);

  --danger: #f87171;
  --danger-hover: #ef4444;
  --success: #4ade80;
  --warning: #fbbf24;
  --info: #79a6ff;

  --shadow-md: 0 18px 42px rgba(0, 0, 0, 0.5);
  --soft-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

---

## 2. The two CSS blocks that cause the switch lag

### 2.1 Universal transition on **every** element — `src/app/globals.css` (lines 140–159)

```css
/*
 * Baseline interaction transitions for every element.
 * Zero specificity (:where) so any component rule can override it cleanly.
 * This is what makes hover feedback feel consistent across the whole site.
 */
:where(*, *::before, *::after) {
  transition-property:
    color,
    background-color,
    border-color,
    outline-color,
    fill,
    stroke,
    opacity,
    box-shadow,
    transform,
    translate;
  transition-duration: var(--dur-base);
  transition-timing-function: var(--ease-out);
}
```

**Why it is expensive:** `transition-property` is declared on every element and
every pseudo-element. When `data-theme` flips on `<html>`, all the variables in
section 1.5 change at once, so the computed value of `color`,
`background-color`, `border-color`, `fill`, `stroke`, `box-shadow`, etc. changes
on essentially the whole DOM. The browser must (a) recompute style for all
those elements and (b) evaluate a running transition for ten properties on
each of them, in one frame. On `/all-tools` that is ~85 tool cards plus nav,
mega menu, wishlist panel, search results and footer, i.e. several thousand
elements.

### 2.2 Forced `!important` transition during the switch — `src/app/globals.css` (lines 265–288)

```css
/* ---------- Theme switch transition ---------- */

html.theme-transition body,
html.theme-transition .tp-header,
html.theme-transition .tp-footer,
html.theme-transition .tp-card,
html.theme-transition .tp-atlas-card,
html.theme-transition .tp-admin-card,
html.theme-transition .tp-admin-btn,
html.theme-transition .tp-admin-btn-secondary,
html.theme-transition .tp-admin-icon,
html.theme-transition .tp-admin-nav,
html.theme-transition .tp-admin-select-content,
html.theme-transition .tp-admin-login-card,
html.theme-transition .tp-admin-login-wash,
html.theme-transition .tp-field-input,
html.theme-transition .tp-dropdown-menu,
html.theme-transition .tp-dropdown-trigger {
  transition:
    background-color 220ms ease,
    color 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease !important;
}
```

**Why it is expensive:**
- `box-shadow` is a paint-heavy property. Animating it on every `.tp-card` at
  the same time forces a repaint of all cards on every frame of the 220ms
  transition. This is the most visible part of the stutter.
- The selector list includes **hidden** surfaces (`.tp-dropdown-menu`,
  `.tp-field-input`, admin-only classes, footer, mega menu). They get the
  `!important` transition and the associated style recalculation even when
  nothing is on screen.
- `!important` is needed only to beat the universal rule in 2.1; it makes the
  override global and hard to narrow down per component.

**Timing check:** `header.tsx:88` removes `.theme-transition` after 240ms while
the CSS transition is 220ms. The timing itself is correct — the cost is the
number of elements and the properties being animated, not the duration.

---

## 3. Contributing slowness (not theme-specific)

### 3.1 Blurred backdrop — `src/app/globals.css` (lines 672–690)

```css
/* nav / search panel */
backdrop-filter: blur(24px) saturate(140%);
-webkit-backdrop-filter: blur(24px) saturate(140%);
opacity: 0;
visibility: hidden;
pointer-events: none;
transform: translate(-50%, -8px) scale(0.985);
transform-origin: top center;
transition:
  opacity 200ms var(--ease-out),
  transform 240ms var(--ease-out),
  ...
```

When the theme changes, the backdrop behind this element changes too, so the
24px blur has to be recomposited. Large backdrop blurs are among the most
expensive effects to re-render.

### 3.2 Large decorative blur orbs — `src/app/globals.css` (lines ~2722, ~3990)

```css
filter: blur(80px);
```

```css
filter: blur(100px);
```

Fixed large-radius blurs get recomposited when the theme's colour variables
change.

### 3.3 Blur-up reveal on every route change — `src/components/site-transitions.tsx`

```tsx
const SELECTOR = [
  ".tp-section-title",
  ".tp-page-title h1",
  ".tp-page-title p",
  ".tp-lede",
  ".tp-atlas-title",
  ".tp-atlas-lead",
  ".tp-atlas-h2",
  ".tp-wishlist-item",
  ".tp-wishlist-empty",
  ".tp-cta-inner",
  ".tp-breadcrumbs",
  ".tp-tabs",
  ".tp-split-copy .tp-eyebrow",
  ".tp-split-copy.tp-split-copy-lg p",
  ".tp-category-cta",
  ".tp-footer-brand",
  ".tp-footer-col h3",
  ".tp-footer-col li",
  ".tp-footer-bottom .footer-link",
].join(",");

export function SiteTransitions() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
      (el) => !el.closest("[data-reveal-wrap]")
    );

    // Hide synchronously before paint — no flash of unstyled content.
    const baseDelay = 120;
    nodes.forEach((el) => {
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((child) => nodes.includes(child as HTMLElement))
        : [];
      const index = siblings.indexOf(el);
      el.style.setProperty("--tp-delay", `${baseDelay + Math.min(index, 8) * 90}ms`);
      el.classList.add("tp-anim");
    });

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("tp-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("tp-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
```

```css
/* src/app/globals.css — lines 4899–4923 */
/* ---------- Global text + card reveals (mockup blur-up) ---------- */
/* Uses a keyframe animation instead of `transition`, so the reveal never
   overwrites a card's hover transition after the element has appeared. */
.tp-anim {
  opacity: 0;
  translate: 0 22px;
  filter: blur(14px);
}

.tp-anim.tp-revealed {
  animation: tp-blur-up 900ms var(--ease-reveal) var(--tp-delay, 0ms) both;
}

@keyframes tp-blur-up {
  from {
    opacity: 0;
    translate: 0 22px;
    filter: blur(14px);
  }
  to {
    opacity: 1;
    translate: 0 0;
    filter: none;
  }
}
```

This runs on **every** pathname change and puts a 14px blur on many text nodes
at once. It is a navigation cost rather than a theme-switch cost, but it
contributes to the overall "site is slow" feeling.

### 3.4 Always-on custom cursor loop — `src/components/site-motion.tsx` (lines 31–82)

```tsx
useEffect(() => {
  if (prefersReducedMotion()) return;
  const dot = dotRef.current;
  const ring = ringRef.current;
  if (!dot || !ring) return;

  let targetX = -100;
  let targetY = -100;
  let ringX = -100;
  let ringY = -100;
  let frame = 0;

  const onMove = (event: PointerEvent) => {
    targetX = event.clientX;
    targetY = event.clientY;
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  };

  const onOver = (event: PointerEvent) => {
    const el = event.target as HTMLElement | null;
    const interactive = el?.closest("a, button, [role='button'], input, textarea, select");
    if (interactive) ring.classList.add("is-active");
  };

  const onOut = (event: PointerEvent) => {
    const el = event.target as HTMLElement | null;
    const interactive = el?.closest("a, button, [role='button'], input, textarea, select");
    if (interactive && !el?.closest(":hover")) ring.classList.remove("is-active");
  };

  const tick = () => {
    ringX += (targetX - ringX) * 0.18;
    ringY += (targetY - ringY) * 0.18;
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    frame = window.requestAnimationFrame(tick);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerover", onOver);
  document.addEventListener("pointerout", onOut);
  frame = window.requestAnimationFrame(tick);

  return () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    window.cancelAnimationFrame(frame);
  };
}, []);
```

The `requestAnimationFrame` loop never stops and writes two inline transforms
every frame for the lifetime of the page. Small per frame, but constant main
thread work; it becomes noticeable during a theme switch or reveal animation.

### 3.5 Theme restore on locale navigation — `src/components/site-motion.tsx` (lines 19–29)

```tsx
useIsomorphicLayoutEffect(() => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch {
    // Storage may be blocked; the current attribute stays untouched.
  }
}, [pathname]);
```

Cheap, but it re-applies the attribute on every route change (without the
transition class).

---

## 4. Root cause summary

| Priority | Cause | Effect |
|---|---|---|
| 1 | `:where(*, *::before, *::after)` declares 10 transition properties on every element | Theme flip recomputes + evaluates transitions for the entire DOM in one frame |
| 2 | `html.theme-transition ... !important` animates `box-shadow` on every `.tp-card` and on hidden panels | Paint-heavy repaint of all cards each frame; needless style work on off-screen elements |
| 3 | `backdrop-filter: blur(24px)` and `filter: blur(80px/100px)` | Expensive recomposite when theme colours change |
| 4 | `tp-anim` blur-up on all routes | Navigation/reveal cost, adds to perceived slowness |
| 5 | Cursor rAF loop writes inline transforms forever | Constant low-level main-thread work |

**Verdict:** the switch lag is not caused by the toggle JavaScript (it only
sets an attribute and a class). It is caused by the CSS transition scope —
specifically the universal `:where(*)` rule plus `box-shadow` being transitioned
on every card under `html.theme-transition`.

---

## 5. Recommended fix (NOT applied)

1. Narrow `:where(*, *::before, *::after)` down to the properties that are
   genuinely safe and useful globally, e.g. `color`, `background-color`,
   `border-color`, `opacity`, `box-shadow`. Move `transform`/`translate` to the
   interactive component rules that actually use them. Remove `fill`, `stroke`
   and `box-shadow` from the universal list.
2. In the `html.theme-transition` block, drop `box-shadow` and `!important`,
   and limit the selector list to visible surfaces actually present on the
   route (`body`, `.tp-header`, `.tp-footer`, `.tp-card`). Remove the hidden
   dropdown/field/admin selectors.
3. Reduce or remove the `backdrop-filter: blur(24px)` on the nav/search panel
   and lower the decorative `blur(80px/100px)` radii.
4. Skip the `tp-anim` blur-up for elements already in view on first paint, or
   replace the `filter: blur()` with opacity + translate only.
5. Pause the cursor rAF loop when the pointer has not moved and on touch
   devices (already skipped for reduced motion).

---

## 6. Code change made together with this audit

File: `src/app/[locale]/page.tsx`

```diff
- import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
+ import { ArrowRight, Check } from "lucide-react";
```

```diff
  <span className="tp-tool-arrow" aria-hidden="true">
-   <ArrowUpRight className="tp-icon" />
+   <ArrowRight className="tp-icon" />
  </span>
```

Reason: `.tp-tool-arrow` now rests at `rotate(-45deg)` (1 o'clock) and rotates
to `rotate(0deg)` on hover (3 o'clock). An `ArrowUpRight` glyph already points
at 1 o'clock, so the extra `-45deg` made it point at 12 o'clock on the home
category cards. With `ArrowRight` everywhere, every card arrow follows the same
1 → 3 o'clock direction.

Relevant CSS (`src/app/globals.css`, lines 1906–1954):

```css
.tp-tool-arrow {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border-radius: 999px;
  background: transparent;
  color: var(--accent);
  line-height: 0;
  /* ArrowRight rests at 1 o'clock; hover turns it to 3 o'clock. */
  transform: rotate(-45deg);
  /* Same calm transition as the header "Request a tool" arrow. */
  transition:
    transform 450ms var(--ease-spring),
    background-color 450ms var(--ease-reveal),
    color 450ms var(--ease-reveal),
    box-shadow 420ms var(--ease-out);
}

.tp-tool-arrow .tp-icon {
  display: block;
  width: 16px;
  height: 16px;
  margin: auto;
  opacity: 0.55;
  transition: opacity 300ms var(--ease-out);
}

.tp-tool-card-wrap:hover .tp-tool-arrow,
.tp-tool-card-link:focus-visible .tp-tool-arrow,
.tp-category-card:hover .tp-tool-arrow,
.tp-category-card:focus-visible .tp-tool-arrow {
  background: var(--accent-fill);
  color: var(--on-accent);
  transform: translate(2px, -2px) rotate(0deg);
  /* Same ring + shadow as the saved heart's active state. */
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--accent) 26%, transparent),
    0 8px 18px color-mix(in srgb, var(--accent) 24%, transparent);
}
```
