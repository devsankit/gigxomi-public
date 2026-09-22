# Gigxomi Agency Dashboard (Overview) Design Plan

## Scope
This document defines the design strategy for the Agency Overview dashboard page only.
It is a planning artifact, not a code rewrite.

Goals:
- Make core operational signals understandable within 3 seconds
- Remove landing-page visual behavior
- Prioritize data, status, and actions over decorative UI
- Use existing design tokens and global classes consistently

Out of scope:
- Business logic changes
- Route changes
- Full component implementation

## Product Context
Gigxomi acts as an agency operating system for:
- Agency owners
- Managers
- Admins

Top user intents on Overview:
- Track revenue and project throughput
- Monitor chats and team capacity
- Check integrations and operational health
- Resolve approvals, payment, and assignment blockers quickly

## Experience Principles
1. Data-first hierarchy
- Metrics and status must appear before explanation text.

2. Actionability over storytelling
- Every section should include an immediate next action.

3. Controlled visual style
- Dark base + soft card layers + selective neon accents only for focus states.

4. Performance-led UI
- Lightweight motion and optimized visual assets only.

5. Focus-first decision surface
- Primary view shows only the most decision-critical metrics (max 6-8).
- Everything else moves to secondary cards or deep pages.

## Visual Direction (Refined)
### Base Theme
- Use low-contrast dark canvas from tokenized background values.
- Keep content surfaces one step brighter than canvas for depth.

### Accent Strategy
Neon accent is allowed only for:
- Active selection states
- Primary KPI emphasis
- Status highlights that require attention

Do not use accent for:
- Large background effects
- Permanent glows
- Non-interactive decoration

### Tone
- Premium, compact SaaS operations feel
- No hero-style oversized copy
- Minimal ornamentation, high clarity

## Typography Hierarchy (Compact Dashboard Scale)
Use tokenized sizes only.

- Page title: medium prominence, single-line, compact
- Section labels: small, muted, optionally uppercase with letter spacing
- Card titles: compact semibold
- KPI values: strong and readable, not oversized
- Metadata/status text: small, low-noise

Rules:
- Avoid long descriptive paragraphs on Overview
- Prefer short labels + status chips + value blocks

## Layout Wireframe (Text)
```text
[Page Header]
- Title: Agency Overview
- Right: Last updated + global quick action

[SECTION 1: SIGNAL BAR]
| Revenue (INR) | Active Chats | Active Seats | Pending Approvals |
(Compact KPI strip, equal-height cards)

[SECTION 2: CORE OPERATIONS]
| Left (8 cols): Active Work + System Status + Recent Activity |
| Right (4 cols): Quick Actions panel |

[SECTION 3: INTEGRATIONS]
| WhatsApp Card | Instagram Card |
(Each: 3D icon + status badge + CTA)

[SECTION 4: PERFORMANCE SNAPSHOT]
| Revenue Trend | Manager SLA Health | Seat Utilization |
(Small widgets with micro-visuals)

[SECTION 5: ALERTS / ATTENTION]
| Pending Approvals | Failed Payments | Unassigned Tasks |
(High-priority, scannable alert list/cards)

[SECTION 6: SMART INSIGHTS]
| Insight 1 | Insight 2 | Insight 3 |
(Max 3, action-oriented, plain language)
```

## Primary View Metric Budget (Strict)
- Maximum visible metrics in primary overview: 6-8 total.
- Recommended default 8 metrics:
  - MTD Gross Revenue (INR)
  - Net Collected Revenue (INR)
  - Active Chats
  - Missed Chats (%)
  - Pending Approvals (count)
  - Failed Payments (INR at risk)
  - Editor Utilization (%)
  - Trust Score (0-100)
- Any additional metric belongs to Tier 2 or Tier 3.

## Section Breakdown

## Section 1: Signal Bar
Purpose:
- Surface immediate operational state in one scan.

Content:
- Revenue (INR)
- Active chats
- Active seats
- Pending approvals

Design behavior:
- Compact horizontal cards
- Tight spacing, concise labels
- Optional tiny delta indicators (up/down/steady)
- No hero copy or banner treatment

