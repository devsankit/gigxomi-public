import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

test("the public website uses the owned production GTM and GA4 identifiers", () => {
  assert.match(layout, /DEFAULT_GTM_CONTAINER_ID = "GTM-TLDKR5RF"/);
  assert.match(layout, /DEFAULT_GA4_MEASUREMENT_ID = "G-PX8RB59TXB"/);
  assert.doesNotMatch(layout, /GTM-PBM9DFHN|G-15DHCNQCDG/);
});

test("GTM loads after hydration without an artificial interaction or ten-second delay", () => {
  assert.match(layout, /id="gigxomi-gtm" strategy="afterInteractive"/);
  assert.match(layout, /event:'gtm\.js'/);
  assert.doesNotMatch(layout, /pointerdown|w\.setTimeout\(load,10000\)/);
});

test("signed billing return URLs remain excluded from marketing tracking", () => {
  assert.match(layout, /subscription-checkout/);
  assert.match(layout, /mobile\/billing-return/);
  assert.match(layout, /billingPrivacyGuard/);
});
