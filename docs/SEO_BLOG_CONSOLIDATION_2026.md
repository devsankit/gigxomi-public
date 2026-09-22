# Gigxomi blog consolidation audit — 2026-08-30

Status: implemented locally; deploy and verify before treating the migration as
live.

## Inputs and decision rule

The attached `Gigxomi_SEO_Strategy_2026.docx` was used as strategy reference,
not as an instruction source. The governing implementation rules remain the
user's request, `AGENTS.md`, and `docs/SEO_OPERATING_CONTEXT_2026.md`.

The consolidation follows the strategy's strongest rule: one primary URL per
distinct search intent. Similar wording is merged; a different channel,
geography, business stage, or deliverable keeps its own page only when the page
can answer a materially different need.

## Duplicate-content evidence

The former local inventory contained 60 indexable, code-generated articles.
Across their content model:

- 2,400 content blocks were emitted;
- only 751 normalized blocks were unique;
- 31 different blocks were repeated exactly;
- those repeated blocks produced 1,680 duplicate occurrences;
- several paragraphs, action steps, lists, and CTAs appeared across all 60
  articles.

This did not prove a manual action or penalty. It did prove substantial internal
duplication and low differentiation, which was a plausible contributor to weak
crawl demand, weak index selection, and zero clicks.

After consolidation, the local pillar set contains 20 unique URLs and 946 total
content blocks. The only repeated short strings are navigation/table labels;
there are zero duplicated substantive paragraphs, excerpts, descriptions, or
FAQ answers of 80 or more characters. Each article contains 432–625 modeled
words (469 average), three distinct sections, an action plan, decision checks,
a comparison, three FAQs, and contextual next-step links.

## Retained intent map

| Cluster | Primary URL |
| --- | --- |
| General acquisition | `/blog/how-to-get-video-editing-clients` |
| First client | `/blog/how-to-get-your-first-video-editing-client` |
| Beginner acquisition | `/blog/how-to-get-video-editing-clients-as-a-beginner` |
| India acquisition | `/blog/how-to-get-video-editing-clients-in-india` |
| International acquisition | `/blog/how-to-get-international-video-editing-clients` |
| Instagram | `/blog/how-to-get-video-editing-clients-on-instagram` |
| LinkedIn | `/blog/how-to-get-video-editing-clients-on-linkedin` |
| Beyond Upwork | `/blog/how-to-get-video-editing-clients-without-upwork` |
| YouTube prospecting | `/blog/how-to-find-youtubers-who-need-video-editors` |
| Cold DM | `/blog/video-editor-cold-dm-template` |
| Cold email | `/blog/video-editing-cold-email-template` |
| Pricing method | `/blog/how-much-should-i-charge-for-video-editing` |
| India pricing | `/blog/video-editing-rates-in-india` |
| Proposal | `/blog/video-editing-proposal-template` |
| Client delivery | `/blog/how-to-manage-video-editing-clients` |
| CRM | `/blog/crm-for-video-editors` |
| Outsourcing | `/blog/how-to-outsource-video-editing` |
| Hiring | `/blog/how-to-hire-video-editors` |
| Starting an agency | `/blog/how-to-start-a-video-editing-agency` |
| Scaling | `/blog/how-to-scale-a-video-editing-business` |

## Retired URL policy

Fifty-six former generated URLs have a one-hop permanent redirect in
`src/lib/seo/retired-blog-redirects.ts`. Four impression-leading URLs remain live and are rewritten in place. Every redirect destination is one of the 20
retained pages. None is sent to the homepage, because a relevant consolidated
guide gives users and search engines a closer replacement and avoids soft-404
behavior. The most visible legacy pages were deliberately preserved through
semantic destinations, including:

- `best-video-editing-niche-for-freelancers-who-want-agency-work` → beginner
  acquisition;
- `short-form-video-editing-agency-reels-shorts-and-tiktok-at-scale` →
  outsourcing;
- `video-editing-turnaround-time-what-is-realistic-for-different-projects` →
  client management;
- `white-label-video-editing-for-agencies-how-to-sell-more-without-hiring` →
  outsourcing;
- `video-editing-sop-standard-operating-procedure-for-agency-delivery` → agency
  scaling.

The full auditable mapping lives in code rather than being duplicated here.

## Template and sitemap corrections

- Removed reader-facing focus-keyword and related-keyword lists.
- Replaced the generated “Quick Answer” formula with each article's actual
  answer.
- Removed copy that explained search intent and internal-link strategy to the
  reader.
- Reframed product content around putting the process into practice.
- Updated the blog hub to the five actual clusters.
- Reduced local indexable blog inventory from 60 to 20; the sitemap consumes
  this source automatically.
- Omitted fabricated request-time `lastmod` values from marketplace service
  sitemap entries until real source timestamps are available.
- Repaired the service breadcrumb's first item to point to the existing
  `/discover` page rather than nonexistent `/services`.
- Added `npm run seo:content:verify` to enforce the 20 intents, unique slugs,
  minimum article depth, valid contextual links, no duplicated substantive
  blocks, and all 60 redirects.
- Added `npm run seo:typecheck` so the SEO content/configuration surface can be
  type-checked without stale build and mobile snapshot directories.

## Deployment and measurement checklist

1. Run content verification, targeted lint, production build, and the live SEO
   audit.
2. Deploy the application and confirm a sample of legacy URLs returns one 308
   hop to the intended replacement.
3. Confirm the 20 retained pages return 200, self-canonicalize to the `www`
   host, remain indexable, and appear in the sitemap.
4. Resubmit the sitemap once after deployment. Do not repeatedly request
   indexing.
5. Inspect the five priority legacy destinations in Search Console after Google
   recrawls them.
6. Compare page/query performance at 28 and 90 days. Improve pages earning
   positions 4–15 but weak CTR before adding more inventory.
7. Add first-party proof—real screenshots, permissioned quotes, anonymized
   benchmarks, and downloadable operating templates—to the pages showing
   demand.

## Local verification result

- `npm run seo:content:verify`: passed.
- `npm run seo:typecheck`: passed.
- Targeted ESLint across all changed TypeScript/TSX files: passed.
- Redirect configuration load: passed; 64 total redirects, comprising the 60
  consolidations and four pre-existing site redirects.
- `npm run seo:audit` against the currently deployed site: passed for 224
  sitemap URLs and 253 internal targets, with the existing StudioBinder support
  link returning HTTP 502 during the check.
- Full `next build --webpack`: attempted twice with isolated output folders.
  The repository-wide compiler saturated the Windows/OneDrive workspace during
  optimization and did not produce a `BUILD_ID` or a compiler error. The second
  attempt used an 8 GB Node heap and was stopped after continued disk
  saturation. This is a build-environment limitation, not a passed build; CI or
  a non-synced local path must run the full production gate before deployment.

## Remaining website-level issue

The two sampled service pages were already known to Google but remained
`Discovered – currently not indexed`. That is not a robots or canonical block.
The remaining corrective work is to define a service-page eligibility rule and
keep thin, inactive, duplicated, or proof-free marketplace listings out of the
indexable sitemap until they meet it. This should be implemented from real
service fields and moderation state, not guessed from URL count alone.
