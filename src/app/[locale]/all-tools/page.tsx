import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SearchBar } from "@/components/tools/search-bar";
import { AllToolsBrowser } from "@/components/tools/all-tools-browser";
import { categories, getLiveTools } from "@/lib/tools/registry";

type LocalePageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: "nav" });
  const home = await getTranslations({ locale, namespace: "home" });
  return { title: nav("tools"), description: home("subtitle") };
}

export default async function AllToolsPage({ params }: LocalePageProps) {
  const { locale } = await params;
  const nav = await getTranslations({ locale, namespace: "nav" });
  const home = await getTranslations({ locale, namespace: "home" });
  const tools = getLiveTools();

  return (
    <main className="tp-container" style={{ paddingBottom: 64 }}>
      <section className="tp-page-hero">
        <div className="tp-page-title">
          <p className="tp-eyebrow">The collection</p>
          <h1>{nav("tools")}</h1>
          <p>{home("subtitle")}</p>
        </div>
      </section>

      <div style={{ maxWidth: 620, marginBottom: 16 }}>
        <SearchBar />
      </div>

      <AllToolsBrowser
        tools={tools}
        categories={categories.map((category) => ({
          slug: category.slug,
          label: category.label,
        }))}
      />

      <div style={{ marginTop: 40 }}>
        <Link href="/request" className="tp-text-link">
          Missing a tool? Request it
          <ArrowRight className="tp-icon" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
