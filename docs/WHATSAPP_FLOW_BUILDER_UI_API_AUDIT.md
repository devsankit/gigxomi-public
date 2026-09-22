# WhatsApp Flow Builder UI/API Audit

Date: 2026-05-06
Scope: WhatsApp Flows / Flow Builder UI, routes, CRUD APIs, validation, node capability labels, WhatsApp runtime, persistence, security, and release readiness.
Mode: audit only. No implementation, redesign, or refactor changes were made in this pass.

## Audit Method

Files inspected:

- `src/app/super-admin/whatsapp-flows/page.tsx`
- `src/app/super-admin/whatsapp-flows/[flowId]/builder/page.tsx`
- `src/app/super-admin/whatsapp-flows/builder/[flowId]/page.tsx`
- `src/components/super-admin/super-admin-whatsapp-flow-builder.tsx`
- `src/components/super-admin/super-admin-shell.tsx`
- `src/app/globals.css` scoped `.wa-builder` section
- `src/app/api/super-admin/whatsapp-flows/route.ts`
- `src/app/api/super-admin/whatsapp-flows/[flowId]/route.ts`
- `src/app/api/super-admin/whatsapp-flows/runtime/route.ts`
- `src/lib/gigxomi/super-admin-whatsapp-flow-store.ts`
- `src/lib/gigxomi/whatsapp-flow-engine.ts`
- `src/lib/gigxomi/whatsapp-runtime-store.ts`
- `src/app/api/meta/whatsapp/webhook/route.ts`
- `src/app/api/whatsapp/webhook/route.ts`
- `src/app/api/meta/whatsapp/messages/route.ts`
- `src/lib/auth/public-whatsapp.ts`
- `src/lib/gigxomi/dummy-platform-file-store.ts`
- `src/lib/gigxomi/dummy-platform-store.ts`
- `src/lib/gigxomi/dummy-platform-db-store.ts`
- `prisma/schema.prisma`
- `package.json`
- `tsconfig.json`

Important limitation:

- This pass used source inspection and build/lint/typecheck checks. It did not launch a browser/dev server or click through the UI visually. Browser-only behavior is marked as needing manual verification.
- `rg` was attempted but failed with `Access is denied`; PowerShell `Select-String` was used instead.

Commands run:

- Color/token searches for hardcoded hex, `rgb`, `rgba`, blue/navy/cyan/sky/indigo/slate, `bg-`, `from-`, and `to-` in builder files.
- Search for `runtime pending`, `runtime_pending`, and `RUNTIME_PENDING` in builder UI files.
- Search for WhatsApp/Meta env and signature terms.
- `git check-ignore -v .gigxomi\super-admin-whatsapp-flows.json .gigxomi\whatsapp-runtime-engine.json`
- `cmd /c npm run lint`
- `cmd /c npx tsc --noEmit`
- `cmd /c npm run build`
- `cmd /c npm test --if-present`

## 1. UI/UX Audit Result

Overall result: Medium readiness for internal QA; not production/client-ready without browser QA and backend hardening.

### Fullscreen Builder Layout

Status: mostly implemented, browser confirmation still needed.

- Fullscreen route exists at `/super-admin/whatsapp-flows/[flowId]/builder`.
- Legacy route `/super-admin/whatsapp-flows/builder/[flowId]` redirects to the preferred route.
- Super Admin shell bypasses both fullscreen route patterns, so the fullscreen builder should render without sidebar/header/app chrome.
- Fullscreen CSS uses `width: 100vw`, `height: 100dvh`, `overflow: hidden`, a compact topbar, and a `minmax(0, 1fr)` workspace.
- Left and right panels have internal scroll in fullscreen mode.
- Mobile fullscreen intentionally hides the editor panels/canvas and shows `Use desktop for full flow editing`.

Issues:

- Medium: No browser QA was performed to confirm actual no-body-scroll behavior, panel scrolling, minimap placement, or Fit View.
- Medium: Below `1180px`, the topbar becomes auto-height while workspace uses `height: calc(100dvh - 132px)`. If actions wrap taller than expected, clipping/scroll pressure is possible.
- Low: Tablet behavior reflows panels instead of true collapsible side panels.

