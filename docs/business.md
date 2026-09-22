# Gigxomi Business Operating Model & Technical Architecture

## 1. Core Platform Identity
Gigxomi is a **business operating system for video editing agencies and freelance video editors**.
- **Not an NLE**: Gigxomi does not render or edit video timelines.
- **Not an Escrow Service**: Gigxomi does not hold client funds in escrow.
- **0% Platform Commission**: Deals are 100% direct between agencies, clients, and freelancers. Gigxomi monetizes via software workspace subscriptions (Freemium vs. Premium plans).
- **Official Meta Partner**: Direct API connection for WhatsApp Business and Instagram Direct.
- **100% White-Label Client Experience**: Zero Gigxomi branding in front of creator clients. To the client, they are communicating directly with the agency's official WhatsApp or Instagram account.

---

## 2. Step-by-Step Project & Operational Lifecycle

### Step 1: Multi-Channel Inbound Client Leads (WhatsApp & Instagram)
- Creator inquiries from **WhatsApp Business** and **Instagram Direct** are automatically synced into one unified workspace inbox.
- No lost leads in personal messaging apps.
- The client receives automated or human replies from the agency's verified brand identity without third-party platform branding.

### Step 2: Editor Discovery, Portfolios & Team Building
- **Agency Work Creation**: Agencies can post work tasks or search the marketplace for talent.
- **Freelancer Applications**: Editors apply with their video portfolio links, specialty tags (Reels, Podcasts, Talking Head, Retention, Motion Graphics), and base pricing.
- **Team Roster**: Agency owners discover vetted editors, review video portfolios, send invitations, and organize them into their active agency team roster.

### Step 3: Freemium vs. Premium Assignment Rules
- **Freemium Workspace Plan**: Allows up to **2 active editor project assignments**.
- **Premium Workspace Plan**: Unlocks **unlimited editor project assignments** and team scaling.

### Step 4: The Two-Lane Architecture & Masked Privacy Protection
Every client project conversation in Gigxomi features **Two Distinct Communication Lanes**:
1. **Customer Lane (`customer`)**:
   - Primary channel between the **Agency** and the **Creator / Client**.
   - Agency manages the client relationship, project scope, deliverable milestones, and billing.
2. **Freelancer / Internal Lane (`internal`)**:
   - Private channel between the **Agency Owner / Manager** and the **Assigned Freelance Editor**.
   - Used for internal briefings, sharing raw assets, review notes, and editor payout requests.

#### 🛡️ Game-Changing Feature: Delegated Client Communication with Masked Privacy
- **The Problem in Video Production**:
  - If agencies act as the middleman for every revision note, huge communication bottlenecks occur.
  - If agencies give the editor the client's WhatsApp number, the editor and client often bypass the agency, leading to poached clients and lost business.
- **The Gigxomi Solution**:
  - The agency owner can toggle: `Allow Freelancer to Reply to Client`.
  - The assigned editor can now communicate directly with the client in real-time through the **Gigxomi Mobile App**.
  - **Phone Number Masking**: The client's phone number is masked (e.g., `+91 ******9382`) and the client's identity is anonymized as an alias.
  - The editor cannot see the client's personal phone number or steal the lead.
  - Direct communication eliminates revision lag, while the agency maintains total ownership of the client contract!

### Step 5: Project Completion, Payout Request & Accounting (0% Commission)
- **Editor Payout Request**: Upon successful cut delivery and sign-off, the editor requests their payout amount directly inside the Freelancer Lane.
- **Direct Deal**: The commercial terms and payout amount are agreed directly between the agency and the editor. Gigxomi takes 0% commission.
- **Agency Accounting Dashboard**:
  - The agency owner tracks all editor payables in one unified accounting ledger:
    - Editor Name & Assigned Project
    - Payout Amount Due (`freelancerAmount`)
    - Payment Status (`Pending`, `Paid`, `Credited`)
    - Direct payment method (UPI, Netbanking, or direct settlement)

### Step 6: Gigxomi Learning Library (Academy)
- **For Agencies**: Agency growth, inbound lead acquisition, client sales scripts, retainers vs one-off pricing, margin management.
- **For Freelance Editors**: Retention editing principles, pacing, sound design, hooks, kinetic typography, professional agency client communication.

### Step 7: Native Mobile Application (`gigxomi-mobile`)
- Built with React Native & Expo for iOS and Android.
- Allows agency founders and editors to:
  - Respond to creator leads instantly.
  - Switch between Customer Lane and Freelancer Lane.
  - Work with Masked Privacy on the go.
  - Track active cut review statuses and push notifications.
  - Manage editor payout accounting from their phone.
