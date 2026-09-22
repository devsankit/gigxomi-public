"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  Handshake,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  MonitorCheck,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  UserCheck,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

import { PublicShell } from "@/components/public/public-shell";
import {
  AgencyControlWorkspaceVisual,
  AgencyPremiumHeroVisual,
  AgencyTrustVisuals,
  AgencyWorkflowVisual,
  FreelancerTalentSystemVisual,
  FreelancerWorkspaceEcosystemVisual,
} from "@/components/public/marketing/agency-growth-visuals";
import { getVideoPresentation, type VideoPresentation } from "@/lib/gigxomi/media";
import { pushGrowthEvent } from "@/lib/gigxomi/public-growth-client";
import type {
  LandingPageCampaignKey,
  LandingPageCampaignSettings,
  RegistrationPackage,
  RegistrationPackageAudience,
} from "@/lib/gigxomi/public-growth-types";

type LandingIcon = typeof Sparkles;

type IconCard = {
  body: string;
  icon: LandingIcon;
  title: string;
};

type StepCard = {
  body: string;
  icon: LandingIcon;
  title: string;
};

type FallbackPackage = {
  badge?: string;
  billingLabel: string;
  features: string[];
  name: string;
  priceLabel: string;
};

type WebinarFormState = {
  clientStatus: string;
  name: string;
  role: string;
  whatsapp: string;
};

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type CampaignTrackingPayload = {
  countdownActive: boolean;
  pageKey: LandingPageCampaignKey;
  placement: string;
  videoConfigured: boolean;
};

const freelancerPainPoints: IconCard[] = [
  {
    title: "WhatsApp groups are overcrowded",
    body: "Every editor is posting in the same groups, so serious buyers struggle to identify who is actually reliable.",
    icon: MessageCircle,
  },
  {
    title: "Instagram followers do not always become clients",
    body: "A portfolio post can get likes and still fail to turn into steady paid work.",
    icon: Target,
  },
  {
    title: "Clients ask for samples but do not trust unknown editors",
    body: "Skill matters, but buyers also want visible proof, clean expectations, and a safer way to start.",
    icon: ShieldCheck,
  },
  {
    title: "Payments and follow-ups become messy",
    body: "Without a workspace, editors end up tracking work, revisions, reminders, and payout conversations manually.",
    icon: Wallet,
  },
  {
    title: "Agencies want proof before assigning work",
    body: "Agency owners need to see service clarity, samples, and delivery confidence before giving client work.",
    icon: BadgeCheck,
  },
  {
    title: "Most editors have no proper service page",
    body: "A clean service profile gives buyers more confidence than scattered links and old chat screenshots.",
    icon: FileCheck2,
  },
];

const freelancerFeatures: IconCard[] = [
  {
    title: "Create freelancer profile",
    body: "Present your editing role, niche, proof, and working style in one focused profile.",
    icon: UserCheck,
  },
  {
    title: "Publish editing services",
    body: "Turn your editing skill into specific services with samples, pricing context, and delivery expectations.",
    icon: LayoutDashboard,
  },
  {
    title: "Add samples and portfolio links",
    body: "Use YouTube, Instagram, Drive, and portfolio proof to help clients and agencies evaluate your work.",
    icon: PlayCircle,
  },
  {
    title: "Apply for agency work",
    body: "Use the freelancer workspace to find and apply for work from agencies that need editing capacity.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Receive WhatsApp-first leads",
    body: "Gigxomi is built around practical WhatsApp-first buying behavior instead of forcing every client into a new habit.",
    icon: MessageCircle,
  },
  {
    title: "Track wallet and payout requests",
    body: "Keep earning, payout requests, and account flow visible from your workspace.",
    icon: CircleDollarSign,
  },
  {
    title: "Build karma and trust score",
    body: "Use profile completion, service proof, review flow, and delivery behavior to build a stronger work signal.",
    icon: Star,
  },
  {
    title: "Use mobile dashboard and notifications",
    body: "Stay close to chats, assignments, services, and alerts from the mobile-ready workspace.",
    icon: Smartphone,
  },
];

const freelancerSteps: StepCard[] = [
  {
    title: "Register free",
    body: "Choose a freelancer package and verify your account through the existing signup flow.",
    icon: Rocket,
  },
  {
    title: "Complete profile and verification",
    body: "Add your editing role, proof links, identity details, and basic trust signals.",
    icon: ClipboardCheck,
  },
  {
    title: "Create your first service",
    body: "Publish a specific offer like reels editing, YouTube editing, podcast cleanup, or thumbnails.",
    icon: FileCheck2,
  },
  {
    title: "Apply for work or get discovered",
    body: "Use your profile and services to get found by clients and creative teams.",
    icon: Handshake,
  },
];

const serviceCategories = [
  "Instagram Reels Editing",
  "YouTube Video Editing",
  "Wedding Highlight Editing",
  "Podcast Editing",
  "UGC Ad Editing",
  "Thumbnail Design",
  "Motion Graphics",
  "Short-form Repurposing",
];

const agencyReasons: IconCard[] = [
  {
    title: "Clear service profile",
    body: "Agencies can understand what you offer before opening a long chat.",
    icon: FileCheck2,
  },
  {
    title: "Samples visible",
    body: "Work proof helps agencies trust your style, pace, and editing fit.",
    icon: PlayCircle,
  },
  {
    title: "Delivery expectations clear",
    body: "Service details make scope and turnaround easier to discuss.",
    icon: ListChecks,
  },
  {
    title: "Karma and trust score",
    body: "A stronger profile signal helps serious editors stand out over time.",
    icon: Star,
  },
  {
    title: "Internal assignment flow",
    body: "Agency teams can assign work without exposing every client detail by default.",
    icon: Workflow,
  },
  {
    title: "Wallet and payout structure",
    body: "Earning conversations become easier when the payout path is visible.",
    icon: Wallet,
  },
];

const freelancerFallbackPackages: FallbackPackage[] = [
  {
    name: "Freelancer Starter",
    priceLabel: "Free",
    billingLabel: "Launch access",
    features: ["Create profile", "Publish service", "Apply for limited work", "Basic marketplace visibility"],
  },
  {
    name: "Freelancer Pro",
    priceLabel: "INR 199",
    billingLabel: "Per month preview",
    badge: "Growth",
    features: ["Better visibility", "More work applications", "Priority profile review", "Lower platform friction"],
  },
  {
    name: "Freelancer Elite",
    priceLabel: "INR 499",
    billingLabel: "Per month preview",
    badge: "Elite",
    features: ["Featured visibility", "Priority agency matching", "Verified positioning", "Advanced portfolio boost"],
  },
];

