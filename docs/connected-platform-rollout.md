# Connected platform rollout

This branch keeps the current APIs live and introduces additive `/api/mobile/v2/*` contracts for the Gigxomi Play app and the separately packaged CRM app.

## Runtime configuration

Keep these values in the deployment secret manager or EAS environment; do not commit real values:

- `CONNECTED_PLATFORM_V2_ENABLED=true` enables v2 registration.
- `CONNECTED_PLATFORM_TOKEN_ENCRYPTION_KEY` encrypts Meta access tokens with AES-256-GCM.
- `CONNECTED_PLATFORM_OAUTH_STATE_SECRET` signs short-lived Instagram OAuth state.
- `INSTAGRAM_OAUTH_CLIENT_ID` and `INSTAGRAM_OAUTH_CLIENT_SECRET` identify the Meta app.
- `CONNECTED_INSTAGRAM_REDIRECT_URI=https://gigxomi.com/api/mobile/v2/integrations/instagram/callback` must match Meta configuration.
- `CRON_SECRET` authorizes `/api/cron/connected-drip-campaigns`.
- Existing Firebase, PhonePe, WhatsApp, database, and EAS credentials remain environment-owned.

The CRM `google-services.json` is intentionally ignored. Supply it locally or through EAS before native builds. The Play app retains its existing Firebase identity during this migration; move that tracked file to an EAS file secret in a separate credential rotation so the installed app identity is not accidentally changed.

## Deployment order

1. Back up PostgreSQL and deploy `20260816120000_connected_platform_foundation` with v2 registration disabled.
2. Configure token encryption, OAuth, Meta callback/webhook, Firebase, and cron secrets.
3. Enable the super-admin Learning & Growth controls and migrate/publish CRM lessons.
4. Pilot v2 registration with Agency and Freelancer test accounts.
5. Pilot Agency team, accounting, trust scoring, and targeted CRM inbox access.
6. Enable drip rules individually; new rules are inactive by default.
7. Build EAS previews for both Expo projects, run physical-device CRM call-module tests, then promote the Play alpha.

## Verification checklist

- `prisma validate` and `prisma generate`
- root `tsc --noEmit`, `next build`, sensitive API audit, and mobile readiness audit
- Play and CRM `npm run typecheck`
- Android prebuild for both apps with their environment-owned Firebase files
- OTP throttling, coupon concurrency, payment callback idempotency, Meta cancellation/reconnect, LMS 90% gate, team invitation races, assigned-lead chat isolation, and drip deduplication on a staging database

Production migration, EAS submission, and Play promotion are intentionally separate operational steps; they require production credentials and pilot approval.
