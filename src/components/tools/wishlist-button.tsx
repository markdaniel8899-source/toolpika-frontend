"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

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
      <svg className="tp-heart-svg" viewBox="0 0 24 24" aria-hidden="true">
        <path className="tp-heart-trail" d={HEART_PATH} />
        <path className="tp-heart-path" d={HEART_PATH} />
      </svg>
      <span className="tp-wish-tip" role="tooltip">
        {saved ? t("tipSaved") : t("tipSave")}
      </span>
    </button>
  );
}
