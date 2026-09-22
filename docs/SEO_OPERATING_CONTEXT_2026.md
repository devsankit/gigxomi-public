# Gigxomi SEO operating context and audit

Last evidence refresh: 2026-08-30
Primary site: <https://www.gigxomi.com>
Search Console property: `sc-domain:gigxomi.com` (owner access, read-only tools)
Analytics property: `properties/535071985`

This is the durable starting point for future Gigxomi SEO work. Update the
evidence log and decision register instead of creating a separate strategy from
scratch.

## Executive diagnosis

Gigxomi does not have a site-wide crawl block. Google has crawled and indexed
the home page, blog hub, pricing page, About page, and sampled blog articles.
The current problem is a combination of partial indexing and weak organic
performance:

- The submitted sitemap contains 224 URLs, while its Search Console summary
  reports 0 indexed. That aggregate is inconsistent with URL Inspection and
  public Google results, so it must not be interpreted as literal zero
  indexing.
- Two sampled marketplace service pages are `Discovered - currently not
  indexed`. Google knows the URLs from the sitemap and internal links but has
  not chosen to crawl them yet.
- Search Console recorded 344 impressions, 0 clicks, 0% CTR, and average
  position 16.31 for 2026-08-02 through 2026-08-29.
- Blog URLs accounted for 212 of those impressions, with average position
  11.67 and 0 clicks.
- GA4 recorded 5 Organic Search sessions and 3 organic users over the latest
  90-day window, with 1 engaged session (20% engagement rate). GA4 and Search
  Console measure different things; do not use Analytics zeros to infer
  indexing.

The immediate priority is not “get more URLs into Google.” It is to improve the
quality and crawl demand of the URLs already published, repair sitemap freshness
signals, consolidate near-duplicate content, and earn clicks and trust.

## Evidence snapshot

### What is working

- `https://gigxomi.com/` permanently redirects to
  `https://www.gigxomi.com/` with HTTP 301.
- The canonical host returns HTTP 200.
- `robots.txt` returns HTTP 200, allows public crawling, blocks `/api/`, and
  declares the canonical sitemap.
- `sitemap.xml` returns HTTP 200 and valid XML.
- Search Console downloaded the sitemap on 2026-08-29 with 0 parsing errors and
  0 warnings.
- Home URL Inspection: `Submitted and indexed`, fetch successful, robots
  allowed, canonical selected correctly, last crawl 2026-08-30, mobile crawler.
- Blog hub URL Inspection: `Submitted and indexed`, canonical selected
  correctly, last crawl 2026-08-27.
- Sample article URL Inspection: `Submitted and indexed`, canonical selected
  correctly, last crawl 2026-08-18.
- Pricing URL Inspection: `Submitted and indexed`, canonical selected
  correctly, last crawl 2026-08-25.
- About URL Inspection: `Submitted and indexed`, canonical selected correctly,
  last crawl 2026-08-29.
- Public pages inspected from live HTML have unique titles, descriptions, one
  visible H1, self-referencing canonicals, and `index, follow` directives.
- Server-rendered main content is visible without relying on client-side
  interaction.
- `npm run seo:audit` passed on 2026-08-30: 224 sitemap URLs, 253 internal
  targets, and one external-link warning.

### What is wrong or risky

#### P0 — inaccurate service-page `lastmod` values

All 122 service URLs in the live sitemap received a `lastmod` timestamp from the
time the sitemap was generated on 2026-08-30. The mapper in
`src/lib/gigxomi/wordpress-marketplace.ts` currently assigns both `createdAt`
and `updatedAt` using `new Date().toISOString()` for every mapped service.

This tells crawlers that every service changed on every sitemap regeneration.
Google says `lastmod` should represent the last significant content update and
uses it only when it is consistently accurate. This signal can therefore become
ignored and can waste crawl attention.

Required fix: map real WordPress/service timestamps. If a trustworthy timestamp
is unavailable, omit `lastmod`; never fabricate the current request time.

