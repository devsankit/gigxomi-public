import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { loadComparisonArticles } from "./editorial-content-lib.mjs";

const apply = process.argv.includes("--apply");
const origin = (process.env.WORDPRESS_URL || "https://blog.gigxomi.com").replace(/\/$/, "");
const apiBase = `${origin}/wp-json/wp/v2`;
const username = process.env.WORDPRESS_USERNAME?.trim();
const applicationPassword = process.env.WORDPRESS_APPLICATION_PASSWORD?.replace(/\s+/g, "");
if (!username || !applicationPassword) throw new Error("Server-only WordPress credentials are required.");
const authorization = `Basic ${Buffer.from(`${username}:${applicationPassword}`).toString("base64")}`;

async function request(endpoint, options = {}) {
  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: authorization,
      "User-Agent": "Gigxomi-Editorial-Media-Cleanup/1.0",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`WordPress media cleanup failed with HTTP ${response.status}: ${text.slice(0, 200)}`);
  return { body: text ? JSON.parse(text) : null, headers: response.headers };
}

async function listAllPosts() {
  const first = await request("/posts?context=edit&status=any&per_page=100&page=1&_fields=id,slug,featured_media");
  const totalPages = Number(first.headers.get("x-wp-totalpages") || 1);
  const posts = [...first.body];
  for (let page = 2; page <= totalPages; page += 1) {
    const result = await request(`/posts?context=edit&status=any&per_page=100&page=${page}&_fields=id,slug,featured_media`);
    posts.push(...result.body);
  }
  return posts;
}

const articles = await loadComparisonArticles();
const fingerprintSlugs = new Map();
for (const article of articles) {
  const buffer = await fs.readFile(path.resolve(article.featuredImagePath));
  const fingerprint = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12);
  fingerprintSlugs.set(fingerprint, [...(fingerprintSlugs.get(fingerprint) || []), article.slug]);
}

const allPosts = await listAllPosts();
const referencedMedia = new Set(allPosts.map((post) => Number(post.featured_media)).filter(Boolean));
const candidates = [];

for (const [fingerprint, slugs] of fingerprintSlugs) {
  const result = await request(`/media?search=${encodeURIComponent(fingerprint)}&context=edit&orderby=id&order=asc&per_page=100&_fields=id,slug,title`);
  for (const media of result.body) {
    const identity = `${media.slug || ""} ${media.title?.raw || media.title?.rendered || ""}`.toLowerCase();
    const createdByEditorialScheduler = slugs.some((slug) => identity.includes(slug)) || identity.includes(`gigxomi-editorial-${fingerprint}`);
    if (createdByEditorialScheduler && !referencedMedia.has(media.id)) candidates.push(media);
  }
}

if (!apply) {
  console.log(`Dry run: ${candidates.length} unreferenced duplicate editorial media item(s) can be removed.`);
  process.exit(0);
}

for (const media of candidates) await request(`/media/${media.id}?force=true`, { method: "DELETE" });
console.log(`Permanently removed ${candidates.length} unreferenced duplicate editorial media item(s); referenced featured images were preserved.`);
