# Protected production messaging core

WhatsApp and Instagram receive/send behavior is production-critical. The protected
surface includes `src/app/api/meta`, `src/app/api/conversations`,
`src/components/chat`, and the messaging/assignment modules under
`src/lib/gigxomi`.

Do not modify that surface for adjacent mobile, UI, billing, or refactor work.
Only change it when the user explicitly requests a messaging or chat-assignment
change. Before publishing any such change, preserve channel isolation and pass all
five messaging gates with `npm run test:application-stability`, followed by lint,
the production build, and database verification. Never bypass production webhook
signatures or fall back to a default tenant for an unknown Meta recipient.
