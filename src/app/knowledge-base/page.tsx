import type { Metadata } from "next";

import { KnowledgeBaseHome } from "@/components/knowledge-base/knowledge-base-home";
import { PublicShell } from "@/components/public/public-shell";
import { getKnowledgeBaseHomeData } from "@/lib/gigxomi/knowledge-base-store";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const knowledgeBaseTitle = "Gigxomi Knowledge Base | Guides for Video Editing Teams";
const knowledgeBaseDescription =
  "Practical Gigxomi guides for video editing agencies and editors: workspace setup, client channels, editor coordination, project tracking, and account help.";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: knowledgeBaseTitle,
  description: knowledgeBaseDescription,
  alternates: {
    canonical: "/knowledge-base",
  },
  openGraph: {
    title: knowledgeBaseTitle,
    description: knowledgeBaseDescription,
    url: "/knowledge-base",
    type: "website",
    images: [
      {
        url: companyKnowledgeBase.logoPath,
        alt: `${companyKnowledgeBase.brandName} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: knowledgeBaseTitle,
    description: knowledgeBaseDescription,
    images: [companyKnowledgeBase.logoPath],
  },
};

export default async function KnowledgeBasePage() {
  const data = await getKnowledgeBaseHomeData();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: knowledgeBaseTitle,
      description: knowledgeBaseDescription,
      url: buildSiteUrl("/knowledge-base"),
      isPartOf: {
        "@type": "WebSite",
        name: companyKnowledgeBase.brandName,
        url: companyKnowledgeBase.siteUrl,
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: data.articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.title,
          url: buildSiteUrl(article.href),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: buildSiteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Knowledge Base", item: buildSiteUrl("/knowledge-base") },
      ],
    },
  ];

  return (
    <main className="app-shell public-theme-root">
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <PublicShell
        activeSurface="services"
        fullScreen
        showCategoryNav={false}
        title="Knowledge Base"
        canvasClassName="knowledge-base-full-canvas"
        topbarActions={[
          { href: "/", label: "Home" },
          { href: "/contact", label: "Contact Support", variant: "pill" },
        ]}
      >
        <KnowledgeBaseHome data={data} />
      </PublicShell>
    </main>
  );
}