const agencyPainPoints: IconCard[] = [
  {
    title: "You buy a PC before revenue is stable",
    body: "Fixed costs arrive before your client pipeline is predictable.",
    icon: MonitorCheck,
  },
  {
    title: "You train editors and they leave",
    body: "The owner spends time teaching systems, then loses the person right when delivery improves.",
    icon: Users,
  },
  {
    title: "Freelancers may directly contact your clients",
    body: "Client relationships need protection when external editors help with delivery.",
    icon: LockKeyhole,
  },
  {
    title: "WhatsApp chats become impossible to track",
    body: "Leads, revisions, files, payments, and approvals get buried across personal chats.",
    icon: MessageCircle,
  },
  {
    title: "Deadlines slip because there is no assignment system",
    body: "Without ownership and review stages, the founder keeps chasing every update manually.",
    icon: Workflow,
  },
  {
    title: "Owner becomes the bottleneck",
    body: "Sales, assignment, review, client updates, and payments all collapse onto one person.",
    icon: Target,
  },
  {
    title: "Payments and payouts are unclear",
    body: "Agency cash flow gets messy when client collections and freelancer payouts are not visible together.",
    icon: CircleDollarSign,
  },
  {
    title: "No public proof page to close better clients",
    body: "A serious agency needs a place to show offers, work proof, reviews, and team capability.",
    icon: BadgeCheck,
  },
];

const oldWay = ["Hire offline editor", "Buy PC/software", "Manually train", "Manage all chats on WhatsApp", "No delivery tracking", "No payout structure", "High fixed cost"];

const gigxomiWay = [
  "Use freelancer bench",
  "Assign work from dashboard",
  "Add manager when needed",
  "Keep client relationship protected",
  "Review delivery",
  "Track wallet/accounts",
  "Scale with lower fixed risk",
];

const agencyFeatures: IconCard[] = [
  {
    title: "Unified inbox for WhatsApp-first workflows",
    body: "Organize creative operations around leads from WhatsApp, Instagram, referrals, and marketplace workflows.",
    icon: Inbox,
  },
  {
    title: "Create team from freelancer marketplace",
    body: "Build a flexible editing bench without committing to full-time hiring too early.",
    icon: Users,
  },
  {
    title: "Assign managers",
    body: "Bring operations help into the workflow when the owner should not handle every chat.",
    icon: UserCheck,
  },
  {
    title: "Assign work to freelancers",
    body: "Move jobs from client lead to assigned execution with clearer ownership.",
    icon: Workflow,
  },
  {
    title: "Freelancer apply-for-work flow",
    body: "Let editors show interest and create a better selection pool for agency work.",
    icon: Handshake,
  },
  {
    title: "Karma and trust score for better selection",
    body: "Use profile quality, samples, and delivery behavior as signals before assigning sensitive work.",
    icon: Star,
  },
  {
    title: "Delivery review system",
    body: "Review work before it reaches the client and keep quality control inside the agency workspace.",
    icon: ClipboardCheck,
  },
  {
    title: "Wallet/accounts/payout visibility",
    body: "Keep payment requests, payout movement, and account conversations easier to inspect.",
    icon: Wallet,
  },
  {
    title: "Public agency showcase page",
    body: "Use a public-facing agency profile to show offers, proof, reviews, and contact options.",
    icon: LayoutDashboard,
  },
  {
    title: "Mobile-ready daily workflow",
    body: "Stay close to leads, team updates, assignments, and delivery progress from the mobile-ready app flow.",
    icon: Smartphone,
  },
];

const webinarBullets = [
  "How to choose your first editing niche",
  "How to get clients without a full in-house team",
  "How to use freelancers without losing control",
  "How to manage delivery and revision flow",
  "How Gigxomi helps with team, assignments, and accounts",
];

const agencyAgenda = [
  {
    title: "Niche and offer",
    body: "Pick the editing category you can sell first, then turn it into a clear agency offer.",
    icon: Target,
  },
  {
    title: "Client acquisition",
    body: "Use WhatsApp, Instagram, referrals, and direct sales without building a complicated funnel on day one.",
    icon: MessageCircle,
  },
  {
    title: "Freelancer bench",
    body: "Use outside editors while keeping expectations, review, and client relationships controlled.",
    icon: Users,
  },
  {
    title: "Operating system",
    body: "Move from loose chats to lead tracking, assignment, delivery review, wallet, and accounts visibility.",
    icon: Workflow,
  },
];

const agencyFallbackPackages: FallbackPackage[] = [
  {
    name: "Agency",
    priceLabel: "₹12,000",
    billingLabel: "Per year · ₹1,000/month equivalent",
    badge: "Best fit",
    features: ["Lead CRM and clients", "Editor Team management", "Assignment and approvals", "Wallet and payouts", "Automation and analytics", "Branding and integrations"],
  },
];

const agencyFor = [
  "Editors who want to become agency owners",
  "Photographers with client network",
  "Social media marketers selling content packages",
  "Small agencies with overflow work",
  "Creators building editing operations",
];

const agencyNotFor = [
  "People looking for instant money without sales",
  "Editors unwilling to create samples",
  "Agencies that do not want process discipline",
  "People who want to bypass platform rules",
];

const freelancerFaq = [
  {
    question: "Is freelancer registration free?",
    answer: "Yes. The active package setup includes a free freelancer starter path, and paid packages can be managed from the platform package system.",
  },
  {
    question: "Do I need an agency?",
    answer: "No. You can register as an individual freelancer, publish services, and use your own profile. Agency work is an additional opportunity.",
  },
  {
    question: "Can I add my services?",
    answer: "Yes. The freelancer workspace includes service creation, samples, draft handling, preview, and submission for review.",
  },
  {
    question: "Can agencies find me?",
    answer: "Gigxomi is designed so agencies can evaluate freelancer profiles, samples, service clarity, and trust signals before assigning work.",
  },
  {
    question: "How do payouts work?",
    answer: "The product includes wallet, payout request, and review flows. Exact payout handling depends on the active agency and platform rules.",
  },
  {
    question: "Do I need to install the mobile app?",
    answer: "No. The web app is mobile-ready. The mobile app adds a dedicated role-aware workspace and notification flow as it rolls out.",
  },
];