### Top Bar

Status: mostly implemented.

- Flow name is visible and editable.
- Status/channel/validation signals exist.
- Save Draft, Validate, Publish, Test, Fit View, Full Canvas, and Delete selected exist.
- Publish uses the primary action class.
- Delete selected is visually separated with destructive-light styling.

Issues:

- Medium: Fullscreen action row uses `overflow: hidden` on desktop. Some actions may clip at intermediate widths.
- Low: The action set is dense and needs browser verification at 90/100/125 percent zoom.

### Node Library

Status: mostly implemented.

- Search exists.
- Categories are clear and collapsible: Triggers, Interactive, Messages, Logic, Actions, Control, AI.
- Node cards are compact and include short icon code, name, description, and capability badge.
- Unsupported channel nodes are disabled.

Issues:

- Medium: Some capability labels do not match actual runtime support. Most important: `Auth Intent Lookup` is labeled `Ready` but generic runtime marks `intent-lookup` pending and fails it.
- Low: Sticky search is explicitly fullscreen-scoped.

### Canvas

Status: mostly implemented, browser confirmation still needed.

- React Flow remains the canvas engine.
- Canvas wrapper and React Flow containers are configured to fill available fullscreen space.
- Minimap is constrained to `132px x 92px`, bottom-right.
- Controls are compact and bottom-left in fullscreen.
- Nodes are readable, have handles, selected state, warning/error states, and lime handles.

Issues:

- Medium: Actual visual cleanliness, Fit View, no-body-scroll, and minimap behavior need browser QA.
- Low: Node actions appear on selected nodes as well as after double-click/right-click. Safe, but not strictly double-click-only.

### Right Panel

Status: mostly implemented.

- Inspector, Validation, Test, and Analytics tabs exist.
- No-node-selected empty state exists.
- Selected nodes show real editable fields.
- Inspector shows readiness/capability helper text.
- Validation issues are clickable in code and should select/focus nodes.
- Test mode is a local simulation shell and does not pretend full backend execution.
- Analytics shows runtime/run data when available, otherwise uses empty-state behavior.

Issues:

- Medium: Inspector/tab layout was not visually clicked through in browser.
- Medium: Analytics relies on file-backed/local runtime records, not production analytics tables.

### Node Interaction

Status: mostly implemented with one UX mismatch.

- Double-click selects node, opens the node action toolbar, and switches to Inspector.
- Shift + double-click triggers delete confirmation.
- Right-click prevents browser menu, selects node, and opens the same node action toolbar.
- Toolbar actions include Edit, Duplicate, Add next, Copy ID, and Delete.
- Delete selected removes the node plus connected edges through `deleteNodeById`.
- `onNodesChange` also removes connected edges from active flow state when React Flow removes nodes.
- React Flow built-in delete key is disabled via `deleteKeyCode={null}` and custom keyboard handling is used.

Issues:

- Medium: Right-click opens toolbar above the node, not a true cursor-positioned context menu.
- Medium: Keyboard Delete/Backspace depends on focus being on the canvas wrapper and needs browser verification.
- Low: Duplicate node works locally and persists only after Save Draft.

### Flow List

Status: implemented for the current Super Admin file-backed store.

- Flow list loads server-side.
- New Flow posts a draft and opens builder state.
- Open loads the selected flow into builder state.
- Full View opens `/super-admin/whatsapp-flows/{flow.id}/builder` in a new tab.
- Duplicate clones client-side and saves as a new draft through POST.
- Delete calls API and removes the flow from list state.
- Rename calls PATCH and persists flow metadata.
- Public OTP flow is protected from delete.

Issues:

- High: Flow persistence is file-backed in `.gigxomi/super-admin-whatsapp-flows.json`, not DB-backed.
- Medium: Duplicate has no dedicated server endpoint.
- Medium: Delete has no durable audit log.

