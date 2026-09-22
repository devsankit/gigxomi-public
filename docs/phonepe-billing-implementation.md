# PhonePe Billing Implementation Notes

## Required Environment Variables
- `PHONEPE_CLIENT_ID`
- `PHONEPE_CLIENT_SECRET`
- `PHONEPE_MERCHANT_ID`
- `PHONEPE_SALT_KEY`
- `PHONEPE_SALT_INDEX`
- `PHONEPE_ENV`
- `PHONEPE_WEBHOOK_USERNAME`
- `PHONEPE_WEBHOOK_PASSWORD`
- `APP_BASE_URL`
- `BILLING_JOB_SECRET`

## PhonePe URLs
- One-time webhook: `{APP_BASE_URL}/api/payments/phonepe/webhook`
- One-time return: `{APP_BASE_URL}/api/payments/phonepe/return`
- Autopay webhook: `{APP_BASE_URL}/api/subscriptions/phonepe/webhook`
- Autopay return: `{APP_BASE_URL}/api/subscriptions/phonepe/return`

## Registration Flow
- Free packages activate immediately after OTP verification and create an active `user_subscriptions` record.
- One-time paid packages create a pending subscription and PhonePe payment transaction after OTP, then activate only after server-side PhonePe status/webhook success.
- Recurring packages create a pending subscription and PhonePe Autopay mandate setup after OTP, then activate only after verified setup/subscription success.

## Dynamic Package Compare
- `package_features` controls feature labels, types, grouping, ordering, and where features appear.
- `package_feature_values` controls per-package values and short display text.
- Registration cards and selected package summaries render from package metadata plus selected-summary and compare feature flags.

## Renewal Tracking
- Recurring subscriptions store merchant/provider subscription IDs, mandate state, subscription state, frequency, max amount, auto-debit, next billing date, pause/cancel/revoke fields, and timeline events.
- The protected renewal route `POST /api/billing/jobs/process-renewals` uses `BILLING_JOB_SECRET` and creates PhonePe redemption notify events for due subscriptions.

## Manual PhonePe Dashboard Setup
- Enable PhonePe Standard Checkout for one-time paid packages.
- Enable PhonePe Autopay/subscriptions for recurring packages.
- Register both webhook URLs above with the configured webhook username/password.
- Configure sandbox/production credentials in environment variables.
- Confirm exact Autopay endpoint access and payload fields with the PhonePe account before production launch.