const agencyFaq = [
  {
    question: "Do I need to know editing to start an agency?",
    answer: "Editing knowledge helps with quality control, but the bigger requirement is sales, client communication, process discipline, and the ability to select good editors.",
  },
  {
    question: "Can I use my own clients?",
    answer: "Yes. Gigxomi is built for agency owners who bring leads through WhatsApp, Instagram, referrals, sales, or existing relationships.",
  },
  {
    question: "Can I hire freelancers from Gigxomi?",
    answer: "Gigxomi supports freelancer discovery, agency team access, applications, assignment flows, and delivery review for flexible creative operations.",
  },
  {
    question: "Will freelancers see my client details?",
    answer: "Freelancer access is scoped. The platform is designed to protect client relationships and only expose customer-lane access when the agency enables it.",
  },
  {
    question: "Can I add managers?",
    answer: "Yes. The agency workspace includes manager routing and manager work areas for chats, reviews, assignments, contacts, and escalations.",
  },
  {
    question: "How does payment/payout tracking work?",
    answer: "Agency and platform workspaces include wallet, payout, and billing controls so money movement can be reviewed more clearly.",
  },
  {
    question: "Is WhatsApp API required on day one?",
    answer: "No. During launch, teams can start with assisted workflows and configure WhatsApp API setup when the agency is ready.",
  },
  {
    question: "Is PhonePe/autopay live?",
    answer:
      "Automated payment provider support is part of the platform roadmap/foundation. During launch, billing may use assisted/manual UPI approval depending on the active package setup.",
  },
];

function getSafeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function hasConfiguredVideo(settings: LandingPageCampaignSettings) {
  return Boolean(getSafeExternalUrl(settings.videoUrl));
}

function isCountdownFuture(settings: LandingPageCampaignSettings) {
  if (!settings.countdownEnabled || !settings.countdownTargetIso) {
    return false;
  }

  const target = Date.parse(settings.countdownTargetIso);
  return Number.isFinite(target) && target > Date.now();
}

function buildCampaignPayload(
  pageKey: LandingPageCampaignKey,
  placement: string,
  settings: LandingPageCampaignSettings,
  extra?: Record<string, unknown>,
) {
  return {
    pageKey,
    placement,
    countdownActive: isCountdownFuture(settings),
    videoConfigured: hasConfiguredVideo(settings),
    ...(extra ?? {}),
  };
}

function getCountdownParts(milliseconds: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function useCountdown(settings: LandingPageCampaignSettings) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!settings.countdownEnabled || !settings.countdownTargetIso) {
      return undefined;
    }

    const target = Date.parse(settings.countdownTargetIso);
    if (!Number.isFinite(target)) {
      return undefined;
    }

    const animationId = window.requestAnimationFrame(() => setNow(Date.now()));
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.cancelAnimationFrame(animationId);
      window.clearInterval(intervalId);
    };
  }, [settings.countdownEnabled, settings.countdownTargetIso]);

  const target = settings.countdownEnabled && settings.countdownTargetIso ? Date.parse(settings.countdownTargetIso) : Number.NaN;
  const remaining = now && Number.isFinite(target) ? target - now : 0;
  const parts = remaining > 0 ? getCountdownParts(remaining) : null;

  return {
    isActive: Boolean(parts),
    parts,
  };
}

function useLandingViewEvent(event: string, payload: Record<string, unknown>) {
  useEffect(() => {
    pushGrowthEvent(event, payload);
  }, [event, payload]);
}

function buildSignupHref(pkg: RegistrationPackage | null | undefined, audience: RegistrationPackageAudience) {
  if (pkg?.id) {
    const params = new URLSearchParams({ packageId: pkg.id });
    return `/signup?${params.toString()}`;
  }

  return audience === "AGENCY" ? "/signup?role=agency" : "/signup?role=freelancer";
}

function findPreferredPackage(packages: RegistrationPackage[], audience: RegistrationPackageAudience, keywords: string[]) {
  const audiencePackages = packages.filter((pkg) => pkg.audience === audience);
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());

  return (
    audiencePackages.find((pkg) => {
      const label = `${pkg.slug ?? ""} ${pkg.name ?? ""} ${pkg.shortSubtitle ?? ""}`.toLowerCase();
      return normalizedKeywords.some((keyword) => label.includes(keyword));
    }) ??
    audiencePackages.find((pkg) => pkg.isFree) ??
    audiencePackages[0] ??
    null
  );
}

function mapPackages(packages: RegistrationPackage[], audience: RegistrationPackageAudience, fallback: FallbackPackage[]) {
  const active = packages
    .filter((pkg) => pkg.audience === audience)
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (active.length) {
    return active.map((pkg) => ({
      badge: pkg.badgeText,
      billingLabel: pkg.billingLabel,
      features: pkg.featureBullets.length ? pkg.featureBullets : pkg.compareHighlights ?? [],
      href: buildSignupHref(pkg, audience),
      key: pkg.id,
      name: pkg.name,
      priceLabel: pkg.priceLabel,
      recommended: Boolean(pkg.isRecommended),
      source: "dynamic" as const,
    }));
  }

  return fallback.map((pkg) => ({
    badge: pkg.badge,
    billingLabel: pkg.billingLabel,
    features: pkg.features,
    href: audience === "AGENCY" ? "/signup?role=agency" : "/signup?role=freelancer",
    key: `${audience}-${pkg.name}`,
    name: pkg.name,
    priceLabel: pkg.priceLabel,
    recommended: pkg.badge === "Best fit" || pkg.badge === "Growth",
    source: "fallback" as const,
  }));
}

function TrackedLink({
  children,
  className,
  event,
  href,
  payload,
}: {
  children: ReactNode;
  className: string;
  event: string;
  href: string;
  payload?: Record<string, unknown>;
}) {
  return (
    <Link
      className={className}
      href={href}
      onClick={() => {
        pushGrowthEvent(event, payload ?? {});
      }}
    >
      {children}
    </Link>
  );
}

