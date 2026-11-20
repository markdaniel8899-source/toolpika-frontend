"use client";

import { ArrowRight, Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useWishlist } from "@/hooks/use-wishlist";
import { PillCta } from "@/components/ui/pill-cta";
import { getTool } from "@/lib/tools/registry";

export default function WishlistPage() {
  const t = useTranslations("wishlist");
  const { wishlist, isLoaded, toggleWishlist } = useWishlist();

  const savedTools = wishlist
    .map((slug) => getTool(slug))
    .filter((tool): tool is NonNullable<ReturnType<typeof getTool>> => Boolean(tool));

  return (
    <main className="tp-container tp-page-hero">
      <div className="tp-page-title">
        <p className="tp-eyebrow">{t("label")}</p>
        <h1>{t("title")}</h1>
        <p>{t("savedTools")}</p>
      </div>

      {/* Nothing that depends on localStorage renders until it has been read. */}
      {isLoaded &&
        (savedTools.length === 0 ? (
          <div className="tp-wishlist-empty">
            <span className="tp-wishlist-empty-icon" aria-hidden="true">
              <Heart className="tp-icon" />
            </span>
            <p>{t("emptyPage")}</p>
            <PillCta href="/all-tools">{t("browseTools")}</PillCta>
          </div>
        ) : (
          <div className="tp-wishlist-grid">
            {savedTools.map((tool) => (
              <article className="tp-card tp-wishlist-item" key={tool.slug}>
                <div className="tp-tool-top">
                  <span className="tp-tool-cat">{tool.category}</span>
                  <button
                    type="button"
                    className="tp-wish-remove"
                    onClick={() => toggleWishlist(tool.slug)}
                    aria-label={t("remove", { title: tool.title })}
                    title={t("remove", { title: tool.title })}
                  >
                    <Heart className="tp-icon" fill="currentColor" aria-hidden="true" />
                  </button>
                </div>
                <h3 className="tp-tool-title">{tool.title}</h3>
                <p className="tp-tool-desc">{tool.description}</p>
                <Link href={`/tools/${tool.slug}`} className="tp-text-link" style={{ marginTop: 18 }}>
                  {t("open", { title: tool.title })}
                  <ArrowRight className="tp-icon" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        ))}
    </main>
  );
}
