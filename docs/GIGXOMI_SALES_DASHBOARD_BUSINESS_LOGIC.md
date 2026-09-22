# Gigxomi Sales Dashboard Business Logic Context

Last updated: 2026-06-13

This document saves the rough business logic and future product direction for the Gigxomi sales dashboard. It is intended as planning context for scaling the current sales dashboard into a separate sales project later.

## Core Sales Flow

Leads should appear inside the sales dashboard in a shared lead queue. Salespeople should be able to claim a small batch of leads at a time, normally 3 to 5 leads, so each person has a manageable active workload.

Once a salesperson claims leads, those leads move into that salesperson's CRM/dashboard view. From there the salesperson calls the customer using the calling application that Gigxomi will provide. That calling app should be linked to the office SIM so business calls happen through the company-controlled number, not through unmanaged personal calling.

Calls should be recorded. Each call recording should be attached back to the correct lead and phone number so the dashboard always has a complete communication history.

After a call disconnects, the salesperson must add notes before moving forward. These notes should appear directly on the lead card/dashboard row for that particular lead and number. Every future call to the same number should show the previous history, including notes, call attempts, recordings, outcomes, and follow-up context.

## Lead History And Notes

Every lead should maintain a timeline. The timeline should include:

- Lead created/imported.
- Lead claimed.
- Agent assigned.
- Call started.
- Call disconnected.
- Recording attached.
- Notes added.
- Status changed.
- Follow-up date changed.
- Webinar link shared.
- Payment link shared.
- Payment completed.
- Lead closed or lost.

The dashboard should make this history visible in front of the same lead so a salesperson never loses context when calling again.

## Contact And Sync Logic

The sales system should support contact sync. If a salesperson saves a lead's number in the provided phone/app, that saved contact should also appear in the dashboard with the same identity.

Google Contacts can be used later if helpful, but the primary assumption is that Gigxomi provides an office-SIM-linked calling app and syncs contact information from that controlled calling workflow.

Email sync should also be considered so sales communication history can be connected to the same lead where possible.

## Lead Status Pipeline

The sales lead status should show where the lead currently is in the sales journey.

Initial planned statuses:

- `NEW_LEAD`: default status when the lead first arrives.
- `CONTACTED`: salesperson has spoken to or reached the lead.
- `WEBINAR_JOINED`: lead joined the webinar or sales event.
- `PENDING_DECISION`: lead is interested but has not made the final decision.
- `CLOSED`: lead converted successfully.
- `LOST`: lead did not convert.

These statuses should be shown clearly in the sales dashboard and should be easy to update after calls, webinars, and payment events.

## Round-Robin And Claim Timeout

Leads should not stay stuck with one salesperson if they are not claimed quickly.

Future round-robin logic:

- A lead appears in the dashboard queue.
- Eligible salespeople see the lead.
- If a salesperson claims it, it moves to their CRM.
- If no one claims it within 1 minute, the lead should pass to another eligible salesperson.
- The system should keep rotating the lead until it is claimed or handled by automation/admin rules.

This keeps fresh leads moving and prevents missed opportunities.

## Calling App Requirements

The calling workflow should be treated as a key part of the sales product.

Required behavior:

- Salesperson calls from the Gigxomi-provided application.
- Calls use the linked office SIM/business number.
- Call recordings are captured.
- Recording metadata is sent back to the dashboard.
- After disconnect, the dashboard prompts for notes.
- The salesperson should not be able to skip the call-note step for important call outcomes.
- Call history remains attached to the lead.

This can later become a mobile app or integrated calling system, but the business rule is that sales calling must be trackable, recorded, and connected to CRM notes.

## LMS And Training Unlocks

Gigxomi should provide proper sales training through videos/LMS.

For freshers, the system should teach sales step by step before unlocking lead access.

Initial training idea:

- Fresher joins as a sales trainee.
- They must watch the first set of training videos.
- Example: 6 videos for initial training.
- After completing the required training, they unlock the lead grab/claim feature.
- Before training completion, they cannot claim live leads.

The training gate should be strict. Agents should not be allowed to claim leads until required videos/tests are completed.

## Gamified Career Progression

The sales journey should be systemized and gamified so a new person can grow into a leader over time.

Planned progression:

1. Fresher joins and completes initial LMS training.
2. After training, lead claiming is unlocked.
3. After closing deals, the next level of advanced sales training unlocks.
4. As performance improves, more dashboard features unlock.
5. If the salesperson achieves around 2 lakh in monthly target, team management access unlocks.
6. Once team management unlocks, the person becomes a leader and can manage a team.
7. After roughly 1 year of strong performance, a leader can become a super leader.
8. A super leader can manage around 5 leaders.

This creates a one-year structured growth plan for salespeople and leaders.

## Team And Leadership Logic

Team access should not be given to everyone from day one.

Team management should unlock only after clear performance milestones, such as:

- Consistent sales activity.
- Closed deals.
- Monthly target achievement.
- Around 2 lakh target in a month.
- Completion of required leadership training.

Leader role:

- Manages salespeople.
- Reviews performance.
- Helps agents improve.
- Tracks team targets.

Super leader role:

- Manages multiple leaders.
- Suggested structure: one super leader manages 5 leaders.
- Should unlock after about 1 year of strong performance and system trust.

## Referral, Webinar, And Payment Link Tracking

Every sales agent should have trackable links.

Required link types:

- Webinar link.
- Signup link.
- Payment link.
- Package-specific payment link.
- Referral link.

When a salesperson shares a link, the system should know which agent shared it. If the customer joins a webinar, signs up, or pays through that link, the event should automatically reflect in the salesperson's dashboard.

Important tracking events:

- Link created.
- Link shared.
- Link opened.
- Webinar registered.
- Webinar joined.
- Payment link opened.
- Payment started.
- Payment completed.
- Deal closed.

When payment is completed, the dashboard should automatically update:

- Lead status.
- Deal status.
- Agent revenue.
- Commission/earning.
- Leaderboard score.
- Target progress.

## Leaderboard And Competition

The sales dashboard should include leaderboard logic so the sales team feels competition and motivation.

Leaderboard views should include:

- Top performers this week.
- Top performers this month.
- Most revenue.
- Most closed deals.
- Best conversion rate.
- Most consistent follow-ups.
- Team leaderboard for leaders/super leaders.

The leaderboard should connect to gamification and progression. Strong performance should help unlock advanced training, team access, rewards, and leadership levels.

## Dashboard Modules Needed Later

Future sales dashboard modules should include:

- Lead Queue.
- My Claimed Leads.
- CRM Pipeline.
- Call History.
- Notes And Follow-ups.
- Training/LMS.
- Referral Links.
- Webinar Tracking.
- Payment Link Tracking.
- Earnings/Commission.
- Leaderboard.
- Team Management.
- Leader Dashboard.
- Super Leader Dashboard.
- Reports.

## Current Business Priority

The most important thing is to build a complete sales operating system, not just a simple CRM list.

The sales dashboard should manage:

- Leads.
- Calling.
- Recordings.
- Notes.
- Statuses.
- Follow-ups.
- Training.
- Unlocks.
- Referrals.
- Webinar tracking.
- Payment tracking.
- Earnings.
- Leaderboards.
- Team growth.

This context should be preserved for future product planning and implementation when the sales dashboard becomes a separate project.

