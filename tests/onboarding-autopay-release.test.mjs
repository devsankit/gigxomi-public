import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(relativePath) { return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8"); }

test("billing state never demotes an Agency identity to Freelancer", async () => {
  const [session, subscription] = await Promise.all([source("src/lib/auth/session.ts"), source("src/lib/billing/subscription-service.ts")]);
  assert.match(session, /packageAudience === "AGENCY"/);
  assert.doesNotMatch(session, /packageStatus === "ACTIVE" && packageAudience === "AGENCY"/);
  assert.match(subscription, /role: assignedRole/);
  assert.match(subscription, /workspaceMode: input\.pkg\.audience === "AGENCY" \? "AGENCY" : "FREELANCER"/);
});

test("PhonePe AutoPay uses current subscription endpoints and nested setup flow", async () => {
  const provider = await source("src/lib/billing/phonepe-providers.ts");
  assert.match(provider, /type: "SUBSCRIPTION_SETUP"/);
  assert.match(provider, /\/subscriptions\/v2\/setup/);
  assert.match(provider, /\/subscriptions\/v2\/order\/\$\{encodeURIComponent\(merchantOrderId\)\}\/status\?details=true/);
  assert.match(provider, /\/subscriptions\/v2\/notify/);
  assert.match(provider, /\/subscriptions\/v2\/redeem/);
  assert.doesNotMatch(provider, /redemption\/execute|redemption\/notify/);
});

test("checkout return alone cannot activate Premium", async () => {
  const [returnPage, confirm, subscription] = await Promise.all([
    source("src/app/mobile/billing-return/page.tsx"),
    source("src/app/api/billing/checkout/confirm/route.ts"),
    source("src/lib/billing/subscription-service.ts"),
  ]);
  assert.match(returnPage, /only after Gigxomi verifies/);
  assert.match(confirm, /startGatewayCheckout/);
  assert.match(subscription, /status: billingType === "FREE" \? "ACTIVE" : "PAUSED"/);
  assert.match(subscription, /\["EXPIRED", "CANCELLED", "REVOKED"\]\.includes\(subscription\.status\)/);
});

test("PhonePe confirmation is authenticated, deduplicated, and safe to retry", async () => {
  const [verification, statusService, schema] = await Promise.all([
    source("src/lib/billing/webhook-verification-service.ts"),
    source("src/lib/billing/phonepe-status-service.ts"),
    source("prisma/schema.prisma"),
  ]);
  assert.match(verification, /timingSafeEqual/);
  assert.match(verification, /webhookUsername.*webhookPassword/);
  assert.match(statusService, /webhookDedupeKey/);
  assert.match(statusService, /error\.code === "P2002"/);
  assert.match(schema, /dedupeKey\s+String\?\s+@unique/);
});

test("AutoPay checkout uses PhonePe actions without a manual QR fallback", async () => {
  const checkout = (await source("src/app/subscription-checkout/page.tsx")) + (await source("src/components/billing/gateway-checkout-form.tsx"));
  assert.match(checkout, /Open PhonePe \/ UPI Intent/);
  assert.match(checkout, /UPI ID Collect fallback/);
  assert.match(checkout, /Retry AutoPay/);
  assert.match(checkout, /Return to Agency Freemium/);
  assert.doesNotMatch(checkout, /QRCode|gx-checkout-qr|Paying from another phone/);
  assert.doesNotMatch(checkout, /upi:\/\/pay/);
});

test("browser checkout failures return to a safe customer-facing state", async () => {
  const [confirm, checkout, errors] = await Promise.all([
    source("src/app/api/billing/checkout/confirm/route.ts"),
    source("src/app/subscription-checkout/page.tsx"),
    source("src/lib/billing/phonepe-checkout-errors.ts"),
  ]);
  assert.match(confirm, /classifyPhonePeCheckoutError/);
  assert.match(confirm, /checkoutRequestId/);
  assert.match(errors, /Premium will activate only after verified payment confirmation/);
  assert.doesNotMatch(errors, /No payment was completed and Premium was not activated/);
  assert.match(checkout, /Return to Agency Freemium/);
});

test("PhonePe checkout errors are typed and safe for customer-facing copy", async () => {
  const errors = await source("src/lib/billing/phonepe-checkout-errors.ts");
  for (const code of ["autopay-disabled", "phonepe-oauth", "merchant-not-enabled", "invalid-request", "provider-timeout", "provider-unavailable", "payment-pending"]) {
    assert.match(errors, new RegExp(`"${code}"`));
  }
  assert.doesNotMatch(errors, /client_secret|PHONEPE_CLIENT_SECRET/);
});

test("Super Admin PhonePe diagnostics remain redacted", async () => {
  const [service, panel] = await Promise.all([
    source("src/lib/billing/phonepe-admin-config-service.ts"),
    source("src/components/super-admin/super-admin-phonepe-control.tsx"),
  ]);
  assert.match(service, /recordPhonePeProviderDiagnostic/);
  assert.match(panel, /Last provider status/);
  assert.match(panel, /Request ID/);
  assert.doesNotMatch(panel, /clientSecret|client_secret|webhookPassword/);
});

test("coupon duration and renewal amount are persisted", async () => {
  const [schema, recurring] = await Promise.all([source("prisma/schema.prisma"), source("src/lib/billing/recurring-billing-service.ts")]);
  assert.match(schema, /enum CouponDiscountDuration/);
  assert.match(schema, /renewalAmount\s+Decimal\?/);
  assert.match(recurring, /subscription\.renewalAmount \?\? subscription\.amount/);
});

test("Play reader activation exposes no purchase URL", async () => {
  const mobileRoute = await source("src/app/api/mobile/v2/onboarding/activate/route.ts");
  assert.match(mobileRoute, /READER_PURCHASE_UNAVAILABLE/);
});

test("Agency onboarding requires profile plus Instagram and WhatsApp", async () => {
  const [profile, integrations] = await Promise.all([
    source("src/app/api/mobile/v2/onboarding/profile/route.ts"),
    source("src/app/api/mobile/v2/integrations/route.ts"),
  ]);
  assert.match(profile, /Organization name and logo are required/);
  assert.match(integrations, /instagramConnected && whatsappConnected/);
});

test("Meta channel setup links are one-time, tenant-bound, and never mint a web session", async () => {
  const [intent, continuation, schema] = await Promise.all([
    source("src/lib/connected-platform/channel-setup-intent.ts"),
    source("src/app/api/mobile/channel-setup/continue/route.ts"),
    source("prisma/schema.prisma"),
  ]);
  assert.match(schema, /model AppChannelSetupIntent/);
  assert.match(schema, /tokenHash\s+String\s+@unique/);
  assert.match(schema, /consumedAt\s+DateTime\?/);
  assert.match(intent, /randomBytes\(24\)/);
  assert.match(intent, /randomBytes\(32\)/);
  assert.match(intent, /findUnique\(\{ where: \{ id: intentId \} \}\)/);
  assert.doesNotMatch(intent, /GIGXOMI_SESSION_SECRET|createHmac/);
  assert.match(intent, /tenantId: expected\.tenantId/);
  assert.match(intent, /consumedAt: null/);
  assert.match(intent, /consumed\.count === 1/);
  assert.match(continuation, /session\.userId !== intent\.userId/);
  assert.match(continuation, /session\.tenantId !== intent\.tenantId/);
  assert.match(continuation, /status: 409/);
  assert.doesNotMatch(continuation, /applySessionCookie/);
});

test("Meta channel setup requires responsible-use confirmation and safe browser headers", async () => {
  const [whatsapp, instagram, continuation] = await Promise.all([
    source("src/app/api/mobile/v2/integrations/whatsapp/connect/route.ts"),
    source("src/app/api/mobile/v2/integrations/instagram/connect/route.ts"),
    source("src/app/api/mobile/channel-setup/continue/route.ts"),
  ]);
  for (const route of [whatsapp, instagram]) {
    assert.match(route, /export async function POST/);
    assert.match(route, /policyAccepted !== true/);
    assert.match(route, /packageAudience !== "AGENCY"/);
    assert.match(route, /authorization\.session\.tenantId/);
  }
  assert.match(continuation, /Cache-Control", "no-store/);
  assert.match(continuation, /Referrer-Policy", "no-referrer/);
  assert.match(continuation, /X-Robots-Tag", "noindex, nofollow, noarchive/);
});
