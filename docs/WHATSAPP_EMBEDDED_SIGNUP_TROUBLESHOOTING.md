# WhatsApp Embedded Signup Troubleshooting

Updated: 2026-06-02

## Purpose

Use this runbook when Meta Embedded Signup completes but Gigxomi still says the WhatsApp line is not connected, or when Meta Business Manager shows the phone number as `Pending`.

Do not redesign the onboarding flow while debugging this path. Trace the chain, identify the exact stop, and patch only the broken handoff.

## Current Onboarding Chain

1. Browser opens Meta Embedded Signup popup.
2. Browser receives Meta `WA_EMBEDDED_SIGNUP` `FINISH` postMessage.
3. Browser receives OAuth authorization code from `FB.login`.
4. Browser posts `/api/admin/whatsapp/finalize-signup`.
5. Backend exchanges OAuth code for an access token.
6. Backend discovers or preserves WABA and Cloud API phone number ID.
7. Backend saves connection state.
8. Backend registers the phone number with the submitted PIN, or the temporary default PIN `889900` when no PIN is submitted.
9. Backend subscribes the app to the WABA webhook.
10. Frontend refreshes connection state and marks the line connected.

## Important Lesson From June 2026 Incident

The issue was not the Meta fallback URL.

Evidence that fallback/redirect was working:

- Console logged `STEP_1_POPUP_OPENED`.
- Console logged `STEP_2_POSTMESSAGE_RECEIVED`.
- Raw Meta payload contained `phone_number_id`.
- Raw Meta payload contained `waba_id`.
- Console logged `STEP_3_AUTH_CODE_RECEIVED`.
- Console logged `META_AUTH_CODE_RECEIVED`.
- Network showed `/api/admin/whatsapp/finalize-signup` returning `200 OK`.

The first real stop was browser payload parsing:

- Meta sent `data` as a nested JSON string shaped like `{"data":{"phone_number_id":"...","waba_id":"..."}}`.
- Gigxomi parsed the signal as `data: {}`.
- Fix: `src/lib/gigxomi/meta-whatsapp-signup.ts` now recursively unwraps nested JSON strings and nested `data` wrappers.

The second real stop was production snapshot cache coherence:

- Backend response showed `captured.hasAccessToken: true` and `captured.hasWabaId: true`.
- But `connection.accessToken`, `connection.wabaId`, and `connection.phoneNumberId` returned blank.
- Cause: with `DATABASE_URL`, WhatsApp connection state still lives in the legacy snapshot portion. Sequential writes could reread stale cached legacy state.
- Fix: `src/lib/gigxomi/dummy-platform-db-store.ts` updates `legacySnapshotCache` after writing a snapshot.

The third operational improvement was PIN handling:

- Meta phone registration was definitely executed. The exact response was visible in `/api/admin/whatsapp/finalize-signup`:
  - `registrationAttempted: true`
  - `registrationError: "(#100) The parameter pin is required."`
  - `metaRegistrationResponse.status: 400`
  - `metaRegistrationResponse.payload.error.code: 100`
- Final root cause for the post-signup activation stop: Meta required the Cloud API registration PIN.
- Temporary production fix: default registration PIN is `889900` when no PIN is submitted.
- A typed 6-digit PIN still overrides the default.
- Finalize and manual register paths both use this default/override behavior, preserve saved IDs, and still subscribe the webhook when token/WABA/phone ID exist.
- The PIN-required error must remain visible in saved state until phone registration succeeds; webhook success alone must not hide it.

The fourth operational improvement was webhook subscription WABA rediscovery:

- If Meta rejects `/{wabaId}/subscribed_apps` with an unsupported object / object not found error, do not assume the webhook URL is wrong.
- Treat the connected `phoneNumberId` plus valid access token as the source of truth.
- Rediscover the WABA that owns the phone number through Meta Graph, update the saved WABA, and retry webhook subscription.
- This is handled by `src/lib/gigxomi/whatsapp-onboarding-subscribe.ts` and used by finalize, manual register, and manual webhook subscribe routes.

## Key Files

- `src/components/admin/admin-dummy-controls.tsx`
  - Opens popup.
  - Receives FINISH and auth code.
  - Posts finalize payload.
  - Refreshes connection state.
  - Manual register button allows blank PIN; backend uses default PIN `889900`.
  - Compact setup card shows `Register with PIN` when Meta returns a PIN-required error.
  - Shows `Connected` when `accessToken + phoneNumberId` exist.
  - Shows `Disconnected` when the plugin is enabled but usable Meta credentials are missing and no signup is in progress.
