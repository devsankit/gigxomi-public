# Gigxomi Super Admin Intelligence Center

## 1) Dashboard Purpose
The Super Admin Intelligence Center is Gigxomi's founder command center.

Primary outcome:
- Understand platform health in under 3 seconds.
- See where revenue is growing, where it is leaking, and what action is required today.
- Convert marketplace behavior (search demand, supply quality, automation outcomes) into compounding intelligence.

This is not a decorative admin page.
This is the data operating layer for:
- Revenue decisions
- Churn prevention
- Package strategy
- Supply strategy
- Demand capture
- Risk control

## 2) Data Architecture Vision
Three-layer intelligence architecture:

### Layer 1: Executive Command Center
Purpose:
- Immediate business state and urgency.

Outputs:
- 8-signal executive bar
- max 3 smart insights
- critical financial/operational alerts

### Layer 2: Intelligence Modules
Purpose:
- Explain why numbers moved.

Outputs:
- Revenue intelligence
- Subscription/package intelligence
- Agency health
- Supply and demand intelligence
- Search quality intelligence
- Automation and marketing intelligence

### Layer 3: Deep Analytics
Purpose:
- Investigate root cause and make strategic decisions.

Outputs:
- Drilldowns by agency, package, editor, keyword, campaign, risk bucket
- period-over-period analysis
- entity-level action queues

## 3) Metrics Taxonomy

### A. Executive Metrics (Tier 1: always visible)
1. MRR / Subscription Revenue
2. Projected Next-Month Revenue
3. Active Agencies
4. New Agencies This Month
5. Churn / Renewal Risk
6. Pending + Failed Payments
7. Active Editors / Freelancers
8. Marketplace Demand Score

Each includes:
- Value
- Trend vs prior period
- Status: Healthy / Watch / Critical
- One-line interpretation

### B. Diagnostic Metrics (Tier 2: secondary)
- Revenue mix, net MRR growth, ARPA, pending vs collected
- Package distribution and package-level MRR
- Renewal risk and upsell candidates
- Agency health risk indicators
- Search demand and no-result patterns
- Editor supply quality and idle/overloaded mix
- Bot automation productivity impact

### C. Investigative Metrics (Tier 3: deep pages)
- Keyword -> click -> chat -> order path
- Agency-level churn predictors
- Editor reliability and dispute risk curves
- Campaign/query-level conversion outcomes

## 4) UI Layout (Founder-first)

1. Page header
- "Super Admin Intelligence Center"
- last updated timestamp
- compact global action area

2. Executive Signal Bar (max 8 cards)

3. Smart Insights (max 3)

4. Main grid
- Left: Revenue + Subscription + Agency Health
- Right: Critical Alerts + Quick Actions + Connection Status

5. Lower analytics
- Marketplace Demand
- Search Quality / Recommendation
- Editor Supply Intelligence
- Marketing / SEO Intelligence
- Automation / Bot Intelligence

Responsive:
- Desktop: dense multi-panel
- Tablet: 2 columns
- Mobile: stacked
- No horizontal overflow

## 4.1) Visual System Correction

The Overview must use the Gigxomi black/lime command-center system, not blue-heavy admin-card styling.

Brand tokens:

| Token | Value |
| --- | --- |
| `--color-bg` | `#000000` |
| `--color-bg-soft` | `#050705` |
| `--color-surface` | `#0a0d0b` |
| `--color-surface-soft` | `#0f130f` |
| `--color-surface-elevated` | `#141911` |
| `--color-surface-gloss` | `rgba(8, 11, 8, 0.82)` |
| `--color-text-primary` | `#F5F7FB` |
| `--color-text-secondary` | `#B6C0D4` |
| `--color-text-muted` | `#7E8AA3` |
| `--color-primary` | `#D7FF2F` |
| `--color-primary-hover` | `#C8F523` |
| `--color-primary-soft` | `rgba(210, 255, 31, 0.14)` |
| `--color-border` | `rgba(255, 255, 255, 0.08)` |
| `--color-border-strong` | `rgba(210, 255, 31, 0.22)` |
| `--color-success` | `#22C55E` |
| `--color-warning` | `#F59E0B` |
| `--color-error` | `#EF4444` |
| `--color-info` | `#38BDF8` |

Visual rules:

- No giant black rectangular wrapper behind the entire dashboard.
- Page content should breathe on the app background.
- Use section spacing and subtle card surfaces instead of one mega container.
- KPI cards use `--color-surface-gloss` / `--color-surface` with `--color-border`.
- Hover uses slight lift, `--color-border-strong`, and `--glow-lime-soft`.
- Lime is the only brand accent; blue appears only for true info states.
- Status chips must use tokenized success/warning/error/info/neutral treatments.
- Dashboard typography remains compact; no hero-style marketing copy.

