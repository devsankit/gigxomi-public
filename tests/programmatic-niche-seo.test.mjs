import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

async function load(relative, overrides = {}) {
  const source = await readFile(new URL(`../${relative}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", code)(
    (id) => (id in overrides ? overrides[id] : require(id)),
    compiledModule,
    compiledModule.exports
  );
  return compiledModule.exports;
}

test("programmatic niche catalog defines 12 distinct video editing categories with high-quality metadata", async () => {
  const { NICHE_CATEGORIES, getAllNicheSlugs, getNicheBySlug } = await load(
    "src/lib/seo/niche-catalog.ts",
    {
      "@/lib/gigxomi/freelancer-assessment-bank": { EDITOR_CATEGORIES: [] },
      "@/lib/gigxomi/dummy-platform-store": {},
      "@/lib/gigxomi/wordpress-marketplace": {},
    }
  );

  assert.equal(NICHE_CATEGORIES.length, 12, "Must contain exactly 12 programmatic video editing niches");

  const slugs = getAllNicheSlugs();
  assert.equal(new Set(slugs).size, 12, "All 12 niche slugs must be completely unique");

  for (const niche of NICHE_CATEGORIES) {
    assert.ok(niche.slug.length > 5, `Niche slug too short: ${niche.slug}`);
    assert.ok(niche.h1.length > 10, `Niche H1 too short: ${niche.h1}`);
    assert.ok(niche.seoTitle.length > 15, `Niche seoTitle too short: ${niche.seoTitle}`);
    assert.ok(niche.seoDescription.length > 50, `Niche seoDescription too short: ${niche.seoDescription}`);
    assert.ok(niche.targetKeywords.length >= 3, `Niche must have at least 3 target keywords: ${niche.slug}`);
    assert.ok(niche.deliverables.length >= 3, `Niche must have standard deliverables: ${niche.slug}`);
    assert.ok(niche.turnaroundStandard.length > 3, `Niche must have standard turnaround: ${niche.slug}`);
    assert.ok(niche.priceBenchmarkInr.length > 3, `Niche must have INR benchmark: ${niche.slug}`);
    assert.ok(niche.priceBenchmarkUsd.length > 3, `Niche must have USD benchmark: ${niche.slug}`);
    assert.ok(niche.buyerGuide.whatToLookFor.length >= 2, `Niche must have whatToLookFor guide: ${niche.slug}`);
    assert.ok(niche.buyerGuide.commonMistakes.length >= 2, `Niche must have commonMistakes guide: ${niche.slug}`);
    assert.ok(niche.faqs.length >= 2, `Niche must have at least 2 FAQ pairs for AEO: ${niche.slug}`);

    // Verify lookup by slug
    const found = getNicheBySlug(niche.slug);
    assert.equal(found?.slug, niche.slug);
  }
});

test("niche filtering surfaces matching services or falls back gracefully without empty states", async () => {
  const { filterServicesForNiche, getNicheBySlug } = await load(
    "src/lib/seo/niche-catalog.ts",
    {
      "@/lib/gigxomi/freelancer-assessment-bank": { EDITOR_CATEGORIES: [] },
      "@/lib/gigxomi/dummy-platform-store": {},
      "@/lib/gigxomi/wordpress-marketplace": {},
    }
  );

  const sampleServices = [
    {
      slug: "real-estate-walkthrough-edit",
      title: "Real Estate Walkthrough & Drone Footage Edit",
      category: "Video Editing",
      specialty: "Real estate video post production",
      primaryEditorCategory: "Real Estate",
      basePrice: 4500,
      deliveryTime: "2 Days",
    },
    {
      slug: "podcast-episode-multicam",
      title: "Podcast Multi-camera Episode Post Production",
      category: "Video Editing",
      specialty: "Podcast editing",
      primaryEditorCategory: "Podcast/Interview",
      basePrice: 5200,
      deliveryTime: "3 Days",
    },
  ];

  const realEstateNiche = getNicheBySlug("real-estate-video-editing");
  assert.ok(realEstateNiche);
  const reMatched = filterServicesForNiche(sampleServices, realEstateNiche);
  assert.equal(reMatched.length, 1);
  assert.equal(reMatched[0].slug, "real-estate-walkthrough-edit");

  // When no exact match exists, fallback to available video editing services so the page is never blank
  const musicNiche = getNicheBySlug("music-video-editing");
  assert.ok(musicNiche);
  const musicMatched = filterServicesForNiche(sampleServices, musicNiche);
  assert.ok(musicMatched.length > 0, "Fallback must return available video services");
});

test("company knowledge base differentiates sales concierge and customer support lines", async () => {
  const { companyKnowledgeBase } = await load("src/lib/seo/company-knowledge-base.ts");
  assert.equal(companyKnowledgeBase.supportPhone, "+91 99818 07309", "Support phone must be 9981807309");
  assert.equal(companyKnowledgeBase.salesPhone, "+91 99933 28124", "Sales phone must be 9993328124");
  assert.match(companyKnowledgeBase.salesWhatsappUrl, /919993328124/);
});

test("sitemap source includes programmatic niche category routing with high priority", async () => {
  const sitemapSource = await readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
  assert.match(sitemapSource, /getAllNicheSlugs/);
  assert.match(sitemapSource, /\/services\/category/);
  assert.match(sitemapSource, /0\.85/);
});
