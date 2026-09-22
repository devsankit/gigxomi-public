You are working inside the existing Gigxomi Next.js repository.

PROJECT CONTEXT:
Gigxomi is building a full Sales Operating System, not only a basic CRM. The platform must support 1000+ remote sales people, freshers, sales agents, team leaders, managers, and super-admin operations.

Existing app context:

* Main app is built with Next.js.
* Main site/dashboard already exists.
* Sales dashboard exists at `/sales`.
* Super-admin sales area exists at `/super-admin/sales`.
* Sales team area exists at `/sales/team`.
* Existing Prisma database flow must be preserved.
* Existing auth/session/login flows must be preserved.
* Existing WhatsApp/chat integration must be preserved.
* Existing sales lead/deal APIs must be reused where available.
* Existing agent management actions must be preserved.
* Existing Gigxomi dark/lime design system must be followed.
* Gigxomi already has a video/player feature somewhere in the app; reuse/copy its pattern for LMS lesson videos instead of building a totally different-looking player.

BUSINESS GOAL:
Build a complete remote sales growth system:

CRM + Lead Import + Smart Round Robin + WhatsApp/Chat Timeline + Webinar Funnel + Deals/Orders + LMS Training + Brandless Video Player + AI Mock Call Placeholder + Training Ladder Unlocks + Leader Learning Wall + Gamified Leaderboard + Rewards/Gifts + Team Hierarchy + Commission/Referral/Payout Controls.

The system should train freshers, unlock leads gradually, let leaders guide teams, distribute leads fairly, track performance, and allow super-admin to manage everything from one polished dashboard.

DO NOT:

* Do not rebuild the full app.
* Do not replace existing auth.
* Do not break existing sales login.
* Do not break existing super-admin login.
* Do not delete existing Prisma fields.
* Do not rename existing production fields unless absolutely required.
* Do not leave dead buttons.
* Do not leave fake Kanban drag/drop.
* Do not keep long forms always visible.
* Do not create unstyled pages.
* Do not push to main until verification passes.

==================================================
IMPLEMENTATION STRATEGY
=======================

First inspect the existing codebase before writing code.

Audit:

* `/sales`
* `/sales/team`
* `/super-admin/sales`
* existing `/api/sales/*`
* existing `/api/super-admin/*`
* existing Prisma schema
* existing components
* existing drawer/modal/table/card components
* existing video/player/embed components
* existing WhatsApp/chat components
* existing agent management APIs/actions
* existing lead/deal APIs/actions

Create implementation using existing project conventions.

If a feature already exists:

* improve it
* connect it properly
* make it visible in correct UI
* do not duplicate it unnecessarily

If a feature is missing:

* add minimal production-safe implementation
* keep it typed
* add role checks
* connect it to UI
* add loading/error states

==================================================
CORE USER ROLES
===============

Support these role concepts using existing role system if already present:

1. SUPER_ADMIN
   Full control:

   * lead import
   * lead pool
   * round robin
   * agents
   * teams
   * LMS
   * courses
   * lessons
   * video links
   * training ladder
   * unlock rules
   * AI mock review
   * webinars
   * rewards
   * leaderboard
   * commission
   * payout
   * reports
   * announcements
   * leader learning posts

2. SALES_MANAGER / TEAM_LEADER
   Controlled team access:

   * view own team
   * view team leads
   * view team progress
   * post learning thoughts for own team
   * review mock calls if permission exists
   * manage webinars if permission exists
   * request/promote team members if permission exists

3. SALES_AGENT
   Sales execution:

   * view assigned leads
   * use CRM pipeline
   * call/WhatsApp leads
   * invite leads to webinar
   * create deals
   * complete LMS
   * submit mock calls
   * view progress
   * copy referral links
   * view leaderboard/rewards

4. TRAINEE
   Learning-first access:

   * access LMS
   * watch training videos
   * complete lessons/quizzes
   * submit mock call practice
   * view training ladder
   * get limited leads only after unlock requirements

==================================================
MAIN SALES BUSINESS FLOW
========================

Lead Import
→ Duplicate/Validation Check
→ Lead Pool
→ Smart Round Robin Distribution
→ Sales Agent Calls/WhatsApps Lead
→ Agent Invites Lead to Webinar
→ Leader/Manager Conducts Webinar
→ Agent Follows Up
→ Negotiation
→ Deal Won/Lost
→ Revenue/Commission/Leaderboard Updated
→ Training/Promotion/Gift Progress Updated