## 2. Color / Design-System Audit Result

Overall result: Flow builder scoped UI appears aligned with Gigxomi black/lime tokens. No blue-heavy panels were found in the audited flow builder scope.

Findings:

- `src/components/super-admin/super-admin-whatsapp-flow-builder.tsx`: no hardcoded hex, `rgb`, `rgba`, or blue/slate/cyan/indigo Tailwind-style color classes found.
- `.wa-builder` scope in `src/app/globals.css`: uses local CSS variables mapped to approved Gigxomi tokens.
- `.wa-builder` scope uses `color-mix(...)` with approved local variables.
- The only `from-`/`to-` search hit in scoped CSS was `transform: translateY(-1px)`, which is a false positive.
- No `Runtime pending` label appears in the builder UI scope.

Allowed status-color note:

- `--color-info: #38BDF8` is used for status meaning such as `Builder Only`. This is an approved status token, not a blue panel/background.

Wrong colors found:

| File | Finding | Classification |
| --- | --- | --- |
| `src/components/super-admin/super-admin-whatsapp-flow-builder.tsx` | No hardcoded colors or blue-heavy classes found. | Acceptable |
| `src/app/globals.css` `.wa-builder` scope | Token-mapped variables and `color-mix` only. | Acceptable |
| `src/app/globals.css` scoped search | `translateY(-1px)` matched `to-`. | False positive |

## 3. Flow List Issues

- High: File-backed flow store is not production-safe for persistence, backups, multi-instance deploys, or auditability.
- Medium: Duplicate flow works by client cloning rather than a dedicated API action.
- Medium: Delete works with confirmation and API, but has no audit trail.
- Low: Protected-system-flow labeling should be clearer for the OTP flow.

## 4. Builder / Canvas Issues

- Medium: Browser QA still required for fullscreen no-scroll, minimap, Fit View, panel scroll, and node readability.
- Medium: Topbar may clip actions at some desktop/tablet widths.
- Low: Right-click action surface is a toolbar, not a cursor-positioned context menu.

## 5. Node Library Issues

- Medium: Capability labels are mostly meaningful but not always runtime-accurate.
- High: `Auth Intent Lookup` is marked `Ready` in UI but fails in generic runtime.
- Low: Long labels/descriptions need browser QA for clipping.

## 6. Inspector Issues

- Medium: Real fields exist, but all node inspector forms need browser click-through.
- Medium: `Human Handoff` appears `Ready`, but runtime does not assign a queue/manager or set bot suppression.
- Low: Edge inspector/action UX is minimal.

## 7. Node Interaction Issues

- Medium: Double-click opens actions safely and does not instant-delete.
- Medium: Right-click works as a safe action toolbar, but not a true context menu.
- Medium: Keyboard delete may be focus-sensitive.
- Low: Connected edges are removed safely when deleting nodes.

## 8. Flow CRUD API Status

| Capability | Status | File | Method/path | Frontend call | Auth | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| List flows | Exists | `src/app/api/super-admin/whatsapp-flows/route.ts` | `GET /api/super-admin/whatsapp-flows` | Server props; API also exists | `SUPER_ADMIN` | File-backed |
| Create flow | Exists | same | `POST /api/super-admin/whatsapp-flows` | `postFlow(buildDefaultDraftPayload())` | `SUPER_ADMIN` | File-backed |
| Get flow by id | Exists | `[flowId]/route.ts` | `GET /api/super-admin/whatsapp-flows/:flowId` | Full route loads store directly; API also exists | `SUPER_ADMIN` | File-backed |
| Update flow name | Exists | collection and dynamic routes | `PATCH` | Builder uses collection PATCH with `{ id, name }` | `SUPER_ADMIN` | Trims/validates non-empty name |
| Update nodes/edges/settings | Partial | collection route | `POST` upsert | Save Draft / Publish | `SUPER_ADMIN` | No versioned snapshot |
| Duplicate flow | Partial | none dedicated | Client clone + `POST` | `duplicateFlow(flow)` | via POST | No dedicated audited endpoint |
| Delete flow | Exists | collection and dynamic routes | `DELETE` | Builder uses collection DELETE with `{ id }` | `SUPER_ADMIN` | OTP flow protected |
| Save draft | Exists | collection route | `POST` with `DRAFT` | `saveFlow(false)` | `SUPER_ADMIN` | File-backed |
| Publish flow | Partial | collection route | `POST` with `ACTIVE` | `saveFlow(true)` | `SUPER_ADMIN` | Server validates only partial rules |
| Server validate endpoint | Missing | none | none | Client validates locally | N/A | Needed for parity |
| Pause/unpublish | Missing | none | none | none | N/A | Planned only |
| Deploy | Exists | collection route | `POST` with `action: deploy` | Not core publish path | `SUPER_ADMIN` | File-backed deployments |

