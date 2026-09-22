# Gigxomi UI/UX Audit Brief

## 1. Product Snapshot

- Product name: `Gigxomi`
- Current app style: dark, high-contrast, operations-heavy marketplace + workflow platform
- Current codebase state: logic is largely implemented; the next phase should focus on visual consistency, premium trust, hierarchy, polish, and UI lock-in
- Total Next.js pages under `src/app`: `76`
- Major experience layers:
  - Public marketplace + discovery
  - Auth funnel
  - Agency admin workspace
  - Manager operations workspace
  - Freelancer workspace
  - Super admin platform-control workspace
  - System/health/callback/support pages

## 2. Core Architecture

### Shared shells

- Public shell: marketing/discovery/auth surfaces
- Internal shell: reused across admin, manager, freelancer, and super-admin dashboards
- Chat workspace: one large shared conversation surface powering multiple roles

### High-impact UI files

- `D:\Gigxomi\src\app\globals.css`
- `D:\Gigxomi\src\components\ui\internal-app-shell.tsx`
- `D:\Gigxomi\src\components\public\public-auth-panel.tsx`
- `D:\Gigxomi\src\components\public\prompt-matcher.tsx`
- `D:\Gigxomi\src\components\chat\chat-workspace.tsx`
- `D:\Gigxomi\src\components\admin\admin-shell.tsx`
- `D:\Gigxomi\src\components\manager\manager-shell.tsx`
- `D:\Gigxomi\src\components\freelancer\freelancer-shell.tsx`
- `D:\Gigxomi\src\components\super-admin\super-admin-shell.tsx`

### Theme and typography state

Current design tokens show two overlapping systems:

- Color accents:
  - Internal accent: `#10a37f`
  - Public accent: `#d1ff32`
- Background system: dark navy/black with green highlights
- Typography tokens:
  - `--font-size-hero`
  - `--font-size-title`
  - `--font-size-section`
  - `--font-size-body`
  - `--font-size-caption`
  - plus a second overlapping set:
  - `--text-display`
  - `--text-title`
  - `--text-section`
  - `--text-body`
  - `--text-label`
  - `--text-metric`

This suggests the platform already has tokenization, but it is not yet locked into one strict design language.

## 3. Route Inventory

## Public + Auth + System

- `/`
  - Public home and discovery hub
  - Uses `PromptMatcher`
  - Combines marketplace discovery, service matching, agencies, packages, and auth entry points
- `/services/[slug]`
  - Public service detail page
  - High-trust conversion page for buyers comparing creative services
- `/agency/[slug]`
  - Public agency profile page
  - Reputation, office, specialization, and trust surface
- `/login`
  - Public login funnel using WhatsApp OTP
- `/signup`
  - Public signup funnel with package selection and WhatsApp OTP flow
- `/verify-otp`
  - OTP verification screen
  - Security-critical page and trust-critical page
- `/forgot-password`
  - Password recovery fallback
- `/reset-password`
  - Password reset fallback
- `/chat`
  - Redirect/compatibility route to role-specific chat experience
- `/editor`
  - Redirect route into freelancer area
- `/codedocs`
  - Internal code/documentation page
- `/meta/whatsapp/callback`
  - Meta/WhatsApp callback state page for integrations/onboarding
- `/staging-health`
  - Health diagnostics page for app/database/auth setup
- `/unauthorized`
  - Access denied page

## Admin Workspace

- `/admin`
  - Admin workspace landing page
- `/admin/analytics`
  - Agency overview and showcase dashboard
  - Business-unit KPI layer
- `/admin/assignments`
  - Assignment control and team routing
- `/admin/chat`
  - Admin inbox and live customer/internal conversations
- `/admin/contacts`
  - CRM and customer privacy/contacts
- `/admin/delivery-review`
  - Delivery operations review list
- `/admin/delivery-review/[id]`
  - Delivery review detail page
- `/admin/freelancers`
  - Agency editor/freelancer management
- `/admin/integrations`
  - Integrations hub
- `/admin/integrations/whatsapp`
  - WhatsApp connection/setup page
- `/admin/managers`
  - Manager control and permissions
- `/admin/monetization`
  - Pricing/monetization/business controls
- `/admin/packages`
  - Tenant package/subscription controls
