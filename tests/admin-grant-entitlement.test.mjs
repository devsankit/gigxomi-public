import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/lib/billing/entitlement-state.ts", import.meta.url), "utf8");

test("an explicit, expiring owner grant unlocks Agency Premium without fabricating payment", () => {
  assert.match(source, /session\.role === "ADMIN"/);
  assert.match(source, /subscription\.package\.packageType === "AGENCY"/);
  assert.match(source, /subscription\.provider === null/);
  assert.match(source, /subscription\.paymentStatus === "NOT_REQUIRED"/);
  assert.match(source, /subscription\.subscriptionState === "ADMIN_GRANTED"/);
  assert.match(source, /subscription\.autoRenew === false/);
  assert.match(source, /subscription\.expiresAt > now/);
});

test("ordinary paid subscriptions still require a successful provider transaction", () => {
  assert.match(source, /subscription\.paymentStatus === "PAID"/);
  assert.match(source, /paymentTransactions\.some\(\(item\) => item\.status === "SUCCESS"\)/);
  assert.match(source, /providerPaymentVerified \|\| ownerAuthorizedGrant/);
});
