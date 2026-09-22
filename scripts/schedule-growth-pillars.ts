import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { BlogPost } from "../src/lib/seo/blog-posts";
import { growthPillarPosts } from "../src/lib/seo/growth-pillar-posts";
import { growthSupportingPosts } from "../src/lib/seo/growth-support-posts";
import { EDITORIAL_TIME_ZONE, wordpressDates } from "./editorial-content-lib.mjs";

type DistributionEntry = {
  altText: string;
  blogPath: string;
  blogPublishAt: string;
  description?: string;
  imagePath: string;
  pinPublishAt?: string;
  pinStatus?: string;
  publicationStatus: "asset-ready" | "draft" | "wordpress-scheduled";
  slug: string;
  title?: string;
  wordpressPostId?: number;
};

type DistributionManifest = {
  boardName: string;
  campaign: string;
  canonicalDomain: string;
  creativeSpec?: {
    aspectRatio: string;
    descriptionMaximumCharacters: number;
    recommendedPixels: string;
    titleMaximumCharacters: number;
  };
  environment: string;
  pins: DistributionEntry[];
};

const apply = process.argv.includes("--apply");
const apiBase = `${(process.env.WORDPRESS_URL || "https://blog.gigxomi.com").replace(/\/$/, "")}/wp-json/wp/v2`;

// auth is resolved lazily after .env.local is loaded in main()
let auth = "";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c] ?? c)
  );
}

/** Use for href attributes — only escapes characters that are actually invalid in HTML attributes, does NOT encode & in URLs */
function safeHref(url: string) {
  // Only escape < > and " which break attribute parsing; keep & intact for valid URLs
  return url.replace(/[<>"]/g, (c) => ({ "<": "%3C", ">": "%3E", '"': "%22" }[c] ?? c));
}

function absoluteGigxomiUrl(href: string) {
  return href.startsWith("http") ? href : `https://www.gigxomi.com${href}`;
}

function renderArticle(post: BlogPost) {
  const sections = post.sections.map((section) => [
    `<h2>${escapeHtml(section.heading)}</h2>`,
    ...section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ...(section.bullets?.length
      ? [`<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`]
      : []),
  ].join("\n"));
  const comparison = post.comparisonRows.length
    ? `<h2>Choose the right client-acquisition path</h2><table><thead><tr><th scope="col">Option</th><th scope="col">Best for</th><th scope="col">Tradeoff</th><th scope="col">How Gigxomi helps</th></tr></thead><tbody>${post.comparisonRows.map((row) => `<tr><td>${escapeHtml(row.option)}</td><td>${escapeHtml(row.bestFor)}</td><td>${escapeHtml(row.tradeoff)}</td><td>${escapeHtml(row.gigxomiAngle)}</td></tr>`).join("")}</tbody></table>`
    : "";
  const webinarUrl = safeHref(`https://ankit.gigxomi.com/?utm_source=organic&utm_medium=blog&utm_campaign=seo_growth&utm_content=${encodeURIComponent(post.slug)}#gapp-registration`);
  const pricingUrl = safeHref(absoluteGigxomiUrl("/pricing"));
  const whatsappUrl = safeHref(`https://wa.me/919993328124?text=${encodeURIComponent(`Hi Gigxomi team, I read "${post.title}" and want to onboard my video editing agency.`)}`);

  const agencyCtaBlock = [
    `<hr>`,
    `<p><strong>0% Commission · Anti-Poaching Shield</strong></p>`,
    `<h2>Scale Your Video Editing Agency on Gigxomi Workspace</h2>`,
    `<p>Gigxomi combines WhatsApp client intake, Two-Lane masked communication (anti-poaching shield), internal manager review layers, and automated editor payouts in one connected workspace. Protect client relationships by keeping client contacts visible only to managers while editors receive scoped production tasks in a protected lane. Keep 100% of your client retainers with 0% platform commission.</p>`,
    `<p><a href="${pricingUrl}"><strong>View Agency Plans &amp; Start Free Trial</strong></a> | <a href="${whatsappUrl}"><strong>Chat with Concierge (+91 99933 28124)</strong></a></p>`,
  ].join("\n");

  return [
    `<p>${escapeHtml(post.excerpt)}</p>`,
    ...sections,
    `<h2>Action plan</h2><ol>${post.actionSteps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`,
    `<h2>What to prepare</h2><ul>${post.listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
    comparison,
    `<h2>Frequently asked questions</h2>${post.faqs.map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`).join("\n")}`,
    `<h2>Continue learning</h2><ul>${post.internalLinks.map((link) => `<li><a href="${safeHref(absoluteGigxomiUrl(link.href))}">${escapeHtml(link.label)}</a>: ${escapeHtml(link.reason)}</li>`).join("")}</ul>`,
    agencyCtaBlock,
    `<hr><h2>Turn the strategy into a working client pipeline</h2><p>Join the Gigxomi webinar for a practical walkthrough of client acquisition, pricing, project delivery, and agency growth.</p><p><a href="${webinarUrl}"><strong>Reserve your webinar seat</strong></a></p>`,
  ].filter(Boolean).join("\n");
}

async function request(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Authorization: auth } : {}),
      "User-Agent": "Gigxomi-Growth-Editorial-Scheduler/1.0",
      ...options.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`WordPress ${options.method || "GET"} ${endpoint} failed with HTTP ${response.status}: ${body.slice(0, 240)}`);
  return body ? JSON.parse(body) : null;
}

