# Gigxomi Automation Runtime Engine

## Existing Runtime Pieces
- Webhooks:
  - `src/app/api/whatsapp/webhook/route.ts`
  - `src/app/api/meta/whatsapp/webhook/route.ts`
- WhatsApp send helpers:
  - `src/lib/gigxomi/dummy-platform-store.ts`
  - `src/lib/gigxomi/dummy-platform-file-store.ts`
- Flow storage:
  - `src/lib/gigxomi/super-admin-whatsapp-flow-store.ts`
  - `.gigxomi/super-admin-whatsapp-flows.json`
- Runtime engine:
  - `src/lib/gigxomi/whatsapp-flow-engine.ts`
- Runtime run/event ledger:
  - `src/lib/gigxomi/whatsapp-runtime-store.ts`
  - `.gigxomi/whatsapp-runtime-engine.json`
- Conversation/contact intake:
  - `ingestWhatsAppWebhookPayloadFromFile`
  - `Conversation`, `MessageEvent`, `AppConversation`, and file-backed dummy platform conversations.

## Current Webhook Routes
- `/api/whatsapp/webhook`
  - GET verifies `hub.mode`, `hub.verify_token`, and `hub.challenge` against `WHATSAPP_VERIFY_TOKEN`.
  - POST parses payload, handles public auth OTP, ingests conversation messages, then runs automation when public auth did not already handle the message.
- `/api/meta/whatsapp/webhook`
  - GET supports tenant connection verify tokens and `WHATSAPP_VERIFY_TOKEN`.
  - POST follows the same intake/runtime path as the global route.

## Environment Variables
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_APP_SECRET`
- `META_APP_ID`
- `WHATSAPP_FLOW_API_ALLOWLIST` for future reviewed API request nodes.

Tenant-specific WhatsApp access tokens, phone number IDs, WABA IDs, and verify tokens must remain server-side. The current connection store already keeps credentials in backend file/DB snapshot storage; production should encrypt access tokens before persistence and never expose them to frontend bundles.

## Implemented Runtime Behavior
- Normalizes inbound WhatsApp text, button replies, list replies, media placeholders, and status event counts.
- Resolves tenant from `phone_number_id`, WABA ID, or display phone number.
- Uses existing intake to create/update contact, conversation, and inbound message records.
- Ignores duplicate inbound webhook message IDs at runtime.
- Finds active matching flows by tenant/channel with priority for exact keyword, contains keyword, reply payload, then generic on-message.
- Creates FlowRun and FlowEvent records in the local runtime ledger.
- Executes basic nodes with a max step limit of 25.
- Sends official WhatsApp Cloud API messages through existing server-side send helpers.
- Continues waiting runs from button/list replies using stable payload IDs.
- Logs analytics events: `flow_started`, `flow_completed`, `flow_failed`, `node_executed`, `message_sent`, `button_clicked`, `list_item_selected`, `human_handoff`, and `runtime_pending`.
- Exposes admin runtime status at `/api/super-admin/whatsapp-flows/runtime`.

## Supported Runtime Nodes
- Triggers:
  - `trigger-on-message`
  - `trigger-keyword`
  - `keyword-trigger`
- Messages:
  - `message-text`
  - `send-message`
  - `message-button`
  - `button-message`
  - `message-list`
  - `message-template` through existing template sender
- Logic:
  - `condition` with `contains`, `=`, `==`, and boolean `true`
- Control:
  - `wait` sets run status to `waiting`
  - `handoff` sends optional handoff message and sets run status to `handed_off`
  - `stop` sets run status to `stopped`

## Runtime Pending Nodes
- `api-request`: blocked unless a reviewed server-side adapter and `WHATSAPP_FLOW_API_ALLOWLIST` model are completed.
- `ai-text-generation`, `meta-ai`: marked `runtime_pending`; no mock AI replies.
- `intent-lookup`: marked `runtime_pending` until mapped to a safe auth/contact adapter.
- Tagging, lead creation, CRM updates, manager queue assignment, task creation, payment-link actions, and conversion goals need dedicated backend adapters.

## FlowRun / FlowEvent Persistence Status
Local file-backed persistence exists for development and dashboard debugging:
- `.gigxomi/whatsapp-runtime-engine.json`

Production DB tables are still required. Runtime cannot be production-ready until FlowRun/FlowEvent tables are added.

Required `FlowRun` schema:
- id
- flow_id
- tenant_id / agency_id
- contact_id
- conversation_id
- channel
- status
- current_node_id
- started_at
- updated_at
- completed_at
- failed_at
- error_message
- context_json

Required `FlowEvent` schema:
- id
- flow_run_id
- node_id
- event_type
- input_json
- output_json
- status
- error_message
- created_at

## Runtime Execution Limits
- Max 25 node steps per inbound event.
- Duplicate webhook message IDs are ignored.
- Draft/paused flows do not run.
- One best matching flow runs per inbound message.
- Unsafe API request nodes are blocked.
- Advanced AI nodes do not execute until configured through reviewed backend adapters.
- Webhook routes return `200` for empty/malformed payloads after safe handling to avoid Meta retry storms.

## WhatsApp Cloud API Notes
- Text, quick reply buttons, CTA URL, list, template, media/document helpers use server-side Graph API send code.
- Button labels are trimmed to WhatsApp limits.
- List messages enforce 1-10 rows.
- Template sending requires a configured template name/language.
- Outbound message IDs are logged in runtime events and existing conversation messages when send succeeds.

## Missing Backend Pieces
- Durable Prisma-backed `Flow`, `FlowVersion`, `FlowRun`, and `FlowEvent` models.
- Secure encrypted tenant credential vault.
- Scheduler for wait/delay nodes.
- Bot-disabled/manual-assigned conversation flag.
- Queue/manager handoff model that does not overload freelancer assignment.
- Runtime analytics aggregation for dashboards.
- Full signature verification policy using `META_APP_SECRET` and `X-Hub-Signature-256`.
- Retry/backoff queue for WhatsApp API failures and rate limits.

## Manual Test Checklist
- Webhook verification:
  - Valid `hub.verify_token` returns challenge.
  - Invalid token returns 403.
- Inbound message:
  - Exact keyword starts active flow.
  - Generic message starts on-message flow.
  - Duplicate message ID is ignored.
  - No matching flow produces no bot reply.
- Flow execution:
  - Text node sends a WhatsApp text message.
  - Button node sends interactive buttons and sets run `waiting`.
  - Button reply resumes the waiting run and follows matching edge.
  - List node sends list payload and sets run `waiting`.
  - List reply resumes the waiting run and follows matching edge.
  - Condition routes true/false.
  - Stop node completes/stops run.
  - Handoff node sets run `handed_off`.
- Failure:
  - Invalid node logs `flow_failed`.
  - WhatsApp API failure logs failed `message_sent`.
  - Missing tenant mapping falls back to official Gigxomi tenant and must be reviewed.

## Production Risks
- File-backed runtime ledger is not enough for production concurrency or analytics.
- The current super-admin flow model is not a complete multi-tenant published flow schema.
- Public auth webhook handling and automation matching share the same inbound stream; route now suppresses automation when public auth already handled a message.
- Human handoff needs an explicit automation-disabled flag to avoid bot/human conflicts.
- API request nodes need a reviewed adapter registry, not arbitrary URL execution.
