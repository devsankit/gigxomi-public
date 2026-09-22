import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { INDEXNOW_KEY, KEY_URL, SITE_ORIGIN, inspectIndexablePage, publicIndexUrl, sitemapUrls, submissionResult } from '../scripts/lib/indexnow.mjs';

const page = (extra = '', text = 'Useful content') => `<html><head><title>Gigxomi guide</title><meta name="description" content="A buyer guide"><link rel="canonical" href="${SITE_ORIGIN}/blog/test">${extra}</head><body><main><h1>A guide</h1><p>${text}</p></main></body></html>`;

test('IndexNow accepts only canonical public pages, never private or alternate hosts', () => {
  for (const path of ['/', '/pricing', '/blog/test', '/services/test', '/knowledge-base/agency/test']) assert.equal(publicIndexUrl(SITE_ORIGIN + path), SITE_ORIGIN + path);
  for (const path of ['/api/conversations', '/sales', '/admin/chat', '/signup', '/login', '/subscription-checkout', '/blog/test?token=secret', '/blog/test#fragment', '/blog/%61dmin', '/blog/test/']) assert.equal(publicIndexUrl(SITE_ORIGIN + path), null);
  for (const value of ['https://gigxomi.com/', 'https://blog.gigxomi.com/', 'https://ankit.gigxomi.com/', 'https://evil.test/', 'http://www.gigxomi.com/', 'https://user:pass@www.gigxomi.com/']) assert.equal(publicIndexUrl(value), null);
});

test('sitemap parsing deduplicates and fails closed for mixed unsafe or empty content', () => {
  const entry = `<url><loc>${SITE_ORIGIN}/blog/test</loc></url>`;
  assert.deepEqual(sitemapUrls(`<urlset>${entry}${entry}</urlset>`), [SITE_ORIGIN + '/blog/test']);
  for (const xml of ['<html>error</html>', '<urlset></urlset>', `<urlset>${entry}<url><loc>https://evil.test/</loc></url></urlset>`, `<!DOCTYPE urlset><urlset>${entry}</urlset>`, `<urlset>${entry}`]) assert.throws(() => sitemapUrls(xml));
});

test('private robots directives, redirect canonicals, missing content and broken schema are excluded', () => {
  const url = SITE_ORIGIN + '/blog/test';
  assert.match(inspectIndexablePage(url, page()), /^[a-f0-9]{64}$/);
  for (const html of [page('<meta name="robots" content="noindex, follow">'), page('<meta name="bingbot" content="none">'), page().replace('/blog/test', '/blog/other'), page().replace('<h1>', '<h2>'), page('<script type="application/ld+json">invalid</script>')]) assert.throws(() => inspectIndexablePage(url, html));
  assert.throws(() => inspectIndexablePage(url, page(), new Headers({ 'X-Robots-Tag': 'noindex' })));
});

test('content fingerprints ignore tracking scripts but detect meaningful changes', () => {
  const url = SITE_ORIGIN + '/blog/test';
  assert.equal(inspectIndexablePage(url, page('<script>random=1</script>')), inspectIndexablePage(url, page('<script>random=2</script>')));
  assert.notEqual(inspectIndexablePage(url, page()), inspectIndexablePage(url, page('', 'Updated buyer guidance')));
});

test('ownership key file matches its public location', async () => {
  assert.equal(new URL(KEY_URL).pathname, `/${INDEXNOW_KEY}.txt`);
  assert.equal((await readFile(new URL(`../public/${INDEXNOW_KEY}.txt`, import.meta.url), 'utf8')).trim(), INDEXNOW_KEY);
});

test('accepted submission is never reported as indexed and failures are not accepted', () => {
  assert.equal(submissionResult(200), 'received');
  assert.equal(submissionResult(202), 'received_key_validation_pending');
  for (const status of [301, 400, 403, 422, 429, 500]) assert.throws(() => submissionResult(status));
});

test('runner defaults to dry-run, persists only after acceptance, and does not import private stores', async () => {
  const source = await readFile(new URL('../scripts/submit-indexnow.mjs', import.meta.url), 'utf8');
  assert.match(source, /if \(!changed.length \|\| !submit\) return/);
  assert.ok(source.indexOf('submissionResult(result.response.status)') < source.indexOf('await writeFile(temporary'));
  assert.match(source, /previous.pages\[url\]\?\.hash !== hash/);
  assert.doesNotMatch(source, /prisma|accessToken|CRON_SECRET|local-platform-store|meta\/|conversations\//);
});
