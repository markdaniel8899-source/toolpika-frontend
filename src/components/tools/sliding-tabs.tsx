"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SlidingTabItem = {
  slug: string;
  label: string;
  icon?: ReactNode;
};

export function SlidingTabs({
  items,
  active,
  onChange,
  duration = 420,
  className,
  ariaLabel,
}: {
  items: SlidingTabItem[];
  active: string;
  onChange: (slug: string) => void;
  duration?: number;
  className?: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasMeasuredRef = useRef(false);
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // When the active tab lives in the other row, keep the last position so
    // the hidden indicator never jumps back to the start on its way back.
    const button =
      buttonRefs.current[active] ??
      (hasMeasuredRef.current
        ? null
        : Object.values(buttonRefs.current).find(Boolean));
    if (!button) return;
    const containerBox = container.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const x = buttonBox.left - containerBox.left;
    const width = buttonBox.width;
    hasMeasuredRef.current = true;
    setIndicator((current) =>
      current.x === x && current.width === width && current.ready
        ? current
        : { x, width, ready: true }
    );
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    Object.values(buttonRefs.current).forEach((button) => {
      if (button) observer.observe(button);
    });
    return () => observer.disconnect();
  }, [measure]);

  const isActiveInRow = items.some((item) => item.slug === active);

  return (
    <div
      ref={containerRef}
      className={cn("tp-tabs tp-tabs-sliding", className)}
      style={{ "--tp-tab-glide": `${duration}ms` } as CSSProperties}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span
        className="tp-tab-highlight"
        aria-hidden="true"
        style={{
          transform: indicator.ready ? `translateX(${indicator.x}px)` : undefined,
          width: indicator.ready ? indicator.width : undefined,
          opacity: indicator.ready && isActiveInRow ? 1 : 0,
        }}
      />
      {items.map((item) => {
        const isActive = active === item.slug;
        return (
          <button
            key={item.slug}
            ref={(element) => {
              buttonRefs.current[item.slug] = element;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn("tp-tab", isActive && "is-active")}
            onClick={() => onChange(item.slug)}
          >
            <span className="tp-tab-label tp-tab-inline">
              {item.icon}
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
