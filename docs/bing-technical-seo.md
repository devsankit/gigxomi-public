# Bing indexing and technical SEO

## Scope

Canonical public site: `https://www.gigxomi.com`. WordPress remains the editor;
published articles live under `/blog/` on the main site. Do not submit the
WordPress admin, duplicate WordPress URLs, account pages, CRM, chat, checkout,
preview, query-string URLs, or unapproved marketplace content.

## IndexNow

`npm run seo:indexnow` is read-only dry-run. `npm run seo:indexnow -- --submit`
verifies the live ownership text file and submits eligible changed URLs.
`--all` intentionally resubmits the eligible set; not for routine use.

The six-hour systemd timer checks the public sitemap and public HTML with four
concurrent requests. Fingerprints include title, description, visible main
content and structured data, not tracking scripts. Every URL must return 200,
have a matching canonical and contain no noindex directive. Failed pages are
skipped for retry on the next run. No URL is automatically reported as deleted
when a source temporarily disappears from the sitemap.

The key in `public/ab3c0b4ca920bc29e14010d22182534ed9ed0926.txt` is a public
ownership proof, not a Bing login/API credential. State is kept separately in
`.gigxomi/indexnow-state.json`. A process lock prevents overlapping production
runs. The job has no access-token dependency and imports no messaging store.

HTTP 200 means the submission was received; 202 means received with ownership
validation pending. Neither confirms crawling, indexing, ranking or AI citation.
Submission errors never update the accepted fingerprint. Do not repeatedly
resubmit unchanged pages to try to influence rank.

Operations: `systemctl status gigxomi-indexnow.timer`,
`journalctl -u gigxomi-indexnow.service -n 30 --no-pager`.
Disable only this job with `systemctl disable --now gigxomi-indexnow.timer`.
No app/webhook restart is needed for indexing troubleshooting.

## Bing Webmaster Tools

Use the owner's account and the verified main-domain property. Submit
`https://www.gigxomi.com/sitemap.xml`; do not create a second canonical version
on the non-www host. Check Sitemaps, URL Inspection, Search Performance and AI
Performance. Bing may take time to populate a newly added property. `ankit`
is a separate host and needs its own canonical sitemap; it is not submitted by
this main-site IndexNow job.

## Technical changes

- Homepage structured data connects Organization, WebSite and SoftwareApplication
  using consistent identities. No invented ratings, reviews or geographic claims.
- Default portfolio titles include the visible owner. Authored SEO titles remain
  unchanged. Same-owner duplicate portfolio content needs human review; changing
  a title is not a replacement for unique content or a justified canonical decision.
- WordPress Yoast search title and description are sanitized and used for metadata;
  the visible article heading remains its editorial title.
- WordPress pagination includes pages after the first 100 posts. Draft, scheduled,
  password-protected and Yoast-noindex posts stay excluded.
- Editorial methodology no longer claims to change whenever an unrelated post changes.
- The deployment audit checks duplicate sitemap URLs, invalid/future dates,
  noindex headers, descriptions, H1s and JSON-LD syntax as well as canonical links.

Tests: `npm run test:seo`, `npm run seo:audit`. Continue the existing messaging,
CAPI, lint, TypeScript, production-build and database gates before publication.

## Success measures

Track indexed canonical URLs, relevant non-branded queries, qualified enquiry
conversions and revenue. Review duplicate portfolios and build useful service,
pricing, comparison and case-study content. No provider guarantees top positions
for every keyword. SEO is separate from Meta conversion measurement.

References: https://www.indexnow.org/documentation and
https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