- `/admin/payout-requests`
  - Payout approvals and money flow review
- `/admin/portfolio-review`
  - Portfolio moderation/review list
- `/admin/portfolio-review/[id]`
  - Portfolio review detail
- `/admin/roles`
  - Role access model
- `/admin/service-approvals`
  - Service moderation and approvals
- `/admin/system-settings`
  - Tenant settings
- `/admin/theme-branding`
  - Branding/theme controls
- `/admin/wallet-review`
  - Wallet and payment safety review

## Manager Workspace

- `/manager`
  - Manager dashboard and queue overview
- `/manager/assigned-chats`
  - Manager-owned chat queue
- `/manager/chat`
  - Main manager chat workspace
- `/manager/contacts`
  - Customer/contact visibility for managers
- `/manager/delivery-review`
  - Delivery review queue
- `/manager/delivery-review/[id]`
  - Delivery review detail
- `/manager/escalations`
  - Risk/escalation workspace
- `/manager/portfolio-review`
  - Portfolio review queue
- `/manager/portfolio-review/[id]`
  - Portfolio review detail
- `/manager/project-tracking`
  - Project movement and assignment progress
- `/manager/quote-review`
  - Quote review and pricing checkpoint
- `/manager/service-review`
  - Service moderation/review queue
- `/manager/verification-review`
  - Verification and trust review queue
- `/manager/wallet-review`
  - Wallet/payment-state visibility for managers

## Freelancer Workspace

- `/freelancer`
  - Freelancer dashboard
- `/freelancer/add-service`
  - Create service flow
- `/freelancer/apply-for-work`
  - Apply to agency/project opportunities
- `/freelancer/chat`
  - Freelancer inbox and routed customer chats
- `/freelancer/draft-services`
  - Draft services list
- `/freelancer/payouts`
  - Payout requests/history
- `/freelancer/portfolio-drafts`
  - Portfolio draft list
- `/freelancer/portfolio-drafts/[id]`
  - Portfolio draft detail/editor flow
- `/freelancer/profile`
  - Profile and public-facing freelancer info
- `/freelancer/published-services`
  - Published/live services
- `/freelancer/services`
  - Service section entry route
- `/freelancer/services/[id]/preview`
  - Individual service preview
- `/freelancer/wallet`
  - Wallet balance, ledgers, earning visibility

## Super Admin Workspace

- `/super-admin`
  - Platform overview/dashboard
- `/super-admin/agencies`
  - Agency ecosystem control
- `/super-admin/approvals`
  - Platform-wide approvals
- `/super-admin/billing-control`
  - Billing and subscription governance
- `/super-admin/chat`
  - Cross-tenant official Gigxomi chat control
- `/super-admin/editor-economics`
  - Editor revenue/economics layer
- `/super-admin/freelancers`
  - Cross-platform freelancer control
- `/super-admin/login`
  - Owner login
- `/super-admin/marketing`
  - Platform marketing console
- `/super-admin/packages`
  - Global packages/subscription definitions
- `/super-admin/platform-settings`
  - Global configuration page
- `/super-admin/signup`
  - Super admin registration or account management route
- `/super-admin/whatsapp-control`
  - Official WhatsApp control center
- `/super-admin/whatsapp-flows`
  - WhatsApp flow builder

## 4. Experience Model by Role

### Public user

- Arrives through marketplace/discovery
- Browses services or agencies
- Signs up or logs in
- Verifies OTP
- Eventually converts into buyer, freelancer, or agency workflow

### Admin

- Runs one agency like a business operating system
- Controls editors, managers, moderation, payouts, branding, contacts, integrations, chat, and subscription state

### Manager

- Operates queues
- Monitors assignments, quote flow, risk, delivery, contacts, escalation, and verification

### Freelancer

- Creates services
- Applies for work
- Manages profile, chat, wallet, payouts, portfolio drafts, and public-facing service quality

### Super admin

- Runs the platform itself
- Controls agencies, freelancers, billing, WhatsApp, marketing, approvals, and platform settings

## 5. Current UI/UX Diagnosis

## What already works

- Strong product depth
- Serious operational workflows
- Clear role separation in routing
- Good amount of reusable structural components already exist
- Dark theme already feels productized rather than default template-like

## What is currently hurting trust/premium perception

