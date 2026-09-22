import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeIndianRupee,
  Bell,
  Blocks,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Compass,
  FolderCog,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  MessageSquare,
  MessageSquareText,
  Network,
  Package2,
  Radio,
  Receipt,
  ReceiptText,
  Send,
  Settings2,
  ShieldAlert,
  ShieldEllipsis,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  WalletCards,
} from "lucide-react";

export type SuperAdminSection =
  | "overview"
  | "learning"
  | "agencies"
  | "freelancers"
  | "approvals"
  | "packages"
  | "marketing"
  | "push-notifications"
  | "sales"
  | "knowledge-base"
  | "user-accounts"
  | "whatsapp-control"
  | "billing-control"
  | "editor-economics"
  | "platform-settings";

export type AdminSection =
  | "overview"
  | "roles"
  | "chat-inbox"
  | "assign-staff"
  | "managers"
  | "team-editors"
  | "team-requests"
  | "contacts"
  | "subscription"
  | "assignments"
  | "delivery-review"
  | "portfolio-review"
  | "payout-control"
  | "monetization"
  | "integrations"
  | "chatbot-builder"
  | "whatsapp-api-setup"
  | "instagram-inbox-setup"
  | "showcase-page"
  | "branding"
  | "agency-settings"
  | "agency-support";

export type ManagerSection =
  | "overview"
  | "chat-inbox"
  | "assigned-conversations"
  | "contacts"
  | "verification-review"
  | "service-review"
  | "quote-review"
  | "project-tracking"
  | "delivery-review"
  | "portfolio-review"
  | "wallet-review"
  | "escalations";

export type InternalNavItem<T extends string> = {
  id: T;
  label: string;
  icon: LucideIcon;
  href?: string;
  group?: "main" | "operations" | "extensions" | "workspace";
};

export const superAdminNavItems: Array<InternalNavItem<SuperAdminSection>> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/super-admin" },
  { id: "learning", label: "Learning & Growth", icon: BookOpen, href: "/super-admin/learning" },
  { id: "agencies", label: "Agencies", icon: Users, href: "/super-admin/agencies" },
  { id: "freelancers", label: "Freelancers", icon: UserCog, href: "/super-admin/freelancers" },
  { id: "approvals", label: "Approvals", icon: ShieldEllipsis, href: "/super-admin/approvals" },
  { id: "packages", label: "Packages", icon: Package2, href: "/super-admin/packages" },
  { id: "marketing", label: "Marketing", icon: LineChart, href: "/super-admin/marketing" },
  { id: "push-notifications", label: "Push & Drip Notifications", icon: Bell, href: "/super-admin/push-notifications" },
  { id: "sales", label: "Sales Control", icon: Network, href: "/super-admin/sales" },
  { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen, href: "/super-admin/knowledge-base" },
  { id: "user-accounts", label: "User Accounts", icon: UserCog, href: "/super-admin/signup" },
  { id: "whatsapp-control", label: "WhatsApp Control", icon: MessageSquareText, href: "/super-admin/whatsapp-control" },
  { id: "billing-control", label: "Billing Control", icon: ReceiptText, href: "/super-admin/billing-control" },
  { id: "editor-economics", label: "Editor Economics", icon: BadgeIndianRupee, href: "/super-admin/editor-economics" },
  { id: "platform-settings", label: "Platform Settings", icon: Settings2, href: "/super-admin/platform-settings" },
];

export const adminNavItems: Array<InternalNavItem<AdminSection>> = [
  // Main
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin", group: "main" },
  { id: "chat-inbox", label: "Chat Inbox", icon: MessageSquare, href: "/admin/chat", group: "main" },
  { id: "assign-staff", label: "Assign Staff", icon: UserCheck, href: "/admin/staff", group: "main" },
  { id: "team-editors", label: "Find Editors", icon: Compass, href: "/admin/freelancers", group: "main" },
  { id: "contacts", label: "Contacts", icon: Users, href: "/admin/contacts", group: "main" },

  // Operations
  { id: "assignments", label: "Work Hub", icon: FolderKanban, href: "/admin/assignments", group: "operations" },
  { id: "payout-control", label: "Payout Requests", icon: Receipt, href: "/admin/payout-requests", group: "operations" },

  // Extensions
  { id: "integrations", label: "Integrations", icon: Blocks, href: "/admin/integrations", group: "extensions" },
  { id: "chatbot-builder", label: "Chatbot Builder", icon: Bot, href: "/admin/chatbot", group: "extensions" },
  { id: "whatsapp-api-setup", label: "WhatsApp API Setup", icon: Radio, href: "/admin/integrations/whatsapp", group: "extensions" },
  { id: "instagram-inbox-setup", label: "Instagram Inbox Setup", icon: Send, href: "/admin/integrations/instagram", group: "extensions" },

  // Workspace
  { id: "subscription", label: "Subscription", icon: Sparkles, href: "/admin/packages", group: "workspace" },
  { id: "agency-settings", label: "Settings", icon: Settings2, href: "/admin/system-settings", group: "workspace" },
  { id: "agency-support", label: "Support", icon: LifeBuoy, href: "https://wa.me/919993328124?text=Hello%20Gigxomi%20Support%2C%20I%20need%20assistance", group: "workspace" },
];