#### P0 — too much low-differentiation inventory for a young domain

The live sitemap composition is:

| URL type | Count |
| --- | ---: |
| Marketplace service | 122 |
| Blog article | 74 |
| Public/core | 12 |
| Knowledge-base article | 11 |
| Agency profile | 3 |
| Blog hub | 1 |
| Home | 1 |

The two sampled service URLs were both `Discovered - currently not indexed`.
This is consistent with a crawl-demand and quality-selection problem: Google has
the URLs but is not prioritizing them.

Required fix: include only index-worthy service profiles in the sitemap. A
service becomes index-worthy when it has a real approved owner, a distinct and
complete description, original portfolio evidence, clear price/scope/delivery
details, and enough information to satisfy the query without merely forwarding
the visitor elsewhere. Keep thin or dormant profiles accessible to users but
`noindex` them until they meet the threshold.

#### P0 — template-scaled editorial content

`src/lib/seo/blog-posts.ts` generates up to 200 posts from seeds. Sixty current
indexable articles share the same 2026-07-09 timestamp and reuse the same section
structure, workflow paragraphs, action steps, comparison table, FAQs, and CTA,
with keywords substituted into repeated prose.

The rendered pages expose search-engine-facing language to users, including
phrases such as “SEO intent,” “Focus keyword,” “Related searches,” and “Those
internal links are not filler.” Several generated sentences also have grammar
problems. This makes the pages feel built for search rather than for readers.

Google's current spam policy defines scaled content abuse as creating many
largely unoriginal pages for ranking rather than helping users. The site is not
automatically in violation merely because code generated the pages, but this
implementation is close enough to the risk pattern that expansion must stop.

Required actions:

1. Freeze new seed-generated articles.
2. Export page-level Search Console performance and group the 60 pages by
   impressions, business relevance, and overlap.
3. Select roughly 10–15 pages with real demand or strategic value for complete
   expert rewrites.
4. Add first-party evidence: screenshots of real workflows, anonymized outcome
   data, editor/client quotes with permission, original templates, calculations,
   and named expert review.
5. Merge overlapping pages into a smaller set of strong pillars. Use 301
   redirects when removing a URL that has signals or inbound links.
6. `noindex` weak pages only after mapping their replacement and checking
   impressions/backlinks. Do not bulk-delete blindly.
7. Remove “SEO intent,” “focus keyword,” keyword lists, and internal SEO
   commentary from the reader-facing article template.

#### P0 — visibility without clicks

The site received impressions but no Search Console clicks in the latest
28-day period. Some pages briefly appeared in the top 10, so indexing alone will
not solve the business problem.

Required fix: for each page with impressions, compare the exact query intent,
SERP format, title, description, and opening answer. Prioritize pages already at
positions 4–15. Rewrite snippets to promise a concrete, credible outcome and
make the page deliver that outcome immediately.

#### P1 — sitemap reporting is not segmented

Search Console's sitemap row shows 224 submitted and 0 indexed even though URL
Inspection confirms indexed pages. The count may be delayed or attributed
incorrectly, but a single sitemap makes diagnosis harder.

Required fix: after reducing inventory, use separate sitemap files or a sitemap
index for core pages, editorial pages, marketplace services, agencies, and the
knowledge base. Split for measurement, not because 224 URLs exceed any technical
limit. Submit only canonical, 200-status, indexable URLs.

Google ignores sitemap `priority` and `changefreq`; do not spend time tuning
those values.

#### P1 — topical breadth is ahead of demonstrated authority

Gigxomi currently targets software, hiring, freelancer careers, production
operations, service marketplaces, and many format/audience combinations. The
first reel's topical-map idea is useful, but topical authority is not achieved by
publishing every keyword permutation.

Required fix: concentrate on the area Gigxomi can prove uniquely:

