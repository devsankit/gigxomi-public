"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  trackPricingView,
  trackBillingCycleSelected,
  trackPlanSelected,
  trackCtaClick,
  CtaLocation,
} from "@/lib/analytics/funnel";

export function PricingViewTracker({
  billingCycle,
  planCount,
}: {
  billingCycle: "MONTHLY" | "YEARLY";
  planCount: number;
}) {
  useEffect(() => {
    trackPricingView({
      billingCycle: billingCycle === "YEARLY" ? "yearly" : "monthly",
      planCount,
    });
  }, [billingCycle, planCount]);

  return null;
}

export function PricingCycleSwitch({
  billingCycle,
}: {
  billingCycle: "MONTHLY" | "YEARLY";
}) {
  return (
    <nav aria-label="Billing cycle" className="gx-pricing-cycle-switch">
      <Link
        aria-current={billingCycle === "MONTHLY" ? "page" : undefined}
        href="/pricing?cycle=monthly#workspace-plans"
        onClick={() => trackBillingCycleSelected("monthly")}
      >
        Monthly
      </Link>
      <Link
        aria-current={billingCycle === "YEARLY" ? "page" : undefined}
        href="/pricing?cycle=yearly#workspace-plans"
        onClick={() => trackBillingCycleSelected("yearly")}
      >
        Yearly · Save ₹6,300
      </Link>
    </nav>
  );
}

export function PricingPlanCta({
  featured,
  ctaLabel,
  href,
  planId,
  planName,
  audience,
  billingCycle,
  isPendingPayment,
  canPostDirectly,
  resumeIntentId,
  salesReferralCode,
}: {
  featured: boolean;
  ctaLabel: string;
  href?: string;
  planId: string;
  planName: string;
  audience: "AGENCY" | "FREELANCER";
  billingCycle: "MONTHLY" | "YEARLY";
  isPendingPayment?: boolean;
  canPostDirectly?: boolean;
  resumeIntentId?: string;
  salesReferralCode?: string;
}) {
  const buttonClass = featured
    ? "gx-button gx-button-primary"
    : "gx-button gx-button-secondary";

  const cycleFormatted = billingCycle === "YEARLY" ? "yearly" : "monthly";

  const handleClick = () => {
    trackPlanSelected({
      planId,
      planName,
      audience,
      cycle: cycleFormatted,
    });
    trackCtaClick({
      ctaText: ctaLabel,
      location: "card",
      pageType: "pricing",
      targetUrl: href || "/api/billing/subscribe",
    });
  };

  if (canPostDirectly && href && isPendingPayment) {
    return (
      <Link className={buttonClass} href={href} onClick={handleClick}>
        Continue to payment <ArrowRight size={16} />
      </Link>
    );
  }

  if (canPostDirectly && !href) {
    return (
      <form action="/api/billing/subscribe" method="post" onSubmit={handleClick}>
        <input name="packageId" type="hidden" value={planId} />
        <input name="billingCycle" type="hidden" value={billingCycle} />
        {resumeIntentId ? <input name="intentId" type="hidden" value={resumeIntentId} /> : null}
        {salesReferralCode ? <input name="ref" type="hidden" value={salesReferralCode} /> : null}
        <button className={buttonClass} type="submit">
          {ctaLabel} <ArrowRight size={16} />
        </button>
      </form>
    );
  }

  return (
    <Link className={buttonClass} href={href || "/signup"} onClick={handleClick}>
      {ctaLabel} <ArrowRight size={16} />
    </Link>
  );
}

export function PricingCtaLink({
  href,
  className,
  children,
  target,
  rel,
  ctaText,
  location = "section",
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
  ctaText: string;
  location?: CtaLocation;
}) {
  const handleClick = () => {
    trackCtaClick({
      ctaText,
      location,
      pageType: "pricing",
      targetUrl: href,
    });
  };

  if (href.startsWith("http") || href.startsWith("#")) {
    return (
      <a href={href} className={className} target={target} rel={rel} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