API risks:

- Critical: Flow data is not stored in database tables.
- High: APIs are Super Admin only; future agency access needs tenant scoping.
- High: Server validation is weaker than client validation.
- Medium: No dedicated publish/version/validate endpoints.
- Medium: No destructive action audit trail.

## 9. Validation Engine Status

Client validation is stronger than server validation.

| Rule | Client | Server | Notes |
| --- | --- | --- | --- |
| No trigger | Implemented | Implemented | Both detect missing trigger. |
| Trigger without outgoing edge | Implemented | Missing | Server does not explicitly block this. |
| Disconnected node | Implemented/partial | Implemented/partial | Client has reachability; server checks connected IDs only. |
| Dead-end without Stop | Implemented | Missing | Client warns/errors; server missing. |
| Message missing text/content | Implemented | Implemented | Covered. |
| Buttons missing labels/payloads | Implemented | Partial | Server checks count only. |
| List missing sections/rows | Implemented | Partial | Server lacks row ID/button/section title checks. |
| Invalid route mapping | Implemented | Missing | Server does not check branch mappings. |
| Template missing info | Implemented | Implemented | Template name checked. |
| API node missing URL/method | Implemented | Missing/partial | Server blocks capability but not URL/method specifically. |
| AI missing prompt/source | Implemented | Partial | Server checks prompt but capability blocks anyway. |
| Unsupported channel node | Implemented | Missing | Server has no selected channel model. |
| Unreachable nodes | Implemented | Missing | Client only. |
| Unsafe loops | Warning | Missing | Runtime has step/seen-node guards. |
| Publish blocked on critical errors | Implemented | Partial | Server blocks only its own partial rule set. |

Severity:

- High: Server validation must mirror client publish-blocking validation before production.
- High: `intent-lookup` is not blocked as a runtime-pending node even though generic runtime fails it.

## 10. OTP Flow Validation Errors

Current code-level status: the two known OTP builder validation errors appear fixed by default data and normalization.

Evidence:

- Default OTP condition has `conditionExpression: "auth_intent_status equals matched"`.
- Default OTP handoff has `outputVariable: "public_auth_verify_screen"`.
- `normalizeFlow()` backfills both fields for `flow-public-auth-otp`.
- The OTP flow is protected from deletion.

Remaining OTP/runtime concerns:

- High: Public OTP behavior is handled by `processPublicAuthWebhookPayload()` before the generic flow engine runs. If public auth handles a message, the generic flow engine is skipped.
- High: Generic runtime marks `intent-lookup` as `runtime_pending` and fails it.
- High: Generic runtime condition parser supports `contains`, `=`, `==`, or literal `true`; it does not support the word `equals`. If the generic runtime executes the OTP condition directly, it will route incorrectly.

Conclusion:

- Builder validation errors for OTP are fixed at config/normalization level.
- OTP is not production-ready as a normal flow-node runtime path; it currently relies on special-case public auth webhook code.

## 11. Node Runtime Status Mapping

