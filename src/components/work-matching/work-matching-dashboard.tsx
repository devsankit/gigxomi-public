"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Film,
  Filter,
  Flame,
  LinkIcon,
  MapPin,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

import type { AgencyListingProfile } from "@/lib/gigxomi/agency-listing-types";
import styles from "./work-matching-dashboard.module.css";

type WorkSource = "tasks" | "work-posts";

type EditorMatch = {
  bio: string;
  category: string;
  editorId: string;
  experienceLevel: string;
  matchPercentage: number;
  matchedReasons: string[];
  matchedSkills: string[];
  matchedTags: string[];
  name: string;
  phoneMasked: string;
  portfolioLinks: string[];
  serviceCount: number;
  services: Array<{
    basePrice: number;
    category: string;
    id: string;
    slug: string;
    specialty: string;
    status: string;
    tags: string[];
    title: string;
  }>;
  skills: string[];
};

type WorkApplication = {
  agencyId?: string;
  applicationId: string;
  availability: string;
  createdAt: string;
  editor?: EditorMatch;
  editorId: string;
  expectedDelivery: string;
  expectedPayout: number | null;
  portfolioLinks: string[];
  proposalMessage: string;
  status: string;
  source: WorkSource;
  tenantId?: string;
  workPostId: string;
};

type WorkInvite = {
  agencyId?: string;
  editor?: EditorMatch;
  editorId: string;
  expiresAt: string | null;
  inviteId: string;
  message: string;
  status: string;
  tenantId?: string;
  workPostId: string;
};

type WorkPost = {
  agencyId?: string;
  agencyName: string;
  applications?: WorkApplication[];
  attachmentLinks: string[];
  budgetMax: number | null;
  budgetMin: number | null;
  category: string;
  createdAt?: string;
  deadline: string | null;
  description: string;
  editorsNeeded: number;
  experienceLevel: string;
  expectedOutput: string;
  id: string;
  invites?: WorkInvite[];
  match?: {
    matchPercentage: number;
    matchedReasons: string[];
    matchedSkills: string[];
    matchedTags: string[];
  };
  niche: string;
  recommendedEditors?: EditorMatch[];
  sampleLink: string | null;
  skills: string[];
  status: string;
  source: WorkSource;
  tags: string[];
  tenantId?: string;
  title: string;
  updatedAt?: string;
  visibility: string;
  workType: string;
};

type AgencyPayload = {
  connections: Array<{ connectionId: string; editor?: EditorMatch; editorId: string; status: string; workPost?: WorkPost; workPostId: string }>;
  mode: "agency";
  ok: boolean;
  totals: Record<string, number>;
  workPosts: WorkPost[];
};

type EditorPayload = {
  applications: WorkApplication[];
  connections: Array<{ connectionId: string; status: string; workPost?: WorkPost; workPostId: string }>;
  invites: WorkInvite[];
  matchedWork: WorkPost[];
  mode: "editor";
  ok: boolean;
  totals: Record<string, number>;
};

type WorkPayload = AgencyPayload | EditorPayload;

type TaskRecord = {
  agencyUserId?: string;
  agencyName: string;
  applicationDeadline: string | null;
  assignedFreelancerId?: string | null;
  budgetAmount: number;
  brief: string;
  category: string;
  createdAt: string;
  deadline: string | null;
  id: string;
  metadata?: Record<string, unknown> | null;
  referenceLinks: string[];
  requiredSkills: string[];
  status: string;
  tenantId: string;
  title: string;
  updatedAt: string;
  visibility: string;
};

type TaskApplicationRecord = {
  createdAt: string;
  estimatedTurnaround: string;
  freelancerId: string;
  id: string;
  portfolioReference: string;
  proposal: string;
  quotedAmount: number;
  status: string;
  taskId: string;
  tenantId: string;
};

type RealtimePayload = {
  body?: string;
  createdAt?: string;
  title?: string;
  type?: string;
};

const defaultCreateForm = {
  attachmentLinks: "",
  budgetMax: "",
  budgetMin: "",
  category: "",
  deadline: "",
  description: "",
  editorsNeeded: "1",
  experienceLevel: "INTERMEDIATE",
  expectedOutput: "",
  niche: "",
  sampleLink: "",
  skills: "",
  tags: "",
  title: "",
  visibility: "PUBLIC_MATCHED",
  workType: "ONE_TIME",
};

const defaultApplyForm = {
  availability: "",
  expectedDelivery: "",
  expectedPayout: "",
  portfolioLinks: "",
  proposalMessage: "",
};

const SAVED_WORK_STORAGE_KEY = "gigxomi:saved-work-posts";

