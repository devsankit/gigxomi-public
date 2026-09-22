# WhatsApp Flow Builder Production Readiness

Updated: 2026-05-06

## Scope

This pass is limited to WhatsApp Flow Builder backend/runtime/storage/security. It does not redesign the builder UI, sidebar, dashboard shell, auth UX, or unrelated pages.

## Files Inspected

- `prisma/schema.prisma`
- `src/lib/prisma.ts`
- `src/lib/gigxomi/super-admin-whatsapp-flow-store.ts`
- `src/lib/gigxomi/whatsapp-runtime-store.ts`
- `src/lib/gigxomi/whatsapp-flow-engine.ts`
- `src/app/api/super-admin/whatsapp-flows/route.ts`
- `src/app/api/super-admin/whatsapp-flows/[flowId]/route.ts`
- `src/app/api/super-admin/whatsapp-flows/runtime/route.ts`
- `src/app/api/meta/whatsapp/webhook/route.ts`
- `src/app/api/whatsapp/webhook/route.ts`
- `src/lib/auth/public-whatsapp.ts`
- `src/lib/gigxomi/dummy-platform-file-store.ts`
- `src/lib/gigxomi/dummy-platform-store.ts`
- `src/components/super-admin/super-admin-whatsapp-flow-builder.tsx`

## Storage Status

Status: DB-backed in production path, local file fallback only in non-production when `DATABASE_URL` is missing.

Added schema/migration for:

- `whatsapp_flows`
- `whatsapp_flow_versions`
- `whatsapp_flow_runs`
- `whatsapp_flow_events`
- `whatsapp_webhook_message_events`

Production behavior:

- If `DATABASE_URL` is configured, flow CRUD and runtime records use Prisma/Postgres tables.
- If `DATABASE_URL` is missing in production, flow/runtime storage fails closed instead of silently using `.gigxomi/*.json`.
- The existing file-backed flow/runtime stores remain as local development fallback only.

Local DB verification:

- `DATABASE_URL` is present in `.env` and was loaded by Prisma.
- Prisma schema validation passed.
- Prisma client generation passed.
- Migration deploy passed against the configured local Postgres database.
- Prisma migrate status reports the schema is up to date.
- `npm run db:verify` passed and confirmed the new WhatsApp flow runtime tables exist.

Staging/prod verification command:

```bash
npm run db:migrate:deploy
npm run db:verify
```

## Migration

Migration file:

- `prisma/migrations/20260506103000_add_whatsapp_flow_runtime_tables/migration.sql`

Required deployment order:

1. Set required environment variables.
2. Deploy migration.
3. Run Prisma generate in build pipeline.
4. Start app.
5. Confirm flow CRUD writes to `whatsapp_flows`.
6. Confirm runtime writes to `whatsapp_flow_runs`, `whatsapp_flow_events`, and `whatsapp_webhook_message_events`.

## Webhook Signature Validation

Status: Implemented for both WhatsApp webhook POST routes.

Routes:

- `src/app/api/meta/whatsapp/webhook/route.ts`
- `src/app/api/whatsapp/webhook/route.ts`

Behavior:

- Reads raw request body with `request.text()`.
- Validates `X-Hub-Signature-256` using HMAC SHA-256 and `META_APP_SECRET`.
- Rejects invalid or missing signatures with `403`.
- If `META_APP_SECRET` is missing in production, webhook fails closed.
- Local bypass is allowed only when `NODE_ENV !== "production"` and `WHATSAPP_WEBHOOK_SIGNATURE_BYPASS=true`.
- Secrets are not logged.

## Required Env Vars

- `DATABASE_URL`
- `META_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_APP_ID`

Optional local-only env:

- `WHATSAPP_WEBHOOK_SIGNATURE_BYPASS=true`

Runtime integration env:

- `WHATSAPP_FLOW_API_ALLOWLIST` for future reviewed API Request adapters.

## Tenant Resolution Safety

Status: Unsafe fallback removed.

Runtime now resolves inbound webhook scope by:

1. `metadata.phone_number_id`
2. WABA ID from webhook entry
3. Display phone number digits

If no connected WhatsApp state matches:

- No flow is executed.
- No outbound WhatsApp message is sent.
- No cross-tenant run is created.
- A structured runtime event is logged with `tenant_resolution_failed`.
- The webhook message ID is still claimed for idempotency.

Known limitation:

- WhatsApp connection state is still read through the existing platform connection store. It should eventually be normalized into a dedicated secure integration table with encrypted credentials.

## Auth Intent Lookup Runtime Status

Status: Corrected from Ready to Builder Only.

Reason:

- Generic flow runtime does not safely execute `intent-lookup`.
- Public auth OTP handling exists separately in `processPublicAuthWebhookPayload`.
- The builder node now communicates that Auth Intent Lookup is configurable visually but needs a backend adapter for generic runtime publish.
- Server publish validation blocks `intent-lookup` with `CAPABILITY_NOT_READY`.

