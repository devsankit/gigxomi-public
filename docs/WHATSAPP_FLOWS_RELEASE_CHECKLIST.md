# WhatsApp Flows Release Checklist

## Audit Summary

### Files inspected

- `src/app/super-admin/whatsapp-flows/page.tsx`
- `src/app/super-admin/whatsapp-flows/builder/[flowId]/page.tsx`
- `src/components/super-admin/super-admin-section-content.tsx`
- `src/components/super-admin/super-admin-whatsapp-flow-builder.tsx`
- `src/app/api/super-admin/whatsapp-flows/route.ts`
- `src/lib/gigxomi/super-admin-whatsapp-flow-store.ts`
- `src/lib/gigxomi/whatsapp-flow-engine.ts`
- `src/lib/gigxomi/whatsapp-runtime-store.ts`
- `src/app/globals.css`
- `src/styles/design-tokens.css`

### Existing working parts before release pass

- Super admin WhatsApp Flows page already used the protected `SUPER_ADMIN` route guard.
- React Flow was already installed and used as the canvas engine.
- File-backed flow storage already existed through `.gigxomi/super-admin-whatsapp-flows.json`.
- API route `POST /api/super-admin/whatsapp-flows` already saved flows and blocked `ACTIVE` saves on validation errors.
- Full-canvas route already existed at `/super-admin/whatsapp-flows/builder/[flowId]`.
- Runtime engine skeleton already existed separately for webhook normalization, basic runtime runs/events, and WhatsApp sender wrappers.

### Missing parts before release pass

- WhatsApp Flows opened directly into a canvas instead of a clean list view.
- No user-facing `New Flow` creation path existed on the builder page.
- Flow open/full-view actions were not available from a list.
- Node positions were not fully preserved through save payloads.
- Node library was click-only and did not support drag/drop.
- Inspector coverage was too shallow for buttons, lists, templates, API, AI, wait, handoff, and edge mapping.
- Publish gating did not clearly surface runtime-pending nodes in the UI.
- Analytics and test tabs were present only as light placeholders.
- Older blue-tinted automation surfaces were still reachable through previous CSS rules.

### Risks before release

- The persistence layer is file-backed, not database-backed.
- Delete flow API is not implemented, so UI delete is intentionally disabled.
- Publish is safe-gated, but production runtime is still limited to the currently implemented backend node adapters.
- Full manual browser testing requires an authenticated super-admin session.
- Existing worktree contains unrelated pending changes; release staging must not blindly include all files.

## Implementation Completed In This Pass

- Added list-first WhatsApp Flows landing view with title, `New Flow`, status, channel, validation status, run count, and actions.
- Added `New Flow` creation through the existing backend route with default `Untitled WhatsApp Flow`, WhatsApp channel intent, and starter `On Message` trigger.
- Added open-flow behavior that loads the selected flow into the React Flow builder.
- Connected full canvas action to the existing `/super-admin/whatsapp-flows/builder/[flowId]` route.
- Preserved editable node positions in the flow store and save payload.
- Added draggable grouped node library.
- Added compact custom node cards with channel badge, runtime badge, validation badge, handles, and summaries.
- Expanded inspector fields for trigger, text, buttons, list message, condition, API, template, AI, wait, handoff, and edge branch mapping.
- Added frontend validation for triggers, required fields, unsupported channels, disconnected nodes, dead ends, unsafe loops, WhatsApp button/list limits, API URL/method, AI prompt, template name, and handoff queue.
- Publish now runs validation first and blocks on errors before hitting the backend.
- Added local simulation shell with explicit runtime-backend warning for advanced nodes.
- Added analytics empty/runtime-run shell.
- Added final black/neon CSS hardening for list view, panels, canvas, node cards, tabs, validation states, and responsive behavior.

## Supported Runtime Nodes In UI

- On Message
- On Keyword
- On Button Reply
- On List Reply
- Text Message
- Buttons
- List Message
- Template Message
- Condition
- Human Handoff
- Stop Flow

## Runtime Pending Nodes

- Assign Manager
- Create Lead
- API Request
- Wait
- AI Reply
- AI Intent Detection

These nodes remain visible and configurable, but validation blocks publish until production runtime adapters are connected.

## Backend Persistence Status

- Flow list, create, open, save draft, and publish use the existing super-admin flow API and file-backed store.
- Flow positions are now preserved as node `position`.
- Delete is not wired because no delete API exists yet.
- Database-backed `Flow`, `FlowVersion`, `FlowRun`, and `FlowEvent` tables are still recommended before production scale.

## Manual UI Checklist

- Open WhatsApp Flows page: not browser-verified because this environment does not have an authenticated super-admin session.
- Empty/list state renders correctly: implemented by code path, not browser-verified.
- New Flow creates draft: implemented through existing API, not browser-verified.
- Flow appears in list: implemented through API response refresh, not browser-verified.
- Open flow loads builder: implemented, not browser-verified.
- Add node: implemented through click and drag/drop, not browser-verified.
- Connect node: implemented through React Flow `onConnect`, not browser-verified.
- Edit node in inspector: implemented, not browser-verified.
- Save draft: implemented through existing API, not browser-verified.
- Reload/open and verify saved positions: implemented through store position persistence, not browser-verified.
- Validate flow: implemented and type/build verified.
- Publish blocked if invalid: implemented in UI and backend.
- Publish works if valid and backend accepts it: implemented for runtime-ready nodes only, not browser-verified.
- Full Canvas opens correctly: route exists and action added, build verified, not browser-verified.
- Back to list works: implemented.
- No blue-heavy builder surfaces visible: final CSS hardening added.
- Sidebar unaffected: no sidebar files changed by this pass.
- Mobile/tablet limited layout: implemented with desktop-editing notice and single-column layout.

## Automated Checks

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## Local Smoke Test Attempt

- Built production server startup: attempted on local port `3100`.
- Protected API smoke: blocked by `401 Unauthorized` when using a generated super-admin session cookie.
- Password-login smoke: blocked by `500 Internal Server Error` from the local production server login route.
- Result: authenticated route/API smoke could not be completed in this environment. Do not treat this as full release QA.

## Release Decision

Do not push to `main` unless lint and build pass and the remaining production risks are accepted. This pass is code-verified by TypeScript, lint, and production build, but not fully manually QA-verified because authenticated super-admin browser/API access was not available in this environment.
