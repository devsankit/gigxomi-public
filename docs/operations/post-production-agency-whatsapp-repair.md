# Post Production Work Dewas WhatsApp repair

This runbook applies the one-time data repair after the application release. The repair is dry-run by default, aborts on unrelated phone/email owners, and backs up the local WhatsApp state before apply mode changes data.

## Persistent VPS configuration

Add these values to the production environment managed by PM2 or the VPS secret manager. Do not commit them to an environment file in the repository.

```text
GIGXOMI_PUBLIC_AUTH_WHATSAPP_TENANT_ID=<canonical tenant printed by dry-run>
GIGXOMI_PUBLIC_AUTH_WHATSAPP_NUMBER=+919981807309
GIGXOMI_PUBLIC_AUTH_WHATSAPP_PHONE_NUMBER_ID=<Meta phone-number ID for this line>
GIGXOMI_POST_PRODUCTION_FIXED_OTP_HASH=<64-character lowercase SHA-256 hash>
```

Generate the hash outside the repository from the supplied permanent agency code. Store only the hash. Never put the clear code or agency password in source control, shell history, PM2 logs, or the repair report.

The agency password is needed only while apply mode runs. Supply it through `GIGXOMI_POST_PRODUCTION_AGENCY_PASSWORD`, run the repair, and remove that variable immediately afterward. It is stored in the database as an scrypt hash.

## Deployment order

1. Back up the production database and `.gigxomi` directory.
2. Deploy the application release and run `npm run db:migrate:deploy` followed by `npm run db:generate`.
3. Set the persistent public-auth variables above. Set the temporary agency-password variable only in the repair process environment.
4. Run `npm run auth:repair-post-production-agency` without `--apply`. Record the canonical tenant, conflict result, and historical conversation count. Dry-run must not change the database or state files.
5. Confirm the canonical tenant owns the Meta connection for `+919981807309`. If the dry-run reports an unrelated account or ambiguous owner, stop and investigate; do not force the script.
6. Run `npm run auth:repair-post-production-agency -- --apply` once. Run it a second time in dry-run mode and confirm no further historical conversations are proposed.
7. Remove the temporary password variable and restart the application with PM2 while updating its saved environment.

## Smoke tests

- Sign in to the super-admin page using the protected owner email/password. Confirm there is no WhatsApp OTP control and that public OTP endpoints reject the super-admin identity.
- Sign in to the agency with its phone and permanent agency code, then with its phone/email and supplied password. A newly issued fixed-code challenge must still expire and lock after five bad attempts.
- Request OTP for another user. Confirm a random code arrives from `+919981807309`; the permanent agency code must fail for that user.
- Send `Get OTP` from a user with a pending signup/login. Confirm the command appears in the Post Production Work Dewas inbox and the matching challenge is issued once.
- Send a normal inbound message to the agency Meta phone-number ID. Confirm it appears only in the canonical agency web/mobile inbox.
- Replay the same Meta message ID and confirm it is not processed twice. Send a fixture with an unknown or ambiguous phone-number ID and confirm it is stored with `routingStatus: quarantined` and creates no tenant conversation.
- Compare historical conversation/message/payment counts before and after repair. Only the proven WhatsApp candidates reported by dry-run may change tenant ownership.