- running a video-editing business from enquiry to payout;
- WhatsApp/Instagram lead handling for editing businesses;
- briefs, assignment, manager review, delivery, accounting, and payouts;
- editor readiness and agency quality-control systems;
- India-specific operating lessons supported by real Gigxomi experience.

Build one authoritative hub per real decision, with supporting content only
when it answers a distinct user need.

#### P1 — weak authorship and first-hand experience signals

“Gigxomi Editorial” and an editorial methodology page are a start, but the
template articles do not show enough named practitioner input, original
research, dated revision notes, or proof that the recommendations were used in
real production.

Required fix: add named author/reviewer profiles, relevant experience, what was
tested, source citations, change logs for material updates, and first-party
examples. Do not change dates unless the main content changed significantly.

#### P1 — marketplace quality and trust governance

Marketplace/service pages are user-generated commercial inventory. A page
should not be indexable merely because it exists or is marked “Approved.” Add an
SEO eligibility state based on profile completeness, originality, moderation,
portfolio proof, and activity. Qualify untrusted external links with
`rel="ugc nofollow"` as appropriate.

#### P1 — breadcrumb rich-result item is unnamed

Search Console detected Breadcrumb structured data but described the item as
“Unnamed item” on inspected pages. Validate the rendered JSON-LD and ensure each
`ListItem` has `position`, `name`, and `item` where required.

#### P1 — canonical host history needs monitoring

Search performance still reports impressions separately for
`https://gigxomi.com/` and `https://www.gigxomi.com/`. The 301 and current
canonicals are correct, so this is not an emergency. Continue using only `www`
in internal links, structured data, sitemap URLs, social URLs, and new backlinks.

#### P2 — external reference health

The local SEO audit found one review item: `https://support.studiobinder.com/`
returned HTTP 502 when linked from the StudioBinder comparison article. Recheck
and replace with a stable official source if it remains unavailable.

#### P2 — Core Web Vitals evidence is still pending

The PageSpeed API quota was unavailable during this audit, and URL Inspection
returned `VERDICT_UNSPECIFIED` for mobile usability. Do not claim the site passes
or fails Core Web Vitals without field data.

Next check: Search Console Core Web Vitals/CrUX plus mobile Lighthouse for the
home page, blog hub, one article, one service page, and pricing. Target the
official “good” thresholds: LCP at most 2.5 s, INP under 200 ms, CLS under 0.1 at
the 75th percentile.

## Lessons extracted from the supplied Facebook videos

### Reel 1 — website not ranking

Source: <https://www.facebook.com/share/v/1Hx6PhzPHd/>
Resolved reel: `1266910191937428`
Creator shown: Ghulam Ali - GM
Duration reviewed: approximately 8:13

The useful framework visible across the full reel is:

1. Inspect Search Console crawl behavior and compare low-crawl and high-crawl
   sites.
2. Check technical and internal duplicate-content problems.
3. Audit keywords and the actual competing SERPs.
4. Create a topical map around a real main topic and supporting needs.
5. Audit content for external duplication, quality, semantic coverage,
   user-first writing, completeness, language quality, and clarity.
6. Audit on-page elements such as the title and primary query alignment.
7. Compare referring domains and backlinks against real competitors.

What to adopt: the sequence and evidence-first mindset.
What to avoid: treating topical maps, semantic terms, or backlinks as a
substitute for original value.

### Reel 2 — “91 DR free backlink” from Imgur

Source: <https://www.facebook.com/share/v/1D4HX7Ybr9/>
Resolved reel: `1685453362515455`
Creator shown: Hridoy Reh
Duration reviewed: approximately 16 seconds

The reel promotes an Imgur user-content link based on third-party metrics: DR
91, large backlink count, and high traffic.

Decision: do not make this a Gigxomi SEO tactic. “DR” is a third-party metric,
not evidence that a user-created Imgur link will transfer useful ranking value.
UGC platforms commonly qualify outbound links, and Google treats artificial
links created mainly to manipulate rankings as link spam or neutralizes them.

