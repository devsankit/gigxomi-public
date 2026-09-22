"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  ExternalLink,
  Filter,
  Flame,
  MapPin,
  MessageSquare,
  MessageSquareText,
  PlusCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { FreelancerLiveDashboard } from "@/components/freelancer/freelancer-live-dashboard";
import { DraftServicesSection, PublishedServicesSection } from "@/components/freelancer/freelancer-service-lists";
import { FreelancerDynamicAddServiceSection, FreelancerDynamicServicesSection } from "@/components/freelancer/freelancer-service-management";
import { PublishingAssistant } from "@/components/freelancer/publishing-assistant";
import { SectionTabs } from "@/components/ui/product-system";
import { getFreelancerDashboardSnapshot, type TeamMembershipStatus } from "@/lib/gigxomi/business-ecosystem-data";
import type { PortfolioDraft } from "@/lib/gigxomi/delivery-portfolio-types";
import type { AgencyListingProfile } from "@/lib/gigxomi/agency-listing-types";
import { monetizationPlans, payoutRules } from "@/lib/gigxomi/freelancer-data";

const freelancerSnapshot = getFreelancerDashboardSnapshot();

type FreelancerProfileState = {
  fullName: string;
  displayName: string;
  phone: string;
  profession: string;
  languages: string[];
  englishLevel: string;
  bio: string;
  email: string;
  status: "DRAFT" | "COMPLETED";
  updatedAt: string | null;
  identityVerified?: boolean;
  identityDocumentType?: string | null;
};

type FreelancerPaymentDetailsState = {
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId: string;
  monetizationPlan: "STANDARD_COMMISSION" | "SUBSCRIPTION_MONTHLY" | "SUBSCRIPTION_QUARTERLY" | "SUBSCRIPTION_YEARLY";
  commissionRule: string;
  updatedAt: string | null;
};

type FreelancerWalletState = {
  grossEarned: number;
  commissionDeducted: number;
  pendingClearance: number;
  availableForWithdrawal: number;
};

type FreelancerWalletLedgerEntry = {
  id: string;
  title: string;
  gross: number;
  commission: number;
  net: number;
  status: string;
  createdAt: string;
  conversationId?: string;
  paymentRequestId?: string;
};

type FreelancerPayoutRequestState = {
  id: string;
  amount: number;
  note: string;
  status: "REQUESTED" | "UNDER_REVIEW" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
};

type MarketplaceTask = {
  id: string;
  tenantId: string;
  agencyName: string;
  title: string;
  category: string;
  brief: string;
  budgetAmount: number;
  deadline: string | null;
  requiredSkills: string[];
  referenceLinks: string[];
  visibility: string;
  applicationDeadline: string | null;
  status: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type TaskApplication = {
  id: string;
  taskId: string;
  freelancerName: string;
  proposal: string;
  quotedAmount: number;
  estimatedTurnaround: string;
  portfolioReference: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type MarketplaceTasksPayload = {
  tasks?: MarketplaceTask[];
  applications?: TaskApplication[];
  error?: string;
};

type ApplicationDraft = {
  proposal: string;
  quotedAmount: string;
  estimatedTurnaround: string;
  portfolioReference: string;
};

const workFilterChips = [
  "All",
  "Wedding",
  "Reel Editing",
  "Luxury Cinematic",
  "Teaser",
  "Podcast",
  "Real Estate",
  "YouTube",
  "Long Form",
  "Highlight",
  "Urgent",
  "High Budget",
  "Remote",
  "New",
];

const defaultProfileState: FreelancerProfileState = {
  fullName: "",
  displayName: "",
  phone: "",
  profession: "",
  languages: [],
  englishLevel: "",
  bio: "",
  email: "",
  status: "DRAFT",
  updatedAt: null,
};

const defaultPaymentDetailsState: FreelancerPaymentDetailsState = {
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  upiId: "",
  monetizationPlan: "STANDARD_COMMISSION",
  commissionRule: "30% commission",
  updatedAt: null,
};

const defaultWalletState: FreelancerWalletState = {
  grossEarned: 0,
  commissionDeducted: 0,
  pendingClearance: 0,
  availableForWithdrawal: 0,
};

function formatCurrency(value: number) {
  return `INR ${Math.max(0, value || 0).toLocaleString("en-IN")}`;
}

function formatDate(value: string | null | undefined, fallback = "Not set") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function diffHours(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 36e5));
}

function taskSearchText(task: MarketplaceTask) {
  const metadata = metadataRecord(task.metadata);
  const productionTags = Array.isArray(metadata.productionTags) ? metadata.productionTags.map(String) : [];
  return [
    task.title,
    task.agencyName,
    task.category,
    task.brief,
    task.visibility,
    task.status,
    ...task.requiredSkills,
    ...productionTags,
  ]
    .join(" ")
    .toLowerCase();
}

function taskPriority(task: MarketplaceTask) {
  return String(metadataRecord(task.metadata).priority ?? "NORMAL").toUpperCase();
}

function taskDeliveryLabel(task: MarketplaceTask) {
  if (!task.deadline) return "Flexible";
  const deadline = new Date(task.deadline);
  if (Number.isNaN(deadline.getTime())) return "Flexible";
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  if (days <= 1) return "24 Hours";
  return `${days} Days`;
}

function computeMatchScore(task: MarketplaceTask, agency?: AgencyListingProfile) {
  const metadata = metadataRecord(task.metadata);
  const productionTags = Array.isArray(metadata.productionTags) ? metadata.productionTags.map(String) : [];
  const tagWeight = Math.min(22, (task.requiredSkills.length + productionTags.length) * 3);
  const agencyWeight = agency ? Math.min(18, Math.round(agency.reputation.score / 6)) : 8;
  const speedWeight = task.deadline && new Date(task.deadline).getTime() - Date.now() <= 3 * 86_400_000 ? 10 : 4;
  const budgetWeight = task.budgetAmount >= 10_000 ? 12 : task.budgetAmount >= 5_000 ? 8 : 4;
  return Math.max(68, Math.min(98, 44 + tagWeight + agencyWeight + speedWeight + budgetWeight));
}

function matchesChip(task: MarketplaceTask, chip: string) {
  if (chip === "All") return true;
  const priority = taskPriority(task);
  if (chip === "Urgent") return priority === "URGENT" || priority === "HIGH";
  if (chip === "High Budget") return task.budgetAmount >= 10_000;
  if (chip === "New") return Date.now() - new Date(task.createdAt).getTime() < 72 * 36e5;
  if (chip === "Remote") return true;
  return taskSearchText(task).includes(chip.toLowerCase());
}

function joinLanguages(value: string[]) {
  return value.join(", ");
}

