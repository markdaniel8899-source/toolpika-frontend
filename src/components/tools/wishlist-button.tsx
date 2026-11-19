"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";

export function WishlistButton({ slug, title }: { slug: string; title: string }) {
  const t = useTranslations("wishlist");
  const { isInWishlist, toggleWishlist, isLoaded } = useWishlist();
  const saved = isInWishlist(slug);

  // Render nothing that depends on localStorage until it has been read.
  if (!isLoaded) return null;

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
        toggleWishlist(slug);
      }}
    >
      <Heart className="tp-icon" aria-hidden="true" />
    </button>
  );
}