## 5) Section Blueprint (12 sections)

## Section 1: Executive Signal Bar (8 cards max)
Cards:
- MRR / Subscription Revenue
- Projected Next-Month Revenue
- Active Agencies
- New Agencies This Month
- Churn / Renewal Risk
- Pending + Failed Payments
- Active Editors / Freelancers
- Marketplace Demand Score

## Section 2: Smart Insights
Rules:
- Max 3
- Action-oriented only
- Include issue/opportunity, impact, CTA

## Section 3: Revenue Intelligence
Metrics:
- MRR, ARR, New MRR, Expansion MRR, Churned MRR, Net MRR Growth
- Collected Revenue, Pending Revenue, Failed Payments
- Setup Fee Revenue, Subscription Revenue, ARPA
- Revenue by Package, Projected Next-Month Revenue

## Section 4: Subscription & Package Intelligence
Metrics:
- Agencies by package, package-wise MRR
- Active/expired subscriptions, upcoming renewals
- Renewal risk, upgrade opportunities, downgrade risk
- Seats billed vs seats used, package utilization

## Section 5: Agency Health Intelligence
Metrics:
- Active/inactive agencies
- New agencies this month
- no recent login, no WhatsApp connected
- failed onboarding, high-usage/low-usage
- renewal risk, unpaid invoices

## Section 6: Marketplace Demand Intelligence
Metrics:
- Top searched keywords/services/categories
- Trending searches
- No-result searches
- Search->click, search->chat, search->order
- Demand-supply gap, missed supply opportunities

## Section 7: Search Quality / Recommendation Intelligence
Metrics:
- Searches with results vs no results
- Refinement rate
- Profile CTR, post-search contact rate, conversion rate
- Top clicked editors by keyword
- Failed keyword matching, recommendation confidence

## Section 8: Editor / Freelancer Supply Intelligence
Metrics:
- Total/active/new/approved/pending/rejected editors
- Category and price distribution
- Performance/risk bands
- Idle editors and high-demand skill gaps
- Payout volume and monetization contribution

## Section 9: Marketing & SEO Intelligence
Metrics:
- Visitors, signups, source/medium, campaign outcomes
- GSC impressions, clicks, CTR, avg position
- Top SEO queries/landing pages
- keyword->signup and lead->agency conversion

## Section 10: Automation / Bot Intelligence
Metrics:
- Bot replies, first-response coverage
- time saved, value saved
- automation resolution and human handoff
- missed chats, FRT, resolution time
- WhatsApp connected/disconnected agencies
- failed webhook events

## Section 11: Financial Risk & Leakage
Metrics:
- failed/pending payments
- overdue invoices
- expired subscriptions
- revenue at risk
- payout disputes/refunds
- unpaid high-usage agencies
- seat usage without billing anomalies

## Section 12: Quick Actions
Only utility actions:
- Review renewals
- Follow up pending payments
- Approve editors
- Review search demand/no-result searches
- Add missing category
- Connect analytics
- Send renewal campaign
- Create SEO landing page idea
- Review high-risk agencies

## 6) Data Sources: Available Now vs Missing

## A. Current Reusable Sources (no new backend required)
1. `buildSuperAdminOverviewData()`
- Source: `src/lib/gigxomi/dashboard-overview-data.ts`
- Provides live-ish:
  - managed user counts by role/audience
  - active/onboarding package status counts
  - OTP/public auth overview
- Limitation:
  - partially merged with snapshot data

2. Auth and user/package status
- Source: `getManagedAuthUsers()`
- Tables: `AppAuthUser`
- Available:
  - tenant assignment
  - role and assignedRole
  - packageId/name/audience/status/expiresAt
  - lastLoginAt / lastOtpSentAt

3. Subscription and billing primitives (DB-ready)
- Tables:
  - `UserSubscription`
  - `PaymentTransaction`
  - `RecurringBillingEvent`
  - `Package`
- Status:
  - schema is available and strong for MRR/renewal/churn analytics
  - current super-admin overview UI does not yet query these directly

4. Auth funnel events (partial)
- Source: `public-auth-intent-store`
- File-backed store, route `/api/super-admin/whatsapp-otp-intents`
- Available:
  - pending WhatsApp intents
  - OTP issued
  - pending subscription
  - verified

5. Package and marketing config endpoints
- `/api/super-admin/packages`
- `/api/super-admin/marketing`
- Good for configuration/state awareness, not full BI metrics yet