Backlinks worth pursuing instead:

- earned citations to original Gigxomi data or tools;
- founder interviews and expert commentary in editing/business publications;
- partner and integration documentation where the relationship is real;
- high-quality case studies that clients, editors, and agencies naturally cite;
- useful public templates, calculators, benchmarks, and research;
- accurate profiles in relevant industry associations/directories, without
  bulk automation or keyword-stuffed anchors.

## 2026 SEO principles for this project

1. Crawlable and indexable are necessary, not sufficient. Google does not
   guarantee indexing.
2. Search and Google's generative features use the same foundational quality
   systems. There is no separate “GEO hack.”
3. Create non-commodity, people-first content with original experience and
   evidence.
4. Reduce duplicate and near-duplicate pages instead of multiplying query
   variants.
5. Use server-rendered titles, descriptions, canonical tags, crawlable links,
   and meaningful HTML.
6. Sitemaps should list canonical URLs worth indexing and use truthful
   `lastmod` values.
7. Structured data must match visible page content; it does not make weak pages
   rank.
8. Core Web Vitals and overall page experience support success but do not
   replace relevance and quality.
9. Build links because the source and relationship are valuable, not because a
   tool reports high domain authority.
10. Measure impressions, clicks, qualified visits, leads, and signups—not raw
    indexed-page count.

## Prioritized implementation backlog

### Phase 1 — next deployment

- [x] Omit request-time service `lastmod` values until real source dates are
  available.
- [ ] Define and implement service-page SEO eligibility; remove ineligible
  service URLs from the sitemap and serve `noindex, follow` on those pages.
- [x] Replace the seed-generated local blog set with the 20 approved intent
  pages.
- [x] Remove reader-facing SEO scaffolding (“focus keyword,” generated quick
  answer, and internal SEO commentary).
- [x] Repair the service breadcrumb parent to use the existing `/discover`
  page; production JSON-LD validation remains a post-deployment check.
- [ ] Recheck the StudioBinder external link warning.
- [ ] Extend the SEO audit to fail on future `lastmod`, sitemap/index directive
  conflicts, missing breadcrumb names, duplicate titles/descriptions, and high
  exact-paragraph reuse.

### Phase 2 — editorial consolidation

- [x] Export GSC data by page and query for the available 28-day baseline.
- [x] Consolidate the 60 local generated articles into 20 distinct user intents
  and map all retired URLs to relevant replacements. WordPress editorial
  comparisons remain separate and unchanged.
- [x] Replace all 20 retained local articles with distinct, reader-first copy.
- [ ] Build 3–5 first-party assets: agency workflow template, editing brief,
  revision/QC checklist, pricing calculator/benchmark, and anonymized operations
  benchmark.
- [ ] Create credible author and reviewer pages.
- [ ] Add contextual internal links based on the reader's next decision, not a
  fixed template.

### Phase 3 — authority and conversion

- [ ] Run digital PR around original Gigxomi research and tools.
- [ ] Earn relevant partner, association, podcast, and editorial mentions.
- [ ] Improve titles/descriptions for pages at positions 4–15 with zero CTR.
- [ ] Tie organic landing pages to meaningful CTA and signup events in GA4.
- [ ] Review Search Console Core Web Vitals and improve failing templates.

## Measurement scorecard

Record every 28 days:

| Metric | Baseline (2026-08-29) | Target direction |
| --- | ---: | --- |
| GSC impressions | 344 | Up on retained high-quality pages |
| GSC clicks | 0 | First consistent qualified clicks |
| GSC CTR | 0% | Improve query/page fit and snippets |
| Average position | 16.31 | Improve for priority non-brand queries |
| Blog impressions | 212 | Concentrate on rewritten pillars |
| Blog average position | 11.67 | Move priority pages into stable top 10 |
| GA4 organic sessions (90d) | 5 | Grow qualified traffic |
| GA4 organic engagement rate | 20% | Improve landing-page satisfaction |
| Sitemap submitted | 224 | Reduce to defensible index-worthy set |
| Sample service status | Discovered, not indexed | Eligible profiles crawled/indexed |

