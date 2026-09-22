"use client";

import { useMemo, useState } from "react";
import { Building2, PackagePlus, Save, Settings2, UserRound, WalletCards } from "lucide-react";

import { AppSelect } from "@/components/ui/app-select";
import { MetricCard, StatusPill } from "@/components/ui/dashboard-primitives";
import type { PackageBillingInterval, PackageBillingType, RegistrationPackage, RegistrationPackageAudience } from "@/lib/gigxomi/public-growth-types";

type PackagesPayload = {
  ok?: boolean;
  error?: string;
  packages?: RegistrationPackage[];
  package?: RegistrationPackage;
};

type NullableNumberKey =
  | "serviceLimit"
  | "activeProjectLimit"
  | "portfolioItemLimit"
  | "teamMemberLimit"
  | "staffAccountLimit"
  | "clientLimit"
  | "editorFreelancerLimit"
  | "storageLimitMb"
  | "maxUploadSizeMb"
  | "aiCredits"
  | "proposalLimit"
  | "biddingApplyLimit"
  | "leadsUnlockLimit"
  | "commissionOverridePercent";

type BooleanFeatureKey =
  | "chatAccess"
  | "clientChat"
  | "teamChat"
  | "whatsappIntegration"
  | "aiToolsAccess"
  | "featuredListing"
  | "boostProfile"
  | "prioritySupport"
  | "analyticsAccess"
  | "advancedAnalytics"
  | "invoiceTools"
  | "paymentCollectionTools"
  | "whiteLabelAccess"
  | "brandingCustomization"
  | "automationTools"
  | "apiAccess"
  | "webhookAccess"
  | "verificationBadgeEligible"
  | "dedicatedManager";

type PackageDraft = {
  id: string;
  name: string;
  audience: RegistrationPackageAudience;
  priceLabel: string;
  billingLabel: string;
  statusLabel: string;
  shortSubtitle: string;
  description: string;
  badgeText: string;
  ctaLabel: string;
  billingType: PackageBillingType;
  billingInterval: PackageBillingInterval;
  currency: string;
  amount: number;
  priceMonthly: number;
  priceYearly: number;
  compareHighlightsText: string;
  featureBulletsText: string;
  isActive: boolean;
  isRecommended: boolean;
  allowRegistration: boolean;
  isVisibleOnRegistration: boolean;
  autoRenewEnabled: boolean;
  sortOrder: number;
  durationDays: number;
} & Record<NullableNumberKey, number | null> &
  Record<BooleanFeatureKey, boolean>;

type StatusState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

const LIMIT_FIELDS: Array<{ key: NullableNumberKey; label: string; help: string }> = [
  { key: "serviceLimit", label: "Service limit", help: "Freelancer services that can be active." },
  { key: "activeProjectLimit", label: "Active projects", help: "Concurrent assignments or marketplace tasks." },
  { key: "portfolioItemLimit", label: "Portfolio items", help: "Portfolio/showcase upload capacity." },
  { key: "teamMemberLimit", label: "Team members", help: "Total internal team slots." },
  { key: "staffAccountLimit", label: "Managers/staff", help: "Agency manager seat limit." },
  { key: "clientLimit", label: "Clients/contacts", help: "Client/contact database limit." },
  { key: "editorFreelancerLimit", label: "Editors/freelancers", help: "Agency editor/team freelancer limit." },
  { key: "storageLimitMb", label: "Storage MB", help: "Workspace storage allowance." },
  { key: "maxUploadSizeMb", label: "Max upload MB", help: "Single upload maximum." },
  { key: "proposalLimit", label: "Proposals", help: "Freelancer proposal/apply allowance." },
  { key: "biddingApplyLimit", label: "Apply limit", help: "Marketplace applications allowed." },
  { key: "leadsUnlockLimit", label: "Lead unlocks", help: "Unlocked lead/profile contact limit." },
  { key: "aiCredits", label: "AI credits", help: "Automation/AI credit balance." },
];