## Section 2: Core Operations
### Left: Primary Ops Feed
Include:
- Active work/system status snapshot
- Recent activity stream (chat, assignments, approvals)

Design behavior:
- Chronological, compact rows
- Status chips for event type and urgency
- Clear "view all" affordance

### Right: Quick Actions
Actions:
- Add editor
- Assign work
- Approve tasks
- Send broadcast

Design behavior:
- Single action card with vertically stacked buttons
- Highest-frequency actions on top
- Keep button labels verb-first and short

## Section 3: Integrations
Cards:
- WhatsApp
- Instagram

Per card:
- Channel icon (3D system compliant)
- Connection status badge (connected/not connected/pending)
- Last sync or status note
- Primary CTA (Connect / Manage)

Design behavior:
- Consistent card geometry and spacing
- Status color semantics follow tokens only

## Section 4: Performance Snapshot
Widgets:
- Revenue trend (sparkline)
- Manager SLA health (indicator)
- Seat utilization (progress bar)

Rules:
- Overview only gets micro-visuals
- No heavy multi-series or complex controls
- Add direct link to detailed analytics if needed

## Section 5: Alerts / Attention
High-importance items:
- Pending approvals
- Failed payments
- Unassigned tasks

Design behavior:
- Strong visual priority using border/status color, not glow
- Sorted by severity and urgency
- Each item includes clear action CTA

## Business Intelligence Layers
These BI layers define what decisions the Overview must support daily. They extend the existing section structure and do not alter UI style direction.

## Visibility Tiers
Tier 1 (always visible):
- Signal Bar
- Critical Alerts (top stack)
- Core Operations summary
- Smart Insights (max 3)

Tier 2 (secondary, still on Overview):
- Integrations status cards
- Performance Snapshot widgets
- Trust Score driver summary

Tier 3 (deep pages only):
- Full funnel analytics
- Detailed team load distribution by user/time
- Score decomposition and historical diagnostics
- Advanced chat quality and campaign attribution breakdowns

Rule:
- If a metric does not change an immediate decision, it cannot be Tier 1.

## 1. Revenue Intelligence
Exact metrics:
- Gross revenue (MTD, INR)
- Net collected revenue (MTD, INR)
- Revenue vs last period (% change)
- Outstanding receivables (INR)
- Approval-to-payment cycle time (median hours)

Why it matters:
- Shows topline performance and cash reality, not just booked value.
- Exposes payment friction before it becomes a cash-flow issue.

How it should be displayed:
- Signal Bar: Gross revenue + period delta.
- Performance Snapshot: compact revenue sparkline with 7d/30d toggle.
- Alerts zone: receivables and delayed payment-cycle breaches.

Priority level:
- High

Decision output format:
- Interpretation:
  - Good: Net collected growth > previous period and receivables stable/declining
  - Bad: Growth flat/negative or receivables rising faster than revenue
  - Critical: Payment cycle delay above threshold and receivables spike
- Suggested action:
  - Trigger payment follow-up queue
  - Escalate overdue approvals
  - Prioritize high-value pending invoices

## 2. Efficiency Engine (Bot Replies, Time Saved, Editor Utilization)
Exact metrics:
- Bot first-response coverage (% chats first answered by bot)
- Estimated agent time saved (hours/day)
- Estimated value recovered (INR/week) from time saved
- Automation resolution rate (% conversations resolved without handoff)
- Editor utilization (% productive time vs available seat-hours)
- Rework ratio (% tasks reopened)

Why it matters:
- Converts automation into measurable operational leverage.
- Prevents hidden over/under-utilization across delivery resources.

How it should be displayed:
- Performance Snapshot card cluster with compact progress indicators.
- Core Operations status strip with utilization state (Healthy/At risk/Critical).
- Tooltip disclosure for calculation logic (time saved estimate).
- Show both:
  - Time saved (hours)
  - Value saved (INR) or productivity equivalent (% additional handled volume)

Priority level:
- High

