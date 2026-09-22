import type { MetadataRoute } from "next";

import { companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const disallowedCrawlerPaths = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowedCrawlerPaths,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: disallowedCrawlerPaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: disallowedCrawlerPaths,
      },
      {
        userAgent: "Perplexity-User",
        allow: "/",
        disallow: disallowedCrawlerPaths,
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: disallowedCrawlerPaths,
      },
      {
        userAgent: "Claude-User",
        allow: "/",
        disallow: disallowedCrawlerPaths,
      },
    ],
    sitemap: `${companyKnowledgeBase.siteUrl}/sitemap.xml`,
    host: companyKnowledgeBase.siteUrl,
  };
}
