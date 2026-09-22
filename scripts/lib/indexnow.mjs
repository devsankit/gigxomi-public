import { createHash } from 'node:crypto';

export const SITE_ORIGIN = 'https://www.gigxomi.com';
// Public ownership proof, not an account credential. The matching file must be live.
export const INDEXNOW_KEY = 'ab3c0b4ca920bc29e14010d22182534ed9ed0926';
export const KEY_URL = `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`;
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const exactPaths = new Set(['/', '/agencies', '/pricing', '/discover', '/freelancers', '/knowledge-base', '/blog', '/contact', '/privacy-policy', '/refund-and-cancellation-policy', '/service-delivery-policy', '/terms-and-conditions', '/disclaimer']);

export function publicIndexUrl(value) {
  try {
    const url = new URL(value);
    if (url.origin !== SITE_ORIGIN || url.username || url.password || url.search || url.hash || /[%\\]/.test(url.pathname)) return null;
    if (!exactPaths.has(url.pathname) && !/^\/(blog|knowledge-base|services|agency)\/[a-z0-9]+(?:[a-z0-9/-]*[a-z0-9])?$/i.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt);|&#(\d+);|&#x([0-9a-f]+);/gi, (match, decimal, hex) => {
    if (decimal || hex) {
      const code = parseInt(decimal || hex, decimal ? 10 : 16);
      return code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' })[match.toLowerCase()] || match;
  });
}

export function sitemapUrls(xml) {
  if (!/<urlset\b/i.test(xml) || !/<\/urlset>\s*$/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw Error('invalid_sitemap');
  const found = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => publicIndexUrl(decode(m[1].trim())));
  if (!found.length || found.length > 10000 || found.some(url => !url)) throw Error('unsafe_or_empty_sitemap');
  return [...new Set(found)];
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? decode(match[2]) : '';
}

export function inspectIndexablePage(url, html, headers = new Headers()) {
  if (!publicIndexUrl(url)) throw Error('private_or_foreign_url');
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]);
  const directives = [headers.get('x-robots-tag') || '', ...meta.filter(tag => /^(robots|bingbot|googlebot)$/i.test(attr(tag, 'name'))).map(tag => attr(tag, 'content'))].join(',');
  if (/\b(noindex|none)\b/i.test(directives)) throw Error('noindex_page');
  const canonicals = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).filter(tag => attr(tag, 'rel').split(/\s+/).includes('canonical')).map(tag => attr(tag, 'href'));
  if (canonicals.length !== 1 || publicIndexUrl(canonicals[0]) !== url) throw Error('canonical_mismatch');
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const description = meta.find(tag => attr(tag, 'name').toLowerCase() === 'description');
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (!title || !description || !main || !/<h1\b/i.test(main)) throw Error('incomplete_public_page');
  const text = value => decode(value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  const schemas = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => JSON.parse(m[1]));
  return createHash('sha256').update(JSON.stringify([text(title), attr(description, 'content'), text(main), schemas])).digest('hex');
}

export function submissionResult(status) {
  if (status === 200) return 'received';
  if (status === 202) return 'received_key_validation_pending';
  throw Error(`indexnow_http_${status}`);
}