function SectionIntro({ eyebrow, title, body }: { body?: string; eyebrow?: string; title: string }) {
  return (
    <div className="growth-section-intro">
      {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

function LandingCard({ body, icon: Icon, title }: IconCard) {
  return (
    <article className="growth-card">
      <div className="growth-card-icon">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="growth-card-copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

function FeatureGrid({ items }: { items: IconCard[] }) {
  return (
    <div className="growth-card-grid">
      {items.map((item) => (
        <LandingCard {...item} key={item.title} />
      ))}
    </div>
  );
}

function StepGrid({ steps }: { steps: StepCard[] }) {
  return (
    <div className="growth-step-grid">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <article className="growth-step-card" key={step.title}>
            <div className="growth-step-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="growth-card-icon">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        );
      })}
    </div>
  );
}

function ChipCloud({ items }: { items: string[] }) {
  return (
    <div className="growth-chip-cloud">
      {items.map((item) => (
        <span className="growth-chip" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function PricingGrid({
  audience,
  event,
  payload,
  packages,
}: {
  audience: RegistrationPackageAudience;
  event: string;
  payload?: Record<string, unknown>;
  packages: ReturnType<typeof mapPackages>;
}) {
  return (
    <div className="growth-pricing-grid">
      {packages.map((pkg) => (
        <article className={pkg.recommended ? "growth-pricing-card recommended" : "growth-pricing-card"} key={pkg.key}>
          <div className="growth-pricing-head">
            <div>
              <p className="section-label">{audience === "AGENCY" ? "Agency" : "Freelancer"}</p>
              <h3>{pkg.name}</h3>
            </div>
            {pkg.badge ? <span className="meta-pill">{pkg.badge}</span> : null}
          </div>
          <div className="growth-pricing-price">
            <strong>{pkg.priceLabel}</strong>
            <span>{pkg.billingLabel}</span>
          </div>
          <div className="growth-feature-list">
            {pkg.features.slice(0, 6).map((feature) => (
              <div className="growth-check-row" key={feature}>
                <Check size={15} strokeWidth={2} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <TrackedLink
            className="primary-button growth-pricing-action"
            event={event}
            href={pkg.href}
            payload={{ ...(payload ?? {}), audience, packageName: pkg.name, source: pkg.source }}
          >
            Choose package
          </TrackedLink>
        </article>
      ))}
    </div>
  );
}

function FaqGrid({ items }: { items: Array<{ answer: string; question: string }> }) {
  return (
    <div className="growth-faq-grid">
      {items.map((item) => (
        <details className="growth-faq-item" key={item.question}>
          <summary>
            <span>{item.question}</span>
            <ChevronRight size={16} strokeWidth={1.8} />
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

function CampaignCountdown({
  compact = false,
  countdown,
  settings,
}: {
  compact?: boolean;
  countdown: ReturnType<typeof useCountdown>;
  settings: LandingPageCampaignSettings;
}) {
  if (!countdown.parts) {
    return null;
  }

  const units = [
    { label: "Days", value: countdown.parts.days },
    { label: "Hours", value: countdown.parts.hours },
    { label: "Min", value: countdown.parts.minutes },
    { label: "Sec", value: countdown.parts.seconds },
  ];

  return (
    <div aria-live="polite" className={compact ? "growth-countdown compact" : "growth-countdown"}>
      <div className="growth-countdown-label">
        <CalendarClock size={15} strokeWidth={1.8} />
        <span>{settings.countdownLabel || "Workshop starts in"}</span>
      </div>
      <div className="growth-countdown-grid">
        {units.map((unit) => (
          <span className="growth-countdown-unit" key={unit.label}>
            <strong>{unit.value}</strong>
            <small>{unit.label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function GrowthVideoPlayer({
  countdownActive,
  event,
  fallback,
  pageKey,
  settings,
}: {
  countdownActive: boolean;
  event: string;
  fallback: ReactNode;
  pageKey: LandingPageCampaignKey;
  settings: LandingPageCampaignSettings;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const safeVideoUrl = getSafeExternalUrl(settings.videoUrl);
  const presentation = useMemo<VideoPresentation | null>(() => {
    return safeVideoUrl ? getVideoPresentation(safeVideoUrl) : null;
  }, [safeVideoUrl]);

  if (!safeVideoUrl || !presentation) {
    return <>{fallback}</>;
  }

  const videoTitle = settings.videoTitle || (pageKey === "freelancers" ? "Gigxomi freelancer preview" : "Gigxomi agency workshop preview");

  const handlePlay = () => {
    pushGrowthEvent(event, {
      pageKey,
      placement: "hero_video",
      countdownActive,
      videoConfigured: true,
    });
    setIsPlaying(true);
  };

  return (
    <div className={presentation.variant === "portrait" ? "growth-video-card portrait" : "growth-video-card"}>
      <div className="growth-video-head">
        <span className="section-label">{pageKey === "freelancers" ? "Freelancer training" : "Agency workshop"}</span>
        <strong>{videoTitle}</strong>
      </div>
      <div className="growth-video-frame">
        {isPlaying && presentation.embedUrl ? (
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            src={`${presentation.embedUrl}&autoplay=1`}
            title={videoTitle}
          />
        ) : null}
        {isPlaying && presentation.directUrl ? <video autoPlay controls playsInline src={presentation.directUrl} title={videoTitle} /> : null}
        {!isPlaying ? (
          <button
            aria-label={`Play ${videoTitle}`}
            className="growth-video-cover"
            onClick={handlePlay}
            style={
              presentation.thumbnail
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(4, 6, 4, 0.18), rgba(4, 6, 4, 0.78)), url("${presentation.thumbnail}")`,
                  }
                : undefined
            }
            type="button"
          >
            <span className="growth-play-button">
              <PlayCircle size={34} strokeWidth={1.55} />
            </span>
            <span>Watch the preview before registering</span>
          </button>
        ) : null}
      </div>
      <p>Hosted inside Gigxomi&apos;s dark player shell. You can change this URL from Super Admin for each ad campaign.</p>
    </div>
  );
}

function CampaignUrgencyBlock({
  countdown,
  ctaEvent,
  ctaHref,
  ctaLabel,
  pageKey,
  settings,
  videoConfigured,
}: {
  countdown: ReturnType<typeof useCountdown>;
  ctaEvent: string;
  ctaHref: string;
  ctaLabel: string;
  pageKey: LandingPageCampaignKey;
  settings: LandingPageCampaignSettings;
  videoConfigured: boolean;
}) {
  if (!countdown.isActive && !settings.urgencyText.trim()) {
    return null;
  }

  return (
    <section className="growth-urgency-block">
      <div>
        <p className="section-label">{pageKey === "freelancers" ? "Next onboarding window" : "Workshop deadline"}</p>
        <h2>{settings.urgencyText || "Reserve before this campaign window closes."}</h2>
      </div>
      <CampaignCountdown compact countdown={countdown} settings={settings} />
      <TrackedLink
        className="primary-button"
        event={ctaEvent}
        href={ctaHref}
        payload={{ pageKey, placement: "urgency_block", countdownActive: countdown.isActive, videoConfigured }}
      >
        {ctaLabel}
        <ArrowRight size={15} strokeWidth={1.8} />
      </TrackedLink>
    </section>
  );
}

function StickyCampaignBar({
  countdown,
  ctaEvent,
  ctaHref,
  ctaLabel,
  pageKey,
  secondaryCta,
  settings,
  videoConfigured,
}: {
  countdown: ReturnType<typeof useCountdown>;
  ctaEvent: string;
  ctaHref: string;
  ctaLabel: string;
  pageKey: LandingPageCampaignKey;
  secondaryCta?: {
    event: string;
    href: string;
    label: string;
  };
  settings: LandingPageCampaignSettings;
  videoConfigured: boolean;
}) {
  return (
    <div className={`growth-sticky-cta ${pageKey === "agency-growth" ? "agency-sticky-cta" : "freelancer-sticky-cta"}`} role="region" aria-label="Campaign call to action">
      <div className="growth-sticky-copy">
        <strong>{settings.urgencyText || (pageKey === "freelancers" ? "Create your freelancer profile today." : "Reserve your agency workshop seat.")}</strong>
        <CampaignCountdown compact countdown={countdown} settings={settings} />
      </div>
      <div className="growth-sticky-actions">
        <TrackedLink
          className="primary-button"
          event={ctaEvent}
          href={ctaHref}
          payload={{ pageKey, placement: "sticky_bar", countdownActive: countdown.isActive, videoConfigured }}
        >
          {ctaLabel}
        </TrackedLink>
        {secondaryCta ? (
          <TrackedLink
            className="secondary-button"
            event={secondaryCta.event}
            href={secondaryCta.href}
            payload={{ pageKey, placement: "sticky_bar_secondary", countdownActive: countdown.isActive, videoConfigured }}
          >
            {secondaryCta.label}
          </TrackedLink>
        ) : null}
      </div>
    </div>
  );
}

function FreelancerHeroMockup() {
  return (
    <div aria-label="Freelancer workspace preview" className="growth-mockup-card">
      <div className="growth-mockup-bar">
        <span />
        <span />
        <span />
      </div>
      <div className="growth-profile-row">
        <div className="growth-avatar">GX</div>
        <div className="growth-profile-copy">
          <strong>Freelancer profile</strong>
          <span>Profile completion 72%</span>
          <div className="growth-progress">
            <i style={{ width: "72%" }} />
          </div>
        </div>
      </div>
      <div className="growth-mockup-grid">
        <div className="growth-mini-card strong">
          <p>Service listing</p>
          <strong>Reels editing for creators</strong>
          <span>Samples added</span>
        </div>
        <div className="growth-mini-card">
          <p>Apply for work</p>
          <strong>3 agency openings</strong>
          <span>Review fit before applying</span>
        </div>
        <div className="growth-mini-card">
          <p>Wallet/payout</p>
          <strong>Request ready</strong>
          <span>Track payout flow</span>
        </div>
        <div className="growth-mini-card score">
          <p>Karma score</p>
          <strong>Building</strong>
          <span>Trust placeholder</span>
        </div>
      </div>
    </div>
  );
}

function FreelancerBusinessSystem() {
  const stages = [
    { icon: Target, label: "Position", value: "A focused service buyers understand" },
    { icon: BadgeCheck, label: "Prove", value: "Samples, reliability, and visible trust" },
    { icon: Inbox, label: "Win", value: "Direct leads and agency opportunities" },
    { icon: Wallet, label: "Deliver", value: "Projects, approvals, earnings, and payouts" },
  ];

  return (
    <section className="freelancer-business-system" aria-labelledby="freelancer-system-title">
      <div className="freelancer-business-system-copy">
        <p className="section-label">Your freelance business, connected</p>
        <h2 id="freelancer-system-title">Go from “available editor” to a business buyers can trust.</h2>
        <p>Gigxomi turns scattered portfolio links, WhatsApp conversations, project files, and payout follow-ups into one clear operating path.</p>
        <Link className="secondary-button" href="#freelancer-how-it-works">See your first four steps <ArrowRight size={15} /></Link>
      </div>
      <div className="freelancer-business-system-rail">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <article key={stage.label}>
              <span className="freelancer-system-index">0{index + 1}</span>
              <Icon size={19} />
              <div><strong>{stage.label}</strong><p>{stage.value}</p></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AgencyHeroMockup() {
  return (
    <div aria-label="Agency workspace preview" className="growth-mockup-card agency">
      <div className="growth-mockup-bar">
        <span />
        <span />
        <span />
      </div>
      <div className="growth-agency-inbox">
        <div>
          <p>One inbox</p>
          <strong>Wedding highlight lead</strong>
          <span>WhatsApp-first request</span>
        </div>
        <span className="growth-status-pill">New</span>
      </div>
      <div className="growth-agency-flow">
        {["Client lead", "Assign freelancer", "Manager review", "Delivery status"].map((item, index) => (
          <div className="growth-flow-step" key={item}>
            <span>{index + 1}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
      <div className="growth-mockup-grid two">
        <div className="growth-mini-card">
          <p>Wallet/accounts</p>
          <strong>Visible</strong>
          <span>Collections and payouts</span>
        </div>
        <div className="growth-mini-card strong">
          <p>Public agency page</p>
          <strong>Offers + proof</strong>
          <span>Website-ready showcase</span>
        </div>
      </div>
    </div>
  );
}

function WebinarForm({ campaignPayload }: { campaignPayload: CampaignTrackingPayload }) {
  const [form, setForm] = useState<WebinarFormState>({
    clientStatus: "No clients yet",
    name: "",
    role: "Video Editor",
    whatsapp: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof WebinarFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushGrowthEvent("agency_webinar_cta_clicked", {
      ...campaignPayload,
      clientStatus: form.clientStatus,
      hasName: Boolean(form.name.trim()),
      hasWhatsapp: Boolean(form.whatsapp.trim()),
      placement: "webinar_form",
      role: form.role,
    });
    setSubmitted(true);
  };

  return (
    <form className="growth-webinar-form premium-workshop-form" onSubmit={handleSubmit}>
      <label>
        <span>Name</span>
        <input
          autoComplete="name"
          name="name"
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your name"
          required
          type="text"
          value={form.name}
        />
      </label>
      <label>
        <span>WhatsApp Number</span>
        <input
          autoComplete="tel"
          inputMode="tel"
          name="whatsapp"
          onChange={(event) => updateField("whatsapp", event.target.value)}
          placeholder="+91..."
          required
          type="tel"
          value={form.whatsapp}
        />
      </label>
      <label>
        <span>Current role</span>
        <select name="role" onChange={(event) => updateField("role", event.target.value)} value={form.role}>
          <option>Video Editor</option>
          <option>Photographer</option>
          <option>Social Media Marketer</option>
          <option>Agency Owner</option>
          <option>Content Creator</option>
          <option>Other</option>
        </select>
      </label>
      <label>
        <span>Monthly client/order status</span>
        <select name="clientStatus" onChange={(event) => updateField("clientStatus", event.target.value)} value={form.clientStatus}>
          <option>No clients yet</option>
          <option>1-3 clients</option>
          <option>4-10 clients</option>
          <option>10+ clients</option>
        </select>
      </label>
      <button className="primary-button growth-form-submit" type="submit">
        Reserve My Seat
        <ArrowRight size={15} strokeWidth={1.8} />
      </button>
      {submitted ? (
        <div className="growth-form-success" role="status">
          <strong>Your interest is saved.</strong>
          <span>Continue to create your workspace.</span>
          <TrackedLink
            className="secondary-button"
            event="agency_signup_cta_clicked"
            href="/pricing"
            payload={{ ...campaignPayload, placement: "webinar_success" }}
          >
            View Pricing Plans
          </TrackedLink>
        </div>
      ) : null}
    </form>
  );
}

export function FreelancerLandingPage({
  campaignSettings,
  packages,
}: {
  campaignSettings: LandingPageCampaignSettings;
  packages: RegistrationPackage[];
}) {
  const pageKey = "freelancers" satisfies LandingPageCampaignKey;
  const viewPayload = useMemo(() => buildCampaignPayload(pageKey, "page_view", campaignSettings, { surface: "freelancers" }), [campaignSettings, pageKey]);
  useLandingViewEvent("freelancer_landing_viewed", viewPayload);

  const countdown = useCountdown(campaignSettings);
  const videoConfigured = hasConfiguredVideo(campaignSettings);
  const starterPackage = findPreferredPackage(packages, "FREELANCER", ["starter", "free"]);
  const freelancerSignupHref = buildSignupHref(starterPackage, "FREELANCER");
  const pricingPackages = mapPackages(packages, "FREELANCER", freelancerFallbackPackages);
  const freelancerStickyLabel = campaignSettings.stickyCtaLabel.trim() || "Start Free as Freelancer";

  return (
    <PublicShell
      canvasClassName="public-shell-page-canvas growth-landing-canvas"
      title="For Freelancers"
      topbarActions={[
        { href: "/pricing", label: "Pricing" },
        { href: "/login", label: "Login" },
        { href: freelancerSignupHref, label: "Start free", variant: "pill" },
      ]}
    >
      <div className="growth-landing-page">
        <section className="growth-hero">
          <div className="growth-hero-copy">
            <p className="section-label">For freelance video editors</p>
            <h1>Build a freelance editing business buyers and agencies can trust.</h1>
            <p>
              Package your expertise, prove it with real samples, get discovered for direct and agency work, and keep delivery and payouts visible in one mobile-ready workspace.
            </p>
            <CampaignCountdown countdown={countdown} settings={campaignSettings} />
            <div className="growth-hero-actions">
              <TrackedLink
                className="primary-button"
                event="freelancer_signup_cta_clicked"
                href={freelancerSignupHref}
                payload={{ pageKey, packageId: starterPackage?.id ?? null, placement: "hero", countdownActive: countdown.isActive, videoConfigured }}
              >
                Start Free as Freelancer
                <ArrowRight size={15} strokeWidth={1.8} />
              </TrackedLink>
              <TrackedLink
                className="secondary-button"
                event="freelancer_demo_cta_clicked"
                href="#freelancer-how-it-works"
                payload={{ pageKey, placement: "hero", countdownActive: countdown.isActive, videoConfigured }}
              >
                See How It Works
              </TrackedLink>
            </div>
            <ChipCloud
              items={["WhatsApp-first leads", "Agency work opportunities", "Service profile", "Wallet & payout flow", "Mobile-ready workspace"]}
            />
          </div>
          <GrowthVideoPlayer
            countdownActive={countdown.isActive}
            event="freelancer_video_play_clicked"
            fallback={<FreelancerHeroMockup />}
            pageKey={pageKey}
            settings={campaignSettings}
          />
        </section>

        <FreelancerBusinessSystem />

        <section className="growth-section">
          <SectionIntro title="Editing skill is not enough anymore." />
          <FeatureGrid items={freelancerPainPoints} />
        </section>

        <section className="growth-section">
          <SectionIntro
            body="Gigxomi gives editors one place to package their skill, show proof, apply for serious work, and keep earning flow visible."
            title="Gigxomi gives editors a proper earning workspace."
          />
          <FeatureGrid items={freelancerFeatures} />
        </section>

        <section className="growth-section" id="freelancer-how-it-works">
          <SectionIntro title="How it works" />
          <StepGrid steps={freelancerSteps} />
        </section>

        <section className="growth-section">
          <SectionIntro title="Create services people are already searching for." />
          <ChipCloud items={serviceCategories} />
        </section>

        <section className="growth-section">
          <SectionIntro
            body="Agencies need confidence before assigning client work. A cleaner Gigxomi profile gives them a better way to evaluate fit."
            title="Why agencies choose editors on Gigxomi"
          />
          <FeatureGrid items={agencyReasons} />
        </section>

        <section className="growth-bridge-section">
          <div>
            <p className="section-label">Next step after freelancing</p>
            <h2>Want to stop only editing and start building an agency?</h2>
            <p>
              Use your editing proof to attract clients, then learn how Gigxomi helps you assign work, protect client relationships, and manage delivery with a
              freelancer bench.
            </p>
          </div>
          <TrackedLink
            className="secondary-button"
            event="freelancer_demo_cta_clicked"
            href="/"
            payload={{ pageKey, placement: "agency_bridge", countdownActive: countdown.isActive, videoConfigured }}
          >
            Explore Agency Growth
            <ArrowRight size={15} strokeWidth={1.8} />
          </TrackedLink>
        </section>

        <section className="growth-section">
          <SectionIntro
            body="Package cards use active registration package data when available. Launch preview cards are isolated for future package setup."
            eyebrow="Pricing preview"
            title="Start free, then grow when you need more visibility."
          />
          <PricingGrid
            audience="FREELANCER"
            event="freelancer_signup_cta_clicked"
            packages={pricingPackages}
            payload={{ pageKey, placement: "pricing", countdownActive: countdown.isActive, videoConfigured }}
          />
        </section>

        <CampaignUrgencyBlock
          countdown={countdown}
          ctaEvent="freelancer_countdown_cta_clicked"
          ctaHref={freelancerSignupHref}
          ctaLabel={freelancerStickyLabel}
          pageKey={pageKey}
          settings={campaignSettings}
          videoConfigured={videoConfigured}
        />

        <section className="growth-final-cta">
          <div>
            <p className="section-label">Start as freelancer</p>
            <h2>Your editing skill needs a system, not just another WhatsApp group.</h2>
          </div>
          <TrackedLink
            className="primary-button"
            event="freelancer_signup_cta_clicked"
            href={freelancerSignupHref}
            payload={{ pageKey, placement: "final_cta", countdownActive: countdown.isActive, videoConfigured }}
          >
            Start Free as Freelancer
            <ArrowRight size={15} strokeWidth={1.8} />
          </TrackedLink>
        </section>

        <section className="growth-section">
          <SectionIntro title="Freelancer FAQ" />
          <FaqGrid items={freelancerFaq} />
        </section>
      </div>
      <StickyCampaignBar
        countdown={countdown}
        ctaEvent="freelancer_countdown_cta_clicked"
        ctaHref={freelancerSignupHref}
        ctaLabel={freelancerStickyLabel}
        pageKey={pageKey}
        secondaryCta={{
          event: "freelancer_demo_cta_clicked",
          href: "/",
          label: "Agency Growth",
        }}
        settings={campaignSettings}
        videoConfigured={videoConfigured}
      />
    </PublicShell>
  );
}

export function AgencyGrowthLandingPage({
  campaignSettings,
  packages,
}: {
  campaignSettings: LandingPageCampaignSettings;
  packages: RegistrationPackage[];
}) {
  const pageKey = "agency-growth" satisfies LandingPageCampaignKey;
  const viewPayload = useMemo(() => buildCampaignPayload(pageKey, "page_view", campaignSettings, { surface: "agency-growth" }), [campaignSettings, pageKey]);
  useLandingViewEvent("agency_landing_viewed", viewPayload);

  const countdown = useCountdown(campaignSettings);
  const videoConfigured = hasConfiguredVideo(campaignSettings);
  const agencyPackage = findPreferredPackage(packages, "AGENCY", ["launch", "starter", "growth"]);
  const pricingPackages = mapPackages(packages, "AGENCY", agencyFallbackPackages);
  const agencyStickyLabel = campaignSettings.stickyCtaLabel.trim() || "Know More";

  return (
    <PublicShell
      canvasClassName="public-shell-page-canvas growth-landing-canvas"
      title="Agency Growth"
      topbarActions={[
        { href: "/pricing", label: "Pricing" },
        { href: "/login", label: "Login" },
        { href: "/pricing", label: "Pricing Plans", variant: "pill" },
      ]}
    >
      <div className="growth-landing-page agency-growth-page">
        <section className="growth-hero">
          <div className="growth-hero-copy">
            <p className="section-label">For agency owners & serious freelancers</p>
            <h1>Build your video editing agency without hiring full-time editors.</h1>
            <p>
              Manage leads, assign freelancers, add managers, review delivery, and track accounts from one premium workspace.
            </p>
            <CampaignCountdown countdown={countdown} settings={campaignSettings} />
            <div className="growth-hero-actions">
              <TrackedLink
                className="primary-button"
                event="agency_signup_cta_clicked"
                href="https://app.gigxomi.com/signup"
                payload={{ pageKey, placement: "hero", countdownActive: countdown.isActive, videoConfigured }}
              >
                Start Free with Google
                <ArrowRight size={15} strokeWidth={1.8} />
              </TrackedLink>
              <TrackedLink
                className="secondary-button"
                event="agency_signup_cta_clicked"
                href="/pricing"
                payload={{ pageKey, packageId: agencyPackage?.id ?? null, placement: "hero", countdownActive: countdown.isActive, videoConfigured }}
              >
                View Pricing Plans
              </TrackedLink>
            </div>
            <div className="agency-hero-cta-note" aria-label="Workshop reassurance">
              <span>Product walkthrough</span>
              <span>No payment required</span>
              <span>Built for WhatsApp-first agencies</span>
            </div>
            <ChipCloud
              items={["WhatsApp-first workflow", "Freelancer team access", "Manager routing", "Delivery review", "Wallet & accounts", "Public agency page"]}
            />
          </div>
          <div className="agency-hero-media-stack">
            <AgencyPremiumHeroVisual />
            {videoConfigured ? (
              <div className="agency-hero-video-dock">
                <GrowthVideoPlayer
                  countdownActive={countdown.isActive}
                  event="agency_video_play_clicked"
                  fallback={<AgencyHeroMockup />}
                  pageKey={pageKey}
                  settings={campaignSettings}
                />
              </div>
            ) : null}
          </div>
        </section>

        <AgencyTrustVisuals />

        <section className="growth-section">
          <SectionIntro title="Hiring editors too early is a costly mistake." />
          <FeatureGrid items={agencyPainPoints} />
        </section>

        <section className="growth-section">
          <SectionIntro title="Old way vs Gigxomi way" />
          <div className="growth-comparison-grid">
            <article className="growth-comparison-card">
              <h3>Old way</h3>
              <div className="growth-feature-list">
                {oldWay.map((item) => (
                  <div className="growth-muted-row" key={item}>
                    <span />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="growth-comparison-card strong">
              <h3>Gigxomi way</h3>
              <div className="growth-feature-list">
                {gigxomiWay.map((item) => (
                  <div className="growth-check-row" key={item}>
                    <Check size={15} strokeWidth={2} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="growth-section">
          <SectionIntro
            body="Centralize creative operations around leads from WhatsApp, Instagram, referrals, and marketplace workflows without overclaiming a fully live social inbox."
            title="One system for leads, team, delivery, and money."
          />
          <FeatureGrid items={agencyFeatures} />
        </section>

        <section className="growth-section agency-product-visual-section">
          <SectionIntro
            body="See leads, assignments, team availability, delivery reviews, and accounts in one polished operating view."
            title="Control your agency from one workspace"
          />
          <AgencyControlWorkspaceVisual />
        </section>

        <section className="growth-section agency-product-visual-section">
          <SectionIntro
            body="Select editors by service category, proof, trust signals, delivery pace, and fit before routing client work."
            title="Build your team without fixed hiring pressure"
          />
          <FreelancerTalentSystemVisual />
        </section>

        <section className="growth-section agency-product-visual-section">
          <SectionIntro
            body="Gigxomi connects the practical path from chat-based lead to reviewed delivery and visible accounts."
            title="See how work flows from lead to delivery"
          />
          <AgencyWorkflowVisual />
        </section>

        <section className="growth-section agency-product-visual-section agency-freelancer-proof-section">
          <SectionIntro
            body="Agency owners get control because freelancers work through structured profiles, services, work applications, delivery queues, and payout flow."
            title="Freelancers do not just work. They work inside a system."
          />
          <FreelancerWorkspaceEcosystemVisual />
        </section>

        <section className="growth-section">
          <SectionIntro
            body="This is the practical workshop path for people who can sell creative services but need a system for delivery, team, and money."
            eyebrow="Workshop agenda"
            title="What you will learn before opening your agency workspace."
          />
          <FeatureGrid items={agencyAgenda} />
        </section>

        <section className="growth-section growth-webinar-section" id="agency-webinar">
          <div className="growth-webinar-copy">
            <p className="section-label">Free Workshop</p>
            <h2>Free Workshop: Build a Video Editing Agency Without Hiring Full-Time Editors</h2>
            <p>
              Learn the practical system for getting clients, using freelance editors, protecting client relationships, and scaling delivery through Gigxomi.
            </p>
            <div className="agency-workshop-proof-strip">
              <span>Built from real agency pain</span>
              <span>Designed for WhatsApp-first teams</span>
              <span>Lead to delivery workflow</span>
            </div>
            <div className="growth-feature-list">
              {webinarBullets.map((item) => (
                <div className="growth-check-row" key={item}>
                  <Check size={15} strokeWidth={2} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <WebinarForm campaignPayload={{ pageKey, placement: "webinar_form", countdownActive: countdown.isActive, videoConfigured }} />
          <div className="growth-webinar-policy">
            <ShieldCheck size={17} strokeWidth={1.8} />
            <p>
              Workshop registration is free and requires no payment. Any later paid workspace or creative-service purchase is governed by our{" "}
              <Link href="/terms-and-conditions">Terms</Link>, <Link href="/privacy-policy">Privacy Policy</Link>, and{" "}
              <Link href="/refund-and-cancellation-policy">Refund & Cancellation Policy</Link>.
            </p>
          </div>
        </section>

        <section className="growth-section agency-host-section">
          <div className="agency-host-avatar">AR</div>
          <div>
            <p className="section-label">Hosted by</p>
            <h2>Ankit Rathore</h2>
            <p>Founder of Gigxomi, product operator, and builder of practical systems for video-editing delivery, freelancer teams, and agency growth.</p>
          </div>
          <div className="agency-host-signals">
            <span><BadgeCheck size={14} /> Product & operations</span>
            <span><Users size={14} /> Agency-delivery systems</span>
            <span><Workflow size={14} /> Creative-team workflow</span>
          </div>
        </section>

        <section className="growth-section">
          <SectionIntro
            body="Manual UPI or assisted onboarding may be used during launch depending on the active package setup. PhonePe/autopay is not advertised as live here."
            eyebrow="Agency Launch Program"
            title="Start lean, then add structure as clients grow."
          />
          <PricingGrid
            audience="AGENCY"
            event="agency_pricing_cta_clicked"
            packages={pricingPackages}
            payload={{ pageKey, placement: "pricing", countdownActive: countdown.isActive, videoConfigured }}
          />
        </section>

        <CampaignUrgencyBlock
          countdown={countdown}
          ctaEvent="agency_signup_cta_clicked"
          ctaHref="https://app.gigxomi.com/signup"
          ctaLabel="Start Free with Google"
          pageKey={pageKey}
          settings={campaignSettings}
          videoConfigured={videoConfigured}
        />

        <section className="growth-section">
          <SectionIntro title="Who this is for and not for" />
          <div className="growth-comparison-grid">
            <article className="growth-comparison-card strong">
              <h3>For</h3>
              <div className="growth-feature-list">
                {agencyFor.map((item) => (
                  <div className="growth-check-row" key={item}>
                    <Check size={15} strokeWidth={2} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="growth-comparison-card">
              <h3>Not for</h3>
              <div className="growth-feature-list">
                {agencyNotFor.map((item) => (
                  <div className="growth-muted-row" key={item}>
                    <span />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="growth-final-cta">
          <div>
            <p className="section-label">Agency growth</p>
            <h2>Stop managing your agency like a WhatsApp group.</h2>
          </div>
          <div className="growth-final-actions">
            <TrackedLink
              className="primary-button"
              event="agency_signup_cta_clicked"
              href="https://app.gigxomi.com/signup"
              payload={{ pageKey, placement: "final_cta", countdownActive: countdown.isActive, videoConfigured }}
            >
              Start Free with Google
              <ArrowRight size={15} strokeWidth={1.8} />
            </TrackedLink>
            <TrackedLink
              className="secondary-button"
              event="agency_signup_cta_clicked"
              href="/pricing"
              payload={{ pageKey, packageId: agencyPackage?.id ?? null, placement: "final_cta", countdownActive: countdown.isActive, videoConfigured }}
            >
              View Pricing Plans
            </TrackedLink>
          </div>
        </section>

        <section className="growth-section">
          <SectionIntro title="Agency FAQ" />
          <FaqGrid items={agencyFaq} />
        </section>
      </div>
      <StickyCampaignBar
        countdown={countdown}
        ctaEvent="agency_signup_cta_clicked"
        ctaHref="https://app.gigxomi.com/signup"
        ctaLabel="Start Free with Google"
        pageKey={pageKey}
        secondaryCta={{
          event: "agency_signup_cta_clicked",
          href: "/pricing",
          label: "Pricing Plans",
        }}
        settings={campaignSettings}
        videoConfigured={videoConfigured}
      />
    </PublicShell>
  );
}
