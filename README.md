# Gigxomi

Gigxomi is a video editor/freelancer marketplace plus SaaS operating system for agencies, managers, freelancers/editors, and the platform owner.

Before starting product, UI, role, API, billing, WhatsApp, or go-live work, read:

- `docs/GIGXOMI_BRAND_GUIDELINES.md` before any UI/design/frontend work.
- `docs/GIGXOMI_MASTER_PRODUCT_OPERATING_BLUEPRINT.md`
- `docs/WHATSAPP_EMBEDDED_SIGNUP_TROUBLESHOOTING.md` for Meta Embedded Signup, WABA, phone ID, PIN, webhook subscription, and connection-save glitches.
- `docs/meta-whatsapp-embedded-signup.md` for the active Meta app/config IDs, OAuth redirect, webhook configuration, required secrets, connected-state checks, and future app replacement procedure.

That file is the consolidated source of truth for:

- product direction
- role/page architecture
- shared UI system
- design tokens and visual guardrails
- core marketplace business circuits
- PhonePe/package/payment rules
- WhatsApp flow-builder readiness
- onboarding expectations
- go-live blockers
- phased implementation order

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Mobile App

The existing Next.js web app remains in the repository root. The Expo React Native app lives in `apps/mobile`.

Use Expo Go for live Android testing:

```bash
cd apps/mobile
npm install
npx expo start
```

For a later direct-install Android APK, use the EAS `preview` profile from `apps/mobile`.

## Standard Checks

For normal UI/docs changes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

For database/schema/API changes:

```bash
npm run db:migrate:deploy
npm run db:generate
npm run db:verify
npm run lint
npx tsc --noEmit
npm run build
```

## Guardrails

- Do not disturb `ChatWorkspace` unless explicitly scoped.
- Do not change auth, routes, APIs, database logic, billing logic, or business rules during UI-only work.
- Use shared components and design tokens.
- Do not hardcode colors, spacing, radius, shadows, or typography in page components.
- Do not implement all roles in one giant pass.
