import type { Metadata } from "next";
import Link from "next/link";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = "Gigxomi Editorial Methodology";
const description =
  "How Gigxomi researches, verifies, writes, updates, and corrects software comparisons for video editing agencies.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/blog/editorial-methodology" },
  openGraph: {
    title,
    description,
    type: "article",
    url: buildSiteUrl("/blog/editorial-methodology"),
  },
};

const standards = [
  {
    heading: "Primary-source research",
    body: "Feature, pricing, platform, security, and availability claims are checked against the competitor's current official website, documentation, help center, release notes, or app-store listing. Third-party summaries may inform questions, but they do not replace an official source for a factual product claim.",
  },
  {
    heading: "Balanced comparisons",
    body: "Each buyer guide states where the competing product is strong, where Gigxomi is a better fit, and where Gigxomi is not the right choice. We do not manufacture a universal winner because different teams have different workflow, collaboration, and procurement needs.",
  },
  {
    heading: "Confirmed Gigxomi capabilities",
    body: "Gigxomi claims are limited to features verified in the live product, production code, current public pages, or official Android listing. Planned work is labelled as planned and is not presented as available.",
  },
  {
    heading: "Visible verification dates",
    body: "Every comparison carries a visible verification date. Pricing and fast-changing feature details are rechecked before a scheduled article is published and during later editorial reviews.",
  },
  {
    heading: "Original analysis and media",
    body: "Verdicts, matrices, migration guidance, and decision criteria are written for video editing agencies rather than copied from vendor pages. Gigxomi screenshots use demonstration data and are reviewed to remove customer names, messages, phone numbers, and other private information.",
  },
  {
    heading: "AI-assisted, human-accountable",
    body: "Codex may assist with research organization, drafts, link checks, and image generation. Gigxomi Editorial remains responsible for claims, sourcing, publication decisions, corrections, and the final reader-facing article.",
  },
];

export default function EditorialMethodologyPage() {
  const articleUrl = buildSiteUrl("/blog/editorial-methodology");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    mainEntityOfPage: articleUrl,
    author: {
      "@type": "Organization",
      name: "Gigxomi Editorial",
      url: articleUrl,
    },
    publisher: {
      "@type": "Organization",
      name: companyKnowledgeBase.brandName,
      url: companyKnowledgeBase.siteUrl,
      logo: { "@type": "ImageObject", url: buildSiteUrl(companyKnowledgeBase.logoPath) },
    },
  };

  return (
    <MarketingSiteShell>
      <main className="gx-blog-page blog-canvas">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
        <article className="blog-article">
          <header className="blog-section-heading">
            <Link className="blog-back-link" href="/blog">
              Blog
            </Link>
            <p className="blog-kicker">Gigxomi Editorial</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>

          <div className="blog-article-body">
            <section>
              <h2>What readers can expect</h2>
              <p>
                Our comparison content is written to help an agency choose a working system, not to fill a keyword calendar.
                A sourcing gap, unverified claim, broken link, unsafe screenshot, or incomplete editorial review blocks publication.
              </p>
            </section>

            {standards.map((standard) => (
              <section key={standard.heading}>
                <h2>{standard.heading}</h2>
                <p>{standard.body}</p>
              </section>
            ))}

            <section>
              <h2>Corrections and updates</h2>
              <p>
                Product software changes quickly. If you find an outdated or incorrect claim, contact{" "}
                <a href={`mailto:${companyKnowledgeBase.contactEmail}`}>{companyKnowledgeBase.contactEmail}</a>. We review the
                cited source, correct material errors, update the verification date, and keep the article as a draft when a claim
                cannot be confirmed.
              </p>
            </section>

            <section className="blog-cta-panel">
              <h2>Apply the research to your agency</h2>
              <p>Scale your video editing agency on Gigxomi with zero client poaching risk, seamless freelance editor workflows, and 0% commission. Start free with Google.</p>
              <a className="blog-primary-link" href="https://app.gigxomi.com/signup" rel="nofollow">Start Free with Google</a>
            </section>
          </div>
        </article>
      </main>
    </MarketingSiteShell>
  );
}