CRM stages:

* New
* Assigned
* Contacted
* Interested
* Webinar Invited
* Webinar Attended
* Follow Up
* Negotiation
* Closed Won
* Closed Lost
* Not Reachable
* Recycled

==================================================
PAGE MAP
========

Implement/upgrade these pages:

1. `/sales`
   Agent sales dashboard:

* Overview
* CRM Pipeline
* My Leads
* Follow-ups
* Webinar Invites
* Deals / Orders
* My LMS summary
* AI Practice summary
* My Performance
* Leaderboard
* Referral Links
* Leader Insights

2. `/sales/lms`
   Agent LMS player:

* courses
* modules
* lessons
* video player
* lesson completion
* progress
* training ladder
* quizzes/mock call actions
* next unlock
* leader insights

3. `/sales/team`
   Team dashboard:

* team tree
* team members
* subagent requests
* team performance
* team training progress
* lead allocation
* team leaderboard
* team leader insights

4. `/super-admin/sales`
   Complete sales control center:

* overview
* lead import
* lead pool
* round robin rules
* agents & teams
* CRM preview
* LMS control
* course builder
* training ladder / unlock rules
* AI mock review
* webinar management
* commission rules
* gift rewards
* leaderboard control
* payout approval
* learning wall / leader insights
* announcements
* reports

==================================================
SUPER ADMIN SALES CONTROL CENTER
================================

Route:
`/super-admin/sales`

This page must feel like a polished SaaS operations console.

Use tabs/sections:

1. Overview
2. Lead Import
3. Lead Pool / Queue
4. Round Robin Rules
5. Agents & Teams
6. CRM Pipeline Preview
7. LMS Control
8. Course Builder
9. Training Ladder / Unlock Rules
10. AI Mock Review
11. Webinar Management
12. Commission Rules
13. Gift Rewards
14. Leaderboard Control
15. Payout Approval
16. Learning Wall / Leader Insights
17. Announcements
18. Reports

Top-level buttons:

* Import Contacts
* Add Agent
* Create Course
* Add Module
* Add Lesson
* Create Training Stage
* Create Unlock Rule
* Create Webinar
* Create Reward
* Create Announcement
* Create Learning Post
* Export Report

UI rules:

* every action opens drawer/modal
* no permanent long forms
* every tab has clean empty state
* every data operation has loading/error/success state
* every button must work or be disabled with clear “Coming soon”
* normal agents must never see super-admin controls

==================================================
SALES DASHBOARD `/sales`
========================

Required sections:

1. Metrics overview
2. CRM Pipeline
3. Today’s follow-ups
4. Webinar invites
5. Deals/orders
6. LMS progress
7. Training ladder
8. AI practice
9. Leaderboard
10. Referral links
11. Leader insights

Required buttons and placement:

* Add Lead: CRM toolbar
* Create Deal: Deals section
* Open WhatsApp: lead card and lead drawer
* Invite to Webinar: lead drawer
* Add Follow-up: lead drawer
* Copy Referral Link: Referral Links section and package cards
* Start Training: LMS summary card
* Continue Course: LMS summary card
* Start Mock Call: AI Practice section
* View Leader Insights: dashboard insights card

Do not place import button for normal sales agents unless permission exists.

==================================================
CRM KANBAN - MANDATORY DRAG/DROP
================================

The CRM board must have real drag/drop.

Use:

* `@dnd-kit/core`
* `@dnd-kit/sortable`

If not installed, install them.

Kanban columns:

* New
* Assigned
* Contacted
* Interested
* Webinar Invited
* Webinar Attended
* Follow Up
* Negotiation
* Closed Won
* Closed Lost
* Not Reachable
* Recycled

Lead card must be compact.

Card fields:

* customer name
* service/package interest
* budget
* priority
* assigned agent
* follow-up date
* WhatsApp quick action

Card actions:

* click card opens right-side lead drawer
* WhatsApp icon opens existing WhatsApp action
* drag card to stage changes lead stage

Drag/drop behavior:

* optimistic UI update
* call backend stage update API
* on success persist stage and refresh board
* on failure revert to original column and show error toast
* stage must remain updated after page refresh
* do not fake this with static columns

Lead drawer fields:

* customer name
* phone/WhatsApp
* email
* service interest
* segment
* priority
* tags
* budget
* follow-up date
* notes
* stage selector
* WhatsApp action
* webinar invite action
* create deal action
* communication timeline
* activity history
* save button

==================================================
LEAD CREATION
=============

