# Meta conversion measurement

## Scope and current rollout gate

Website dataset: `1071501248618259`; WhatsApp dataset: `1600678771718426`.
Business: `100910602174128`; intended ad account: `1159019788918020`.
Code must not be enabled until a dataset-authorized token passes a Meta **Test Events** check.
On 28 August 2026, the replacement direct-integration token accepted two synthetic website
events in Meta Test Events (`events_received: 2`, no warnings). Its generic dataset GET still
returns `(#100) Missing Permission`; that read endpoint is not a CAPI delivery readiness check.
No advertising campaigns, budgets, purchases, or fake sales are created by this integration.

## Sources

| Source | Trigger | Event |
| --- | --- | --- |
| Main website | Consenting visitor views an allowlisted public page | PageView |
| ankit.gigxomi.com | Consenting visitor views the webinar page | PageView, source_surface=webinar |
| Webinar registration | Successful server-created free registration | CompleteRegistration |
| Paid webinar registration | Checkout created; payment still pending | Lead, never Purchase |
| WhatsApp 8124 | Verified, tenant-routed, persisted ad referral | Sales queue entry only |
| WhatsApp 8124 | Sales explicitly applies **Meta qualified lead** to the claimed, attributed lead | LeadSubmitted |

Organic visits have no fabricated click ID or paid campaign attribution. The WhatsApp dataset
is linked to the verified WABA; its event-management credential is isolated from the website
token. Website and webinar use hostname and `source_surface` within the website dataset.
Future main-site lead forms and verified paid purchases need explicit server-side event hooks.
They are not inferred from button clicks, URLs, or client-supplied event names.

## Isolation and reliability

The WhatsApp and Instagram ingress routes are unchanged. The independent worker reads only
already-processed WhatsApp webhook rows, requiring the exact configured tenant and phone ID,
the full receiving number, a real `ctwa_clid`, and an exact saved external-message match in a
WhatsApp conversation. Unknown and ambiguous associations are ignored. Other tenants and
Instagram are excluded. The sales queue keeps the exact conversation ID through claiming.

In Sales CRM, claim the ad enquiry, open its lead details, confirm that it is a genuine,
suitable lead, then use **Apply label & send to Meta**. This adds the label and an actor audit
entry in the same transaction as the outbox event. Ordinary tags and pipeline stages never
send conversions. One stable event ID per dataset/conversation makes repeated clicks safe.
Delivery starts after the HTTP response, with worker retries if needed; the card shows pending,
sent, retrying or failed. Meta acceptance does not guarantee instant reporting/ad optimisation.

The outbox persists an event ID, original event time and minimal outgoing payload. It uses a
compare-and-swap lease, bounded Meta requests, exponential retries and a 20-attempt ceiling.
Meta must report `events_received: 1` before delivery is marked SENT. Browser/server versions
use the same event name and ID for deduplication. Identifiers are cleared on successful delivery
or terminal failure; undelivered identifiers expire after seven days, and ledger rows after 30.
No message text, OTP, auth code, private URL, or plaintext contact details are sent to Meta.

## Consent

Meta Pixel and website CAPI require the host-only `__Host-gx_meta_consent=granted` cookie.
Decline, DNT and GPC disable website measurement. Public URL allowlists exclude account,
chat, login, signup, checkout, return and thank-you identifiers. Unexpected query parameters
block measurement. Meta automatic event configuration is disabled in code. Also disable
"Automatically include more detailed page and product info" in Events Manager during setup.
This control covers Meta only; existing GA/GTM consent settings are a separate audit.

## Runtime configuration

Server-only `.env` values (never commit tokens):

```
META_CAPI_ENABLED=true
META_CAPI_WEBSITE_ENABLED=false
META_CAPI_DATASET_ID=1071501248618259
META_CAPI_ACCESS_TOKEN=<dataset-authorized token>
META_CAPI_GRAPH_VERSION=v25.0
META_CAPI_WHATSAPP_DATASET_ID=1600678771718426
META_CAPI_WHATSAPP_ACCESS_TOKEN=<WABA-authorized event-management credential>
META_CAPI_WHATSAPP_TENANT_ID=<verified exact tenant for 8124>
META_CAPI_WHATSAPP_PHONE_NUMBER_ID=<verified exact phone-number ID for 8124>
META_CAPI_WHATSAPP_START_AT=<UTC activation timestamp; no historical import>
CRON_SECRET=<strong secret shared with the local worker>
```

Both enable flags default to false. The initial rollout enables WhatsApp only; website
measurement remains disabled until the separate consent/privacy setup is approved.
Run `node scripts/configure-whatsapp-capi.mjs` on the VPS for a read-only preflight, then
`node scripts/configure-whatsapp-capi.mjs --apply-whatsapp` for an explicitly requested rollout.
It checks the exact saved recipient, backs up `.env` with restricted permissions, preserves
existing secrets, and never changes messaging connection credentials or webhook configuration.
Before initial setup, `node scripts/provision-whatsapp-conversion-dataset.mjs` checks the WABA
owner, event-management permission and existing dataset. `--apply` creates a dataset only if
none is linked, verifies the association, and stores a separate server-only reporting credential.
It disables delivery until the source-aware release is deployed and the rollout is enabled.
It does not create campaigns, change budgets or grant an ad account access. Connect the intended
ad account in Meta separately with the owner's confirmation.
The browser reads the public dataset ID from a no-cache configuration endpoint at runtime.
Missing tenant/phone/start configuration disables WhatsApp attribution. Missing dataset/token
disables queueing. The deploy script preserves non-empty server secrets and starts the separate
`gigxomi-meta-conversions` PM2 worker only when credentials and `CRON_SECRET` exist. The worker
calls authenticated `POST /api/cron/meta-conversions` locally, every 15 seconds after completion.

## Release checks

1. `node --test tests/meta-capi-attribution.test.mjs`
2. `npm run test:application-stability`
3. `npm run lint` and `npm run build`
4. Backup DB, migrate, `npm run db:verify`; verify `meta_conversion_events` and pool conversation column.
5. With Meta's test code, verify website event acceptance and matching browser/server event IDs.
   Use `META_CAPI_TEST_EVENT_CODE=<code> node scripts/test-meta-conversions.mjs` on the server;
   it refuses to send without a test code and uses no real customer identifiers.
6. Verify a real test referral from the 8124 ad routes to the correct inbox and sales queue,
   then qualify it and check LeadSubmitted. No fabricated ctwa_clid or purchase events.
7. Verify anonymous/declined/private-page requests do not create events.

`node scripts/audit-whatsapp-capi.mjs` reports aggregate inbound/processed/ad-referral counts
and conversion ledger states without exposing messages or identifiers. The pre-release check
on 28 August 2026 found 34/34 processed messages on the 8124 line over seven days, but zero
`ctwa_clid` referrals. WhatsApp receipt is verified; real ad-to-qualified-conversion delivery
still requires an actual click-to-WhatsApp ad enquiry. Do not manufacture ad identifiers.

Inspect counts/status/lastError only when monitoring. Do not dump outbox payloads or tokens.
Rollback measurement by stopping `gigxomi-meta-conversions` and setting `META_CAPI_ENABLED=false`;
no messaging webhook or routing change is needed.