Do not set a vanity goal of indexing all 224 current URLs. The goal is a smaller,
better set that earns impressions, clicks, trust, and qualified conversions.

## Future-agent workflow

Before changing SEO code or content:

1. Read this file and `AGENTS.md`.
2. Check `git status` and preserve unrelated work.
3. Query Search Console before assuming crawl, index, or ranking status.
4. Inspect the live URL's status, canonical, robots directive, rendered title,
   description, H1, main content, and structured data.
5. Confirm whether the task affects the protected production messaging surface;
   normal SEO work must not touch it.
6. Prefer improving or consolidating an existing page over creating another
   keyword variation.
7. Run `npm run seo:audit`, relevant tests, lint, and a production build for code
   changes.
8. After deployment, verify HTTP status, rendered metadata, sitemap membership,
   and Search Console results. Do not request indexing repeatedly without a
   substantive change.
9. Append a dated entry below with evidence and decisions.

## Evidence log

### 2026-08-30 — baseline audit

- Reviewed both supplied Facebook reels across their full timelines.
- Read live robots, sitemap, redirects, and representative page metadata.
- Ran the repository SEO audit successfully with one external-link warning.
- Confirmed Search Console owner access and sitemap processing.
- Confirmed indexed core/blog URLs through URL Inspection.
- Confirmed two service URLs as `Discovered - currently not indexed`.
- Read page/query performance and GA4 channel data.
- Identified request-time service `lastmod` generation and template-scaled blog
  content as the highest-risk implementation issues.
- No application code or protected messaging code was changed in this audit.

### 2026-08-30 — blog consolidation implementation (local)

- Treated `Gigxomi_SEO_Strategy_2026.docx` as strategy reference and adopted its
  one-intent-per-primary-URL model.
- Audited 60 indexable local generated articles: 2,400 modeled blocks, 751
  unique blocks, 31 exactly repeated block values, and 1,680 duplicate
  occurrences.
- Replaced that inventory with the 20 approved acquisition, outreach, pricing,
  operations, hiring, and agency-growth intents.
- Verified 20 unique slugs, 432–625 modeled words per article, zero repeated
  substantive content blocks, and valid internal pillar destinations.
- Added 60 one-hop permanent redirects to the closest retained guide; no
  retired article redirects to the homepage.
- Removed reader-facing keyword/search-engine commentary and updated the blog
  hub around the five actual clusters.
- Omitted untrustworthy request-time service `lastmod` values and corrected the
  service breadcrumb parent to `/discover`.
- Added `npm run seo:content:verify` as a regression gate.
- Added and passed `npm run seo:typecheck`; targeted ESLint also passed.
- Re-ran the live `npm run seo:audit`: 224 sitemap URLs and 253 internal
  targets passed, with the existing StudioBinder HTTP 502 warning.
- Full production build was attempted twice with isolated output directories.
  Both attempts stalled during repository-wide optimization under heavy
  Windows/OneDrive disk pressure and produced neither a `BUILD_ID` nor a
  compiler error. Run the full gate in CI or from a non-synced checkout before
  deployment; do not record this as a passing build.
- Full migration detail: `docs/SEO_BLOG_CONSOLIDATION_2026.md`.
- No protected messaging or chat-assignment code was changed.

### 2026-08-30 — webinar conversion and 200-topic production map (local)

- Confirmed that the 20 pillar pages remain local and are not deployed,
  published, or scheduled in production.
- Extended `content/editorial-backlog.json` from 100 to 200 unique research
  topics. The new 100 records provide exactly five long-tail supporting briefs
  for each of the 20 written client-growth pillars.