Do not keep Add Lead form visible by default.

Add Lead button:

* opens drawer/modal
* submits to existing lead creation API where possible
* closes on success
* refreshes CRM
* shows success toast
* places lead in correct CRM stage

Fields:

* customer name
* WhatsApp number
* email
* service/package/editor need
* segment
* priority
* budget
* follow-up date
* tags
* notes

==================================================
CONTACT IMPORT
==============

Route:
`/super-admin/sales` → Lead Import tab

Add:

* Import Contacts button
* CSV/XLSX uploader
* import mode selector
* assign-to-agent selector
* assign-to-team/queue selector
* row preview
* validate button
* start import button
* result card

Import modes:

* add_to_round_robin_queue
* assign_to_selected_agent
* add_directly_to_crm

Supported columns:

* name
* customer name
* phone
* whatsapp
* email
* source
* segment
* service
* package
* interest
* budget
* priority
* follow up
* tags
* notes

Import result:

* imported count
* skipped count
* duplicate count
* invalid rows
* duplicate rows
* errors table

API:
`POST /api/sales/leads/import`

SUPER_ADMIN only.

If XLSX parser is missing, install safe package or support CSV first and add disabled XLSX UI with clear note. Prefer implementing both if project already has a parser.

==================================================
SMART ROUND ROBIN
=================

Route:
`/super-admin/sales` → Round Robin Rules tab

Super-admin can configure:

* active/inactive rule
* team-based distribution
* manager/leader pool
* max active leads per agent
* priority lead handling
* training level requirement
* verified agent priority
* skip inactive/suspended agents
* manual override
* distribution batch size

Distribution must respect:

* agent status
* role
* team
* current active lead count
* max active lead limit
* training ladder unlock
* suspension status
* permission to receive leads

Lead assignment history:
Store/log:

* lead id
* assigned to
* assigned by
* previous owner
* reason
* rule used
* createdAt

APIs:

* `GET /api/sales/round-robin/rules`
* `POST /api/sales/round-robin/rules`
* `PATCH /api/sales/round-robin/rules/[id]`
* `DELETE /api/sales/round-robin/rules/[id]`
* `POST /api/sales/leads/distribute`

If a lead cannot be assigned:

* keep it in Lead Pool
* show reason

==================================================
DEALS / ORDERS
==============

Route:
`/sales` → Deals / Orders section

Do not keep create deal form visible.

UI:

* Create Deal button
* Deal drawer/modal
* Deals table/cards
* Deal detail drawer

Deal list fields:

* deal title
* lead/customer
* package/manual deal
* agent
* agreed amount
* paid amount
* status
* payment reference
* closed date

Deal create fields:

* lead
* deal title
* package/manual deal
* agreed amount
* paid amount
* status
* payment reference
* handoff notes

Deal detail drawer:

* customer details
* payment information
* handoff notes
* WhatsApp action
* activity timeline

When deal is Closed Won:

* update revenue where existing system supports it
* update leaderboard metrics
* create/prepare commission/payout record if system supports it
* do not break existing deal flow

==================================================
WEBINAR FLOW
============

Routes/placement:

* `/sales` lead drawer: Invite to Webinar
* `/sales` dashboard: Webinar Invites
* `/super-admin/sales`: Webinar Management

Super-admin/leader can create:

* webinar title
* date/time
* host/leader
* registration link
* active status

Agent can:

* invite lead to webinar
* see invite status
* follow up after webinar

Track:

* invited
* registered if available
* attended
* missed
* closed after webinar

APIs:

* `GET /api/sales/webinars`
* `POST /api/sales/webinars`
* `PATCH /api/sales/webinars/[id]`
* `DELETE /api/sales/webinars/[id]`
* `POST /api/sales/webinars/invite`
* `PATCH /api/sales/webinars/invite/[id]/attendance`

If full webinar integration is too much:

* create working manual webinar management and invite tracking
* do not leave dead buttons

==================================================
LMS CONTROL - SUPER ADMIN
=========================

Route:
`/super-admin/sales` → LMS Control / Course Builder

Super-admin must manage:

* courses
* modules
* lessons
* video links
* lesson content
* quizzes
* mock call requirement
* manager review requirement
* required completion percentage
* lead unlock quantity
* role/team assignment
* course publish/unpublish
* course order

Course fields:

* title
* description
* thumbnail optional
* assigned role/team
* published status
* required completion percentage
* required quiz score
* required mock call approval
* lead unlock quantity
* order

Module fields:

* course id
* title
* description
* order
* locked/unlocked rule

Lesson fields:

* module id
* title
* description
* video URL
* content/body
* estimated duration
* required/optional
* order
* quiz required
* mock call required
* manager review required

UI:

* course list table
* Create Course button
* course drawer
* modules nested under course
* Add Module button
* lesson list under module
* Add Lesson button
* publish toggle
* assign role/team selector

APIs:

* `GET /api/sales/lms/courses`
* `POST /api/sales/lms/courses`
* `GET /api/sales/lms/courses/[id]`
* `PATCH /api/sales/lms/courses/[id]`
* `DELETE /api/sales/lms/courses/[id]`
* `POST /api/sales/lms/modules`
* `PATCH /api/sales/lms/modules/[id]`
* `DELETE /api/sales/lms/modules/[id]`
* `POST /api/sales/lms/lessons`
* `PATCH /api/sales/lms/lessons/[id]`
* `DELETE /api/sales/lms/lessons/[id]`

==================================================
BRANDLESS VIDEO TRAINING PLAYER
===============================

Gigxomi already has a player/video/embed feature.

Before creating LMS player:
Search codebase for:

* player
* video
* embed
* YouTube
* youtube
* iframe
* media
* lesson
* course

Reuse/copy existing Gigxomi player design/pattern.

Super-admin can paste:

* YouTube link
* direct video URL if supported
* Vimeo link if supported
* existing Gigxomi internal video/embed URL if supported

Sales agent should watch inside Gigxomi LMS player.

Important:

* Do not show ugly external page layout.
* Do not open YouTube page inside app.
* Use iframe/embed player.
* Wrap video inside Gigxomi branded training card.
* Use clean embed parameters where possible.
* Avoid showing unnecessary recommendations/external clutter where possible.
* Do not promise impossible complete removal of YouTube branding.
* Add fallback “Open video” only if embed fails.

Suggested YouTube embed handling:

* Convert normal YouTube URLs to embed URLs.
* Support youtu.be and youtube.com/watch?v= formats.
* Use safe iframe.
* Use allowed parameters like rel=0 where appropriate.
* Keep the Gigxomi UI around the player clean.

Completion:

* Track completion in Gigxomi, not YouTube.
* User clicks Mark Complete.
* If existing player progress tracking exists, reuse it.

==================================================
SALES LMS PLAYER
================

Route:
`/sales/lms`

Required layout:

* Left sidebar: course/module/lesson ladder
* Center: video/content player
* Right panel: progress and unlock status
* Bottom: leader notes / discussion / questions / actions

Course cards:

* title
* progress
* locked/unlocked
* next lesson
* continue button

Lesson player:

* video/content
* Mark Complete button
* Next Lesson button
* Quiz button if required
* Mock Call button if required
* Manager Review pending label if required

Progress panel:

* course completion percentage
* completed lessons
* locked modules
* unlocked modules
* quiz status
* mock call status
* manager review status
* leads unlocked
* next unlock requirement

APIs:

* `POST /api/sales/lms/progress`
* `GET /api/sales/lms/my-progress`
* `POST /api/sales/lms/quiz-attempt`
* `POST /api/sales/lms/mock-call`

==================================================
TRAINING LADDER / UNLOCK SYSTEM
===============================

Show ladder in:

* `/sales` dashboard
* `/sales/lms` right progress panel
* `/super-admin/sales` Training Ladder tab

Default ladder:

1. Trainee Joined
2. Orientation Complete
3. Product/Package Training Complete
4. Script Training Complete
5. Objection Handling Complete
6. AI Mock Call Submitted
7. Quiz Passed
8. Manager Review Approved
9. Unlock 10 Leads
10. First Follow-up Review
11. Unlock 20 Leads
12. Verified Sales Agent
13. Monthly Target ₹2L Achieved
14. Manager Path Unlocked
15. Team Creation Access Unlocked

Rules:

* locked steps display lock icon
* completed steps display completion
* current step highlighted
* super-admin can override
* manager approval can be required
* lead assignment respects unlock lead limit
* manager/team creation remains locked until promotion rule passes

APIs:

* `GET /api/sales/training-ladder`
* `POST /api/sales/training-ladder`
* `PATCH /api/sales/training-ladder/[id]`
* `DELETE /api/sales/training-ladder/[id]`
* `POST /api/sales/training-ladder/evaluate`

If existing role/permission system does not support all of this yet:

* implement minimal unlock records
* keep UI functional
* document limitations