- Too many surfaces share one similar dark treatment without enough hierarchy between public, admin, manager, freelancer, and super-admin
- Typography exists as tokens but does not yet feel standardized into one strict display/title/section/body/caption system
- The current interface feels feature-dense and utilitarian, but not yet premium or luxurious
- The same shell pattern is stretched across very different roles, reducing personality and trust differentiation
- Many screens likely depend on large monolithic components, especially chat, which makes refinement harder
- Accent usage is not fully systematized; the public neon lime and internal green can feel disconnected
- Critical trust screens like login, signup, verify OTP, wallet, payments, chat, and public service detail need more deliberate visual polish
- There is a risk that H1/H2/H3 are being used for convenience rather than semantic hierarchy
- Surface density is high, so premium whitespace and rhythm are likely inconsistent

## Biggest UX debt hotspots

- Chat workspace
- Public auth funnel
- OTP verification flow
- Public discovery/home
- Public service detail
- Agency/admin dashboards with many cards competing for attention
- Cross-role internal shell

## 6. Design-System Gaps to Lock Next

The next sprint should lock these items:

- Typography hierarchy
  - exact H1/H2/H3/H4/body/label/caption rules
- Color system
  - brand colors
  - role colors
  - success/warning/error/info
  - surface layering
  - hover/focus/selected/disabled
- Spacing system
  - vertical rhythm
  - grid spacing
  - card padding
  - section spacing
- Radius system
  - buttons, cards, pills, inputs, overlays
- Shadow system
  - minimal but premium depth
- Icon rules
  - sizes, stroke, contrast, hover labels, icon-only controls
- Button hierarchy
  - primary, secondary, tertiary, ghost, danger, icon
- Form system
  - input heights, labels, help text, inline errors, section grouping
- Card system
  - data cards, stat cards, trust cards, list rows, chat cards
- Header system
  - page headers, workspace headers, section headers, chat headers
- Navigation system
  - sidebar, topbar, pills, tabs, filter chips
- Empty/loading/error states
- Mobile behavior
  - especially for chat, auth, discovery, and dashboard shells

## 7. Visual Direction Recommendation

The product should move toward:

- Premium minimalism
- Trust-first layout
- Calm and intentional spacing
- Better use of negative space
- Clear hierarchy before decoration
- Subtle luxury rather than flashy gradients everywhere
- Strong contrast but less “neon everywhere”
- More elegant type rhythm
- Cleaner surfaces and fewer competing highlights

Recommended emotional goals:

- Expensive but justified
- Operationally strong
- Secure and trustworthy
- Minimal and mature
- Confident, not noisy

## 8. Priority Redesign Order

If redesign work is phased, do it in this order:

1. Design system foundations
2. Public home + discovery
3. Login/signup/OTP
4. Chat workspace
5. Public service detail and agency profile
6. Internal shell for admin/manager/freelancer/super-admin
7. Dashboards and card-heavy data pages
8. Wallet, billing, payout, and payment flows

## 9. Ready-to-Paste Prompt for ChatGPT

Use the prompt below as-is:

