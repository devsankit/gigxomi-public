import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("Freemium limits distinct active assignments rather than Team memberships", async () => {
  const [limits, teamFlow] = await Promise.all([
    source("src/lib/billing/team-seat-limits.ts"),
    source("src/lib/gigxomi/app-team-flow-service.ts"),
  ]);
  assert.match(limits, /FREEMIUM_EDITOR_LIMIT = 2/);
  assert.match(limits, /getActiveAssignedEditorIds/);
  assert.match(limits, /appAssignmentRecord\.findMany/);
  assert.match(limits, /conversation\.status\.toLowerCase\(\) !== "closed"/);
  assert.doesNotMatch(teamFlow, /assertTeamEditorLimit|assertActiveAssignmentEditorLimit/);
});

test("Agency Freemium gives two active editors for a 30-day launch period", async () => {
  const [packages, subscriptions, entitlements] = await Promise.all([
    source("src/lib/billing/package-service.ts"),
    source("src/lib/billing/subscription-service.ts"),
    source("src/lib/billing/entitlement-state.ts"),
  ]);
  assert.match(packages, /trialDays: 30/);
  assert.match(packages, /editorFreelancerLimit: 2/);
  assert.match(packages, /activeProjectLimit: 5/);
  assert.match(subscriptions, /pkg\.durationDays/);
  assert.match(entitlements, /paidPeriodEnded/);
});

test("agency registration exposes both dynamic plans without replacing Super Admin copy", async () => {
  const selector = await source("src/lib/billing/launch-registration-packages.ts");
  assert.match(selector, /pkg\.audience === "AGENCY"/);
  assert.match(selector, /\.sort\(\(left, right\) => left\.sortOrder - right\.sortOrder\)/);
  assert.doesNotMatch(selector, /const agency = selectForAudience/);
});

test("paid activation derives monthly or yearly price and returns paused access until verification", async () => {
  const [billing, activateRoute] = await Promise.all([
    source("src/lib/billing/subscription-service.ts"),
    source("src/app/api/mobile/v2/onboarding/activate/route.ts"),
  ]);
  assert.match(billing, /billingCycle\?: "MONTHLY" \| "YEARLY"/);
  assert.match(billing, /billingCycle === "YEARLY" \? toNumber\(pkg\.priceYearly\) : toNumber\(pkg\.priceMonthly\)/);
  assert.match(billing, /billingIntervalOverride: billingCycle/);
  assert.match(billing, /user: managedUser/);
  assert.match(billing, /status: billingType === "FREE" \? "ACTIVE" : "PAUSED"/);
  assert.match(activateRoute, /body\?\.billingCycle === "YEARLY"/);
  assert.match(activateRoute, /originalAmount: cycleAmount/);
});

test("Agency plan bootstrap repairs Freemium and Premium price copy in an existing database", async () => {
  const packages = await source("src/lib/billing/package-service.ts");
  assert.match(packages, /pkg.id === "pkg-agency-freemium" \|\| pkg.id === "pkg-agency-premium"/);
  assert.match(packages, /priceMonthly: 2000/);
  assert.match(packages, /priceYearly: 17700/);
  assert.match(packages, /₹17,700\/year — one complete agency workspace/);
  assert.match(packages, /required-registration-repair/);
});