- `src/lib/gigxomi/meta-whatsapp-signup.ts`
  - Normalizes Meta Embedded Signup payloads.
  - Must unwrap nested stringified `data` payloads.
- `src/app/api/admin/whatsapp/finalize-signup/route.ts`
  - Exchanges OAuth code.
  - Saves access token, WABA, phone number ID.
  - Registers the phone with submitted PIN or default PIN `889900`.
  - Subscribes webhook.
  - Returns `registrationAttempted`, `registrationError`, and `metaRegistrationResponse` for browser inspection.
- `src/app/api/admin/whatsapp/register-phone/route.ts`
  - Manual retry endpoint.
  - PIN is optional in the UI; blank PIN uses default PIN `889900`.
- `src/app/api/admin/whatsapp/subscribe-webhook/route.ts`
  - Manual webhook subscription retry endpoint.
  - Rediscoveres the phone-owning WABA if the saved WABA is rejected by Meta.
- `src/lib/gigxomi/whatsapp-onboarding-subscribe.ts`
  - Shared webhook subscription helper.
  - Retries subscription after rediscovering the WABA from `phoneNumberId`.
- `src/lib/gigxomi/meta-whatsapp-auth.ts`
  - Meta Graph code exchange, WABA/phone discovery, phone registration, webhook subscription.
- `src/lib/gigxomi/dummy-platform-file-store.ts`
  - Refreshes WhatsApp state from Meta.
  - Must preserve existing captured `phoneNumberId` when Graph summary temporarily omits it.
- `src/lib/gigxomi/dummy-platform-db-store.ts`
  - Keeps legacy snapshot cache coherent after writes in production.

## Audit Logs To Look For

Expected successful path:

- `META_FINISH_RECEIVED`
- `META_AUTH_CODE_RECEIVED`
- `META_AUTH_EXCHANGE_START`
- `META_AUTH_EXCHANGE_SUCCESS`
- `META_WABA_DISCOVERED`
- `META_PHONE_DISCOVERED`
- `META_CONNECTION_SAVED`
- `REGISTER_PHONE_REQUEST`
- `REGISTER_PHONE_RESPONSE`
- `META_PHONE_REGISTER_SUCCESS`
- `REGISTER_PHONE_SUCCESS`
- `META_WEBHOOK_SUBSCRIBE_SUCCESS`
- `META_ONBOARDING_COMPLETE`
- `META_WEBHOOK_SUBSCRIBE_REDISCOVERY_START` when saved WABA subscription fails and phone-based discovery starts
- `META_WEBHOOK_SUBSCRIBE_REDISCOVERED_WABA` when Gigxomi finds a different phone-owning WABA
- `META_WEBHOOK_SUBSCRIBE_REDISCOVERY_NO_MATCH` when phone-based rediscovery cannot find a better WABA

Failure indicators:

- `META_AUTH_EXCHANGE_FAILED`
- `META_PHONE_REGISTER_FAILED`
- `WEBHOOK_SUBSCRIBE_FAILED`
- A no-PIN registration attempt can fail if Meta still requires a PIN or display-name review has not completed; preserve connection state and inspect `registrationError`.
- If Meta returns `(#100) The parameter pin is required`, the failing step is phone registration, not Embedded Signup, token exchange, WABA discovery, webhook URL, or display-name review.
- `FAILED_AT_STEP_3_AUTH_CODE_RECEIVED`
- `FAILED_AT_STEP_6_WABA_FETCH`
- `FAILED_AT_STEP_7_PHONE_NUMBER_FETCH`
- `FAILED_AT_STEP_9_WEBHOOK_SUBSCRIBE`

## Browser Checks

Open DevTools Console and verify:

- Raw `STEP_2_POSTMESSAGE_RECEIVED` contains `phone_number_id` and `waba_id`.
- Parsed signal data also contains `phone_number_id` and `waba_id`.
- `STEP_3_AUTH_CODE_RECEIVED` appears with an OAuth code.

Open DevTools Network and inspect:

- Request: `/api/admin/whatsapp/finalize-signup`
- Status should be `200 OK`.
- Payload should include:
  - `authorizationCode`
  - `wabaId`
  - `phoneNumberId`
  - `signupPayload.waba_id`
  - `signupPayload.phone_number_id`
  - `signupSignal.data.waba_id`
  - `signupSignal.data.phone_number_id`
