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
  variant = "classic",
  duration = 420,
  className,
  ariaLabel,
}: {
  items: SlidingTabItem[];
  active: string;
  onChange: (slug: string) => void;
  variant?: "classic" | "soft" | "outline";
  duration?: number;
  className?: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const container = containerRef.current;
    const button = buttonRefs.current[active];
    if (!container || !button) {
      setIndicator((current) => (current.ready ? { ...current, ready: false } : current));
      return;
    }
    const containerBox = container.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const x = buttonBox.left - containerBox.left;
    const width = buttonBox.width;
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

  return (
    <div
      ref={containerRef}
      className={cn("tp-tabs tp-tabs-sliding", `tp-tabs-${variant}`, className)}
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
          opacity: indicator.ready ? 1 : 0,
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
            aria-pressed={isActive}
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
