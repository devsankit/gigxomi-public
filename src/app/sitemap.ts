import type { MetadataRoute } from "next";

import { listPublicAgencyListingsFromFile } from "@/lib/gigxomi/agency-listing-store";
import { listFallbackPublishedKnowledgeBaseArticles, listPublishedKnowledgeBaseArticles } from "@/lib/gigxomi/knowledge-base-store";
import { indexableBlogPosts } from "@/lib/seo/blog-posts";
import { buildSiteUrl } from "@/lib/seo/company-knowledge-base";
import { retiredBlogRedirects } from "@/lib/seo/retired-blog-redirects";
import { listWordPressEditorialPosts } from "@/lib/seo/wordpress-editorial";

export const revalidate = 300;

async function listSitemapKnowledgeBaseArticles() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return listFallbackPublishedKnowledgeBaseArticles();
  }

  return listPublishedKnowledgeBaseArticles().catch(() => listFallbackPublishedKnowledgeBaseArticles());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [agencies, knowledgeBaseArticles, wordpressEditorialPosts] = await Promise.all([
    listPublicAgencyListingsFromFile(),
    listSitemapKnowledgeBaseArticles(),
    listWordPressEditorialPosts(),
  ]);

  const blogLastModified = new Date(
    Math.max(
      ...indexableBlogPosts.map((post) => new Date(post.updatedAt).getTime()),
      ...wordpressEditorialPosts.map((post) => new Date(post.modifiedAt).getTime()),
    ),
  );
  const localBlogSlugs = new Set(indexableBlogPosts.map((post) => post.slug));
  const retiredSlugs = new Set(
    retiredBlogRedirects.map((redirect) => redirect.source.replace(/^\/blog\//, ""))
  );

  return [
    {
      url: buildSiteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: buildSiteUrl("/product"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: buildSiteUrl("/for-video-editing-agencies"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: buildSiteUrl("/for-freelance-editors-building-teams"),
      changeFrequency: "weekly",
      priority: 0.86,
    },
    ...["unified-inbox", "editor-management", "client-collaboration", "project-tracking", "work-hub"].map((slug) => ({
      url: buildSiteUrl(`/features/${slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.82,
    })),
    {
      url: buildSiteUrl("/agencies"),
      changeFrequency: "daily",
      priority: 0.92,
    },
    {
      url: buildSiteUrl("/pricing"),
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: buildSiteUrl("/freelancers"),
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: buildSiteUrl("/knowledge-base"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: buildSiteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.72,
    },
    {
      url: buildSiteUrl("/blog"),
      lastModified: blogLastModified,
      changeFrequency: "daily",
      priority: 0.86,
    },
    {
      url: buildSiteUrl("/blog/video-editing-project-management-tools"),
      lastModified: blogLastModified,
      changeFrequency: "weekly",
      priority: 0.84,
    },
    {
      url: buildSiteUrl("/blog/editorial-methodology"),
      changeFrequency: "monthly",
      priority: 0.58,
    },
    {
      url: buildSiteUrl("/contact"),
      changeFrequency: "monthly",
      priority: 0.62,
    },
    {
      url: buildSiteUrl("/privacy-policy"),
      changeFrequency: "yearly",
      priority: 0.36,
    },
    {
      url: buildSiteUrl("/refund-and-cancellation-policy"),
      changeFrequency: "yearly",
      priority: 0.38,
    },
    {
      url: buildSiteUrl("/service-delivery-policy"),
      changeFrequency: "yearly",
      priority: 0.36,
    },
    {
      url: buildSiteUrl("/terms-and-conditions"),
      changeFrequency: "yearly",
      priority: 0.36,
    },
    {
      url: buildSiteUrl("/disclaimer"),
      changeFrequency: "yearly",
      priority: 0.34,
    },
    ...knowledgeBaseArticles.map((article) => ({
      url: buildSiteUrl(article.href),
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.74,
    })),
    ...indexableBlogPosts.map((post) => ({
      url: buildSiteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: post.intent === "Transactional" || post.intent === "Commercial" ? 0.78 : 0.7,
    })),
    ...wordpressEditorialPosts
      .filter((post) => !localBlogSlugs.has(post.slug) && !retiredSlugs.has(post.slug))
      .map((post) => ({
        url: buildSiteUrl(`/blog/${post.slug}`),
        lastModified: new Date(post.modifiedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ...agencies.map((agency) => ({
      url: buildSiteUrl(`/agency/${agency.slug}`),
      ...(agency.updatedAt ? { lastModified: new Date(agency.updatedAt) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.64,
    })),
  ];
}