## B. Data Not Yet Connected for Intelligence-grade Metrics
- Prompt/search telemetry (keyword demand, no-result, click-through)
- Search quality pipeline metrics (refinement, recommendation confidence)
- Order funnel metrics tied to keyword/campaign
- True campaign performance analytics (GA/GSC joined outcomes)
- Structured churn-risk and renewal-risk event feed
- Unified risk ledger (failed payments, disputes, unpaid usage anomalies)

## C. Metrics Matrix (Now vs Missing)

| Module | Metric | Available Now | Source | Missing Work |
|---|---|---|---|---|
| Executive | Active Agencies | Yes | `AppAuthUser` tenant counts | normalize to agency entities |
| Executive | Active Editors | Yes | `AppAuthUser` | add trend history |
| Executive | MRR | Partial | snapshot + billing schema exists | query `UserSubscription` active recurring amounts |
| Executive | Projected Next-Month Revenue | No | - | projection service using renewals + risk scoring |
| Executive | Pending+Failed Payments | Partial | billing schema exists | aggregate service + dashboard API |
| Revenue | ARR/New MRR/Expansion/Churned MRR | No | - | subscription movement model + period deltas |
| Package | Agencies by package | Yes | `AppAuthUser.packageId` | package normalization and tenant-level aggregation |
| Package | Package-wise MRR | Partial | `Package`, `UserSubscription` | compute from active subscriptions |
| Agency Health | No recent login | Yes | `lastLoginAt` | thresholds + risk labels |
| Agency Health | No WhatsApp connected | Partial | connection stores | unify tenant connection state |
| Demand | Top searched keywords | No | - | `prompt_search_submitted` event tracking |
| Demand | No-result searches | No | - | `prompt_search_no_result` event tracking |
| Search Quality | Search->click/chat/order | No | - | event chain + attribution model |
| Supply | Approved/pending/rejected editors | Partial | verification tables + auth profiles | consolidate and expose API |
| Marketing/SEO | GA/GSC metrics | No | config only | connectors + ingestion jobs |
| Automation | Bot coverage, handoff, value saved | Partial | conversation/automation stores | explicit event tracking + valuation model |
| Risk | Revenue at risk | Partial | payment + subscription schema | risk scoring and alert service |

## 7) Required Backend Events (Moat Layer)
Track these events in a durable analytics event stream/table:

1. `user_signup`
2. `user_login`
3. `agency_created`
4. `agency_subscription_started`
5. `agency_subscription_renewed`
6. `agency_subscription_cancelled`
7. `payment_success`
8. `payment_failed`
9. `package_selected`
10. `package_upgraded`
11. `package_downgraded`
12. `prompt_search_submitted`
13. `prompt_search_result_clicked`
14. `prompt_search_no_result`
15. `editor_profile_viewed`
16. `editor_contact_clicked`
17. `order_created`
18. `order_paid`
19. `editor_approved`
20. `editor_rejected`
21. `editor_assigned`
22. `chat_started`
23. `bot_reply_sent`
24. `human_handoff`
25. `whatsapp_connected`
26. `whatsapp_disconnected`
27. `campaign_sent`
28. `campaign_clicked`
29. `renewal_risk_detected`
30. `churn_risk_detected`

Event payload contract (all events):
- `event_name`
- `event_ts`
- `actor_type`
- `actor_id`
- `agency_id` (nullable)
- `editor_id` (nullable)
- `query` (nullable)
- `category` / `service` (nullable)
- `source_channel`
- `amount` + `currency` (nullable)
- `metadata` JSON

## 8) Required Future APIs

## Core dashboard aggregation APIs
1. `GET /api/super-admin/intelligence/executive-signals`
- Returns 8 executive metrics with trend, status, interpretation

2. `GET /api/super-admin/intelligence/smart-insights`
- Returns max 3 ranked insights with impact and CTA

3. `GET /api/super-admin/intelligence/revenue`
- MRR decomposition, ARPA, projections, leakage

4. `GET /api/super-admin/intelligence/subscriptions`
- renewals, risk, package-wise performance, utilization

5. `GET /api/super-admin/intelligence/agency-health`
- health score, onboarding funnel, risk and upsell tables

6. `GET /api/super-admin/intelligence/marketplace-demand`
- top/trending keywords, no-result queries, demand-supply gaps

7. `GET /api/super-admin/intelligence/search-quality`
- result quality score, refinement, conversion chain

8. `GET /api/super-admin/intelligence/editor-supply`
- supply quality, idle/high-demand mismatch, approvals

