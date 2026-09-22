import fs from "node:fs/promises";
import path from "node:path";

export const EDITORIAL_TIME_ZONE = "Asia/Kolkata";
export const REQUIRED_COMPARISON_SLUGS = [
  "asana-vs-gigxomi",
  "notion-vs-gigxomi",
  "todoist-vs-gigxomi",
  "clickup-vs-gigxomi",
  "monday-com-vs-gigxomi",
  "trello-vs-gigxomi",
  "frame-io-vs-gigxomi",
  "wipster-vs-gigxomi",
  "filestage-vs-gigxomi",
  "timeliner-vs-gigxomi",
  "studiobinder-vs-gigxomi",
  "plutio-vs-gigxomi",
];

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraph(value) {
  return `<p>${escapeHtml(value)}</p>`;
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function renderComparisonArticle(article) {
  const rows = article.featureMatrix
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.criterion)}</th><td>${escapeHtml(row.competitor)}</td><td>${escapeHtml(row.gigxomi)}</td><td>${escapeHtml(row.decision)}</td></tr>`,
    )
    .join("");
  const sections = article.sections
    .map((section) => `<h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(paragraph).join("")}${section.bullets?.length ? list(section.bullets) : ""}`)
    .join("");
  const sources = article.officialSources
    .map((source) => `<li><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a></li>`)
    .join("");

  return [
    `<p><strong>${escapeHtml(article.focusKeyphrase)}</strong>: ${escapeHtml(article.excerpt)}</p>`,
    `<p><strong>Verified:</strong> ${escapeHtml(article.verifiedAt)} · <strong>By:</strong> Gigxomi Editorial</p>`,
    paragraph(article.introduction),
    `<h2>${escapeHtml(article.focusKeyphrase)}: quick verdict</h2>${paragraph(article.verdict)}`,
    `<h2>${escapeHtml(article.competitor)} vs Gigxomi at a glance</h2>`,
    `<table><thead><tr><th scope="col">Decision area</th><th scope="col">${escapeHtml(article.competitor)}</th><th scope="col">Gigxomi</th><th scope="col">What it means</th></tr></thead><tbody>${rows}</tbody></table>`,
    sections,
    `<h2>How to decide: ${escapeHtml(article.focusKeyphrase)}</h2>${list(article.decisionChecklist)}`,
    `<h2>Official sources checked</h2><p>Product capabilities can change. We checked these primary sources on ${escapeHtml(article.verifiedAt)}:</p><ul>${sources}</ul>`,
    `<p>Read our <a href="/blog/editorial-methodology">editorial methodology</a>, compare all <a href="/blog/video-editing-project-management-tools">video editing project management tools</a>, or <a href="/signup?role=agency">start a Gigxomi agency workspace</a>.</p>`,
    `<p>Prefer mobile? <a href="https://play.google.com/store/apps/details?id=com.gigxomi.app">Get the official Gigxomi app on Google Play</a>.</p>`,
  ].join("\n");
}

export function renderGuideArticle(article) {
  const sections = article.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(paragraph).join("")}${section.bullets?.length ? list(section.bullets) : ""}`,
    )
    .join("");
  const sources = article.officialSources
    .map(
      (source) =>
        `<li><a href="${escapeHtml(source.url)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`,
    )
    .join("");

  return [
    `<p><strong>${escapeHtml(article.focusKeyphrase)}</strong>: ${escapeHtml(article.excerpt)}</p>`,
    `<p><strong>Reviewed:</strong> ${escapeHtml(article.verifiedAt)} · <strong>By:</strong> Gigxomi Editorial</p>`,
    paragraph(article.introduction),
    `<h2>${escapeHtml(article.focusKeyphrase)}: the short answer</h2>${paragraph(article.shortAnswer)}`,
    sections,
    `<h2>${escapeHtml(article.decisionHeading)}</h2>${list(article.decisionChecklist)}`,
    `<h2>Sources and product pages checked</h2><p>Product capabilities and platform rules can change. We reviewed these first-party sources on ${escapeHtml(article.verifiedAt)}:</p><ul>${sources}</ul>`,
    `<p>Compare <a href="/blog/video-editing-project-management-tools">video editing project management software</a>, read our <a href="/blog/editorial-methodology">editorial methodology</a>, review <a href="/pricing">Gigxomi pricing</a>, or <a href="/signup?role=agency">create an agency workspace</a>.</p>`,
    `<p>Prefer mobile? <a href="https://play.google.com/store/apps/details?id=com.gigxomi.app" rel="noopener noreferrer">Get the official Gigxomi app on Google Play</a>.</p>`,
  ].join("\n");
}

export async function loadComparisonArticles(rootDirectory = process.cwd()) {
  const directory = path.join(rootDirectory, "content", "comparisons");
  const entries = (await fs.readdir(directory)).filter((entry) => entry.endsWith(".json")).sort();
  return Promise.all(entries.map(async (entry) => JSON.parse(await fs.readFile(path.join(directory, entry), "utf8"))));
}

export async function loadGuideArticles(rootDirectory = process.cwd()) {
  const directory = path.join(rootDirectory, "content", "buyer-intent");
  const entries = (await fs.readdir(directory)).filter((entry) => entry.endsWith(".json")).sort();
  return Promise.all(entries.map(async (entry) => JSON.parse(await fs.readFile(path.join(directory, entry), "utf8"))));
}

export function wordpressDates(publishAt) {
  const parsed = new Date(publishAt);
  if (!Number.isFinite(parsed.getTime())) throw new Error(`Invalid publishAt value: ${publishAt}`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EDITORIAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsed);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`,
    date_gmt: parsed.toISOString().replace(/\.\d{3}Z$/, ""),
  };
}
