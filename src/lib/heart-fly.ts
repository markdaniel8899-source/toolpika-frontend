"use client";

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

const FLY_MS = 720;
const SIZE = 26;

/**
 * Send a heart from a tool card to the header wishlist button.
 * The clone is fixed-position, so it travels with the viewport even while
 * the page is scrolled. Falls back to nothing when motion is reduced.
 */
export function flyHeartToWishlist(source: HTMLElement) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const target = document.querySelector<HTMLElement>(".tp-wish-trigger");
  if (!target) return;

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const toX = to.left + to.width / 2;
  const toY = to.top + to.height / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;

  const ghost = document.createElement("div");
  ghost.className = "tp-heart-fly";
  ghost.setAttribute("aria-hidden", "true");
  ghost.innerHTML = `<svg viewBox="0 0 24 24"><path d="${HEART_PATH}" /></svg>`;
  ghost.style.left = `${fromX - SIZE / 2}px`;
  ghost.style.top = `${fromY - SIZE / 2}px`;
  document.body.appendChild(ghost);

  const arc = -Math.max(28, Math.abs(dy) * 0.24);
  const animation = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 + arc}px) scale(0.92) rotate(-10deg)`,
        opacity: 1,
        offset: 0.48,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(0.22) rotate(14deg)`,
        opacity: 0.2,
      },
    ],
    { duration: FLY_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );

  animation.onfinish = () => {
    ghost.remove();
    target.classList.add("is-pop");
    window.setTimeout(() => target.classList.remove("is-pop"), 380);
  };
}
