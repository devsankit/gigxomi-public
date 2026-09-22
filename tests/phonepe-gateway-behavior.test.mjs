import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const cache = new Map();
function load(path, mocks = {}, overrides = {}) {
  let code = cache.get(path);
  if (!code) {
    code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    cache.set(path, code);
  }
  const loadedModule = { exports: {} };
  const localRequire = (id) => id === "server-only" ? {} : id in mocks ? mocks[id] : require(id);
  new Function("require", "module", "exports", ...Object.keys(overrides), code)(localRequire, loadedModule, loadedModule.exports, ...Object.values(overrides));
  return loadedModule.exports;
}
const policy = load("src/lib/billing/gateway-checkout-policy.ts");
const config = { getPhonePeConfig: () => ({ environment: "sandbox", clientId: "test-id", clientSecret: "test-secret", clientVersion: "1", webhookUsername: "test-user", webhookPassword: "test-password" }), getPhonePeBaseUrl: () => "https://sandbox.example.test", getPhonePeOAuthUrl: () => "https://sandbox.example.test/oauth/token" };
const http = load("src/lib/billing/phonepe-client.ts", { "@/lib/billing/phonepe-config": config });
const errors = load("src/lib/billing/phonepe-checkout-errors.ts", { "@/lib/billing/phonepe-client": http });

test("PhonePe webhook requires the SDK SHA256 authorization, rejects Basic/empty/wrong", () => {
  const verification = load("src/lib/billing/webhook-verification-service.ts", { "@/lib/billing/phonepe-config": config });
  const header = createHash("sha256").update("test-user:test-password").digest("hex");
  for (const [authorization, valid] of [[header, true], ["Basic " + Buffer.from("test-user:test-password").toString("base64"), false], ["", false], ["wrong", false]]) {
    assert.equal(verification.verifyPhonePeWebhookAuthorization(new Request("https://test", { headers: { authorization } })), valid);
  }
});

test("OAuth and order request are authenticated and sent to sandbox with bounded timeouts (mock transport)", async () => {
  const calls = [];
  const client = load("src/lib/billing/phonepe-client.ts", { "@/lib/billing/phonepe-config": config }, {
    fetch: async (url, init) => { calls.push({ url, init }); return Response.json(calls.length === 1 ? { access_token: "mock-token", expires_in: 600 } : { state: "PENDING" }); },
  });
  await new client.PhonePeHttpClient().request("/checkout/v2/pay", { method: "POST", body: "{}" });
  assert.match(calls[0].url, /sandbox.*oauth/);
  assert.equal(calls[0].init.body.get("client_id"), "test-id");
  assert.equal(calls[1].init.headers.Authorization, "O-Bearer mock-token");
  assert.ok(calls.every((item) => item.init.signal instanceof AbortSignal));
});

test("error states distinguish OAuth, capability, invalid request and unavailable without leaking payload", () => {
  for (const [path, status, expected] of [["oauth/token", 401, "phonepe-oauth"], ["/subscriptions/v2/setup", 403, "merchant-not-enabled"], ["/subscriptions/v2/setup", 400, "invalid-request"], ["oauth/token", 503, "provider-unavailable"]]) {
    const error = new http.PhonePeRequestError(path, status, { secret: "DO_NOT_LEAK" });
    assert.equal(errors.classifyPhonePeCheckoutError(error), expected);
    assert.doesNotMatch(error.message, /DO_NOT_LEAK/);
  }
  assert.equal(errors.phonePeCheckoutErrorView("__proto__"), null);
  assert.equal(errors.phonePeCheckoutErrorView("constructor"), null);
  assert.deepEqual(errors.phonePeMobileError("payment-pending").actions, ["REFRESH_PAYMENT_STATUS", "CHOOSE_FREEMIUM"]);
});