Decision output format:
- Interpretation:
  - Good: Utilization in healthy band + automation resolving meaningful volume
  - Bad: Under-utilization/overload pockets or low automation resolution
  - Critical: Sustained overload with rising rework
- Suggested action:
  - Rebalance editor assignments
  - Improve bot routing for top missed intents
  - Shift workload to available seats

## 3. Team Control (Editor Load, Assignments)
Exact metrics:
- Editors at/over capacity (count and %)
- Unassigned tasks (count)
- Assignment aging (tasks unassigned > X hours)
- Average tasks per editor (active)
- Manager-to-editor ratio (active supervision load)

Why it matters:
- Prevents bottlenecks and uneven workload distribution.
- Improves assignment speed and delivery predictability.

How it should be displayed:
- Core Operations left panel: compact workload distribution rows.
- Quick Actions right panel: direct actions for assign/rebalance.
- Alerts zone: over-capacity and assignment-aging breaches.

Priority level:
- High

Decision output format:
- Interpretation:
  - Good: Balanced editor load, low assignment aging
  - Bad: Uneven load or growing unassigned queue
  - Critical: Multiple editors overloaded + aging tasks breaching SLA window
- Suggested action:
  - Auto-suggest reassignment set
  - Prioritize oldest unassigned tasks
  - Add temporary reviewer/editor capacity

## 4. Trust Score System
Exact metrics:
- Composite Trust Score (0-100)
- SLA adherence (% delivered within SLA)
- Client sentiment proxy (thumbs-up/down or CSAT-lite %)
- Revision reliability (% tasks completed within allowed revision bands)
- Payment reliability (% successful on-time collections)

Why it matters:
- Creates one executive confidence indicator across quality, speed, and reliability.
- Helps leaders prioritize risk before churn signals appear.

How it should be displayed:
- Dedicated trust card with score, trend arrow, and top 2 drivers.
- Badge state mapping: Healthy / At risk / Critical.
- Drill-in link to score decomposition details.

Priority level:
- Medium

Decision output format:
- Interpretation:
  - Good: Score stable/high with healthy SLA and payment reliability
  - Bad: Score declining due to one weak driver
  - Critical: Multi-driver deterioration (SLA + sentiment + payment)
- Suggested action:
  - Launch recovery playbook for top failing driver
  - Assign owner and review window

## 5. Growth Engine (Leads, Conversion, Campaigns)
Exact metrics:
- New leads (period)
- Lead-to-qualified rate (%)
- Qualified-to-paying conversion (%)
- Campaign-attributed revenue (INR)
- Cost per qualified lead (if spend available)
- Pipeline velocity (median days lead to close)

Why it matters:
- Connects marketing activity to actual revenue outcomes.
- Prevents top-of-funnel growth from masking poor conversion.

How it should be displayed:
- Performance Snapshot growth card with compact funnel mini-bars.
- Signal Bar secondary indicator for leads and conversion delta.
- Alerts for conversion drop or campaign underperformance thresholds.

Priority level:
- Medium

Decision output format:
- Interpretation:
  - Good: Lead quality and conversion moving with positive revenue attribution
  - Bad: Lead volume up but qualified/pay conversion weak
  - Critical: Campaign spend rising with conversion and attribution decline
- Suggested action:
  - Pause weak campaigns
  - Reallocate budget to highest converting source
  - Tighten lead qualification criteria

## 6. Chat Intelligence (Response Time, Missed Chats)
Exact metrics:
- First response time (median, minutes)
- Resolution time (median, hours)
- Missed chats (count and %)
- Backlog volume (open conversations > SLA threshold)
- Handoff rate bot-to-human (%)
- Reopen rate for resolved chats (%)

Why it matters:
- Chat latency directly impacts client trust and conversion outcomes.
- Missed conversations represent revenue and retention leakage.

How it should be displayed:
- Signal Bar: active chats and missed-chat indicator.
- Core Operations feed: response SLA trend and backlog status.
- Alerts zone: missed-chat spikes and SLA breach clusters.

Priority level:
- High

