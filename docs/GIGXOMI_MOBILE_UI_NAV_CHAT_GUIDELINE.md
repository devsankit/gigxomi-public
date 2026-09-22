# Gigxomi Mobile UI, Navigation, And Chat Guideline

This document is the source of truth for the Gigxomi Expo mobile app visual system. The mobile app is a second frontend for the same Gigxomi backend, APIs, roles, chats, services, projects, packages, and payments.

## Product Feel

Gigxomi mobile should feel premium, dark, fast, focused, creator/business-oriented, and trustworthy. It should not feel like a cheap neon app, gaming UI, or a copied messenger interface.

Use Telegram-level chat usability principles, but keep the interface visibly Gigxomi: black/charcoal surfaces, muted metadata, compact controls, and lime used only as a controlled accent.

## Color Tokens

```css
--gx-mobile-bg: #05070A;
--gx-mobile-bg-soft: #080D11;
--gx-mobile-surface: #0D1318;
--gx-mobile-surface-soft: #111920;
--gx-mobile-surface-elevated: #172129;

--gx-mobile-text-primary: #F4F7FA;
--gx-mobile-text-secondary: #B8C2CC;
--gx-mobile-text-muted: #7D8994;
--gx-mobile-text-disabled: #4F5B66;

--gx-mobile-primary: #B9F719;
--gx-mobile-primary-strong: #D7FF2F;
--gx-mobile-primary-soft: rgba(185,247,25,0.12);
--gx-mobile-primary-border: rgba(185,247,25,0.22);
--gx-mobile-primary-muted: #6B8F16;

--gx-chat-incoming-bg: #121A21;
--gx-chat-incoming-border: rgba(255,255,255,0.06);
--gx-chat-incoming-text: #F4F7FA;

--gx-chat-outgoing-bg: #22310F;
--gx-chat-outgoing-border: rgba(185,247,25,0.18);
--gx-chat-outgoing-text: #F4F7FA;

--gx-chat-outgoing-accent-bg: #B9F719;
--gx-chat-outgoing-accent-text: #05070A;

--gx-success: #22C55E;
--gx-warning: #F59E0B;
--gx-error: #EF4444;
--gx-info: #38BDF8;
```

Color usage rule: 80% dark neutral, 15% muted grey, 5% lime accent.

Lime is allowed for primary CTA, active tab indicator, unread badge, selected state, focus ring, small icon accent, and active send button. Do not use lime as default chat bubble, full footer, full section, or large card background.

## Floating Bottom Navigation

Use a floating rounded footer bar:

- Horizontal margin: 14 to 18px.
- Height: 62 to 72px.
- Radius: 26 to 32px.
- Background: `rgba(13,19,24,0.94)`.
- Border: `1px solid rgba(255,255,255,0.08)`.
- Shadow: subtle only, no glow.
- Safe-area aware.
- Hidden when the keyboard would block mobile inputs.

Active item:

- Soft lime surface: `rgba(185,247,25,0.12)`.
- Border: `rgba(185,247,25,0.22)`.
- Icon lime or primary text.
- Label visible.

Inactive item:

- Transparent.
- Icon/text: `#7D8994`.
- Label can stay compact or hidden depending width.

Current implemented mobile routes are `Work`, `Services`, `Chat`, and `Settings`. Role config supports 3 to 5 destinations, but unsupported future destinations must not be shown until real screens and backend data exist.

## Role-Based Navigation Direction

Target navigation model:

- Freelancer: Dashboard, Work, Services, Chat, Earnings.
- Agency/Admin: Dashboard, Work, Team, Chat, Money.
- Manager: Tasks, Reviews, Chat, Contacts, Escalations.
- Super Admin: Overview, Marketplace, Billing, Automation, Settings.

Implementation rule: show only destinations backed by real screens and real APIs. Do not add fake local-only pages to satisfy tab count.

## Chat UX

Header:

- Background: `#080D11`.
- Border bottom: `rgba(255,255,255,0.06)`.
- Compact back button, avatar, conversation name, platform/status line, and actions menu.

Message bubbles:

- Incoming: `#121A21`, border `rgba(255,255,255,0.06)`, text `#F4F7FA`.
- Outgoing: `#22310F`, border `rgba(185,247,25,0.18)`, text `#F4F7FA`.
- Bright lime bubbles are reserved for selected/highlighted/system-action states only.

Metadata:

- Timestamp: `#7D8994`.
- Sender name: primary/secondary text, not oversized neon.
- Read status: muted, with small lime only when useful.

Input:

- Background: `#0D1318`.
- Border: `rgba(255,255,255,0.08)`.
- Placeholder: `#7D8994`.
- Text: `#F4F7FA`.
- Send button default: `#6B8F16`.
- Send button active: `#B9F719`.

Chat should feel fast and clean: fixed composer, compact hierarchy, pull-to-refresh, empty states, document placeholders, and action menus where needed. Do not clone Telegram visually or use unofficial Telegram APIs.

## Server-Driven Config

Safe endpoint target:

```http
GET /api/mobile/config
```

Safe response shape:

```json
{
  "schemaVersion": 1,
  "theme": {
    "primary": "#B9F719",
    "primarySoft": "rgba(185,247,25,0.12)",
    "bg": "#05070A",
    "surface": "#0D1318"
  },
  "features": {
    "newBottomNav": true,
    "telegramInspiredChat": true,
    "showOnboarding": true
  },
  "navigation": {
    "freelancer": ["work", "services", "chat", "settings"],
    "agency": ["work", "services", "chat", "settings"],
    "manager": ["tasks", "chat", "settings"],
    "superAdmin": ["overview", "marketplace", "settings"]
  },
  "copy": {
    "onboardingTitle": "Complete your setup"
  }
}
```

Allowed remote changes:

- Safe theme tokens.
- Feature flags.
- Tab visibility/order for implemented screens.
- Onboarding content.
- Banner and empty-state copy.
- CTA labels.
- Maintenance messages.

Not allowed:

- Remote executable code.
- Untrusted scripts.
- Dynamic native module changes.
- API secrets or service-role keys.
- Remote changes that bypass Play Store policy.

Client rules:

- Validate config before applying.
- Use safe defaults on failure.
- Ignore unsupported destinations.
- Keep schema version visible for debugging.
- Cache through React Query; add persistent UI-config cache only if it remains non-business data.

## OTA Update Boundary

Expo/EAS Update is suitable later for JS bundle and asset updates if the project wants OTA. Do not add OTA blindly.

OTA can update:

- React Native JS UI.
- Safe assets.
- Copy and styling shipped in the JS bundle.

OTA cannot safely update:

- Native modules.
- Android package metadata.
- Permissions.
- Store-sensitive behavior.

Use staged rollout and rollback if EAS Update is enabled later.

## Icon And Asset Rules

Use one icon family. The current mobile app uses Expo vector Feather icons. Do not mix random icon packs.

PNG/illustration usage is limited to empty states, onboarding, help cards, and success screens. Do not use PNGs for core nav, chat messages, or normal buttons.

## Scroll And Keyboard

- Use native scrolling and FlatList for long chat/project lists.
- Bottom nav must respect safe area.
- Bottom nav hides when keyboard is open.
- Chat input remains fixed above keyboard.
- Latest messages must not be hidden by composer.
- Avoid nested scroll bugs and custom mobile scrollbars.

## Release Guardrails

Before release:

- `npm run typecheck`.
- Android Expo bundle loads in Expo Go.
- Web preview bundle loads for browser inspection.
- Login still uses existing auth API.
- Chat inbox and threads still use existing backend data.
- No local-only fake business data.
- No unsafe dynamic code loading.
