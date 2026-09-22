import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync(new URL("../infra/nginx/blog.gigxomi.com.conf", import.meta.url), "utf8");

for (const path of ["/privacy-policy-2", "/privacy-policy-2/"]) {
  test(`retired privacy URL ${path} permanently redirects to the public policy`, () => {
    const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(config, new RegExp(`location = ${escaped}\\s*\\{\\s*return 301 https://gigxomi\\.com/privacy-policy;\\s*\\}`));
  });
}

test("the privacy redirect leaves normal WordPress routes intact", () => {
  assert.match(config, /location \/\s*\{\s*try_files \$uri \$uri\/ \/index\.php\?\$args;\s*\}/);
  assert.match(config, /server_name blog\.gigxomi\.com;/);
});
