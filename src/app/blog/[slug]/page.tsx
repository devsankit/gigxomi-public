import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { WordPressEditorialArticle } from "@/components/public/wordpress-editorial-article";
import {
  blogImage,
  getBlogPost,
  getBlogSeoTitle,
  getBlogStructuredKeywords,
  getBlogUrl,
  getRelatedBlogPosts,
  indexableBlogPosts,
} from "@/lib/seo/blog-posts";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import { getWordPressEditorialPost, listWordPressEditorialPosts } from "@/lib/seo/wordpress-editorial";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const wordpressPosts = await listWordPressEditorialPosts();
  return [
    ...indexableBlogPosts.map((post) => ({ slug: post.slug })),
    ...wordpressPosts.map((post) => ({ slug: post.slug })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    const wordpressPost = await getWordPressEditorialPost(slug);
    if (wordpressPost) {
      const url = `/blog/${wordpressPost.slug}`;
      const heroImage = wordpressPost.featuredImageUrl || blogImage;
      return {
        title: { absolute: wordpressPost.seoTitle },
        description: wordpressPost.seoDescription,
        alternates: { canonical: url },
        authors: [{ name: wordpressPost.authorName, url: buildSiteUrl("/blog/editorial-methodology") }],
        category: wordpressPost.contentKind === "growth-guide" ? "Video editing client growth" : "Software comparisons",
        robots: { follow: true, index: true },
        openGraph: {
          title: wordpressPost.seoTitle,
          description: wordpressPost.seoDescription,
          url: buildSiteUrl(url),
          type: "article",
          publishedTime: wordpressPost.publishedAt,
          modifiedTime: wordpressPost.modifiedAt,
          authors: [wordpressPost.authorName],
          images: [{ url: heroImage, alt: wordpressPost.featuredImageAlt }],
        },
        twitter: {
          card: "summary_large_image",
          title: wordpressPost.seoTitle,
          description: wordpressPost.seoDescription,
          images: [heroImage],
        },
      };
    }

    notFound();
  }

  const url = `/blog/${post.slug}`;
  const seoTitle = getBlogSeoTitle(post);

  return {
    title: { absolute: seoTitle },
    description: post.metaDescription,
    alternates: {
      canonical: url,
    },
    authors: [{ name: companyKnowledgeBase.brandName, url: companyKnowledgeBase.siteUrl }],
    category: post.category,
    keywords: getBlogStructuredKeywords(post),
    robots: post.indexable
      ? { follow: true, index: true }
      : { follow: true, index: false },
    openGraph: {
      title: seoTitle,
      description: post.metaDescription,
      url: buildSiteUrl(url),
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [companyKnowledgeBase.brandName],
      images: [{ url: blogImage, alt: post.heroAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: post.metaDescription,
      images: [blogImage],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    const wordpressPosts = await listWordPressEditorialPosts();
    const wordpressPost = wordpressPosts.find((item) => item.slug === slug);
    if (!wordpressPost) notFound();

    return (
      <MarketingSiteShell>
        <main className="gx-blog-page blog-canvas">
          <WordPressEditorialArticle
            post={wordpressPost}
            relatedLocalPosts={indexableBlogPosts.slice(0, 3)}
            relatedWordPressPosts={wordpressPosts.filter((item) => item.slug !== wordpressPost.slug).slice(0, 3)}
          />
        </main>
      </MarketingSiteShell>
    );
  }

  const related = getRelatedBlogPosts(post);
  const articleUrl = getBlogUrl(post);
  const readingMinutes = Math.max(4, Math.ceil(post.wordCount / 200));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
    {
      "@type": "WebPage",
      "@id": `${articleUrl}#webpage`,
      url: articleUrl,
      name: post.title,
      description: post.metaDescription,
      isPartOf: {
        "@id": `${companyKnowledgeBase.siteUrl}#website`,
      },
      about: getBlogStructuredKeywords(post).slice(0, 10).map((keyword) => ({
        "@type": "Thing",
        name: keyword,
      })),
      primaryImageOfPage: {
        "@id": `${articleUrl}#primaryimage`,
      },
      breadcrumb: {
        "@id": `${articleUrl}#breadcrumb`,
      },
      mainEntity: {
        "@id": `${articleUrl}#article`,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${companyKnowledgeBase.siteUrl}#website`,
      name: companyKnowledgeBase.brandName,
      url: companyKnowledgeBase.siteUrl,
      publisher: {
        "@id": `${companyKnowledgeBase.siteUrl}#organization`,
      },
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
      url: buildSiteUrl(blogImage),
      caption: post.heroAlt,
    },
    {
      "@type": "BlogPosting",
      "@id": `${articleUrl}#article`,
      headline: post.title,
      description: post.metaDescription,
      image: [buildSiteUrl(blogImage)],
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: {
        "@type": "Organization",
        name: companyKnowledgeBase.brandName,
        url: companyKnowledgeBase.siteUrl,
      },
      publisher: {
        "@type": "Organization",
        name: companyKnowledgeBase.brandName,
        logo: {
          "@type": "ImageObject",
          url: buildSiteUrl(companyKnowledgeBase.logoPath),
        },
      },
      mainEntityOfPage: {
        "@id": `${articleUrl}#webpage`,
      },
      articleSection: post.category,
      keywords: getBlogStructuredKeywords(post).join(", "),
      wordCount: post.wordCount,
      about: post.relatedKeywords.map((keyword) => ({
        "@type": "Thing",
        name: keyword,
      })),
      mentions: [
        { "@type": "Thing", name: "video editing agency" },
        { "@type": "Thing", name: "video editing services" },
        { "@type": "Thing", name: "post-production workflow" },
        { "@type": "Thing", name: "freelance video editor" },
        { "@type": "Thing", name: "Gigxomi" },
      ],
      isAccessibleForFree: true,
    },
    {
      "@type": "FAQPage",
      "@id": `${articleUrl}#faq`,
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
    {
      "@type": "HowTo",
      "@id": `${articleUrl}#howto`,
      name: `How to act on ${post.focusKeyword}`,
      description: `A practical action plan for ${post.focusKeyword}.`,
      step: post.actionSteps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: `Step ${index + 1}`,
        text: step,
      })),
    },
    {
      "@type": "ItemList",
      "@id": `${articleUrl}#related-guides`,
      name: "Related Gigxomi guides",
      itemListElement: related.map((relatedPost, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: relatedPost.title,
        url: buildSiteUrl(`/blog/${relatedPost.slug}`),
      })),
    },
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
    <MarketingSiteShell>
      <main className="gx-blog-page blog-canvas">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
        <article className="blog-article">
          <header className="blog-article-header">
            <div>
              <Link className="blog-back-link" href="/blog">
                Blog
              </Link>
              <p className="blog-kicker">
                {post.category} / {post.audience}
              </p>
              <h1>{post.title}</h1>
              <p>{post.excerpt}</p>
              <div className="blog-meta-row">
                <span>Updated {new Date(post.updatedAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>{readingMinutes} min read</span>
              </div>
            </div>
            <div className="blog-article-media">
              <Image alt={post.heroAlt} fill priority sizes="(max-width: 920px) 100vw, 38vw" src={blogImage} />
            </div>
          </header>

          <div className="blog-article-layout">
            <aside className="blog-article-sidebar">
              <div className="blog-sidebar-panel">
                <strong>In this guide</strong>
                <p>Practical decisions, checks, and next steps for {post.audience.toLowerCase()}.</p>
              </div>
              <div className="blog-sidebar-panel">
                <strong>Key checkpoints</strong>
                <ul>
                  {post.listItems.slice(0, 5).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="blog-sidebar-panel" style={{ border: "1px solid rgba(215, 255, 47, 0.3)", background: "rgba(215, 255, 47, 0.04)" }}>
                <strong style={{ color: "var(--accent, #D7FF2F)" }}>Master Pillar Guide</strong>
                <p style={{ fontSize: "0.85rem", margin: "4px 0 8px" }}>The complete blueprint for building & managing a video editing agency team:</p>
                <Link href="/blog/video-editing-agency-management-software-system" style={{ fontWeight: 600, color: "var(--accent, #D7FF2F)", textDecoration: "underline" }}>
                  Video Editing Agency Management Software & System &rarr;
                </Link>
              </div>
              <div className="blog-sidebar-panel">
                <strong>Useful Gigxomi links</strong>
                {post.internalLinks.slice(0, 6).map((link) => (
                  <Link href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </aside>

            <div className="blog-article-body">
              <section>
                <h2>Quick Answer</h2>
                <p>{post.excerpt}</p>
                <p>Use the checks and action plan below to turn that answer into a repeatable working process.</p>
              </section>

              <section className="blog-cta-panel blog-signup-panel" style={{ border: "1px solid rgba(215, 255, 47, 0.3)", background: "rgba(215, 255, 47, 0.05)", padding: "28px", borderRadius: "12px", margin: "24px 0" }}>
                <span className="meta-pill" style={{ display: "inline-block", marginBottom: "8px", background: "#D7FF2F", color: "#000", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem" }}>0% Commission · Anti-Poaching Shield</span>
                <h2 style={{ marginTop: "6px" }}>Scale Your Video Editing Agency With Zero Chaos</h2>
                <p>
                  Manage freelance editors, streamline revisions, protect clients with two-lane masked messaging, and retain 100% of your earnings. No hidden fees, no marketplace middleman cuts.
                </p>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "16px" }}>
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
                      padding: "10px 18px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    Start Free with Google
                  </a>
                  <Link href="/pricing" style={{ fontSize: "0.88rem", opacity: 0.85, textDecoration: "underline" }}>
                    View Agency Plans & Pricing
                  </Link>
                </div>
              </section>

              {post.sections.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="blog-check-list">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              <section>
                <h2>What To Check Before You Decide</h2>
                <ul className="blog-check-list">
                  {post.listItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2>Comparison Table</h2>
                <div className="blog-table-wrap">
                  <table className="blog-comparison-table">
                    <thead>
                      <tr>
                        <th>Option</th>
                        <th>Best for</th>
                        <th>Tradeoff</th>
                        <th>Gigxomi angle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {post.comparisonRows.map((row) => (
                        <tr key={row.option}>
                          <td>{row.option}</td>
                          <td>{row.bestFor}</td>
                          <td>{row.tradeoff}</td>
                          <td>{row.gigxomiAngle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2>Action Plan</h2>
                <ol className="blog-check-list">
                  {post.actionSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>

              <section>
                <h2>Put the Process Into Practice</h2>
                <p>
                  Gigxomi helps video-editing agencies and freelancers keep client context, assignments, reviews,
                  delivery, and payout visibility connected. Use the guide first to define the right process; use
                  the workspace when that process needs shared ownership and a reliable operating record.
                </p>
                <p>
                  You can also explore <Link href="/?surface=services">video editing services</Link>, read our in-depth{" "}
                  <Link href="/blog/video-editing-agency-management-software-system">video editing agency management software guide</Link>, or{" "}
                  <Link href="/pricing">review agency workspace pricing</Link>.
                </p>
              </section>

              <section>
                <h2>Continue Your Plan</h2>
                <div className="blog-related-grid">
                  {post.internalLinks.map((link) => (
                    <Link href={link.href} key={link.href}>
                      <span>{link.label}</span>
                      <strong>{link.reason}</strong>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="blog-cta-panel">
                <span className="meta-pill" style={{ display: "inline-block", marginBottom: "8px" }}>0% Commission · Anti-Poaching Shield</span>
                <h2>{post.cta.label}</h2>
                <p>{post.cta.text}</p>
                <div className="blog-hero-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                  <Link href="/pricing">View Agency Plans & Pricing</Link>
                  <a
                    href="https://wa.me/919993328124?text=Hi%20Gigxomi%20Team%2C%20I%20want%20to%20onboard%20my%20video%20editing%20agency%20to%20the%20Agency%20Scale%20Pro%20plan."
                    rel="noreferrer"
                    style={{ background: "#25D366", color: "#051A0B" }}
                    target="_blank"
                  >
                    Chat with Concierge (+91 99933 28124)
                  </a>
                </div>
              </section>

              <section>
                <h2>FAQ</h2>
                <div className="blog-faq-list">
                  {post.faqs.map((faq) => (
                    <details key={faq.question}>
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>

              <section>
                <h2>Related Guides</h2>
                <div className="blog-related-grid">
                  {related.map((relatedPost) => (
                    <Link href={`/blog/${relatedPost.slug}`} key={relatedPost.slug}>
                      <span>{relatedPost.focusKeyword}</span>
                      <strong>{relatedPost.title}</strong>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </article>
      </main>
    </MarketingSiteShell>
  );
}
