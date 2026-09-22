import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the main site no longer advertises or indexes /webinar", () => {
  const publicNavigation = [
    "src/components/public/marketing-site-header.tsx",
    "src/components/public/marketing-site-footer.tsx",
    "src/components/public/public-site-footer.tsx",
  ].map(read).join("\n");
  const sitemap = read("src/app/sitemap.ts");
  const homepage = read("src/app/page.tsx");

  assert.doesNotMatch(publicNavigation, /["']\/webinar(?:[#"'])/);
  assert.doesNotMatch(sitemap, /path:\s*["']\/webinar["']/);
  assert.doesNotMatch(homepage, /buildSiteUrl\(["']\/webinar["']\)/);
});

test("legacy webinar and agency-growth routes redirect permanently to app.gigxomi.com/signup", () => {
  const webinarPage = read("src/app/webinar/page.tsx");
  const growthPage = read("src/app/agency-growth/page.tsx");

  assert.match(webinarPage, /permanentRedirect\(["']https:\/\/app\.gigxomi\.com\/signup["']\)/);
  assert.match(growthPage, /permanentRedirect\(["']https:\/\/app\.gigxomi\.com\/signup["']\)/);
});

test("public calls to action target direct Google signup or internal guides without webinar links", () => {
  const surfaces = [
    "src/app/agencies/page.tsx",
    "src/app/blog/[slug]/page.tsx",
    "src/app/pricing/page.tsx",
    "src/components/public/freelancer-registration-landing.tsx",
    "src/components/public/homepage-brand-sections.tsx",
    "src/components/public/marketing-landing-pages.tsx",
    "src/components/public/prompt-matcher.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(surfaces, /(?:href|ctaHref)=["']\/webinar/);
  assert.doesNotMatch(surfaces, /https:\/\/ankit\.gigxomi\.com\//);
  assert.match(surfaces, /https:\/\/app\.gigxomi\.com\/signup/);
});
