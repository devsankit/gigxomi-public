import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  CircleHelp,
  Clock,
  Layers3,
  Lock,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import { getPublicAuthIntentById } from "@/lib/auth/public-auth-intent-store";
import { getSessionContext } from "@/lib/auth/session";
import { listActiveRegistrationPackages } from "@/lib/gigxomi/public-growth-store";
import { trackSalesReferralEvent } from "@/lib/gigxomi/sales-store";
import type { RegistrationPackage } from "@/lib/gigxomi/public-growth-types";
import { prisma } from "@/lib/prisma";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import { MarketingFaq } from "@/components/public/marketing-faq";
import { PRICING_FAQS } from "@/lib/seo/public-faqs";
import {
  PricingViewTracker,
  PricingCycleSwitch,
  PricingPlanCta,
  PricingCtaLink,
} from "@/components/public/pricing-funnel-client";

const title = "Transparent Pricing Plans for Video Agencies | Gigxomi";
const description =
  "Choose a Gigxomi workspace plan for multi-channel client messaging, team capacity, project review, and delivery tracking without hidden fees.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/pricing"),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [companyKnowledgeBase.logoPath],
  },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function publicBusinessCopy(value: string) {
  return value.replace(/\bagencies\b/gi, "businesses").replace(/\bagency\b/gi, "business");
}

function getPublicPlanName(pkg: RegistrationPackage) {
  return publicBusinessCopy(pkg.name).replace(/^Business\s+/i, "");
}

function formatBillingType(value: RegistrationPackage["billingType"]) {
  if (value === "ONE_TIME_PAID") return "One-time payment";
  if (value === "RECURRING") return "Workspace subscription";
  return "Configured plan";
}

function getBillingPromise(pkg: RegistrationPackage) {
  if (pkg.billingInterval === "YEARLY" && (pkg.amount === 17700 || pkg.amount === 12000)) return "₹1,475/month equivalent";
  return pkg.autoRenewEnabled ? "Renews automatically" : "Manual renewal";
}

function getPlanFeatures(pkg: RegistrationPackage) {
  const features = new Set(
    (pkg.featureBullets.length ? pkg.featureBullets : pkg.compareHighlights ?? []).map(publicBusinessCopy),
  );

  if (pkg.whatsappIntegration) features.add("WhatsApp client intake and connected conversations");
  if (pkg.teamMemberLimit) features.add(`Add your editors and managers · up to ${pkg.teamMemberLimit} team members`);
  if (pkg.activeProjectLimit) features.add(`Manage up to ${pkg.activeProjectLimit} active projects`);
  if (pkg.editorFreelancerLimit) features.add(`Hire up to ${pkg.editorFreelancerLimit} additional marketplace editors`);
  if (pkg.paymentCollectionTools || pkg.invoiceTools) features.add("Payment, invoice, and payout visibility");
  if (pkg.analyticsAccess) features.add("Business performance and delivery analytics");

  return [...features].slice(0, 7);
}

function buildSignupPackageHref(packageId: string, salesReferralCode = "") {
  const params = new URLSearchParams({ packageId });
  if (salesReferralCode) params.set("ref", salesReferralCode);
  return `/signup?${params.toString()}`;
}

function isFreshPhonePePayment(createdAt: Date) {
  return createdAt.getTime() > Date.now() - 18 * 60 * 1000;
}

