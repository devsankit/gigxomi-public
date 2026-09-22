# Meta WhatsApp Embedded Signup

Last verified in code: 2026-06-22

This is the source of truth for Gigxomi's Meta WhatsApp Embedded Signup configuration. Update this document in the same change whenever the Meta application, Facebook Login for Business configuration, public domain, callback route, or webhook route changes.

## Current production configuration

| Setting | Value |
| --- | --- |
| Meta application ID | `948301758190635` |
| Facebook Login for Business configuration ID | `1982640385723187` |
| Public application base URL | `https://gigxomi.com` |
| OAuth redirect URI | `https://gigxomi.com/meta/whatsapp/callback` |
| Canonical WhatsApp webhook callback | `https://gigxomi.com/api/meta/whatsapp/webhook` |
| Embedded Signup version | `v4` |
| Feature type | `whatsapp_business_app_onboarding` |
| Business portfolio ID | `1359490001648220` |
| Session info version | `3` |
| Graph API version configured by the application | `v25.0` |

The direct onboarding URL supplied for this application is:

```text
https://business.facebook.com/messaging/whatsapp/onboard/?app_id=948301758190635&config_id=1982640385723187&extras=%7B%22setup%22%3A%7B%22business%22%3A%7B%22id%22%3Anull%2C%22name%22%3Anull%2C%22email%22%3Anull%2C%22phone%22%3A%7B%22code%22%3Anull%2C%22number%22%3Anull%7D%2C%22website%22%3Anull%2C%22address%22%3A%7B%22streetAddress1%22%3Anull%2C%22streetAddress2%22%3Anull%2C%22city%22%3Anull%2C%22state%22%3Anull%2C%22zipPostal%22%3Anull%2C%22country%22%3Anull%7D%2C%22timezone%22%3Anull%7D%2C%22phone%22%3A%7B%22displayName%22%3Anull%2C%22category%22%3Anull%2C%22description%22%3Anull%7D%2C%22preVerifiedPhone%22%3A%7B%22ids%22%3Anull%7D%2C%22solutionID%22%3Anull%2C%22whatsAppBusinessAccount%22%3A%7B%22ids%22%3Anull%7D%7D%2C%22featureType%22%3A%22whatsapp_business_app_onboarding%22%2C%22sessionInfoVersion%22%3A%223%22%2C%22version%22%3A%22v4%22%7D
```

Gigxomi adds `response_type=code` and uses `https://gigxomi.com/meta/whatsapp/callback` for both the OAuth redirect and fallback redirect. The normal in-app launch uses the Facebook SDK with the same app ID and configuration ID. New onboarding deliberately sends null business/WABA prefill values so IDs from the replaced Meta portfolio cannot leak into the new flow.

## Values to enter in Meta for Developers

### Facebook Login for Business

- Add `gigxomi.com` to the allowed JavaScript SDK domains/origins where the Meta product requests it.
- Add this exact Valid OAuth Redirect URI:

```text
https://gigxomi.com/meta/whatsapp/callback
```

- Keep the login configuration tied to application `948301758190635` and configuration `1982640385723187`.
- The application secret must belong to this same application. An app secret from the replaced application cannot exchange a code issued to the new application.
- Keep the app secret only in the server environment as `META_APP_SECRET`. Never place it in client code, documentation, logs, or Git.
- Public OTP prefers `PUBLIC_AUTH_OTP_TENANT_ID`. If that tenant is not ready, Gigxomi selects a healthy connected WhatsApp tenant. `NEXT_PUBLIC_PUBLIC_AUTH_OTP_NUMBER` controls the number used by the **Open WhatsApp and Get OTP** link.

### WhatsApp webhook

Enter this callback URL:

```text
https://gigxomi.com/api/meta/whatsapp/webhook
```

For the verify token, use one of these matching server-side sources:

1. Preferred: set a high-entropy `WHATSAPP_VERIFY_TOKEN` deployment secret and paste that exact value into Meta.
2. Tenant-managed fallback: copy the tenant's current verify token from **Admin > WhatsApp Control > Verify token** and paste it into Meta.

Do not commit the actual verify token, Meta app secret, authorization code, or access token to this document or to source control.

After Meta verifies the callback, subscribe the WhatsApp Business Account to the application and enable the webhook fields used by the product. At minimum, enable `messages`; enable template/status fields only when those events are consumed by the application.

The older `/api/whatsapp/webhook` route is retained only as a compatibility alias. New Meta configuration must use `/api/meta/whatsapp/webhook`.

## Required deployment environment

Set these values in the production deployment. Secret values must be server-only.

```dotenv
META_WHATSAPP_APP_ID=948301758190635
META_WHATSAPP_CONFIG_ID=1982640385723187
NEXT_PUBLIC_META_WHATSAPP_APP_ID=948301758190635
NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID=1982640385723187
NEXT_PUBLIC_APP_URL=https://gigxomi.com
META_APP_SECRET=<secret from Meta app 948301758190635>
WHATSAPP_VERIFY_TOKEN=<high-entropy secret also entered in Meta>
```

Optional compatibility names already supported by the application include `FACEBOOK_APP_ID`, `META_APP_ID`, `FACEBOOK_CONFIG_ID`, `META_CONFIG_ID`, `FACEBOOK_APP_SECRET`, and `GIGXOMI_META_APP_SECRET`. Prefer the names shown above for new deployments.

