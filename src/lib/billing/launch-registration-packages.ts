import type { RegistrationPackage, RegistrationPackageAudience } from "@/lib/gigxomi/public-growth-types";

const PREFERRED_SLUGS: Record<RegistrationPackageAudience, string[]> = {
  FREELANCER: ["freelancer-pro", "freelancer", "freelancer-starter"],
  AGENCY: ["agency-premium", "pkg-agency-premium", "agency-launch", "agency", "agency-scale", "agency-freemium"],
};

const LAUNCH_COPY: Record<RegistrationPackageAudience, Pick<RegistrationPackage, "name" | "shortSubtitle" | "description" | "featureBullets" | "compareHighlights">> = {
  FREELANCER: {
    name: "Freelancer",
    shortSubtitle: "₹0 forever — no subscription fee",
    description: "Build your editor business with a public portfolio, service marketplace, agency opportunities, delivery tools, and payouts at no subscription cost.",
    featureBullets: [
      "Free public editor profile and portfolio",
      "Publish services in Gigxomi marketplace",
      "Receive agency offers and apply for projects",
      "Manage chat, delivery, and revisions",
      "Track leads, earnings, wallet, and payouts",
      "Use analytics, profile boost, and verification tools",
    ],
    compareHighlights: ["₹0 forever", "Public portfolio", "Service marketplace", "Agency opportunities", "Delivery workflow", "Wallet & payouts"],
  },
  AGENCY: {
    name: "Agency Workspace",
    shortSubtitle: "₹2,000/month or ₹17,700/year · 7-day free trial",
    description: "Run multi-channel client inboxes, manager delegation, editor workflows, reviews, and payouts in one unified operations platform.",
    featureBullets: [
      "Unified WhatsApp & Instagram client inboxes (clients install 0 apps)",
      "Anti-Poaching Two-Lane Privacy (client phone numbers strictly masked)",
      "Manager Kanban pipeline (Inbound → Quotation Sent → In Progress → Review → Delivered)",
      "Unlimited project routing & manager reply approvals",
      "Curated on-demand specialist editor capacity roster",
      "Client review links, versioning, revisions & instant delivery sign-off",
      "Automated invoicing, PhonePe payment collections, and editor payout ledgers",
      "Real-time mobile push notifications for editors and managers",
    ],
    compareHighlights: [
      "Unified Multi-Channel Inbox",
      "Anti-Poaching Two-Lane Privacy",
      "Manager Delegation Boards",
      "Client Review Links",
      "Finance & Invoicing",
      "Curated Editor Roster",
    ],
  },
};

function selectForAudience(packages: RegistrationPackage[], audience: RegistrationPackageAudience) {
  const candidates = packages
    .filter((pkg) => pkg.audience === audience)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const preferred = PREFERRED_SLUGS[audience]
    .map((slug) => candidates.find((pkg) => pkg.slug === slug || pkg.id === slug))
    .find(Boolean);
  const selected = preferred ?? candidates.find((pkg) => pkg.isRecommended) ?? candidates[0];
  if (!selected) return null;

  return {
    ...selected,
    ...LAUNCH_COPY[audience],
    priceMonthly: audience === "AGENCY" ? 2000 : (selected.priceMonthly ?? 0),
    priceYearly: audience === "AGENCY" ? 17700 : (selected.priceYearly ?? 0),
    priceMonthlyInr: audience === "AGENCY" ? 2000 : (selected.priceMonthlyInr ?? 0),
    priceYearlyInr: audience === "AGENCY" ? 17700 : (selected.priceYearlyInr ?? 0),
    trialEnabled: audience === "AGENCY" ? true : selected.trialEnabled,
    trialDays: audience === "AGENCY" ? 7 : selected.trialDays,
    badgeText: audience === "AGENCY" ? "Recommended · 7-Day Free Trial" : "Free for freelancers",
    showBadge: true,
  } satisfies RegistrationPackage;
}

export function selectLaunchRegistrationPackages(packages: RegistrationPackage[]) {
  const selected: RegistrationPackage[] = [];
  const freelancer = selectForAudience(packages, "FREELANCER");
  if (freelancer) selected.push(freelancer);
  const agency = selectForAudience(packages, "AGENCY");
  if (agency) selected.push(agency);
  return selected;
}
