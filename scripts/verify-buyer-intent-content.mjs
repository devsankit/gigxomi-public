import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { loadGuideArticles, renderGuideArticle } from "./editorial-content-lib.mjs";

const REQUIRED_GUIDE_SLUGS = [
  "start-video-editing-agency",
  "video-editing-agency-software",
  "video-editing-agency-crm",
  "video-editing-client-portal",
  "replace-video-editing-agency-spreadsheets",
];

const articles = await loadGuideArticles();
assert.equal(articles.length, REQUIRED_GUIDE_SLUGS.length, "The first buyer-intent cluster must contain exactly five guides.");
assert.deepEqual(articles.map((article) => article.slug).sort(), [...REQUIRED_GUIDE_SLUGS].sort());

const seenTitles = new Set();
const seenKeyphrases = new Set();
const seenDays = new Set();

function words(value) {
  return value.toLowerCase().replace(/<[^>]+>/g, " ").match(/[a-z0-9]+/g) ?? [];
}

function shingles(value, size = 8) {
  const tokens = words(value);
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) result.add(tokens.slice(index, index + size).join(" "));
  return result;
}

function similarity(left, right) {
  const common = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size;
  return union ? common / union : 0;
}

for (const article of articles) {
  assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(!seenTitles.has(article.title), `Duplicate guide title: ${article.title}`);
  assert(!seenKeyphrases.has(article.focusKeyphrase.toLowerCase()), `Duplicate focus keyphrase: ${article.focusKeyphrase}`);
  seenTitles.add(article.title);
  seenKeyphrases.add(article.focusKeyphrase.toLowerCase());
  assert.equal(article.byline, "Gigxomi Editorial");
  assert.equal(article.verifiedAt, "29 August 2026");
  assert.equal(article.editorialStatus, "approved");
  assert(article.title.toLowerCase().includes(article.focusKeyphrase.toLowerCase()));
  assert(article.seoDescription.length >= 120 && article.seoDescription.length <= 155, `${article.slug} meta description must be 120-155 characters.`);
  assert(article.seoDescription.toLowerCase().includes(article.focusKeyphrase.toLowerCase()));
  assert(article.sections.length >= 6, `${article.slug} needs six substantive sections.`);
  assert(article.decisionChecklist.length >= 7, `${article.slug} needs a decision checklist.`);
  assert(article.officialSources.length >= 3, `${article.slug} needs at least three first-party sources.`);
  assert(article.officialSources.some((source) => source.url.startsWith("https://www.gigxomi.com/")));
  assert(article.officialSources.some((source) => !source.url.includes("gigxomi.com")), `${article.slug} needs an independent authoritative source.`);
  assert(article.officialSources.every((source) => source.url.startsWith("https://")));
  const html = renderGuideArticle(article);
  assert(words(html).length >= 850, `${article.slug} is under 850 words.`);
  assert((html.match(/href="\//g) ?? []).length >= 4, `${article.slug} needs at least four internal links.`);
  assert((html.match(/href="https:\/\//g) ?? []).length >= 4, `${article.slug} needs authoritative external links.`);
  assert(!/\bguaranteed rankings?\b/i.test(html));
  const day = article.publishAt.slice(0, 10);
  assert(!seenDays.has(day), `Only one buyer-intent guide may be scheduled per day: ${day}`);
  seenDays.add(day);
}

const rendered = articles.map((article) => ({ slug: article.slug, shingles: shingles(renderGuideArticle(article)) }));
for (let left = 0; left < rendered.length; left += 1) {
  for (let right = left + 1; right < rendered.length; right += 1) {
    const score = similarity(rendered[left].shingles, rendered[right].shingles);
    assert(score < 0.12, `${rendered[left].slug} and ${rendered[right].slug} are too similar (${score.toFixed(3)}).`);
  }
}

console.log(`Buyer-intent verification passed: ${articles.length} original guides across ${seenDays.size} publishing days.`);

const deployWorkflow = await fs.readFile(".github/workflows/deploy.yml", "utf8");
const scheduleIndex = deployWorkflow.indexOf("npm run wordpress:schedule -- --apply");
const yoastIndex = deployWorkflow.indexOf("npm run wordpress:yoast -- --apply");
assert(scheduleIndex >= 0, "Production deploy must schedule source-controlled editorial guides.");
assert(yoastIndex > scheduleIndex, "Yoast metadata must be synchronized after WordPress posts are scheduled.");

const yoastSync = await fs.readFile("scripts/update-wordpress-editorial-yoast.php", "utf8");
assert.match(yoastSync, /content\/buyer-intent/);
assert.doesNotMatch(yoastSync, /_yoast_wpseo_(?:linkdex|content_score).*=>/);
const scheduler = await fs.readFile("scripts/schedule-wordpress-editorial.mjs", "utf8");
assert.match(scheduler, /response\.status >= 500/);
assert.match(scheduler, /temporary upstream failure/);
assert.match(scheduler, /throw new Error\(`Citation returned HTTP \$\{response\.status\}/);
console.log("Production scheduling and authentic Yoast metadata checks passed.");