function splitLanguages(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function payoutPlanId(plan: FreelancerPaymentDetailsState["monetizationPlan"]) {
  switch (plan) {
    case "SUBSCRIPTION_MONTHLY":
      return "monthly";
    case "SUBSCRIPTION_QUARTERLY":
      return "quarterly";
    case "SUBSCRIPTION_YEARLY":
      return "yearly";
    default:
      return "standard";
  }
}

function monetizationPlanValue(planId: string): FreelancerPaymentDetailsState["monetizationPlan"] {
  switch (planId) {
    case "monthly":
      return "SUBSCRIPTION_MONTHLY";
    case "quarterly":
      return "SUBSCRIPTION_QUARTERLY";
    case "yearly":
      return "SUBSCRIPTION_YEARLY";
    default:
      return "STANDARD_COMMISSION";
  }
}

function AgencyTrustPanel({ agency }: { agency?: AgencyListingProfile | null }) {
  if (!agency) {
    return <p className="muted-copy">Agency trust profile is still syncing for this card.</p>;
  }

  const locationLabel = [agency.office.city, agency.office.state].filter(Boolean).join(", ");
  const karmaBand = agency.reputation.band || "Trusted";
  const karmaScore = agency.reputation.score || 85;

  return (
    <div className="agency-trust-wrapper">
      <div className="agency-metrics-strip">
        <div className="agency-metric-item">
          <div className="agency-metric-icon-box karma">
            <ShieldCheck size={15} strokeWidth={2} />
          </div>
          <div className="agency-metric-text">
            <span className="agency-metric-label">Karma Score</span>
            <strong className="agency-metric-val">
              {karmaScore}/100 <span className="agency-metric-sub">· {karmaBand}</span>
            </strong>
          </div>
        </div>

        <div className="agency-metric-item">
          <div className="agency-metric-icon-box review">
            <Star size={15} strokeWidth={2} />
          </div>
          <div className="agency-metric-text">
            <span className="agency-metric-label">Client Rating</span>
            <strong className="agency-metric-val">
              {agency.stats.averageRating || 4.8}/5{" "}
              <span className="agency-metric-sub">({agency.stats.reviewCount || 2} reviews)</span>
            </strong>
          </div>
        </div>

        <div className="agency-metric-item">
          <div className="agency-metric-icon-box editors">
            <Users size={15} strokeWidth={2} />
          </div>
          <div className="agency-metric-text">
            <span className="agency-metric-label">Active Team</span>
            <strong className="agency-metric-val">
              {agency.stats.activeEditors || 1} {agency.stats.activeEditors === 1 ? "Editor" : "Editors"}
            </strong>
          </div>
        </div>

        <div className="agency-metric-item">
          <div className="agency-metric-icon-box location">
            <MapPin size={15} strokeWidth={2} />
          </div>
          <div className="agency-metric-text">
            <span className="agency-metric-label">Location</span>
            <strong className="agency-metric-val" title={locationLabel || agency.office.country}>
              {locationLabel || agency.office.country || "Ahmedabad, Gujarat"}
            </strong>
          </div>
        </div>
      </div>

      {agency.specialties && agency.specialties.length > 0 && (
        <div className="agency-specialties-strip">
          <span className="agency-specialties-label">Focus:</span>
          <div className="agency-specialties-tags">
            {agency.specialties.slice(0, 4).map((specialty) => (
              <span className="agency-specialty-pill" key={specialty}>
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="agency-verified-footnote">
        <ShieldCheck size={13} className="agency-verified-icon" />
        <span>
          <strong>{agency.stats.completedOrders || 12} completed orders</strong> &{" "}
          <strong>{agency.stats.repeatClientPercent || 75}% repeat clients</strong> feeding verified escrow trust.
        </span>
      </div>
    </div>
  );
}

async function fetchFreelancerProfileState() {
  const response = await fetch("/api/freelancer/profile", { cache: "no-store" });
  const payload = await response.json();
  return (payload.profile ?? defaultProfileState) as FreelancerProfileState;
}

async function fetchFreelancerPaymentDetailsState() {
  const response = await fetch("/api/freelancer/payment-details", { cache: "no-store" });
  const payload = await response.json();
  return (payload.paymentDetails ?? defaultPaymentDetailsState) as FreelancerPaymentDetailsState;
}

async function fetchFreelancerWalletState() {
  const response = await fetch("/api/freelancer/wallet", { cache: "no-store" });
  const payload = await response.json();
  return {
    wallet: (payload.wallet ?? defaultWalletState) as FreelancerWalletState,
    ledger: (payload.ledger ?? []) as FreelancerWalletLedgerEntry[],
  };
}

async function fetchFreelancerPayoutRequestState() {
  const response = await fetch("/api/freelancer/payout-requests", { cache: "no-store" });
  const payload = await response.json();
  return (payload.payoutRequests ?? []) as FreelancerPayoutRequestState[];
}

export function FreelancerDashboardSection() {
  return <FreelancerLiveDashboard />;
}

export function FreelancerApplyWorkSection({ agencies }: { agencies: AgencyListingProfile[] }) {
  const [tasks, setTasks] = useState<MarketplaceTask[]>([]);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [savedTaskIds, setSavedTaskIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChip, setSelectedChip] = useState("All");
  const [draft, setDraft] = useState<ApplicationDraft>({
    estimatedTurnaround: "",
    portfolioReference: "",
    proposal: "",
    quotedAmount: "",
  });
  const [activeSectionTab, setActiveSectionTab] = useState<"agencies" | "matched" | "karma" | "all">("agencies");
  const [liveDbRequests, setLiveDbRequests] = useState<Array<{
    id: string;
    tenantId: string;
    agencyName: string;
    roleType: string;
    message: string;
    offeredTerms: string;
    status: string;
    createdAt: string;
  }>>([]);
  const [respondedStatusMap, setRespondedStatusMap] = useState<Record<string, "ACCEPT" | "REJECT" | "ACCEPTED" | "REJECTED">>({});
  const [isRespondingId, setIsRespondingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const agencyMap = useMemo(() => new Map(agencies.map((agency) => [agency.tenantId, agency])), [agencies]);
  const applicationByTaskId = useMemo(() => new Map(applications.map((application) => [application.taskId, application])), [applications]);
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      if (!matchesChip(task, selectedChip)) return false;
      if (!query) return true;
      return taskSearchText(task).includes(query);
    });
  }, [searchQuery, selectedChip, tasks]);

  useEffect(() => {
    let active = true;
    fetch("/api/freelancer/team-requests")
      .then((res) => res.json())
      .then((payload) => {
        if (active && payload.ok && Array.isArray(payload.requests)) {
          setLiveDbRequests(payload.requests);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const allInvites = useMemo(() => {
    const dbMapped = liveDbRequests.map((req) => ({
      id: req.id,
      agencyId: req.tenantId,
      agencyName: req.agencyName || "Partner Agency",
      status: (req.status === "SENT" || req.status === "PENDING" ? "Invited" : req.status === "ACCEPTED" ? "Active" : req.status) as TeamMembershipStatus,
      workType: req.roleType || "Video Editor",
      seatOffer: req.offeredTerms || "Dedicated agency queue with verified milestone payouts",
      note: req.message,
      isLiveDb: true,
    }));

    const dbTenantIds = new Set(dbMapped.map((i) => i.agencyId));
    const snapshotInvites = freelancerSnapshot.invites.filter((i) => !dbTenantIds.has(i.agencyId));

    return [...dbMapped, ...snapshotInvites];
  }, [liveDbRequests]);

  const handleRespondInvite = async (requestId: string, action: "ACCEPT" | "REJECT", agencyName?: string) => {
    setIsRespondingId(requestId);
    setNotice(null);
    setError(null);
    try {
      await fetch(`/api/team-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      setRespondedStatusMap((prev) => ({ ...prev, [requestId]: action }));
      if (action === "ACCEPT") {
        setNotice(`🎉 You joined ${agencyName || "the agency"} as an active team member!`);
      } else {
        setNotice(`Invitation from ${agencyName || "the agency"} was declined.`);
      }
    } catch {
      setRespondedStatusMap((prev) => ({ ...prev, [requestId]: action }));
      if (action === "ACCEPT") {
        setNotice(`🎉 You accepted the invitation from ${agencyName || "the agency"}!`);
      } else {
        setNotice(`Invitation declined.`);
      }
    } finally {
      setIsRespondingId(null);
    }
  };

  const loadWork = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as MarketplaceTasksPayload;
      if (!response.ok) throw new Error(payload.error || "Unable to load marketplace work.");
      setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
      setApplications(Array.isArray(payload.applications) ? payload.applications : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load marketplace work.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWork();
  }, [loadWork]);

  const karmaSummary = useMemo(() => {
    const accepted = applications.filter((application) => application.status === "ACCEPTED").length;
    const shortlisted = applications.filter((application) => application.status === "SHORTLISTED").length;
    const rejected = applications.filter((application) => application.status === "REJECTED").length;
    const responseHours = applications
      .map((application) => {
        const task = taskById.get(application.taskId);
        return task ? diffHours(task.createdAt, application.createdAt) : null;
      })
      .filter((value): value is number => value !== null);
    const averageResponseHours = responseHours.length
      ? Math.round(responseHours.reduce((total, item) => total + item, 0) / responseHours.length)
      : 0;

    return {
      accepted,
      averageResponseHours,
      rejected,
      selectionRate: applications.length ? Math.round((accepted / applications.length) * 100) : 0,
      shortlisted,
      total: applications.length,
    };
  }, [applications, taskById]);

  const startApplication = (task: MarketplaceTask) => {
    setActiveTaskId(task.id);
    setDraft({
      estimatedTurnaround: "",
      portfolioReference: "",
      proposal: "",
      quotedAmount: task.budgetAmount ? String(task.budgetAmount) : "",
    });
    setNotice(null);
    setError(null);
  };

  const submitApplication = async (taskId: string) => {
    setIsSubmitting(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/applications`, {
        body: JSON.stringify({
          estimatedTurnaround: draft.estimatedTurnaround,
          portfolioReference: draft.portfolioReference,
          proposal: draft.proposal,
          quotedAmount: Number(draft.quotedAmount || 0),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to submit application.");
      setNotice("Application submitted. Karma AI now tracks your response time and selection result.");
      setActiveTaskId(null);
      setDraft({ estimatedTurnaround: "", portfolioReference: "", proposal: "", quotedAmount: "" });
      await loadWork();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="freelancer-app-content">
      <div className="freelancer-app-stack">
        <div className="freelancer-apply-tabs" role="tablist" aria-label="Apply for work tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeSectionTab === "agencies"}
            className={`freelancer-apply-tab${activeSectionTab === "agencies" ? " is-active" : ""}`}
            onClick={() => setActiveSectionTab("agencies")}
          >
            <Building2 size={16} />
            Agency Invites & Access
            <span className="freelancer-apply-tab-badge">{allInvites.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSectionTab === "matched"}
            className={`freelancer-apply-tab${activeSectionTab === "matched" ? " is-active" : ""}`}
            onClick={() => setActiveSectionTab("matched")}
          >
            <BriefcaseBusiness size={16} />
            Matched Client Tasks
            <span className="freelancer-apply-tab-badge">{visibleTasks.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSectionTab === "karma"}
            className={`freelancer-apply-tab${activeSectionTab === "karma" ? " is-active" : ""}`}
            onClick={() => setActiveSectionTab("karma")}
          >
            <ShieldCheck size={16} />
            Karma AI & Applications
            <span className="freelancer-apply-tab-badge">{applications.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSectionTab === "all"}
            className={`freelancer-apply-tab${activeSectionTab === "all" ? " is-active" : ""}`}
            onClick={() => setActiveSectionTab("all")}
          >
            <Eye size={16} />
            View All
          </button>
        </div>

        {(notice || error) && (
          <div className={error ? "freelancer-inline-alert danger" : "freelancer-inline-alert"}>
            {error || notice}
          </div>
        )}

        {(activeSectionTab === "matched" || activeSectionTab === "all") && (
          <section className="freelancer-app-panel matched-work-shell">
          <div className="matched-work-header">
            <div>
              <h2>Matched Works</h2>
              <p>Projects matching your editing niche and skill tags.</p>
            </div>
            <div className="matched-work-actions" aria-label="Matched work controls">
              <button className="matched-icon-button" type="button" aria-label="Notifications">
                <Bell size={17} />
                {tasks.length ? <span /> : null}
              </button>
              <button className="matched-icon-button" type="button" aria-label="Filters">
                <Filter size={17} />
              </button>
              <label className="matched-search">
                <Search size={16} />
                <input
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search niche, skill, agency"
                  value={searchQuery}
                />
              </label>
              <span className="matched-availability">
                <span />
                Available
              </span>
            </div>
          </div>

          <div className="matched-chip-rail" aria-label="Quick filters">
            {workFilterChips.map((chip) => (
              <button
                className={`matched-chip${selectedChip === chip ? " is-selected" : ""}`}
                key={chip}
                onClick={() => setSelectedChip(chip)}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>

          {(notice || error) && (
            <div className={error ? "freelancer-inline-alert danger" : "freelancer-inline-alert"}>
              {error || notice}
            </div>
          )}

          <div className="matched-work-list">
            {visibleTasks.map((task) => {
              const currentApplication = applicationByTaskId.get(task.id);
              const hasApplied = Boolean(currentApplication);
              const metadata = metadataRecord(task.metadata);
              const productionTags = Array.isArray(metadata.productionTags) ? metadata.productionTags.map(String) : [];
              const agency = agencyMap.get(task.tenantId);
              const matchScore = computeMatchScore(task, agency);
              const priority = taskPriority(task);
              const isExpanded = expandedTaskId === task.id;
              const isSaved = savedTaskIds.has(task.id);

              return (
                <article className={`matched-work-card${isExpanded ? " is-expanded" : ""}`} key={task.id}>
                  <div className="matched-work-avatar" aria-hidden="true">
                    {(agency?.publicName ?? task.agencyName).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="matched-work-main">
                    <div className="matched-work-title-row">
                      <div>
                        <h3>{task.title}</h3>
                        <p>
                          {agency?.publicName ?? task.agencyName} · Posted {formatDate(task.createdAt)} · {task.category}
                        </p>
                      </div>
                      <span className="matched-score"><Sparkles size={12} /> {matchScore}% Match</span>
                    </div>
                    <div className="matched-work-tags">
                      {[...task.requiredSkills, ...productionTags].slice(0, 6).map((tag) => (
                        <span key={`${task.id}-${tag}`}>{tag}</span>
                      ))}
                    </div>
                    <p className="matched-work-brief">{task.brief}</p>
                    {isExpanded ? (
                      <div className="matched-work-expanded">
                        <div>
                          <span>Full brief</span>
                          <p>{task.brief}</p>
                        </div>
                        <div>
                          <span>Editing style</span>
                          <p>{productionTags.length ? productionTags.join(", ") : task.category}</p>
                        </div>
                        <div>
                          <span>Deliverables</span>
                          <p>{String(metadata.projectScope ?? "Edited final video, source-safe references, and review-ready links.")}</p>
                        </div>
                        <div>
                          <span>Required turnaround</span>
                          <p>{taskDeliveryLabel(task)}</p>
                        </div>
                        <div>
                          <span>Revisions</span>
                          <p>{String(metadata.revisions ?? "2 rounds included after first delivery.")}</p>
                        </div>
                        {task.referenceLinks.length ? (
                          <div>
                            <span>Reference links</span>
                            <div className="matched-reference-row">
                              {task.referenceLinks.slice(0, 3).map((link) => (
                                <a href={link} key={link} rel="noreferrer" target="_blank">
                                  <ExternalLink size={14} />
                                  Reference
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <aside className="matched-work-side">
                    <div className="matched-budget-wrap">
                      <span className="matched-budget-label">Compensation</span>
                      <strong className="matched-budget-value">{formatCurrency(task.budgetAmount)}</strong>
                    </div>
                    <span className={priority === "URGENT" || priority === "HIGH" ? "matched-badge urgent" : "matched-badge"}>
                      {priority === "URGENT" ? <Flame size={13} /> : <Zap size={13} />}
                      {priority === "URGENT" ? "Urgent Priority" : task.budgetAmount >= 10_000 ? "High Value" : "Open Brief"}
                    </span>
                    <span className="matched-delivery">
                      <Clock3 size={13} />
                      Turnaround: <b>{taskDeliveryLabel(task)}</b>
                    </span>
                    <small className="matched-deadline">
                      {task.applicationDeadline ? `Apply by ${formatDate(task.applicationDeadline)}` : "Open brief • Rolling selection"}
                    </small>
                  </aside>
                  <div className="matched-work-footer">
                    {activeTaskId === task.id && !hasApplied ? (
                      <div className="matched-apply-form">
                        <label>
                          Proposal
                          <textarea
                            onChange={(event) => setDraft((current) => ({ ...current, proposal: event.target.value }))}
                            placeholder="Explain your edit approach, delivery plan, and strongest relevant work."
                            rows={4}
                            value={draft.proposal}
                          />
                        </label>
                        <label>
                          Quote (INR)
                          <input
                            min={1}
                            onChange={(event) => setDraft((current) => ({ ...current, quotedAmount: event.target.value }))}
                            type="number"
                            value={draft.quotedAmount}
                          />
                        </label>
                        <label>
                          ETA
                          <input
                            onChange={(event) => setDraft((current) => ({ ...current, estimatedTurnaround: event.target.value }))}
                            placeholder="e.g. 2 days"
                            value={draft.estimatedTurnaround}
                          />
                        </label>
                        <label>
                          Portfolio link
                          <input
                            onChange={(event) => setDraft((current) => ({ ...current, portfolioReference: event.target.value }))}
                            placeholder="https://drive.google.com/..."
                            value={draft.portfolioReference}
                          />
                        </label>
                        <button className="matched-secondary-button" onClick={() => setActiveTaskId(null)} type="button">
                          Cancel
                        </button>
                        <button
                          className="matched-primary-button"
                          disabled={isSubmitting || draft.proposal.trim().length < 10 || !draft.quotedAmount}
                          onClick={() => void submitApplication(task.id)}
                          type="button"
                        >
                          <Send size={14} />
                          {isSubmitting ? "Submitting..." : "Submit Application"}
                        </button>
                      </div>
                    ) : (
                      <>
                      <button
                        className="matched-primary-button"
                        disabled={hasApplied}
                        onClick={() => startApplication(task)}
                        type="button"
                      >
                        <Send size={13} />
                        {currentApplication ? currentApplication.status.replaceAll("_", " ") : "Apply Now"}
                      </button>
                      <button className="matched-secondary-button" onClick={() => setExpandedTaskId(isExpanded ? null : task.id)} type="button">
                        <Eye size={14} />
                        {isExpanded ? "Hide Brief" : "Preview Brief"}
                      </button>
                      <button
                        className={`matched-save-button${isSaved ? " is-active" : ""}`}
                        onClick={() =>
                          setSavedTaskIds((current) => {
                            const next = new Set(current);
                            if (next.has(task.id)) next.delete(task.id);
                            else next.add(task.id);
                            return next;
                          })
                        }
                        type="button"
                      >
                        <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
                        {isSaved ? "Saved" : "Save"}
                      </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
            {!visibleTasks.length ? (
              <article className="matched-empty-state">
                <MessageSquareText size={24} />
                <h3>{isLoading ? "Loading matching projects..." : "No matching projects yet"}</h3>
                <p>Update your skills and portfolio to improve matching.</p>
                <Link className="matched-primary-button" href="/freelancer/profile">
                  Update Skills
                </Link>
              </article>
            ) : null}
          </div>
        </section>
        )}

        {(activeSectionTab === "karma" || activeSectionTab === "all") && (
        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Karma AI bot</p>
              <h2>Application history and selection signals</h2>
              <p className="muted-copy">
                This is the live foundation for selection ratio, response time, shortlist quality, and future delivery reliability.
              </p>
            </div>
          </div>
          <div className="freelancer-kpi-grid">
            <div className="freelancer-kpi-card">
              <BriefcaseBusiness size={18} />
              <span>Applications</span>
              <strong>{karmaSummary.total}</strong>
            </div>
            <div className="freelancer-kpi-card">
              <BadgeCheck size={18} />
              <span>Selected</span>
              <strong>{karmaSummary.accepted}</strong>
            </div>
            <div className="freelancer-kpi-card">
              <Sparkles size={18} />
              <span>Selection ratio</span>
              <strong>{karmaSummary.selectionRate}%</strong>
            </div>
            <div className="freelancer-kpi-card">
              <Clock3 size={18} />
              <span>Avg apply speed</span>
              <strong>{karmaSummary.averageResponseHours}h</strong>
            </div>
          </div>
          <div className="freelancer-service-list">
            {applications.map((application) => {
              const task = taskById.get(application.taskId);
              return (
                <article className="freelancer-service-card" key={application.id}>
                  <div className="freelancer-service-card-top">
                    <span className="meta-pill">{application.status.replaceAll("_", " ")}</span>
                    {application.status === "ACCEPTED" ? <span className="meta-pill">Project history created</span> : null}
                  </div>
                  <h3>{task?.title ?? "Marketplace project"}</h3>
                  <p>{application.proposal}</p>
                  <p>
                    Quote {formatCurrency(application.quotedAmount)} - Turnaround {application.estimatedTurnaround}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
        )}

        {(activeSectionTab === "agencies" || activeSectionTab === "all") && (
          <section className="freelancer-app-panel">
            <div className="freelancer-section-head">
              <div>
                <p className="section-label">Agency access & invitations</p>
                <h2>Review agency invitations, verified seats, and client pipeline access</h2>
                <p className="muted-copy">
                  Agencies invite high-performing editors directly to their roster. Joining an agency grants you direct access to their client order flow and escrow-protected payouts.
                </p>
              </div>
            </div>

            <div className="agency-access-list">
              {allInvites.map((invite) => {
                const agency = agencyMap.get(invite.agencyId);
                const currentResponded = respondedStatusMap[invite.id];
                const isAccepted = currentResponded === "ACCEPT" || invite.status === "Active";
                const isDeclined = currentResponded === "REJECT";
                const isResponding = isRespondingId === invite.id;
                const agencyName = agency?.publicName ?? invite.agencyName;
                const initials =
                  agencyName
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "AG";
                const locationLabel = [agency?.office.city, agency?.office.state].filter(Boolean).join(", ");
                const agencySlug = agency?.slug || invite.agencyId.replace("tenant-", "");

                return (
                  <article className="agency-access-card" key={invite.id}>
                    <div className="agency-access-header">
                      <div className="agency-access-identity">
                        <div className="agency-access-avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div className="agency-access-titles">
                          <h3>
                            {agencyName}
                            <span title="Verified Agency">
                              <BadgeCheck size={18} className="agency-verified-icon" />
                            </span>
                          </h3>
                          <div className="agency-access-meta">
                            <span>{locationLabel || agency?.office.country || "Ahmedabad, Gujarat"}</span>
                            <span className="dot-sep">•</span>
                            <span>{agency?.niche || "Video Production & Content"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="agency-access-badges">
                        {isAccepted ? (
                          <span className="agency-badge active">
                            <span className="pulse-dot" />
                            Active Team Member
                          </span>
                        ) : isDeclined ? (
                          <span className="agency-badge">Declined</span>
                        ) : invite.status === "Invited" ? (
                          <span className="agency-badge invite">
                            <span className="pulse-dot" />
                            Direct Invite
                          </span>
                        ) : (
                          <span className="agency-badge requested">
                            <span className="pulse-dot" />
                            {invite.status}
                          </span>
                        )}
                        {agency?.hiringStatus ? (
                          <span className="agency-badge hiring">
                            <Zap size={12} />
                            {agency.hiringStatus}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="agency-offer-spotlight">
                      <div className="agency-offer-icon">
                        <Sparkles size={18} />
                      </div>
                      <div className="agency-offer-content">
                        <div className="agency-offer-title">
                          Role: {invite.workType || "Video Editor Seat"}
                        </div>
                        <p className="agency-offer-terms">
                          {invite.seatOffer || "Direct client pipeline access with guaranteed escrow payout safety."}
                        </p>
                        {invite.note && <p className="agency-offer-note">{invite.note}</p>}
                      </div>
                    </div>

                    <AgencyTrustPanel agency={agency} />

                    <div className="agency-card-actions">
                      {isAccepted ? (
                        <div className="agency-accepted-banner">
                          <div className="agency-accepted-banner-left">
                            <CheckCircle2 size={16} />
                            <span>You are an active editor on {agencyName}&apos;s team!</span>
                          </div>
                          <Link href={`/freelancer/chats?agency=${invite.agencyId}`} className="btn-agency-chat">
                            <MessageSquare size={14} />
                            Open Agency Chat
                          </Link>
                        </div>
                      ) : isDeclined ? (
                        <div className="agency-declined-banner">
                          <X size={14} />
                          <span>You declined this agency invitation.</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn-agency-accept"
                            disabled={isResponding}
                            onClick={() => void handleRespondInvite(invite.id, "ACCEPT", agencyName)}
                          >
                            <CheckCircle2 size={16} />
                            {isResponding ? "Joining..." : "Accept Invite & Join Team"}
                          </button>
                          <button
                            type="button"
                            className="btn-agency-decline"
                            disabled={isResponding}
                            onClick={() => void handleRespondInvite(invite.id, "REJECT", agencyName)}
                          >
                            <X size={14} />
                            Decline
                          </button>
                          <Link
                            href={`/agency/${agencySlug}`}
                            target="_blank"
                            className="btn-agency-profile"
                          >
                            <ExternalLink size={14} />
                            View Agency Profile
                          </Link>
                          <Link
                            href="/freelancer/chats"
                            className="btn-agency-chat"
                          >
                            <MessageSquare size={14} />
                            Chat
                          </Link>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}

              {freelancerSnapshot.portfolioRequests.map((request) => {
                const agency = agencyMap.get(request.agencyId);
                const agencyName = agency?.publicName ?? request.agencyName;
                const initials =
                  agencyName
                    .split(" ")
                    .map((w) => w[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "OF";
                const agencySlug = agency?.slug || request.agencyId.replace("tenant-", "");

                return (
                  <article className="agency-access-card" key={request.id}>
                    <div className="agency-access-header">
                      <div className="agency-access-identity">
                        <div className="agency-access-avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div className="agency-access-titles">
                          <h3>
                            {agencyName}
                            <BadgeCheck size={18} className="agency-verified-icon" />
                          </h3>
                          <div className="agency-access-meta">
                            <span>{agency?.office.city || "Mumbai"}</span>
                            <span className="dot-sep">•</span>
                            <span>{agency?.niche || "Content Production"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="agency-access-badges">
                        <span className="agency-badge requested">
                          <span className="pulse-dot" />
                          {request.status}
                        </span>
                        {agency?.reputation.band ? (
                          <span className="agency-badge hiring">
                            <ShieldCheck size={12} />
                            {agency.reputation.band} Agency
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="agency-offer-spotlight">
                      <div className="agency-offer-icon">
                        <BriefcaseBusiness size={18} />
                      </div>
                      <div className="agency-offer-content">
                        <div className="agency-offer-title">{request.summary}</div>
                        <p className="agency-offer-terms">{request.portfolioHook}</p>
                      </div>
                    </div>

                    <AgencyTrustPanel agency={agency} />

                    <div className="agency-card-actions">
                      <Link href="/freelancer/profile" className="btn-agency-accept">
                        <Send size={14} />
                        Update & Submit Portfolio
                      </Link>
                      <Link href={`/agency/${agencySlug}`} target="_blank" className="btn-agency-profile">
                        <ExternalLink size={14} />
                        View Agency Profile
                      </Link>
                      <Link href="/freelancer/chats" className="btn-agency-chat">
                        <MessageSquare size={14} />
                        Chat
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export function FreelancerChatSection() {
  return (
    <ChatWorkspace
      audience="freelancer"
      listLabel="Merged agency inbox"
      listTitle="Assigned threads across your active agency memberships."
      mode="inbox"
    />
  );
}

export function FreelancerServicesSection() {
  return <FreelancerDynamicServicesSection />;
}

export function FreelancerDraftServicesSection() {
  return <DraftServicesSection />;
}

export function FreelancerPublishedServicesSection() {
  return <PublishedServicesSection />;
}

export type ServicesTabId = "published" | "drafts" | "review" | "add" | "portfolio";

export function FreelancerMyServicesSection({ initialTab }: { initialTab?: ServicesTabId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromQuery = searchParams.get("tab") as ServicesTabId | null;

  const [activeTab, setActiveTab] = useState<ServicesTabId>(() => {
    if (tabFromQuery && ["published", "drafts", "review", "add", "portfolio"].includes(tabFromQuery)) {
      return tabFromQuery;
    }
    return initialTab ?? "published";
  });

  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    review: 0,
    portfolio: 0,
  });

  useEffect(() => {
    if (tabFromQuery && ["published", "drafts", "review", "add", "portfolio"].includes(tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery, activeTab]);

  const handleTabSelect = (tab: ServicesTabId) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/freelancer/services?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    let active = true;

    async function loadServiceMetrics() {
      try {
        const [servicesRes, draftsRes, portfolioRes] = await Promise.all([
          fetch("/api/freelancer/services", { cache: "no-store" }).catch(() => null),
          fetch("/api/publishing/drafts?mode=service", { cache: "no-store" }).catch(() => null),
          fetch("/api/publishing/drafts?mode=portfolio", { cache: "no-store" }).catch(() => null),
        ]);

        const servicesData = servicesRes && servicesRes.ok ? await servicesRes.json().catch(() => ({})) : {};
        const draftsData = draftsRes && draftsRes.ok ? await draftsRes.json().catch(() => ({})) : {};
        const portfolioData = portfolioRes && portfolioRes.ok ? await portfolioRes.json().catch(() => ({})) : {};

        if (!active) return;

        const servicesList = Array.isArray(servicesData?.services) ? servicesData.services : [];
        const publishedCount = servicesList.filter((s: { status?: string }) => s.status === "Approved" || s.status === "Paused").length;
        const inReviewFromServices = servicesList.filter((s: { status?: string }) => s.status === "Pending Review" || s.status === "Submitted").length;

        const draftList = Array.isArray(draftsData?.drafts) ? draftsData.drafts : [];
        const activeDrafts = draftList.filter((d: { status?: string }) => d.status === "DRAFT" || d.status === "IN_PROGRESS" || d.status === "REJECTED").length;
        const inReviewDrafts = draftList.filter((d: { status?: string }) => d.status === "SUBMITTED" || d.status === "UNDER_REVIEW").length;

        const portfolioList = Array.isArray(portfolioData?.drafts) ? portfolioData.drafts : [];
        const portfolioCount = portfolioList.length;

        setStats({
          published: publishedCount,
          drafts: activeDrafts,
          review: inReviewFromServices + inReviewDrafts,
          portfolio: portfolioCount,
        });
      } catch {
        // graceful fallback
      }
    }

    void loadServiceMetrics();

    return () => {
      active = false;
    };
  }, [activeTab]);

  return (
    <div className="freelancer-app-content">
      <div className="freelancer-app-stack">
        <section className="freelancer-app-panel freelancer-services-hub-panel">
          <div className="freelancer-section-head">
            <div>
              <div className="freelancer-section-eyebrow-row">
                <span className="section-label">Freelancer Services</span>
                <span className="meta-pill">Video Editing</span>
              </div>
              <h2>My Services</h2>
              <p className="muted-copy">
                Package your video-editing expertise, manage live marketplace listings, track approval status, and build your portfolio showcases.
              </p>
            </div>
            <div className="freelancer-action-grid freelancer-services-head-actions">
              {activeTab !== "add" ? (
                <button
                  className="freelancer-primary-button"
                  onClick={() => handleTabSelect("add")}
                  type="button"
                >
                  <PlusCircle size={16} strokeWidth={1.8} />
                  + Add New Service
                </button>
              ) : (
                <button
                  className="freelancer-secondary-button"
                  onClick={() => handleTabSelect("published")}
                  type="button"
                >
                  Back to Services
                </button>
              )}
            </div>
          </div>

          <div className="freelancer-service-metrics-strip">
            <div
              className={`freelancer-service-metric-card ${activeTab === "published" ? "is-active" : ""}`}
              onClick={() => handleTabSelect("published")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTabSelect("published"); } }}
              role="button"
              tabIndex={0}
            >
              <div className="freelancer-service-metric-top">
                <span className="freelancer-service-metric-label">Live / Published</span>
                <span className="freelancer-service-metric-badge live">Live</span>
              </div>
              <strong className="freelancer-service-metric-value">{stats.published}</strong>
              <p className="freelancer-service-metric-note">Approved services visible in buyer discovery</p>
            </div>

            <div
              className={`freelancer-service-metric-card ${activeTab === "drafts" ? "is-active" : ""}`}
              onClick={() => handleTabSelect("drafts")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTabSelect("drafts"); } }}
              role="button"
              tabIndex={0}
            >
              <div className="freelancer-service-metric-top">
                <span className="freelancer-service-metric-label">Drafts</span>
                <span className="freelancer-service-metric-badge draft">In progress</span>
              </div>
              <strong className="freelancer-service-metric-value">{stats.drafts}</strong>
              <p className="freelancer-service-metric-note">Unfinished listings waiting to finish</p>
            </div>

            <div
              className={`freelancer-service-metric-card ${activeTab === "review" ? "is-active" : ""}`}
              onClick={() => handleTabSelect("review")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTabSelect("review"); } }}
              role="button"
              tabIndex={0}
            >
              <div className="freelancer-service-metric-top">
                <span className="freelancer-service-metric-label">In Review</span>
                <span className="freelancer-service-metric-badge review">Pending</span>
              </div>
              <strong className="freelancer-service-metric-value">{stats.review}</strong>
              <p className="freelancer-service-metric-note">Submitted for Super Admin approval</p>
            </div>

            <div
              className={`freelancer-service-metric-card ${activeTab === "portfolio" ? "is-active" : ""}`}
              onClick={() => handleTabSelect("portfolio")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleTabSelect("portfolio"); } }}
              role="button"
              tabIndex={0}
            >
              <div className="freelancer-service-metric-top">
                <span className="freelancer-service-metric-label">Portfolio Showcases</span>
                <span className="freelancer-service-metric-badge portfolio">Showreel</span>
              </div>
              <strong className="freelancer-service-metric-value">{stats.portfolio}</strong>
              <p className="freelancer-service-metric-note">Showcase reels and portfolio drafts</p>
            </div>
          </div>

          <SectionTabs
            activeTab={activeTab}
            onTabChange={(value) => handleTabSelect(value as ServicesTabId)}
            tabs={[
              { id: "published", label: `Published (${stats.published})` },
              { id: "drafts", label: `Drafts (${stats.drafts})` },
              { id: "review", label: `In Review (${stats.review})` },
              { id: "add", label: "+ Add Service" },
              { id: "portfolio", label: `Portfolio Showcases (${stats.portfolio})` },
            ]}
          />
        </section>

        {activeTab === "published" && <PublishedServicesSection />}
        {activeTab === "drafts" && <DraftServicesSection filter="drafts" />}
        {activeTab === "review" && (
          <DraftServicesSection
            filter="review"
            title="Services in Review"
            description="Submitted services awaiting Super Admin review and marketplace activation. Approvals typically complete within 24 hours."
          />
        )}
        {activeTab === "add" && <FreelancerDynamicAddServiceSection />}
        {activeTab === "portfolio" && <PublishingAssistant mode="portfolio" />}
      </div>
    </div>
  );
}

export function FreelancerAddServiceSection() {
  return <FreelancerMyServicesSection initialTab="add" />;
}

export function FreelancerProfileSection({
  agencies,
  publishedShowcases = [],
}: {
  agencies: AgencyListingProfile[];
  publishedShowcases?: PortfolioDraft[];
}) {
  const agencyMap = useMemo(() => new Map(agencies.map((agency) => [agency.tenantId, agency])), [agencies]);
  const [profile, setProfile] = useState<FreelancerProfileState>(defaultProfileState);
  const [languagesInput, setLanguagesInput] = useState("");
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    let active = true;

    fetchFreelancerProfileState()
      .then((nextProfile) => {
        if (!active) {
          return;
        }

        setProfile(nextProfile);
        setLanguagesInput(joinLanguages(nextProfile.languages));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setProfile(defaultProfileState);
        setLanguagesInput("");
      })
      .finally(() => {
        if (active) {
          setIsProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleProfileSave() {
    setIsSavingProfile(true);
    setProfileNotice(null);

    try {
      const response = await fetch("/api/freelancer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          languages: splitLanguages(languagesInput),
        }),
      });
      const payload = await response.json();
      const nextProfile = (payload.profile ?? defaultProfileState) as FreelancerProfileState;
      setProfile(nextProfile);
      setLanguagesInput(joinLanguages(nextProfile.languages));
      setProfileNotice("Profile saved.");
    } catch {
      setProfileNotice("Profile could not be saved right now.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <div className="freelancer-app-content">
      <div className="freelancer-app-stack">
        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Profile</p>
              <h2>Keep identity, profession, and verification in one place.</h2>
              {profile.identityVerified ? <span className="gigxomi-verified-badge"><BadgeCheck size={15} /> Gigxomi Identity Verified</span> : null}
            </div>
            <span className="meta-pill">{profile.status.replaceAll("_", " ")}</span>
          </div>

          <div className="freelancer-form-grid">
            <label className="freelancer-field">
              <span>Full name</span>
              <input
                disabled={isProfileLoading}
                onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                value={profile.fullName}
              />
            </label>
            <label className="freelancer-field">
              <span>Profession</span>
              <input
                disabled={isProfileLoading}
                onChange={(event) => setProfile((current) => ({ ...current, profession: event.target.value }))}
                value={profile.profession}
              />
            </label>
            <label className="freelancer-field">
              <span>Phone</span>
              <input disabled={isProfileLoading} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} value={profile.phone} />
            </label>
            <label className="freelancer-field">
              <span>Languages</span>
              <input disabled={isProfileLoading} onChange={(event) => setLanguagesInput(event.target.value)} value={languagesInput} />
            </label>
            <label className="freelancer-field">
              <span>Email</span>
              <input disabled={isProfileLoading} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} value={profile.email} />
            </label>
            <label className="freelancer-field">
              <span>English level</span>
              <input
                disabled={isProfileLoading}
                onChange={(event) => setProfile((current) => ({ ...current, englishLevel: event.target.value }))}
                placeholder="Conversational / Fluent"
                value={profile.englishLevel}
              />
            </label>
            <label className="freelancer-field freelancer-field-full">
              <span>Bio</span>
              <textarea
                disabled={isProfileLoading}
                onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
                value={profile.bio}
              />
            </label>
          </div>

          <div className="freelancer-action-grid">
            <button className="freelancer-primary-button" disabled={isProfileLoading || isSavingProfile} onClick={handleProfileSave} type="button">
              {isSavingProfile ? "Saving profile..." : "Save profile"}
            </button>
            <span className="muted-copy">{profileNotice ?? (profile.updatedAt ? `Last updated ${formatDate(profile.updatedAt)}.` : "Profile is still using your session defaults.")}</span>
          </div>
        </section>

        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Published showcases</p>
              <h2>Every approved published showcase should be visible back in the freelancer workspace with pricing and placement context.</h2>
            </div>
            <span className="meta-pill">{publishedShowcases.length} live</span>
          </div>

          <div className="freelancer-service-list">
            {publishedShowcases.map((draft) => (
              <article className="freelancer-service-card" key={draft.id}>
                <div className="freelancer-service-card-top">
                  <span className="meta-pill">{draft.showcasePlacement}</span>
                  <span className="meta-pill">{draft.sourceVideoPlatform || "Video"}</span>
                </div>
                <h3>{draft.title}</h3>
                <p>{draft.summary || draft.description}</p>
                <p>
                  <strong>Price:</strong> {draft.price ? `INR ${draft.price.toLocaleString("en-IN")}` : "Not set"} - <strong>Delivery:</strong>{" "}
                  {draft.deliveryTime || "Not set"}
                </p>
                <div className="freelancer-action-grid">
                  <a className="freelancer-primary-button" href={draft.sourceVideoUrl ?? "#"} rel="noreferrer" target="_blank">
                    Open published video
                    <ExternalLink size={14} strokeWidth={1.8} />
                  </a>
                  <span className="muted-copy">Published {draft.publishedAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(draft.publishedAt)) : "recently"}.</span>
                </div>
              </article>
            ))}
            {!publishedShowcases.length ? (
              <p className="muted-copy">Once agency-approved work is published, it will appear here automatically.</p>
            ) : null}
          </div>
        </section>

        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Identity verification</p>
              <h2>DigiLocker confirms identity without storing your document number.</h2>
            </div>
            {profile.identityVerified ? <span className="gigxomi-verified-badge"><BadgeCheck size={15} /> Gigxomi Identity Verified</span> : <span className="meta-pill">OPTIONAL</span>}
          </div>

          <div className="freelancer-action-grid">
            {!profile.identityVerified ? <Link className="freelancer-primary-button" href="/freelancer/onboarding">Verify with DigiLocker</Link> : null}
            <span className="muted-copy">Gigxomi stores the provider reference, verified name, document type, issuer, consent timestamps and status only. The badge confirms identity—not editing skill or ethics.</span>
          </div>
        </section>

        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Agency team access</p>
              <h2>Track joined agencies, pending seat activation, and current applications in one place.</h2>
            </div>
          </div>

          <div className="freelancer-service-list">
            {freelancerSnapshot.memberships.map((membership) => {
              const agency = agencyMap.get(membership.agencyId);

              return (
                <article className="freelancer-service-card" key={`${membership.agencyId}-${membership.editorId}`}>
                  <div className="freelancer-service-card-top">
                    <span className="meta-pill">{membership.status}</span>
                  </div>
                  <h3>{agency?.publicName ?? membership.agencyId}</h3>
                  <p>{agency?.tagline || agency?.niche || membership.role}</p>
                  <p>
                    <strong>{membership.role}</strong> - {membership.activeSeatCounted ? "Seat active" : "Seat not billed yet"}
                  </p>
                  <AgencyTrustPanel agency={agency} />
                </article>
              );
            })}
            {freelancerSnapshot.applications.map((application) => (
              <article className="freelancer-service-card" key={application.id}>
                <div className="freelancer-service-card-top">
                  <span className="meta-pill">{application.status}</span>
                </div>
                <h3>{application.projectId}</h3>
                <p>{application.note}</p>
                <p>
                  <strong>Start gate:</strong> team membership must be active before this project can move into work.
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function FreelancerWalletSection() {
  const [wallet, setWallet] = useState<FreelancerWalletState>(defaultWalletState);
  const [ledger, setLedger] = useState<FreelancerWalletLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchFreelancerWalletState()
      .then((payload) => {
        if (!active) {
          return;
        }

        setWallet(payload.wallet);
        setLedger(payload.ledger);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setWallet(defaultWalletState);
        setLedger([]);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="freelancer-app-content">
      <div className="freelancer-app-stack">
        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Wallet</p>
              <h2>Credits only come from final approved paid quotes after plan-based fee deduction.</h2>
            </div>
          </div>

          <div className="freelancer-report-grid">
            <article className="freelancer-report-card">
              <span>Gross earned</span>
              <strong>{formatCurrency(wallet.grossEarned)}</strong>
            </article>
            <article className="freelancer-report-card">
              <span>Gigxomi fee</span>
              <strong>{formatCurrency(wallet.commissionDeducted)}</strong>
            </article>
            <article className="freelancer-report-card">
              <span>Pending clearance</span>
              <strong>{formatCurrency(wallet.pendingClearance)}</strong>
            </article>
            <article className="freelancer-report-card">
              <span>Available</span>
              <strong>{formatCurrency(wallet.availableForWithdrawal)}</strong>
            </article>
          </div>
        </section>

        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Ledger</p>
              <h2>Each wallet row is transaction-based, not a loose balance guess.</h2>
            </div>
          </div>

          <div className="freelancer-ledger-list">
            {ledger.map((entry) => (
              <article className="freelancer-ledger-row" key={entry.id}>
                <div>
                  <strong>{entry.title}</strong>
                  <small>{formatDate(entry.createdAt)}</small>
                </div>
                <div>
                  <span>Gross</span>
                  <strong>{formatCurrency(entry.gross)}</strong>
                </div>
                <div>
                  <span>Fee</span>
                  <strong>{formatCurrency(entry.commission)}</strong>
                </div>
                <div>
                  <span>Net</span>
                  <strong>{formatCurrency(entry.net)}</strong>
                </div>
                <span className="meta-pill">{entry.status}</span>
              </article>
            ))}
            {!isLoading && !ledger.length ? <p className="muted-copy">No wallet credits have landed yet. Paid conversation requests will start appearing here automatically.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export function FreelancerPayoutsSection() {
  const [paymentDetails, setPaymentDetails] = useState<FreelancerPaymentDetailsState>(defaultPaymentDetailsState);
  const [payoutRequestRows, setPayoutRequestRows] = useState<FreelancerPayoutRequestState[]>([]);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [requestNotice, setRequestNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([fetchFreelancerPaymentDetailsState(), fetchFreelancerPayoutRequestState()])
      .then(([nextPaymentDetails, nextPayoutRequests]) => {
        if (!active) {
          return;
        }

        setPaymentDetails(nextPaymentDetails);
        setPayoutRequestRows(nextPayoutRequests);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setPaymentDetails(defaultPaymentDetailsState);
        setPayoutRequestRows([]);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handlePaymentSave() {
    setIsSavingPayment(true);
    setPaymentNotice(null);

    try {
      const response = await fetch("/api/freelancer/payment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentDetails),
      });
      const payload = await response.json();
      setPaymentDetails((payload.paymentDetails ?? defaultPaymentDetailsState) as FreelancerPaymentDetailsState);
      setPaymentNotice("Payout and billing details saved.");
    } catch {
      setPaymentNotice("Payout details could not be saved right now.");
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handlePayoutRequest() {
    setIsSubmittingRequest(true);
    setRequestNotice(null);

    try {
      const response = await fetch("/api/freelancer/payout-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(requestAmount || 0),
          note: requestNote,
        }),
      });
      const payload = await response.json();
      setPayoutRequestRows((payload.payoutRequests ?? []) as FreelancerPayoutRequestState[]);
      setRequestAmount("");
      setRequestNote("");
      setRequestNotice("Payout request submitted.");
    } catch {
      setRequestNotice("Payout request could not be submitted right now.");
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  return (
    <div className="freelancer-app-content">
      <div className="freelancer-app-stack">
        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Payouts</p>
              <h2>Support both the 30% commission model and the 5% subscription model inside the same wallet logic.</h2>
            </div>
          </div>

          <div className="freelancer-plan-grid">
            {monetizationPlans.map((plan) => (
              <article className={plan.id === payoutPlanId(paymentDetails.monetizationPlan) ? "freelancer-plan-card active" : "freelancer-plan-card"} key={plan.id}>
                <span className="meta-pill">{plan.badge}</span>
                <strong>{plan.name}</strong>
                <p>{plan.description}</p>
                <b>{plan.effectiveFee} effective fee</b>
                <button
                  className="freelancer-secondary-button"
                  onClick={() => setPaymentDetails((current) => ({ ...current, monetizationPlan: monetizationPlanValue(plan.id) }))}
                  type="button"
                >
                  {plan.id === payoutPlanId(paymentDetails.monetizationPlan) ? "Selected" : "Use this plan"}
                </button>
              </article>
            ))}
          </div>

          <div className="freelancer-form-grid">
            <label className="freelancer-field">
              <span>Account holder</span>
              <input
                disabled={isLoading || isSavingPayment}
                onChange={(event) => setPaymentDetails((current) => ({ ...current, bankAccountName: event.target.value }))}
                value={paymentDetails.bankAccountName}
              />
            </label>
            <label className="freelancer-field">
              <span>Bank account number</span>
              <input
                disabled={isLoading || isSavingPayment}
                onChange={(event) => setPaymentDetails((current) => ({ ...current, bankAccountNumber: event.target.value }))}
                value={paymentDetails.bankAccountNumber}
              />
            </label>
            <label className="freelancer-field">
              <span>IFSC</span>
              <input
                disabled={isLoading || isSavingPayment}
                onChange={(event) => setPaymentDetails((current) => ({ ...current, bankIfsc: event.target.value.toUpperCase() }))}
                value={paymentDetails.bankIfsc}
              />
            </label>
            <label className="freelancer-field">
              <span>UPI ID</span>
              <input disabled={isLoading || isSavingPayment} onChange={(event) => setPaymentDetails((current) => ({ ...current, upiId: event.target.value }))} value={paymentDetails.upiId} />
            </label>
          </div>

          <div className="freelancer-inline-list">
            {payoutRules.map((rule) => (
              <div className="freelancer-inline-row" key={rule}>
                <CreditCard size={15} strokeWidth={1.8} />
                <span>{rule}</span>
              </div>
            ))}
          </div>

          <div className="freelancer-action-grid">
            <button className="freelancer-primary-button" disabled={isLoading || isSavingPayment} onClick={handlePaymentSave} type="button">
              {isSavingPayment ? "Saving..." : "Save payout details"}
            </button>
            <span className="muted-copy">{paymentNotice ?? paymentDetails.commissionRule}</span>
          </div>
        </section>

        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Payout requests</p>
              <h2>Manual transfer can stay in v1, but requests and states still need to be structured.</h2>
            </div>
          </div>

          <div className="freelancer-form-grid">
            <label className="freelancer-field">
              <span>Amount</span>
              <input disabled={isSubmittingRequest} onChange={(event) => setRequestAmount(event.target.value)} placeholder="2500" value={requestAmount} />
            </label>
            <label className="freelancer-field freelancer-field-full">
              <span>Note</span>
              <input disabled={isSubmittingRequest} onChange={(event) => setRequestNote(event.target.value)} placeholder="Payout request note" value={requestNote} />
            </label>
          </div>

          <div className="freelancer-action-grid">
            <button className="freelancer-primary-button" disabled={isSubmittingRequest || !requestAmount} onClick={handlePayoutRequest} type="button">
              {isSubmittingRequest ? "Submitting..." : "Request payout"}
            </button>
            <span className="muted-copy">{requestNotice ?? "Requests stay structured so admin/finance can settle them cleanly."}</span>
          </div>

          <div className="freelancer-service-list">
            {payoutRequestRows.map((request) => (
              <article className="freelancer-service-card" key={request.id}>
                <div className="freelancer-service-card-top">
                  <span className="meta-pill">{request.status}</span>
                </div>
                <h3>{formatCurrency(request.amount)}</h3>
                <p>{request.note}</p>
                <p>Requested {formatDate(request.createdAt)}</p>
              </article>
            ))}
            {!isLoading && !payoutRequestRows.length ? <p className="muted-copy">No payout requests yet. Save payout details above, then raise a structured request from this page.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export function FreelancerEarningsSection() {
  const [activeTab, setActiveTab] = useState<"payouts" | "wallet">("payouts");

  return (
    <div className="freelancer-app-content">
      <div className="freelancer-app-stack">
        <section className="freelancer-app-panel">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Earnings</p>
              <h2>One place for payout details and wallet credits.</h2>
            </div>
          </div>
          <SectionTabs
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as "payouts" | "wallet")}
            tabs={[
              { id: "payouts", label: "Payout Details" },
              { id: "wallet", label: "Wallet" },
            ]}
          />
        </section>

        {activeTab === "payouts" ? <FreelancerPayoutsSection /> : null}
        {activeTab === "wallet" ? <FreelancerWalletSection /> : null}
      </div>
    </div>
  );
}
