# Chat channel stability contract

WhatsApp is protected production behavior. Instagram changes must not modify WhatsApp tenant ownership, phone-number IDs, tokens, templates, conversations, or delivery state.

The receive/send core is protected production infrastructure. Do not alter the
WhatsApp or Instagram webhook routes, signature verification, tenant routing,
message ingestion, outbound delivery, realtime publication, or editor assignment
contract unless the user explicitly requests that production behavior change.

Every deployment now runs five independent gates before publishing: webhook
authentication, tenant routing and dedupe, outbound/privacy behavior, realtime
inbox behavior, and editor search/assignment behavior. Shared auth/chat/webhook
changes are mergeable only when all of these pass:

```powershell
npm run test:chat-stability
npm run lint
npm run build
npm run db:verify
```

The executable stability suite runs both WhatsApp auth/routing regressions and Instagram routing/token regressions. Unknown or ambiguous Meta recipient IDs must be quarantined; they must never fall back to a default tenant. Normal public authentication creates an intent first and issues an OTP only after the registered number sends `Get OTP` to the canonical agency WhatsApp line.

Production rollout order is fixed: back up PostgreSQL and `.gigxomi`, verify WhatsApp login/chat first, and only then enable Instagram for that tenant. An Instagram failure is isolated by disabling its tenant connection; it must not overwrite or roll back WhatsApp state.
