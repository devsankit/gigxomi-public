import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "@/lib/seo/blog-posts";
import { blogImage, getBlogPost } from "@/lib/seo/blog-posts";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import type { WordPressEditorialPost } from "@/lib/seo/wordpress-editorial";

type Props = {
  post: WordPressEditorialPost;
  relatedLocalPosts: BlogPost[];
  relatedWordPressPosts: WordPressEditorialPost[];
};

function extractFaqsFromContent(contentHtml: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const headingRegex = /<h3>([^<]+)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(contentHtml)) !== null) {
    const question = match[1].trim();
    const answer = match[2].replace(/<[^>]+>/g, "").trim();
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  if (faqs.length === 0) {
    const summaryRegex = /<summary>([^<]+)<\/summary>\s*<p>([\s\S]*?)<\/p>/gi;
    while ((match = summaryRegex.exec(contentHtml)) !== null) {
      const question = match[1].trim();
      const answer = match[2].replace(/<[^>]+>/g, "").trim();
      if (question && answer) {
        faqs.push({ question, answer });
      }
    }
  }
  return faqs;
}

export function WordPressEditorialArticle({ post, relatedLocalPosts, relatedWordPressPosts }: Props) {
  const articleUrl = buildSiteUrl(`/blog/${post.slug}`);
  const heroImage = post.featuredImageUrl || blogImage;
  const isGrowthGuide = post.contentKind === "growth-guide";
  const localPost = getBlogPost(post.slug);
  const faqs = localPost?.faqs?.length ? localPost.faqs : extractFaqsFromContent(post.contentHtml);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${articleUrl}#webpage`,
        url: articleUrl,
        name: post.title,
        description: post.excerpt,
        isPartOf: { "@id": `${companyKnowledgeBase.siteUrl}#website` },
        breadcrumb: { "@id": `${articleUrl}#breadcrumb` },
        mainEntity: { "@id": `${articleUrl}#article` },
        primaryImageOfPage: { "@id": `${articleUrl}#primaryimage` },
      },
      {
        "@type": "WebSite",
        "@id": `${companyKnowledgeBase.siteUrl}#website`,
        name: companyKnowledgeBase.brandName,
        url: companyKnowledgeBase.siteUrl,
        publisher: { "@id": `${companyKnowledgeBase.siteUrl}#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${companyKnowledgeBase.siteUrl}#organization`,
        name: companyKnowledgeBase.brandName,
        url: companyKnowledgeBase.siteUrl,
        logo: {
          "@type": "ImageObject",
          url: buildSiteUrl(companyKnowledgeBase.logoPath),
        },
        sameAs: [...companyKnowledgeBase.socialProfiles],
      },
      {
        "@type": "ImageObject",
        "@id": `${articleUrl}#primaryimage`,
        url: heroImage.startsWith("http") ? heroImage : buildSiteUrl(heroImage),
        caption: post.featuredImageAlt,
      },
      {
        "@type": "Article",
        "@id": `${articleUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        image: [heroImage.startsWith("http") ? heroImage : buildSiteUrl(heroImage)],
        datePublished: post.publishedAt,
        dateModified: post.modifiedAt,
        author: {
          "@type": "Organization",
          name: post.authorName,
          url: buildSiteUrl("/blog/editorial-methodology"),
        },
        publisher: {
          "@type": "Organization",
          name: companyKnowledgeBase.brandName,
          url: companyKnowledgeBase.siteUrl,
          logo: {
            "@type": "ImageObject",
            url: buildSiteUrl(companyKnowledgeBase.logoPath),
          },
        },
        mainEntityOfPage: { "@id": `${articleUrl}#webpage` },
        isAccessibleForFree: true,
      },
      ...(faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${articleUrl}#faq`,
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: { "@type": "WebPage", "@id": buildSiteUrl("/"), name: "Home" } },
          { "@type": "ListItem", position: 2, name: "Blog", item: { "@type": "WebPage", "@id": buildSiteUrl("/blog"), name: "Blog" } },
          { "@type": "ListItem", position: 3, name: post.title, item: { "@type": "WebPage", "@id": articleUrl, name: post.title } },
        ],
      },
    ],
  };

  return (
    <article className="blog-article">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
      <header className="blog-article-header">
        <div>
          <Link className="blog-back-link" href="/blog">
            Blog
          </Link>
          <p className="blog-kicker">
            {isGrowthGuide ? "Video editing client growth / Practical guide" : "Independent software comparison / Video editing agencies"}
          </p>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="blog-meta-row">
            <span>{post.authorName}</span>
            <span>
              Verified {new Date(post.modifiedAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <Link href="/blog/editorial-methodology">Editorial methodology</Link>
          </div>
        </div>
        <div className="blog-article-media">
          <Image alt={post.featuredImageAlt} fill priority sizes="(max-width: 920px) 100vw, 38vw" src={heroImage} />
        </div>
      </header>

      <div className="blog-article-layout">
        <aside className="blog-article-sidebar">
          <div className="blog-sidebar-panel">
            <strong>{isGrowthGuide ? "Practical growth standard" : "Buyer-guide standard"}</strong>
            <p>
              {isGrowthGuide
                ? "Actionable client-acquisition steps, team workflows, and an operational route to build a sustainable video editing agency."
                : "Competitor strengths, tradeoffs, migration advice, and claims checked against current official sources."}
            </p>
          </div>
          <div className="blog-sidebar-panel" style={{ border: "1px solid rgba(215, 255, 47, 0.3)", background: "rgba(215, 255, 47, 0.04)" }}>
            <strong style={{ color: "var(--accent, #D7FF2F)" }}>Master Pillar Guide</strong>
            <p style={{ fontSize: "0.85rem", margin: "4px 0 8px" }}>The operational blueprint for video editing agencies:</p>
            <Link href="/blog/video-editing-agency-management-software-system" style={{ fontWeight: 600, color: "var(--accent, #D7FF2F)", textDecoration: "underline" }}>
              Video Editing Agency Management Software & System &rarr;
            </Link>
          </div>
          <div className="blog-sidebar-panel">
            <strong>Decision shortcuts</strong>
            <a
              href="https://app.gigxomi.com/signup"
              rel="nofollow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                color: "#1F1F1F",
                background: "#FFFFFF",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "8px",
                textDecoration: "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Start Free with Google
            </a>
            <Link href="/pricing">Review Agency Plans (0% Fee)</Link>
            <Link href="/blog/video-editing-project-management-tools">Compare project-management tools</Link>
            <a
              href={`https://wa.me/919993328124?text=${encodeURIComponent(
                `Hi Gigxomi team, I read "${post.title}" and want to explore the Agency Scale Pro workspace.`
              )}`}
              rel="noreferrer"
              target="_blank"
            >
              Agency Concierge (+91 99933 28124)
            </a>
          </div>
        </aside>

        <div className="blog-article-body">
          <div className="blog-wordpress-content" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

          <section className="blog-cta-panel">
            <span className="meta-pill" style={{ display: "inline-block", marginBottom: "8px" }}>0% Commission · Anti-Poaching Shield · 14-Day Trial</span>
            <h2>Scale Your Video Editing Agency Without Losing Clients to Editor Poaching</h2>
            <p>
              Gigxomi combines WhatsApp client intake, masked two-lane editor communication, internal manager review layers,
              and automated UPI payouts in one connected workspace. Keep 100% of your client retainers with zero marketplace cuts.
            </p>
            <div className="blog-hero-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
              <a
                className="gx-button gx-button-primary"
                href="https://app.gigxomi.com/signup"
                rel="nofollow"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#FFFFFF",
                  color: "#1F1F1F",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign Up Free with Google
              </a>
              <Link href="/pricing">View Agency Plans & Pricing</Link>
              <a
                href={`https://wa.me/919993328124?text=${encodeURIComponent(
                  `Hi Gigxomi team, I read "${post.title}" and want to onboard my video editing agency.`
                )}`}
                rel="noreferrer"
                style={{ background: "#25D366", color: "#051A0B" }}
                target="_blank"
              >
                Chat with Concierge (+91 99933 28124)
              </a>
            </div>
            <p style={{ marginTop: "14px", fontSize: "0.82rem", opacity: 0.85 }}>
              Are you a freelance editor? <Link href="/freelancers" style={{ color: "var(--accent, #D7FF2F)", textDecoration: "underline" }}>Join agency projects & keep 100% earnings (Free Forever)</Link>
            </p>
          </section>

          {relatedWordPressPosts.length || relatedLocalPosts.length ? (
            <section>
              <h2>Related guides</h2>
              <div className="blog-related-grid">
                {relatedWordPressPosts.map((related) => (
                  <Link href={`/blog/${related.slug}`} key={related.id}>
                    <span>{related.contentKind === "growth-guide" ? "Client growth guide" : "Software comparison"}</span>
                    <strong>{related.title}</strong>
                  </Link>
                ))}
                {relatedLocalPosts.map((related) => (
                  <Link href={`/blog/${related.slug}`} key={related.id}>
                    <span>{related.focusKeyword}</span>
                    <strong>{related.title}</strong>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}
