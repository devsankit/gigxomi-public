import { growthPillarPosts } from "@/lib/seo/growth-pillar-posts";
import { growthSupportingPosts } from "@/lib/seo/growth-support-posts";
import { searchLeaderPosts } from "@/lib/seo/search-leader-posts";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

export type BlogAudience = "Agencies" | "Creators" | "Freelancers" | "Post-production Teams";

export type BlogPost = {
  actionSteps: string[];
  audience: BlogAudience;
  category: string;
  comparisonRows: { option: string; bestFor: string; tradeoff: string; gigxomiAngle: string }[];
  cta: { href: string; label: string; text: string };
  excerpt: string;
  faqs: { answer: string; question: string }[];
  focusKeyword: string;
  heroAlt: string;
  id: number;
  internalLinks: { href: string; label: string; reason: string }[];
  indexable: boolean;
  intent: "Commercial" | "Transactional" | "Informational" | "Career";
  listItems: string[];
  metaDescription: string;
  publishedAt: string;
  relatedKeywords: string[];
  sections: { bullets?: string[]; heading: string; paragraphs: string[] }[];
  slug: string;
  title: string;
  updatedAt: string;
  wordCount: number;
};

const BLOG_IMAGE = "/images/blog/video-editing-agency-seo-hero.png";

export const blogPosts: BlogPost[] = [...growthPillarPosts, ...growthSupportingPosts, ...searchLeaderPosts];
export const blogImage = BLOG_IMAGE;
export const indexableBlogPosts = blogPosts.filter((post) => post.indexable);

export function getBlogSeoTitle(post: BlogPost) {
  if (post.title.length <= 60) return post.title;

  const shortened = post.title.slice(0, 59);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${(lastSpace >= 36 ? shortened.slice(0, lastSpace) : shortened).replace(/[\s:;,.-]+$/u, "")}…`;
}

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(post: BlogPost, limit = 8) {
  const linkedSlugs = post.internalLinks
    .map((link) => link.href.match(/^\/blog\/([^/?#]+)/)?.[1])
    .filter((slug): slug is string => Boolean(slug));
  const explicitlyLinked = linkedSlugs
    .map((slug) => indexableBlogPosts.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is BlogPost => candidate !== undefined && candidate.slug !== post.slug);
  const sameCategory = indexableBlogPosts.filter(
    (candidate) => candidate.slug !== post.slug && candidate.category === post.category,
  );
  const fallback = indexableBlogPosts.filter((candidate) => candidate.slug !== post.slug);

  return [...explicitlyLinked, ...sameCategory, ...fallback]
    .filter((candidate, index, all) => all.findIndex((item) => item.slug === candidate.slug) === index)
    .slice(0, limit);
}

export function getBlogUrl(post: BlogPost) {
  return buildSiteUrl(`/blog/${post.slug}`);
}

export function getBlogStructuredKeywords(post: BlogPost) {
  return [...new Set([post.focusKeyword, ...post.relatedKeywords, ...companyKnowledgeBase.keywords])];
}
