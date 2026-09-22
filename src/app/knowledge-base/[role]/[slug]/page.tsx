import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { KnowledgeBaseArticleView } from "@/components/knowledge-base/knowledge-base-article-view";
import { PublicShell } from "@/components/public/public-shell";
import { SupportBotWidget } from "@/components/support/support-bot-widget";
import {
  buildKnowledgeBaseArticleUrl,
  getKnowledgeBaseArticle,
  getRelatedKnowledgeBaseArticles,
  type KnowledgeBaseRole,
} from "@/lib/gigxomi/knowledge-base-store";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

type ArticleRouteProps = {
  params: Promise<{
    role: string;
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function normalizeRole(value: string): KnowledgeBaseRole | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "freelancer") return "FREELANCER";
  if (normalized === "agency") return "AGENCY";
  if (normalized === "platform") return "PLATFORM";
  return null;
}

export async function generateMetadata({ params }: ArticleRouteProps): Promise<Metadata> {
  const { role: roleParam, slug } = await params;
  const role = normalizeRole(roleParam);
  if (!role) {
    return { title: "Knowledge base article not found", robots: { index: false, follow: false } };
  }
  const article = await getKnowledgeBaseArticle(role, slug);
  if (!article) {
    return { title: "Knowledge base article not found", robots: { index: false, follow: false } };
  }

  return {
    title: article.seoTitle || `${article.title} | ${companyKnowledgeBase.brandName}`,
    description: article.seoDescription || article.summary,
    alternates: {
      canonical: article.href,
    },
    openGraph: {
      title: article.seoTitle || `${article.title} | ${companyKnowledgeBase.brandName}`,
      description: article.seoDescription || article.summary,
      url: article.href,
      type: "article",
      images: [
        {
          url: article.media[0]?.url ?? companyKnowledgeBase.logoPath,
          alt: article.media[0]?.alt ?? `${companyKnowledgeBase.brandName} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || `${article.title} | ${companyKnowledgeBase.brandName}`,
      description: article.seoDescription || article.summary,
      images: [article.media[0]?.url ?? companyKnowledgeBase.logoPath],
    },
  };
}

export default async function KnowledgeBaseArticlePage({ params }: ArticleRouteProps) {
  const { role: roleParam, slug } = await params;
  const role = normalizeRole(roleParam);
  if (!role) {
    notFound();
  }

  const article = await getKnowledgeBaseArticle(role, slug);
  if (!article) {
    notFound();
  }

  const related = await getRelatedKnowledgeBaseArticles(article);
  const articleUrl = buildKnowledgeBaseArticleUrl(article.role, article.slug);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.summary,
      url: articleUrl,
      author: { "@type": "Organization", name: companyKnowledgeBase.brandName },
      publisher: {
        "@type": "Organization",
        name: companyKnowledgeBase.brandName,
        logo: { "@type": "ImageObject", url: buildSiteUrl(companyKnowledgeBase.iconPath) },
      },
      image: article.media.map((media) => buildSiteUrl(media.url)),
      about: article.tags,
    },
    article.steps.length
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: article.title,
          description: article.summary,
          step: article.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.body,
          })),
        }
      : null,
    article.faqs.length
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: buildSiteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Knowledge Base", item: buildSiteUrl("/knowledge-base") },
        { "@type": "ListItem", position: 3, name: article.title, item: articleUrl },
      ],
    },
  ].filter(Boolean);

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
          { href: "#open-support", icon: "sparkles", label: "Support", variant: "pill" },
          { href: "/knowledge-base", label: "All guides" },
          { href: "/contact", label: "Contact Support", variant: "pill" },
        ]}
      >
        <KnowledgeBaseArticleView article={article} related={related} />
      </PublicShell>
      <SupportBotWidget defaultRole={article.role} lockRole />
    </main>
  );
}
