// Only public canonical pages. No login, database, Google token, or messaging dependency.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, KEY_URL, SITE_ORIGIN, inspectIndexablePage, sitemapUrls, submissionResult } from './lib/indexnow.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const stateDirectory = resolve(root, '.gigxomi');
const stateFile = resolve(stateDirectory, 'indexnow-state.json');
const args = process.argv.slice(2);
if (args.some(arg => !['--submit', '--all'].includes(arg))) throw Error('Supported options: --submit --all');
const submit = args.includes('--submit');

async function request(url, init = {}) {
  const response = await fetch(url, { redirect: 'manual', ...init, headers: { 'User-Agent': 'Gigxomi-IndexNow/1.0', ...init.headers }, signal: AbortSignal.timeout(15000) });
  const reader = response.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4 * 1024 * 1024) { await reader.cancel(); throw Error('response_too_large'); }
    chunks.push(value);
  }
  return { response, body: Buffer.concat(chunks).toString('utf8') };
}

async function main() {
  let previous = { version: 1, pages: {} };
  try {
    previous = JSON.parse(await readFile(stateFile, 'utf8'));
    if (previous.version !== 1 || !previous.pages || typeof previous.pages !== 'object') throw Error('invalid_state');
  } catch (error) { if (error.code !== 'ENOENT') throw Error('state_unreadable'); }
  const sitemap = await request(`${SITE_ORIGIN}/sitemap.xml`);
  if (sitemap.response.status !== 200 || !/xml/i.test(sitemap.response.headers.get('content-type') || '')) throw Error('sitemap_unavailable');
  const urls = sitemapUrls(sitemap.body);
  const fingerprints = new Map();
  const skipped = [];
  let cursor = 0;
  async function inspect() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        const { response, body } = await request(url);
        if (response.status !== 200 || !/text\/html/i.test(response.headers.get('content-type') || '')) throw Error(`page_http_${response.status}`);
        fingerprints.set(url, inspectIndexablePage(url, body, response.headers));
      } catch (error) {
        skipped.push({ url, reason: /^[a-z0-9_]+$/.test(error.message) ? error.message : 'page_unavailable' });
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, inspect));
  const changed = [...fingerprints].filter(([url, hash]) => args.includes('--all') || previous.pages[url]?.hash !== hash);
  console.log(JSON.stringify({ mode: submit ? 'submit' : 'dry-run', sitemapUrls: urls.length, eligible: fingerprints.size, changed: changed.length, skipped }));
  if (!changed.length || !submit) return;
  const proof = await request(KEY_URL);
  if (proof.response.status !== 200 || proof.body.trim() !== INDEXNOW_KEY) throw Error('ownership_file_not_verified');
  const result = await request(INDEXNOW_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: new URL(SITE_ORIGIN).host, key: INDEXNOW_KEY, keyLocation: KEY_URL, urlList: changed.map(([url]) => url) }) });
  const outcome = submissionResult(result.response.status);
  const submittedAt = new Date().toISOString();
  for (const [url, hash] of changed) previous.pages[url] = { hash, submittedAt, outcome };
  // A temporarily incomplete sitemap is NOT evidence of deletion. Never auto-submit removals.
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
  const temporary = `${stateFile}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(previous), { mode: 0o600, flag: 'wx' });
  await rename(temporary, stateFile);
  console.log(JSON.stringify({ endpoint: INDEXNOW_ENDPOINT, http: result.response.status, submitted: changed.length, outcome, indexed: 'not_confirmed' }));
}
main().catch(error => { console.error(JSON.stringify({ error: /^[a-z0-9_]+$/.test(error.message) ? error.message : 'indexnow_run_failed' })); process.exitCode = 1; });