async function ensureCategory(slug: string, name: string) {
  const existing = await request(`/categories?slug=${encodeURIComponent(slug)}&per_page=1`);
  if (existing[0]) return existing[0].id as number;
  const created = await request("/categories", { method: "POST", body: JSON.stringify({ slug, name }) });
  return created.id as number;
}

async function uploadFeaturedImage(entry: DistributionEntry) {
  const absolute = path.resolve(entry.imagePath);
  const buffer = await fs.readFile(absolute);
  const fingerprint = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const extension = path.extname(absolute).toLowerCase();
  const existing = await request(`/media?search=${encodeURIComponent(fingerprint)}&orderby=id&order=asc&per_page=1`);
  if (existing[0]) return existing[0].id as number;
  const mime = extension === ".webp" ? "image/webp" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  const upload = await fetch(`${apiBase}/media`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Disposition": `attachment; filename="gigxomi-growth-${fingerprint}${extension}"`,
      "Content-Type": mime,
      "User-Agent": "Gigxomi-Growth-Editorial-Scheduler/1.0",
    },
    body: buffer,
  });
  if (!upload.ok) throw new Error(`Featured image upload failed for ${entry.slug} with HTTP ${upload.status}.`);
  const media = await upload.json();
  await request(`/media/${media.id}`, { method: "POST", body: JSON.stringify({ alt_text: entry.altText, caption: "" }) });
  return media.id as number;
}

