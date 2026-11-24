import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Copy as CopyIcon,
  Gauge,
  Info,
  Languages,
  LayoutGrid,
  PenLine,
  Ruler,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundX,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Reveal } from "@/components/ui/reveal";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { CopyButton } from "@/components/tools/workspace-ui";
import type { Tool } from "@/lib/tools/registry";
import type { ToolPageContent } from "@/lib/tools/tool-content";

const FEATURE_ICONS = [Zap, Ruler, CopyIcon, Sparkles, ShieldCheck, Gauge] as const;
const USE_CASE_ICONS = [Target, PenLine, ClipboardCheck, Languages] as const;

/**
 * Full template-compliant page for tools with hand-written content.
 * The page is split into three clear zones: a tool hero, the live workspace,
 * and a readable documentation area with a sticky table of contents.
 */
export function FullToolPage({
  tool,
  title,
  content,
  related,
  homeLabel,
  categoryLabel,
  relatedTitle,
  aboutLinkLabel,
  inputLabel,
  outputLabel,
  workspaceLabel,
  contextualTool,
  onThisPageLabel,
  quickFactsLabel,
  freeLabel,
  noSignupLabel,
  privacyLabel,
  copyLabel,
  copiedLabel,
}: {
  tool: Tool;
  title: string;
  content: ToolPageContent;
  related: Tool[];
  homeLabel: string;
  categoryLabel: string;
  relatedTitle: string;
  aboutLinkLabel: string;
  inputLabel: string;
  outputLabel: string;
  workspaceLabel: string;
  contextualTool?: Tool;
  onThisPageLabel: string;
  quickFactsLabel: string;
  freeLabel: string;
  noSignupLabel: string;
  privacyLabel: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const contextualParts = content.contextualLink.split("%%TOOL%%");
  const titleWords = title.trim().split(/\s+/u);
  const titleAccent = titleWords.length > 1 ? titleWords.pop() ?? title : title;
  const titleMain = titleWords.join(" ");

  const tocItems = [
    { id: "what-is", label: content.whatIsTitle },
    { id: "how-to", label: content.howToTitle },
    { id: "example", label: content.exampleTitle },
    { id: "features", label: content.featuresTitle },
    { id: "use-cases", label: content.useCasesTitle },
    { id: "mistakes", label: content.mistakesTitle },
    { id: "limits", label: content.limitsTitle },
    { id: "faq", label: content.faqTitle },
  ];

  return (
    <main className="tp-container tp-tool-page" style={{ paddingBottom: 64 }}>
      <Reveal>
        <Breadcrumbs
          items={[
            { label: homeLabel, href: "/" },
            { label: categoryLabel, href: `/category/${tool.category}` },
            { label: title },
          ]}
        />
      </Reveal>

      <Reveal>
        <header className="tp-tool-hero">
          <div className="tp-tool-hero-eyebrow">
            <span className="tp-tool-hero-icon" aria-hidden="true">
              <ToolIcon name={tool.icon} className="tp-icon" />
            </span>
            <span className="tp-tool-hero-cat">{categoryLabel}</span>
            <span className="tp-tool-hero-sep" aria-hidden="true" />
            <span className="tp-tool-hero-byline">{content.byline}</span>
          </div>

          <h1 className="tp-tool-hero-title" aria-label={title}>
            {titleMain ? <>{titleMain}{" "}</> : null}
            <span className="tp-tool-hero-accent">{titleAccent}</span>
          </h1>

          <p className="tp-tool-hero-lede">{content.directAnswer}</p>

          <div className="tp-tool-hero-chips">
            <span className="tp-tool-hero-chip">
              <ShieldCheck aria-hidden="true" />
              {privacyLabel}
            </span>
            <span className="tp-tool-hero-chip">
              <Zap aria-hidden="true" />
              {freeLabel}
            </span>
            <span className="tp-tool-hero-chip">
              <UserRoundX aria-hidden="true" />
              {noSignupLabel}
            </span>
          </div>
        </header>
      </Reveal>

      <section className="tp-tool-page-workspace" aria-label={workspaceLabel}>
        <ToolWorkspace slug={tool.slug} />
      </section>

      <div className="tp-doc-layout">
        <article className="tp-doc-article">
          <header className="tp-doc-head">
            <h2 className="tp-doc-title">{content.aboutTitle}</h2>
          </header>

          <section id="what-is" className="tp-doc-section" aria-labelledby="tp-doc-what-is">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-what-is" className="tp-doc-h3">{content.whatIsTitle}</h3>
            </div>
            <div className="tp-doc-copy">
              {content.whatIsParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              {contextualTool ? (
                <p>
                  {contextualParts[0]}
                  <Link href={`/tools/${contextualTool.slug}`} className="tp-text-link">
                    {contextualTool.title}
                  </Link>
                  {contextualParts[1] ?? ""}
                </p>
              ) : null}
            </div>
          </section>

          <section id="how-to" className="tp-doc-section" aria-labelledby="tp-doc-how-to">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-how-to" className="tp-doc-h3">{content.howToTitle}</h3>
            </div>
            <ol className="tp-doc-steps">
              {content.howToSteps.map((step, index) => (
                <li key={step} className="tp-doc-step">
                  <span className="tp-doc-step-num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="example" className="tp-doc-section" aria-labelledby="tp-doc-example">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-example" className="tp-doc-h3">{content.exampleTitle}</h3>
            </div>
            <p className="tp-doc-example-label">{content.exampleLabel}</p>
            <div className="tp-doc-example">
              <div className="tp-doc-example-pane">
                <div className="tp-doc-example-head">
                  <span>{inputLabel}</span>
                  <CopyButton
                    text={content.exampleInput}
                    label={copyLabel}
                    copiedLabel={copiedLabel}
                    className="tp-doc-copy-btn"
                  />
                </div>
                <pre><code>{content.exampleInput}</code></pre>
              </div>
              <div className="tp-doc-example-pane tp-doc-example-pane--out">
                <div className="tp-doc-example-head">
                  <span>{outputLabel}</span>
                  <CopyButton
                    text={content.exampleOutput}
                    label={copyLabel}
                    copiedLabel={copiedLabel}
                    className="tp-doc-copy-btn"
                  />
                </div>
                <pre><code>{content.exampleOutput}</code></pre>
              </div>
            </div>
            <p className="tp-doc-note">{content.exampleNote}</p>
          </section>

          <section id="features" className="tp-doc-section" aria-labelledby="tp-doc-features">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-features" className="tp-doc-h3">{content.featuresTitle}</h3>
            </div>
            <div className="tp-doc-grid">
              {content.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
                return (
                  <article key={feature.title} className="tp-doc-card">
                    <span className="tp-doc-card-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <h4>{feature.title}</h4>
                    <p>{feature.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="use-cases" className="tp-doc-section" aria-labelledby="tp-doc-use-cases">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-use-cases" className="tp-doc-h3">{content.useCasesTitle}</h3>
            </div>
            <div className="tp-doc-grid">
              {content.useCases.map((useCase, index) => {
                const Icon = USE_CASE_ICONS[index % USE_CASE_ICONS.length];
                return (
                  <article key={useCase.title} className="tp-doc-card tp-doc-card--use">
                    <span className="tp-doc-card-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <h4>{useCase.title}</h4>
                    <p>{useCase.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="mistakes" className="tp-doc-section" aria-labelledby="tp-doc-mistakes">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-mistakes" className="tp-doc-h3">{content.mistakesTitle}</h3>
            </div>
            <div className="tp-doc-grid">
              {content.mistakes.map((mistake) => (
                <article key={mistake.title} className="tp-doc-card tp-doc-card--warn">
                  <span className="tp-doc-card-icon" aria-hidden="true">
                    <AlertTriangle />
                  </span>
                  <h4>{mistake.title}</h4>
                  <p>{mistake.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="limits" className="tp-doc-section" aria-labelledby="tp-doc-limits">
            <div className="tp-doc-section-head">
              <h3 id="tp-doc-limits" className="tp-doc-h3">{content.limitsTitle}</h3>
            </div>
            <ul className="tp-doc-limits">
              {content.limits.map((limit) => (
                <li key={limit}>
                  <Info aria-hidden="true" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="tp-doc-rail">
          <nav className="tp-doc-toc" aria-label={onThisPageLabel}>
            <p className="tp-doc-rail-label">{onThisPageLabel}</p>
            <ol>
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="tp-doc-facts">
            <p className="tp-doc-rail-label">{quickFactsLabel}</p>
            <ul className="tp-doc-fact-list">
              <li>
                <span className="tp-doc-fact-icon" aria-hidden="true"><LayoutGrid /></span>
                {categoryLabel}
              </li>
              <li>
                <span className="tp-doc-fact-icon" aria-hidden="true"><ShieldCheck /></span>
                {privacyLabel}
              </li>
              <li>
                <span className="tp-doc-fact-icon" aria-hidden="true"><Zap /></span>
                {freeLabel}
              </li>
              <li>
                <span className="tp-doc-fact-icon" aria-hidden="true"><UserRoundX /></span>
                {noSignupLabel}
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <Reveal>
        <section id="faq" className="tp-doc-faq-section" aria-labelledby="tp-doc-faq-title">
          <div className="tp-doc-section-head">
            <h2 id="tp-doc-faq-title" className="tp-doc-h2">{content.faqTitle}</h2>
          </div>
          <div className="tp-doc-faq-grid">
            {content.faqs.map((faq) => (
              <article key={faq.question} className="tp-doc-faq">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      {related.length > 0 ? (
        <section className="tp-doc-related" aria-labelledby="tp-doc-related-title">
          <div className="tp-doc-section-head">
            <h2 id="tp-doc-related-title" className="tp-doc-h2">{relatedTitle}</h2>
          </div>
          <div className="tp-tool-grid tp-tool-related-grid">
            {related.map((item) => (
              <ToolCard key={item.slug} tool={item} />
            ))}
          </div>
        </section>
      ) : null}

      <Reveal>
        <section className="tp-doc-trust">
          <span className="tp-doc-trust-icon" aria-hidden="true">
            <ShieldCheck />
          </span>
          <div>
            <h2>{content.trustTitle}</h2>
            <p>{content.trustBody}</p>
            <Link href="/about" className="tp-text-link tp-doc-trust-link">
              {aboutLinkLabel}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
