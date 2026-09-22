export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    id: "home-what-is-gigxomi",
    question: "What is Gigxomi?",
    answer:
      "Gigxomi is an operations workspace for video editing agencies and freelance editors building teams. It brings client conversations, editor coordination, and project tracking into one workspace while keeping WhatsApp and Instagram clearly separate.",
  },
  {
    id: "home-who-is-it-for",
    question: "Who is Gigxomi built for?",
    answer:
      "Gigxomi is designed for video editing agencies, post-production studios, project managers, and freelance editors scaling into small teams. Internal teams collaborate on edits, while managers retain full control over client delivery.",
  },
  {
    id: "home-channels",
    question: "How do WhatsApp and Instagram integrations work?",
    answer:
      "Gigxomi keeps WhatsApp and Instagram client conversations visibly separate in the agency workspace. Managers can use the client context to organise work and coordinate the editing team.",
  },
  {
    id: "home-manager-approval",
    question: "Why does client communication require manager approval?",
    answer:
      "Gigxomi keeps internal team discussion separate from the client conversation. Managers control when an editor can reply to a client, so the team can clarify work internally before communicating externally.",
  },
  {
    id: "home-setup-time",
    question: "How quickly can an agency set up a workspace?",
    answer:
      "Setup starts with your agency details, then your client channels and team workflow. The exact setup depends on your existing channels and team structure.",
  },
  {
    id: "home-invite-only-managers",
    question: "Can managers sign up directly without an agency invitation?",
    answer:
      "No, manager roles are provisioned exclusively through invitations sent by agency workspace owners. This ensures role governance, strict billing control, and verified access to client communication channels.",
  },
];

export const PRICING_FAQS: FaqItem[] = [
  {
    id: "pricing-trial",
    question: "Is there a free trial available for agencies?",
    answer:
      "Yes, agencies can start with a 7-day full-featured trial of the Agency Workspace plan. No credit card is required to explore boards, review lanes, and team workflows during the trial period.",
  },
  {
    id: "pricing-billing-cycle",
    question: "What is the difference between monthly and yearly billing?",
    answer:
      "Yearly billing offers a discounted overall rate compared to month-to-month invoicing. Both options provide identical workspace features, Meta API channel connections, and internal collaboration tools.",
  },
  {
    id: "pricing-limits",
    question: "What happens when an agency reaches plan seat or channel limits?",
    answer:
      "Workspace owners receive advance alerts when reaching active team or channel thresholds. You can upgrade your tier or adjust seat allocations directly from the billing settings without service disruption.",
  },
  {
    id: "pricing-cancel-switch",
    question: "Can we cancel or switch plans at any time?",
    answer:
      "Yes, you can change your subscription tier or cancel renewal at any time through the billing dashboard. Your access continues uninterrupted through the end of the current paid billing cycle.",
  },
  {
    id: "pricing-founder-eligibility",
    question: "Who is eligible for the Founder Tier offer?",
    answer:
      "The Founder Tier is reserved for early agency adopters during the initial public rollout. Eligible accounts receive locked promotional rates on annual commitments while promotional allocations remain open.",
  },
  {
    id: "pricing-freelance-tier",
    question: "Why is the Freelance Editor plan ₹0?",
    answer:
      "Freelance video editors join workspace projects at ₹0 to keep team onboarding frictionless for hiring agencies. Editors gain internal task visibility, review tools, and portfolio discovery without platform subscription charges.",
  },
];

export const AGENCY_FAQS: FaqItem[] = [
  {
    id: "agency-manager-delegation",
    question: "How does manager delegation work across multiple client channels?",
    answer:
      "Agency owners can assign dedicated project managers to specific client WhatsApp numbers or Instagram accounts. Assigned managers triage briefs, assign editor tasks, and oversee communication for their designated accounts.",
  },
  {
    id: "agency-editor-assignment",
    question: "How are tasks dispatched to freelance video editors?",
    answer:
      "Managers assign projects to internal or roster editors directly from the 5-stage project board. Editors receive complete brief context, source drive links, and delivery deadlines within their private workspace lane.",
  },
  {
    id: "agency-lane-separation",
    question: "How does the internal versus client lane separation protect client relationships?",
    answer:
      "Internal comments, draft files, and peer critique remain completely invisible to the client. Only approved deliveries and formal revisions are pushed to the client's WhatsApp or Instagram chat by the manager.",
  },
  {
    id: "agency-zero-app-installs",
    question: "Do clients need to download or install Gigxomi to send briefs?",
    answer:
      "No, clients never install any new software, browser extensions, or mobile applications. They communicate entirely within their everyday WhatsApp or Instagram direct message threads as they always have.",
  },
  {
    id: "agency-meta-compliance",
    question: "Are Meta Cloud APIs secure and compliant?",
    answer:
      "Yes, Gigxomi interfaces exclusively with official Meta Cloud APIs using verified business authentication tokens. All webhooks, media exchanges, and conversation logs adhere to Meta business platform standards and privacy policies.",
  },
  {
    id: "agency-kanban-stages",
    question: "What are the 5 stages of the Gigxomi agency Kanban workflow?",
    answer:
      "The workspace tracks each cut through Inbox Triage, Brief Assigned, Internal Review, Manager Approved, and Delivered to Client. This ensures complete visibility into timeline bottlenecks before delivery deadlines.",
  },
];

export const FREELANCER_FAQS: FaqItem[] = [
  {
    id: "freelancer-wizard",
    question: "How does the 4-step onboarding wizard work for editors?",
    answer:
      "The setup wizard guides you through selecting your primary editing software, uploading showcase reel links, defining niche specialties, and setting your weekly bandwidth. You can complete and publish your profile in five minutes.",
  },
  {
    id: "freelancer-video-formats",
    question: "What video reel formats are supported on public editor portfolios?",
    answer:
      "Gigxomi supports direct video playback for MP4 previews as well as embedded links from YouTube, Vimeo, and cloud drive sources. Agency clients and creative directors can play your work instantly without downloading large files.",
  },
  {
    id: "freelancer-availability",
    question: "How do editors manage their project availability and capacity?",
    answer:
      "Editors can toggle their availability status between Available, Limited Capacity, or Booked with a single click. This prevents unwanted project dispatches when your production schedule is fully committed.",
  },
  {
    id: "freelancer-discovery",
    question: "How do agencies discover and hire editors through CoHub?",
    answer:
      "Verified agency owners browse the CoHub directory filtering by editing specialty, software expertise, and verified portfolio cuts. When a match is found, agencies initiate direct collaboration within their Gigxomi workspace.",
  },
  {
    id: "freelancer-portfolio-link",
    question: "Can I keep my editor portfolio public while freelancing independently?",
    answer:
      "Yes, your CoHub portfolio link remains public and shareable as your professional creative resume. You can share your link anywhere while receiving project offers inside the Gigxomi platform.",
  },
  {
    id: "freelancer-dispatch",
    question: "How does project dispatch work once an agency hires an editor?",
    answer:
      "Once invited to an agency project, you receive clear brief details, asset links, and review checklists in your dashboard. You submit cuts for internal manager review directly through the task card.",
  },
];