==================================================
AI MOCK CALL
============

First version can be text-based and manual review based.

Sales agent UI:
Route/section:

* `/sales` → AI Practice
* `/sales/lms` lesson action if mock call required

Fields:

* scenario
* response/transcript
* notes optional
* submit button

Scenarios:

* cold lead
* price objection
* trust objection
* webinar invite
* closing call

Super-admin/manager UI:
Route:

* `/super-admin/sales` → AI Mock Review

Review actions:

* score
* feedback
* approve
* reject
* request retry
* unlock next training step if approved

Optional AI:

* If existing AI API key/provider is available in env, create optional scoring function.
* If no provider exists, do not hardcode paid provider.
* Manual manager review is acceptable for first production version.

APIs:

* `POST /api/sales/lms/mock-call`
* `PATCH /api/sales/lms/mock-call/[id]/review`

==================================================
LEARNING THROUGH SHARING / LEADER INSIGHTS
==========================================

Create “Learning Wall” / “Leader Insights”.

Purpose:
Leaders and managers can share sales thoughts, scripts, objections, webinar learnings, closing examples, and motivation posts. Team members can learn from these posts.

Placement:

* `/sales` dashboard: Latest Leader Insights card
* `/sales/lms`: Leader Insights tab/panel below lesson/player
* `/sales/team`: Team-specific insights
* `/super-admin/sales`: Learning Wall / Leader Insights management tab

Who can post:

* SUPER_ADMIN can post to everyone
* SALES_MANAGER / TEAM_LEADER can post to their team
* Senior/verified agents can submit if permission exists, otherwise not required
* Trainees/agents can view and optionally react/acknowledge

Post types:

* Sales tip
* Objection handling
* Script
* Webinar learning
* Closing example
* Motivation
* Policy/update
* Case study

Fields:

* title
* body
* type/category
* audience: all/team/role
* teamId optional
* role optional
* authorId
* pinned
* active
* createdAt
* optional attachment/video/link

UI:

* card feed
* pinned posts first
* category filter
* search
* Create Learning Post button
* edit/delete/pin/unpin for authorized users
* helpful/acknowledge button if simple

APIs:

* `GET /api/sales/learning-wall`
* `POST /api/sales/learning-wall`
* `PATCH /api/sales/learning-wall/[id]`
* `DELETE /api/sales/learning-wall/[id]`
* `POST /api/sales/learning-wall/[id]/helpful`
* optional `POST /api/sales/learning-wall/[id]/acknowledge`

Database models if missing:

* SalesLearningPost
* SalesLearningPostReaction
* optional SalesLearningPostComment

Permissions:

* SUPER_ADMIN: full access
* SALES_MANAGER / TEAM_LEADER: create/edit own team posts
* SALES_AGENT / TRAINEE: view relevant posts, react/acknowledge

==================================================
TEAM HIERARCHY `/sales/team`
============================

Required sections:

* Team overview
* Team tree
* Team members table
* Subagent requests
* Team performance
* Training progress
* Lead allocation overview
* Team leaderboard
* Team insights

Fields:

* name
* role
* status
* parent manager/leader
* training level
* active leads
* closed revenue
* conversion rate
* max active leads
* can claim leads
* can create subagents
* commission override

Manager/team leader actions:

* add/invite subagent only if allowed
* view member progress
* view member leads
* request promotion
* post team learning insight
* view team leaderboard

Super-admin retains final approval.

==================================================
LEADERBOARD / GAMIFICATION
==========================

Show leaderboard on:

* `/sales`
* `/sales/team`
* `/super-admin/sales`

Leaderboard types:

* Top revenue this month
* Most webinar invites
* Best conversion rate
* Fastest follow-up
* Best trainee progress
* Best team leader
* Most improved agent

Agent dashboard cards:

* current rank
* team rank
* revenue
* conversion rate
* follow-up completion
* course progress
* current level
* next unlock
* gift eligibility

Super-admin controls:

* active leaderboard types
* reward period
* gift title
* gift condition
* visibility
* active/inactive state

APIs:

* `GET /api/sales/leaderboard`
* `GET /api/sales/rewards`
* `POST /api/sales/rewards`
* `PATCH /api/sales/rewards/[id]`
* `DELETE /api/sales/rewards/[id]`

==================================================
REFERRAL LINKS / COMMISSION
===========================

Sales agent must have referral/package link section.

Link format:
`/package/[slug]?ref=[agentCode]`

UI:

* package cards
* Copy Referral Link button
* copied toast
* referral code visible

Track if possible:

* referral code
* package copied/clicked
* sale source
* agent commission
* leader override
* manager override
* payout status

Super-admin commission controls:

* commission rules
* leader override
* manager override
* payout hold
* payout approval

APIs:

* `GET /api/sales/commission-rules`
* `POST /api/sales/commission-rules`
* `PATCH /api/sales/commission-rules/[id]`
* `GET /api/sales/payouts`
* `PATCH /api/sales/payouts/[id]/approve`
* `PATCH /api/sales/payouts/[id]/hold`

If full commission automation is not safe in this pass:

* create UI hooks and minimal records
* do not show fake paid status
* document limitations

==================================================
REPORTS
=======

Super-admin reports should show:

* total leads
* assigned leads
* unassigned leads
* contacted leads
* webinar invited
* webinar attended
* closed won
* closed lost
* revenue
* agent performance
* team performance
* LMS progress
* mock call completion
* payout pending
* learning wall engagement

Filters:

* date range
* team
* agent
* stage
* source

API:

* `GET /api/sales/reports`

==================================================
DATABASE / PRISMA GUIDANCE
==========================

Before changing Prisma:

* inspect existing schema
* reuse existing User/Lead/Deal/Agent/Team models where possible
* do not delete or rename existing fields
* do not create duplicate models for existing concepts
* add only missing models
* make migrations non-breaking

Possible models if missing:

SalesTrainingCourse:

* id
* title
* description
* thumbnailUrl optional
* assignedRole optional
* assignedTeamId optional
* published boolean
* requiredCompletionPercent
* requiredQuizScore optional
* requiresMockCall boolean
* requiresManagerReview boolean
* leadUnlockQuantity int
* order int
* createdById
* createdAt
* updatedAt

SalesTrainingModule:

* id
* courseId
* title
* description
* order
* createdAt
* updatedAt

SalesTrainingLesson:

* id
* moduleId
* title
* description
* videoUrl optional
* content optional
* estimatedDuration optional
* isRequired boolean
* quizRequired boolean
* mockCallRequired boolean
* managerReviewRequired boolean
* order
* createdAt
* updatedAt

SalesTrainingProgress:

* id
* userId
* courseId
* moduleId optional
* lessonId optional
* status
* completedAt optional
* progressPercent
* createdAt
* updatedAt

SalesQuizAttempt:

* id
* userId
* courseId optional
* lessonId optional
* score
* passed boolean
* answers json
* createdAt

SalesMockCallAttempt:

* id
* userId
* scenario
* transcript
* aiScore optional
* managerScore optional
* feedback optional
* status
* reviewedById optional
* reviewedAt optional
* createdAt

SalesUnlockRule:

* id
* title
* stepKey
* requiredCourseId optional
* requiredProgressPercent optional
* requiredQuizScore optional
* requiresMockApproval boolean
* requiresManagerReview boolean
* leadUnlockQuantity int
* unlockRole optional
* order
* active boolean

SalesAgentLevel:

* id
* userId
* currentLevel
* currentStep
* leadsUnlocked
* managerPathUnlocked boolean
* teamCreationUnlocked boolean
* updatedAt

SalesLeadAssignmentHistory:

* id
* leadId
* assignedToId
* assignedById optional
* previousOwnerId optional
* ruleId optional
* reason optional
* createdAt

SalesRoundRobinRule:

* id
* title
* teamId optional
* active boolean
* maxActiveLeads
* requireTrainingLevel optional
* priorityMode optional
* createdAt
* updatedAt

SalesWebinar:

* id
* title
* description optional
* hostId optional
* startsAt
* registrationLink optional
* active boolean
* createdAt
* updatedAt

SalesWebinarInvite:

* id
* webinarId
* leadId
* agentId
* status
* invitedAt
* attendedAt optional

SalesReward:

* id
* title
* description
* metricType
* targetValue
* period
* active
* createdAt
* updatedAt

SalesLearningPost:

* id
* title
* body
* category
* audience
* teamId optional
* role optional
* authorId
* pinned boolean
* active boolean
* createdAt
* updatedAt

SalesLearningPostReaction:

* id
* postId
* userId
* type
* createdAt

Use enums only if consistent with existing project style. Otherwise use strings safely.

Add useful indexes:

* userId
* agentId
* leadId
* teamId
* status
* stage
* createdAt
* courseId
* lessonId

==================================================
API ROUTE FULL MAP
==================

