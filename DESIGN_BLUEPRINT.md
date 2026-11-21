# Toolpika — UI/UX Design Blueprint

> **Status:** living source of truth for component design. Project rules in
> `.agents/design-constitution.md` still win on brand decisions; this file is the
> practical, component-level extension of it. Any agent designing a new screen,
> tool, dropdown, card, or button **must** follow this file.

---

## 1. Token contract (never hardcode a colour)

All colours come from CSS custom properties defined in `src/app/globals.css`.

| Token | Role |
| :--- | :--- |
| `--bg` | Page ground (60%) |
| `--surface` | Cards, panels, menus (30%) |
| `--text` | Headings and primary text |
| `--muted` | Secondary text and descriptions |
| `--muted-2` | Tertiary hints only; never body copy |
| `--border` / `--border-strong` | Dividers and control outlines |
| `--accent` / `--accent-fill` / `--accent-hover` | The only saturated colour (10%) |
| `--accent-soft` | Tinted surface for icons, selected rows, result cards |
| `--field-bg` | Input / textarea / select trigger fill |
| `--on-accent` | Text on accent fill |
| `--radius-control` / `--radius-card` / `--radius-panel` | Shape scale |
| `--dur-fast` / `--ease-out` / `--ease-reveal` | Motion scale |

**Rules**
- No `#000000` or other literal hex in components. Use `var(--…)`.
- `--accent` appears on actions, focus, active states and at most one highlight.
- Use a tone step (`surface` → `bg`) to separate zones, never a shadow at rest
  except the one soft panel shadow on the tool workspace.

---

## 2. Typography

- Body / UI: **Inter** (`--font-inter`). Reading copy: 16px / 1.7 line-height,
  `--muted`, max width `768px` (`max-w-3xl`). Never full-width prose.
- Headings: **Plus Jakarta Sans** (`--font-jakarta`), `font-bold`,
  `tracking-[-0.02em]`. H2 `clamp(28px, 3vw, 36px)`, H3 `17–19px`.
- Page title (H1) stays Inter, `clamp(32px, 5vw, 44px)`, `tracking-[-0.04em]`.
- No tiny uppercase letter-spaced labels. Labels are sentence case, 13–14px,
  weight 600–700. Prefix with a 6px accent square when a label needs a marker.
- Big Apple NF (when licensed) is display-only: short strings, ≥28px, weight 400.

---

## 3. Buttons

Use the shared `Button` component. Variants:

- `default` (primary): `--accent-fill` + `--on-accent`, radius `--radius-control`.
- `secondary`: transparent + `--border` outline + `--text` label.
- `ghost`: transparent, `--muted` → `--text` on hover.
- `size="sm"` for inline controls, `size="icon"` for square icon controls.

**States:** hover lifts `translateY(-2px)` (or fill change), focus-visible ring
in `--accent`, active/selected uses `default` variant. Transition
`all 300ms var(--ease-out)`. Active segmented buttons get the accent fill and
must expose `aria-pressed`.

---

## 4. Inputs, textarea and selects

### Text fields
- `.tp-field-input` / `Input`: 46px height, `0 13px` padding, `--field-bg`,
  `--border-strong`, radius `--radius-control`, soft shadow.
- Focus: transparent border + `0 0 0 1px var(--focus-ring)` + `--field-shadow`.
- Tool workspace textarea: `14px 16px` padding, `resize: none` — **no resize grip**.
- Scrollbar arrow buttons are hidden globally (`::-webkit-scrollbar-button`).

### Selects / dropdowns — MANDATORY pattern
Native `<select>` popups are OS-drawn (blue highlight, ignore dark theme).
**Never use a bare `<select>` in a tool UI.** Use `ThemedSelect`
(`src/components/ui/themed-select.tsx`):

```tsx
<ThemedSelect
  value={value}
  onValueChange={setValue}
  options={[{ value: "m", label: "m" }, …]}
  ariaLabel={t("from")}
/>
```

It renders `.tp-select-trigger` + `.tp-dropdown-menu` with `data-open="true"`.
Menu rules:
- `bg: var(--surface)`, `border: var(--border)`, radius 12px, `--shadow-md`.
- Opens below the trigger, full trigger width, `transform-origin: top left`.
- Option: 13.5px `--text`, radius 8px, hover/highlight `--accent-soft` + `--accent`.
- Selected option: `--accent`, weight 600, trailing `Check` icon.
- Chevron rotates 180° while open. Keyboard: ↑/↓, Enter/Space, Escape;
  closes on outside click.
- The containing card must allow overflow (`overflow: visible`) so the menu is
  never clipped.

The same menu tokens apply to header menus, wishlist panel, search results and
any future submenu — one design, everywhere.

---

## 5. Cards and sub-cards

- Base card: `--surface`, 1px `--border`, radius `--radius-card`, padding 18–24px.
- Hover (interactive only): `translateY(-4px)`, border `--accent`,
  `0 18px 36px color-mix(in srgb, var(--accent) 10%, transparent)`,
  transition `all 300ms ease` / `var(--ease-out)`.
- Non-interactive sub-cards (`.tp-convert-card`, stat cards) keep a flat
  resting surface; **only** interactive cards lift.
- Result panel: `--accent-soft` + `--border` + radius, value in full ink,
  unit as a pill (`.tp-unit-chip`): `--surface` fill, `--accent` text.
- Stat cards: label 12px `--muted`, value 28px bold tabular, hover → accent.
- Related tool cards: 4 equal columns on desktop, 2 on tablet, 1 on mobile,
  `align-items: stretch`, single card minimum height ~164px.

---

## 6. Tool page layout (locked order)

`H1 → privacy line → How to use → workspace → About (article) → FAQs → Related`

- Workspace: 2 panes (input 1.3fr / result 1fr), result pane uses a `--bg` tone
  step, pane labels are sentence-case with an accent square.
- Content below the workspace is an **article**, not a card grid: H2 → lead →
  sections (H3 + paragraphs) → short closing paragraph. Left aligned, 820px cap.
- FAQs stay **fully visible** (SEO requirement), one vertical column,
  icon left + H3 question + muted answer, subtle hover background/border.
- The whole lower section is wrapped in `<Reveal>` for blur-clear scroll reveal.

---

## 7. Motion

- Fast UI transitions: `200ms` (`--dur-fast`), interactive cards `300ms`.
- Entrance: `<Reveal>` = opacity 0→1, translateY 26px→0, blur 14px→0,
  `900ms var(--ease-reveal)`, optional 60ms stagger via `stagger` + `index`.
- No bouncy, spinning, 3D, or 1s+ animations. Transform/opacity only.
- Everything has a `prefers-reduced-motion: reduce` fallback.

---

## 8. Rules for agents (checklist before shipping UI)

- [ ] Colours only via tokens; no literal hex, no pure black.
- [ ] New dropdown uses `ThemedSelect`, never a native `<select>`.
- [ ] New card uses the base card tokens; interactive ones get the lift + accent border.
- [ ] Buttons use the shared `Button` component and the documented variants.
- [ ] Text is sentence case; no tiny uppercase tracked labels.
- [ ] Prose is 16px/1.7, `--muted`, capped at 768px.
- [ ] Hover/focus/active states exist for every control.
- [ ] Menu parents allow overflow; nothing is clipped.
- [ ] Keyboard support and `prefers-reduced-motion` respected.
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` all pass.

When in doubt, copy an existing implementation of the same component in this
repo rather than inventing a new visual language.
