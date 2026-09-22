# Gigxomi project offer lifecycle

This document is the product contract for the client-intake, operations, and freelancer assignment flow. Changes to web, mobile, WhatsApp, push notifications, or chat access should preserve this lifecycle.

## 1. Client intake through WhatsApp

The branded Gigxomi WhatsApp Flow begins with the cover message: **“To edit your video, please fill the form.”**

Required fields:

1. Project name
2. Google Drive link
3. Reference video link
4. Editing note

The completed intake is stored with the client conversation and enters the operations review queue. Flow payloads must be encrypted and signed according to Meta's WhatsApp Flow endpoint requirements. The server keeps the private key secret; only the matching public key is uploaded to Meta.

## 2. Operations review and editor matching

An admin or manager reviews the intake before offering it to editors. Eligible recipients must:

- belong to the agency workspace;
- match the requested editing category;
- be online; and
- be accepting projects.

Offline editors do not receive project offers and their response-time or Karma metrics are not affected.

## 3. Ten-minute project offer

The same offer may be sent simultaneously to all eligible category-matched editors. Every recipient receives:

- an in-app notification;
- a high-priority device notification on the project-assignment channel;
- a ringing/vibrating heads-up alert supported by their device settings;
- the project details in the internal lane; and
- Accept and Reject controls with a ten-minute deadline.

Creating an offer and delivering a device notification are separate results. The admin UI must report whether a device notification was actually delivered. A missing or invalid device token must not be described as a successful notification.

## 4. First acceptance wins

The first valid acceptance atomically assigns the project to that editor. The internal lane opens by default for the accepted editor. Other pending recipients receive: **“Oops, you missed this project. Stay online so you can earn from the next matching project.”**

Missed, rejected, and expired offers remain visible as normal read-only chat history so the outcome is understandable. They do not grant client or internal-lane write access.

## 5. Rejection, timeout, and Karma

Rejecting an offer requires a reason. Rejection or a ten-minute timeout can affect response-time and Karma metrics only when the editor was online and eligible when the offer was created. An editor who was offline is excluded from both notification delivery and performance impact.

## 6. Chat privacy

The accepted editor can use the internal project lane. Admins and managers can mark agency-only messages as private; those messages are never projected into the freelancer view. Direct client chat remains separately permissioned and masked.

## 7. Completion and review

After delivery and approval, operations can send the existing WhatsApp review/feedback Flow to the client. Feedback remains linked to the project and editor performance record.

## Operational checks

For every offer, logs and diagnostics should make these IDs traceable without exposing raw tokens:

- conversation ID;
- editor profile ID;
- authenticated freelancer user ID;
- number of active devices targeted;
- Firebase attempted, sent, and failed counts; and
- offer status, expiry reason, and responding editor.
