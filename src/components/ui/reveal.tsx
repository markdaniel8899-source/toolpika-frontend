"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

/**
 * Section 5 - Scroll reveal.
 * Default effect: opacity 0→1 and translateY(26px)→0 over 600ms, using the
 * same cubic-bezier as the mockup. The old blur(14px) filter was removed
 * because blurring large sections (tool articles, FAQ blocks) forces
 * expensive offscreen buffers and makes scrolling feel heavy.
 * `delay` prop adds a transition delay (ms).
 * `stagger` with `index` applies index * 60ms delay (max 8 steps).
 * Respects prefers-reduced-motion (animation disabled via CSS).
 */
export function Reveal({
  children,
  delay = 0,
  stagger,
  index,
  className,
  once = true,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  stagger?: boolean;
  index?: number;
  className?: string;
  once?: boolean;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView({ once, threshold: 0.08 });

  const computedDelay = (() => {
    let d = delay;
    if (stagger && typeof index === "number") {
      d += Math.min(index, 8) * 60;
    }
    return d;
  })();

  return (
    <div
      ref={ref}
      data-reveal-wrap
      className={cn(
        "transition-[opacity,transform] duration-[600ms] ease-[var(--ease-reveal)]",
        className
      )}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(26px)",
        transitionDelay: computedDelay > 0 ? `${computedDelay}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