Use existing APIs where available. Add only missing routes.

Lead/CRM:

* existing lead create/list/update APIs must continue working
* stage update API must support Kanban drag/drop
* `POST /api/sales/leads/import`
* `POST /api/sales/leads/distribute`

Round Robin:

* `GET /api/sales/round-robin/rules`
* `POST /api/sales/round-robin/rules`
* `PATCH /api/sales/round-robin/rules/[id]`
* `DELETE /api/sales/round-robin/rules/[id]`

LMS:

* `GET /api/sales/lms/courses`
* `POST /api/sales/lms/courses`
* `GET /api/sales/lms/courses/[id]`
* `PATCH /api/sales/lms/courses/[id]`
* `DELETE /api/sales/lms/courses/[id]`
* `POST /api/sales/lms/modules`
* `PATCH /api/sales/lms/modules/[id]`
* `DELETE /api/sales/lms/modules/[id]`
* `POST /api/sales/lms/lessons`
* `PATCH /api/sales/lms/lessons/[id]`
* `DELETE /api/sales/lms/lessons/[id]`
* `GET /api/sales/lms/my-progress`
* `POST /api/sales/lms/progress`
* `POST /api/sales/lms/quiz-attempt`
* `POST /api/sales/lms/mock-call`
* `PATCH /api/sales/lms/mock-call/[id]/review`

Training Ladder:

* `GET /api/sales/training-ladder`
* `POST /api/sales/training-ladder`
* `PATCH /api/sales/training-ladder/[id]`
* `DELETE /api/sales/training-ladder/[id]`
* `POST /api/sales/training-ladder/evaluate`

Webinars:

* `GET /api/sales/webinars`
* `POST /api/sales/webinars`
* `PATCH /api/sales/webinars/[id]`
* `DELETE /api/sales/webinars/[id]`
* `POST /api/sales/webinars/invite`
* `PATCH /api/sales/webinars/invite/[id]/attendance`

Learning Wall:

* `GET /api/sales/learning-wall`
* `POST /api/sales/learning-wall`
* `PATCH /api/sales/learning-wall/[id]`
* `DELETE /api/sales/learning-wall/[id]`
* `POST /api/sales/learning-wall/[id]/helpful`
* optional `POST /api/sales/learning-wall/[id]/acknowledge`

Leaderboard/Rewards:

* `GET /api/sales/leaderboard`
* `GET /api/sales/rewards`
* `POST /api/sales/rewards`
* `PATCH /api/sales/rewards/[id]`
* `DELETE /api/sales/rewards/[id]`

Commission/Payout:

* `GET /api/sales/commission-rules`
* `POST /api/sales/commission-rules`
* `PATCH /api/sales/commission-rules/[id]`
* `GET /api/sales/payouts`
* `PATCH /api/sales/payouts/[id]/approve`
* `PATCH /api/sales/payouts/[id]/hold`

Reports/Announcements:

* `GET /api/sales/reports`
* `GET /api/sales/announcements`
* `POST /api/sales/announcements`
* `PATCH /api/sales/announcements/[id]`
* `DELETE /api/sales/announcements/[id]`

Every API must:

* check auth
* check role/permission
* validate input
* return clear errors
* not expose super-admin data to normal agents

==================================================
REUSABLE UI COMPONENTS
======================

Use existing components if available. Otherwise create reusable components:

* SalesMetricCard
* SalesStatusBadge
* SalesProgressBar
* TrainingLadder
* TrainingLadderStep
* SalesDataTable
* SalesDrawer
* ConfirmDialog
* EmptyState
* CoursePlayer
* CourseBuilder
* LessonEditor
* VideoEmbedPlayer
* LeaderboardCard
* TeamTree
* ImportResultCard
* RoundRobinRuleForm
* RewardConfigForm
* LearningPostCard
* LearningPostEditor
* MockCallReviewCard
* ReferralLinkCard

UI style:

* dark/lime Gigxomi theme
* polished cards
* compact layout
* responsive where possible
* no clutter
* no raw default browser UI

==================================================
BUTTON AUDIT REQUIREMENT
========================

Every visible button must be tested.

Required buttons:
Sales `/sales`:

* Add Lead
* Open Lead
* Save Lead
* Open WhatsApp
* Invite to Webinar
* Add Follow-up
* Create Deal
* Save Deal
* Copy Referral Link
* Start Training
* Continue Course
* Start Mock Call
* View Leader Insights

Sales LMS `/sales/lms`:

