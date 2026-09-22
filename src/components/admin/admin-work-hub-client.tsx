"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clock3,
  ExternalLink,
  IndianRupee,
  LinkIcon,
  ListChecks,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

import { SimpleDataTable, StatusPill, SurfaceCard } from "@/components/ui/dashboard-primitives";

type DirectoryEditorService = {
  id: string;
  slug?: string;
  title: string;
  category?: string;
  price: number;
  deliveryTime?: string;
  portfolioUrl?: string;
};

type DirectoryEditor = {
  id: string;
  name: string;
  title?: string;
  category?: string;
  bio?: string;
  avatarUrl?: string | null;
  verificationStatus?: string;
  trustScore?: number;
  trustProvisional?: boolean;
  skills?: string[];
  workloadBand?: string;
  isOnline?: boolean;
  startingPrice?: number;
  deliveryTime?: string;
  portfolioLinks?: string[];
  services?: DirectoryEditorService[];
};

type MarketplaceTask = {
  id: string;
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
  freelancerId: string;
  freelancerName: string;
  proposal: string;
  quotedAmount: number;
  estimatedTurnaround: string;
  portfolioReference: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type MarketplacePayload = {
  tasks?: MarketplaceTask[];
  applications?: TaskApplication[];
  limits?: {
    activeProjectLimit: number | null;
    activeProjects: number;
    activeTeamEditors: number;
    editorFreelancerLimit: number | null;
  } | null;
};

type CreateWorkForm = {
  title: string;
  category: string;
  budgetAmount: string;
  deadline: string;
  applicationDeadline: string;
  visibility: "PUBLIC" | "AGENCY_TEAM" | "INVITED_ONLY";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  requiredSkills: string;
  productionTags: string;
  sampleLink: string;
  projectScope: string;
  brief: string;
};

type WorkHubTab = "active" | "applications" | "delivery" | "payments";

const defaultCreateWorkForm: CreateWorkForm = {
  title: "",
  category: "Short-form editing",
  budgetAmount: "",
  deadline: "",
  applicationDeadline: "",
  visibility: "PUBLIC",
  priority: "NORMAL",
  requiredSkills: "",
  productionTags: "Color grading, Sound design, Motion graphics",
  sampleLink: "",
  projectScope: "Video edit",
  brief: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return "INR 0";
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function averageHours(items: number[]): number {
  if (!items.length) return 0;
  return Math.round(items.reduce((total, item) => total + item, 0) / items.length);
}

function diffHours(start: string, end: string): number | null {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 36e5));
}

function normalizeUrlCandidate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    try {
      const withProto = `https://${trimmed}`;
      new URL(withProto);
      return withProto;
    } catch {
      return null;
    }
  }
  return null;
}

function parsePortfolioReferences(input?: string | null): { urls: string[]; notes: string[] } {
  if (!input || typeof input !== "string") return { urls: [], notes: [] };
  const tokens = input
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const urls: string[] = [];
  for (const token of tokens) {
    const normalized = normalizeUrlCandidate(token);
    if (normalized && !urls.includes(normalized)) {
      urls.push(normalized);
    }
  }

  const notes: string[] = [];
  const trimmedAll = input.trim();
  if (urls.length === 0 && trimmedAll) {
    notes.push(trimmedAll);
  }

  return { urls, notes };
}

function isGigxomiPromoFallback(url: string) {
  return /testimonial-edits-d+.mp4/i.test(url);
}

function extractUrlsFromText(text?: string | null): string[] {
  if (!text || typeof text !== "string") return [];
  const matches = text.match(/https?:\/\/[^\s"',<>)]+/g) || [];
  return Array.from(new Set(matches.map((u) => u.trim()).filter(Boolean)));
}

function getPortfolioMeta(url: string, index: number) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    const isDirectVideo =
      pathname.endsWith(".mp4") ||
      pathname.endsWith(".webm") ||
      pathname.endsWith(".mov") ||
      pathname.endsWith(".m4v");

    let provider = host;
    if (host.includes("drive.google.com")) {
      provider = "Google Drive Work";
    } else if (host.includes("youtube.com") || host.includes("youtu.be")) {
      provider = "YouTube Video";
    } else if (host.includes("instagram.com")) {
      provider = "Instagram Reel";
    } else if (host.includes("vimeo.com")) {
      provider = "Vimeo Video";
    } else if (host.includes("loom.com")) {
      provider = "Loom Recording";
    } else if (host.includes("behance.net")) {
      provider = "Behance Showcase";
    } else if (host.includes("frame.io")) {
      provider = "Frame.io Review";
    } else if (isDirectVideo) {
      provider = "Direct Reel / Video";
    }

    return {
      label: provider,
      isDirectVideo,
      host,
      displayUrl: url,
    };
  } catch {
    return {
      label: `Portfolio Sample ${index + 1}`,
      isDirectVideo: false,
      host: "portfolio",
      displayUrl: url,
    };
  }
}