- Response should include:
  - `ok: true`
  - `connection.accessToken` populated
  - `connection.wabaId` populated
  - `connection.phoneNumberId` populated
  - `captured.hasPhoneNumberId: true`
  - `registrationAttempted: true`
  - `metaRegistrationResponse`

If Network loses the response body after navigation, check Console for:

- `[WHATSAPP_ONBOARDING] FINALIZE_SIGNUP_RESPONSE`

Ignore browser-extension errors such as `content.js Cannot convert undefined or null to object`; they are not from Gigxomi.

## Pending Phone Number Diagnosis

If Meta Business Manager shows phone status `Pending`, distinguish these cases:

- Connected state:
  - Gigxomi has `accessToken` and `phoneNumberId`.
  - Dashboard should show `Connected`.
  - This is independent of the Meta display-name review label.
- Disconnected state:
  - Plugin is enabled but Gigxomi does not have a usable `accessToken + phoneNumberId` pair.
  - Dashboard should show `Disconnected`.
  - Reconnect WhatsApp to capture a fresh token and phone number ID.
- Display name review pending:
  - Gigxomi has token, WABA, phone ID, webhook subscribed.
  - No registration error.
- Phone registration not executed:
  - No PIN was provided.
  - Log should show `META_PHONE_REGISTER_SKIPPED`.
  - This is allowed; Embedded Signup may provision the line automatically.
- Phone registration failed:
  - Log shows `META_PHONE_REGISTER_FAILED`.
  - Response contains `registrationError`.
  - If the error is `(#100) The parameter pin is required`, retry with the line PIN or leave blank to use default `889900`.
- Onboarding state save failed:
  - `finalize-signup` response has captured fields true but `connection.accessToken`, `connection.wabaId`, or `connection.phoneNumberId` blank.
  - Check legacy snapshot cache and follow-up status updates.

## Safe Fix Rules

- Preserve already captured `phoneNumberId` when Meta Graph summary omits phone details temporarily.
- Preserve `accessToken`, `wabaId`, and `phoneNumberId` through every follow-up status/note update.
- Treat PIN input as optional in the UI, but send the submitted PIN or default PIN `889900` to Meta registration.
- Retry webhook subscription with the WABA rediscovered from `phoneNumberId` when Meta rejects the saved WABA.
- Do not report missing auth/WABA/phone data after `/finalize-signup` receives those fields.
- Do not change webhook URLs or Meta app config unless the browser never receives FINISH or auth code.
- Do not let webhook subscription success erase a remaining phone-registration error.
- Do not equate Meta display name `Pending` with Gigxomi disconnected. Gigxomi connected is `accessToken + phoneNumberId`.

## Commits From Incident

- `11150ad7 fix: parse whatsapp embedded signup payload`
- `5432a985 fix: persist whatsapp snapshot cache after save`
- `e1c86e1f fix: make whatsapp pin registration optional`
- `66e85691 fix: rediscover whatsapp waba for webhook subscription`
- `584d645e fix: attempt whatsapp registration without pin`
- `ac1809b4 fix: activate whatsapp line on status refresh`
- `b686455d chore: audit whatsapp phone registration`
- `70ecedce fix: stabilize whatsapp setup hydration`
- `0d3d2994 chore: expose whatsapp registration response`
- `68860d1f fix: show whatsapp line connected after token capture`
- `26131624 chore: preserve whatsapp finalize response audit`
- `2e1acdba fix: continue deploy after ssh preflight timeout`
- `db56ae22 fix: use default whatsapp registration pin`

## Final Resolution Snapshot

Final observed successful state:

- Gigxomi dashboard showed `Connected`.
- Meta WhatsApp Manager showed phone status `Connected`.
- Connected number: `+1 555-989-7999`.
- WABA ID in response: `1306613631024662`.
- Phone number ID in response: `1150616128134501`.
- `finalize-signup` response showed:
  - `captured.hasAuthorizationCode: true`
  - `captured.hasAccessToken: true`
  - `captured.hasBusinessId: true`
  - `captured.hasWabaId: true`
  - `captured.hasPhoneNumberId: true`
  - `registrationAttempted: true`
  - `registrationError: "(#100) The parameter pin is required."`

The actual activation fix was sending a registration PIN. The default app PIN is currently `889900`.