test("signed checkout pages stop marketing tracking before it is initialized", () => {
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  const guard = layout.match(/const billingPrivacyGuard = `([^`]+)`;/)[1];
  for (const pathname of ["/subscription-checkout", "/mobile/billing-return"]) {
    assert.equal(new Function("window", guard + "return 'tracked';")({ location: { pathname } }), undefined);
  }
  assert.equal(new Function("window", guard + "return 'tracked';")({ location: { pathname: "/pricing" } }), "tracked");
  assert.equal((layout.match(/\$\{billingPrivacyGuard\}/g) ?? []).length, 3);
});

test("calendar billing clamps month-end and leap day correctly", () => {
  assert.equal(policy.paidPeriodEnd(new Date("2026-01-31T12:00:00Z"), "MONTHLY").toISOString(), "2026-02-28T12:00:00.000Z");
  assert.equal(policy.paidPeriodEnd(new Date("2028-02-29T12:00:00Z"), "YEARLY").toISOString(), "2029-02-28T12:00:00.000Z");
});

const proof = { raw: { state: "COMPLETED", amount: 200000, orderId: "PHONEPE_123" }, merchantOrderId: "merchant_123", providerOrderId: "PHONEPE_123", amount: 2000, userId: "qa-user", packageId: "qa-package", subscriptionId: "qa-sub", cycle: "MONTHLY" };
test("provider order and merchant order are distinct; matching amount/cycle required", () => {
  assert.doesNotThrow(() => policy.assertGatewayProof(proof));
  for (const raw of [{ state: "PENDING" }, { ...proof.raw, amount: 1 }, { ...proof.raw, amount: "200000" }, { ...proof.raw, merchantOrderId: "other" }, { ...proof.raw, orderId: "other" }, { ...proof.raw, metaInfo: { udf5: "YEARLY" } }]) {
    assert.throws(() => policy.assertGatewayProof({ ...proof, raw }));
  }
});

function matches(row, where = {}) {
  return Object.entries(where).every(([key, expected]) => {
    if (key === "OR") return expected.some((clause) => matches(row, clause));
    if (key === "AND") return expected.every((clause) => matches(row, clause));
    if (expected && typeof expected === "object" && !(expected instanceof Date)) {
      if ("in" in expected) return expected.in.includes(row[key]);
      if ("gt" in expected) return row[key] != null && row[key] > expected.gt;
      if ("not" in expected) return row[key] !== expected.not;
      if ("some" in expected) return row[key]?.some((item) => matches(item, expected.some));
    }
    return row[key] === expected;
  });
}
function harness({ cycle = "MONTHLY", kind = "ONE_TIME", providerError = null, disabled = false, couponDuration = null } = {}) {
  const pkg = { id: "qa-package", name: "QA Premium", audience: "AGENCY", priceMonthly: 2000, priceYearly: 17700, isActive: true, isFree: false, currency: "INR" };
  const state = { users: [{ id: "qa-user", displayName: "Dummy agency", phone: "+910000000000", packageAudience: "AGENCY", workspaceMode: "AGENCY", role: "ADMIN", tenantId: "qa-tenant" }], payments: [], subscriptions: [], history: [], coupons: [], onboarding: [{ userId: "qa-user", stage: "PAYMENT" }], providerCalls: 0, response: "PENDING", responseAmount: null };
  let seq = 0;
  function table(key) {
    return {
      findUnique: async ({ where }) => state[key].find((row) => matches(row, where)) ?? null,
      findUniqueOrThrow: async ({ where }) => { const found = state[key].find((row) => matches(row, where)); if (!found) throw Error("not found"); return key === "subscriptions" ? { ...found, package: pkg } : found; },
      findFirst: async ({ where }) => [...state[key]].reverse().find((row) => matches(row, where)) ?? null,
      create: async ({ data }) => { const row = { id: `qa-${++seq}`, createdAt: new Date(), updatedAt: new Date(), ...data }; state[key].push(row); return row; },
      update: async ({ where, data }) => { const row = state[key].find((row) => matches(row, where)); if (!row) throw Error("missing"); Object.assign(row, data); return row; },
      updateMany: async ({ where, data }) => { const rows = state[key].filter((row) => matches(row, where)); rows.forEach((row) => Object.assign(row, data)); return { count: rows.length }; },
    };
  }
  const db = { appAuthUser: table("users"), paymentTransaction: table("payments"), userSubscription: table("subscriptions"), subscriptionStatusHistory: table("history"), couponRedemption: table("coupons"), connectedOnboardingState: table("onboarding"), $queryRaw: async () => [] };
  let queue = Promise.resolve();
  db.$transaction = (fn) => { const next = queue.then(() => fn(db)); queue = next.catch(() => undefined); return next; };
  class Provider {
    async initiate() { state.providerCalls++; if (providerError) throw providerError; await new Promise((resolve) => setTimeout(resolve, 10)); return { redirectUrl: "https://mercury.phonepe.com/mock-order", providerReference: "PHONEPE_123", raw: { orderId: "PHONEPE_123" } }; }
    async getStatus() { return { state: state.response, raw: { state: state.response, amount: state.responseAmount ?? Number(state.payments[0].amount) * 100, orderId: "PHONEPE_123" } }; }
  }
  class Autopay extends Provider { setup() { return this.initiate(); } getSetupStatus() { return this.getStatus(); } }
  const service = load("src/lib/billing/gateway-checkout-service.ts", {
    "@/lib/prisma": { prisma: db }, "@/lib/billing/phonepe-admin-config-service": { assertPhonePeCapabilityEnabled: async () => { if (disabled) throw Error("PhonePe Autopay is disabled in Billing Control."); }, recordPhonePeProviderDiagnostic: async () => {} },
    "@/lib/billing/phonepe-client": http, "@/lib/billing/phonepe-providers": { PhonePeStandardCheckoutProvider: Provider, PhonePeMandateAutopayProvider: Autopay },
    "@/lib/billing/phonepe-checkout-errors": errors, "@/lib/billing/gateway-checkout-policy": policy,
    "@/lib/gigxomi/public-growth-store": { findRegistrationPackage: async () => pkg }, "@/lib/billing/package-service": { ensurePersistedRegistrationPackage: async (p) => p }, "@/lib/connected-platform/coupons": { reserveCouponWithClient: async (client, input) => {
      assert.equal(client, db, "coupon must use the order transaction");
      const redemption = await db.couponRedemption.create({ data: { status: "RESERVED" } });
      return { redemptionId: redemption.id, quote: { code: input.code, finalAmount: input.originalAmount / 2, discountDuration: couponDuration } };
    } },
  });
  const input = { intent: { userId: "qa-user", packageId: pkg.id, billingCycle: cycle, returnTarget: "DIRECT_ANDROID" }, kind, requestId: "qa-request", paymentMode: "UPI_INTENT" };
  return { state, input, service };
}

for (const cycle of ["MONTHLY", "YEARLY"]) test(`${cycle}: redirect alone grants nothing; confirmed payment activates finite non-renewing access exactly once`, async () => {
  const { state, input, service } = harness({ cycle });
  const payment = await service.startGatewayCheckout(input);
  assert.equal(payment.amount, cycle === "YEARLY" ? 17700 : 2000);
  assert.equal(state.users[0].packageStatus, undefined);
  assert.equal(state.subscriptions[0].status, "PENDING");
  state.response = "COMPLETED";
  await service.reconcileGatewayCheckout(payment.merchantOrderId);
  const expires = state.subscriptions[0].expiresAt;
  await service.reconcileGatewayCheckout(payment.merchantOrderId);
  assert.equal(state.history.length, 1);
  assert.equal(state.subscriptions[0].expiresAt, expires);
  assert.equal(state.subscriptions[0].autoRenew, false);
  assert.equal(state.subscriptions[0].nextBillingDate, null);
  assert.equal(state.users[0].packageStatus, "ACTIVE");
  assert.equal(state.onboarding[0].stage, "PROFILE");
  await assert.rejects(() => service.startGatewayCheckout(input), /already active/);
});

test("concurrent taps create only one order; retry reuses it", async () => {
  const { state, input, service } = harness();
  await Promise.allSettled([service.startGatewayCheckout(input), service.startGatewayCheckout(input)]);
  await service.startGatewayCheckout(input);
  assert.equal(state.providerCalls, 1);
  assert.equal(state.payments.length, 1);
});

for (const response of ["PENDING", "ACTIVE", "CANCELLED", "FAILED", "EXPIRED"]) test(`${response} does not activate Premium`, async () => {
  const { state, input, service } = harness();
  const payment = await service.startGatewayCheckout(input);
  state.response = response;
  await service.reconcileGatewayCheckout(payment.merchantOrderId);
  assert.notEqual(state.users[0].packageStatus, "ACTIVE");
  if (response !== "PENDING" && response !== "ACTIVE") {
    state.response = "COMPLETED";
    await service.reconcileGatewayCheckout(payment.merchantOrderId);
    assert.notEqual(state.users[0].packageStatus, "ACTIVE");
  }
});

test("late success after choosing Freemium cannot revive the expired checkout", async () => {
  const { state, input, service } = harness();
  const payment = await service.startGatewayCheckout(input);
  state.payments[0].status = "EXPIRED";
  state.subscriptions[0].status = "EXPIRED";
  state.response = "COMPLETED";
  await service.reconcileGatewayCheckout(payment.merchantOrderId);
  assert.equal(state.history.length, 0);
});

test("wrong amount remains inactive; no ledger marked successful", async () => {
  const { state, input, service } = harness();
  const payment = await service.startGatewayCheckout(input);
  state.response = "COMPLETED"; state.responseAmount = 1;
  await assert.rejects(() => service.reconcileGatewayCheckout(payment.merchantOrderId), /amount verification/);
  assert.equal(state.payments[0].status, "INITIATED");
  assert.equal(state.history.length, 0);
});

test("timeout keeps order pending and blocks a second charge", async () => {
  const { state, input, service } = harness({ providerError: new DOMException("timeout", "TimeoutError") });
  await assert.rejects(() => service.startGatewayCheckout(input));
  await assert.rejects(() => service.startGatewayCheckout(input), /confirmation is pending/);
  assert.equal(state.providerCalls, 1);
});

test("disabled configuration never calls gateway or creates payment", async () => {
  const { state, input, service } = harness({ disabled: true });
  await assert.rejects(() => service.startGatewayCheckout(input), /disabled/);
  assert.equal(state.payments.length, 0);
});

test("definitive merchant rejection grants no access and permits explicit fallback", async () => {
  const { state, input, service } = harness({ kind: "AUTOPAY", providerError: new http.PhonePeRequestError("/subscriptions/v2/setup", 403, {}) });
  await assert.rejects(() => service.startGatewayCheckout(input));
  assert.equal(state.payments[0].status, "FAILED");
  assert.notEqual(state.users[0].packageStatus, "ACTIVE");
});

test("signed checkout rejects tampering, expiry, missing secrets and unbounded lifetime", () => {
  const env = { GIGXOMI_SESSION_SECRET: "local-test-only-not-a-real-secret" };
  const intent = load("src/lib/billing/checkout-intent.ts", {}, { process: { env } });
  const data = { userId: "qa-user", packageId: "qa-package", billingCycle: "MONTHLY", returnTarget: "DIRECT_ANDROID" };
  const token = intent.createBillingCheckoutIntent(data);
  assert.equal(intent.verifyBillingCheckoutIntent(token).userId, "qa-user");
  for (const invalid of [token + ".extra", token.slice(0, -4) + "fake", "", "abc.def"]) assert.equal(intent.verifyBillingCheckoutIntent(invalid), null);
  const signed = (obj) => { const encoded = Buffer.from(JSON.stringify(obj)).toString("base64url"); return encoded + "." + createHmac("sha256", env.GIGXOMI_SESSION_SECRET).update(encoded).digest("base64url"); };
  assert.equal(intent.verifyBillingCheckoutIntent(signed({ ...data, issuedAt: 1, expiresAt: 2 })), null);
  assert.equal(intent.verifyBillingCheckoutIntent(signed({ ...data, issuedAt: Date.now(), expiresAt: Date.now() + 86400000 })), null);
  delete env.GIGXOMI_SESSION_SECRET;
  assert.equal(intent.verifyBillingCheckoutIntent(token), null);
});

for (const duration of ["FIRST_CYCLE", "RECURRING"]) test(`coupon ${duration} derives first and renewal prices in the order transaction`, async () => {
  const { state, input, service } = harness({ kind: "AUTOPAY", couponDuration: duration });
  await service.startGatewayCheckout({ ...input, couponCode: "QA50" });
  assert.equal(state.subscriptions[0].amount, 1000);
  assert.equal(state.subscriptions[0].renewalAmount, duration === "RECURRING" ? 1000 : 2000);
  assert.equal(state.coupons[0].paymentTransactionId, state.payments[0].id);
});

test("Standard Checkout provider uses PG_CHECKOUT, server minor units and distinct order status URL", async () => {
  const calls = [];
  const providers = load("src/lib/billing/phonepe-providers.ts", {
    "@/lib/billing/phonepe-config": { buildPhonePeUrls: () => ({ paymentReturnUrl: "https://local.example.test/return" }) },
    "@/lib/billing/phonepe-client": { ...http, PhonePeHttpClient: class { async request(path, init) { calls.push({ path, init }); return { redirectUrl: "https://mercury.phonepe.com/mock", orderId: "provider-order", state: "PENDING" }; } } },
  });
  const gateway = new providers.PhonePeStandardCheckoutProvider();
  await gateway.initiate({ userId: "qa-user", subscriptionId: "qa-sub", merchantOrderId: "merchant-order", merchantTransactionId: "merchant-order", amount: 17700, phone: "+910000000000", package: { id: "qa-package", name: "Premium", billingInterval: "YEARLY" } });
  const body = JSON.parse(calls[0].init.body);
  assert.equal(calls[0].path, "/checkout/v2/pay"); assert.equal(body.amount, 1770000);
  assert.equal(body.paymentFlow.type, "PG_CHECKOUT"); assert.equal(body.metaInfo.udf5, "YEARLY");
  await gateway.getStatus("merchant-order"); assert.equal(calls[1].path, "/checkout/v2/order/merchant-order/status");
});

test("billing access does not accept expired paid work or stale ACTIVE session; paid cancellation/grace remain valid", async () => {
  const state = { subscription: null, user: { packageId: "qa-package", packageStatus: "ACTIVE", packageExpiresAt: new Date(Date.now() + 100000) }, pkg: { billingType: "ONE_TIME_PAID" } };
  const access = load("src/lib/billing/billing-access-service.ts", {
    "next/server": { NextResponse: { json: (body, init) => ({ body, status: init.status }) } }, "next/navigation": { redirect() {} },
    "@/lib/auth/session": { getSessionContext: async () => ({ userId: "qa-user", role: "ADMIN", packageStatus: "ACTIVE" }) },
    "@/lib/prisma": { prisma: {
      userSubscription: { findFirst: async ({ where }) => state.subscription && matches(state.subscription, where) ? state.subscription : null },
      appAuthUser: { findUnique: async () => state.user }, package: { findUnique: async () => state.pkg },
    } },
  });
  const paid = { userId: "qa-user", status: "ACTIVE", billingType: "ONE_TIME_PAID", paymentStatus: "PAID", expiresAt: new Date(Date.now() + 100000), paymentTransactions: [{ status: "SUCCESS" }], package: state.pkg };
  assert.equal((await access.requireActiveBillingAccess()).ok, false);
  state.subscription = { ...paid, expiresAt: new Date(1) }; assert.equal((await access.requireActiveBillingAccess()).ok, false);
  state.subscription = paid; assert.equal((await access.requireActiveBillingAccess()).ok, true);
  state.subscription = { ...paid, status: "CANCELLED" }; assert.equal((await access.requireActiveBillingAccess()).ok, true);
  state.subscription = { ...paid, status: "PAST_DUE", expiresAt: new Date(1), graceEndsAt: new Date(Date.now() + 100000) }; assert.equal((await access.requireActiveBillingAccess()).ok, true);
  state.subscription = { ...paid, paymentStatus: "PENDING", paymentTransactions: [] }; assert.equal((await access.requireActiveBillingAccess()).ok, false);
});
