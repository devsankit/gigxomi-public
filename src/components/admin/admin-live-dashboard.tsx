"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  IndianRupee,
  Instagram,
  MessageCircle,
  PlusCircle,
  UserPlus,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  adminDashboardSnapshots,
  agencyProjectPosts,
  editorAgencyMemberships,
  editorPerformanceProfiles,
  type AdminDashboardSnapshot,
  type AgencyProjectPost,
} from "@/lib/gigxomi/business-ecosystem-data";

type RealEditorTurnaround = {
  freelancerId: string;
  freelancerName: string;
  projectTitle: string;
  status: string;
  daysInProgress: number;
  deadlineText: string;
  isOverdue: boolean;
};

type RealDashboardMetrics = {
  agencyName: string;
  totalChats: number;
  unassignedChats: number;
  assignedChats: number;
  activeTeamEditors: number;
  activeProjects: number;
  urgentProjects: number;
  slowEditors: RealEditorTurnaround[];
};

type AdminDashboardApiResponse = {
  ok: boolean;
  snapshot: AdminDashboardSnapshot;
  channels?: ConnectedChannelsView;
  realMetrics?: RealDashboardMetrics;
};

type ConnectedChannelStatus = "connected" | "needs_attention" | "not_connected";

type ConnectedChannelView = {
  label: string;
  value: string;
  detail: string;
  status: ConnectedChannelStatus;
  statusLabel: string;
};

type ConnectedChannelsView = {
  whatsapp: ConnectedChannelView;
  instagram: ConnectedChannelView;
};

type PriorityMetric = {
  title: string;
  value: string;
  helper: string;
  cta: string;
  href: string;
  icon: LucideIcon;
};

type FocusItem = {
  title: string;
  reason: string;
  cta: string;
  href: string;
  icon: LucideIcon;
};

const adminSnapshot = adminDashboardSnapshots["tenant-gigxomi"];
const defaultConnectedChannels: ConnectedChannelsView = {
  whatsapp: {
    label: "WhatsApp phone number",
    value: "Not connected yet",
    detail: "Connect the agency WhatsApp Business number from Integrations.",
    status: "not_connected",
    statusLabel: "Not connected",
  },
  instagram: {
    label: "Instagram ID",
    value: "Not connected yet",
    detail: "Connect the Instagram business account from the Meta setup.",
    status: "not_connected",
    statusLabel: "Not connected",
  },
};

