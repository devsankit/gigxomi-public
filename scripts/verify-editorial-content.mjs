import assert from "node:assert/strict";
import { loadComparisonArticles, renderComparisonArticle, REQUIRED_COMPARISON_SLUGS } from "./editorial-content-lib.mjs";

const articles = await loadComparisonArticles();
assert.equal(articles.length, REQUIRED_COMPARISON_SLUGS.length, "Exactly 12 comparison articles are required.");
assert.deepEqual(articles.map((article) => article.slug).sort(), [...REQUIRED_COMPARISON_SLUGS].sort(), "The approved comparison set is incomplete.");

const publishDays = new Map();
const seenTitles = new Set();
const seenSlugs = new Set();
const forbiddenClaims = [/\bguaranteed\b/i, /\bbest for everyone\b/i, /\bnumber one\b/i, /\bcheapest\b/i];

function words(value) {
  return value.toLowerCase().replace(/<[^>]+>/g, " ").match(/[a-z0-9]+/g) ?? [];
}

function shingles(value, size = 8) {
  const tokens = words(value);
  const set = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) set.add(tokens.slice(index, index + size).join(" "));
  return set;
}

function similarity(left, right) {
  const common = [...left].filter((item) => right.has(item)).length;
  const union = new Set([...left, ...right]).size;
  return union ? common / union : 0;
}

for (const article of articles) {
  assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(!seenSlugs.has(article.slug), `Duplicate slug: ${article.slug}`);
  assert(!seenTitles.has(article.title), `Duplicate title: ${article.title}`);
  seenSlugs.add(article.slug);
  seenTitles.add(article.title);
  assert.equal(article.byline, "Gigxomi Editorial");
  assert.equal(article.verifiedAt, "24 August 2026");
  assert(["approved", "draft"].includes(article.editorialStatus));
  assert(typeof article.focusKeyphrase === "string" && article.focusKeyphrase.length >= 10 && article.focusKeyphrase.length <= 40);
  assert(article.title.toLowerCase().includes(article.focusKeyphrase.toLowerCase()));
  assert(typeof article.seoDescription === "string" && article.seoDescription.length >= 120 && article.seoDescription.length <= 155);
  assert(article.seoDescription.toLowerCase().includes(article.focusKeyphrase.toLowerCase()));
  assert(article.officialSources.length >= 2, `${article.slug} needs at least two official sources.`);
  assert(article.officialSources.some((source) => source.url.startsWith("https://www.gigxomi.com/")), `${article.slug} needs a Gigxomi primary source.`);
  assert(article.officialSources.every((source) => /^https:\/\//.test(source.url)), `${article.slug} contains a non-HTTPS source.`);
  assert(article.featureMatrix.length >= 5, `${article.slug} needs a substantive feature matrix.`);
  assert(article.sections.length >= 5, `${article.slug} needs at least five original sections.`);
  assert(article.sections.some((section) => /migration|switch/i.test(section.heading)), `${article.slug} needs migration advice.`);
  assert(article.decisionChecklist.length >= 5, `${article.slug} needs a decision checklist.`);
  const html = renderComparisonArticle(article);
  assert(words(html).length >= 700, `${article.slug} is under 700 words.`);
  forbiddenClaims.forEach((pattern) => assert(!pattern.test(html), `${article.slug} contains prohibited marketing language: ${pattern}`));
  const day = article.publishAt.slice(0, 10);
  publishDays.set(day, (publishDays.get(day) ?? 0) + 1);
}

for (const [day, count] of publishDays) assert(count <= 2, `${day} schedules ${count} articles; maximum is two.`);

const rendered = articles.map((article) => ({ slug: article.slug, shingles: shingles(renderComparisonArticle(article)) }));
for (let left = 0; left < rendered.length; left += 1) {
  for (let right = left + 1; right < rendered.length; right += 1) {
    const score = similarity(rendered[left].shingles, rendered[right].shingles);
    assert(score < 0.18, `${rendered[left].slug} and ${rendered[right].slug} are too similar (${score.toFixed(3)}).`);
  }
}

console.log(`Editorial verification passed: ${articles.length} articles, ${publishDays.size} publishing days, maximum two per day.`);