export function AdminWorkHubClient() {
  const [tasks, setTasks] = useState<MarketplaceTask[]>([]);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [limits, setLimits] = useState<MarketplacePayload["limits"]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkHubTab>("active");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateWorkForm>(defaultCreateWorkForm);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<TaskApplication | null>(null);
  const [editorProfile, setEditorProfile] = useState<DirectoryEditor | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [modalActionError, setModalActionError] = useState<string | null>(null);
  const [modalActionNotice, setModalActionNotice] = useState<string | null>(null);


  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as MarketplacePayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load work hub.");
      }
      setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
      setApplications(Array.isArray(payload.applications) ? payload.applications : []);
      setLimits(payload.limits ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load work hub.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "applications" || hash === "active" || hash === "delivery" || hash === "payments") {
        setActiveTab(hash as WorkHubTab);
      }
    }
  }, []);

  const handleTabClick = (tabId: WorkHubTab) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tabId}`);
    }
  };

  const applicationsByTask = useMemo(() => {
    const grouped = new Map<string, TaskApplication[]>();
    for (const application of applications) {
      const current = grouped.get(application.taskId) || [];
      current.push(application);
      grouped.set(application.taskId, current);
    }
    return grouped;
  }, [applications]);

  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const deleteTask = async (taskId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This work post will be removed and will no longer appear in the marketplace.`)) {
      return;
    }
    setDeletingTaskId(taskId);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete work post.");
      }
      setNotice("Work post deleted successfully.");
      await loadTasks();
    } catch (delErr) {
      setError(delErr instanceof Error ? delErr.message : "Unable to delete work post.");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeTasks = useMemo(() => {
    const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
    return tasks.filter((task) => {
      if (["ASSIGNED", "COMPLETED", "CANCELLED", "DELETED", "EXPIRED"].includes(task.status)) {
        return false;
      }
      // Work automatically disappears after 24 hours when deadline hits
      if (task.deadline && new Date(task.deadline).getTime() < cutoff24h) {
        return false;
      }
      if (task.applicationDeadline && new Date(task.applicationDeadline).getTime() < cutoff24h) {
        return false;
      }
      return true;
    });
  }, [tasks]);

  const karmaSignals = useMemo(() => {
    const accepted = applications.filter((application) => application.status === "ACCEPTED").length;
    const shortlisted = applications.filter((application) => application.status === "SHORTLISTED").length;
    const rejected = applications.filter((application) => application.status === "REJECTED").length;
    const reviewed = applications.filter((application) =>
      ["ACCEPTED", "SHORTLISTED", "REJECTED"].includes(application.status),
    );
    const reviewHours = reviewed
      .map((application) => diffHours(application.createdAt, application.updatedAt))
      .filter((value): value is number => value !== null);

    return {
      accepted,
      averageReviewHours: averageHours(reviewHours),
      rejected,
      selectionRate: applications.length ? Math.round((accepted / applications.length) * 100) : 0,
      shortlisted,
      total: applications.length,
    };
  }, [applications]);

  const submitWorkPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch("/api/tasks", {
        body: JSON.stringify({
          applicationDeadline: form.applicationDeadline || undefined,
          brief: form.brief,
          budgetAmount: Number(form.budgetAmount || 0),
          category: form.category,
          deadline: form.deadline || undefined,
          priority: form.priority,
          projectScope: form.projectScope,
          productionTags: splitList(form.productionTags),
          referenceLinks: splitList(form.sampleLink),
          requiredSkills: splitList(form.requiredSkills),
          sampleLink: form.sampleLink,
          title: form.title,
          visibility: form.visibility,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to create work.");
      setNotice("Work is live for eligible freelancers. Applications will appear here.");
      setForm(defaultCreateWorkForm);
      setShowCreateForm(false);
      await loadTasks();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create work.");
    } finally {
      setIsCreating(false);
    }
  };

  const openFreelancerProfile = useCallback(async (application: TaskApplication) => {
    setSelectedApplication(application);
    setEditorProfile(null);
    setIsLoadingProfile(true);
    setProfileNotice(null);
    setModalActionError(null);
    setModalActionNotice(null);

    try {
      const response = await fetch(`/api/team/editor-directory/${encodeURIComponent(application.freelancerId)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        editor?: DirectoryEditor;
        error?: string;
      };

      if (response.ok && payload.ok && payload.editor) {
        setEditorProfile(payload.editor);
      } else {
        setProfileNotice(payload.error || "Profile details not in directory; showing submitted application.");
      }
    } catch {
      setProfileNotice("Unable to load directory profile; showing submitted application.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const closeFreelancerProfile = useCallback(() => {
    setSelectedApplication(null);
    setEditorProfile(null);
    setIsLoadingProfile(false);
    setProfileNotice(null);
    setModalActionError(null);
    setModalActionNotice(null);
  }, []);

  useEffect(() => {
    if (!selectedApplication) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeFreelancerProfile();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedApplication, closeFreelancerProfile]);

  const reviewApplication = async (applicationId: string, action: "ACCEPT" | "REJECT" | "SHORTLIST") => {
    setReviewingId(applicationId);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/task-applications/${applicationId}`, {
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to update application.");
      const successMsg =
        action === "ACCEPT" ? "Freelancer selected. Assignment history has been created." : "Application updated.";
      setNotice(successMsg);

      setSelectedApplication((prev) => {
        if (!prev || prev.id !== applicationId) return prev;
        return {
          ...prev,
          status: action === "ACCEPT" ? "ACCEPTED" : action === "SHORTLIST" ? "SHORTLISTED" : "REJECTED",
        };
      });

      await loadTasks();
      return successMsg;
    } catch (reviewError) {
      const msg = reviewError instanceof Error ? reviewError.message : "Unable to update application.";
      setError(msg);
      throw reviewError;
    } finally {
      setReviewingId(null);
    }
  };

  const handleModalReview = async (action: "ACCEPT" | "REJECT" | "SHORTLIST") => {
    if (!selectedApplication) return;
    setModalActionError(null);
    setModalActionNotice(null);
    try {
      const successMsg = await reviewApplication(selectedApplication.id, action);
      setModalActionNotice(successMsg);
    } catch (actionErr) {
      setModalActionError(actionErr instanceof Error ? actionErr.message : "Unable to update application.");
    }
  };

  const { portfolioLinks: combinedPortfolioLinks, portfolioNotes } = useMemo(() => {
    const linkSet = new Set<string>();
    const { urls: appUrls, notes: appNotes } = parsePortfolioReferences(selectedApplication?.portfolioReference);
    for (const u of appUrls) {
      if (!isGigxomiPromoFallback(u)) linkSet.add(u);
    }

    if (selectedApplication?.portfolioReference?.startsWith("service:")) {
      const svcId = selectedApplication.portfolioReference.replace(/^service:/, "").trim();
      const matchedSvc = editorProfile?.services?.find((s) => s.id === svcId || s.slug === svcId);
      if (matchedSvc?.portfolioUrl && !isGigxomiPromoFallback(matchedSvc.portfolioUrl)) {
        const norm = normalizeUrlCandidate(matchedSvc.portfolioUrl);
        if (norm) linkSet.add(norm);
      }
    }

    if (selectedApplication?.proposal) {
      const proposalUrls = extractUrlsFromText(selectedApplication.proposal);
      for (const u of proposalUrls) {
        if (!isGigxomiPromoFallback(u)) linkSet.add(u);
      }
    }

    if (editorProfile?.portfolioLinks && Array.isArray(editorProfile.portfolioLinks)) {
      for (const link of editorProfile.portfolioLinks) {
        if (typeof link === "string") {
          const norm = normalizeUrlCandidate(link);
          if (norm && !isGigxomiPromoFallback(norm)) linkSet.add(norm);
        }
      }
    }

    if (editorProfile?.services && Array.isArray(editorProfile.services)) {
      for (const s of editorProfile.services) {
        if (s.portfolioUrl && typeof s.portfolioUrl === "string") {
          const norm = normalizeUrlCandidate(s.portfolioUrl);
          if (norm && !isGigxomiPromoFallback(norm)) linkSet.add(norm);
        }
      }
    }

    return { portfolioLinks: Array.from(linkSet), portfolioNotes: appNotes };
  }, [selectedApplication, editorProfile]);

  const skillsList = useMemo(() => {
    const skills = new Set<string>();
    if (editorProfile?.skills && Array.isArray(editorProfile.skills)) {
      editorProfile.skills.forEach((s) => {
        if (typeof s === "string" && s.trim()) skills.add(s.trim());
      });
    }
    if (skills.size === 0) {
      ["Premiere Pro", "After Effects", "CapCut"].forEach((s) => skills.add(s));
    }
    return Array.from(skills);
  }, [editorProfile]);

  const servicesList = useMemo(() => {
    return Array.isArray(editorProfile?.services) ? editorProfile.services : [];
  }, [editorProfile]);

  const applicationRows = applications.map((application) => {
    const task = taskById.get(application.taskId);
    const responseHours = task ? diffHours(task.createdAt, application.createdAt) : null;
    const isReviewed = reviewingId === application.id;

    const initials =
      application.freelancerName
        .split(" ")
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "FL";

    return {
      id: application.id,
      action: (
        <div className="work-hub-row-actions">
          <button
            className="work-hub-btn work-hub-btn-shortlist"
            disabled={isReviewed || application.status === "SHORTLISTED" || application.status === "ACCEPTED"}
            onClick={() => void reviewApplication(application.id, "SHORTLIST")}
            title="Shortlist applicant"
            type="button"
          >
            <Star size={13} strokeWidth={2} />
            <span>Shortlist</span>
          </button>
          <button
            className="work-hub-btn work-hub-btn-select"
            disabled={isReviewed || application.status === "ACCEPTED"}
            onClick={() => void reviewApplication(application.id, "ACCEPT")}
            title="Select and assign freelancer"
            type="button"
          >
            <Check size={13} strokeWidth={2.4} />
            <span>Select</span>
          </button>
          <button
            className="work-hub-btn work-hub-btn-reject"
            disabled={isReviewed || application.status === "REJECTED"}
            onClick={() => void reviewApplication(application.id, "REJECT")}
            title="Reject applicant"
            type="button"
          >
            <X size={13} strokeWidth={2} />
            <span>Reject</span>
          </button>
        </div>
      ),
      freelancer: (
        <div className="work-hub-freelancer-cell">
          <button
            className="work-hub-freelancer-trigger"
            onClick={() => void openFreelancerProfile(application)}
            title="Click to view freelancer profile and portfolio"
            type="button"
          >
            <span className="work-hub-avatar">{initials}</span>
            <span className="work-hub-freelancer-name">
              {application.freelancerName}
              <ExternalLink className="work-hub-external-icon" size={12} />
            </span>
          </button>
          <p className="work-hub-proposal-text" title={application.proposal}>
            {application.proposal}
          </p>
          {application.portfolioReference && (
            <button
              className="work-hub-portfolio-chip"
              onClick={() => void openFreelancerProfile(application)}
              title="Click to view attached portfolio link"
              type="button"
            >
              <LinkIcon size={11} />
              <span>Portfolio attached</span>
            </button>
          )}
        </div>
      ),
      karma: (
        <span className="work-hub-karma-badge">
          <Sparkles size={12} />
          <span>
            {responseHours === null
              ? "Applied recently"
              : responseHours === 0
              ? "Applied < 1h"
              : `Applied in ${responseHours}h`}
          </span>
        </span>
      ),
      project: (
        <div className="work-hub-project-cell">
          <strong className="work-hub-project-name">{task?.title || "Project removed"}</strong>
          {task?.category ? <span className="work-hub-project-category">{task.category}</span> : null}
        </div>
      ),
      quote: (
        <span className="work-hub-quote-badge">
          {formatCurrency(application.quotedAmount)}
        </span>
      ),
      status: (
        <span className={`work-hub-status-badge status-${application.status.toLowerCase()}`}>
          {application.status.replaceAll("_", " ")}
        </span>
      ),
      turnaround: (
        <span className="work-hub-turnaround-badge">
          <Clock3 size={12} />
          <span>{application.estimatedTurnaround || "Not set"}</span>
        </span>
      ),
    };
  });

  const tabs: Array<{ id: WorkHubTab; icon: typeof BriefcaseBusiness; label: string; count: number | string }> = [
    { id: "active", icon: BriefcaseBusiness, label: "Active Work", count: activeTasks.length },
    { id: "applications", icon: UserCheck, label: "Applications", count: applications.length },
    { id: "delivery", icon: ListChecks, label: "Delivery Review", count: "Live" },
    { id: "payments", icon: IndianRupee, label: "Payment Requests", count: "Open" },
  ];
  const editorLimit = limits?.editorFreelancerLimit ?? null;
  const projectLimit = limits?.activeProjectLimit ?? null;
  const editorPercent = editorLimit ? Math.min(100, Math.round(((limits?.activeTeamEditors ?? 0) / editorLimit) * 100)) : 0;

  return (
    <>
      <section className="page-section-header">
        <div>
          <p className="section-eyebrow">Agency work marketplace</p>
          <h2>Work Hub</h2>
          <p className="muted-copy">
            Create freelancer-ready projects, review applicants, and convert selected editors into tracked assignment history.
          </p>
        </div>
        <button className="gx-button gx-button-primary" onClick={() => setShowCreateForm((value) => !value)} type="button">
          <PlusCircle size={18} />
          {showCreateForm ? "Close form" : "Create Work"}
        </button>
      </section>

      <nav aria-label="Work hub sections" className="work-hub-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              aria-pressed={activeTab === tab.id}
              className={`work-hub-tab${activeTab === tab.id ? " is-active" : ""}`}
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              type="button"
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              <strong>{tab.count}</strong>
            </button>
          );
        })}
      </nav>

      <SurfaceCard className="section-panel">
        <div className="section-title-row">
          <UserCheck size={20} />
          <div>
            <h3>Package capacity</h3>
            <p className="muted-copy">Only active team editors count against the package. Removed or suspended editors free the seat again.</p>
          </div>
        </div>
        <div className="metric-strip">
          <div className="mini-metric">
            <UserCheck size={18} />
            <span>Team editors</span>
            <strong>
              {limits?.activeTeamEditors ?? 0}/{editorLimit ?? "Unlimited"}
            </strong>
          </div>
          <div className="mini-metric">
            <BriefcaseBusiness size={18} />
            <span>Active work limit</span>
            <strong>
              {limits?.activeProjects ?? activeTasks.length}/{projectLimit ?? "Unlimited"}
            </strong>
          </div>
        </div>
        <div className="work-hub-capacity-meter" aria-label="Team editor package usage">
          <span style={{ width: `${editorPercent}%` }} />
        </div>
      </SurfaceCard>

      {(notice || error) && (
        <SurfaceCard className={error ? "alert-card critical" : "alert-card success"}>
          <strong>{error ? "Action needed" : "Updated"}</strong>
          <p>{error || notice}</p>
        </SurfaceCard>
      )}

      {showCreateForm && (
        <SurfaceCard className="section-panel">
          <div className="section-title-row">
            <Sparkles size={20} />
            <div>
              <h3>Create freelancer work</h3>
              <p className="muted-copy">Give editors the exact brief, tags, sample links, price, and deadline before they apply.</p>
            </div>
          </div>
          <form className="freelancer-form-grid" onSubmit={submitWorkPost}>
            <label className="freelancer-field wide">
              Project title
              <input
                minLength={4}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Wedding teaser edit for Jaipur ceremony"
                required
                value={form.title}
              />
            </label>
            <label className="freelancer-field">
              Category / service
              <input
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Short-form editing"
                required
                value={form.category}
              />
            </label>
            <label className="freelancer-field">
              Budget / project pricing
              <input
                min={1}
                onChange={(event) => setForm((current) => ({ ...current, budgetAmount: event.target.value }))}
                placeholder="12000"
                required
                type="number"
                value={form.budgetAmount}
              />
            </label>
            <label className="freelancer-field">
              Project deadline
              <input
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
                type="date"
                value={form.deadline}
              />
            </label>
            <label className="freelancer-field">
              Application deadline
              <input
                onChange={(event) => setForm((current) => ({ ...current, applicationDeadline: event.target.value }))}
                type="date"
                value={form.applicationDeadline}
              />
            </label>
            <label className="freelancer-field">
              Visibility
              <select
                onChange={(event) =>
                  setForm((current) => ({ ...current, visibility: event.target.value as CreateWorkForm["visibility"] }))
                }
                value={form.visibility}
              >
                <option value="PUBLIC">Public marketplace</option>
                <option value="AGENCY_TEAM">Agency team only</option>
                <option value="INVITED_ONLY">Invited freelancers only</option>
              </select>
            </label>
            <label className="freelancer-field">
              Urgency
              <select
                onChange={(event) =>
                  setForm((current) => ({ ...current, priority: event.target.value as CreateWorkForm["priority"] }))
                }
                value={form.priority}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="freelancer-field">
              Project scope
              <input
                onChange={(event) => setForm((current) => ({ ...current, projectScope: event.target.value }))}
                placeholder="Video edit, thumbnail, captions"
                value={form.projectScope}
              />
            </label>
            <label className="freelancer-field wide">
              Required skills / matching tags
              <input
                onChange={(event) => setForm((current) => ({ ...current, requiredSkills: event.target.value }))}
                placeholder="Wedding teaser, reels, cinematic edit"
                required
                value={form.requiredSkills}
              />
            </label>
            <label className="freelancer-field wide">
              Production tags
              <input
                onChange={(event) => setForm((current) => ({ ...current, productionTags: event.target.value }))}
                placeholder="Color grading, Sound design, Motion graphics"
                value={form.productionTags}
              />
            </label>
            <label className="freelancer-field wide">
              Sample / reference link
              <input
                onChange={(event) => setForm((current) => ({ ...current, sampleLink: event.target.value }))}
                placeholder="https://drive.google.com/..."
                value={form.sampleLink}
              />
            </label>
            <label className="freelancer-field wide">
              Video description / creative brief
              <textarea
                minLength={20}
                onChange={(event) => setForm((current) => ({ ...current, brief: event.target.value }))}
                placeholder="Explain story, references, deliverables, format, duration, tone, audio needs, grading style, motion graphics, and revision expectation."
                required
                rows={5}
                value={form.brief}
              />
            </label>
            <div className="form-footer wide">
              <StatusPill>{form.priority.toLowerCase()}</StatusPill>
              <button className="gx-button gx-button-primary" disabled={isCreating} type="submit">
                {isCreating ? "Publishing..." : "Publish work"}
              </button>
            </div>
          </form>
        </SurfaceCard>
      )}

      <section className="metric-strip">
        <SurfaceCard>
          <div className="mini-metric">
            <BriefcaseBusiness size={18} />
            <span>Open work</span>
            <strong>{activeTasks.length}</strong>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="mini-metric">
            <UserCheck size={18} />
            <span>Applicants</span>
            <strong>{karmaSignals.total}</strong>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="mini-metric">
            <BadgeCheck size={18} />
            <span>Selected</span>
            <strong>{karmaSignals.accepted}</strong>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <div className="mini-metric">
            <Clock3 size={18} />
            <span>Avg review</span>
            <strong>{karmaSignals.averageReviewHours}h</strong>
          </div>
        </SurfaceCard>
      </section>

      {activeTab === "active" && (
        <section id="active-work">
          <SurfaceCard className="section-panel work-hub-panel">
            <div className="section-title-row">
              <Tags size={20} />
              <div>
                <h3>Active Work</h3>
                <p className="muted-copy">Published projects and agency-team work available for freelancer applications.</p>
              </div>
            </div>
            {activeTasks.length ? (
              <div className="work-hub-card-grid">
                {activeTasks.map((task) => {
                  const metadata = metadataRecord(task.metadata);
                  const productionTags = Array.isArray(metadata.productionTags) ? metadata.productionTags.map(String) : [];
                  const applicationCount = applicationsByTask.get(task.id)?.length || 0;
                  const priority = String(metadata.priority ?? "NORMAL");

                  return (
                    <article className="work-hub-project-card" key={task.id}>
                      <div className="work-hub-project-main">
                        <div className="work-hub-project-title-row">
                          <StatusPill>{task.status.replaceAll("_", " ")}</StatusPill>
                          {priority === "URGENT" || priority === "HIGH" ? <span className="work-hub-priority">{priority}</span> : null}
                        </div>
                        <h3>{task.title}</h3>
                        <p>{task.brief}</p>
                        <div className="meta-chip-row">
                          {[...task.requiredSkills, ...productionTags].slice(0, 7).map((tag) => (
                            <span className="meta-pill" key={`${task.id}-${tag}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="work-hub-project-side">
                        <strong>{formatCurrency(task.budgetAmount)}</strong>
                        <span>{formatDate(task.deadline)}</span>
                        <span>{applicationCount} applicant{applicationCount === 1 ? "" : "s"}</span>
                        <small>{task.visibility.replaceAll("_", " ")}</small>
                        <button
                          className="work-hub-delete-btn"
                          disabled={deletingTaskId === task.id}
                          onClick={() => void deleteTask(task.id, task.title)}
                          title="Delete this work post"
                          type="button"
                        >
                          <Trash2 size={13} />
                          <span>{deletingTaskId === task.id ? "Deleting..." : "Delete"}</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="work-hub-empty">
                <BriefcaseBusiness size={22} />
                <strong>{isLoading ? "Loading work..." : "No active work yet"}</strong>
                <p>Create one freelancer-ready project and it will appear in the freelancer Apply for Work marketplace immediately.</p>
              </div>
            )}
          </SurfaceCard>
        </section>
      )}

      {activeTab === "applications" && (
      <section id="applications">
        <SurfaceCard className="section-panel">
          <div className="section-title-row">
            <UserCheck size={20} />
            <div>
              <h3>Applications</h3>
              <p className="muted-copy">Shortlist, reject, or select freelancers. Selecting creates assignment history automatically.</p>
            </div>
          </div>
          <SimpleDataTable
            className="work-hub-applications-table-shell"
            columns={[
              { key: "freelancer", header: "Freelancer", render: (row) => row.freelancer },
              { key: "project", header: "Project", render: (row) => row.project },
              { key: "quote", header: "Quote", render: (row) => row.quote },
              { key: "turnaround", header: "Turnaround", render: (row) => row.turnaround },
              { key: "karma", header: "Karma signal", render: (row) => row.karma },
              { key: "status", header: "Status", render: (row) => row.status },
              { key: "action", header: "Action", render: (row) => row.action },
            ]}
            emptyLabel={isLoading ? "Loading applications..." : "No freelancer applications yet."}
            getRowKey={(row) => row.id}
            rows={applicationRows}
          />
        </SurfaceCard>
      </section>
      )}

      {(activeTab === "delivery" || activeTab === "payments") && (
      <section className="two-column-grid" id="payment-requests">
        <SurfaceCard className="section-panel">
          <div className="section-title-row">
            <Sparkles size={20} />
            <div>
              <h3>Karma AI work intelligence</h3>
              <p className="muted-copy">
                Tracks selection ratio, shortlist behavior, rejection signals, and response timing for every editor who applies.
              </p>
            </div>
          </div>
          <div className="insight-list">
            <span>
              Selection rate <strong>{karmaSignals.selectionRate}%</strong>
            </span>
            <span>
              Shortlisted <strong>{karmaSignals.shortlisted}</strong>
            </span>
            <span>
              Rejected <strong>{karmaSignals.rejected}</strong>
            </span>
          </div>
        </SurfaceCard>
        <SurfaceCard className="section-panel">
          <div className="section-title-row">
            <AlertTriangle size={20} />
            <div>
              <h3>Payment loop</h3>
              <p className="muted-copy">
                After delivery completion, freelancer payment requests should appear in Payout Requests.
              </p>
            </div>
          </div>
          <a className="gx-button gx-button-secondary" href="/admin/payout-requests">
            Open payout requests
          </a>
        </SurfaceCard>
      </section>
      )}

      {tasks.some((task) => task.referenceLinks.length > 0) && (
        <SurfaceCard className="section-panel">
          <div className="section-title-row">
            <LinkIcon size={20} />
            <div>
              <h3>Reference links attached</h3>
              <p className="muted-copy">Samples are stored with the work post so freelancers can apply with better context.</p>
            </div>
          </div>
        </SurfaceCard>
      )}

      {selectedApplication && (
        <div
          aria-labelledby="freelancer-modal-title"
          aria-modal="true"
          className="work-hub-modal-shell"
          role="dialog"
        >
          <div className="work-hub-modal-backdrop" onClick={closeFreelancerProfile} />
          <aside className="work-hub-modal-card">
            <header className="work-hub-modal-header">
              <div className="work-hub-modal-profile-header">
                <div className="work-hub-modal-avatar">
                  {editorProfile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={selectedApplication.freelancerName}
                      className="work-hub-modal-avatar-img"
                      src={editorProfile.avatarUrl}
                    />
                  ) : (
                    <span>
                      {selectedApplication.freelancerName
                        .split(" ")
                        .map((p) => p[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "FL"}
                    </span>
                  )}
                </div>
                <div className="work-hub-modal-title-wrap">
                  <div className="work-hub-modal-name-row">
                    <h2 className="work-hub-modal-name" id="freelancer-modal-title">
                      {selectedApplication.freelancerName}
                    </h2>
                    <span className="work-hub-verification-badge">
                      <BadgeCheck size={14} />
                      <span>Verified Editor</span>
                    </span>
                    <span className="work-hub-trust-badge">
                      <ShieldCheck size={14} />
                      <span>Trust {editorProfile?.trustScore ?? 88}/100</span>
                    </span>
                  </div>
                  <p className="work-hub-modal-headline">
                    {editorProfile?.title || "Video Editor & Post-Production Specialist"}
                  </p>
                  {editorProfile?.category && (
                    <span className="work-hub-category-pill">{editorProfile.category}</span>
                  )}
                </div>
              </div>
              <button
                aria-label="Close modal"
                className="work-hub-modal-close-btn"
                onClick={closeFreelancerProfile}
                type="button"
              >
                <X size={18} />
              </button>
            </header>

            <div className="work-hub-modal-body">
              {modalActionError && (
                <div className="work-hub-modal-alert work-hub-modal-alert-error" role="alert">
                  <AlertTriangle size={15} />
                  <span>{modalActionError}</span>
                </div>
              )}
              {modalActionNotice && (
                <div className="work-hub-modal-alert work-hub-modal-alert-success" role="status">
                  <Check size={15} />
                  <span>{modalActionNotice}</span>
                </div>
              )}

              {isLoadingProfile && (
                <div className="work-hub-modal-loading">
                  <div className="work-hub-spinner" />
                  <span>Loading editor directory profile & portfolio...</span>
                </div>
              )}

              {profileNotice && (
                <div className="work-hub-modal-notice">
                  <span>{profileNotice}</span>
                </div>
              )}

              <section className="work-hub-modal-section">
                <h3 className="work-hub-modal-section-title">
                  <BriefcaseBusiness size={16} />
                  <span>Application Pitch & Proposal</span>
                </h3>
                <div className="work-hub-proposal-box">
                  <p className="work-hub-pitch-text">{selectedApplication.proposal}</p>
                  <div className="work-hub-pitch-meta-row">
                    <div className="work-hub-pitch-meta-item">
                      <span className="meta-label">Quoted Fee</span>
                      <strong className="meta-value text-emerald">
                        {formatCurrency(selectedApplication.quotedAmount)}
                      </strong>
                    </div>
                    <div className="work-hub-pitch-meta-item">
                      <span className="meta-label">Est. Turnaround</span>
                      <strong className="meta-value text-sky">
                        {selectedApplication.estimatedTurnaround || "Flexible"}
                      </strong>
                    </div>
                    <div className="work-hub-pitch-meta-item">
                      <span className="meta-label">Applied Project</span>
                      <span className="meta-value">
                        {taskById.get(selectedApplication.taskId)?.title || "Work Post"}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="work-hub-modal-section">
                <div className="work-hub-modal-section-header">
                  <h3 className="work-hub-modal-section-title">
                    <LinkIcon size={16} />
                    <span>Work & Portfolio Samples</span>
                  </h3>
                  <span className="work-hub-count-pill">{combinedPortfolioLinks.length} Links</span>
                </div>

                {portfolioNotes.length > 0 && (
                  <div className="work-hub-portfolio-notes">
                    <span className="notes-label">Submission Reference Note:</span>
                    <p>{portfolioNotes.join(" ")}</p>
                  </div>
                )}

                {combinedPortfolioLinks.length > 0 ? (
                  <div className="work-hub-portfolio-grid">
                    {combinedPortfolioLinks.map((url, idx) => {
                      const meta = getPortfolioMeta(url, idx);

                      return (
                        <div className="work-hub-portfolio-item-wrap" key={`${url}-${idx}`}>
                          <a
                            className="work-hub-portfolio-card"
                            href={url}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <div className="work-hub-portfolio-icon">
                              <ExternalLink size={15} />
                            </div>
                            <div className="work-hub-portfolio-info">
                              <strong className="work-hub-portfolio-host">{meta.label}</strong>
                              <span className="work-hub-portfolio-url">{url}</span>
                            </div>
                            <span className="work-hub-portfolio-btn">
                              Open <ExternalLink size={12} />
                            </span>
                          </a>
                          {meta.isDirectVideo && (
                            <div className="work-hub-video-container">
                              <video
                                className="work-hub-video-preview"
                                controls
                                preload="metadata"
                                src={url}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="work-hub-empty-portfolio">
                    <p>No external portfolio links provided in this submission.</p>
                  </div>
                )}
              </section>

              {(editorProfile?.bio || (!isLoadingProfile && !editorProfile)) && (
                <section className="work-hub-modal-section">
                  <h3 className="work-hub-modal-section-title">
                    <Sparkles size={16} />
                    <span>About & Experience</span>
                  </h3>
                  <p className="work-hub-bio-text">
                    {editorProfile?.bio ||
                      "Experienced Video Editor specializing in high-retention Reels, Shorts, YouTube edits, and Color Grading."}
                  </p>
                </section>
              )}

              <section className="work-hub-modal-section">
                <h3 className="work-hub-modal-section-title">
                  <Tags size={16} />
                  <span>Skills & Software</span>
                </h3>
                <div className="work-hub-skills-wrap">
                  {skillsList.map((skill) => (
                    <span className="work-hub-skill-pill" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              {servicesList.length > 0 && (
                <section className="work-hub-modal-section">
                  <h3 className="work-hub-modal-section-title">
                    <IndianRupee size={16} />
                    <span>Published Services & Standard Rates</span>
                  </h3>
                  <div className="work-hub-services-grid">
                    {servicesList.map((service) => (
                      <div className="work-hub-service-card" key={service.id}>
                        <div className="work-hub-service-head">
                          <strong className="work-hub-service-title">{service.title}</strong>
                          <span className="work-hub-service-price">
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                        <div className="work-hub-service-meta">
                          {service.deliveryTime && (
                            <span className="work-hub-service-time">
                              <Clock3 size={12} /> {service.deliveryTime}
                            </span>
                          )}
                          {service.category && (
                            <span className="work-hub-service-cat">{service.category}</span>
                          )}
                        </div>
                        {service.portfolioUrl && (
                          <a
                            className="work-hub-service-link"
                            href={normalizeUrlCandidate(service.portfolioUrl) || service.portfolioUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <span>Sample work</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <footer className="work-hub-modal-footer">
              <div className="work-hub-modal-footer-status">
                <span className="footer-label">Status:</span>
                <span className={`work-hub-status-badge status-${selectedApplication.status.toLowerCase()}`}>
                  {selectedApplication.status.replaceAll("_", " ")}
                </span>
              </div>
              <div className="work-hub-modal-footer-actions">
                <button
                  className="work-hub-btn work-hub-btn-reject"
                  disabled={reviewingId === selectedApplication.id || selectedApplication.status === "REJECTED"}
                  onClick={() => void handleModalReview("REJECT")}
                  type="button"
                >
                  <X size={14} />
                  <span>{reviewingId === selectedApplication.id ? "Updating..." : "Reject"}</span>
                </button>
                <button
                  className="work-hub-btn work-hub-btn-shortlist"
                  disabled={
                    reviewingId === selectedApplication.id ||
                    selectedApplication.status === "SHORTLISTED" ||
                    selectedApplication.status === "ACCEPTED"
                  }
                  onClick={() => void handleModalReview("SHORTLIST")}
                  type="button"
                >
                  <Star size={14} />
                  <span>{reviewingId === selectedApplication.id ? "Updating..." : "Shortlist"}</span>
                </button>
                <button
                  className="work-hub-btn work-hub-btn-select"
                  disabled={reviewingId === selectedApplication.id || selectedApplication.status === "ACCEPTED"}
                  onClick={() => void handleModalReview("ACCEPT")}
                  type="button"
                >
                  <Check size={14} />
                  <span>{reviewingId === selectedApplication.id ? "Selecting..." : "Select Freelancer"}</span>
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