- Kept all new supporting topics at `supporting-brief`; they are not treated as
  finished or indexable content.
- Set qualified webinar registrations as the campaign KPI and added tracked
  webinar CTAs to the blog hub, every local pillar article, WordPress editorial
  comparisons, the comparison hub, editorial methodology, and the shared
  marketing footer.
- Updated both public footer implementations to show WhatsApp support at
  `+91 99933 28124` and added a floating WhatsApp support entry to the active
  shared marketing footer.
- Did not modify WhatsApp/Instagram webhook, conversation, assignment, or
  protected messaging behavior.
- Added backlog validation to `npm run seo:content:verify`: 200 unique topics,
  100 supporting briefs, valid parent pillars, and exactly five supporting
  briefs per pillar.
- Publication policy: use the seven-day sprint for research, writing, review,
  and at most the 20 validated pillars. Do not bulk-publish 200 indexable URLs.
  Full plan: `docs/SEO_200_TOPIC_WEBINAR_PLAN.md`.
- Created the active seven-run daily heartbeat `Gigxomi SEO 7-day editorial
  sprint`. Each run may draft and validate up to three distinct supporting
  articles but may not publish, deploy, or touch protected messaging code.

### 2026-08-31 — Search appearance and zero-click review

- Search Console's latest complete data was available through 2026-08-29. The
  property earned 347 impressions and zero clicks across its first three
  reporting days (August 27–29), with a weighted average position of about
  11.82.
- Page-level data contained 79 URLs. Pages whose average positions were 4–10
  accounted for 270 impressions, so the zero-click result is not explained
  only by rankings beyond page one.
- Four articles generated 183 of 347 impressions (52.7%): video-editing niche
  (102 impressions, position 8.02), turnaround time (36, 8.61), short-form
  agency (27, 9.30), and white-label editing (18, 7.50).
- URL Inspection confirmed all four leading URLs are submitted and indexed,
  fetch successfully, allow indexing, and have matching Google/user canonicals.
  Their latest indexed crawls ranged from 2026-08-01 to 2026-08-27.
- The live search titles for these leading pages are mechanically shortened
  with a literal ellipsis, and their descriptions reuse the same generic
  `compare pricing signals, workflow questions, quality checks` pattern. This
  weak query-to-snippet alignment is the clearest current CTR issue.
- Only 52 of 347 impressions were exposed in query-level rows because Search
  Console suppresses low-volume queries. Treat page-level evidence as the more
  complete dataset until more query volume accumulates.
- Decision: improve titles and descriptions first on the high-impression URLs,
  then hold them stable for 14 complete days before evaluating CTR. Do not make
  site-wide title changes or judge CTR from one to three days of data.
- Deployment safeguard: the current local consolidation marks all four leading
  URLs for redirects. Do not deploy those redirects unchanged; first preserve
  each proven search intent on the same URL or map it to a substantively
  equivalent destination with an evidence-backed migration plan.
- Sitemap processing remains error-free (224 submitted, zero warnings, zero
  errors). Its aggregate `indexed: 0` field conflicts with URL Inspection and
  performance data, so URL Inspection remains the indexing source of truth.

### 2026-08-31 — Pinterest distribution and 30-day publishing preparation (local)

- Connected the Pinterest v5 sandbox using an environment-only access token
  and verified the `helloankitrathore` business account. The sandbox currently
  has zero boards and cannot create real public Pins.
- Stored only the sandbox token and sandbox API base in the Windows user
  environment; no Pinterest secret or token was committed to the repository.
- Because credentials were exposed in screenshots/chat, reset the app secret
  and replace the token before enabling production publishing.
- Added a guarded Pinterest publisher with status, board, and Pin commands.
  Writes require an explicit `--apply`, canonical Gigxomi blog URLs, and add
  organic Pinterest UTM parameters. Sandbox status and board dry-run passed.
