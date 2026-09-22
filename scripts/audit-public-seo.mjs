const DEFAULT_BASE_URL = "https://www.gigxomi.com";
const DEFAULT_WORDPRESS_URL = "https://blog.gigxomi.com";
const CONCURRENCY = 12;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1]?.trim();
  return value || fallback;
}

const baseUrl = new URL(option("--base-url", process.env.SEO_BASE_URL || DEFAULT_BASE_URL));
const wordpressUrl = new URL(option("--wordpress-url", process.env.SEO_WORDPRESS_URL || DEFAULT_WORDPRESS_URL));
const strictExternal = process.argv.includes("--strict-external");

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractAttributeValues(html, attribute) {
  const values = [];
  const expression = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "gi");
  for (const match of html.matchAll(expression)) values.push(decodeHtml(match[1]));
  return values;
}

function extractCanonical(html) {
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel\s*=\s*["'][^"']*canonical[^"']*["']/i.test(tag[0])) continue;
    const href = extractAttributeValues(tag[0], "href")[0];
    if (href) return href;
  }
  return "";
}

function extractRobots(html) {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (!/\bname\s*=\s*["']robots["']/i.test(tag[0])) continue;
    return extractAttributeValues(tag[0], "content")[0] || "";
  }
  return "";
}

function extractIds(html) {
  return new Set(extractAttributeValues(html, "id"));
}

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeHtml(match[1].trim()));
}

function isHtml(response) {
  return (response.headers.get("content-type") || "").toLowerCase().includes("text/html");
}

async function requestWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRedirectChain(value, { readBody = true } = {}) {
  const chain = [];
  let current = new URL(value);

  for (let index = 0; index <= MAX_REDIRECTS; index += 1) {
    let response;
    try {
      response = await requestWithTimeout(current, {
        method: readBody ? "GET" : "HEAD",
        redirect: "manual",
        headers: readBody ? { Accept: "text/html,application/xml,text/plain;q=0.9,*/*;q=0.8" } : undefined,
      });
    } catch (error) {
      return { body: "", chain, error: error instanceof Error ? error.message : String(error), finalUrl: current.toString(), response: null };
    }

    chain.push({ status: response.status, url: current.toString() });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      const body = readBody ? await response.text().catch(() => "") : "";
      return { body, chain, error: "", finalUrl: current.toString(), response };
    }

    const location = response.headers.get("location");
    if (!location) return { body: "", chain, error: "Redirect response has no Location header.", finalUrl: current.toString(), response };
    current = new URL(location, current);
  }

  return { body: "", chain, error: `Redirect chain exceeded ${MAX_REDIRECTS} hops.`, finalUrl: current.toString(), response: null };
}

async function mapConcurrent(items, worker, concurrency = CONCURRENCY) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, run));
  return results;
}

const errors = [];
const warnings = [];
const pageCache = new Map();

function fail(code, detail) {
  errors.push({ code, detail });
}

function warn(code, detail) {
  warnings.push({ code, detail });
}

async function loadPage(url) {
  const key = normalizeUrl(url);
  if (!pageCache.has(key)) pageCache.set(key, fetchRedirectChain(key));
  return pageCache.get(key);
}

const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();
const sitemapResult = await loadPage(sitemapUrl);
if (sitemapResult.error || !sitemapResult.response || sitemapResult.response.status !== 200) {
  fail("sitemap-unavailable", `${sitemapUrl}: ${sitemapResult.error || sitemapResult.response?.status || "unknown error"}`);
}

const sitemapUrls = sitemapResult.response?.status === 200 ? [...new Set(extractSitemapUrls(sitemapResult.body).map(normalizeUrl))] : [];
if (!sitemapUrls.length) fail("sitemap-empty", `${sitemapUrl} contains no <loc> entries.`);
if (sitemapResult.response?.status === 200) {
  const entries = extractSitemapUrls(sitemapResult.body).map(normalizeUrl);
  if (entries.length !== sitemapUrls.length) fail("sitemap-duplicate", "Sitemap contains repeated canonical URLs.");
  for (const match of sitemapResult.body.matchAll(/<lastmod>\s*([^<]+)\s*<\/lastmod>/gi)) {
    const time = new Date(match[1]).getTime();
    if (!Number.isFinite(time) || time > Date.now() + 60000) fail("sitemap-date", "Sitemap has an invalid or future modification date.");
  }
}

