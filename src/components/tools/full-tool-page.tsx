import {
  AlertTriangle,
  ClipboardCheck,
  Copy as CopyIcon,
  Gauge,
  Info,
  Languages,
  LayoutGrid,
  PenLine,
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
import type { ContentSection, ToolPageContent } from "@/lib/tools/tool-content";

const FEATURE_ICONS = [Zap, Gauge, CopyIcon, Sparkles, ShieldCheck, Target] as const;
const POINT_ICONS = [Target, PenLine, ClipboardCheck, Languages] as const;

/**
 * Modular tool page template. Sections come from each tool's content model,
 * so a tool can include, omit or reorder modules instead of inheriting an
 * identical seven-block article on every page.
 */
export function FullToolPage({
  tool,
  title,
  content,
  related,
  homeLabel,
  categoryLabel,
  relatedTitle,
  inputLabel,
  outputLabel,
  workspaceLabel,
  contextualTool,
  onThisPageLabel,
  quickAnswerLabel,
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
  inputLabel: string;
  outputLabel: string;
  workspaceLabel: string;
  contextualTool?: Tool;
  onThisPageLabel: string;
  quickAnswerLabel: string;
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

  const articleSections = content.sections.filter((section) => section.kind !== "faq");
  const faqSection = content.sections.find((section) => section.kind === "faq");
  const tocItems = content.sections.map((section) => ({
    id: section.id,
    label: section.title,
  }));

  function renderSection(section: ContentSection) {
    if (section.kind === "definition") {
      return (
        <div className="tp-doc-copy">
          <p className="tp-doc-answer">{section.answer}</p>
          {section.paragraphs.map((paragraph) => (
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
      );
    }

    if (section.kind === "steps") {
      return (
        <ol className="tp-doc-steps">
          {section.items.map((step, index) => (
            <li key={step} className="tp-doc-step">
              <span className="tp-doc-step-num" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      );
    }

    if (section.kind === "guidance") {
      return (
        <div className="tp-doc-copy">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      );
    }

    if (section.kind === "example") {
      return (
        <>
          <p className="tp-doc-example-label">{section.label}</p>
          <div className="tp-doc-example" aria-label={section.title}>
            <div className="tp-doc-example-pane">
              <div className="tp-doc-example-head">
                <span>{inputLabel}</span>
                <CopyButton
                  text={section.input}
                  label={copyLabel}
                  copiedLabel={copiedLabel}
                  className="tp-doc-copy-btn"
                />
              </div>
              <pre><code>{section.input}</code></pre>
            </div>
            <div className="tp-doc-example-pane tp-doc-example-pane--out">
              <div className="tp-doc-example-head">
                <span>{outputLabel}</span>
                <CopyButton
                  text={section.output}
                  label={copyLabel}
                  copiedLabel={copiedLabel}
                  className="tp-doc-copy-btn"
                />
              </div>
              <pre><code>{section.output}</code></pre>
            </div>
          </div>
          <p className="tp-doc-note">{section.note}</p>
        </>
      );
    }

    if (section.kind === "facts") {
      return (
        <div className="tp-doc-grid">
          {section.items.map((fact, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
            return (
              <article key={fact.title} className="tp-doc-card">
                <span className="tp-doc-card-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h4>{fact.title}</h4>
                <p>{fact.body}</p>
              </article>
            );
          })}
        </div>
      );
    }

    if (section.kind === "points") {
      const warning = section.tone === "warning";
      const Icon = warning ? AlertTriangle : POINT_ICONS[0];
      const limits = warning ? section.limits ?? [] : [];
      return (
        <>
          <div className={warning ? "tp-doc-mistakes" : "tp-doc-usecases"}>
            {section.items.map((item, index) => {
              const ItemIcon = warning ? Icon : POINT_ICONS[index % POINT_ICONS.length];
              return (
                <article key={item.title} className={warning ? "tp-doc-mistake" : "tp-doc-usecase"}>
                  <span className={warning ? "tp-doc-mistake-icon" : "tp-doc-usecase-icon"} aria-hidden="true">
                    <ItemIcon />
                  </span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
          {limits.length > 0 ? (
            <div className="tp-doc-limit-group">
              <h4>{section.limitsTitle}</h4>
              <ul className="tp-doc-limit-list">
                {limits.map((limit) => (
                  <li key={limit}>
                    <Info aria-hidden="true" />
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      );
    }

    return null;
  }

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
            <div className="tp-doc-quick">
              <p className="tp-doc-quick-label">{quickAnswerLabel}</p>
              <p className="tp-doc-quick-answer">{content.directAnswer}</p>
            </div>
          </header>

          {articleSections.map((section) => (
            <section key={section.id} id={section.id} className="tp-doc-section" aria-labelledby={`tp-doc-${section.id}`}>
              <div className="tp-doc-section-head">
                <h3 id={`tp-doc-${section.id}`} className="tp-doc-h3">{section.title}</h3>
              </div>
              {renderSection(section)}
            </section>
          ))}
        </article>

        <aside className="tp-doc-rail">
          <nav className="tp-doc-toc" aria-label={onThisPageLabel}>
            <p className="tp-doc-rail-label">{onThisPageLabel}</p>
            <ol>
              {tocItems.map((item, index) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
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

      {faqSection && faqSection.kind === "faq" ? (
        <Reveal>
          <section id={faqSection.id} className="tp-doc-faq-section" aria-labelledby="tp-doc-faq-title">
            <div className="tp-doc-section-head">
              <h2 id="tp-doc-faq-title" className="tp-doc-h2">{faqSection.title}</h2>
            </div>
            <div className="tp-doc-faq-grid">
              {faqSection.items.map((faq) => (
                <article key={faq.question} className="tp-doc-faq">
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

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
    </main>
  );
}