- Created three original 2:3 Pinterest/blog assets for the first three client-
  acquisition pillars and mapped them in
  `content/pinterest-distribution.json`. Pins remain blocked until each article
  is live at its canonical URL and a production Pinterest credential exists.
- Added a 30-day, one-article-per-day operating plan. The one-million-reach
  target is aspirational, not a forecast; quality, indexing, CTR, webinar
  registrations, and channel-attributed visits remain the decision metrics.
- Updated the editorial heartbeat to one verified article per day for 30 days,
  with Pinterest distribution only after the canonical page is live.
- Added a WordPress growth-pillar scheduler and passed its dry run for the first
  three articles. No WordPress post, board, or public Pin was created.
- Made the WordPress bridge category-aware so client-growth guides do not render
  as software comparisons. Growth guides now have distinct metadata, article
  framing, related labels, and a separate blog-hub section.
- Deployment remains blocked until the category-aware rendering passes the
  production gates from a clean checkout. The current working branch contains
  unrelated changes and must not be published as-is.
- No protected messaging, webhook, conversation, or chat-assignment code was
  changed.
- Expanded the 30-day plan into a channel-level one-million-impression model:
  150,000 Google, 750,000 Pinterest, and 100,000 repurposed organic social or
  partner impressions. At the planning CTRs this implies 12,050 website visits
  and about 301 webinar registrations; these are targets, not forecasts.
- Added day 7/14/21/30 pacing checkpoints, Google and Pinterest click-rate
  thresholds, a daily funnel scorecard, and a rule to seek separate approval
  for paid or partner amplification rather than increasing thin content volume.
- Updated the active 30-day heartbeat to measure those channel targets, scale
  winning URLs and Pins, and revise low-CTR creatives after enough impressions.
- Opened the Pinterest Google sign-in flow after user confirmation. Pinterest's
  embedded Google authorization still requires one manual click in the open
  browser; no public account action or Pin was completed in that attempt.
- Created a revocable WordPress application password named `Codex SEO and
  Pinterest Publisher`, stored it in the Windows user environment, and cleared
  the clipboard. No publishing credential was written to the repository.
- Scheduled three WordPress growth guides for 09:30 IST on September 1, 2, and
  3. WordPress returned IDs 13412, 13414, and 13416; all three were verified as
  `future`, with category IDs 1378 and 1380 and distinct featured-media IDs.
- Prepared an isolated release from `origin/main` containing only the four
  category-aware blog rendering files. Targeted lint, editorial verification,
  all 16 SEO tests, TypeScript, and the production build passed. The build used
  the existing database-free pricing fallback while collecting pages.
- Committed the isolated change as `23b1d35e` (`feat(seo): classify WordPress
  growth guides`), pushed `codex/seo-growth-publishing`, and advanced remote
  `main` to that commit, triggering the normal production deployment workflow.
- Pinterest remains unauthenticated in the browser and the available API token
  remains sandbox-only. No board or public Pin has been created; public Pins
  stay blocked until Google sign-in and production access are complete.
- The production workflow completed and the VPS commit marker advanced to full
  commit `23b1d35e1fafc3f0fedd497a02e808709fd37e84`. Post-deploy checks returned
  HTTP 200 for the blog hub and the existing `plutio-vs-gigxomi` comparison,
  preserved its comparison label, and confirmed the canonical
  `https://www.gigxomi.com/blog/plutio-vs-gigxomi`.
- Updated the existing heartbeat to run at 09:45 and 15:45 IST for 30 days (60
  runs): the morning checkpoint verifies the 09:30 article and prepares the
  next one; the afternoon checkpoint distributes the Pin only after the live
  canonical passes. Pinterest's login modal is open for the remaining manual
  Google authorization step.
- Updated `content/pinterest-distribution.json` with WordPress post IDs 13412,
  13414, and 13416 and marked all three articles as `wordpress-scheduled`.

### 2026-09-01 — Supporting cluster and public WhatsApp conversion path

