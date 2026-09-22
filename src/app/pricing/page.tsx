import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  CircleHelp,
  Layers3,
  MessageCircleMore,
  ShieldCheck,
  UsersRound,
  WalletCards,
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
  featured,
  isLoggedIn,
  pendingPaymentHref,
  pkg,
  resumeIntentId,
  salesReferralCode = "",
}: {
  billingCycle: "MONTHLY" | "YEARLY";
  featured: boolean;
  isLoggedIn: boolean;
  pendingPaymentHref?: string;
  pkg: RegistrationPackage;
  resumeIntentId?: string;
  salesReferralCode?: string;
}) {
  const canPostDirectly = isLoggedIn || Boolean(resumeIntentId);
  const isAgency = pkg.audience === "AGENCY";
  const isFreemium = Boolean(
    pkg.slug?.includes("freemium") ||
    pkg.id.includes("freemium") ||
    pkg.name?.toLowerCase().includes("freemium") ||
    pkg.slug?.includes("trial") ||
    pkg.trialEnabled
  );
  const hasTrial = Boolean(pkg.trialEnabled || isFreemium);
  const cycleAmount = billingCycle === "YEARLY" ? (pkg.priceYearly ?? 17700) : (pkg.priceMonthly ?? 2000);
  const free = !isAgency && (pkg.amount ?? 0) <= 0;
  const features = getPlanFeatures(pkg);
  const ctaLabel = hasTrial
    ? "Start 7-Day Free Trial"
    : free
      ? "Start with Freemium"
      : canPostDirectly
        ? `Set up PhonePe AutoPay · ₹${Number(cycleAmount ?? 0).toLocaleString("en-IN")}/${billingCycle === "YEARLY" ? "year" : "month"}`
        : "Register with this plan";

  return (
    <article className={featured ? "gx-workspace-plan is-featured" : "gx-workspace-plan"}>
      <header className="gx-workspace-plan-header">
        <div>
          <p>BUSINESS WORKSPACE</p>
          <h3>{getPublicPlanName(pkg)}</h3>
          <span>{publicBusinessCopy(pkg.shortSubtitle || pkg.description || "For growing video editing teams")}</span>
        </div>
        {featured ? <em><BadgeCheck size={14} /> Recommended</em> : null}
      </header>

      <div className="gx-workspace-plan-price">
        <strong>
          {isFreemium
            ? "₹0"
            : free
              ? "₹0 forever"
              : billingCycle === "YEARLY"
                ? `₹${Number(cycleAmount ?? 17700).toLocaleString("en-IN")}`
                : `₹${Number(cycleAmount ?? 2000).toLocaleString("en-IN")}`}
        </strong>
        <span>
          {isFreemium
            ? "7-Day Free Trial (₹0 today) · ₹2,000/mo after trial"
            : free
              ? "No subscription fee"
              : billingCycle === "YEARLY"
                ? "per year · ₹1,475/month equivalent"
                : "per month · GST included"}
        </span>
      </div>

      <div className="gx-workspace-plan-meta">
        <span>{hasTrial ? "7-Day Free Trial (₹0 charged today)" : formatBillingType(pkg.billingType)}</span>
        <span>{billingCycle === "YEARLY" ? "Save ₹6,300 on annual billing" : "Cancel anytime · 2 projects included"}</span>
      </div>

      <div className="gx-workspace-plan-features">
        {features.map((feature) => <span key={feature}><Check size={15} /> {feature}</span>)}
      </div>

      <PricingPlanCta
        featured={featured}
        ctaLabel={ctaLabel}
        href={canPostDirectly && pendingPaymentHref ? pendingPaymentHref : buildSignupPackageHref(pkg.id, salesReferralCode)}
        planId={pkg.id}
        planName={getPublicPlanName(pkg)}
        audience={pkg.audience as "AGENCY" | "FREELANCER"}
        billingCycle={billingCycle}
        isPendingPayment={Boolean(canPostDirectly && pendingPaymentHref)}
        canPostDirectly={canPostDirectly && !pendingPaymentHref}
        resumeIntentId={resumeIntentId}
        salesReferralCode={salesReferralCode}
      />
    </article>
  );
}

const FALLBACK_PRICING_PACKAGES: RegistrationPackage[] = [
  {
    id: "pkg-agency-premium",
    slug: "agency-premium",
    name: "Agency Workspace",
    audience: "AGENCY",
    priceMonthlyInr: 2000,
    priceYearlyInr: 20000,
    pricePerAdditionalSeatInr: 500,
    shortSubtitle: "7-day free trial · 2 projects · ₹0 today",
    description: "Run multi-channel client inboxes, manager delegation, and editor workflows with zero upfront cost. Test with 2 live projects or for 7 days before subscribing.",
    featureBullets: [
      "Unified WhatsApp & Instagram client inbox (clients install 0 apps)",
      "Controlled collaboration lane with manager reply approvals",
      "Manager Kanban stage boards (Inbound → Review → Delivered)",
      "Source and assign verified editors (2 active projects in trial)",
      "Client review links, revisions & delivery approvals",
      "Invoicing, collections, and financial accounting",
    ],
    compareHighlights: ["7-day free trial", "2 active projects", "Multi-channel inbox", "Controlled collaboration", "Manager delegation", "Client approvals"],
    badgeText: "7-Day Free Trial · 2 Projects",
    showBadge: true,
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
  const businessPackages = packages.filter((item) => item.audience === "AGENCY");
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
            <div><p className="gx-eyebrow">Workspace plans</p><h2>Choose the capacity you need now.</h2></div>
            <p>Start with your own editors and managers. Add screened marketplace editors only when project volume needs extra delivery capacity.</p>
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
