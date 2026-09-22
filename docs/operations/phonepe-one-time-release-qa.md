# PhonePe checkout and mobile release handoff — 27 August 2026

## Release status

**Local implementation; not deployed and not a release approval. No APK/AAB was built in this change.**

The user now permits a one-time payment if AutoPay is unavailable. This replaces the previous AutoPay-only restriction, not the requirement for verified PhonePe confirmation.

The backend workspace is `codex/phonepe-autopay-fix`, based on `22263a24` (parent `d50f75fd`). The released mobile source is the separate `C:/gx` checkout on `codex/onboarding-autopay-release-2.1.2`, based on `92224f45`. The root workspace's older mobile directory is **not** the current release source.

## Implemented

- Explicit AutoPay versus **Pay once — no automatic renewal** selection. One-time payments use PhonePe Standard Checkout (`/checkout/v2/pay`) and its available UPI/QR methods. No static/manual UPI QR and no Gigxomi checkout-link QR.
- Prices, audience, billing cycle, coupon, and access duration are derived/validated on the server. One-time payments do not create a mandate or schedule automatic renewal.
- Coupon reservation, subscription, and payment order are created together before contacting PhonePe. Per-user database locks prevent concurrent duplicate checkouts; ambiguous timeouts retain the existing order for status reconciliation.
- The same reconciliation service is used by authenticated mobile polling, authenticated returns, and authenticated webhooks. It calls PhonePe order status, checks completed payment, amount, order identifiers, stored account/package/cycle, then atomically updates access and the ledger.
- PhonePe webhook authorization follows the official SDK's SHA-256 `username:password` contract, rather than Basic authentication.
- A browser return alone does not grant access or create a session. Cancelled/expired checkout records cannot later activate access; duplicate confirmation cannot extend a period twice.
- Current valid access is retained during an attempted upgrade. Expired paid subscriptions and stale session flags cannot pass the billing-access check. Verified cancellation periods and configured grace periods retain access until their end.
- Clear pending/retry/disabled/provider error screens, redacted diagnostics, bounded provider timeouts, safe expired-link handling, and no raw errors from the new confirmation flow.
- Checkout marketing initialization is suppressed on direct checkout/return page loads so signed intent URLs are not sent as marketing page views. Referrer policy is `no-referrer`.
- Mobile source: neutral PhonePe CTA, payment-confirmation wording, renewal prompt, role-specific copy, and bottom safe-area clearance. Play Reader's no-purchase-link branch remains intact.

## Verification evidence

- Prisma schema validation and client generation passed; no schema changes or database migration were made.
- 48 focused tests passed: `phonepe-gateway-behavior.test.mjs`, `onboarding-autopay-release.test.mjs`, `team-general-billing-contract.test.mjs`.
- 44 protected application-stability tests passed: channel routing/signatures, OTP routing, notification privacy, editor eligibility, and assignment surface.
- Source-scoped backend TypeScript and current mobile-source TypeScript passed. Source-scoped checking avoids unrelated archived build/worktree folders included by the root tsconfig.
- Focused ESLint passed. Webpack production build passed in an isolated snapshot with two workers and no production database credentials. Missing-database fallback warnings on public static pages are expected in that snapshot; this is not a live database verification.
- Browser UI fixture uses the actual checkout form and stylesheet with dummy data. AutoPay/one-time selection, disabled AutoPay with yearly one-time fallback, pending-payment suppression, and narrow-phone layout were inspected. No horizontal overflow at 390px/320px browser viewports; no browser console errors. This is not a real PhonePe transaction or end-to-end backend test.
- Actual production-mode local server: an invalid/expired checkout link returns HTTP 200 with a recovery screen and `no-referrer`; invalid signed-intent form submission returns a safe HTTP 303 rather than a 500. These checks use no account, database or gateway credentials.
- Installed Android `com.gigxomi.app` 2.1.2 / build 18 launched in `Gigxomi_Release_34` (`emulator-5554`). Agency and Freelancer registration rendered; empty submission showed specific first-name, last-name and phone errors. Crash buffer was empty. No OTP was sent and no real account was created. The two new mobile source changes have typechecking only, not a rebuilt-device test.

Local evidence: `.codex-tmp/phonepe-qa/` contains registration UI dumps/screenshots, checkout screenshots, and the Android crash-buffer capture. The isolated build log is at `C:/Users/hello/AppData/Local/Temp/gigxomi-phonepe-verify-8342f8eb/phonepe-final-build.log`.

## Required before deployment/release

1. Rotate the PhonePe secret previously shared in chat. Configure the replacement securely in the correct environment; do not commit it. Supply a separate approved sandbox merchant and webhook credentials for staging, not production credentials relabelled as sandbox.
2. Enable plugin, one-time payment and webhook processing in the sandbox Billing Control. Leave AutoPay disabled unless that merchant is approved for it. Readiness/key presence does not prove merchant capability.
3. Complete actual sandbox monthly/yearly one-time payments. Verify authenticated webhook delivery, matching order/amount, one ledger success, expiry date, mobile focus refresh, and browser return. Repeat with abandoned/failed/duplicate/delayed callbacks and provider timeouts. Test AutoPay setup/renewal/cancellation separately if enabled.
4. Reconcile any pre-existing/ambiguous pending orders with PhonePe before allowing another checkout. This implementation intentionally does not discard an ambiguous timeout automatically; unsupported legacy pending records may need an audited administrative repair. No such production repair was done.
5. Investigate/refund any money received after a checkout was locally expired by a switch to Freemium. This change blocks a surprise upgrade but does not automate refunds.
6. Use authorized dummy Agency and Freelancer sessions for full emulator QA: OTP and restoration; free activation; agency brand/logo and authenticated Instagram/WhatsApp connections; freelancer profile → portfolio → dynamic Q&A/Trust Score → review; onboarding gates; Team/General offer/direct/accept/pass; work states; two-editor limits; presence; learning playlists/chapters/lessons, package locks and watch tracking; offline/logout/account-switch/cold-launch behavior. These are **not all runtime-verified in this pass**.
7. Integrate the backend commit through the production owner, keeping the protected messaging source unchanged. Deploy staging, verify authenticated JSON and database behavior, then deploy production only after the gateway acceptance tests. Recheck web/mobile status parity.
8. Rebuild only after the above gates, using the existing upload key. Verify distribution policy, signature, API URL, version code, install/cold launch and artifact hashes. Keep direct APK and consumption-only Play AAB separate.

## Safety boundaries

The protected agency account ending **7309** and its tenant were not modified or charged. No production payments, merchant-setting changes, database migrations, account resets, pushes, or release builds were performed. `src/app/api/meta`, `src/app/api/conversations`, `src/components/chat`, and `src/lib/gigxomi` were not edited.

The isolated mobile copy/spacing changes are saved locally as `af26c7b2` in `C:/gx`; they have not been pushed or installed in the emulator.

## Provider references

- [PhonePe Standard Checkout API collection](https://www.postman.com/phonepe-pg-integrations-online/phonepe-pg-phonepe-standard-checkout-online/documentation/p7im9w7/1-standard-checkout-apis)
- [Official PhonePe webhook hash implementation](https://github.com/PhonePe/phonepe-pg-sdk-python/blob/main/phonepe/sdk/pg/common/utils/hash_utils.py)

Behavioral tests use mocked HTTP and an in-memory database substitute. They do not substitute for real sandbox callbacks, PostgreSQL concurrency tests, or merchant approval.
