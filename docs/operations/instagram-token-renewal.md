# Instagram Inbox Token Renewal

Gigxomi uses Instagram API with Instagram Login. Meta does not issue a literally non-expiring token for this flow. The supported durable setup is a 60-day long-lived Instagram user token that is refreshed before it expires.

## Application flow

1. `/api/meta/instagram/oauth/callback` exchanges the authorization code for a short-lived token.
2. Server-side code immediately exchanges that token through `graph.instagram.com/access_token` for a long-lived token.
3. The connection stores the long-lived token plus its expiry and refresh timestamps.
4. Customer-lane sends renew a token when it enters the final 14 days of validity.
5. `/api/internal/instagram/refresh-tokens` performs the same renewal for every connected tenant. It accepts only a bearer token matching `INSTAGRAM_TOKEN_REFRESH_SECRET` or `CRON_SECRET`.
6. The VPS deploy job installs a daily cron call to that internal endpoint. If the dedicated secret is missing, deployment generates it in the server `.env` before restarting the app.

## One-time recovery after rollout

The previously stored token has already expired and cannot be refreshed. After deploying this change, open **Admin → Integrations → Instagram Inbox** and choose **Reconnect Instagram** once. That authorization creates the first tracked long-lived token; renewal is automatic afterward.

Revoking app access, changing the Instagram password, removing required permissions, or leaving a token unused without the scheduled job can still require reconnection.
