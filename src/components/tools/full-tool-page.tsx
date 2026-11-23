import { HelpCircle, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Reveal } from "@/components/ui/reveal";
import { ToolCard } from "@/components/tools/tool-card";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import type { Tool } from "@/lib/tools/registry";
import type { ToolPageContent } from "@/lib/tools/tool-content";

/**
 * Full template-compliant page for tools with hand-written content.
 * Order: breadcrumb, H1 + byline, direct answer, tool, About sections,
 * FAQs, related tools, author/trust block.
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
}) {
  const contextualParts = content.contextualLink.split("{tool}");

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

      <header className="tp-tool-page-head" style={{ marginTop: 20 }}>
        <h1 className="tp-tool-page-title">{title}</h1>
        <p className="tp-tool-page-byline">{content.byline}</p>
      </header>

      <p className="tp-content-lead" style={{ marginTop: 12 }}>{content.directAnswer}</p>

      <section className="tp-tool-page-workspace" aria-label={workspaceLabel}>
        <ToolWorkspace slug={tool.slug} />
      </section>

      <Reveal>
        <section className="tp-content-canvas tp-content-canvas--flush">
          <div className="tp-content-inner tp-article">
            <h2 className="tp-content-h2">{content.aboutTitle}</h2>

            <h3 className="tp-article-h3">{content.whatIsTitle}</h3>
            {content.whatIsParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="tp-article-copy">{paragraph}</p>
            ))}
            {contextualTool ? (
              <p className="tp-article-copy">
                {contextualParts[0]}
                <Link href={`/tools/${contextualTool.slug}`} className="tp-text-link">
                  {contextualTool.title}
                </Link>
                {contextualParts[1] ?? ""}
              </p>
            ) : null}

            <h3 className="tp-article-h3">{content.howToTitle}</h3>
            <ol className="tp-how-list">
              {content.howToSteps.map((step, index) => (
                <li key={step} className="tp-how-item">
                  <span className="tp-how-number" aria-hidden="true">{index + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>

            <h3 className="tp-article-h3">{content.exampleTitle}</h3>
            <p className="tp-article-copy"><strong>{content.exampleLabel}</strong></p>
            <pre className="tp-article-code">
              <code>{`${inputLabel}:\n${content.exampleInput}\n\n${outputLabel}:\n${content.exampleOutput}`}</code>
            </pre>
            <p className="tp-article-copy">{content.exampleNote}</p>

            <h3 className="tp-article-h3">{content.featuresTitle}</h3>
            <ul className="tp-article-list">
              {content.features.map((feature) => (
                <li key={feature.title} className="tp-article-copy">
                  <strong>{feature.title}:</strong> {feature.body}
                </li>
              ))}
            </ul>

            <h3 className="tp-article-h3">{content.useCasesTitle}</h3>
            <ul className="tp-article-list">
              {content.useCases.map((useCase) => (
                <li key={useCase.title} className="tp-article-copy">
                  <strong>{useCase.title}:</strong> {useCase.body}
                </li>
              ))}
            </ul>

            <h3 className="tp-article-h3">{content.mistakesTitle}</h3>
            <ul className="tp-article-list">
              {content.mistakes.map((mistake) => (
                <li key={mistake.title} className="tp-article-copy">
                  <strong>{mistake.title}:</strong> {mistake.body}
                </li>
              ))}
            </ul>

            <h3 className="tp-article-h3">{content.limitsTitle}</h3>
            <ul className="tp-article-list">
              {content.limits.map((limit) => (
                <li key={limit} className="tp-article-copy">{limit}</li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>

      <Reveal delay={80}>
        <section className="tp-faq-canvas">
          <div className="tp-content-inner tp-article">
            <h2 className="tp-content-h2">{content.faqTitle}</h2>
            <div className="tp-faq-list">
              {content.faqs.map((faq, index) => (
                <Reveal key={faq.question} stagger index={index}>
                  <article className="tp-faq-row">
                    <span className="tp-faq-icon">
                      <HelpCircle className="tp-icon" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="tp-faq-q">{faq.question}</h3>
                      <p className="tp-faq-a">{faq.answer}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {related.length > 0 ? (
        <section className="tp-tool-related">
          <h2 className="tp-tool-page-section-title">{relatedTitle}</h2>
          <div className="tp-tool-grid tp-tool-related-grid">
            {related.map((item) => (
              <ToolCard key={item.slug} tool={item} />
            ))}
          </div>
        </section>
      ) : null}

      <Reveal>
        <section className="tp-content-canvas tp-content-canvas--flush">
          <div className="tp-content-inner tp-article">
            <h2 className="tp-content-h2">
              <ShieldCheck className="tp-icon" aria-hidden="true" /> {content.trustTitle}
            </h2>
            <p className="tp-article-copy">{content.trustBody}</p>
            <Link href="/about" className="tp-text-link">{aboutLinkLabel}</Link>
          </div>
        </section>
      </Reveal>
    </main>
  );
}