function WorkspacePlanCard({
  billingCycle,
  featured = true,
  isLoggedIn,
  pendingPaymentHref,
  pkg,
  resumeIntentId,
  salesReferralCode = "",
}: {
  billingCycle: "MONTHLY" | "YEARLY";
  featured?: boolean;
  isLoggedIn: boolean;
  pendingPaymentHref?: string;
  pkg: RegistrationPackage;
  resumeIntentId?: string;
  salesReferralCode?: string;
}) {
  const canPostDirectly = isLoggedIn || Boolean(resumeIntentId);
  const cycleAmount = billingCycle === "YEARLY" ? (pkg.priceYearly ?? 17700) : (pkg.priceMonthly ?? 2000);
  const ctaLabel = canPostDirectly
    ? `Set up PhonePe AutoPay · ₹${Number(cycleAmount ?? 0).toLocaleString("en-IN")}/${billingCycle === "YEARLY" ? "year" : "month"}`
    : "Start 7-Day Free Trial";

  const corePillars = [
    {
      title: "Unified Multi-Channel Inbound",
      desc: "WhatsApp Business & Instagram Graph integration. Clients message normally — they install zero apps.",
    },
    {
      title: "Anti-Poaching Two-Lane Privacy",
      desc: "Customer numbers strictly masked. Staff communicate externally only with agency 'Allow Reply' approval.",
    },
    {
      title: "Manager Kanban Delegation",
      desc: "Inbound → Quotation Sent → In Progress → Review → Delivered boards with private deal margins.",
    },
    {
      title: "Frame-Accurate Review Links",
      desc: "Branded client video player links with timestamped revision requests and instant delivery sign-off.",
    },
    {
      title: "Curated On-Demand Editor Roster",
      desc: "Hire screened specialist video editors instantly when client volume exceeds your in-house team.",
    },
    {
      title: "Automated Invoicing & Payouts",
      desc: "Instant client invoices, PhonePe payment collection gateway, and automated editor earnings tracking.",
    },
    {
      title: "Real-Time Mobile Push Companion",
      desc: "Native push notifications so your editors and managers catch briefs and revisions immediately.",
    },
    {
      title: "Unlimited Projects & Full Team Access",
      desc: "Add your full roster of editors and managers with custom permission boundaries and zero per-seat fees.",
    },
  ];

  return (
    <article className="gx-workspace-plan is-flagship-showcase">
      <div className="gx-flagship-glow-top" aria-hidden="true" />

      <header className="gx-flagship-header">
        <div className="gx-flagship-header-main">
          <div className="gx-flagship-badge-group">
            <span className="gx-badge-category">AGENCY WORKSPACE</span>
            <span className="gx-badge-trial"><Sparkles size={13} /> 7-Day Free Trial · ₹0 Today</span>
          </div>
          <h3>Agency Workspace</h3>
          <p>The complete management software for video editors and video editing agencies.</p>
        </div>
        <div className="gx-flagship-pill-tag">
          <BadgeCheck size={16} />
          <span>Recommended For Scaling Agencies</span>
        </div>
      </header>

      <div className="gx-flagship-body-grid">
        {/* Left Column: Pricing, Trial, and CTA */}
        <div className="gx-flagship-left">
          <div className="gx-flagship-price-box">
            <div className="gx-flagship-price-display">
              <span className="gx-flagship-currency">₹</span>
              <strong className="gx-flagship-amount">
                {billingCycle === "YEARLY"
                  ? Number(cycleAmount ?? 17700).toLocaleString("en-IN")
                  : Number(cycleAmount ?? 2000).toLocaleString("en-IN")}
              </strong>
              <span className="gx-flagship-period">
                /{billingCycle === "YEARLY" ? "year" : "month"}
              </span>
            </div>

            <div className="gx-flagship-cycle-tag">
              {billingCycle === "YEARLY" ? (
                <span><strong>₹1,475/month</strong> equivalent · Save <strong>25%</strong> (₹6,300/yr)</span>
              ) : (
                <span>Billed monthly · <strong>Cancel anytime</strong> · GST included</span>
              )}
            </div>
          </div>

          <div className="gx-flagship-trial-card">
            <div className="gx-trial-card-header">
              <Zap size={16} />
              <strong>Zero-Risk 7-Day Free Trial</strong>
            </div>
            <ul>
              <li><Check size={14} /> Full access to all operations & client messaging tools</li>
              <li><Check size={14} /> 2 live client projects included with zero charge today</li>
              <li><Check size={14} /> 1-click cancellation before day 7 with zero hassle</li>
            </ul>
          </div>

          <div className="gx-flagship-cta-container">
            <PricingPlanCta
              featured={true}
              ctaLabel={ctaLabel}
              href={canPostDirectly && pendingPaymentHref ? pendingPaymentHref : buildSignupPackageHref(pkg.id, salesReferralCode)}
              planId={pkg.id}
              planName="Agency Workspace"
              audience="AGENCY"
              billingCycle={billingCycle}
              isPendingPayment={Boolean(canPostDirectly && pendingPaymentHref)}
              canPostDirectly={canPostDirectly && !pendingPaymentHref}
              resumeIntentId={resumeIntentId}
              salesReferralCode={salesReferralCode}
            />
          </div>

          <div className="gx-flagship-reassurance">
            <span><Clock size={13} /> 3-Minute Instant Setup</span>
            <span>·</span>
            <span><Lock size={13} /> Bank-Grade Privacy</span>
            <span>·</span>
            <span><ShieldCheck size={13} /> 100% Satisfaction</span>
          </div>
        </div>

        {/* Right Column: Inclusions & Operational Value */}
        <div className="gx-flagship-right">
          <p className="gx-flagship-inclusions-label">EVERYTHING INCLUDED IN YOUR WORKSPACE</p>
          <div className="gx-flagship-features-grid">
            {corePillars.map((item, idx) => (
              <div key={idx} className="gx-flagship-feature-item">
                <div className="gx-feature-icon-wrapper">
                  <Check size={14} />
                </div>
                <div className="gx-feature-text">
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Trust Strip */}
      <footer className="gx-flagship-footer-strip">
        <div className="gx-flagship-trust-pillar">
          <ShieldCheck size={20} />
          <div>
            <strong>Anti-Poaching Protection</strong>
            <p>Clients see your brand. Editors only see encrypted tokens.</p>
          </div>
        </div>
        <div className="gx-flagship-trust-pillar">
          <Zap size={20} />
          <div>
            <strong>Zero App Install for Clients</strong>
            <p>Clients chat via WhatsApp & Instagram. You manage in dashboard.</p>
          </div>
        </div>
        <div className="gx-flagship-trust-pillar">
          <UsersRound size={20} />
          <div>
            <strong>1-on-1 Founder Onboarding</strong>
            <p>Direct WhatsApp support to migrate your current pipeline in minutes.</p>
          </div>
        </div>
      </footer>
    </article>
  );
}

const FALLBACK_PRICING_PACKAGES: RegistrationPackage[] = [
  {
    id: "pkg-agency-premium",
    slug: "agency-premium",
    name: "Agency Workspace",
    audience: "AGENCY",
    priceMonthly: 2000,
    priceYearly: 17700,
    priceMonthlyInr: 2000,
    priceYearlyInr: 17700,
    pricePerAdditionalSeatInr: 0,
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
    compareHighlights: ["7-Day Free Trial", "Anti-Poaching Privacy", "Multi-Channel Inbox", "Manager Kanban", "Review Links", "Payouts Ledger"],
    badgeText: "Recommended · 7-Day Free Trial",
    showBadge: true,
    trialEnabled: true,
    trialDays: 7,
    isRecommended: true,
    sortOrder: 1,
    isActive: true,
    isVisibleOnRegistration: true,
    allowRegistration: true,
    features: [],
    featureValues: [],
  },
  {
    id: "pkg-freelancer-pro",
    slug: "freelancer-pro",
    name: "Freelancer",
    audience: "FREELANCER",
    priceMonthlyInr: 0,
    priceYearlyInr: 0,
    pricePerAdditionalSeatInr: 0,
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
    badgeText: "Free for freelancers",
    showBadge: true,
    isRecommended: false,
    sortOrder: 2,
    isActive: true,
    isVisibleOnRegistration: true,
    allowRegistration: true,
    features: [],
    featureValues: [],
  },
];

async function getResilientRegistrationPackages(): Promise<RegistrationPackage[]> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Package store timeout")), 450)
    );
    return await Promise.race([listActiveRegistrationPackages(), timeoutPromise]);
  } catch {
    return FALLBACK_PRICING_PACKAGES;
  }
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, packages, params] = await Promise.all([getSessionContext(), getResilientRegistrationPackages(), searchParams]);
  const agencyPackages = packages.filter((item) => item.audience === "AGENCY");
  const preferredAgency =
    agencyPackages.find((pkg) => pkg.slug === "agency-premium" || pkg.id === "pkg-agency-premium") ??
    agencyPackages.find((pkg) => pkg.isRecommended) ??
    agencyPackages[0];
  const businessPackages = preferredAgency ? [preferredAgency] : [];
  const error = getValue(params.error);
  const intentId = getValue(params.intentId);
  const resumeIntent = intentId ? await getPublicAuthIntentById(intentId) : null;
  const salesReferralCode = getValue(params.ref) || resumeIntent?.salesReferralCode || "";
  const billingCycle = getValue(params.cycle) === "yearly" ? "YEARLY" : "MONTHLY";

  if (salesReferralCode) {
    await trackSalesReferralEvent({
      code: salesReferralCode,
      eventType: "PRICING_VIEW",
      path: `/pricing${getValue(params.packageId) ? `?packageId=${getValue(params.packageId)}` : ""}`,
      packageId: getValue(params.packageId) || undefined,
      userId: session.userId ?? resumeIntent?.userId ?? undefined,
      metadata: { source: "pricing_page" },
    }).catch((trackingError) => {
      console.error("[sales] Referral pricing view tracking failed", {
        code: salesReferralCode,
        error: trackingError instanceof Error ? trackingError.message : "Unknown referral tracking error",
      });
    });
  }

  const resumeIntentId =
    resumeIntent?.flow === "SIGNUP" && resumeIntent.userId && (resumeIntent.status === "PENDING_SUBSCRIPTION" || resumeIntent.status === "VERIFIED")
      ? resumeIntent.id
      : undefined;
  const canPostDirectly = session.role !== "GUEST" || Boolean(resumeIntentId);
  const billingUserId = session.userId ?? (resumeIntentId ? resumeIntent?.userId ?? null : null);
  let pendingPayments: Array<{ id: string; packageId: string; provider: string; redirectUrl: string | null; createdAt: Date }> = [];

  if (billingUserId) {
    try {
      pendingPayments = await prisma.paymentTransaction.findMany({
        where: { userId: billingUserId, provider: "PHONEPE", status: { in: ["PENDING", "INITIATED"] } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, packageId: true, provider: true, redirectUrl: true, createdAt: true },
      });
    } catch (paymentError) {
      console.error("[billing] Pending PhonePe lookup failed on pricing page", {
        userId: billingUserId,
        error: paymentError instanceof Error ? paymentError.message : "Unknown pricing payment lookup error",
      });
    }
  }

  const pendingPaymentByPackageId = new Map<string, string>();
  for (const payment of pendingPayments) {
    if (!pendingPaymentByPackageId.has(payment.packageId)) {
      const phonePeRedirectUrl = payment.redirectUrl?.trim() ?? "";
      if (phonePeRedirectUrl && isFreshPhonePePayment(payment.createdAt)) {
        pendingPaymentByPackageId.set(payment.packageId, phonePeRedirectUrl);
      }
    }
  }
  const visibleError = pendingPaymentByPackageId.size ? "" : error;
  const featuredPackage = businessPackages.find((pkg) => pkg.isRecommended) ?? businessPackages[0];

  return (
    <MarketingSiteShell>
      <main className="gx-pricing-page">
        <PricingViewTracker billingCycle={billingCycle} planCount={businessPackages.length} />

        <section className="gx-pricing-hero">
          <div className="gx-pricing-hero-copy">
            <p className="gx-eyebrow"><Layers3 size={14} /> Clear workspace pricing</p>
            <h1>Simple pricing for a serious video editing business.</h1>
            <p>Connect client conversations, your editors, managers, project reviews, marketplace capacity, payments, and payouts without stitching together more tools.</p>
            <div className="gx-cta-row">
              <PricingCtaLink className="gx-button gx-button-primary" href="#workspace-plans" ctaText="See pricing" location="hero">
                See pricing <ArrowRight size={16} />
              </PricingCtaLink>
              <a
                className="gx-button gx-button-secondary"
                href="https://wa.me/919993328124?text=Hi%20Gigxomi%20team%2C%20I%20want%20to%20know%20more%20about%20the%20workspace%20plans."
                rel="noreferrer"
                target="_blank"
              >
                Talk to support
              </a>
            </div>
            <div className="gx-pricing-trust-row">
              <span><ShieldCheck size={15} /> Clear plan inclusions</span>
              <span><UsersRound size={15} /> Your delivery team first</span>
              <span><CircleHelp size={15} /> Human onboarding support</span>
            </div>
          </div>

          <div className="gx-pricing-workspace-preview" aria-label="Gigxomi workspace plan preview">
            <header><span><i /> WORKSPACE OVERVIEW</span><em>Plan ready</em></header>
            <div className="gx-pricing-preview-main">
              <p>Everything behind the edit.</p>
              <strong>{featuredPackage ? getPublicPlanName(featuredPackage) : "Business workspace"}</strong>
              <span>{featuredPackage?.priceLabel ?? "Plan configured for your team"} {featuredPackage?.billingLabel ? `· ${featuredPackage.billingLabel}` : ""}</span>
            </div>
            <div className="gx-pricing-preview-flow">
              <span><MessageCircleMore size={16} /><b>Client inbox</b><small>Enquiries connected</small></span>
              <span><UsersRound size={16} /><b>Your team</b><small>Editors + managers</small></span>
              <span><WalletCards size={16} /><b>Money</b><small>Payouts visible</small></span>
            </div>
            <div className="gx-pricing-preview-alert"><BellRing size={16} /><p><strong>Delivery update</strong><span>Editor notified · Review ready</span></p><BadgeCheck size={17} /></div>
          </div>
        </section>

        <section className="gx-pricing-plans" id="workspace-plans">
          <div className="gx-pricing-section-heading">
            <div><p className="gx-eyebrow">Clear Software Pricing</p><h2>One complete plan. Everything your agency needs to scale.</h2></div>
            <p>Run your video editing business with unified client conversations, manager delegation, anti-poaching privacy, review links, and automated payouts.</p>
          </div>

          {visibleError ? <p className="gx-pricing-error">{visibleError}</p> : null}

          <PricingCycleSwitch billingCycle={billingCycle} />

          {businessPackages.length ? (
            <div className={businessPackages.length === 1 ? "gx-workspace-plan-grid is-single" : "gx-workspace-plan-grid"}>
              {businessPackages.map((pkg) => (
                <WorkspacePlanCard
                  billingCycle={billingCycle}
                  featured={pkg.id === featuredPackage?.id}
                  isLoggedIn={canPostDirectly}
                  key={pkg.id}
                  pendingPaymentHref={pendingPaymentByPackageId.get(pkg.id)}
                  pkg={pkg}
                  resumeIntentId={resumeIntentId}
                  salesReferralCode={salesReferralCode}
                />
              ))}
            </div>
          ) : (
            <div className="gx-pricing-empty">
              <strong>Workspace plans are being updated.</strong>
              <p>Talk to the Gigxomi team for current access and onboarding details.</p>
              <PricingCtaLink className="gx-button gx-button-secondary" href={companyKnowledgeBase.whatsappUrl} ctaText="Contact support" location="section">
                Contact support
              </PricingCtaLink>
            </div>
          )}
        </section>

        <section className="gx-pricing-inclusions">
          <div><p className="gx-eyebrow">One connected system</p><h2>What your workspace brings together.</h2></div>
          <div className="gx-pricing-inclusion-list">
            {[
              ["01", "Client conversations", "Keep WhatsApp and Instagram enquiries connected to the right client and project."],
              ["02", "Your editors and managers", "Add your own delivery team, assign work, and keep responsibility visible."],
              ["03", "Additional marketplace capacity", "Hire screened editors when your regular team needs extra support."],
              ["04", "Review and delivery control", "Route work through internal review before the final client handoff."],
              ["05", "Payments and payouts", "See collections, editor earnings, and payout progress beside delivery."],
              ["06", "Mobile project updates", "Push notifications help the responsible editor respond at the right time."],
            ].map(([index, label, copy]) => (
              <article key={index}><span>{index}</span><div><strong>{label}</strong><p>{copy}</p></div><Check size={16} /></article>
            ))}
          </div>
        </section>

        <MarketingFaq items={PRICING_FAQS} page="pricing" />

        <section className="gx-pricing-support">
          <div><p>Need help choosing?</p><h2>Understand the model before you register.</h2></div>
          <div>
            <PricingCtaLink className="gx-button gx-button-primary" href="https://app.gigxomi.com/signup?role=agency" ctaText="Start free workspace" location="section">
              Start free workspace
            </PricingCtaLink>
            <PricingCtaLink href={companyKnowledgeBase.whatsappUrl} rel="noreferrer" target="_blank" ctaText="WhatsApp support" location="section">
              WhatsApp support <ArrowRight size={15} />
            </PricingCtaLink>
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  );
}