| Node type | Current UI status | Correct audited status | Runtime support | Reason/gap |
| --- | --- | --- | --- | --- |
| On Message | Ready | Ready | Exists | Runtime starts from trigger. |
| On Keyword | Ready | Ready | Exists | Runtime matches exact/contains keyword. |
| On Button Reply | Ready | Partial Ready | Partial | Continuation works; trigger matching is generic. |
| On List Reply | Ready | Partial Ready | Partial | Continuation works; trigger matching is generic. |
| Text Message | Ready | Ready | Exists | Sends Cloud API text if credentials exist. |
| Buttons | Ready | Ready | Exists | Sends interactive buttons and waits. |
| List Message | Ready | Ready | Exists | Sends interactive list and waits. |
| Template Message | Template Approval Required | Template Approval Required | Partial | Sends by template name/language; approval check external. |
| Condition | Ready | Partial Ready | Partial | Limited expression parser; `equals` unsupported. |
| Auth Intent Lookup | Ready | Builder Only or Integration Required | Missing | Runtime explicitly fails `intent-lookup`. |
| Assign Manager | Builder Only | Builder Only | Missing | Runtime fails pending. |
| Create Lead | Integration Required | Integration Required | Missing | Runtime fails pending. |
| API Request | Integration Required | Integration Required | Blocked | Allowlist exists but adapter missing. |
| Human Handoff | Ready | Integration Required / Partial Ready | Partial | Marks handed_off only; no assignment/bot suppression. |
| Wait | Builder Only | Builder Only | Partial | Sets waiting delay; no scheduler/resume. |
| Stop Flow | Ready | Ready | Exists | Stops/completes run. |
| AI Reply | Builder Only | Builder Only or Integration Required | Missing | Runtime fails pending. |
| AI Intent Detection | Builder Only | Builder Only or Integration Required | Missing | Runtime fails pending. |

Additional finding:

- Backend runtime events still use the generic `runtime_pending` event type/copy. The UI label was replaced, but runtime analytics terminology was not.

## 12. Runtime Engine Status

Overall result: basic runtime skeleton exists; production readiness is partial.

| Runtime piece | Status | File | Production readiness |
| --- | --- | --- | --- |
| Webhook verification | Exists | `api/meta/whatsapp/webhook`, `api/whatsapp/webhook` | Partial; GET verify token works. |
| Webhook receiver | Exists | same | Partial; parses safely and returns 200. |
| Inbound normalization | Exists | `whatsapp-flow-engine.ts` | Partial; handles text, interactive, and media placeholders. |
| Tenant mapping | Partial | `whatsapp-flow-engine.ts` | High risk; falls back to `tenant-gigxomi`. |
| Flow matching | Partial | `whatsapp-flow-engine.ts` | Active/deployed score-based matching only. |
| FlowRun persistence | File-backed | `whatsapp-runtime-store.ts` | Not production safe. |
| FlowEvent persistence | File-backed | `whatsapp-runtime-store.ts` | Not production safe. |
| Node executor | Partial | `whatsapp-flow-engine.ts` | Basic nodes only; advanced nodes fail. |
| WhatsApp sender | Exists | dummy platform stores | Partial; official payloads exist. |
| Interactive reply continuation | Exists | `whatsapp-flow-engine.ts` | Partial but functional for waiting runs. |
| Human handoff | Partial | `whatsapp-flow-engine.ts` | No real assignment/suppression. |
| Duplicate prevention | Partial | `whatsapp-runtime-store.ts` | File-backed inbound ID check. |
| Error logging | Partial | console/runtime events | Needs structured production logging. |
| Runtime analytics | Partial | runtime store | Needs DB-backed event pipeline. |

Runtime limits found:

- `MAX_EXECUTION_STEPS = 25`.
- Seen-node loop guard.
- API Request allowlist gate via `WHATSAPP_FLOW_API_ALLOWLIST`, followed by a hard fail because no reviewed adapter exists.

## 13. WhatsApp API Status

Status: official WhatsApp Cloud API sending is partially wired server-side.

What exists:

- Text sender posts official Cloud API text payload.
- Button sender posts official interactive button payload with max 3 buttons.
- List sender posts official interactive list payload with 1-10 row validation.
- CTA URL sender posts official `cta_url` payload.
- Template sender posts by template name/language.
- Sender returns `local-only` when phone number ID/access token are missing.
- Flow builder frontend does not expose WhatsApp access tokens.

Required env vars:

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `META_APP_SECRET`
- `META_APP_ID`
- Current runtime allowlist: `WHATSAPP_FLOW_API_ALLOWLIST`

Gaps:

- Critical: WhatsApp webhook POST does not verify `X-Hub-Signature-256` using `META_APP_SECRET`.
- High: Multi-tenant WhatsApp credentials appear stored in dummy platform snapshot state with `accessToken` fields; no audited encrypted credential model was found in this flow module.
- High: Unknown WhatsApp number/WABA fallback to `tenant-gigxomi` is unsafe.
- Medium: Template approval status is not checked from Meta before publish.
- Medium: Media execution nodes are not part of the current minimum runtime.

## 14. DB / Storage Status

Overall result: not production safe for flow builder/runtime persistence.

| Data area | Status | Evidence | Risk |
| --- | --- | --- | --- |
| Flows | File-backed | `.gigxomi/super-admin-whatsapp-flows.json` | Critical |
| Flow versions | Missing | No Prisma model/route found | Critical |
| Nodes/edges/settings | File-backed inside flow JSON | flow store | Critical |
| Flow runs | File-backed | `.gigxomi/whatsapp-runtime-engine.json` | Critical |
| Flow events | File-backed | runtime store | Critical |
| Contacts | Partial | dummy platform / app payload structures | Medium |
| Conversations | Partial DB-backed if `DATABASE_URL` exists | `AppConversation` payload store; fallback disk | High/Medium |
| Messages | Partial | `MessageEvent` exists; dummy payloads also used | Medium |
| WhatsApp credentials | Partial dummy state | `DummyWhatsAppConnectionState.accessToken` | High |
| Analytics events | File-backed runtime events | runtime store | High |
| Audit logs | Missing | no flow audit table/route | High |

Git ignore evidence:

- `.gigxomi/super-admin-whatsapp-flows.json` and `.gigxomi/whatsapp-runtime-engine.json` are ignored by `.gitignore`.

Prisma schema evidence:

- `Tenant`, `Lead`, `Conversation`, `MessageEvent`, and `AppConversation` exist.
- Dedicated `Flow`, `FlowVersion`, `FlowRun`, and `FlowEvent` models were not found.

## 15. Security / Permission Risks

| Severity | Risk | Evidence |
| --- | --- | --- |
| Critical | WhatsApp webhook POST lacks Meta signature validation | GET verify token exists; POST does not validate `X-Hub-Signature-256`. |
| Critical | Flow/runtime persistence is file-backed | `.gigxomi` JSON is not safe for production. |
| High | Unmapped inbound messages fall back to `tenant-gigxomi` | Runtime resolver returns default tenant. |
| High | Credentials are not in an audited encrypted credential store | Dummy WhatsApp state includes `accessToken`. |
| High | Server validation is weaker than client validation | Publish API blocks only partial rule set. |
| High | Human handoff does not prevent bot-human conflict | No bot-disabled flag or actual queue assignment. |
| Medium | Future agency access lacks tenant-scoped APIs | Current APIs are Super Admin only. |
| Medium | Delete/publish actions lack audit trail | Confirmation and role checks exist, no durable audit. |
| Medium | API Request node is safely blocked but incomplete | Allowlist gate exists; reviewed adapter missing. |
| Low | Direct webhook GET exposes connection status booleans | Does not expose tokens, but reveals status metadata. |

## 16. Responsive / Browser Risks

| Severity | Risk | Notes |
| --- | --- | --- |
| Medium | No browser QA performed | Full UI usability must still be confirmed interactively. |
| Medium | Fullscreen topbar may clip | Action row uses `overflow: hidden` before wrap breakpoint. |
| Medium | Keyboard delete may be focus-sensitive | Custom wrapper handler needs click testing. |
| Medium | Tablet lacks true collapsible side panels | Layout reflows instead. |
| Low | Mobile disables full editing | Acceptable if desktop editing is expected. |