```text
I am redesigning a real product called Gigxomi. The platform logic is mostly finished, and now I want to lock the UI/UX so it feels premium, minimal, trustworthy, and expensive in a justified way. I do not want generic SaaS design. I want a calm, luxury, modern, high-trust product experience.

Please act like a world-class product design director and design systems expert. I need you to produce a full UI/UX direction, hierarchy system, and rollout strategy for this platform.

Product summary:
- Gigxomi is a marketplace + workflow platform around creative/freelance services, agencies, WhatsApp communication, OTP auth, operations, payouts, and platform management.
- It has public marketplace pages, auth flows, chat systems, admin dashboards, manager dashboards, freelancer dashboards, and super-admin platform control pages.
- The business logic is mostly complete. Now we want to stop changing logic and start locking the interface.

Current architecture summary:
- Total Next.js pages: 76
- Major layers:
  - Public marketplace/discovery
  - Auth funnel
  - Admin workspace
  - Manager workspace
  - Freelancer workspace
  - Super-admin workspace
  - System/support pages

Current routes and page context:

Public + Auth + System:
- / = home, marketplace, discovery, package selection, services, agencies, auth entry
- /services/[slug] = public service detail and conversion page
- /agency/[slug] = public agency profile and trust page
- /login = login flow using WhatsApp OTP
- /signup = signup flow with package selection and OTP
- /verify-otp = OTP verification page
- /forgot-password = fallback recovery
- /reset-password = fallback reset
- /chat = redirect/compatibility route
- /editor = redirect into freelancer space
- /codedocs = internal docs page
- /meta/whatsapp/callback = WhatsApp/Meta callback page
- /staging-health = system diagnostics page
- /unauthorized = access denied page

Admin:
- /admin
- /admin/analytics
- /admin/assignments
- /admin/chat
- /admin/contacts
- /admin/delivery-review
- /admin/delivery-review/[id]
- /admin/freelancers
- /admin/integrations
- /admin/integrations/whatsapp
- /admin/managers
- /admin/monetization
- /admin/packages
- /admin/payout-requests
- /admin/portfolio-review
- /admin/portfolio-review/[id]
- /admin/roles
- /admin/service-approvals
- /admin/system-settings
- /admin/theme-branding
- /admin/wallet-review

Manager:
- /manager
- /manager/assigned-chats
- /manager/chat
- /manager/contacts
- /manager/delivery-review
- /manager/delivery-review/[id]
- /manager/escalations
- /manager/portfolio-review
- /manager/portfolio-review/[id]
- /manager/project-tracking
- /manager/quote-review
- /manager/service-review
- /manager/verification-review
- /manager/wallet-review

Freelancer:
- /freelancer
- /freelancer/add-service
- /freelancer/apply-for-work
- /freelancer/chat
- /freelancer/draft-services
- /freelancer/payouts
- /freelancer/portfolio-drafts
- /freelancer/portfolio-drafts/[id]
- /freelancer/profile
- /freelancer/published-services
- /freelancer/services
- /freelancer/services/[id]/preview
- /freelancer/wallet

Super admin:
- /super-admin
- /super-admin/agencies
- /super-admin/approvals
- /super-admin/billing-control
- /super-admin/chat
- /super-admin/editor-economics
- /super-admin/freelancers
- /super-admin/login
- /super-admin/marketing
- /super-admin/packages
- /super-admin/platform-settings
- /super-admin/signup
- /super-admin/whatsapp-control
- /super-admin/whatsapp-flows

Important product realities:
- The UI is currently dark-themed
- There are already token-like variables, but typography hierarchy is not locked properly
- H1, H2, H3, body, labels, captions, and metrics do not yet feel standardized
- Public and internal interfaces need stronger visual separation while staying in one brand system
- The chat experience is one of the most important surfaces
- Login/signup/OTP must feel highly trustworthy
- Wallet, payouts, billing, and WhatsApp areas must feel secure and premium
- I want people to feel that the subscription price is justified as soon as they use the product

Current UX problems I want solved:
- The product does not yet feel luxurious enough
- The hierarchy between headings and text styles is not consistent
- The interface can feel too dense and operational instead of elegant
- Too many surfaces share similar visual treatment
- The system needs a more deliberate, minimal, premium design language
- I want better standards for headers, cards, nav, forms, buttons, icons, spacing, and layout rhythm

Please deliver:
1. A complete visual direction for Gigxomi
2. A typography system with exact usage rules for H1/H2/H3/H4/body/label/caption/metric
3. A color system with role-based guidance, surface layers, states, and premium accent usage
4. A spacing, radius, border, and shadow system
5. Rules for sidebars, topbars, pills, tabs, cards, tables, chat bubbles, headers, and forms
6. A separate recommendation for public UI vs internal UI vs chat UI
7. A recommended icon philosophy and hover/tooltip strategy
8. A priority order for redesigning screens
9. A component checklist for locking the design system
10. A plan to make the product feel premium, minimal, and trustworthy without becoming visually empty or generic

Do not give me vague advice. I want something concrete, opinionated, and structured like a real design strategy document.
```

## 10. Immediate Sprint Recommendation

The next sprint should not start from random page tweaking. It should start with:

1. Final typography hierarchy
2. Final color and surface rules
3. Final button/input/card/nav specifications
4. Final chat header, message, and composer system
5. Final auth funnel design

Only after those are fixed should the rest of the platform be visually aligned.
