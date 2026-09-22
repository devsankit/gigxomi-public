import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
async function load(relative, overrides = {}, fakeFetch = globalThis.fetch) {
  const source = await readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const compiledModule = { exports: {} };
  new Function('require', 'module', 'exports', 'fetch', code)(id => id in overrides ? overrides[id] : require(id), compiledModule, compiledModule.exports, fakeFetch);
  return compiledModule.exports;
}

test('homepage links organization, website and application with consistent public identity', async () => {
  const company = await load('src/lib/seo/company-knowledge-base.ts');
  const { buildHomepageStructuredData } = await load('src/lib/seo/homepage-structured-data.ts', { '@/lib/seo/company-knowledge-base': company });
  const graph = buildHomepageStructuredData('Visible homepage description')['@graph'];
  assert.deepEqual(graph.map(node => node['@type']), ['OnlineBusiness', 'WebSite', 'SoftwareApplication']);
  assert.deepEqual(graph[0].address, {
    '@type': 'PostalAddress',
    addressLocality: 'Dewas',
    addressRegion: 'Madhya Pradesh',
    addressCountry: 'IN',
  });
  assert.equal(graph[1].publisher['@id'], graph[0]['@id']);
  assert.equal(graph[2].publisher['@id'], graph[0]['@id']);
  assert.equal(graph[2].isPartOf['@id'], graph[1]['@id']);
  assert.equal(graph[2].description, 'Visible homepage description');
  assert.ok(graph.every(node => !node.aggregateRating && !node.review));
});