Decision output format:
- Interpretation:
  - Good: FRT and missed chat rates within target band
  - Bad: Slower first responses or backlog growth
  - Critical: Missed chat spike and SLA breach cluster
- Suggested action:
  - Route overflow to available managers/editors
  - Trigger bot-first fallback for peak periods
  - Escalate unresolved chats beyond threshold

## 7. Critical Alerts (Money Leaks, Delays, Failures)
Exact metrics:
- Failed payments (count, INR value at risk)
- Overdue approvals (count, age buckets)
- Delivery delays beyond SLA (count)
- Integration failures (WhatsApp/Instagram sync failures count)
- Broadcast or automation failures (count)
- High-risk accounts/projects (count)

Why it matters:
- Concentrates high-impact operational risk in one triage queue.
- Enables fast intervention on revenue and delivery threats.

How it should be displayed:
- Dedicated high-priority alert stack at top of Section 5.
- Severity ordering: Critical -> High -> Medium.
- Each alert row must include owner, age, impact amount (INR), urgency badge, and primary CTA.
- Urgency must be explicit:
  - Critical: immediate action
  - High: action within same day
  - Medium: action within 24-48h

Priority level:
- High

Decision output format:
- Interpretation:
  - Good: No critical alerts, low total impact at risk
  - Bad: Multiple high alerts with moderate financial exposure
  - Critical: At least one critical alert with significant INR impact
- Suggested action:
  - Open triage queue pre-filtered by highest INR impact
  - Assign owner and due time automatically

## 3D Icon System (Strict)
### Allowed placement
Use 3D icons only in:
- Primary top cards (when it improves scan speed)
- Integration cards
- Empty states

### Disallowed placement
Do not use 3D icons in:
- Sidebar
- Tables
- Dense data rows
- Small buttons

### Style constraints
- Single icon family only
- Soft 3D (matte or subtle gloss)
- Controlled palette aligned to design tokens
- Consistent light direction and shadow style

### Size system
- Large cards: 48-64px
- Medium cards: 32px
- No mixed ad-hoc sizing

### Performance constraints
- Prefer optimized SVG or lightweight Lottie
- Avoid heavy GLTF on Overview; if ever used, lazy-load only

## Data Visual System
Required micro-visuals:
- Revenue sparkline (small inline chart)
- Active chats indicator (live/near-live pulse or count trend)
- Seat usage progress bar
- SLA/health state indicator

Avoid:
- Large decorative charts
- Dense chart legends on Overview
- Visuals without direct decision value

## Glassmorphism Rules (Strict)
Use controlled glass surfaces only where hierarchy benefits.

Exact constraints:
- Surface background: low-opacity dark tint
- Backdrop blur: 6px-12px max
- Border: 1px subtle low-opacity line
- Shadow: soft depth, no neon glow
- Hover: slight lift + subtle border brighten

Avoid:
- Blur-heavy frosted treatment across all cards
- Always-on glowing borders
- Neon shadows

## Interaction Rules
- Card hover: very subtle lift
- Button active: slight scale down
- Sidebar active: clean highlight, no flash
- Motion: short and calm (tokenized)
- No decorative animation loops in critical data zones

## UX Improvements to Apply
- Remove non-actionable intro paragraphs and hero blocks
- Replace long text with:
  - KPI values
  - Status chips
  - Progress indicators
  - Immediate actions
- Ensure each section answers:
  - What changed?
  - What needs attention?
  - What can I do next?
- Convert raw numbers into decision cards:
  - Metric
  - Interpretation (Good/Bad/Critical)
  - Suggested action

## Smart Insights (Max 3)
Purpose:
- Provide concise, high-signal recommendations derived from Tier 1 metrics.

Rules:
- Show maximum 3 insights.
- Each insight must fit one short sentence.
- Each insight must include one action CTA.
- No generic narration or descriptive filler text.

Insight template:
- Insight: "Missed chats rose to 6.2% in last 24h (Critical)."
- Why it matters: "Potential revenue leakage from unhandled demand."
- Action: "Enable overflow routing for peak slots now."