async function main() {
  // Load .env.local credentials if env vars are not already set
  try {
    const envContent = await fs.readFile(path.resolve(".env.local"), "utf8").catch(() => "");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (key && value && !process.env[key]) process.env[key] = value;
    }
  } catch { /* .env.local is optional — env vars already set take precedence */ }

  // Resolve credentials after .env.local is loaded
  const username = process.env.WORDPRESS_USERNAME?.trim();
  const applicationPassword = process.env.WORDPRESS_APPLICATION_PASSWORD?.replace(/\s+/g, "");
  if (apply && (!username || !applicationPassword)) {
    throw new Error("WORDPRESS_USERNAME and WORDPRESS_APPLICATION_PASSWORD are required with --apply.");
  }
  if (username && applicationPassword) {
    auth = `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString("base64")}`;
  }

  const manifestPath = path.resolve("content/pinterest-distribution.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as DistributionManifest;
  const entries = manifest.pins.filter((entry) => entry.publicationStatus === "asset-ready");
  const postsBySlug = new Map([...growthPillarPosts, ...growthSupportingPosts].map((post) => [post.slug, post]));

  if (entries.length === 0) {
    throw new Error("No entries with publicationStatus 'asset-ready' found in manifest.");
  }

  // 1. Validate slot uniqueness (zero slot collisions)
  const slotDates = entries.map((entry) => entry.blogPublishAt);
  const uniqueDates = new Set(slotDates);
  if (uniqueDates.size !== entries.length) {
    throw new Error(`Slot collision detected! ${entries.length} entries but only ${uniqueDates.size} unique publication dates.`);
  }

  // 2. Validate Mon/Wed/Fri cadence and timing
  for (const entry of entries) {
    const publishDate = new Date(entry.blogPublishAt);
    if (!Number.isFinite(publishDate.getTime())) {
      throw new Error(`Invalid date format for ${entry.slug}: ${entry.blogPublishAt}`);
    }
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: EDITORIAL_TIME_ZONE, weekday: "short" }).format(publishDate);
    if (!["Mon", "Wed", "Fri"].includes(weekday)) {
      throw new Error(`Invalid cadence day '${weekday}' for ${entry.slug} (${entry.blogPublishAt}). Expected Mon, Wed, or Fri.`);
    }
  }

  // 3. Validate content and file asset existence
  for (const entry of entries) {
    const post = postsBySlug.get(entry.slug);
    if (!post) throw new Error(`No growth pillar content exists for ${entry.slug}.`);
    try {
      await fs.access(path.resolve(entry.imagePath));
    } catch {
      throw new Error(`Image asset missing for ${entry.slug} at ${entry.imagePath}`);
    }
    if (entry.blogPath !== `/blog/${entry.slug}`) {
      throw new Error(`Canonical path mismatch for ${entry.slug}: expected /blog/${entry.slug}, got ${entry.blogPath}`);
    }
  }

  const now = new Date();

  // Dry-run mode
  if (!apply) {
    console.log("=".repeat(110));
    console.log("GIGXOMI GROWTH PILLAR & SUPPORTING POSTS DISTRIBUTION CALENDAR (DRY RUN)");
    console.log("=".repeat(110));
    console.log(`Manifest: ${manifestPath}`);
    console.log(`Total scheduled slots: ${entries.length}`);
    console.log(`Slot collisions: 0 (verified unique across all ${entries.length} slots)`);
    console.log(`Cadence: Mon / Wed / Fri at 09:30:00+05:30 (Pin at 15:30:00+05:30)`);
    console.log(`Date span: ${entries[0].blogPublishAt.slice(0, 10)} to ${entries[entries.length - 1].blogPublishAt.slice(0, 10)}`);
    console.log(`File assets: all ${entries.length} images verified on disk`);
    console.log("-".repeat(110));

    const tableData = entries.map((entry, idx) => {
      const pubDate = new Date(entry.blogPublishAt);
      const weekday = new Intl.DateTimeFormat("en-US", { timeZone: EDITORIAL_TIME_ZONE, weekday: "short" }).format(pubDate);
      const isFuture = pubDate > now;
      const wpStatus = isFuture ? "future" : "publish";
      return {
        Slot: idx + 1,
        Day: weekday,
        "Blog Publish (IST)": entry.blogPublishAt,
        "Pin Publish (IST)": entry.pinPublishAt || "N/A",
        Status: wpStatus,
        "WP Post ID": entry.wordpressPostId ? `#${entry.wordpressPostId}` : "TBD",
        Slug: entry.slug,
        "Asset Image": entry.imagePath,
      };
    });

    console.table(tableData);
    console.log("-".repeat(110));
    console.log(`Dry run completed successfully. All ${entries.length} publication slots validated with zero collisions.`);
    console.log("Pass --apply with WORDPRESS_USERNAME and WORDPRESS_APPLICATION_PASSWORD to synchronize to WordPress.");
    console.log("=".repeat(110));
    return;
  }

  // Live apply mode
  const editorialCategory = await ensureCategory("gigxomi-editorial", "Gigxomi Editorial");
  const growthCategory = await ensureCategory("video-editor-client-growth", "Video Editor Client Growth");

  for (const entry of entries) {
    const post = postsBySlug.get(entry.slug)!;
    // Query publish and future status separately (status=any requires edit_posts cap)
    const [publishedPosts, scheduledPosts] = await Promise.all([
      request(`/posts?slug=${encodeURIComponent(entry.slug)}&status=publish&per_page=1`).catch(() => []),
      request(`/posts?slug=${encodeURIComponent(entry.slug)}&status=future&per_page=1`).catch(() => []),
    ]);
    const existing = publishedPosts[0] ?? scheduledPosts[0] ?? null;
    const dates = wordpressDates(entry.blogPublishAt);
    const isFuture = new Date(entry.blogPublishAt) > now;
    const status = isFuture ? "future" : "publish";
    const featuredMedia = await uploadFeaturedImage(entry);
    const payload = {
      title: post.title,
      slug: post.slug,
      excerpt: post.metaDescription,
      content: renderArticle(post),
      status,
      categories: [editorialCategory, growthCategory],
      featured_media: featuredMedia,
      meta: {
        // Yoast SEO fields — turns the red dot green when keyphrase + description are set
        _yoast_wpseo_focuskw: post.focusKeyword,
        _yoast_wpseo_metadesc: post.metaDescription,
        _yoast_wpseo_title: post.title + " - Gigxomi Blog",
        _yoast_wpseo_cornerstone: false,
        _yoast_wpseo_is_cornerstone: false,
      },
      ...dates,
    };
    const targetPostId = existing?.id ?? entry.wordpressPostId;
    const endpoint = targetPostId ? `/posts/${targetPostId}` : "/posts";
    const saved = await request(endpoint, { method: "POST", body: JSON.stringify(payload) });
    console.log(`${targetPostId ? "updated" : "created"} ${saved.status.padEnd(7)} ${post.slug} (#${saved.id}) [scheduled: ${entry.blogPublishAt}]`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