const FEATURE_TOGGLES: Array<{ key: BooleanFeatureKey; label: string; group: string }> = [
  { key: "chatAccess", label: "Chat access", group: "Workspace" },
  { key: "clientChat", label: "Client chat", group: "Workspace" },
  { key: "teamChat", label: "Team chat", group: "Workspace" },
  { key: "whatsappIntegration", label: "WhatsApp integration", group: "Automation" },
  { key: "automationTools", label: "Automation tools", group: "Automation" },
  { key: "aiToolsAccess", label: "AI tools", group: "Automation" },
  { key: "analyticsAccess", label: "Analytics", group: "Intelligence" },
  { key: "advancedAnalytics", label: "Advanced analytics", group: "Intelligence" },
  { key: "invoiceTools", label: "Invoice tools", group: "Money" },
  { key: "paymentCollectionTools", label: "Payment collection", group: "Money" },
  { key: "featuredListing", label: "Featured listing", group: "Growth" },
  { key: "boostProfile", label: "Boost profile", group: "Growth" },
  { key: "verificationBadgeEligible", label: "Verification badge", group: "Trust" },
  { key: "prioritySupport", label: "Priority support", group: "Support" },
  { key: "dedicatedManager", label: "Dedicated manager", group: "Support" },
  { key: "brandingCustomization", label: "Branding customization", group: "Brand" },
  { key: "whiteLabelAccess", label: "White-label access", group: "Brand" },
  { key: "apiAccess", label: "API access", group: "Developer" },
  { key: "webhookAccess", label: "Webhook access", group: "Developer" },
];

