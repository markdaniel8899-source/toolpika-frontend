"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

/**
 * Section 5 - Scroll reveal.
 * Default effect: opacity 0→1, translateY(26px)→0 and blur(8px)→0 over
 * --dur-slow, using the same cubic-bezier as the mockup.
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
  const { ref, inView } = useInView({ once, threshold: 0.15 });

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
        "transition-[opacity,transform,filter] duration-[var(--dur-slow)] ease-[var(--ease-reveal)]",
        className
      )}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(26px)",
        filter: inView ? "blur(0)" : "blur(8px)",
        transitionDelay: computedDelay > 0 ? `${computedDelay}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