const pageResults = await mapConcurrent(sitemapUrls, async (url) => {
  const result = await loadPage(url);
  if (result.error || !result.response) {
    fail("page-unavailable", `${url}: ${result.error || "no response"}`);
    return { html: "", result, url };
  }
  if (result.response.status < 200 || result.response.status >= 300) fail("page-status", `${url}: HTTP ${result.response.status}`);
  if (result.chain.length > 1) fail("sitemap-redirect", `${url}: ${result.chain.map((item) => `${item.status} ${item.url}`).join(" -> ")}`);

  const html = isHtml(result.response) ? result.body : "";
  if (html) {
    const canonical = extractCanonical(html);
    const robots = extractRobots(html).toLowerCase();
    if (/\b(noindex|none)\b/i.test(`${robots},${result.response.headers.get("x-robots-tag") || ""}`)) fail("sitemap-noindex", `${url} is in the sitemap but declares noindex.`);
    if (![...html.matchAll(/<meta\b[^>]*>/gi)].some((tag) => /\bname\s*=\s*["']description["']/i.test(tag[0]) && extractAttributeValues(tag[0], "content")[0]?.trim())) fail("description-missing", url);
    if ([...html.matchAll(/<h1\b/gi)].length !== 1) fail("primary-heading", `${url}: expected one H1.`);
    for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(script[1]); } catch { fail("schema-json-invalid", url); }
    }
    if (!canonical) fail("canonical-missing", url);
    else {
      const canonicalUrl = new URL(canonical, url);
      if (canonicalUrl.protocol !== "https:" || canonicalUrl.hostname !== baseUrl.hostname) fail("canonical-host", `${url}: ${canonicalUrl.toString()}`);
      if (normalizeUrl(canonicalUrl) !== normalizeUrl(result.finalUrl)) fail("canonical-mismatch", `${url}: ${canonicalUrl.toString()}`);
    }
    if (/(?:http:\/\/(?:www\.)?gigxomi\.com|https:\/\/gigxomi\.com|http:\/\/blog\.gigxomi\.com)/i.test(html)) {
      fail("noncanonical-gigxomi-url", url);
    }
  }
  return { html, result, url };
});

const internalLinks = new Map();
const externalLinks = new Map();
const fragmentLinks = [];

for (const page of pageResults) {
  if (!page.html) continue;
  for (const href of extractAttributeValues(page.html, "href")) {
    if (!href || /^(?:mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let target;
    try {
      target = new URL(href, page.result.finalUrl);
    } catch {
      fail("invalid-link", `${page.url}: ${href}`);
      continue;
    }

    if (!/^https?:$/.test(target.protocol)) continue;
    const fragment = target.hash.slice(1);
    target.hash = "";
    const normalized = target.toString();
    if (target.hostname === baseUrl.hostname || target.hostname === wordpressUrl.hostname || target.hostname === "gigxomi.com") {
      if (!internalLinks.has(normalized)) internalLinks.set(normalized, new Set());
      internalLinks.get(normalized).add(page.url);
      if (fragment) fragmentLinks.push({ fragment: decodeURIComponent(fragment), source: page.url, target: normalized });
    } else {
      if (!externalLinks.has(normalized)) externalLinks.set(normalized, new Set());
      externalLinks.get(normalized).add(page.url);
    }
  }
}

await mapConcurrent([...internalLinks.entries()], async ([url, sources]) => {
  const result = await loadPage(url);
  if (result.error || !result.response) {
    fail("broken-internal-link", `${url} linked from ${[...sources].slice(0, 3).join(", ")}: ${result.error || "no response"}`);
    return;
  }
  if (result.response.status < 200 || result.response.status >= 300) fail("broken-internal-link", `${url}: HTTP ${result.response.status}`);
  if (result.chain.length > 2) fail("redirect-chain", `${url}: ${result.chain.map((item) => `${item.status} ${item.url}`).join(" -> ")}`);
  const requestedPath = new URL(url).pathname;
  if (
    requestedPath !== "/login" &&
    new URL(result.finalUrl).pathname.startsWith("/login") &&
    [...sources].some((source) => new URL(source).pathname.startsWith("/blog"))
  ) {
    fail("editorial-login-redirect", `${url} linked from ${[...sources].slice(0, 3).join(", ")}`);
  }
});

await mapConcurrent(fragmentLinks, async ({ fragment, source, target }) => {
  const result = await loadPage(target);
  if (!result.body || !isHtml(result.response)) return;
  if (!extractIds(result.body).has(fragment)) fail("missing-fragment", `${source} -> ${target}#${fragment}`);
});

await mapConcurrent([...externalLinks.entries()], async ([url, sources]) => {
  const result = await fetchRedirectChain(url, { readBody: false });
  if (result.error || !result.response || result.response.status >= 400) {
    const detail = `${url} linked from ${[...sources].slice(0, 3).join(", ")}: ${result.error || `HTTP ${result.response?.status}`}`;
    if (strictExternal) fail("broken-external-link", detail);
    else warn("external-link-review", detail);
  }
});

const robotsUrl = new URL("/robots.txt", baseUrl).toString();
const robotsResult = await loadPage(robotsUrl);
if (!robotsResult.response || robotsResult.response.status !== 200) fail("robots-unavailable", `${robotsUrl}: ${robotsResult.error || robotsResult.response?.status}`);
else {
  const contentType = (robotsResult.response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/plain")) fail("robots-content-type", `${robotsUrl}: ${contentType || "missing"}`);
  if (!robotsResult.body.includes(sitemapUrl)) fail("robots-sitemap", `${robotsUrl} does not advertise ${sitemapUrl}`);
  if (/http:\/\//i.test(robotsResult.body)) fail("robots-insecure-url", robotsUrl);
}

const wordpressRobotsUrl = new URL("/robots.txt", wordpressUrl).toString();
const wordpressRobots = await loadPage(wordpressRobotsUrl);
if (!wordpressRobots.response || wordpressRobots.response.status !== 200) fail("wordpress-robots-unavailable", `${wordpressRobotsUrl}: ${wordpressRobots.error || wordpressRobots.response?.status}`);
else {
  const contentType = (wordpressRobots.response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/plain")) fail("wordpress-robots-content-type", `${wordpressRobotsUrl}: ${contentType || "missing"}`);
  if (!wordpressRobots.body.includes(sitemapUrl)) fail("wordpress-robots-sitemap", `${wordpressRobotsUrl} does not advertise ${sitemapUrl}`);
  if (wordpressRobots.chain.length > 1) fail("wordpress-robots-redirect", wordpressRobots.chain.map((item) => `${item.status} ${item.url}`).join(" -> "));
  const sitemapDirectives = wordpressRobots.body.match(/^Sitemap:\s*\S+/gim) || [];
  if (sitemapDirectives.length !== 1 || sitemapDirectives[0].trim() !== `Sitemap: ${sitemapUrl}`) {
    fail("wordpress-robots-extra-sitemap", `${wordpressRobotsUrl}: ${sitemapDirectives.join(" | ") || "missing"}`);
  }
  if (/http:\/\//i.test(wordpressRobots.body)) fail("wordpress-robots-insecure-url", wordpressRobotsUrl);
}

for (const path of ["/sitemap_index.xml", "/wp-sitemap.xml", "/post-sitemap.xml"]) {
  const url = new URL(path, wordpressUrl).toString();
  const result = await loadPage(url);
  if (result.error || !result.response) {
    fail("wordpress-sitemap-unavailable", `${url}: ${result.error || "no response"}`);
    continue;
  }
  if (normalizeUrl(result.finalUrl) !== normalizeUrl(sitemapUrl) || result.chain.length !== 2) {
    fail("wordpress-sitemap-redirect", `${url}: ${result.chain.map((item) => `${item.status} ${item.url}`).join(" -> ")}`);
  }
}

console.log(`SEO audit: ${sitemapUrls.length} sitemap URLs, ${internalLinks.size} internal targets, ${externalLinks.size} external targets.`);
for (const item of warnings) console.warn(`WARNING [${item.code}] ${item.detail}`);
for (const item of errors) console.error(`ERROR [${item.code}] ${item.detail}`);

if (errors.length) {
  console.error(`SEO audit failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`SEO audit passed with ${warnings.length} warning(s).`);