function createDraft(pkg?: RegistrationPackage, fallbackSortOrder = 1): PackageDraft {
  return {
    id: pkg?.id ?? "",
    name: pkg?.name ?? "",
    audience: pkg?.audience ?? "FREELANCER",
    priceLabel: pkg?.priceLabel ?? "INR 0",
    billingLabel: pkg?.billingLabel ?? "Per month",
    statusLabel: pkg?.statusLabel ?? "Package ready",
    shortSubtitle: pkg?.shortSubtitle ?? pkg?.statusLabel ?? "",
    description: pkg?.description ?? "",
    badgeText: pkg?.badgeText ?? "",
    ctaLabel: pkg?.ctaLabel ?? "",
    billingType: pkg?.billingType ?? (pkg?.isFree ? "FREE" : "RECURRING"),
    billingInterval: pkg?.billingInterval ?? "MONTHLY",
    currency: pkg?.currency ?? "INR",
    amount: pkg?.amount ?? 0,
    priceMonthly: pkg?.priceMonthly ?? pkg?.amount ?? 0,
    priceYearly: pkg?.priceYearly ?? 0,
    compareHighlightsText: pkg?.compareHighlights?.join("\n") ?? "",
    featureBulletsText: pkg?.featureBullets.join("\n") ?? "",
    isActive: pkg?.isActive ?? true,
    isRecommended: pkg?.isRecommended ?? false,
    allowRegistration: pkg?.allowRegistration ?? true,
    isVisibleOnRegistration: pkg?.isVisibleOnRegistration ?? true,
    autoRenewEnabled: pkg?.autoRenewEnabled ?? false,
    sortOrder: pkg?.sortOrder ?? fallbackSortOrder,
    durationDays: pkg?.durationDays ?? 30,
    serviceLimit: pkg?.serviceLimit ?? null,
    activeProjectLimit: pkg?.activeProjectLimit ?? null,
    portfolioItemLimit: pkg?.portfolioItemLimit ?? null,
    teamMemberLimit: pkg?.teamMemberLimit ?? null,
    staffAccountLimit: pkg?.staffAccountLimit ?? null,
    clientLimit: pkg?.clientLimit ?? null,
    editorFreelancerLimit: pkg?.editorFreelancerLimit ?? null,
    storageLimitMb: pkg?.storageLimitMb ?? null,
    maxUploadSizeMb: pkg?.maxUploadSizeMb ?? null,
    aiCredits: pkg?.aiCredits ?? null,
    proposalLimit: pkg?.proposalLimit ?? null,
    biddingApplyLimit: pkg?.biddingApplyLimit ?? null,
    leadsUnlockLimit: pkg?.leadsUnlockLimit ?? null,
    commissionOverridePercent: pkg?.commissionOverridePercent ?? null,
    chatAccess: pkg?.chatAccess ?? false,
    clientChat: pkg?.clientChat ?? false,
    teamChat: pkg?.teamChat ?? false,
    whatsappIntegration: pkg?.whatsappIntegration ?? false,
    aiToolsAccess: pkg?.aiToolsAccess ?? false,
    featuredListing: pkg?.featuredListing ?? false,
    boostProfile: pkg?.boostProfile ?? false,
    prioritySupport: pkg?.prioritySupport ?? false,
    analyticsAccess: pkg?.analyticsAccess ?? false,
    advancedAnalytics: pkg?.advancedAnalytics ?? false,
    invoiceTools: pkg?.invoiceTools ?? false,
    paymentCollectionTools: pkg?.paymentCollectionTools ?? false,
    whiteLabelAccess: pkg?.whiteLabelAccess ?? false,
    brandingCustomization: pkg?.brandingCustomization ?? false,
    automationTools: pkg?.automationTools ?? false,
    apiAccess: pkg?.apiAccess ?? false,
    webhookAccess: pkg?.webhookAccess ?? false,
    verificationBadgeEligible: pkg?.verificationBadgeEligible ?? false,
    dedicatedManager: pkg?.dedicatedManager ?? false,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeFeatureBullets(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function nullableNumber(value: number | null) {
  return value === null || Number.isNaN(value) ? "Unlimited" : String(value);
}

export function SuperAdminPackageManagement({ initialPackages }: { initialPackages: RegistrationPackage[] }) {
  const orderedPackages = useMemo(
    () => initialPackages.slice().sort((left, right) => left.sortOrder - right.sortOrder),
    [initialPackages],
  );
  const [packages, setPackages] = useState<RegistrationPackage[]>(orderedPackages);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(orderedPackages[0]?.id ?? "");
  const [draft, setDraft] = useState<PackageDraft>(() => createDraft(orderedPackages[0], orderedPackages.length + 1));
  const [status, setStatus] = useState<StatusState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const packageStats = useMemo(() => {
    const activeCount = packages.filter((item) => item.isActive).length;
    const freelancerCount = packages.filter((item) => item.audience === "FREELANCER").length;
    const agencyCount = packages.filter((item) => item.audience === "AGENCY").length;
    const revenueCount = packages.filter((item) => (item.amount ?? 0) > 0).length;

    return {
      total: packages.length,
      active: activeCount,
      inactive: packages.length - activeCount,
      freelancer: freelancerCount,
      agency: agencyCount,
      paid: revenueCount,
    };
  }, [packages]);

  const orderedList = useMemo(
    () => packages.slice().sort((left, right) => left.sortOrder - right.sortOrder),
    [packages],
  );

  const selectPackage = (pkg: RegistrationPackage) => {
    setSelectedPackageId(pkg.id);
    setDraft(createDraft(pkg, orderedList.length + 1));
    setStatus(null);
  };

  const startNewPackage = () => {
    setSelectedPackageId("");
    setDraft(createDraft(undefined, orderedList.length + 1));
    setStatus(null);
  };

  const updateNumberField = (key: NullableNumberKey, rawValue: string) => {
    setDraft((current) => ({
      ...current,
      [key]: rawValue.trim() === "" ? null : Number(rawValue),
    }));
  };

  const updateBooleanField = (key: BooleanFeatureKey, checked: boolean) => {
    setDraft((current) => ({ ...current, [key]: checked }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/super-admin/packages", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: draft.id || undefined,
        name: draft.name,
        audience: draft.audience,
        priceLabel: draft.priceLabel,
        billingLabel: draft.billingLabel,
        statusLabel: draft.statusLabel,
        shortSubtitle: draft.shortSubtitle,
        description: draft.description,
        badgeText: draft.badgeText,
        ctaLabel: draft.ctaLabel,
        billingType: draft.billingType,
        billingInterval: draft.billingInterval,
        currency: draft.currency,
        amount: draft.amount,
        priceMonthly: draft.priceMonthly,
        priceYearly: draft.priceYearly,
        compareHighlights: normalizeFeatureBullets(draft.compareHighlightsText),
        isActive: draft.isActive,
        isRecommended: draft.isRecommended,
        allowRegistration: draft.allowRegistration,
        isVisibleOnRegistration: draft.isVisibleOnRegistration,
        autoRenewEnabled: draft.autoRenewEnabled,
        sortOrder: draft.sortOrder,
        durationDays: draft.durationDays,
        featureBullets: normalizeFeatureBullets(draft.featureBulletsText),
        serviceLimit: draft.serviceLimit,
        activeProjectLimit: draft.activeProjectLimit,
        portfolioItemLimit: draft.portfolioItemLimit,
        teamMemberLimit: draft.teamMemberLimit,
        staffAccountLimit: draft.staffAccountLimit,
        clientLimit: draft.clientLimit,
        editorFreelancerLimit: draft.editorFreelancerLimit,
        storageLimitMb: draft.storageLimitMb,
        maxUploadSizeMb: draft.maxUploadSizeMb,
        aiCredits: draft.aiCredits,
        proposalLimit: draft.proposalLimit,
        biddingApplyLimit: draft.biddingApplyLimit,
        leadsUnlockLimit: draft.leadsUnlockLimit,
        commissionOverridePercent: draft.commissionOverridePercent,
        chatAccess: draft.chatAccess,
        clientChat: draft.clientChat,
        teamChat: draft.teamChat,
        whatsappIntegration: draft.whatsappIntegration,
        aiToolsAccess: draft.aiToolsAccess,
        featuredListing: draft.featuredListing,
        boostProfile: draft.boostProfile,
        prioritySupport: draft.prioritySupport,
        analyticsAccess: draft.analyticsAccess,
        advancedAnalytics: draft.advancedAnalytics,
        invoiceTools: draft.invoiceTools,
        paymentCollectionTools: draft.paymentCollectionTools,
        whiteLabelAccess: draft.whiteLabelAccess,
        brandingCustomization: draft.brandingCustomization,
        automationTools: draft.automationTools,
        apiAccess: draft.apiAccess,
        webhookAccess: draft.webhookAccess,
        verificationBadgeEligible: draft.verificationBadgeEligible,
        dedicatedManager: draft.dedicatedManager,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as PackagesPayload;

    if (!response.ok || payload.ok === false) {
      setStatus({
        tone: "error",
        message: payload.error ?? "Unable to save the package right now.",
      });
      setIsSubmitting(false);
      return;
    }

    const nextPackages = (payload.packages ?? []).slice().sort((left, right) => left.sortOrder - right.sortOrder);
    const savedPackage = payload.package ?? nextPackages.find((item) => item.id === draft.id) ?? null;

    setPackages(nextPackages);
    if (savedPackage) {
      setSelectedPackageId(savedPackage.id);
      setDraft(createDraft(savedPackage, nextPackages.length + 1));
    } else {
      setSelectedPackageId(nextPackages[0]?.id ?? "");
      setDraft(createDraft(nextPackages[0], nextPackages.length + 1));
    }
    setStatus({
      tone: "success",
      message: `${savedPackage?.name ?? "Package"} saved. Limits, features, and commission are now the source of truth for role workflows.`,
    });
    setIsSubmitting(false);
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Packages</p>
      <h2 className="section-heading">Manage freelancer and agency onboarding packages from one place. Package audience decides the workspace a user enters after OTP verification.</h2>

      <div className="metric-grid">
        <MetricCard label="Packages live" value={String(packageStats.total)} />
        <MetricCard label="Active" value={String(packageStats.active)} />
        <MetricCard label="Freelancer plans" value={String(packageStats.freelancer)} />
        <MetricCard label="Agency plans" value={String(packageStats.agency)} />
        <MetricCard label="Paid packages" value={String(packageStats.paid)} />
      </div>

      <div className="brief-grid two-up">
        <section className="brief-card">
          <div className="package-toolbar">
            <div>
              <span className="meta-pill">Package list</span>
              <strong>{packages.length ? `${packages.length} onboarding packages configured` : "No packages yet"}</strong>
            </div>
            <button className="ghost-button" onClick={startNewPackage} type="button">
              <PackagePlus size={14} strokeWidth={1.8} />
              New package
            </button>
          </div>

          <div className="package-list">
            {orderedList.map((pkg) => (
              <button
                className={pkg.id === selectedPackageId ? "package-list-row active" : "package-list-row"}
                key={pkg.id}
                onClick={() => selectPackage(pkg)}
                type="button"
              >
                <div className="package-list-head">
                  <div className="package-list-title">
                    <strong>{pkg.name}</strong>
                    <div className="package-flag-row">
                      <span className={pkg.audience === "AGENCY" ? "package-audience-badge agency" : "package-audience-badge freelancer"}>
                        {pkg.audience === "AGENCY" ? <Building2 size={13} strokeWidth={1.8} /> : <UserRound size={13} strokeWidth={1.8} />}
                        {pkg.audience === "AGENCY" ? "Agency" : "Freelancer"}
                      </span>
                      <StatusPill>{pkg.isActive ? "Active" : "Inactive"}</StatusPill>
                    </div>
                  </div>
                  <span className="package-order-chip">#{pkg.sortOrder}</span>
                </div>
                <p className="muted-copy">
                  {pkg.priceLabel} - {pkg.billingLabel}
                </p>
                <p className="muted-copy">{pkg.statusLabel}</p>
                <p className="muted-copy">
                  {pkg.audience === "AGENCY"
                    ? `${nullableNumber(pkg.staffAccountLimit ?? null)} managers / ${nullableNumber(pkg.editorFreelancerLimit ?? null)} editors`
                    : `${nullableNumber(pkg.serviceLimit ?? null)} services / ${nullableNumber(pkg.biddingApplyLimit ?? null)} applications`}
                </p>
                <p className="muted-copy">
                  {pkg.audience === "FREELANCER" ? `Commission ${nullableNumber(pkg.commissionOverridePercent ?? null)}%` : `Projects ${nullableNumber(pkg.activeProjectLimit ?? null)}`}
                </p>
                <p className="muted-copy">Updated {formatDate(pkg.updatedAt)}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="brief-card">
          <span className="meta-pill">Package editor</span>
          <strong>{draft.id ? "Edit package" : "Create a new package"}</strong>
          <p className="muted-copy package-editor-note">
            This page controls onboarding, plan limits, feature gates, and freelancer commission. Leave a numeric field blank for unlimited/not enforced.
          </p>

          <form className="freelancer-form-grid package-form-grid" onSubmit={handleSubmit}>
            <label className="freelancer-field">
              <span>Audience</span>
              <AppSelect value={draft.audience} onChange={(nextValue) => setDraft((current) => ({ ...current, audience: nextValue as RegistrationPackageAudience }))}>
                <option value="FREELANCER">Freelancer</option>
                <option value="AGENCY">Agency</option>
              </AppSelect>
            </label>

            <label className="freelancer-field">
              <span>Display order</span>
              <input
                min={1}
                onChange={(event) => setDraft((current) => ({ ...current, sortOrder: Number(event.target.value) || 1 }))}
                type="number"
                value={draft.sortOrder}
              />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Name</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required value={draft.name} />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Short subtitle</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, shortSubtitle: event.target.value }))} value={draft.shortSubtitle} />
            </label>

            <label className="freelancer-field">
              <span>Billing type</span>
              <AppSelect value={draft.billingType} onChange={(nextValue) => setDraft((current) => ({ ...current, billingType: nextValue as PackageBillingType }))}>
                <option value="FREE">Free</option>
                <option value="ONE_TIME_PAID">One-time paid</option>
                <option value="RECURRING">Recurring</option>
              </AppSelect>
            </label>

            <label className="freelancer-field">
              <span>Billing interval</span>
              <AppSelect value={draft.billingInterval} onChange={(nextValue) => setDraft((current) => ({ ...current, billingInterval: nextValue as PackageBillingInterval }))}>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
                <option value="ONE_TIME">One-time</option>
                <option value="CUSTOM">Custom</option>
              </AppSelect>
            </label>

            <label className="freelancer-field">
              <span>Currency</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} value={draft.currency} />
            </label>

            <label className="freelancer-field">
              <span>Amount</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, amount: Number(event.target.value) || 0 }))} type="number" value={draft.amount} />
            </label>

            <label className="freelancer-field">
              <span>Monthly price</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, priceMonthly: Number(event.target.value) || 0 }))} type="number" value={draft.priceMonthly} />
            </label>

            <label className="freelancer-field">
              <span>Yearly price</span>
              <input min={0} onChange={(event) => setDraft((current) => ({ ...current, priceYearly: Number(event.target.value) || 0 }))} type="number" value={draft.priceYearly} />
            </label>

            <label className="freelancer-field">
              <span>Price label</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, priceLabel: event.target.value }))} required value={draft.priceLabel} />
            </label>

            <label className="freelancer-field">
              <span>Billing label</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, billingLabel: event.target.value }))} required value={draft.billingLabel} />
            </label>

            <label className="freelancer-field">
              <span>Duration (days)</span>
              <input min={1} onChange={(event) => setDraft((current) => ({ ...current, durationDays: Number(event.target.value) || 1 }))} type="number" value={draft.durationDays} />
            </label>

            <label className="freelancer-field">
              <span>Freelancer commission %</span>
              <input
                min={0}
                max={100}
                onChange={(event) => updateNumberField("commissionOverridePercent", event.target.value)}
                placeholder="Blank = default"
                step="0.01"
                type="number"
                value={draft.commissionOverridePercent ?? ""}
              />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Status label</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, statusLabel: event.target.value }))} required value={draft.statusLabel} />
            </label>

            <label className="freelancer-field package-checkbox-field freelancer-field-full">
              <span>Availability</span>
              <label className="package-checkbox-row">
                <input checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" />
                <span>Active package</span>
              </label>
              <label className="package-checkbox-row">
                <input checked={draft.isVisibleOnRegistration} onChange={(event) => setDraft((current) => ({ ...current, isVisibleOnRegistration: event.target.checked }))} type="checkbox" />
                <span>Visible on public signup</span>
              </label>
              <label className="package-checkbox-row">
                <input checked={draft.allowRegistration} onChange={(event) => setDraft((current) => ({ ...current, allowRegistration: event.target.checked }))} type="checkbox" />
                <span>Allow registration</span>
              </label>
              <label className="package-checkbox-row">
                <input checked={draft.isRecommended} onChange={(event) => setDraft((current) => ({ ...current, isRecommended: event.target.checked }))} type="checkbox" />
                <span>Recommended</span>
              </label>
              <label className="package-checkbox-row">
                <input checked={draft.autoRenewEnabled} onChange={(event) => setDraft((current) => ({ ...current, autoRenewEnabled: event.target.checked }))} type="checkbox" />
                <span>Auto renew enabled</span>
              </label>
            </label>

            <div className="freelancer-field freelancer-field-full">
              <span>
                <Settings2 size={14} strokeWidth={1.8} /> Limits and usage gates
              </span>
              <div className="freelancer-form-grid package-form-grid">
                {LIMIT_FIELDS.map((field) => (
                  <label className="freelancer-field" key={field.key}>
                    <span>{field.label}</span>
                    <input
                      min={0}
                      onChange={(event) => updateNumberField(field.key, event.target.value)}
                      placeholder="Unlimited"
                      step={field.key === "commissionOverridePercent" ? "0.01" : "1"}
                      type="number"
                      value={draft[field.key] ?? ""}
                    />
                    <small className="muted-copy">{field.help}</small>
                  </label>
                ))}
              </div>
            </div>

            <div className="freelancer-field freelancer-field-full">
              <span>
                <WalletCards size={14} strokeWidth={1.8} /> Feature access
              </span>
              <div className="package-feature-grid">
                {FEATURE_TOGGLES.map((feature) => (
                  <label className="package-checkbox-row" key={feature.key}>
                    <input checked={draft[feature.key]} onChange={(event) => updateBooleanField(feature.key, event.target.checked)} type="checkbox" />
                    <span>{feature.label}</span>
                    <small className="muted-copy">{feature.group}</small>
                  </label>
                ))}
              </div>
            </div>

            <label className="freelancer-field">
              <span>Badge text</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, badgeText: event.target.value }))} value={draft.badgeText} />
            </label>

            <label className="freelancer-field">
              <span>CTA label</span>
              <input onChange={(event) => setDraft((current) => ({ ...current, ctaLabel: event.target.value }))} value={draft.ctaLabel} />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Description</span>
              <textarea className="package-features-textarea" onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={3} value={draft.description} />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Feature bullets</span>
              <textarea
                className="package-features-textarea"
                onChange={(event) => setDraft((current) => ({ ...current, featureBulletsText: event.target.value }))}
                placeholder={"Create your profile\nPublish services\nReceive WhatsApp-first leads"}
                rows={6}
                value={draft.featureBulletsText}
              />
            </label>

            <label className="freelancer-field freelancer-field-full">
              <span>Compare highlights</span>
              <textarea
                className="package-features-textarea"
                onChange={(event) => setDraft((current) => ({ ...current, compareHighlightsText: event.target.value }))}
                placeholder={"Priority discovery\nAdvanced matching\nSupport level"}
                rows={4}
                value={draft.compareHighlightsText}
              />
            </label>

            <div className="package-form-actions freelancer-field-full">
              <button className="freelancer-primary-button" disabled={isSubmitting} type="submit">
                <Save size={15} strokeWidth={1.8} />
                {isSubmitting ? "Saving package..." : draft.id ? "Save package" : "Create package"}
              </button>
              <button className="freelancer-secondary-button" onClick={startNewPackage} type="button">
                Reset form
              </button>
            </div>
          </form>

          {status ? <p className={status.tone === "success" ? "dashboard-inline-status success" : "dashboard-inline-status error"}>{status.message}</p> : null}

          <div className="stack-list">
            <div className="bullet-row">
              <UserRound size={16} strokeWidth={1.8} />
              <p>Freelancer package commission controls how much of a completed order is credited to the editor wallet after Gigxomi receives PhonePe payment.</p>
            </div>
            <div className="bullet-row">
              <Building2 size={16} strokeWidth={1.8} />
              <p>Agency limits are enforced by manager creation, team invites, task publishing, and direct assignment APIs.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
