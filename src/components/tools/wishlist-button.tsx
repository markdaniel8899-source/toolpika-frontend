"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/hooks/useWishlist";

export function WishlistButton({ slug, title }: { slug: string; title: string }) {
  const t = useTranslations("wishlist");
  const { has, toggle } = useWishlist();
  const saved = has(slug);

  return (
    <button
      type="button"
      className={cn("tp-wish-btn", saved && "is-saved")}
      aria-label={saved ? t("remove", { title }) : t("add", { title })}
      aria-pressed={saved}
      title={saved ? t("remove", { title }) : t("add", { title })}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(slug);
      }}
    >
      <Heart className="tp-icon" fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
