import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { blogImage, indexableBlogPosts } from "@/lib/seo/blog-posts";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import { listWordPressEditorialPosts } from "@/lib/seo/wordpress-editorial";

const title = "Video Editing Agency Blog: Clients, Pricing & Growth Guides for 2026";
const seoTitle = "Video Editing Agency Blog | Clients, Pricing & Growth — 2026";
const description =
  "Practical guides for video editing freelancers and agency owners: get clients, set pricing, write proposals, run outreach, manage clients, hire editors, and grow to agency in 2026.";

export const metadata: Metadata = {
  title: { absolute: seoTitle },
  description,
  alternates: {
    canonical: "/blog",
  },
  keywords: [
    "get video editing clients",
    "best niche for video editing",
    "video editing pricing",
    "video editor outreach",
    "video editing proposal template",
    "video editing client management",
    "start video editing agency",
    "video editing business growth 2026",
  ],
  openGraph: {
    title: seoTitle,
    description,
    url: buildSiteUrl("/blog"),
    type: "website",
    images: [{ url: blogImage, alt: "Gigxomi video editing agency blog — guides for client growth and agency operations" }],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description,
    images: [blogImage],
  },
};

const categories = [...new Set(indexableBlogPosts.map((post) => post.category))];
const featuredPosts = indexableBlogPosts.slice(0, 6);

export default async function BlogPage() {
  const wordpressPosts = await listWordPressEditorialPosts();
  const wordpressGrowthGuides = wordpressPosts.filter((post) => post.contentKind === "growth-guide");
  const wordpressComparisons = wordpressPosts.filter((post) => post.contentKind === "comparison");
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: buildSiteUrl("/blog"),
      isPartOf: {
        "@type": "WebSite",
        name: companyKnowledgeBase.brandName,
        url: companyKnowledgeBase.siteUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          ...wordpressPosts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: post.title,
            url: buildSiteUrl(`/blog/${post.slug}`),
          })),
          ...indexableBlogPosts.map((post, index) => ({
            "@type": "ListItem",
            position: wordpressPosts.length + index + 1,
            name: post.title,
            url: buildSiteUrl(`/blog/${post.slug}`),
          })),
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: buildSiteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: buildSiteUrl("/blog") },
      ],
    },
  ];

  return (
    <MarketingSiteShell>
      <main className="gx-blog-page blog-canvas">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
        <section className="blog-hero">
          <div className="blog-hero-copy">
            <p className="blog-kicker">Practical guides for video editing growth</p>
            <h1>{title}</h1>
            <p>
              Learn how to find and win clients, price and propose work, manage delivery, hire editors, and build a
              durable video editing business.
            </p>
            <div className="blog-hero-actions">
              <a className="blog-primary-link" href="https://app.gigxomi.com/signup" rel="nofollow" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Start Free with Google
              </a>
              <Link className="blog-secondary-link" href="/blog/video-editing-agency-management-software-system" style={{ borderColor: "var(--accent, #D7FF2F)", color: "var(--accent, #D7FF2F)" }}>
                Agency Management Software Guide
              </Link>
              <Link className="blog-secondary-link" href="/pricing">
                View pricing plans
              </Link>
              <Link className="blog-secondary-link" href="/blog/video-editing-project-management-tools">
                Compare agency tools
              </Link>
            </div>
          </div>
          <div className="blog-hero-media">
            <Image alt="Video editing agency blog editorial visual" fill priority sizes="(max-width: 920px) 100vw, 44vw" src={blogImage} />
          </div>
        </section>

        <section className="blog-section">
          <div className="blog-section-heading">
            <p className="blog-kicker">Topic clusters</p>
            <h2>Built around real production decisions</h2>
          </div>
          <div className="blog-cluster-grid">
            {categories.map((category) => {
              const count = indexableBlogPosts.filter((post) => post.category === category).length;
              return (
                <a className="blog-cluster-card" href={`#${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={category}>
                  <span>{count} guides</span>
                  <strong>{category}</strong>
                  <p>
                    {category === "Get Clients"
                      ? "Research, positioning, proof, and channel strategies for building qualified demand."
                      : category === "Outreach Templates"
                        ? "Practical messages that start relevant conversations without spam or false urgency."
                        : category === "Pricing & Sales"
                          ? "Cost floors, rates, proposals, scope, and payment decisions for profitable work."
                          : category === "Client Operations"
                            ? "Systems for relationships, briefs, feedback, delivery, follow-up, and retention."
                            : "Hiring, outsourcing, capacity, quality, cash flow, and agency-scale operations."}
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        {wordpressGrowthGuides.length ? (
          <section className="blog-section" id="client-growth-guides">
            <div className="blog-section-heading">
              <p className="blog-kicker">Gigxomi Editorial</p>
              <h2>Latest video editing client-growth guides</h2>
              <p>Practical, reader-first playbooks for outreach, pricing, delivery, and building a durable editing business.</p>
            </div>
            <div className="blog-feature-grid">
              {wordpressGrowthGuides.map((post) => (
                <Link className="blog-feature-card" href={`/blog/${post.slug}`} key={post.id}>
                  <span>Updated {new Date(post.modifiedAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <strong>{post.title}</strong>
                  <p>{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {wordpressComparisons.length ? (
          <section className="blog-section" id="software-comparisons">
            <div className="blog-section-heading">
              <p className="blog-kicker">Gigxomi Editorial</p>
              <h2>Current software comparisons for video editing agencies</h2>
              <p>Balanced buyer guides verified against official product sources and Gigxomi&apos;s documented capabilities.</p>
            </div>
            <div className="blog-feature-grid">
              {wordpressComparisons.map((post) => (
                <Link className="blog-feature-card" href={`/blog/${post.slug}`} key={post.id}>
                  <span>Verified {new Date(post.modifiedAt).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <strong>{post.title}</strong>
                  <p>{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="blog-section">
          <div className="blog-section-heading">
            <p className="blog-kicker">Featured</p>
            <h2>Start with the highest-intent guides</h2>
          </div>
          <div className="blog-feature-grid">
            {featuredPosts.map((post) => (
              <Link className="blog-feature-card" href={`/blog/${post.slug}`} key={post.slug}>
                <span>{post.intent}</span>
                <strong>{post.title}</strong>
                <p>{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        {categories.map((category) => (
          <section className="blog-section" id={category.toLowerCase().replace(/[^a-z0-9]+/g, "-")} key={category}>
            <div
              className="blog-section-heading"
              id={
                category === "Get Clients"
                  ? "freelancer-growth"
                  : category === "Client Operations"
                    ? "post-production"
                    : category === "Agency Growth"
                      ? "hiring-guides"
                      : undefined
              }
            >
              <p className="blog-kicker">{category}</p>
              <h2>{category} articles</h2>
            </div>
            <div className="blog-list-grid">
              {indexableBlogPosts
                .filter((post) => post.category === category)
                .map((post) => (
                  <Link className="blog-list-card" href={`/blog/${post.slug}`} key={post.slug}>
                    <span>{post.focusKeyword}</span>
                    <strong>{post.title}</strong>
                    <p>{post.metaDescription}</p>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </main>
    </MarketingSiteShell>
  );
}
