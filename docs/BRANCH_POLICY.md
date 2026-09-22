# Gigxomi Branch Policy

This repository carries both the production web/backend app and the Expo mobile app. Keep release work split so a mobile fix cannot accidentally redeploy the web app, and a web deploy cannot ship half-finished mobile changes.

## Locked Branches

- `main`: production web app, backend/API routes, Prisma/database changes, server integrations, and deployment workflow changes.
- `codex/mobile-app`: Expo mobile app, Android release checks, AAB audit tooling, and mobile-only release guardrails.
- `sales`: long-lived sales team module branch for `/sales`, sales APIs, sales Prisma models, SalesKing-style commission/team/payout logic, and super-admin sales controls. Merge this branch into `main` only after the web/backend gates pass.

## Rules Before Push

- Do not commit secrets, access tokens, generated AAB files, upload certificates, local logs, or `.env` files.
- Keep mobile UI/native changes on `codex/mobile-app`.
- Keep sales-team module changes on `sales` until they are reviewed and merged into `main`.
- Keep web/backend/API/business logic changes on `main`.
- Split mixed work into separate commits and PRs when a feature needs both backend and mobile changes.
- Run the relevant gate before pushing:
  - Web/backend: `npm run lint` and `npm run build`
  - Sales module: `npm run lint`, `npm run build`, and `npm run db:generate`
  - Mobile: `npm run mobile:readiness`, `npm run typecheck` in `mobile-app`, and `npx expo export --platform android` in `mobile-app`

## Local Guard

Use `npm run branch:check` while working to see scope warnings. Use `npm run branch:check:strict` before a clean push when the branch should be locked.