- Added three original supporting articles under the primary
  `/blog/how-to-get-video-editing-clients` pillar: a failed-pipeline diagnosis,
  an online prospect-source guide, and a measurable acquisition-funnel guide.
  Each article links to the pillar, relevant sibling pillars, and the webinar.
- Extended the editorial verifier across the new supporting content. It passed
  for 20 pillars, three written supporting articles, 100 mapped supporting
  briefs, 200 total backlog topics, 253 substantive blocks, and 60 redirects;
  no repeated substantive blocks were detected.
- Scheduled the supporting articles in WordPress for 09:30 IST on September 4,
  5, and 6. WordPress returned IDs 13418, 13420, and 13422 and confirmed all
  three as `future`. Added their featured images and recorded the IDs in the
  Pinterest distribution manifest.
- Kept pillar-to-support links out of the live pillar until each supporting URL
  publishes, avoiding intentional links to 404 pages. The editorial heartbeat
  can add reciprocal links after the canonical URLs pass their live checks.
- Added the public support number `+91 99933 28124` to the shared marketing
  footer and a responsive WhatsApp widget using the direct `wa.me` destination.
  This is a public conversion link only; no webhook, inbox, conversation,
  tenant-routing, or chat-assignment code was changed.
- The isolated WhatsApp release passed targeted and full lint, TypeScript, the
  production build, and all 44 application-stability checks. Local database
  verification could not run because the isolated workspace has no
  `DATABASE_URL`; the release contains no database or schema change and the
  normal production workflow retains database backup, migration, and
  verification gates.
- Pushed the isolated public-footer release to `main` as commit `9c04c92a`,
  then moved the floating control outside the footer's `content-visibility`
  boundary in follow-up commit `48f636e6` after live visual QA exposed that the
  original fixed element rendered near the document footer rather than the
  viewport edge.
- The VPS commit marker advanced to full commit
  `48f636e6cc26358b960ad00ffaa5c821743d6bbb`. The homepage, blog hub, and first
  growth pillar all returned HTTP 200 with the new number and `wa.me` target.
  Browser QA confirmed one desktop widget fixed at bottom-right (168×54 at an
  1280×720 viewport) and one compact mobile widget (48×48 at 390×844).
- Triggered the normal WordPress cron endpoint after the first due post remained
  `future` at 09:30 IST. WordPress changed post 13412 to `publish`; after the
  five-minute frontend cache and new app restart, the canonical URL returned
  HTTP 200 with its article-specific canonical, no `noindex`, its internal
  pillar links, and webinar CTA.
- Production `npm run db:verify` completed after both releases with no missing
  tables and the conversion link ready.
- Diagnosed the missed 09:30 publication as headless WordPress relying only on
  traffic-driven WP-Cron: no system cron/timer existed. Installed
  `/etc/cron.d/gigxomi-wordpress-cron` from
  `infra/cron/gigxomi-wordpress-cron` to call the standard WP-Cron endpoint
  every minute as `www-data`. The server cron service is active and syslog
  confirmed the first scheduled execution at 04:10:01 UTC.

## Primary official references

- Google crawling and indexing overview:
  <https://developers.google.com/search/docs/crawling-indexing>
- How Google Search works:
  <https://developers.google.com/search/docs/fundamentals/how-search-works>
- Sitemap guidance, including accurate `lastmod`:
  <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- Helpful, reliable, people-first content:
  <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>
- Spam policies, including scaled content, doorway abuse, and link spam:
  <https://developers.google.com/search/docs/essentials/spam-policies>
- JavaScript SEO basics:
  <https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics>
- Canonical guidance:
  <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Qualifying UGC, sponsored, and nofollow links:
  <https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links>
- Core Web Vitals:
  <https://developers.google.com/search/docs/appearance/core-web-vitals>
- 2026 guide for generative AI features in Google Search:
  <https://developers.google.com/search/docs/fundamentals/ai-optimization-guide>