## Component Rules (Using Existing Design System)
- All spacing, color, radius, shadow, and motion must use tokens
- Reuse global component classes (cards, buttons, inputs, badges, grid)
- No hardcoded hex colors inside page components
- Keep component density consistent across sections

## UI Pattern System
These patterns are mandatory across product pages to reduce UX drift and improve implementation consistency.

## 1. Table Pattern
Used for:
- Agencies
- Users
- Payments
- Requests

Structure:
- Top utility bar: search + filters + optional bulk controls
- Data table: fixed column model per entity
- Rows: clickable to open detail panel

Rules:
- Primary list interactions must happen in table context, not cards.
- Row-level actions should be compact and consistent.
- Actions should not be embedded inside dashboard-style cards for list management flows.

## 2. Detail Panel Pattern
Trigger:
- Opens on row click from a table.

Contents:
- Full record details
- Editable fields grouped logically
- Metadata and change-relevant status

Action model:
- Single primary action: Save
- Secondary actions may exist (Cancel/Close), but only one primary action is allowed.

Rules:
- Keep editing scoped to the panel to avoid page context switching.
- Panel should support clear dirty-state behavior and validation visibility.

## 3. Form Pattern
Rules:
- Group fields into clear sections with short section headings.
- Place labels above inputs (no placeholder-only labeling).
- Constrain form content to readable max width.
- Use one primary action per form section or submit region.

Behavior:
- Inline validation near fields.
- Error summary for failed submit when multiple fields are invalid.

## 4. Card Pattern
Used only for:
- Dashboard overview blocks
- Integration status/action cards

Not used for:
- Data lists
- Entity management grids
- Dense operational records (use tables instead)

Rule:
- Cards communicate summary/status; tables manage records and operations.

## 5. Status System
Standard mapping (use consistently across all pages):
- Success: `Connected`, `Approved`, `Completed`, `Healthy`
- Warning: `Pending`, `At risk`, `Needs review`
- Error: `Failed`, `Rejected`, `Critical`
- Info/Neutral: `Draft`, `In progress`, `Scheduled`

Rules:
- Always pair color with text label (never color-only meaning).
- Use the same label vocabulary everywhere; avoid synonyms that create ambiguity.

## 6. Button Hierarchy
Hierarchy:
- Primary: highest-importance action
- Secondary: supporting action
- Ghost: low-emphasis utility action

Rules:
- Only one primary action per section.
- If two actions appear equal, demote one to secondary.
- Keep destructive actions visually distinct and never primary by default.

Global enforcement:
- All existing and new pages must align with this hierarchy and pattern system.

## Content and State Rules
Required states per section:
- Loading state: compact skeletons
- Empty state: concise reason + single recommended action
- Error state: explicit status + recovery CTA

Status language standardization:
- Connected / Not connected / Pending
- Healthy / At risk / Critical
- Assigned / Unassigned

## Accessibility and Readability
- Maintain readable contrast on dark surfaces
- Keep tap targets comfortable even in compact density
- Do not rely on color alone for critical statuses (pair with label/icon)
- Respect reduced motion preferences

## Implementation Steps
Step 1: Remove hero-style section
- Replace oversized heading and marketing copy with compact operational header.

Step 2: Build signal cards row
- Add the four KPI cards in a single compact strip.

Step 3: Build integration cards
- Add WhatsApp and Instagram cards with strict status/action pattern.

Step 4: Add performance widgets
- Insert sparkline, SLA indicator, and seat utilization progress widget.

Step 5: Add alerts section
- Build high-priority actionable alert zone.

Step 6: Add 3D icons (controlled)
- Apply only in approved sections with size/style consistency.

Step 7: Polish spacing + typography
- Tune compact hierarchy and rhythm with tokens only.

## Acceptance Criteria
- Dashboard can be scanned in ~3 seconds for key signals
- No hero/marketing visual behavior remains
- All Overview visuals are token-aligned and reusable
- 3D icon usage follows strict placement and size rules
- Motion and glass effects remain subtle and performance-friendly
- Every major section supports immediate action
