"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type DropdownOption = { value: string; label: string };

export function Dropdown({
  id,
  value,
  options,
  onChange,
  placeholder = "Choose one",
  ariaLabel,
  icon,
  triggerClassName,
  menuClassName,
  triggerLabel,
  openOnHover = false,
  portal = false,
  disabled = false,
}: {
  id: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  icon?: React.ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  triggerLabel?: string;
  openOnHover?: boolean;
  /** Render the menu in document.body so scroll/overflow parents cannot clip it. */
  portal?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 });

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;

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

  useIsomorphicLayoutEffect(() => {
    if (!open || !portal) return;

    const place = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;

      const rect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const below = rect.bottom + 8;
      const top =
        below + menuRect.height > window.innerHeight
          ? Math.max(8, rect.top - 8 - menuRect.height)
          : below;
      const left = Math.min(
        Math.max(8, rect.right - menuRect.width),
        Math.max(8, window.innerWidth - menuRect.width - 8),
      );

      setPortalPos({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, portal]);

  const openMenu = () => {
    if (disabled) return;
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const choose = (next: string) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setHighlight((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % options.length
          : (current - 1 + options.length) % options.length,
      );
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      choose(options[highlight].value);
    }
  };

  const menu = (
    <div
      ref={menuRef}
      className={cn("tp-dropdown-menu", menuClassName)}
      data-open={open}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={open ? `${id}-option-${options[highlight].value}` : undefined}
      aria-hidden={!open}
      inert={!open}
      onKeyDown={onKeyDown}
      style={
        portal
          ? { position: "fixed", top: portalPos.top, left: portalPos.left, right: "auto" }
          : undefined
      }
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          id={`${id}-option-${option.value}`}
          type="button"
          role="option"
          aria-selected={option.value === value}
          className={cn(
            "tp-dropdown-option",
            index === highlight && "is-highlighted",
            option.value === value && "is-selected",
          )}
          onMouseEnter={() => setHighlight(index)}
          onClick={() => choose(option.value)}
        >
          <span>{option.label}</span>
          {option.value === value && (
            <Check className="tp-icon" style={{ width: 14, height: 14 }} aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="tp-dropdown"
      ref={rootRef}
      onMouseEnter={openOnHover ? () => {
        if (hoverTimer.current !== null) {
          window.clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
        }
        openMenu();
      } : undefined}
      onMouseLeave={openOnHover ? () => {
        if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => setOpen(false), 260);
      } : undefined}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={cn("tp-dropdown-trigger tp-icon-btn", triggerClassName)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        {icon}
        <span className={cn(selectedIndex < 0 && "is-placeholder")}>
          {triggerLabel ?? selectedLabel}
        </span>
        <ChevronDown
          className={cn("tp-icon chevron", open && "is-open")}
          style={{ width: 12, height: 12 }}
          aria-hidden="true"
        />
      </button>

      {portal
        ? open && typeof document !== "undefined" ? createPortal(menu, document.body) : null
        : menu}
    </div>
  );
}