const editorFilterChips = [
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

function formatDate(value: string | null) {
  if (!value) return "Flexible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Flexible";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function formatMoney(min: number | null, max: number | null) {
  if (!min && !max) return "Budget open";
  if (min && max) return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`;
  return `₹${(min ?? max ?? 0).toLocaleString("en-IN")}`;
}

function labelize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function postSearchText(post: WorkPost) {
  return normalizeText([post.title, post.agencyName, post.category, post.niche, post.description, post.expectedOutput, post.workType, post.visibility, ...post.skills, ...post.tags].join(" "));
}

function daysUntil(value: string | null) {
  if (!value) return null;
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return null;
  return Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
}

function postedTime(value?: string) {
  if (!value) return "Recently posted";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently posted";
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function deliveryLabel(post: WorkPost) {
  const days = daysUntil(post.deadline);
  if (days === null) return "Flexible";
  if (days <= 0) return "Today";
  if (days === 1) return "1 Day";
  return `${days} Days`;
}

function durationLabel(post: WorkPost) {
  const days = daysUntil(post.deadline);
  if (days === null) return labelize(post.workType);
  if (days <= 0) return "Due today";
  if (days === 1) return "1 day window";
  return `${days} day window`;
}

function isUrgent(post: WorkPost) {
  const days = daysUntil(post.deadline);
  return post.workType === "URGENT" || (days !== null && days <= 3);
}

function isHighBudget(post: WorkPost) {
  return (post.budgetMax ?? post.budgetMin ?? 0) >= 10_000;
}

function isNewPost(post: WorkPost) {
  if (!post.createdAt) return true;
  const createdAt = new Date(post.createdAt);
  return !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() < 7 * 86_400_000;
}

function matchesEditorChip(post: WorkPost, filter: string) {
  if (filter === "ALL") return true;
  if (filter === "Urgent") return isUrgent(post);
  if (filter === "High Budget") return isHighBudget(post);
  if (filter === "Remote") return post.visibility === "PUBLIC_MATCHED" || postSearchText(post).includes("remote");
  if (filter === "New") return isNewPost(post);

  const terms = normalizeText(filter)
    .split(" ")
    .filter((term) => term && term !== "editing" && term !== "form");
  const text = postSearchText(post);
  return terms.some((term) => text.includes(term));
}

function chipList(items: string[], limit = 6) {
  return items.slice(0, limit).map((item) => (
    <span className={styles.chip} key={item}>
      {item}
    </span>
  ));
}

function briefLinks(post: WorkPost) {
  return Array.from(
    new Set(
      [post.sampleLink, ...post.attachmentLinks]
        .filter((link): link is string => Boolean(link))
        .map((link) => {
          if (link.startsWith("/services/")) return link;
          try {
            const url = new URL(link);
            return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
          } catch {
            return null;
          }
        })
        .filter((link): link is string => Boolean(link)),
    ),
  ).slice(0, 5);
}

function projectBadges(post: WorkPost) {
  const badges: Array<{ icon: typeof Flame; label: string }> = [];
  if (isUrgent(post)) badges.push({ icon: Flame, label: "Urgent" });
  if (isHighBudget(post)) badges.push({ icon: Sparkles, label: "High Value" });
  if (post.workType === "RECURRING" || post.workType === "MONTHLY") badges.push({ icon: BadgeCheck, label: "Repeat Client" });
  return badges.length ? badges : [{ icon: Film, label: labelize(post.workType) }];
}

function agencyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function mapTaskToPost(task: TaskRecord, applications: TaskApplicationRecord[]): WorkPost {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>;
  const relatedApplications = applications.filter((application) => application.taskId === task.id);

  return {
    id: task.id,
    agencyId: task.agencyUserId,
    agencyName: task.agencyName,
    attachmentLinks: task.referenceLinks ?? [],
    budgetMax: task.budgetAmount || null,
    budgetMin: task.budgetAmount || null,
    category: task.category || "Editing",
    createdAt: task.createdAt,
    deadline: task.deadline,
    description: typeof metadata.projectScope === "string" && metadata.projectScope.trim() ? metadata.projectScope : task.brief || "Project brief available in expanded view.",
    editorsNeeded: 1,
    experienceLevel: "INTERMEDIATE",
    expectedOutput: typeof metadata.expectedOutput === "string" ? metadata.expectedOutput : "",
    niche: typeof metadata.workType === "string" ? metadata.workType : "Creative",
    sampleLink: typeof metadata.sampleLink === "string" && metadata.sampleLink.trim() ? metadata.sampleLink : null,
    skills: task.requiredSkills ?? [],
    source: "tasks",
    status: task.status,
    tags: Array.isArray(metadata.productionTags) ? metadata.productionTags.map((tag) => String(tag)) : [],
    tenantId: task.tenantId,
    title: task.title,
    updatedAt: task.updatedAt,
    visibility: task.visibility,
    workType: typeof metadata.workType === "string" ? metadata.workType : "ONE_TIME",
    applications: relatedApplications.map((application) => ({
      agencyId: task.agencyUserId,
      applicationId: application.id,
      availability: "Available",
      createdAt: application.createdAt,
      editorId: application.freelancerId,
      expectedDelivery: application.estimatedTurnaround,
      expectedPayout: application.quotedAmount,
      portfolioLinks: application.portfolioReference && !application.portfolioReference.toLowerCase().includes("no published service") ? [application.portfolioReference] : [],
      proposalMessage: application.proposal,
      status: application.status === "APPLIED" ? "PENDING" : application.status,
      source: "tasks",
      tenantId: task.tenantId,
      workPostId: application.taskId,
    })),
    match: {
      matchPercentage: 84,
      matchedReasons: ["Skill tag overlap", "Delivery fit"],
      matchedSkills: task.requiredSkills.slice(0, 3),
      matchedTags: Array.isArray(metadata.productionTags) ? metadata.productionTags.map((tag) => String(tag)).slice(0, 2) : [],
    },
  };
}

function mapTasksPayloadToEditorPayload(input: { applications?: TaskApplicationRecord[]; tasks?: TaskRecord[] }): EditorPayload {
  const tasks = input.tasks ?? [];
  const applications = input.applications ?? [];
  const mappedPosts = tasks.map((task) => mapTaskToPost(task, applications));
  const availableTaskIds = new Set(
    tasks
      .filter((task) => task.status === "OPEN" && (!task.applicationDeadline || new Date(task.applicationDeadline).getTime() > Date.now()))
      .map((task) => task.id),
  );
  const mappedApplications: WorkApplication[] = applications.map((application) => ({
    agencyId: tasks.find((task) => task.id === application.taskId)?.agencyUserId,
    applicationId: application.id,
    availability: "Available",
    createdAt: application.createdAt,
    editorId: application.freelancerId,
    expectedDelivery: application.estimatedTurnaround,
    expectedPayout: application.quotedAmount,
    portfolioLinks: application.portfolioReference && !application.portfolioReference.toLowerCase().includes("no published service") ? [application.portfolioReference] : [],
    proposalMessage: application.proposal,
    status: application.status === "APPLIED" ? "PENDING" : application.status,
    source: "tasks",
    tenantId: application.tenantId,
    workPostId: application.taskId,
  }));

  const acceptedTaskIds = new Set(mappedApplications.filter((application) => application.status === "ACCEPTED").map((application) => application.workPostId));
  const assignments = mappedPosts
    .filter((post) => acceptedTaskIds.has(post.id) || post.status === "ASSIGNED")
    .map((post) => ({
      connectionId: `assignment:${post.id}`,
      status: post.status === "ASSIGNED" ? "ACTIVE" : "PENDING",
      workPost: post,
      workPostId: post.id,
    }));

  return {
    ok: true,
    mode: "editor",
    matchedWork: mappedPosts.filter((post) => availableTaskIds.has(post.id)),
    applications: mappedApplications,
    invites: [],
    connections: assignments,
    totals: {
      availableWork: availableTaskIds.size,
      invites: 0,
      pendingApplications: mappedApplications.filter((application) => application.status === "APPLIED" || application.status === "SHORTLISTED").length,
    },
  };
}

function normalizeWorkPostsEditorPayload(payload: EditorPayload): EditorPayload {
  return {
    ...payload,
    matchedWork: payload.matchedWork.map((post) => ({ ...post, source: "work-posts" })),
    applications: payload.applications.map((application) => ({ ...application, source: "work-posts" })),
    connections: payload.connections.map((connection) => ({
      ...connection,
      workPost: connection.workPost ? { ...connection.workPost, source: "work-posts" } : undefined,
    })),
  };
}

function mergeEditorPayloads(primary: EditorPayload | null, legacy: EditorPayload | null): EditorPayload {
  const matchedWork = Array.from(
    new Map([...(primary?.matchedWork ?? []), ...(legacy?.matchedWork ?? [])].map((post) => [post.id, post])).values(),
  );
  const applications = Array.from(
    new Map([...(primary?.applications ?? []), ...(legacy?.applications ?? [])].map((application) => [application.applicationId, application])).values(),
  );
  const invites = Array.from(new Map([...(primary?.invites ?? []), ...(legacy?.invites ?? [])].map((invite) => [invite.inviteId, invite])).values());
  const connections = Array.from(
    new Map([...(primary?.connections ?? []), ...(legacy?.connections ?? [])].map((connection) => [connection.connectionId, connection])).values(),
  );

  return {
    ok: true,
    mode: "editor",
    matchedWork,
    applications,
    invites,
    connections,
    totals: {
      activeConnections: connections.filter((connection) => connection.status === "ACTIVE").length,
      availableWork: matchedWork.length,
      invites: invites.filter((invite) => invite.status === "INVITED").length,
      pendingApplications: applications.filter((application) => application.status === "PENDING" || application.status === "SHORTLISTED").length,
    },
  };
}

async function loadEditorPayload() {
  const [workPostsResponse, tasksResponse] = await Promise.all([
    fetch("/api/work-posts", { cache: "no-store" }),
    fetch("/api/tasks", { cache: "no-store" }),
  ]);
  const [workPostsBody, tasksBody] = await Promise.all([
    workPostsResponse.json().catch(() => null),
    tasksResponse.json().catch(() => null),
  ]);

  const primary = workPostsResponse.ok && workPostsBody?.mode === "editor" ? normalizeWorkPostsEditorPayload(workPostsBody as EditorPayload) : null;
  const legacy = tasksResponse.ok ? mapTasksPayloadToEditorPayload(tasksBody as { applications?: TaskApplicationRecord[]; tasks?: TaskRecord[] }) : null;

  if (!primary && !legacy) {
    throw new Error(workPostsBody?.error ?? tasksBody?.error ?? "Work matching could not load.");
  }

  return mergeEditorPayloads(primary, legacy);
}

type AgencyDecisionStats = {
  approved: number;
  openProjects: number;
  pending: number;
  projectRequests: number;
  rejected: number;
  totalProjects: number;
};

function postBelongsToAgency(post: WorkPost, agency: AgencyListingProfile) {
  return post.tenantId === agency.tenantId || normalizeText(post.agencyName) === normalizeText(agency.publicName);
}

function isOpenProject(post: WorkPost) {
  return post.status === "OPEN" && (!post.deadline || new Date(post.deadline).getTime() > Date.now());
}

function getAgencyDecisionStats(
  agency: AgencyListingProfile,
  posts: WorkPost[],
  applications: WorkApplication[],
  invites: WorkInvite[],
): AgencyDecisionStats {
  const agencyPosts = posts.filter((post) => postBelongsToAgency(post, agency));
  const agencyPostIds = new Set(agencyPosts.map((post) => post.id));
  const agencyApplications = applications.filter((application) => application.tenantId === agency.tenantId || agencyPostIds.has(application.workPostId));
  const agencyInvites = invites.filter((invite) => invite.tenantId === agency.tenantId || agencyPostIds.has(invite.workPostId));
  const relatedProjectIds = new Set([
    ...agencyPostIds,
    ...agencyApplications.map((application) => application.workPostId),
    ...agencyInvites.map((invite) => invite.workPostId),
  ]);
  const approvedIds = new Set([
    ...agencyApplications.filter((application) => application.status === "ACCEPTED").map((application) => application.workPostId),
    ...agencyInvites.filter((invite) => invite.status === "ACCEPTED").map((invite) => invite.workPostId),
  ]);
  const rejectedIds = new Set([
    ...agencyApplications.filter((application) => application.status === "REJECTED").map((application) => application.workPostId),
    ...agencyInvites.filter((invite) => invite.status === "REJECTED").map((invite) => invite.workPostId),
  ]);
  const pendingIds = new Set([
    ...agencyApplications
      .filter((application) => application.status === "PENDING" || application.status === "APPLIED" || application.status === "SHORTLISTED")
      .map((application) => application.workPostId),
    ...agencyInvites.filter((invite) => invite.status === "INVITED").map((invite) => invite.workPostId),
  ]);

  return {
    approved: approvedIds.size,
    openProjects: agencyPosts.filter(isOpenProject).length,
    pending: pendingIds.size,
    projectRequests: new Set(agencyInvites.map((invite) => invite.workPostId)).size,
    rejected: rejectedIds.size,
    totalProjects: relatedProjectIds.size,
  };
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }
  return payload;
}

export function WorkMatchingDashboard({
  agencies = [],
  initialAgencySlug,
  initialMode,
}: {
  agencies?: AgencyListingProfile[];
  initialAgencySlug?: string;
  initialMode?: "agency" | "editor";
}) {
  const [payload, setPayload] = useState<WorkPayload | null>(null);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [applyForm, setApplyForm] = useState(defaultApplyForm);
  const [activeApplyId, setActiveApplyId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [realtimeState, setRealtimeState] = useState<"connecting" | "live" | "offline">("connecting");
  const mode = payload?.mode ?? initialMode ?? "editor";

  const refresh = useCallback(async () => {
    if (mode === "editor") {
      setPayload(await loadEditorPayload());
      return;
    }

    const response = await fetch("/api/work-posts", { cache: "no-store" });
    setPayload((await readJson(response)) as WorkPayload);
  }, [mode]);

  useEffect(() => {
    let active = true;
    const request = mode === "editor"
      ? loadEditorPayload()
      : fetch("/api/work-posts", { cache: "no-store" }).then((response) => readJson(response) as Promise<WorkPayload>);
    request
      .then((nextPayload: WorkPayload) => {
        if (active) {
          setPayload(nextPayload);
        }
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Work matching could not load.");
      });

    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let disposed = false;

    const handleRealtimePayload = (event: RealtimePayload) => {
      if (disposed) return;
      setRealtimeState("live");
      if (event.type === "connected") return;
      setNotice(event.title ?? "Matched work updated.");
      void refresh().catch(() => setRealtimeState("offline"));
    };

    const configuredSocketUrl = process.env.NEXT_PUBLIC_GIGXOMI_WORK_REALTIME_WS_URL;
    if (configuredSocketUrl) {
      const socket = new WebSocket(configuredSocketUrl);
      socket.addEventListener("open", () => setRealtimeState("live"));
      socket.addEventListener("message", (event) => {
        try {
          handleRealtimePayload(JSON.parse(String(event.data)) as RealtimePayload);
        } catch {
          handleRealtimePayload({ title: "Matched work updated.", type: "work-alert" });
        }
      });
      socket.addEventListener("close", () => setRealtimeState("offline"));
      socket.addEventListener("error", () => setRealtimeState("offline"));
      return () => {
        disposed = true;
        socket.close();
      };
    }

    const source = new EventSource("/api/work-posts/realtime");
    source.addEventListener("open", () => setRealtimeState("live"));
    source.addEventListener("work-posts", (event) => {
      handleRealtimePayload(JSON.parse(event.data) as RealtimePayload);
    });
    source.addEventListener("error", () => setRealtimeState("offline"));

    return () => {
      disposed = true;
      source.close();
    };
  }, [refresh]);

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const posts = payload?.mode === "agency" ? payload.workPosts : payload?.mode === "editor" ? payload.matchedWork : [];
    return posts.filter((post) => {
      const matchesQuery =
        !query || [post.title, post.agencyName, post.category, post.niche, post.description, post.expectedOutput, ...post.skills, ...post.tags].join(" ").toLowerCase().includes(query);
      const matchesFilter =
        mode === "editor"
          ? matchesEditorChip(post, activeFilter)
          : activeFilter === "ALL" ||
            post.status === activeFilter ||
            post.workType === activeFilter ||
            post.experienceLevel === activeFilter ||
            (activeFilter === "HIGH_MATCH" && (post.match?.matchPercentage ?? 0) >= 70);
      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, mode, payload, search]);

  const submitCreate = async () => {
    setIsCreating(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/work-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      await readJson(response);
      setNotice("Work post created and matching editors were ranked.");
      setCreateForm(defaultCreateForm);
      setIsCreateOpen(false);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create work.");
    } finally {
      setIsCreating(false);
    }
  };

  const updateApplication = async (applicationId: string, status: string, source: WorkSource = "work-posts") => {
    setBusyKey(`${applicationId}:${status}`);
    setError(null);
    setNotice(null);
    try {
      if (mode === "editor") {
        const action =
          status === "WITHDRAWN"
            ? "WITHDRAW"
            : status === "SHORTLISTED"
              ? "SHORTLIST"
              : status === "ACCEPTED"
                ? "ACCEPT"
                : "REJECT";
        await readJson(
          await fetch(source === "tasks" ? `/api/task-applications/${applicationId}` : `/api/work-applications/${applicationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(source === "tasks" ? { action } : { status }),
          }),
        );
      } else {
        await readJson(
          await fetch(`/api/work-applications/${applicationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          }),
        );
      }
      setNotice(`Application marked ${labelize(status)}.`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update application.");
    } finally {
      setBusyKey(null);
    }
  };

  const submitApplication = async (post: WorkPost) => {
    if (applyForm.proposalMessage.trim().length < 10) {
      setError("Add a proposal of at least 10 characters before sending your application.");
      return;
    }
    if (!Number.isSafeInteger(Number(applyForm.expectedPayout)) || Number(applyForm.expectedPayout) <= 0) {
      setError("Enter an expected payout greater than zero in whole rupees.");
      return;
    }

    setBusyKey(`apply:${post.id}`);
    setError(null);
    setNotice(null);
    try {
      if (mode === "editor") {
        const isLegacyTask = post.source === "tasks";
        await readJson(
          await fetch(isLegacyTask ? `/api/tasks/${post.id}/applications` : `/api/work-posts/${post.id}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              isLegacyTask
                ? {
                    estimatedTurnaround: applyForm.expectedDelivery,
                    portfolioReference: applyForm.portfolioLinks,
                    proposal: applyForm.proposalMessage,
                    quotedAmount: Number(applyForm.expectedPayout || 0),
                  }
                : applyForm,
            ),
          }),
        );
      } else {
        await readJson(
          await fetch(`/api/work-posts/${post.id}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(applyForm),
          }),
        );
      }
      setNotice("Application sent to the agency.");
      setActiveApplyId(null);
      setApplyForm(defaultApplyForm);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send application.");
    } finally {
      setBusyKey(null);
    }
  };

  const inviteEditor = async (workPostId: string, editorId: string) => {
    setBusyKey(`invite:${workPostId}:${editorId}`);
    setError(null);
    setNotice(null);
    try {
      await readJson(
        await fetch(`/api/work-posts/${workPostId}/invites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editorId }),
        }),
      );
      setNotice("Editor invite sent.");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to invite editor.");
    } finally {
      setBusyKey(null);
    }
  };

  const updateInvite = async (inviteId: string, status: string) => {
    setBusyKey(`${inviteId}:${status}`);
    setError(null);
    setNotice(null);
    try {
      await readJson(
        await fetch(`/api/work-invites/${inviteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }),
      );
      setNotice(`Invite marked ${labelize(status)}.`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update invite.");
    } finally {
      setBusyKey(null);
    }
  };

  if (mode === "editor") {
    const editorPayload = payload?.mode === "editor" ? payload : null;
    const allEditorPosts = Array.from(
      new Map(
        [
          ...(editorPayload?.matchedWork ?? []),
          ...(editorPayload?.connections ?? []).flatMap((connection) => (connection.workPost ? [connection.workPost] : [])),
        ].map((post) => [post.id, post]),
      ).values(),
    );
    const activeAgency = initialAgencySlug ? agencies.find((agency) => agency.slug === initialAgencySlug || agency.tenantId === initialAgencySlug) ?? null : null;
    const visibleAgencyPosts = activeAgency ? filteredPosts.filter((post) => postBelongsToAgency(post, activeAgency)) : filteredPosts;
    const visibleAgencyInvites = activeAgency
      ? (editorPayload?.invites ?? []).filter(
          (invite) => invite.tenantId === activeAgency.tenantId || allEditorPosts.some((post) => post.id === invite.workPostId && postBelongsToAgency(post, activeAgency)),
        )
      : editorPayload?.invites ?? [];
    const visibleAgencyConnections = activeAgency
      ? (editorPayload?.connections ?? []).filter((connection) => connection.workPost && postBelongsToAgency(connection.workPost, activeAgency))
      : editorPayload?.connections ?? [];

    return (
      <div className={`${styles.shell} ${styles.editorShell}`}>
        <EditorTopHeader
          activeFilter={activeFilter}
          realtimeState={realtimeState}
          search={search}
          setActiveFilter={setActiveFilter}
          setSearch={setSearch}
          totals={editorPayload?.totals ?? { availableWork: filteredPosts.length, invites: 0, pendingApplications: 0 }}
        />

        <AnimatePresence initial={false}>
          {notice ? (
            <motion.p animate={{ opacity: 1, y: 0 }} className={styles.notice} exit={{ opacity: 0, y: -6 }} initial={{ opacity: 0, y: -6 }}>
              {notice}
            </motion.p>
          ) : null}
          {error ? (
            <motion.p animate={{ opacity: 1, y: 0 }} className={styles.error} exit={{ opacity: 0, y: -6 }} initial={{ opacity: 0, y: -6 }}>
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {activeAgency ? (
          <AgencyDetail
            agency={activeAgency}
            applications={editorPayload?.applications ?? []}
            invites={editorPayload?.invites ?? []}
            posts={allEditorPosts}
          />
        ) : (
          <AgencyDirectory
            agencies={agencies}
            applications={editorPayload?.applications ?? []}
            invites={editorPayload?.invites ?? []}
            isLoading={!payload && !error}
            posts={allEditorPosts}
          />
        )}

        <div className={styles.projectSectionHead} id="agency-open-projects">
          <div>
            <span className={styles.eyebrow}>{activeAgency ? `${activeAgency.publicName} opportunities` : "Matched opportunities"}</span>
            <h2>{activeAgency ? "Open projects from this agency" : "Latest projects you can apply for"}</h2>
          </div>
          <span>{visibleAgencyPosts.length} open</span>
        </div>

        <EditorWorkView
          activeApplyId={activeApplyId}
          applications={editorPayload?.applications ?? []}
          applyForm={applyForm}
          busyKey={busyKey}
          connections={visibleAgencyConnections}
          invites={visibleAgencyInvites}
          isLoading={!payload && !error}
          posts={visibleAgencyPosts}
          setActiveApplyId={setActiveApplyId}
          setApplyForm={setApplyForm}
          submitApplication={submitApplication}
          updateApplication={updateApplication}
          updateInvite={updateInvite}
        />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Agency to editor matching</p>
          <h2>Post work and invite the right editors.</h2>
          <p>Gigxomi ranks work and editors using niche, skills, service signals, profile availability, language, speed, and experience.</p>
        </div>
        <div className={styles.metrics}>
          {Object.entries(payload?.totals ?? { loading: 0 }).map(([key, value]) => (
            <div className={styles.metric} key={key}>
              <span className={styles.label}>{labelize(key)}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      {notice ? <p className={styles.notice}>{notice}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.toolbar}>
        <div className={styles.actionRow}>
          <Search size={18} strokeWidth={1.9} />
          <input className={styles.search} onChange={(event) => setSearch(event.target.value)} placeholder="Search category, niche, skills, SEO tags" value={search} />
        </div>
        <button className={styles.primaryButton} onClick={() => setIsCreateOpen((value) => !value)} type="button">
          <BriefcaseBusiness size={17} strokeWidth={2} />
          {isCreateOpen ? "Close form" : "Create Work"}
        </button>
      </div>

      <div className={styles.chipRow}>
        {["ALL", "OPEN", "PAUSED", "FILLED", "CLOSED", "URGENT", "MONTHLY"].map((filter) => (
          <button className={activeFilter === filter ? styles.ghostButton : styles.secondaryButton} key={filter} onClick={() => setActiveFilter(filter)} type="button">
            {labelize(filter)}
          </button>
        ))}
      </div>

      {isCreateOpen ? (
        <section className={styles.formPanel}>
          <div>
            <p className={styles.eyebrow}>Post work for editors</p>
            <h3>Create a requirement with matching signals</h3>
            <p className={styles.muted}>Use real tags and skills. The matcher ranks editors without exposing private contact details.</p>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Work title</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, title: event.target.value }))} placeholder="Wedding Highlight Editor Needed" value={createForm.title} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Category</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, category: event.target.value }))} placeholder="Wedding Editing" value={createForm.category} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Niche / industry</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, niche: event.target.value }))} placeholder="Wedding, Real Estate, Podcast" value={createForm.niche} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Required skills</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, skills: event.target.value }))} placeholder="Premiere Pro, Color Grading, Subtitles" value={createForm.skills} />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.label}>SEO / matching tags</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, tags: event.target.value }))} placeholder="cinematic wedding highlight, instagram reels, luxury wedding" value={createForm.tags} />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.label}>Description</span>
              <textarea onChange={(event) => setCreateForm((form) => ({ ...form, description: event.target.value }))} placeholder="Describe the project, footage, style, audience, review process, and expected collaboration." value={createForm.description} />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.label}>Expected output</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, expectedOutput: event.target.value }))} placeholder="1 cinematic teaser, 3 reels, source project handover" value={createForm.expectedOutput} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Deadline</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, deadline: event.target.value }))} type="date" value={createForm.deadline} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Editors needed</span>
              <input min="1" onChange={(event) => setCreateForm((form) => ({ ...form, editorsNeeded: event.target.value }))} type="number" value={createForm.editorsNeeded} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Budget min</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, budgetMin: event.target.value }))} placeholder="3000" type="number" value={createForm.budgetMin} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Budget max</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, budgetMax: event.target.value }))} placeholder="12000" type="number" value={createForm.budgetMax} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Work type</span>
              <select onChange={(event) => setCreateForm((form) => ({ ...form, workType: event.target.value }))} value={createForm.workType}>
                <option value="ONE_TIME">One-time</option>
                <option value="RECURRING">Recurring</option>
                <option value="MONTHLY">Monthly</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Experience</span>
              <select onChange={(event) => setCreateForm((form) => ({ ...form, experienceLevel: event.target.value }))} value={createForm.experienceLevel}>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="EXPERT">Expert</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Visibility</span>
              <select onChange={(event) => setCreateForm((form) => ({ ...form, visibility: event.target.value }))} value={createForm.visibility}>
                <option value="PUBLIC_MATCHED">Public to matched editors</option>
                <option value="PRIVATE_INVITE">Private invite only</option>
                <option value="AGENCY_TEAM">Agency team only</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Reference link</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, sampleLink: event.target.value }))} placeholder="https://..." value={createForm.sampleLink} />
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.label}>Attachment links</span>
              <input onChange={(event) => setCreateForm((form) => ({ ...form, attachmentLinks: event.target.value }))} placeholder="Google Drive, Dropbox, Frame.io links separated by comma" value={createForm.attachmentLinks} />
            </label>
          </div>
          <div className={styles.actionRow}>
            <button className={styles.primaryButton} disabled={isCreating} onClick={submitCreate} type="button">
              <Send size={17} strokeWidth={2} />
              {isCreating ? "Creating..." : "Post Work"}
            </button>
            <button className={styles.secondaryButton} onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <AgencyWorkView busyKey={busyKey} connections={payload?.mode === "agency" ? payload.connections : []} inviteEditor={inviteEditor} posts={filteredPosts} updateApplication={updateApplication} />
    </div>
  );
}

function AgencyDirectory({
  agencies,
  applications,
  invites,
  isLoading,
  posts,
}: {
  agencies: AgencyListingProfile[];
  applications: WorkApplication[];
  invites: WorkInvite[];
  isLoading: boolean;
  posts: WorkPost[];
}) {
  const rows = agencies
    .map((agency) => ({ agency, stats: getAgencyDecisionStats(agency, posts, applications, invites) }))
    .sort((left, right) => {
      if (left.stats.projectRequests !== right.stats.projectRequests) return right.stats.projectRequests - left.stats.projectRequests;
      if (left.stats.openProjects !== right.stats.openProjects) return right.stats.openProjects - left.stats.openProjects;
      return right.agency.reputation.score - left.agency.reputation.score;
    });

  return (
    <section className={styles.agencyDirectory}>
      <div className={styles.agencyDirectoryHead}>
        <div>
          <span className={styles.eyebrow}>Agency directory</span>
          <h2>Choose agencies with a clear work history.</h2>
          <p>Scan the essentials here. Open an agency to review its full profile and apply to its available projects.</p>
        </div>
        <span className={styles.directoryCount}>{rows.length} agencies</span>
      </div>

      {isLoading ? (
        <div className={styles.agencyTableLoading}>
          {[0, 1, 2].map((item) => <span key={item} />)}
        </div>
      ) : rows.length ? (
        <div className={styles.agencyTable} role="table" aria-label="Agencies available to editors">
          <div className={`${styles.agencyTableRow} ${styles.agencyTableHeader}`} role="row">
            <span role="columnheader">Agency</span>
            <span role="columnheader">Work focus</span>
            <span role="columnheader">Hiring</span>
            <span role="columnheader">Trust</span>
            <span role="columnheader">Projects</span>
            <span role="columnheader">Your history</span>
            <span role="columnheader">Location</span>
            <span aria-hidden="true" />
          </div>
          {rows.map(({ agency, stats }) => {
            const location = [agency.office.city, agency.office.state].filter(Boolean).join(", ") || agency.office.country;
            return (
              <Link className={styles.agencyTableRow} href={`/freelancer/apply-for-work/${agency.slug}`} key={agency.tenantId} role="row">
                <span className={styles.agencyIdentity} role="cell">
                  <b>{agencyInitials(agency.publicName)}</b>
                  <span>
                    <strong>{agency.publicName}</strong>
                    <small>{agency.stats.averageRating || 0}/5 · {agency.stats.completedOrders} delivered</small>
                  </span>
                </span>
                <span className={styles.agencyFocus} role="cell">{agency.niche || agency.categories[0] || "Creative production"}</span>
                <span role="cell"><i className={styles.hiringStatus}>{agency.hiringStatus}</i></span>
                <span className={styles.agencyTrustCell} role="cell"><ShieldCheck size={14} /> {agency.reputation.score}/100</span>
                <span className={styles.agencyProjectsCell} role="cell">
                  <strong>{stats.openProjects} open</strong>
                  {stats.projectRequests ? <small>{stats.projectRequests} direct request{stats.projectRequests === 1 ? "" : "s"}</small> : <small>No direct requests</small>}
                </span>
                <span className={styles.agencyDecisionCell} role="cell">
                  <i className={styles.approvedCount}>{stats.approved} approved</i>
                  <i className={styles.rejectedCount}>{stats.rejected} rejected</i>
                  <i>{stats.pending} pending</i>
                </span>
                <span className={styles.agencyLocationCell} role="cell"><MapPin size={14} /> {location}</span>
                <span className={styles.agencyOpenCell} role="cell">View <ChevronRight size={15} /></span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <Building2 size={28} />
          <strong>No active agencies are available yet.</strong>
          <p>Published agencies and agencies that send you a project request will appear here.</p>
        </div>
      )}
    </section>
  );
}

function AgencyDetail({
  agency,
  applications,
  invites,
  posts,
}: {
  agency: AgencyListingProfile;
  applications: WorkApplication[];
  invites: WorkInvite[];
  posts: WorkPost[];
}) {
  const stats = getAgencyDecisionStats(agency, posts, applications, invites);
  const location = [agency.office.city, agency.office.state, agency.office.country].filter(Boolean).join(", ");
  const canApply = stats.openProjects > 0;

  return (
    <section className={styles.agencyDetail}>
      <Link className={styles.agencyBackLink} href="/freelancer/apply-for-work">
        <ArrowLeft size={15} />
        All agencies
      </Link>

      <div className={styles.agencyDetailHero}>
        <div className={styles.agencyDetailLogo}>{agencyInitials(agency.publicName)}</div>
        <div className={styles.agencyDetailIntro}>
          <div className={styles.agencyDetailTitleRow}>
            <div>
              <span className={styles.eyebrow}>Agency work profile</span>
              <h2>{agency.publicName}</h2>
            </div>
            <span className={styles.reputationBadge}><ShieldCheck size={15} /> {agency.reputation.band} · {agency.reputation.score}/100</span>
          </div>
          <strong>{agency.tagline || agency.niche}</strong>
          <p>{agency.description}</p>
          <div className={styles.agencyDetailMeta}>
            <span><MapPin size={14} /> {location}</span>
            <span><Users size={14} /> {agency.stats.activeEditors} active editors</span>
            <span><Star size={14} /> {agency.stats.averageRating || 0}/5 from {agency.stats.reviewCount} reviews</span>
            <span><Clock3 size={14} /> {agency.stats.responseSlaMinutes} min response</span>
          </div>
          <div className={styles.agencyDetailActions}>
            {canApply ? (
              <a className={styles.primaryButton} href="#agency-open-projects">
                <BriefcaseBusiness size={16} />
                Apply for agency work
              </a>
            ) : (
              <button className={styles.primaryButton} disabled type="button">No open projects</button>
            )}
            {agency.isPublished ? (
              <Link className={styles.secondaryButton} href={`/agency/${agency.slug}`} rel="noreferrer" target="_blank">
                <Eye size={16} />
                Public profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className={styles.agencyDecisionStrip}>
        <article><span>Direct requests</span><strong>{stats.projectRequests}</strong><small>Projects this agency invited you to</small></article>
        <article><span>Approved</span><strong className={styles.approvedText}>{stats.approved}</strong><small>Accepted applications or requests</small></article>
        <article><span>Rejected</span><strong className={styles.rejectedText}>{stats.rejected}</strong><small>Projects that did not move ahead</small></article>
        <article><span>Pending</span><strong>{stats.pending}</strong><small>Awaiting your or the agency&apos;s decision</small></article>
        <article><span>Open work</span><strong>{stats.openProjects}</strong><small>Projects accepting applications now</small></article>
      </div>

      <div className={styles.agencyInformationGrid}>
        <article>
          <span className={styles.label}>Work and specialties</span>
          <h3>{agency.niche}</h3>
          <div className={styles.skillTags}>{agency.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}</div>
          <p>{agency.categories.join(" · ")}</p>
        </article>
        <article>
          <span className={styles.label}>Delivery track record</span>
          <h3>{agency.stats.completedOrders} completed projects</h3>
          <p>{agency.signals.completionRate}% completion rate · {agency.stats.repeatClientPercent}% repeat clients · {stats.totalProjects} project records visible to you.</p>
        </article>
        <article>
          <span className={styles.label}>Working model</span>
          <h3>{agency.office.hasOffice ? "Office-supported" : "Remote-first"}</h3>
          <p>{agency.office.officeHours || "Working hours shared after project selection."} {agency.office.officeVerified ? "Office details are verified." : "Remote collaboration is supported."}</p>
        </article>
      </div>

      {(agency.serviceOffers.length || agency.reviews.length) ? (
        <div className={styles.agencyProofGrid}>
          <article>
            <span className={styles.label}>Typical work</span>
            {agency.serviceOffers.slice(0, 3).map((offer) => (
              <div className={styles.agencyProofRow} key={offer.id}>
                <span><strong>{offer.title}</strong><small>{offer.summary}</small></span>
                <b>{offer.priceLabel}</b>
              </div>
            ))}
          </article>
          <article>
            <span className={styles.label}>Verified feedback</span>
            {agency.reviews.slice(0, 2).map((review) => (
              <div className={styles.agencyReview} key={review.id}>
                <span><Star size={13} /> {review.rating}/5 · {review.projectType}</span>
                <p>{review.comment}</p>
              </div>
            ))}
          </article>
        </div>
      ) : null}
    </section>
  );
}

function EditorTopHeader({
  activeFilter,
  realtimeState,
  search,
  setActiveFilter,
  setSearch,
  totals,
}: {
  activeFilter: string;
  realtimeState: "connecting" | "live" | "offline";
  search: string;
  setActiveFilter: (value: string) => void;
  setSearch: (value: string) => void;
  totals: Record<string, number>;
}) {
  const liveLabel = realtimeState === "live" ? "Live" : realtimeState === "connecting" ? "Syncing" : "Offline";

  return (
    <header className={styles.editorHeader}>
      <div className={styles.editorHeaderTop}>
        <div className={styles.editorTitleBlock}>
          <h1>Find work</h1>
          <p>Projects and agency requests matched to your skills.</p>
        </div>

        <div className={styles.editorHeaderActions}>
          <span className={`${styles.livePill} ${styles[`livePill${realtimeState}`]}`}>
            <span className={styles.livePulse} />
            {liveLabel}
          </span>

          <button className={styles.iconButton} onClick={() => setActiveFilter(activeFilter === "High Budget" ? "ALL" : "High Budget")} title="Filter high budget" type="button">
            <Filter size={18} strokeWidth={1.9} />
          </button>

          <label className={styles.editorSearch}>
            <Search size={17} strokeWidth={1.9} />
            <input onChange={(event) => setSearch(event.target.value)} placeholder="Search work" value={search} />
          </label>

        </div>
      </div>

      <div className={styles.editorStats}>
        <span>{totals.availableWork ?? 0} available</span>
        <span>{totals.pendingApplications ?? 0} pending</span>
        <span>{totals.invites ?? 0} invites</span>
      </div>

      <nav aria-label="Work filters" className={styles.quickFilters}>
        {editorFilterChips.map((chip) => {
          const value = chip === "All" ? "ALL" : chip;
          return (
            <button className={activeFilter === value ? styles.quickChipActive : styles.quickChip} key={chip} onClick={() => setActiveFilter(value)} type="button">
              {chip}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function AgencyWorkView({
  busyKey,
  connections,
  inviteEditor,
  posts,
  updateApplication,
}: {
  busyKey: string | null;
  connections: AgencyPayload["connections"];
  inviteEditor: (workPostId: string, editorId: string) => Promise<void>;
  posts: WorkPost[];
  updateApplication: (applicationId: string, status: string) => Promise<void>;
}) {
  if (!posts.length) {
    return <div className={styles.empty}>No work posts yet. Create the first requirement to start matching editors.</div>;
  }

  return (
    <>
      {connections.length ? (
        <section className={styles.panel}>
          <p className={styles.eyebrow}>Connected editors</p>
          <div className={styles.grid}>
            {connections.slice(0, 6).map((connection) => (
              <div className={styles.miniItem} key={connection.connectionId}>
                <div className={styles.miniItemHeader}>
                  <div>
                    <strong>{connection.editor?.name ?? connection.editorId}</strong>
                    <p className={styles.muted}>{connection.workPost?.title ?? connection.workPostId}</p>
                  </div>
                  <span className={styles.statusChip}>{labelize(connection.status)}</span>
                </div>
                <div className={styles.actionRow}>
                  <Link className={styles.secondaryButton} href="/admin/chat">
                    <MessageSquareText size={15} strokeWidth={2} />
                    Open chat hub
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.grid}>
        {posts.map((post) => (
          <article className={styles.card} key={post.id}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.eyebrow}>
                  {post.category} / {post.niche}
                </p>
                <h3>{post.title}</h3>
                <p className={styles.muted}>{post.description}</p>
              </div>
              <span className={styles.statusChip}>{labelize(post.status)}</span>
            </div>
            <div className={styles.chipRow}>
              <span className={styles.chip}>{formatMoney(post.budgetMin, post.budgetMax)}</span>
              <span className={styles.chip}>{formatDate(post.deadline)}</span>
              <span className={styles.chip}>{post.editorsNeeded} editor(s)</span>
              <span className={styles.chip}>{labelize(post.workType)}</span>
              <span className={styles.chip}>{labelize(post.visibility)}</span>
              {chipList(post.skills, 4)}
            </div>

            <div className={styles.split}>
              <section className={styles.miniList}>
                <p className={styles.label}>Recommended editors</p>
                {post.recommendedEditors?.slice(0, 5).map((editor) => (
                  <div className={styles.miniItem} key={editor.editorId}>
                    <div className={styles.miniItemHeader}>
                      <div>
                        <strong>{editor.name}</strong>
                        <p className={styles.muted}>
                          {editor.category} / {editor.experienceLevel.toLowerCase()} / {editor.serviceCount} service(s)
                        </p>
                      </div>
                      <span className={styles.scoreChip}>{editor.matchPercentage}%</span>
                    </div>
                    <div className={styles.editorProof}>
                      <span>
                        <strong>{editor.services[0] ? formatMoney(editor.services[0].basePrice, editor.services[0].basePrice) : "Price on request"}</strong>
                        <small>Starting service price</small>
                      </span>
                      <span>
                        <strong>{editor.portfolioLinks.length || editor.serviceCount}</strong>
                        <small>Portfolio / services</small>
                      </span>
                    </div>
                    <div className={styles.chipRow}>{chipList([...editor.matchedSkills, ...editor.matchedTags], 5)}</div>
                    <div className={styles.actionRow}>
                      <button className={styles.ghostButton} disabled={busyKey === `invite:${post.id}:${editor.editorId}`} onClick={() => inviteEditor(post.id, editor.editorId)} type="button">
                        <UserPlus size={15} strokeWidth={2} />
                        Invite
                      </button>
                      {editor.services[0] ? (
                        <Link className={styles.secondaryButton} href={`/services/${editor.services[0].slug}`}>
                          View service
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))}
                {!post.recommendedEditors?.length ? <p className={styles.muted}>No matched editor yet. Add more skills or SEO tags to improve ranking.</p> : null}
              </section>

              <section className={styles.miniList}>
                <p className={styles.label}>Applications received</p>
                {post.applications?.map((application) => (
                  <div className={styles.miniItem} key={application.applicationId}>
                    <div className={styles.miniItemHeader}>
                      <div>
                        <strong>{application.editor?.name ?? application.editorId}</strong>
                        <p className={styles.muted}>
                          {application.expectedDelivery} / {application.availability}
                        </p>
                      </div>
                      <span className={styles.statusChip}>{labelize(application.status)}</span>
                    </div>
                    <p className={styles.muted}>{application.proposalMessage}</p>
                    <div className={styles.editorProof}>
                      <span><strong>{application.expectedPayout ? formatMoney(application.expectedPayout, application.expectedPayout) : "Payout open"}</strong><small>Expected payout</small></span>
                      <span><strong>{application.portfolioLinks.length ? "Attached" : "Not attached"}</strong><small>Portfolio proof</small></span>
                    </div>
                    {application.status === "PENDING" || application.status === "SHORTLISTED" ? (
                      <div className={styles.actionRow}>
                        {application.status === "PENDING" ? (
                          <button className={styles.ghostButton} disabled={busyKey === `${application.applicationId}:SHORTLISTED`} onClick={() => updateApplication(application.applicationId, "SHORTLISTED")} type="button">
                            Shortlist
                          </button>
                        ) : null}
                        <button className={styles.primaryButton} disabled={busyKey === `${application.applicationId}:ACCEPTED`} onClick={() => updateApplication(application.applicationId, "ACCEPTED")} type="button">
                          <CheckCircle2 size={15} strokeWidth={2} />
                          Accept
                        </button>
                        <button className={styles.dangerButton} disabled={busyKey === `${application.applicationId}:REJECTED`} onClick={() => updateApplication(application.applicationId, "REJECTED")} type="button">
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {!post.applications?.length ? <p className={styles.muted}>Applications from matched editors will appear here.</p> : null}
              </section>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function EditorWorkView({
  activeApplyId,
  applications,
  applyForm,
  busyKey,
  connections,
  invites,
  isLoading,
  posts,
  setActiveApplyId,
  setApplyForm,
  submitApplication,
  updateApplication,
  updateInvite,
}: {
  activeApplyId: string | null;
  applications: WorkApplication[];
  applyForm: typeof defaultApplyForm;
  busyKey: string | null;
  connections: EditorPayload["connections"];
  invites: WorkInvite[];
  isLoading: boolean;
  posts: WorkPost[];
  setActiveApplyId: (value: string | null) => void;
  setApplyForm: (updater: typeof defaultApplyForm | ((value: typeof defaultApplyForm) => typeof defaultApplyForm)) => void;
  submitApplication: (post: WorkPost) => Promise<void>;
  updateApplication: (applicationId: string, status: string, source?: WorkSource) => Promise<void>;
  updateInvite: (inviteId: string, status: string) => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const applicationByPost = useMemo(() => new Map(applications.map((application) => [application.workPostId, application])), [applications]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const storedIds = JSON.parse(window.localStorage.getItem(SAVED_WORK_STORAGE_KEY) ?? "[]") as unknown;
        if (Array.isArray(storedIds)) {
          setSavedIds(new Set(storedIds.map(String)));
        }
      } catch {
        setSavedIds(new Set());
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleSaved = (postId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      try {
        window.localStorage.setItem(SAVED_WORK_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Saving is best-effort when browser storage is unavailable.
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className={styles.editorFeed}>
        {[0, 1, 2].map((item) => (
          <div className={styles.skeletonCard} key={item} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.editorFeed}>
      {connections.length ? (
        <section className={styles.editorRail}>
          <span className={styles.railLabel}>Active Work</span>
          {connections.slice(0, 3).map((connection) => (
            <Link className={styles.railItem} href="/freelancer/chat" key={connection.connectionId}>
              <MessageSquareText size={15} strokeWidth={2} />
              <span>{connection.workPost?.title ?? "Agency connection"}</span>
              <strong>{labelize(connection.status)}</strong>
            </Link>
          ))}
        </section>
      ) : null}

      {invites.length ? (
        <section className={styles.invitePanel}>
          <div>
            <span className={styles.railLabel}>Direct Invites</span>
            <strong>{invites.length} agency request{invites.length > 1 ? "s" : ""}</strong>
          </div>
          <div className={styles.inviteList}>
            {invites.map((invite) => (
              <div className={styles.inviteItem} key={invite.inviteId}>
                <div>
                  <span className={styles.statusChip}>{labelize(invite.status)}</span>
                  <p>{invite.message}</p>
                </div>
                {invite.status === "INVITED" ? (
                  <div className={styles.actionRow}>
                    <button className={styles.primaryButton} disabled={busyKey === `${invite.inviteId}:ACCEPTED`} onClick={() => updateInvite(invite.inviteId, "ACCEPTED")} type="button">
                      Accept
                    </button>
                    <button className={styles.tertiaryButton} disabled={busyKey === `${invite.inviteId}:REJECTED`} onClick={() => updateInvite(invite.inviteId, "REJECTED")} type="button">
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <motion.div className={styles.projectList} layout>
        <AnimatePresence initial={false}>
          {posts.map((post) => {
            const existingApplication = applicationByPost.get(post.id);
            const isExpanded = expandedId === post.id || activeApplyId === post.id;
            return (
              <ProjectCard
                activeApplyId={activeApplyId}
                applyForm={applyForm}
                busyKey={busyKey}
                existingApplication={existingApplication}
                isExpanded={isExpanded}
                isSaved={savedIds.has(post.id)}
                key={post.id}
                onToggleExpanded={() => setExpandedId((current) => (current === post.id ? null : post.id))}
                onToggleSaved={() => toggleSaved(post.id)}
                post={post}
                setActiveApplyId={setActiveApplyId}
                setApplyForm={setApplyForm}
                submitApplication={submitApplication}
                updateApplication={updateApplication}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {!posts.length ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration}>
            <Film size={36} strokeWidth={1.6} />
            <span />
          </div>
          <strong>No matching projects yet</strong>
          <p>Update your skills and portfolio to improve matching.</p>
          <Link className={styles.primaryButton} href="/freelancer/profile">
            <Sparkles size={16} strokeWidth={2} />
            Update Skills
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ProjectCard({
  activeApplyId,
  applyForm,
  busyKey,
  existingApplication,
  isExpanded,
  isSaved,
  onToggleExpanded,
  onToggleSaved,
  post,
  setActiveApplyId,
  setApplyForm,
  submitApplication,
  updateApplication,
}: {
  activeApplyId: string | null;
  applyForm: typeof defaultApplyForm;
  busyKey: string | null;
  existingApplication?: WorkApplication;
  isExpanded: boolean;
  isSaved: boolean;
  onToggleExpanded: () => void;
  onToggleSaved: () => void;
  post: WorkPost;
  setActiveApplyId: (value: string | null) => void;
  setApplyForm: (updater: typeof defaultApplyForm | ((value: typeof defaultApplyForm) => typeof defaultApplyForm)) => void;
  submitApplication: (post: WorkPost) => Promise<void>;
  updateApplication: (applicationId: string, status: string, source?: WorkSource) => Promise<void>;
}) {
  const matchScore = post.match?.matchPercentage ?? 0;
  const shownTags = Array.from(new Set([...(post.match?.matchedSkills ?? []), ...(post.match?.matchedTags ?? []), ...post.skills, post.niche].filter(Boolean))).slice(0, 5);
  const links = briefLinks(post);

  return (
    <motion.article animate={{ opacity: 1, y: 0 }} className={styles.projectCard} exit={{ opacity: 0, y: 8 }} initial={{ opacity: 0, y: 12 }} layout transition={{ damping: 26, stiffness: 220, type: "spring" }}>
      <div
        aria-expanded={isExpanded}
        className={styles.projectCardBody}
        onClick={onToggleExpanded}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggleExpanded();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className={styles.agencyAvatar}>{agencyInitials(post.agencyName) || "GX"}</div>

        <div className={styles.projectMain}>
          <div className={styles.projectTitleRow}>
            <div>
              <h2>{post.title}</h2>
              <p className={styles.projectMeta}>
                <span>{post.agencyName}</span>
                <span>{postedTime(post.createdAt)}</span>
                <span>{durationLabel(post)}</span>
              </p>
            </div>
            <span className={styles.matchScore}>
              <Zap size={14} strokeWidth={2.2} />
              {matchScore}% Match
            </span>
          </div>

          <div className={styles.skillTags}>
            {shownTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <aside className={styles.projectSide}>
          <strong>{formatMoney(post.budgetMin, post.budgetMax)}</strong>
          <div className={styles.badgeStack}>
            {projectBadges(post).map(({ icon: Icon, label }) => (
              <span key={label}>
                <Icon size={13} strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
          <span className={styles.deliveryBadge}>
            <Clock3 size={13} strokeWidth={2} />
            {deliveryLabel(post)}
          </span>
        </aside>
      </div>

      <div className={styles.cardFooter} onClick={(event) => event.stopPropagation()}>
        {existingApplication ? (
          <div className={styles.applicationState}>
            <CheckCircle2 size={16} strokeWidth={2} />
            <span>Application {labelize(existingApplication.status)}</span>
          </div>
        ) : (
          <button className={styles.primaryButton} onClick={() => setActiveApplyId(activeApplyId === post.id ? null : post.id)} type="button">
            <BriefcaseBusiness size={16} strokeWidth={2} />
            Apply Now
          </button>
        )}
        <button className={styles.secondaryButton} onClick={onToggleExpanded} type="button">
          <Eye size={16} strokeWidth={2} />
          Preview Brief
        </button>
        <button aria-pressed={isSaved} className={`${styles.tertiaryButton} ${isSaved ? styles.tertiaryButtonActive : ""}`} onClick={onToggleSaved} type="button">
          <Bookmark size={16} strokeWidth={2} />
          Save
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div animate={{ height: "auto", opacity: 1 }} className={styles.projectPreview} exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: "easeOut" }}>
            <div className={styles.previewGrid}>
              <section className={styles.previewBrief}>
                <span className={styles.label}>Full brief</span>
                <p>{post.description}</p>
              </section>
              <section className={styles.previewBrief}>
                <span className={styles.label}>Editing style</span>
                <p>{[post.niche, ...post.tags].filter(Boolean).slice(0, 5).join(" / ") || "Style to be aligned with the agency reference."}</p>
              </section>
              <section className={styles.previewBrief}>
                <span className={styles.label}>Deliverables</span>
                <p>{post.expectedOutput || "Final edited files and review-ready links."}</p>
              </section>
              <section className={styles.previewBrief}>
                <span className={styles.label}>Turnaround</span>
                <p>
                  {deliveryLabel(post)} / {formatDate(post.deadline)} / 2 revision windows
                </p>
              </section>
            </div>

            <div className={styles.referenceStrip}>
              <div className={styles.sampleFrames}>
                {[0, 1, 2].map((frame) => (
                  <span key={frame}>
                    <Film size={16} strokeWidth={1.7} />
                  </span>
                ))}
              </div>
              <div className={styles.referenceLinks}>
                {links.map((link, index) => (
                  <a href={link} key={link} rel="noreferrer" target="_blank">
                    <LinkIcon size={14} strokeWidth={2} />
                    Reference {index + 1}
                  </a>
                ))}
                {!links.length ? <span>No public reference attached yet</span> : null}
              </div>
            </div>

            {existingApplication ? (
              <div className={styles.sentApplication}>
                <div>
                  <strong>Your proposal is in</strong>
                  <p>{existingApplication.proposalMessage}</p>
                </div>
                {existingApplication.status === "PENDING" ? (
                  <button className={styles.tertiaryButton} disabled={busyKey === `${existingApplication.applicationId}:WITHDRAWN`} onClick={() => updateApplication(existingApplication.applicationId, "WITHDRAWN", existingApplication.source)} type="button">
                    Withdraw
                  </button>
                ) : null}
              </div>
            ) : activeApplyId === post.id ? (
              <motion.div animate={{ opacity: 1, y: 0 }} className={styles.compactForm} initial={{ opacity: 0, y: 8 }}>
                <label className={`${styles.field} ${styles.fieldWide}`}>
                  <span className={styles.label}>Short proposal</span>
                  <textarea maxLength={2000} onChange={(event) => setApplyForm((form) => ({ ...form, proposalMessage: event.target.value }))} placeholder="Tell the agency why your niche and portfolio fit this work." value={applyForm.proposalMessage} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Expected delivery</span>
                  <input maxLength={100} onChange={(event) => setApplyForm((form) => ({ ...form, expectedDelivery: event.target.value }))} placeholder="48 hours after footage handover" value={applyForm.expectedDelivery} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Expected payout (required)</span>
                  <input min={1} onChange={(event) => setApplyForm((form) => ({ ...form, expectedPayout: event.target.value }))} placeholder="8000" step={1} type="number" value={applyForm.expectedPayout} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Published service attachment</span>
                  <input maxLength={500} onChange={(event) => setApplyForm((form) => ({ ...form, portfolioLinks: event.target.value }))} placeholder="Published service URL or slug" value={applyForm.portfolioLinks} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Availability</span>
                  <input maxLength={100} onChange={(event) => setApplyForm((form) => ({ ...form, availability: event.target.value }))} placeholder="Available this week" value={applyForm.availability} />
                </label>
                <div className={styles.actionRow}>
                  <button
                    className={styles.primaryButton}
                    disabled={
                      busyKey === `apply:${post.id}` ||
                      applyForm.proposalMessage.trim().length < 10 ||
                      !Number.isSafeInteger(Number(applyForm.expectedPayout)) ||
                      Number(applyForm.expectedPayout) <= 0
                    }
                    onClick={() => submitApplication(post)}
                    type="button"
                  >
                    <Send size={15} strokeWidth={2} />
                    {busyKey === `apply:${post.id}` ? "Sending..." : "Send Application"}
                  </button>
                  <button className={styles.secondaryButton} onClick={() => setActiveApplyId(null)} type="button">
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