If webhook signature enforcement is enabled with `META_WEBHOOK_SIGNATURE_REQUIRED=1`, `META_APP_SECRET` must be correct because inbound POST requests are validated against the new application's signature.

## Runtime completion flow

1. An admin opens WhatsApp Control and launches Embedded Signup.
2. The browser initializes the Facebook SDK with app `948301758190635` and config `1982640385723187`.
3. Meta redirects or posts the result to `/meta/whatsapp/callback`.
4. Gigxomi captures the short-lived authorization code and returned WABA/phone metadata.
5. The server exchanges the code at Meta using the new app ID, the new app secret, and the exact redirect URI.
6. Gigxomi queries Meta for the Business, WABA, and phone-number IDs.
7. When an access token and WABA ID are present, Gigxomi calls the WABA `subscribed_apps` endpoint automatically.
8. The connection becomes **Ready for webhook** when a real phone-number ID is captured. The UI note confirms whether the webhook app subscription also succeeded.

An application appearing in Meta as connected does not by itself prove that Gigxomi is ready. Gigxomi needs all of the following:

- authorization-code exchange succeeded;
- access token belongs to app `948301758190635`;
- WABA ID was discovered;
- phone-number ID was discovered and is not a Business/portfolio/WABA ID;
- app subscription to the WABA succeeded;
- webhook verification succeeds with the same verify token;
- inbound webhook signatures validate when signature enforcement is enabled.

## Verification after deployment

### 1. Verify the public webhook is live

Opening the canonical webhook URL without Meta query parameters should return JSON containing `"endpoint":"WhatsApp webhook is live."`:

```text
https://gigxomi.com/api/meta/whatsapp/webhook
```

### 2. Verify the challenge handshake

Run this locally without saving the token in shell history where possible:

```bash
curl --get "https://gigxomi.com/api/meta/whatsapp/webhook" \
  --data-urlencode "hub.mode=subscribe" \
  --data-urlencode "hub.verify_token=<same token configured in Meta>" \
  --data-urlencode "hub.challenge=gigxomi-webhook-check"
```

Expected response body:

```text
gigxomi-webhook-check
```

### 3. Complete Embedded Signup

Use the in-app popup first. A successful run must populate the Business/WABA/phone details and clear any token-exchange error. The final UI state should be **Ready for webhook** once the phone-number ID is known.

### 4. Confirm inbound delivery

Send a WhatsApp message to the connected number and confirm:

- Meta reports a successful webhook delivery;
- WhatsApp Control records a recent inbound timestamp;
- the conversation appears in the Gigxomi inbox;
- `lastError` remains empty.

### 5. Confirm outbound delivery

Send a test reply from Gigxomi and confirm Meta returns a message ID and the message progresses through sent/delivered/read states when those status webhooks arrive.

## Replacing the Meta application or signup configuration later

Treat an app replacement as a credential boundary, not just an ID edit.

1. Create or select the new Meta application and Facebook Login for Business configuration.
2. Configure the exact OAuth redirect and canonical webhook callback from this document.
3. Replace both server and public app/config environment values.
4. Replace `META_APP_SECRET` with the secret belonging to the new application.
5. Update the current production table and direct onboarding URL in this document.
6. Update the production constants/migration in `src/lib/gigxomi/dummy-platform-store.ts` and client fallback in `src/components/admin/admin-dummy-controls.tsx`.
7. Deploy before running signup so the callback exchanges the code with the matching new secret.
8. Re-run Embedded Signup. Never reuse an authorization code or access token issued to the old application.
9. Re-verify the webhook and confirm the WABA app subscription.
10. Run the inbound and outbound checks above before removing the old application.

## Code ownership map

| Responsibility | File |
| --- | --- |
| Current app/config defaults and legacy-ID migration | `src/lib/gigxomi/dummy-platform-store.ts` |
| Facebook SDK Embedded Signup launch | `src/components/admin/admin-dummy-controls.tsx` |
| Browser OAuth callback/result relay | `src/app/meta/whatsapp/callback/page.tsx` |
| Server-side code exchange and finalization | `src/app/api/admin/whatsapp/finalize-signup/route.ts` |
| Meta Graph token exchange and WABA subscription | `src/lib/gigxomi/meta-whatsapp-auth.ts` |
| Canonical webhook verification and ingestion | `src/app/api/meta/whatsapp/webhook/route.ts` |
| Webhook signature verification | `src/lib/gigxomi/whatsapp-webhook-security.ts` |

## Troubleshooting

| Symptom | Most likely cause |
| --- | --- |
| Meta says redirect URI mismatch | The URI is not exactly `https://gigxomi.com/meta/whatsapp/callback` in the new app/config. |
| Authorization code is captured but no access token appears | `META_APP_SECRET` is missing or belongs to the replaced application. |
| Business captured but status does not reach Ready for webhook | Meta did not return/discover a valid phone-number ID or phone registration is incomplete. |
| Webhook verification returns 403 | Meta's verify token differs from `WHATSAPP_VERIFY_TOKEN` and the tenant token stored in WhatsApp Control. |
| Inbound POST returns a signature error | The request was signed by a different Meta app, or `META_APP_SECRET` is incorrect. |
| Signup works but webhook subscription fails | The token lacks access to the selected WABA or the new app was not granted/connected to that WABA. |
| Old portfolio appears during signup | Browser session or persisted connection still references old Meta assets; confirm the new app/config values, clear stale manual overrides, and relaunch signup. |
