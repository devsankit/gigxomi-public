import fs from "node:fs";

import { growthPillarPosts } from "../src/lib/seo/growth-pillar-posts";
import { growthSupportingPosts } from "../src/lib/seo/growth-support-posts";
import { searchLeaderPosts } from "../src/lib/seo/search-leader-posts";
import { getAllNicheSlugs } from "../src/lib/seo/niche-catalog";
import { retiredBlogRedirects } from "../src/lib/seo/retired-blog-redirects";

const expectedKeywords = [
  "how to get video editing clients",
  "how to get your first video editing client",
  "how to get video editing clients as a beginner",
  "how to get video editing clients in India",
  "how to get international video editing clients",
  "how to get video editing clients on Instagram",
  "how to get video editing clients on LinkedIn",
  "how to get video editing clients without Upwork",
  "how to find YouTubers who need video editors",
  "video editor cold DM template",
  "video editing cold email template",
  "how much should I charge for video editing",
  "video editing rates in India",
  "video editing proposal template",
  "how to manage video editing clients",
  "CRM for video editors",
  "how to outsource video editing",
  "how to hire video editors",
  "how to start a video editing agency",
  "how to scale a video editing business",
] as const;

function fail(message: string): never {
  throw new Error(`[seo-content] ${message}`);
}

const expectedSupportingSlugs = [
  "why-not-getting-video-editing-clients",
  "where-to-find-video-editing-clients-online",
  "video-editing-client-acquisition-funnel",
  "video-editor-contract-template-for-agencies",
  "video-editing-client-onboarding-checklist",
  "multi-editor-revision-management-for-agencies",
  "video-editing-retainer-pricing-for-agencies",
  "how-to-create-a-deliverables-schedule",
  "video-editing-agency-starter-kit",
  "mastering-client-reviews-and-approvals",
  "video-editing-pricing-for-recurring-campaigns",
  "5-bottlenecks-in-video-editing-agencies",
  "in-house-vs-outsourced-video-editing",
  "building-video-editing-business-from-home",
  "best-practices-for-consistent-video-quality",
  "top-10-workflows-video-editing-agency",
  "peak-performing-video-editing-agency-website",
] as const;

const pillarSlugs = new Set(growthPillarPosts.map((post) => post.slug));
const allWrittenPosts = [...growthPillarPosts, ...growthSupportingPosts];
const writtenSlugs = new Set(allWrittenPosts.map((post) => post.slug));
const allKnownLocalSlugs = new Set([...allWrittenPosts, ...searchLeaderPosts].map((post) => post.slug));
if (growthPillarPosts.length !== expectedKeywords.length) {
  fail(`Expected ${expectedKeywords.length} pillar posts, found ${growthPillarPosts.length}.`);
}
if (pillarSlugs.size !== growthPillarPosts.length) fail("Pillar slugs must be unique.");
if (growthSupportingPosts.length !== expectedSupportingSlugs.length) {
  fail(`Expected ${expectedSupportingSlugs.length} supporting posts, found ${growthSupportingPosts.length}.`);
}
if (writtenSlugs.size !== allWrittenPosts.length) fail("Written post slugs must be unique.");
for (const slug of expectedSupportingSlugs) {
  if (!writtenSlugs.has(slug)) fail(`Missing supporting post: ${slug}`);
}

for (const keyword of expectedKeywords) {
  if (!growthPillarPosts.some((post) => post.focusKeyword === keyword)) fail(`Missing focus keyword: ${keyword}`);
}

const substantiveBlocks = allWrittenPosts.flatMap((post) => [
  post.excerpt,
  post.metaDescription,
  ...post.sections.flatMap((section) => section.paragraphs),
  ...post.faqs.map((faq) => faq.answer),
]).filter((block) => block.trim().length >= 80);
const blockCounts = new Map<string, number>();
for (const block of substantiveBlocks) {
  const normalized = block.trim().toLowerCase().replace(/\s+/g, " ");
  blockCounts.set(normalized, (blockCounts.get(normalized) ?? 0) + 1);
}
const repeatedBlocks = [...blockCounts].filter(([, count]) => count > 1);
if (repeatedBlocks.length) fail(`Found ${repeatedBlocks.length} repeated substantive content blocks.`);