export const superAdminAppLabel = "Gigxomi super admin";
export const superAdminProfileName = "Gigxomi HQ";
export const superAdminProfileMeta = "Platform owner";
export const superAdminHeaderPills: string[] = [];

export const adminAppLabel = "Gigxomi agency admin";
export const adminProfileName = "Gigxomi Studio";
export const adminProfileMeta = "Agency owner";
export const adminHeaderPills: string[] = [];

export const managerNavItems: Array<InternalNavItem<ManagerSection>> = [
  { id: "chat-inbox", label: "Chat Inbox", icon: MessageSquare, href: "/manager/chat", group: "main" },
  { id: "project-tracking", label: "Project Tracking", icon: FolderKanban, href: "/manager/project-tracking", group: "operations" },
  { id: "service-review", label: "Review Queue", icon: BriefcaseBusiness, href: "/manager/service-review", group: "operations" },
  { id: "contacts", label: "Contacts", icon: Users, href: "/manager/contacts", group: "main" },
];

export const adminOverviewMetrics = [
  { label: "Freelancers", value: "257" },
  { label: "Managers", value: "6" },
  { label: "Pending approvals", value: "19" },
  { label: "Open WhatsApp threads", value: "41" },
];

export const adminRoleSummary = [
  { role: "Admin", note: "Full control of roles, integrations, packages, and moderation." },
  { role: "Manager", note: "Handles intake, assignment, approvals, quotes, delivery, and escalations." },
  { role: "Freelancer", note: "Own profile, services, chats, wallet, and delivery submission only." },
];

export const adminIntegrationCards = [
  { title: "WhatsApp API", brand: "whatsapp", note: "Webhook, templates, token health, and delivery events." },
  { title: "Instagram Inbox", brand: "instagram", note: "Live direct messaging, story mentions, and customer lane routing." },
  { title: "PhonePe", brand: "phonepe", note: "Direct UPI intent links, merchant callbacks, and zero-fee settlement." },
  { title: "Razorpay Partner", brand: "razorpay", note: "Instant partner onboarding for cards, netbanking, and domestic auto-settlement." },
  { title: "Stripe Global", brand: "stripe", note: "International cards, Apple Pay, and multi-currency client invoicing." },
  { title: "YouTube API", brand: "youtube", note: "Agency channel uploads for client review samples and approved portfolio showcases." },
  { title: "Google Drive", brand: "google-drive", note: "Project folder sync, raw footage intake, and 4K export deliveries." },
] as const;

export const adminPackageCards = [
  { title: "Standard", fee: "30% commission", note: "Default plan for freelancers without subscription billing." },
  { title: "Monthly", fee: "5% fee", note: "Subscription plan for repeat freelancers who want lower transaction cost." },
  { title: "Quarterly", fee: "5% fee", note: "Longer billing cycle with the same low fee model." },
  { title: "Yearly", fee: "5% fee", note: "Best for heavy usage and stable repeat work." },
];

export const managerOverviewMetrics = [
  { label: "Threads waiting", value: "12" },
  { label: "Assigned editors", value: "28" },
  { label: "Pending quote review", value: "9" },
  { label: "Delivery follow-ups", value: "5" },
];

export const managerEscalations = [
  "Wedding project needs faster editor confirmation before quote goes live.",
  "Two finance clients requested weekly retainers and need manager approval on pricing.",
  "One freelancer exceeded promised delivery window and needs a response-time review.",
];

export const managerAppLabel = "Gigxomi manager panel";
export const managerProfileName = "Rahul Manager";
export const managerProfileMeta = "Operations manager";
export const managerHeaderPills: string[] = [];
