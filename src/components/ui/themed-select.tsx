"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Theme-aware select. Native <select> popups are drawn by the OS and ignore
 * our tokens (they show a blue highlight in light and dark alike), so tool
 * UIs use this listbox instead. It reuses the shared .tp-dropdown-menu /
 * .tp-dropdown-option tokens and supports keyboard + click-outside.
 */
export function ThemedSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // The menu is portalled to body so a tool card's overflow cannot clip it.
  useIsoLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      const rect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const below = rect.bottom + 6;
      const top =
        below + menuRect.height > window.innerHeight
          ? Math.max(8, rect.top - 6 - menuRect.height)
          : below;
      setPosition({
        top,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - menuRect.width - 8)),
        width: rect.width,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  function openList() {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (!option) return;
    onValueChange(option.value);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActive((index) =>
        event.key === "ArrowDown"
          ? Math.min(index + 1, options.length - 1)
          : Math.max(index - 1, 0),
      );
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      commit(active);
    }
  }

  return (
    <div ref={rootRef} className={cn("tp-select-wrap", className)}>
      <button
        ref={triggerRef}
        type="button"
        className="tp-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span>{selectedLabel}</span>
        <ChevronDown className="tp-select-chevron" aria-hidden="true" />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="tp-dropdown-menu tp-select-portal-menu"
              data-open="true"
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                right: "auto",
                width: Math.max(position.width, 180),
              }}
            >
              {options.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={cn(
                    "tp-dropdown-option",
                    index === active && "is-highlighted",
                    option.value === value && "is-selected",
                  )}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => commit(index)}
                >
                  <span>{option.label}</span>
                  {option.value === value ? (
                    <Check className="tp-icon" aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