## Server Validation

Status: Strengthened and used for publish blocking.

New validation helper:

- `src/lib/gigxomi/whatsapp-flow-server-validation.ts`

Structured issue shape:

- `severity`
- `node_id`
- `code`
- `message`
- `fix_hint`

Rules covered:

- Missing trigger
- Trigger without outgoing path
- Broken edges
- Disconnected nodes
- Unreachable nodes
- Dead-end nodes unless Stop Flow or Human Handoff
- Message nodes missing content
- Button count, labels, payloads, and route mappings
- List sections, rows, row limits, row payloads, and route mappings
- Template nodes missing template name
- Conditions missing expression
- Condition true/false branch warnings
- API request missing URL/method
- AI prompt/source missing
- Handoff queue/output key missing
- Runtime-blocked nodes, including Auth Intent Lookup
- Possible loop warning

Publish behavior:

- `POST /api/super-admin/whatsapp-flows` blocks `ACTIVE` saves when any server validation issue has `severity: "error"`.
- Draft saves may keep warnings/errors for continued editing.

## Runtime Safety

Status: Improved for basic runtime path, still not production-complete for advanced nodes.

Implemented:

- Database-backed run/event persistence when `DATABASE_URL` exists.
- Webhook message idempotency through `whatsapp_webhook_message_events`.
- Duplicate webhook claims return safely without double replies.
- Max execution step guard remains at 25.
- Loop detection remains enabled per inbound execution.
- Unsupported nodes log `unsupported_node` events and fail gracefully.
- Tenant resolution failure logs structured runtime event and does not reply.
- Outbound send errors are recorded in flow events and run failure status.
- API Request remains blocked unless a reviewed server-side adapter is added.

Supported basic runtime nodes:

- On Message
- On Keyword
- On Button Reply
- On List Reply
- Text Message
- Buttons
- List Message
- Template Message if valid template name and existing sender supports it
- Condition
- Human Handoff
- Stop Flow

Runtime blocked / pending nodes:

- Auth Intent Lookup: Builder Only, backend adapter required
- Assign Manager: Builder Only until assignment service adapter is wired
- Create Lead: Integration Required
- API Request: Integration Required, allowlisted adapter required
- AI Reply: Builder Only / Integration Required
- AI Intent Detection: Builder Only / Integration Required
- Wait: Builder Only until durable scheduler exists

## Browser QA Checklist

Manual browser QA is still required in this environment.

Checklist:

- Flow list opens.
- New flow creates a DB-backed record.
- Rename persists after refresh.
- Duplicate persists after refresh.
- Delete persists after refresh.
- Open builder loads the same flow.
- Full Canvas opens in a new tab.
- Full Canvas route has no dashboard sidebar/header.
- Save nodes/edges persists after refresh.
- Publish is blocked on server validation errors.
- Publish succeeds only when server validation passes.
- OTP flow validation reports Auth Intent Lookup as Builder Only, not Ready.
- Runtime status labels are accurate.
- Webhook POST without signature is rejected in production/staging.
- Webhook POST with valid signature is accepted.
- Webhook for unknown phone number logs `tenant_resolution_failed` and sends no reply.
- Duplicate webhook message ID does not send duplicate replies.

## Test Results

- `npm.cmd run db:generate`: passed.
- `npx.cmd prisma validate`: passed.
- `npm.cmd run db:migrate:deploy`: passed after rewriting the migration SQL as UTF-8 without BOM and marking the failed BOM attempt rolled back.
- `npx.cmd prisma migrate status`: passed/schema up to date.
- `npm.cmd run db:verify`: passed and includes `whatsapp_flows`, `whatsapp_flow_versions`, `whatsapp_flow_runs`, `whatsapp_flow_events`, and `whatsapp_webhook_message_events`.
- `npm.cmd run lint`: passed.
- `npm.cmd run typecheck --if-present`: passed/no typecheck script configured.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run build`: passed.
- `npm.cmd test --if-present`: passed/no test script output.

## Remaining Risks

Critical:

- Browser click-through QA has not been completed against a DB-backed environment.

High:

- WhatsApp credentials/connection state should be moved from the legacy platform snapshot model into dedicated encrypted integration tables.
- `processPublicAuthWebhookPayload` still owns the public OTP runtime path separately from generic flow runtime.
- API Request runtime is intentionally blocked until allowlisted server-side integration adapters are implemented.
- Wait/delay nodes need a durable scheduler.

Medium:

- Server validation is stricter than some existing draft/system flows and may surface real capability blockers before publish.
- Runtime analytics are event-backed now, but dashboard aggregation still needs production queries/rollups.

## Release Position

Safe to push the backend/runtime safety changes to main after the passing checks above.

Go-live notes:

- Browser click-through QA still needs to be performed against a DB-backed environment.
- Real Meta webhook signature verification should be tested with Meta-delivered payloads before calling the runtime production-ready.
- Browser click-through QA still needs to be performed against a DB-backed environment.
