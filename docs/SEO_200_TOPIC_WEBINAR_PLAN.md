# Gigxomi 200-topic SEO and webinar plan

Last updated: 2026-08-30
Primary KPI: qualified registrations on `https://ankit.gigxomi.com/#gapp-registration`

## Current publication status

The 20 client-growth pillar articles are written in the local application. They
are not deployed, published, or scheduled on the production website yet. The
200 records in `content/editorial-backlog.json` are an opportunity and research
map, not 200 finished articles.

Publishing 200 new URLs in seven days is deliberately not approved by this
plan. The previous 60 generated pages contained 1,680 exact duplicate
occurrences and coincided with weak crawl selection and zero Search Console
clicks. Repeating that pattern at greater scale would conflict with Gigxomi's
SEO operating policy and Google's people-first/scaled-content guidance.

## Inventory now available

- 20 written canonical pillar/cluster pages covering the supplied keywords.
- 100 existing research opportunities across comparisons, project management,
  review, team operations, and agency operations.
- 100 newly mapped long-tail briefs: exactly five support topics for each of
  the 20 client-growth pillars.
- 200 total records in the editorial backlog, all with unique IDs and slugs.
- One canonical conversion target: `/webinar`, with source, medium, campaign,
  and article-level UTM parameters on blog CTAs.

The 100 new support records are briefs only. Do not represent them as written
articles until original copy, evidence, examples, and editorial review exist.

## Seven-day production sprint

This is a production and validation sprint, not permission to release 200
indexable pages.

| Day | Pillar focus | Required output before publication |
| --- | --- | --- |
| 1 | General clients, first client, beginner | Intent/SERP review, original examples, CTA and metadata QA |
| 2 | India, international, Instagram | Local/cross-border accuracy, proof, CTA and internal-link QA |
| 3 | LinkedIn, beyond Upwork, YouTube | Prospect qualification examples and outreach safety review |
| 4 | Cold DM, cold email, general pricing | Message examples, pricing assumptions, webinar CTA QA |
| 5 | India rates, proposal, client management | Tax/legal caveats, templates, workflow evidence |
| 6 | CRM, outsourcing, hiring | Product accuracy, security, ethical hiring and evidence |
| 7 | Start agency, scale agency | Financial/operational review, full crawl, sitemap, redirects and analytics check |

If the deployment team needs staggered releases, use a maximum of three
reviewed pillars per day during this first week. Supporting briefs remain draft.
After the pillar baseline is indexed and measured, approve no more than two
supporting articles per day—and only when each one answers a distinct intent.

## Article approval gate

Every supporting page must pass all of these checks:

1. Distinct intent: it cannot be answered fully by an existing pillar.
2. Originality: no repeated substantive paragraphs or templated keyword swaps.
3. Evidence: real workflow examples, original templates/calculations,
   screenshots with privacy review, or qualified practitioner input.
4. Accuracy: current primary sources for product, legal, tax, payment, or
   platform claims.
5. Reader outcome: answer first, actionable steps, mistakes, decision criteria,
   and a useful downloadable or reusable asset where appropriate.
6. Conversion: one contextual webinar CTA plus a useful next step; no forced
   CTA in every paragraph.
7. Technical: unique title/description/H1, self-canonical, 200 status,
   indexable only after approval, sitemap inclusion, valid structured data and
   working internal links.
8. Editorial: named author/reviewer, truthful publish/update dates, and a final
   language/readability pass.

## Webinar measurement

Track at minimum:

- organic landing sessions by article and cluster;
- blog-to-webinar click-through rate;
- webinar landing-to-registration conversion rate;
- qualified registrations and attended registrations;
- assisted signups after the webinar;
- Search Console impressions, clicks, CTR and position for retained pages;
- pages discovered, crawled, indexed, excluded, merged, or redirected.

Do not use published URL count as the primary KPI. A page that earns no relevant
impressions, clicks, registrations, or useful assisted conversions should be
improved, merged, or retired rather than duplicated.

## Source of truth

- Pillar content: `src/lib/seo/growth-pillar-posts.ts`
- Supporting and research map: `content/editorial-backlog.json`
- Content regression gate: `npm run seo:content:verify`
- Durable SEO decisions: `docs/SEO_OPERATING_CONTEXT_2026.md`