export function AdminLiveDashboard() {
  const [overviewSnapshot, setOverviewSnapshot] = useState(adminSnapshot);
  const [connectedChannels, setConnectedChannels] = useState<ConnectedChannelsView>(defaultConnectedChannels);
  const [realMetrics, setRealMetrics] = useState<RealDashboardMetrics | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as AdminDashboardApiResponse;
        if (!response.ok || !payload.snapshot) {
          throw new Error("Admin dashboard could not load.");
        }

        if (!active) {
          return;
        }

        setOverviewSnapshot(payload.snapshot);
        setConnectedChannels(payload.channels ?? defaultConnectedChannels);
        if (payload.realMetrics) {
          setRealMetrics(payload.realMetrics);
        }
        setLoadError(null);
      })
      .catch(() => {
        if (active) {
          setLoadError("Live agency data is still syncing, so the saved workspace snapshot is shown for now.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const agencyId = overviewSnapshot.agency.id;
  const agencyProjects = useMemo(
    () => agencyProjectPosts.filter((project) => project.agencyId === agencyId),
    [agencyId],
  );
  const activeProjects = agencyProjects.filter((project) => project.openStatus !== "Filled");
  const urgentProjects = agencyProjects.filter((project) => project.urgency === "High");
  const dueSoonProjects = agencyProjects.filter((project) => project.urgency === "High" || project.urgency === "Medium");
  const unassignedProjects = agencyProjects.filter((project) => project.openStatus === "Open" && project.matchedEditorIds.length === 0);
  const activeTeamEditors = editorAgencyMemberships.filter(
    (membership) => membership.agencyId === agencyId && membership.status === "Active",
  );
  const agencyEditors = editorPerformanceProfiles.filter((editor) =>
    activeTeamEditors.some((membership) => membership.editorId === editor.id),
  );
  const availableEditors = agencyEditors.filter(
    (editor) => editor.availability === "Available this week" || editor.workloadBand === "Low" || editor.workloadBand === "Moderate",
  );
  const overloadedEditors = agencyEditors.filter((editor) => editor.workloadBand === "Near Capacity" || editor.availability === "High load");
  const pendingPaymentValue = 0;
  const leadCount = 0;
  const qualifiedLeadCount = 0;
  const paidClientCount = 0;
  const repeatClientCount = 0;

  const agencyDisplayName = realMetrics?.agencyName || overviewSnapshot.agency.name || "Agency Workspace";
  const totalChatsCount = realMetrics ? realMetrics.totalChats : 0;
  const unassignedChatsCount = realMetrics ? realMetrics.unassignedChats : 0;
  const assignedChatsCount = realMetrics ? realMetrics.assignedChats : 0;
  const activeTeamEditorsCount = realMetrics ? realMetrics.activeTeamEditors : activeTeamEditors.length;
  const activeProjectsCount = realMetrics ? realMetrics.activeProjects : activeProjects.length;
  const slowEditors = realMetrics?.slowEditors ?? [];

  const priorityMetrics: PriorityMetric[] = [
    {
      title: "Total Client Chats",
      value: `${totalChatsCount}`,
      helper: `${unassignedChatsCount} unassigned · ${assignedChatsCount} assigned`,
      icon: MessageCircle,
      cta: "Open chats",
      href: "/admin/chat",
    },
    {
      title: "Unassigned Inquiries",
      value: `${unassignedChatsCount}`,
      helper: unassignedChatsCount > 0 ? "Requires assigned editor" : "All chats assigned",
      icon: AlertTriangle,
      cta: "Assign editors",
      href: "/admin/chat",
    },
    {
      title: "Assigned Team Editors",
      value: `${activeTeamEditorsCount}`,
      helper: `${assignedChatsCount} active chat assignments`,
      icon: Users,
      cta: "Manage team",
      href: "/admin/roles",
    },
    {
      title: "Work Hub Projects",
      value: `${activeProjectsCount}`,
      helper: slowEditors.length > 0 ? `${slowEditors.length} pending SLA review` : "On schedule",
      icon: FolderKanban,
      cta: "View work hub",
      href: "/admin/assignments",
    },
  ];

  const urgentFocusItems: FocusItem[] = [
    ...(unassignedChatsCount > 0
      ? [
          {
            title: `Assign ${unassignedChatsCount} incoming client chats`,
            reason: "Incoming client inquiries are unassigned and waiting for an editor.",
            cta: "Assign now",
            href: "/admin/chat",
            icon: AlertTriangle,
          },
        ]
      : []),
    ...(slowEditors.length > 0
      ? [
          {
            title: `Review ${slowEditors.length} delayed editor deliveries`,
            reason: `${slowEditors[0].freelancerName} has been in progress for ${slowEditors[0].daysInProgress} days.`,
            cta: "Inspect turnaround",
            href: "/admin/assignments",
            icon: Clock3,
          },
        ]
      : []),
    ...(leadCount > 0
      ? [
          {
            title: "Follow up pending leads",
            reason: "Fresh inquiries convert faster when the first reply is quick.",
            cta: "Open leads",
            href: "/admin/chat",
            icon: MessageCircle,
          },
        ]
      : []),
    ...(pendingPaymentValue > 0
      ? [
          {
            title: "Collect pending payments",
            reason: "Move unpaid balances before delivery work expands.",
            cta: "Open accounting",
            href: "/admin/accounting",
            icon: WalletCards,
          },
        ]
      : []),
    ...(unassignedProjects.length > 0
      ? [
          {
            title: "Assign unassigned projects",
            reason: "Unassigned work can delay delivery and client confidence.",
            cta: "Assign now",
            href: "/admin/assignments",
            icon: Users,
          },
        ]
      : []),
    ...(urgentProjects.length > 0
      ? [
          {
            title: "Review delayed deliveries",
            reason: "High-urgency projects need owner attention today.",
            cta: "Review risks",
            href: "/admin/assignments",
            icon: Clock3,
          },
        ]
      : []),
    ...(connectedChannels.whatsapp.status !== "connected"
      ? [
          {
            title: "Connect WhatsApp",
            reason: "Start receiving client inquiries directly inside Gigxomi.",
            cta: "Connect now",
            href: "/admin/integrations/whatsapp",
            icon: MessageCircle,
          },
        ]
      : []),
  ];

  return (
    <div className="agency-growth-dashboard dashboard-shell compact">
      {loadError ? <p className="agency-dashboard-sync-note">{loadError}</p> : null}

      <DashboardPageHeader
        eyebrow={`${agencyDisplayName} · Operations Hub`}
        title={`${agencyDisplayName} Overview`}
        subtitle="Monitor live client conversations, assign team editors, track delivery SLA timelines, and unblock client handoffs."
        actions={
          <>
            <a className="agency-dashboard-primary-action" href="/admin/contacts">
              <UserPlus size={18} strokeWidth={2} />
              Add Client
            </a>
            <a className="agency-dashboard-secondary-action" href="/admin/assignments">
              <PlusCircle size={18} strokeWidth={2} />
              Create Project
            </a>
            <a className="agency-dashboard-secondary-action" href="/admin/integrations/whatsapp">
              <MessageCircle size={18} strokeWidth={2} />
              Connect WhatsApp
            </a>
          </>
        }
      />

      {unassignedChatsCount > 0 ? (
        <aside aria-label="Unassigned chats alert" className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle size={22} />
              </span>
              <div>
                <h4 className="font-semibold text-white text-base">
                  {unassignedChatsCount} Client {unassignedChatsCount === 1 ? "Chat is" : "Chats are"} not assigned to any editor
                </h4>
                <p className="text-xs text-amber-200/80">
                  Incoming client inquiries need an assigned team editor to maintain response SLAs and delivery schedules.
                </p>
              </div>
            </div>
            <a
              href="/admin/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 transition hover:bg-amber-400"
            >
              Assign Editors Now
              <ArrowRight size={14} />
            </a>
          </div>
        </aside>
      ) : null}

      <section className="agency-priority-grid" aria-label="Agency priorities">
        {priorityMetrics.map((metric) => (
          <PriorityMetricCard key={metric.title} metric={metric} />
        ))}
      </section>

      <section className="agency-dashboard-grid two-column">
        <TodayFocusPanel items={urgentFocusItems} />
        <PlanLimitsCard
          activeProjects={activeProjects.length}
          planName={overviewSnapshot.plan.planName}
          planNote={
            overviewSnapshot.plan.monthlySubscription > 0
              ? overviewSnapshot.plan.renewalWindow
              : "Internal workspace plan active"
          }
          projectLimitLabel="Project limit not configured"
          seatsUsed={`${overviewSnapshot.plan.activeSeats}/${overviewSnapshot.plan.seatLimit}`}
        />
      </section>

      <EditorTurnaroundSection slowEditors={slowEditors} />

      <GrowthPipeline
        stages={[
          { label: "Leads", value: leadCount },
          { label: "Qualified", value: qualifiedLeadCount },
          { label: "Projects Created", value: agencyProjects.length },
          { label: "Paid Clients", value: paidClientCount },
          { label: "Repeat Clients", value: repeatClientCount },
        ]}
      />

      <WorkDeliverySection
        activeProjects={activeProjects.length}
        dueSoon={dueSoonProjects.length}
        projects={agencyProjects}
        unassigned={unassignedProjects.length}
        urgent={urgentProjects.length}
      />

      <section className="agency-dashboard-grid two-column">
        <ClientFollowUpList hasConnectedLeadChannel={connectedChannels.whatsapp.status === "connected" || connectedChannels.instagram.status === "connected"} />
        <TeamCapacityCard
          activeEditors={activeTeamEditorsCount}
          availableEditors={availableEditors.length}
          overloadedEditors={overloadedEditors.length}
          unassignedWork={unassignedProjects.length}
        />
      </section>

      <section className="agency-dashboard-grid two-column">
        <ChannelConnectionCard channel={connectedChannels.whatsapp} channelKey="whatsapp" />
        <ChannelConnectionCard channel={connectedChannels.instagram} channelKey="instagram" />
      </section>
    </div>
  );
}

function DashboardPageHeader({
  actions,
  eyebrow,
  subtitle,
  title,
}: {
  actions: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="agency-dashboard-hero">
      <div className="agency-dashboard-hero-copy">
        <p className="agency-dashboard-eyebrow">{eyebrow || "Agency Overview"}</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <div className="agency-dashboard-hero-actions">{actions}</div>
    </section>
  );
}

function PriorityMetricCard({ metric }: { metric: PriorityMetric }) {
  const Icon = metric.icon;

  return (
    <article className="agency-priority-card">
      <span className="agency-icon-tile" aria-hidden="true">
        <Icon size={20} strokeWidth={2} />
      </span>
      <div>
        <p>{metric.title}</p>
        <strong>{metric.value}</strong>
        <span>{metric.helper}</span>
      </div>
      <a href={metric.href}>
        {metric.cta}
        <ArrowRight size={14} strokeWidth={2} />
      </a>
    </article>
  );
}

function TodayFocusPanel({ items }: { items: FocusItem[] }) {
  const visibleItems = items.slice(0, 5);

  return (
    <section className="agency-section-card today-focus-card">
      <SectionTitle icon={CheckCircle2} subtitle="Actionable items for the agency owner" title="Today's Focus" />
      {visibleItems.length ? (
        <div className="agency-focus-list">
          {visibleItems.map((item) => (
            <TodayFocusCard item={item} key={item.title} />
          ))}
        </div>
      ) : (
        <EmptyAgencyState
          actionHref="/admin/assignments"
          actionLabel="Create Project"
          description="No urgent tasks yet. Create a project, add a client, or connect WhatsApp when you are ready to grow the pipeline."
          title="No urgent tasks yet"
        />
      )}
    </section>
  );
}

function TodayFocusCard({ item }: { item: FocusItem }) {
  const Icon = item.icon;

  return (
    <article className="agency-focus-item">
      <span className="agency-small-icon" aria-hidden="true">
        <Icon size={17} strokeWidth={2} />
      </span>
      <div>
        <strong>{item.title}</strong>
        <span>{item.reason}</span>
      </div>
      <a href={item.href}>{item.cta}</a>
    </article>
  );
}

function GrowthPipeline({ stages }: { stages: Array<{ label: string; value: number }> }) {
  return (
    <section className="agency-section-card">
      <SectionTitle icon={FileText} subtitle="See where leads are becoming paid work" title="Growth Pipeline" />
      <div className="agency-pipeline-grid">
        {stages.map((stage, index) => (
          <PipelineStageCard isLast={index === stages.length - 1} key={stage.label} stage={stage} />
        ))}
      </div>
    </section>
  );
}

function PipelineStageCard({ isLast, stage }: { isLast: boolean; stage: { label: string; value: number } }) {
  return (
    <article className="agency-pipeline-stage">
      <span>{stage.label}</span>
      <strong>{stage.value}</strong>
      {!isLast ? <ArrowRight className="agency-pipeline-arrow" size={16} strokeWidth={2} /> : null}
    </article>
  );
}

function EditorTurnaroundSection({ slowEditors }: { slowEditors: RealEditorTurnaround[] }) {
  return (
    <section className="agency-section-card agency-work-section">
      <div className="agency-section-split-head">
        <SectionTitle
          icon={Clock3}
          subtitle="Real-time turnaround tracking to catch delayed deliveries before clients follow up"
          title="Editor Turnaround & Delivery SLA"
        />
        <a className="agency-dashboard-secondary-action compact" href="/admin/assignments">
          <BriefcaseBusiness size={16} strokeWidth={2} />
          View All Work
        </a>
      </div>

      <div className="agency-work-stat-grid">
        <MiniStat label="Editors Tracked" value={`${slowEditors.length}`} />
        <MiniStat
          label="Taking Longer (>5d)"
          value={`${slowEditors.filter((e) => e.daysInProgress >= 5).length}`}
        />
        <MiniStat
          label="Critical SLA (>7d)"
          value={`${slowEditors.filter((e) => e.daysInProgress >= 7).length}`}
        />
        <MiniStat
          label="SLA Breached"
          value={`${slowEditors.filter((e) => e.isOverdue).length}`}
        />
      </div>

      {slowEditors.length === 0 ? (
        <EmptyAgencyState
          actionHref="/admin/assignments"
          actionLabel="Assign Work"
          description="All active editor assignments are currently delivering within agreed SLA turnaround times."
          title="No delivery delays detected"
        />
      ) : (
        <div className="agency-table-wrap">
          <table className="agency-work-table">
            <thead>
              <tr>
                <th>Editor / Freelancer</th>
                <th>Project Assigned</th>
                <th>Time in Progress</th>
                <th>Delivery Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {slowEditors.map((editor) => (
                <tr key={`${editor.freelancerId}-${editor.projectTitle}`}>
                  <td data-label="Editor / Freelancer">
                    <strong>{editor.freelancerName}</strong>
                    <span>ID: {editor.freelancerId.slice(0, 16)}</span>
                  </td>
                  <td data-label="Project Assigned">
                    <strong>{editor.projectTitle}</strong>
                    <span>{editor.status.replace(/_/g, " ")}</span>
                  </td>
                  <td data-label="Time in Progress">
                    <span className={`agency-status-badge ${editor.daysInProgress >= 7 ? "is-warning" : "is-neutral"}`}>
                      {editor.daysInProgress} {editor.daysInProgress === 1 ? "day" : "days"} in progress
                    </span>
                  </td>
                  <td data-label="Delivery Status">
                    {editor.isOverdue ? (
                      <span className="agency-status-badge is-warning">
                        <AlertTriangle size={12} className="inline mr-1" />
                        Delayed / SLA Risk
                      </span>
                    ) : (
                      <span className="agency-status-badge is-neutral">Active Turnaround</span>
                    )}
                  </td>
                  <td data-label="Action">
                    <a className="agency-table-action" href="/admin/assignments">
                      Review Work
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function WorkDeliverySection({
  activeProjects,
  dueSoon,
  projects,
  unassigned,
  urgent,
}: {
  activeProjects: number;
  dueSoon: number;
  projects: AgencyProjectPost[];
  unassigned: number;
  urgent: number;
}) {
  return (
    <section className="agency-section-card agency-work-section">
      <div className="agency-section-split-head">
        <SectionTitle icon={BriefcaseBusiness} subtitle="Track production risk before clients chase you" title="Work & Delivery" />
        <a className="agency-dashboard-secondary-action compact" href="/admin/assignments">
          <PlusCircle size={16} strokeWidth={2} />
          Create Project
        </a>
      </div>
      <div className="agency-work-stat-grid">
        <MiniStat label="Active projects" value={`${activeProjects}`} />
        <MiniStat label="Unassigned" value={`${unassigned}`} />
        <MiniStat label="Due soon" value={`${dueSoon}`} />
        <MiniStat label="Delayed" value={`${urgent}`} />
      </div>
      <WorkDeliveryTable projects={projects} />
    </section>
  );
}

function WorkDeliveryTable({ projects }: { projects: AgencyProjectPost[] }) {
  if (!projects.length) {
    return (
      <EmptyAgencyState
        actionHref="/admin/assignments"
        actionLabel="Create Project"
        description="Create your first project to start tracking delivery, assignments, deadlines, and client work."
        title="No active projects yet"
      />
    );
  }

  return (
    <div className="agency-table-wrap">
      <table className="agency-work-table">
        <thead>
          <tr>
            <th>Project / Client</th>
            <th>Service</th>
            <th>Status</th>
            <th>Due date</th>
            <th>Assigned editor</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const assignedEditor = editorPerformanceProfiles.find((editor) => project.matchedEditorIds.includes(editor.id));

            return (
              <tr key={project.id}>
                <td data-label="Project / Client">
                  <strong>{project.title}</strong>
                  <span>Client source not connected</span>
                </td>
                <td data-label="Service">{project.specialty}</td>
                <td data-label="Status">
                  <span className={`agency-status-badge ${project.urgency === "High" ? "is-warning" : "is-neutral"}`}>
                    {project.openStatus}
                  </span>
                </td>
                <td data-label="Due date">{project.turnaround}</td>
                <td data-label="Assigned editor">{assignedEditor?.name ?? "Unassigned"}</td>
                <td data-label="Action">
                  <a className="agency-table-action" href="/admin/assignments">
                    Open
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ClientFollowUpList({ hasConnectedLeadChannel }: { hasConnectedLeadChannel: boolean }) {
  return (
    <section className="agency-section-card">
      <SectionTitle icon={MessageCircle} subtitle="Leads and clients who need the next reply" title="Client Follow-ups" />
      <EmptyAgencyState
        actionHref={hasConnectedLeadChannel ? "/admin/chat" : "/admin/integrations/whatsapp"}
        actionLabel={hasConnectedLeadChannel ? "Open inbox" : "Connect WhatsApp"}
        description={
          hasConnectedLeadChannel
            ? "No follow-ups pending. New messages will appear here when they need owner attention."
            : "No follow-ups pending. Connect WhatsApp or Instagram to start capturing leads."
        }
        title="No follow-ups pending"
      />
    </section>
  );
}

function ChannelConnectionCard({
  channel,
  channelKey,
}: {
  channel: ConnectedChannelView;
  channelKey: keyof ConnectedChannelsView;
}) {
  const Icon = channelKey === "whatsapp" ? MessageCircle : Instagram;
  const isConnected = channel.status === "connected";
  const title = channelKey === "whatsapp" ? "WhatsApp Lead Inbox" : "Instagram DM Inbox";
  const description =
    channelKey === "whatsapp"
      ? "Capture inquiries, assign chats, and convert leads faster."
      : "Bring Instagram leads into your agency workflow.";
  const href = channelKey === "whatsapp" ? "/admin/integrations/whatsapp" : "/admin/integrations";

  return (
    <article className="agency-section-card agency-channel-card">
      <div className="agency-channel-head">
        <span className="agency-icon-tile" aria-hidden="true">
          <Icon size={20} strokeWidth={2} />
        </span>
        <span className={`agency-status-badge ${isConnected ? "is-success" : "is-neutral"}`}>{channel.statusLabel}</span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="agency-channel-detail">{channel.value}</span>
      <a className="agency-dashboard-secondary-action compact" href={href}>
        {isConnected ? "Manage" : "Connect"}
        <ArrowRight size={14} strokeWidth={2} />
      </a>
    </article>
  );
}

function TeamCapacityCard({
  activeEditors,
  availableEditors,
  overloadedEditors,
  unassignedWork,
}: {
  activeEditors: number;
  availableEditors: number;
  overloadedEditors: number;
  unassignedWork: number;
}) {
  return (
    <section className="agency-section-card">
      <SectionTitle icon={Users} subtitle="Know whether you can accept more work" title="Team Capacity" />
      <div className="agency-capacity-grid">
        <MiniStat label="Active editors" value={`${activeEditors}`} />
        <MiniStat label="Available" value={`${availableEditors}`} />
        <MiniStat label="Unassigned work" value={`${unassignedWork}`} />
        <MiniStat label="Overloaded" value={`${overloadedEditors}`} />
      </div>
      {activeEditors ? null : (
        <EmptyAgencyState
          actionHref="/admin/freelancers"
          actionLabel="Add Freelancer"
          description="Add freelancers or managers to start tracking team capacity."
          title="No team capacity data yet"
        />
      )}
    </section>
  );
}

function PlanLimitsCard({
  activeProjects,
  planNote,
  planName,
  projectLimitLabel,
  seatsUsed,
}: {
  activeProjects: number;
  planNote: string;
  planName: string;
  projectLimitLabel: string;
  seatsUsed: string;
}) {
  return (
    <section className="agency-section-card plan-limits-card">
      <SectionTitle icon={WalletCards} subtitle="Keep package limits from blocking growth" title="Plan & Limits" />
      <div className="agency-plan-list">
        <MiniStat label="Current plan" value={planName} />
        <MiniStat label="Seats used" value={seatsUsed} />
        <MiniStat label="Active projects" value={`${activeProjects}`} />
        <MiniStat label="Projects limit" value={projectLimitLabel} />
      </div>
      <p>{planNote}</p>
      <a className="agency-dashboard-secondary-action compact" href="/admin/packages">
        Review plan
        <ArrowRight size={14} strokeWidth={2} />
      </a>
    </section>
  );
}

function SectionTitle({ icon: Icon, subtitle, title }: { icon: LucideIcon; subtitle?: string; title: string }) {
  return (
    <div className="agency-section-title">
      <span className="agency-small-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </span>
      <div>
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="agency-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyAgencyState({
  actionHref,
  actionLabel,
  description,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  description: string;
  title: string;
}) {
  return (
    <div className="agency-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
      <a href={actionHref}>{actionLabel}</a>
    </div>
  );
}

function formatInr(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}
