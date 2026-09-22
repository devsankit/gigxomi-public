import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";

const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
const blogNginx = readFileSync(new URL("../infra/nginx/blog.gigxomi.com.conf", import.meta.url), "utf8");
const wpFunctions = readFileSync(new URL("../wordpress/gigxomi-headless/functions.php", import.meta.url), "utf8");

test("Next.js configuration includes 301 redirects for legacy marketplace and GSC 404/5xx endpoints", () => {
  // Service routes
  assert.match(nextConfig, /source:\s*"\/service"/);
  assert.match(nextConfig, /destination:\s*"\/discover"/);
  assert.match(nextConfig, /source:\s*"\/services"/);
  assert.match(nextConfig, /source:\s*"\/service\/:slug\+"/);
  assert.match(nextConfig, /destination:\s*"\/services\/:slug\+"/);

  // Freelancer directory and legacy dashboard
  assert.match(nextConfig, /source:\s*"\/freelancers\/:slug\+"/);
  assert.match(nextConfig, /source:\s*"\/freelancer-dashboard\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/become-seller\/:path\*"/);

  // E-commerce and marketplace taxonomy
  assert.match(nextConfig, /source:\s*"\/projects\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/employer\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/service-tag\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/service-category\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/product-category\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/shop\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/tag\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/cart\/:path\*"/);

  // Support, auth, legal, and theme remnants
  assert.match(nextConfig, /source:\s*"\/register\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/help\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/faq\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/messages\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/refund-cancellation-policy\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/privacy-policy-2\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/apus_header\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/sample-page\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/search\/:path\*"/);
  assert.match(nextConfig, /source:\s*"\/100"/);
  assert.match(nextConfig, /source:\s*"\/5"/);
});

test("blog.gigxomi.com Nginx configuration intercepts legacy service, freelancer, and tag URLs at the edge", () => {
  assert.match(blogNginx, /location \^~ \/service\/ \{\s*rewrite \^\/service\/\(\.\*\)\$ https:\/\/www\.gigxomi\.com\/services\/\$1 permanent;/);
  assert.match(blogNginx, /location = \/service \{\s*return 301 https:\/\/www\.gigxomi\.com\/discover;/);
  assert.match(blogNginx, /location \^~ \/services\/ \{\s*return 301 https:\/\/www\.gigxomi\.com\/discover;/);
  assert.match(blogNginx, /location = \/services \{\s*return 301 https:\/\/www\.gigxomi\.com\/discover;/);
  assert.match(blogNginx, /location \^~ \/freelancer\/ \{\s*return 301 https:\/\/www\.gigxomi\.com\/freelancers;/);
  assert.match(blogNginx, /location = \/freelancer \{\s*return 301 https:\/\/www\.gigxomi\.com\/freelancers;/);
  assert.match(blogNginx, /location = \/home \{\s*return 301 https:\/\/www\.gigxomi\.com\/;/);
  assert.match(blogNginx, /location \^~ \/tag\/ \{\s*return 301 https:\/\/www\.gigxomi\.com\/blog;/);
  assert.match(blogNginx, /location = \/tag \{\s*return 301 https:\/\/www\.gigxomi\.com\/blog;/);
});

test("WordPress headless theme functions.php contains safety net redirects for legacy marketplace URLs and tags", () => {
  assert.match(wpFunctions, /preg_match\('#\^\/service\(\?:\/\(\.\*\)\)\?\$#i', \$request_path, \$matches\)/);
  assert.match(wpFunctions, /preg_match\('#\^\/services\(\?:\/\(\.\*\)\)\?\$#i', \$request_path, \$matches\)/);
  assert.match(wpFunctions, /preg_match\('#\^\/freelancer\(\?:\/\.\*\)\?\$#i', \$request_path\)/);
  assert.match(wpFunctions, /preg_match\('#\^\/home\/\?\$#i', \$request_path\)/);
  assert.match(wpFunctions, /preg_match\('#\^\/tag\(\?:\/\.\*\)\?\$#i', \$request_path\)/);
  assert.match(wpFunctions, /wpseo_sitemap_exclude_taxonomy/);
});

test("legacy freelancer catch-all page exists and protects internal dashboard routes", () => {
  const pagePath = new URL("../src/app/freelancer/[...legacySlug]/page.tsx", import.meta.url);
  assert.ok(existsSync(pagePath), "src/app/freelancer/[...legacySlug]/page.tsx must exist");
  const content = readFileSync(pagePath, "utf8");
  assert.match(content, /permanentRedirect\("\/freelancers"\)/);
  assert.match(content, /KNOWN_FREELANCER_INTERNAL_ROUTES/);
  assert.match(content, /notFound\(\)/);
});
