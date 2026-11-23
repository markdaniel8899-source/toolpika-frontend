/**
 * Shared theme switch helper.
 *
 * Adds the transition class in the same frame as the theme attribute so every
 * themed surface animates together, and keeps the class on for the full
 * transition. A single module-level timer makes rapid toggles safe: the class
 * is never pulled off mid-fade by an earlier click's timeout.
 */
const THEME_TRANSITION_MS = 220;
let transitionTimer: number | undefined;

export function setTheme(theme: "light" | "dark", persist = true) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (root.getAttribute("data-theme") !== theme) {
    root.classList.add("theme-transition");
    root.setAttribute("data-theme", theme);

    if (transitionTimer !== undefined) window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      transitionTimer = undefined;
    }, THEME_TRANSITION_MS + 20);
  }

  if (persist) {
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Storage can be blocked; the attribute still updates for this session.
    }
  }
}
