"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<number | null>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : placeholder;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const openMenu = () => {
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

      <div
        className={cn("tp-dropdown-menu", menuClassName)}
        data-open={open}
        role="listbox"
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${id}-option-${options[highlight].value}` : undefined}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onKeyDown}
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
    </div>
  );
}