## 17. Lint / Build / Typecheck Results

| Command | Result | Notes |
| --- | --- | --- |
| `cmd /c npm run lint` | Passed | ESLint exit code 0. |
| `cmd /c npx tsc --noEmit` before build | Failed | TS6053 missing `.next/types/...` files because `tsconfig.json` includes generated `.next/types`. |
| `cmd /c npm run build` | Passed | Next build compiled, typechecked, and generated routes/pages. |
| `cmd /c npx tsc --noEmit` after build | Passed | Build regenerated `.next/types`; direct typecheck then passed. |
| `cmd /c npm test --if-present` | Passed/no tests run | `package.json` has no `test` script. |

Conclusion:

- Lint and production build pass.
- Standalone typecheck depends on generated `.next/types`; run build first or adjust release typecheck strategy.

## 18. Go-Live Blockers

Critical: must fix before live

- Add DB-backed `Flow`, `FlowVersion`, `FlowRun`, `FlowEvent`, and flow audit-log persistence.
- Add WhatsApp webhook POST signature validation using `META_APP_SECRET` and `X-Hub-Signature-256`.
- Remove unsafe fallback to `tenant-gigxomi` for unmapped WhatsApp phone/WABA IDs.
- Fix `intent-lookup` capability/runtime mismatch, or mark it non-ready until runtime exists.

High: should fix before client use

- Make server validation match client publish-blocking validation.
- Implement real human handoff assignment, queue mapping, and bot suppression.
- Move WhatsApp credentials into encrypted server-side credential storage with rotation.
- Add dedicated publish, validate, duplicate, pause/unpublish, and versioning APIs.
- Replace backend `runtime_pending` event naming/copy with specific capability states.
- Browser-test fullscreen, node library scroll, right panel, minimap, Fit View, and keyboard delete.

Medium: can launch with limitation if clearly disclosed

- API Request, Create Lead, Assign Manager, AI Reply, and AI Intent Detection remain non-executable or adapter-gated.
- Runtime analytics are local/file-backed.
- Right-click toolbar is safe but not a true cursor-positioned context menu.
- Tablet layout is reflow-based, not collapsible-panel based.

Low: polish

- Improve topbar overflow behavior.
- Add richer edge actions.
- Add clearer protected-flow label for OTP flow.

## 19. Recommended Fix Order

1. Add DB-backed flow/version/run/event/audit persistence and WhatsApp webhook signature validation.
2. Remove default tenant fallback and require connected WhatsApp number mapping before executing flows.
3. Share validation rules between client and server and enforce them on publish.
4. Correct node capability truth: `intent-lookup`, condition `equals`, human handoff, and backend `runtime_pending` terminology.
5. Add dedicated validate/publish/duplicate/delete audit/version endpoints.
6. Complete runtime adapters for handoff, wait scheduler, lead creation, API request, and AI nodes.
7. Run browser QA across fullscreen, list CRUD, node actions, validation, publish, responsive states, and zoom levels.
8. Polish topbar overflow, true context menu positioning, protected-flow labels, and edge actions.

## 20. Final Audit Verdict

The WhatsApp Flow Builder UI is substantially improved and the core save/validate/publish controls are wired, but this module should not be accepted as production-ready yet.

Builder UI status:

- Usable for internal Super Admin drafting and demo-level flow editing after browser QA.
- Not production-ready for customer/agency use until persistence, validation parity, runtime truth, and webhook security blockers are fixed.

Runtime status:

- Basic WhatsApp runtime skeleton exists and can execute some official Cloud API message nodes.
- Runtime is not production-ready because flow/run/event persistence is file-backed, webhook signature validation is missing, tenant fallback is unsafe, and several node statuses overstate runtime support.

Required honesty statement:

- Builder UI is ready for internal QA, runtime execution backend and production persistence still need hardening before live release.