test('company entity page and AI knowledge feed expose one canonical public identity', async () => {
  const about = await readFile(new URL('../src/app/about/page.tsx', import.meta.url), 'utf8');
  const llms = await readFile(new URL('../src/lib/gigxomi/knowledge-base-store.ts', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8');
  assert.match(about, /buildOrganizationStructuredData/);
  assert.match(about, /"@type": "AboutPage"/);
  assert.match(about, /mainEntity: \{ "@id": organization\["@id"\] \}/);
  assert.match(llms, /About Gigxomi:.*companyKnowledgeBase\.aboutPath/);
  assert.match(llms, /## Verified company facts/);
  assert.match(sitemap, /buildSiteUrl\("\/about"\)/);
});

test('default service titles identify the visible owner without overwriting authored SEO titles', async () => {
  const { publicServiceTitle } = await load('src/lib/seo/service-metadata.ts');
  assert.equal(publicServiceTitle({ title: 'Podcast edit', seoTitle: 'Podcast edit', ownerName: 'Editor One' }), 'Podcast edit by Editor One');
  assert.equal(publicServiceTitle({ title: 'Podcast edit', seoTitle: 'Original expert title', ownerName: 'Editor One' }), 'Original expert title');
  assert.equal(publicServiceTitle({ title: 'Podcast by Editor One', ownerName: 'Editor One' }), 'Podcast by Editor One');
});

function wpPost(id, extra = {}) {
  return { id, slug: `post-${id}`, status: 'publish', categories: [7], title: { rendered: `Visible title ${id}` }, excerpt: { rendered: '<p>Article excerpt.</p>' }, content: { rendered: '<h2>Buyer guidance</h2><p>Actual article.</p>' }, date_gmt: '2026-01-01T12:00:00', modified_gmt: '2026-01-02T12:00:00', ...extra };
}

test('WordPress bridge includes posts after page 100 and honors sanitized Yoast SEO metadata', async () => {
  const requests = [];
  const fakeFetch = async value => {
    const url = new URL(value); requests.push(url);
    if (url.pathname.endsWith('/categories')) return Response.json([{ id: 7, slug: 'gigxomi-editorial' }]);
    const data = url.searchParams.get('page') === '2' ? [wpPost(101, { yoast_head_json: { title: '<b>Custom search title</b>', description: '<p>Custom search description.</p>' } })] : Array.from({ length: 100 }, (_, i) => wpPost(i + 1));
    return Response.json(data, { headers: { 'x-wp-totalpages': '2' } });
  };
  const bridge = await load('src/lib/seo/wordpress-editorial.ts', { 'next/cache': { unstable_cache: fn => fn } }, fakeFetch);
  const posts = await bridge.listWordPressEditorialPosts();
  assert.equal(posts.length, 101);
  const last = posts.find(post => post.id === 101);
  assert.equal(last.title, 'Visible title 101');
  assert.equal(last.seoTitle, 'Custom search title');
  assert.equal(last.seoDescription, 'Custom search description.');
  assert.equal(requests.filter(url => url.pathname.endsWith('/posts')).length, 2);
});

test('WordPress drafts, password-protected, scheduled and Yoast-noindex articles remain excluded', async () => {
  const fakeFetch = async value => new URL(value).pathname.endsWith('/categories')
    ? Response.json([{ id: 7, slug: 'gigxomi-editorial' }])
    : Response.json([wpPost(1), wpPost(2, { status: 'draft' }), wpPost(3, { content: { rendered: 'private', protected: true } }), wpPost(4, { date_gmt: '2999-01-01T00:00:00' }), wpPost(5, { yoast_head_json: { robots: { index: 'noindex' } } })]);
  const bridge = await load('src/lib/seo/wordpress-editorial.ts', { 'next/cache': { unstable_cache: fn => fn } }, fakeFetch);
  assert.deepEqual((await bridge.listWordPressEditorialPosts()).map(post => post.id), [1]);
});

test('public article metadata uses Yoast fields without changing the visible article heading', async () => {
  const source = await readFile(new URL('../src/app/blog/[slug]/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /title: \{ absolute: wordpressPost.seoTitle \}/);
  assert.match(source, /description: wordpressPost.seoDescription/);
  const article = await readFile(new URL('../src/components/public/wordpress-editorial-article.tsx', import.meta.url), 'utf8');
  assert.match(article, /<h1>\{post.title\}<\/h1>/);
});

test('WordPress Yoast sync is source-driven, reversible and does not forge plugin scores', async () => {
  const source = await readFile(new URL('../scripts/update-wordpress-editorial-yoast.php', import.meta.url), 'utf8');
  assert.match(source, /_yoast_wpseo_focuskw/);
  assert.match(source, /_yoast_wpseo_title/);
  assert.match(source, /_yoast_wpseo_metadesc/);
  assert.match(source, /yoast-editorial-before-/);
  assert.match(source, /file_put_contents\(\$backupPath/);
  assert.doesNotMatch(source, /update_post_meta\([^\n]*_yoast_wpseo_(?:linkdex|content_score)/);
});

test('scheduled editorial content gives Yoast real internal links and useful keyphrase signals', async () => {
  const source = await readFile(new URL('../scripts/editorial-content-lib.mjs', import.meta.url), 'utf8');
  assert.match(source, /<strong>\$\{escapeHtml\(article\.focusKeyphrase\)\}<\/strong>/);
  assert.match(source, /<h2>\$\{escapeHtml\(article\.focusKeyphrase\)\}: quick verdict<\/h2>/);
  assert.match(source, /How to decide: \$\{escapeHtml\(article\.focusKeyphrase\)\}/);
  assert.match(source, /href="\/blog\/editorial-methodology"/);
  assert.match(source, /href="\/blog\/video-editing-project-management-tools"/);
  assert.doesNotMatch(source, /href="https:\/\/www\.gigxomi\.com\/blog\/editorial-methodology"/);
});

test('production builds keep published knowledge-base fallbacks in the sitemap', async () => {
  const sitemap = await readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8');
  assert.match(sitemap, /phase-production-build[\s\S]*return listFallbackPublishedKnowledgeBaseArticles\(\)/);
  assert.doesNotMatch(sitemap, /phase-production-build[\s\S]{0,120}return \[\]/);
  const store = await readFile(new URL('../src/lib/gigxomi/knowledge-base-store.ts', import.meta.url), 'utf8');
  assert.match(store, /export function listFallbackPublishedKnowledgeBaseArticles\(\)/);
});