* Continue Course
* Open Lesson
* Mark Complete
* Next Lesson
* Start Quiz
* Submit Quiz
* Start Mock Call
* Submit Mock Call
* View Leader Insight

Sales Team `/sales/team`:

* View Member
* View Progress
* Invite/Add Subagent if permission exists
* Request Promotion if implemented
* Create Team Insight if leader permission exists

Super Admin `/super-admin/sales`:

* Import Contacts
* Validate Import
* Start Import
* Add Agent
* Approve Agent
* Suspend Agent
* Reset Password
* Delete Agent
* Create Course
* Edit Course
* Publish/Unpublish Course
* Add Module
* Add Lesson
* Save Lesson Video Link
* Create Training Stage
* Create Unlock Rule
* Override Unlock
* Create Webinar
* Invite/Track Webinar
* Review Mock Call
* Approve Mock Call
* Reject Mock Call
* Create Reward
* Edit Reward
* Create Learning Post
* Pin/Unpin Learning Post
* Delete Learning Post
* Create Announcement
* Export Report

If button cannot be implemented safely:

* disable it
* show tooltip or label explaining why
* document it under Known Limitations

==================================================
FINAL DOCUMENTATION
===================

Create/update:
`docs/GIGXOMI_SALES_CRM_LMS_OPERATING_SYSTEM.md`

Include:

1. Overview
2. Business logic
3. Role permissions
4. Page map
5. UI button map
6. API map
7. Prisma model map
8. Lead flow
9. Round robin logic
10. CRM Kanban behavior
11. LMS course/player behavior
12. Brandless video player behavior
13. Training ladder/unlock rules
14. AI mock call flow
15. Learning Wall/Leader Insights
16. Webinar flow
17. Team hierarchy
18. Leaderboard/rewards
19. Referral/commission/payout logic
20. Testing checklist
21. Known limitations
22. Future integrations:

    * Instagram chat
    * Facebook lead forms
    * voice AI mock calls
    * call recording
    * advanced commission automation
    * certificate generation
    * automated webinar attendance sync

==================================================
FINAL VERIFICATION BEFORE PUSH
==============================

Run:

* npm run lint
* npm run db:generate
* npm run build

Then manually verify:

Sales `/sales`:

* dashboard loads
* metrics load
* CRM Kanban loads
* Kanban has real drag/drop
* drag lead between stages persists after refresh
* drag failure reverts UI
* Add Lead opens drawer
* lead creation works
* lead drawer opens on card click
* lead edit saves
* WhatsApp action works
* webinar invite action visible/works
* follow-up action works
* Create Deal opens drawer
* deal saves and appears
* referral link copies
* LMS progress visible
* training ladder visible
* leaderboard visible
* leader insights visible
* AI practice visible

Sales LMS `/sales/lms`:

* courses appear
* player opens
* YouTube/video link plays inside Gigxomi UI
* external branding/clutter is minimized
* Mark Complete updates progress
* progress percentage updates
* locked/unlocked steps display correctly
* quiz/mock call actions appear when required
* mock call submission works
* leader insights visible

Sales Team `/sales/team`:

* team tree/list appears
* hierarchy visible
* team member stats visible
* training progress visible
* permissions respected
* team insights visible
* unauthorized actions hidden/disabled

Super Admin `/super-admin/sales`:

* all tabs visible
* Import Contacts works
* import result counts display
* lead pool visible
* round robin rule create/edit works
* distribute leads works
* Add Agent works
* approve/suspend/reset/delete agent still works
* LMS Control visible
* Create Course works
* Add Module works
* Add Lesson works
* YouTube/video link can be saved
* Course publish/assign works
* Training Ladder visible/editable
* Super-admin override works
* AI Mock Review works
* Webinar Management works
* Gift Rewards works
* Leaderboard Control works
* Learning Post create/pin/delete works
* Commission/Payout UI loads
* Reports load
* Announcements work

Quality checks:

* no console errors
* no TypeScript errors
* no dead buttons
* no broken drawers/modals
* no always-visible long form dumps
* no static fake Kanban
* no missing loading/error states for important actions
* existing login/auth/sales flows still work

PUSH RULE:
Only after all checks pass:

* commit message:
  `Complete Gigxomi sales CRM LMS operating system`
* push to `main`

If anything critical cannot be completed safely:

* do not silently skip
* document in Known Limitations
* leave UI disabled with clear message
* do not push to main if CRM Kanban, lead creation, super-admin agent management, LMS course creation, or build is broken.