test("unpaid or mandate-only checkout cannot unlock Premium", async () => {
  const [subscription, phonePe, entitlements, access, statusRoute] = await Promise.all([
    source("src/lib/billing/subscription-service.ts"),
    source("src/lib/billing/phonepe-status-service.ts"),
    source("src/lib/billing/entitlement-state.ts"),
    source("src/lib/billing/billing-access-service.ts"),
    source("src/app/api/mobile/subscription/status/route.ts"),
  ]);
  assert.match(subscription, /Paid subscription activation requires a verified payment transaction/);
  assert.match(subscription, /verifiedPayment\.status !== "SUCCESS"/);
  assert.doesNotMatch(subscription, /pkg\.audience === "FREELANCER" \|\| isRegistrationPackageFree/);
  assert.doesNotMatch(subscription, /isRegistrationPackageFree\(pkg\) \|\| input\.amountOverride === 0/);
  assert.match(phonePe, /\["COMPLETED", "SUCCESS", "PAYMENT_SUCCESS"\]/);
  assert.match(phonePe, /PhonePe payment amount verification failed/);
  assert.match(phonePe, /PhonePe payment billing cycle verification failed/);
  assert.match(phonePe, /verifiedTransactionId: updated\.id/);
  assert.doesNotMatch(phonePe, /isSubscriptionSuccessState\(state\).*activateSubscription/s);
  assert.match(entitlements, /paymentTransactions\.some\(\(item\) => item\.status === "SUCCESS"\)/);
  assert.match(access, /paymentTransactions: \{\s*where: \{ status: "SUCCESS" \}/);
  assert.match(statusRoute, /const active = entitlement\?\.active === true/);
});

test("connected OTP verification repairs the authoritative onboarding owner", async () => {
  const [verify, activate] = await Promise.all([
    source("src/app/api/mobile/v2/onboarding/verify/route.ts"),
    source("src/app/api/mobile/v2/onboarding/activate/route.ts"),
  ]);
  assert.match(verify, /verifiedUserId = result\.user\.id/);
  assert.match(verify, /connectedOnboardingState\.upsert/);
  assert.match(activate, /resolveVerifiedState/);
  assert.match(activate, /status: "VERIFIED"/);
});

test("web and mobile onboarding enforce profile, portfolio, assessment, review order", async () => {
  const [service, screen, adminGate] = await Promise.all([
    source("src/lib/gigxomi/freelancer-onboarding-service.ts"),
    source("src/components/freelancer/freelancer-qualification-onboarding.tsx"),
    source("src/components/admin/admin-onboarding-gate.tsx"),
  ]);
  assert.match(service, /!profileCompleted \|\| !identityChosen \? 1 : !serviceSubmitted \? 2 : !assessmentSubmitted \? 3/);
  assert.match(screen, /Profile & identity/);
  assert.match(screen, /Portfolio & service/);
  assert.match(screen, /Dynamic Q&A & Trust/);
  assert.match(screen, /admin review pending/);
  assert.match(adminGate, /\/admin\/system-settings/);
});

test("General marketplace requires an approved portfolio while active Team members stay eligible", async () => {
  const directory = await source("src/app/api/team/editor-directory/route.ts") + await source("src/lib/api/editor-directory.ts");
  assert.match(directory, /publishedServices\.length > 0/);
  assert.match(directory, /marketplaceEligible = hasMarketplaceAccess && publicServices\.length > 0/);
  assert.match(directory, /scope === "general" && !editor\.marketplaceEligible/);
  assert.match(directory, /offerEligible: marketplaceEligible \|\| membership\?\.status === "ACTIVE"/);
});

test("Sales agents can generate campaign coupons from their own workspace", async () => {
  const [route, dashboard] = await Promise.all([
    source("src/app/api/sales/referrals/route.ts"),
    source("src/components/sales/sales-dashboard.tsx"),
  ]);
  assert.match(route, /requireSessionRole\(\["SUPER_ADMIN", "SALES_AGENT"\]\)/);
  assert.match(route, /generateCouponCode\(requestedPrefix\)/);
  assert.match(dashboard, /Create customer coupon/);
  assert.match(dashboard, /fetch\("\/api\/sales\/referrals", \{/);
  assert.match(dashboard, /Create coupon code/);
});

test("Agency and Freelancer onboarding reminders create push and in-app notifications", async () => {
  const [drip, migration] = await Promise.all([
    source("src/lib/connected-platform/drip.ts"),
    source("prisma/migrations/20260825130000_seed_onboarding_push_reminders/migration.sql"),
  ]);
  assert.match(drip, /notificationChannelId: "gigxomi-onboarding"/);
  assert.match(drip, /createAppNotification/);
  assert.match(drip, /freelancerOnboarding\?\.completedAt/);
  assert.match(migration, /ARRAY\['AGENCY'\]::"ConnectedAudience"\[\]/);
  assert.match(migration, /ARRAY\['FREELANCER'\]::"ConnectedAudience"\[\]/);
});