for (const post of allWrittenPosts) {
  const publishedAt = Date.parse(post.publishedAt);
  const updatedAt = Date.parse(post.updatedAt);
  if (!Number.isFinite(publishedAt) || publishedAt > Date.now()) fail(`${post.slug} has an invalid or future publication date.`);
  if (!Number.isFinite(updatedAt) || updatedAt > Date.now()) fail(`${post.slug} has an invalid or future update date.`);
  if (post.wordCount < 400) fail(`${post.slug} has only ${post.wordCount} words.`);
  if (post.sections.length < 3) fail(`${post.slug} needs at least three substantive sections.`);
  if (post.faqs.length < 3) fail(`${post.slug} needs at least three visible FAQs.`);
  for (const link of post.internalLinks) {
    const blogSlug = link.href.match(/^\/blog\/([^/?#]+)/)?.[1];
    if (blogSlug && !allKnownLocalSlugs.has(blogSlug)) fail(`${post.slug} links to missing local article ${blogSlug}.`);
  }

  const validNicheSlugs = new Set(getAllNicheSlugs());
  const nicheLinks = post.internalLinks.filter((link) => link.href.startsWith("/services/category/"));
  if (nicheLinks.length === 0) {
    fail(`${post.slug} must include at least one internal link to a programmatic niche hub (/services/category/*).`);
  }
  for (const link of nicheLinks) {
    const categorySlug = link.href.replace("/services/category/", "").split(/[?#]/)[0];
    if (!validNicheSlugs.has(categorySlug)) {
      fail(`${post.slug} links to invalid niche category: ${categorySlug}.`);
    }
  }

  const pricingLinks = post.internalLinks.filter((link) => link.href === "/pricing" || link.href.startsWith("/pricing?"));
  if (pricingLinks.length === 0) {
    fail(`${post.slug} must include at least one internal link to /pricing.`);
  }
}

for (const post of growthSupportingPosts) {
  if (post.wordCount < 500) fail(`${post.slug} needs at least 500 words as a supporting article.`);
  if (!post.internalLinks.some((link) => link.href.startsWith("/blog/") && (link.href === "/blog/how-to-get-video-editing-clients" || pillarSlugs.has(link.href.replace(/^\/blog\//, ""))))) {
    fail(`${post.slug} must link to a primary growth pillar.`);
  }
}

const redirectSources = new Set<string>(retiredBlogRedirects.map((redirect) => redirect.source));
if (retiredBlogRedirects.length !== 56 || redirectSources.size !== retiredBlogRedirects.length) {
  fail(`Expected 56 unique retired blog redirects after preserving four search leaders, found ${retiredBlogRedirects.length}.`);
}
for (const protectedSlug of [
  "best-video-editing-niche-for-freelancers-who-want-agency-work",
  "video-editing-turnaround-time-what-is-realistic-for-different-projects",
  "short-form-video-editing-agency-reels-shorts-and-tiktok-at-scale",
  "white-label-video-editing-for-agencies-how-to-sell-more-without-hiring",
]) {
  if (redirectSources.has(`/blog/${protectedSlug}`)) fail(`Search leader must not redirect: ${protectedSlug}`);
}
for (const redirect of retiredBlogRedirects) {
  const destinationSlug = redirect.destination.match(/^\/blog\/([^/?#]+)/)?.[1];
  if (!destinationSlug || !pillarSlugs.has(destinationSlug)) fail(`Invalid redirect destination: ${redirect.destination}`);
}

type BacklogTopic = {
  id: number;
  parentPillar?: string;
  slug: string;
  status: string;
};

const backlog = JSON.parse(fs.readFileSync("content/editorial-backlog.json", "utf8")) as {
  campaign?: { primaryCta?: string; primaryKpi?: string; publicationGate?: string };
  topics: BacklogTopic[];
};
if (backlog.topics.length !== 200) fail(`Expected a 200-topic editorial map, found ${backlog.topics.length}.`);
if (new Set(backlog.topics.map((topic) => topic.id)).size !== 200) fail("Editorial backlog IDs must be unique.");
if (new Set(backlog.topics.map((topic) => topic.slug)).size !== 200) fail("Editorial backlog slugs must be unique.");
if (backlog.campaign?.primaryKpi !== "qualified webinar registrations") fail("Editorial KPI must be qualified webinar registrations.");
if (backlog.campaign?.primaryCta !== "https://ankit.gigxomi.com/#gapp-registration") fail("Editorial campaign must use the live webinar CTA.");
if (!backlog.campaign.publicationGate?.includes("do not bulk-publish")) fail("Editorial backlog must retain the bulk-publication safety gate.");

const supportingTopics = backlog.topics.filter((topic) => topic.status === "supporting-brief");
if (supportingTopics.length !== 100) fail(`Expected 100 mapped supporting briefs, found ${supportingTopics.length}.`);
const supportsByPillar = new Map<string, number>();
for (const topic of supportingTopics) {
  const pillarSlug = topic.parentPillar?.match(/^\/blog\/([^/?#]+)/)?.[1];
  if (!pillarSlug || !pillarSlugs.has(pillarSlug)) fail(`${topic.slug} has an invalid parent pillar.`);
  supportsByPillar.set(pillarSlug, (supportsByPillar.get(pillarSlug) ?? 0) + 1);
}
for (const slug of pillarSlugs) {
  if (supportsByPillar.get(slug) !== 5) fail(`${slug} must have exactly five mapped supporting briefs.`);
}

console.log(
  `[seo-content] verified ${growthPillarPosts.length} pillars, ${growthSupportingPosts.length} written supporting articles, ${supportingTopics.length} mapped supporting briefs, ${backlog.topics.length} backlog topics, ${substantiveBlocks.length} substantive blocks, and ${retiredBlogRedirects.length} redirects`,
);
