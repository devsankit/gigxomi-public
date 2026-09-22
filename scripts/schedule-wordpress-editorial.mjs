import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  loadComparisonArticles,
  loadGuideArticles,
  renderComparisonArticle,
  renderGuideArticle,
  wordpressDates,
} from "./editorial-content-lib.mjs";

const apply = process.argv.includes("--apply");
const apiBase = (process.env.WORDPRESS_URL || "https://blog.gigxomi.com").replace(/\/$/, "") + "/wp-json/wp/v2";
const username = process.env.WORDPRESS_USERNAME?.trim();
const applicationPassword = process.env.WORDPRESS_APPLICATION_PASSWORD?.replace(/\s+/g, "");
const LINK_TIMEOUT_MS = 12_000;

if (apply && (!username || !applicationPassword)) {
  throw new Error("WORDPRESS_USERNAME and WORDPRESS_APPLICATION_PASSWORD are required with --apply.");
}

const auth = username && applicationPassword ? `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString("base64")}` : "";
async function request(endpoint, options = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Authorization: auth } : {}),
      "User-Agent": "Gigxomi-Editorial-Scheduler/1.0",
      ...options.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`WordPress ${options.method || "GET"} ${endpoint} failed with HTTP ${response.status}: ${body.slice(0, 240)}`);
  return body ? JSON.parse(body) : null;
}

async function ensureCategory(slug, name) {
  const existing = await request(`/categories?slug=${encodeURIComponent(slug)}&context=edit&per_page=1`);
  if (existing[0]) return existing[0].id;
  const created = await request("/categories", { method: "POST", body: JSON.stringify({ slug, name }) });
  return created.id;
}

async function verifyEditorialLinks(articles) {
  const urls = [...new Set(articles.flatMap((article) => article.officialSources.map((source) => source.url)))];
  const transientFailures = [];
  for (const initialUrl of urls) {
    let currentUrl = initialUrl;
    let redirects = 0;
    for (;;) {
      const response = await fetch(currentUrl, {
        redirect: "manual",
        headers: { "User-Agent": "Gigxomi-Editorial-Link-Audit/1.0" },
        signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`Citation redirect has no Location header: ${currentUrl}`);
        redirects += 1;
        if (redirects > 1) throw new Error(`Citation has more than one redirect: ${initialUrl}`);
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }
      if (response.status >= 500) {
        transientFailures.push(`${response.status} ${initialUrl}`);
        break;
      }
      if (response.status >= 400 && ![401, 403, 429].includes(response.status)) {
        throw new Error(`Citation returned HTTP ${response.status}: ${initialUrl}`);
      }
      break;
    }
  }
  console.log(`Citation audit passed for ${urls.length} unique official links.`);
  if (transientFailures.length) {
    console.warn(`Citation audit recorded ${transientFailures.length} temporary upstream failure(s): ${transientFailures.join(", ")}`);
  }
}

async function uploadFeaturedImage(article) {
  if (!article.featuredImagePath) return 0;
  const absolute = path.resolve(article.featuredImagePath);
  const buffer = await fs.readFile(absolute);
  const fingerprint = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  const mediaKey = `gigxomi-editorial-${fingerprint}`;
  const search = await request(`/media?search=${encodeURIComponent(fingerprint)}&context=edit&orderby=id&order=asc&per_page=1`);
  if (search[0]) return search[0].id;
  const extension = path.extname(absolute).toLowerCase();
  const mime = extension === ".webp" ? "image/webp" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  const response = await fetch(`${apiBase}/media`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Disposition": `attachment; filename="${mediaKey}${extension}"`,
      "Content-Type": mime,
      "User-Agent": "Gigxomi-Editorial-Scheduler/1.0",
    },
    body: buffer,
  });
  if (!response.ok) throw new Error(`Featured image upload failed for ${article.slug} with HTTP ${response.status}.`);
  const media = await response.json();
  await request(`/media/${media.id}`, { method: "POST", body: JSON.stringify({ alt_text: article.featuredImageAlt, caption: "" }) });
  return media.id;
}

const comparisons = await loadComparisonArticles();
const guides = await loadGuideArticles();
const articles = [
  ...comparisons.map((article) => ({ ...article, articleType: "comparison", render: renderComparisonArticle })),
  ...guides.map((article) => ({ ...article, articleType: "guide", render: renderGuideArticle })),
];
if (!apply) {
  console.log("Dry run only. Pass --apply with server-only WordPress credentials to upsert content.");
  for (const article of articles) console.log(`${article.editorialStatus.padEnd(8)} ${article.publishAt} ${article.slug}`);
  process.exit(0);
}

await verifyEditorialLinks(articles);

const editorialCategory = await ensureCategory("gigxomi-editorial", "Gigxomi Editorial");
const comparisonCategory = await ensureCategory("software-comparisons", "Software Comparisons");
const agencyGrowthCategory = await ensureCategory("agency-growth", "Agency Growth");

for (const article of articles) {
  const existing = await request(`/posts?slug=${encodeURIComponent(article.slug)}&context=edit&status=any&per_page=1`);
  const dates = wordpressDates(article.publishAt);
  const desiredStatus = article.editorialStatus === "approved" ? (new Date(article.publishAt) > new Date() ? "future" : "publish") : "draft";
  const featuredMedia = await uploadFeaturedImage(article);
  const payload = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.render(article),
    status: desiredStatus,
    categories: [editorialCategory, article.articleType === "comparison" ? comparisonCategory : agencyGrowthCategory],
    ...(desiredStatus !== "draft" ? dates : {}),
    ...(featuredMedia ? { featured_media: featuredMedia } : {}),
  };
  const endpoint = existing[0] ? `/posts/${existing[0].id}` : "/posts";
  const saved = await request(endpoint, { method: "POST", body: JSON.stringify(payload) });
  console.log(`${existing[0] ? "updated" : "created"} ${saved.status.padEnd(7)} ${article.slug} (#${saved.id})`);
}