9. `GET /api/super-admin/intelligence/marketing-seo`
- GA/GSC-integrated metrics or connector status placeholders

10. `GET /api/super-admin/intelligence/automation`
- bot coverage, handoff, time/value saved, webhook failures

11. `GET /api/super-admin/intelligence/risk-alerts`
- financial and operational risk stack with INR impact

## 9) Defensibility Layer

## 1. Search Demand Graph
- What users search
- Trend velocity by keyword/category
- Which keywords convert to chats/orders

## 2. Supply Graph
- Editor inventory by skill, quality, price, availability
- Reliability and fulfillment fitness

## 3. Demand-Supply Gap Engine
- high demand + low supply detection
- missing category alerts
- SEO/content opportunity suggestions

## 4. Trust & Quality Graph
- editor reliability
- agency reliability
- SLA and dispute patterns
- revision behavior

## 5. Revenue Intelligence Graph
- package performance
- renewal/churn predictors
- upsell probability

## 6. Automation Intelligence Graph
- bot response share
- handoff reasons
- missed intent clusters
- operational value saved

Why this is defensible:
- Competitors can copy UI.
- They cannot easily replicate historical behavior graphs, risk models, and marketplace-specific intelligence loops.

## 10) UI Design Rules (enforcement)
- No blue-heavy surfaces
- No random gradients
- Neutral dark tokenized surfaces only
- Lime accent for primary/action/positive
- Risk uses warning/error tokens only
- Compact SaaS typography
- No hero copy and no paragraph-heavy blocks
- No decorative 3D in analytics density zones
- Tables for lists, cards for summaries, detail panel for investigation
- Empty states for missing integrations/data

## 11) Data Fallback Rules
If data is unavailable:
- Never fabricate production-looking values silently.
- Use explicit placeholder states:
  - "Data source needed"
  - "Tracking not connected"
  - "Connector not connected"
- Keep module visible but honest.

Examples:
- Prompt search tracking not connected yet
- Google Search Console not connected
- Payment failure history not aggregated yet
- Editor utilization requires assignment event stream

## 12) Implementation Roadmap

## Phase 1 (now)
- Replace current overview narrative blocks with founder command layout.
- Implement:
  - Executive Signal Bar (8 max)
  - Smart Insights (max 3)
  - Critical Alerts stack
- Use only currently available data + explicit placeholders where needed.

## Phase 2
- Revenue Intelligence module
- Subscription & Package Intelligence module
- Agency Health module
- Begin replacing snapshot-only values with query-backed aggregates.

## Phase 3
- Marketplace Demand module
- Search Quality module
- Editor Supply Intelligence module
- Introduce event-backed demand/supply gap metrics.

## Phase 4
- Marketing/SEO module with connector-aware states
- Automation/Bot Intelligence module
- Unified missing-data/connection states

## Phase 5
- Responsive density polish
- Token compliance audit
- Remove blue-dominant legacy surface styles from this page
- Final founder usability check

## 13) Available Now vs Missing (Implementation Checklist)

### Available now (reusable immediately)
- Super-admin role-scoped dashboard endpoint
- Managed user/package/role/login metadata
- OTP/auth funnel overview
- Package and marketing settings endpoints
- Billing/subscription schema primitives

### Missing now (must build)
- Unified analytics event pipeline for search/recommendation/conversion
- Revenue decomposition service (new MRR, expansion, churned MRR)
- Next-month projection model
- Demand/supply gap engine
- Recommendation confidence scoring
- GA/GSC ingestion and attribution joins
- Risk scoring service with monetary impact ranking

## 14) Acceptance Criteria
The Intelligence Center is accepted only if:
- Founder sees business health in 3 seconds.
- MRR and projected next-month revenue are visible.
- Subscription and renewal risks are visible.
- Agency health and editor supply health are visible.
- Prompt/search demand and no-result insights are visible or clearly flagged as missing.
- Financial leakage is visible with impact and action.
- Marketing/SEO state is visible (connected or placeholder).
- Automation value is visible (or explicitly marked pending data).
- Dashboard gives actions, not just numbers.
- No blue-heavy panel styling on this page.
- Existing sidebar/shell/auth/routes/API contracts remain unchanged.

## 15) Current Technical Notes
- Current super-admin overview fetch path:
  - `GET /api/super-admin/dashboard`
  - `buildSuperAdminOverviewData()`
- Current limitation:
  - snapshot (`business-ecosystem-data`) is still mixed into output.
- Migration target:
  - move to aggregation-first services with explicit placeholder states when data is unavailable.
