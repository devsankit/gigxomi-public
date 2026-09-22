import type { ReactNode } from "react";
import {
  CreditCard,
  Crown,
  MessageCircleMore,
  Package,
  ReceiptText,
  ShieldCheck,
  UserCog,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { AdminLiveDashboard } from "@/components/admin/admin-live-dashboard";
import {
  AdminServiceModerationBoard,
  AdminWhatsAppConnectionCard,
  AdminWhatsAppSetupPanel,
} from "@/components/admin/admin-dummy-controls";
import { AdminWorkHubClient } from "@/components/admin/admin-work-hub-client";
import { AdminYouTubeConnectionCard, AdminYouTubeSetupPanel } from "@/components/admin/admin-youtube-controls";
import { AdminCustomerPrivacyPanel, AdminManagerPermissionsPanel, AdminUpiSettingsPanel, ContactsTable } from "@/components/crm/crm-dummy-controls";
import { DeliveryReviewWorkspace } from "@/components/delivery/delivery-review-workspace";
import { AdminPayoutAccountingClient } from "@/components/admin/admin-payout-accounting-client";
import { MetricCard, SimpleDataTable, StatusPill, SurfaceCard } from "@/components/ui/dashboard-primitives";
import { PluginBrandMark } from "@/components/ui/plugin-brand-mark";
import { getSessionContext } from "@/lib/auth/session";
import {
  adminDashboardSnapshots,
  agencyDirectoryCards,
  agencyProjectPosts,
  editorAgencyMemberships,
  editorInvites,
  editorPerformanceProfiles,
  editorPortfolioRequests,
  getActiveSeatUsage,
} from "@/lib/gigxomi/business-ecosystem-data";
import { getWhatsAppConnectionStateFromFile } from "@/lib/gigxomi/dummy-platform-file-store";
import { getDummyPlatformSnapshot } from "@/lib/gigxomi/dummy-platform-store";
import { adminIntegrationCards, adminPackageCards } from "@/lib/gigxomi/internal-panels-data";
import { prisma } from "@/lib/prisma";

const adminSnapshot = adminDashboardSnapshots["tenant-gigxomi"];
const agency = adminSnapshot.agency;
const plan = adminSnapshot.plan;
const activeAgencyProjects = agencyProjectPosts.filter((item) => item.agencyId === agency.id);
const activeAgencyEditors = editorPerformanceProfiles.filter((editor) =>
  editorAgencyMemberships.some((membership) => membership.agencyId === agency.id && membership.editorId === editor.id),
);

function HubAnchorTabs({ tabs }: { tabs: Array<{ href: string; label: string; count?: number | string }> }) {
  return (
    <nav aria-label="Page sections" className="gx-section-tabs">
      {tabs.map((tab) => (
        <a className="gx-section-tab" href={tab.href} key={tab.href}>
          <span>{tab.label}</span>
          {tab.count ? <strong>{tab.count}</strong> : null}
        </a>
      ))}
    </nav>
  );
}

function MetaPartnerTrustBanner() {
  return (
    <aside className="whatsapp-meta-partner-banner" aria-label="Gigxomi Meta partner status">
      <span className="whatsapp-meta-partner-icon">
        <ShieldCheck size={22} strokeWidth={1.9} />
      </span>
      <div>
        <strong>Gigxomi is a Meta Verified Partner</strong>
        <p>Your WhatsApp Business connection uses Meta&apos;s official Embedded Signup flow. Gigxomi securely captures the approved business and phone details needed to connect this agency workspace.</p>
      </div>
      <span className="meta-pill">Official Meta connection</span>
    </aside>
  );
}

function InsightBars({
  items,
}: {
  items: Array<{ label: string; value: string; percentage: number; note?: string }>;
}) {
  return (
    <div className="insight-list">
      {items.map((item) => (
        <div className="insight-row" key={item.label}>
          <div className="insight-copy">
            <strong>{item.label}</strong>
            <span>{item.value}</span>
          </div>
          <div className="insight-track" aria-hidden="true">
            <span className="insight-fill" style={{ width: `${item.percentage}%` }} />
          </div>
          {item.note ? <p className="muted-copy">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN", { maximumFractionDigits: value % 1 === 0 ? 0 : 2 })}`;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number(value) || 0;
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value ?? 0) || 0;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDateOnly(value?: string | Date | null) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPaymentProviderLabel(provider?: string) {
  if (!provider) {
    return "UPI";
  }

  switch (provider.toLowerCase()) {
    case "phonepe":
      return "PhonePe";
    case "payu":
      return "PayU";
    case "razorpay":
      return "Razorpay";
    case "zaakpay":
      return "Zaakpay";
    default:
      return provider;
  }
}

export function AdminOverviewSection() {
/*
  const [overviewSnapshot, setOverviewSnapshot] = useState(adminSnapshot);
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
        setLoadError(null);
      })
      .catch(() => {
        if (active) {
          setLoadError("Live tenant dashboard data is still syncing, so the saved snapshot is shown for now.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const adminKpiIcons = [
    BadgeIndianRupee,
    Users,
    MessageCircleMore,
    CreditCard,
    WalletCards,
    ShieldCheck,
    ShieldCheck,
    MessageCircleMore,
  ];

  const adminKpiTones = ["lime", "lime", "lime", "lime", "lime", "lime", "lime", "lime"] as const;

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Agency control</p>
      <h2 className="section-heading">Admin should run the tenant like a business unit: team capacity, trust scores, invite funnel, workload, payout safety, and project fill rate.</h2>
      {loadError ? <p className="muted-copy">{loadError}</p> : null}

      <DashboardShowcaseCard
        eyebrow="Tenant signal"
        title="Run the agency like an operating system, not a static report."
        copy="Seats, chat velocity, secured payouts, and trust health should feel visible at a glance. This layer turns the most important admin signals into one live visual snapshot."
        metrics={[
          { label: overviewSnapshot.kpis[0]?.label ?? "Tenant revenue", value: overviewSnapshot.kpis[0]?.value ?? "-" },
          { label: overviewSnapshot.kpis[1]?.label ?? "Active seats", value: overviewSnapshot.kpis[1]?.value ?? "-" },
          { label: overviewSnapshot.kpis[7]?.label ?? "Manager SLA", value: overviewSnapshot.kpis[7]?.value ?? "-" },
        ]}
        icons={[
          { icon: Users, label: "Seats", tone: "lime" },
          { icon: WalletCards, label: "Payouts", tone: "lime" },
          { icon: ShieldCheck, label: "Trust", tone: "lime" },
        ]}
      />

      <div className="metric-grid dashboard-kpi-grid">
        {overviewSnapshot.kpis.map((item, index) => (
          <DashboardKpiVisualCard
            icon={adminKpiIcons[index] ?? WalletCards}
            key={item.label}
            label={item.label}
            note={item.note}
            tone={adminKpiTones[index] ?? "lime"}
            value={item.value}
          />
        ))}
      </div>

      <div className="dashboard-grid">
        <SurfaceCard>
          <div className="board-header">
            <div>
              <p className="section-label">Editor leaderboard</p>
              <h2 className="app-section-title">Leader score shows who should get premium projects, reward campaigns, and higher-trust opportunities.</h2>
            </div>
            <StatusPill>{overviewSnapshot.agency.name}</StatusPill>
          </div>

          <div className="board-list">
            {overviewSnapshot.leaderboard.map((editor) => (
              <article className="lead-row" key={editor.id}>
                <div className="status-row">
                  <StatusPill>{editor.leader.tier}</StatusPill>
                </div>
                <h3>{editor.name}</h3>
                <p>{editor.specialties.join(" • ")}</p>
                <p>
                  <strong>Karma:</strong> {editor.karma.score} - <strong>Leader:</strong> {editor.leader.score} - <strong>Workload:</strong> {editor.workloadBand}
                </p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <aside className="board-stack">
          <SurfaceCard>
            <p className="section-label">Team workload</p>
            <InsightBars items={overviewSnapshot.workloadDistribution} />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">Invite funnel</p>
            <InsightBars items={overviewSnapshot.inviteFunnel} />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">Payout stages</p>
            <InsightBars items={overviewSnapshot.payoutStages} />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">WhatsApp setup</p>
            <AdminWhatsAppConnectionCard />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">YouTube delivery</p>
            <AdminYouTubeConnectionCard />
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
*/
  return <AdminLiveDashboard />;
}

export function AdminRolesSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Role access</p>
      <h2 className="section-heading">Admin owns the tenant playbook. Karma score protects trust. Leader score powers incentives and premium routing.</h2>
      <div className="brief-grid three-up">
        <div className="brief-card">
          <span className="meta-pill">Admin</span>
          <strong>Tenant owner</strong>
          <p className="muted-copy">Controls seats, managers, team invites, project posting, payout checkpoints, and public agency showcase.</p>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Manager</span>
          <strong>Queue operator</strong>
          <p className="muted-copy">Owns intake, quote review, assignment routing, delivery follow-up, and escalation visibility inside one tenant.</p>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Freelancer</span>
          <strong>Talent layer</strong>
          <p className="muted-copy">Can join multiple agencies, apply to matched project posts, and stay masked from direct client identity by default.</p>
        </div>
        {adminSnapshot.scoreModel.karma.map((rule) => (
          <div className="brief-card" key={rule.label}>
            <span className="meta-pill">Karma {rule.weight}%</span>
            <strong>{rule.label}</strong>
            <p className="muted-copy">{rule.note}</p>
          </div>
        ))}
        {adminSnapshot.scoreModel.leader.slice(0, 3).map((rule) => (
          <div className="brief-card" key={rule.label}>
            <span className="meta-pill">Leader {rule.weight}%</span>
            <strong>{rule.label}</strong>
            <p className="muted-copy">{rule.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminManagersSection() {
  return (
    <div className="dashboard-shell compact gx-clean-operating-page">
      <div className="board-list">
        <AdminCustomerPrivacyPanel />
      </div>
      <AdminManagerPermissionsPanel />
    </div>
  );
}

export function AdminFreelancersSection() {
  return (
    <div className="dashboard-shell compact gx-clean-operating-page">
      <HubAnchorTabs
        tabs={[
          { href: "#team-editors", label: "Team Editors", count: activeAgencyEditors.length },
          { href: "#service-approvals", label: "Service Approvals" },
          { href: "#team-invites", label: "Team Requests", count: editorInvites.length },
          { href: "#portfolio-requests", label: "Portfolio Requests", count: editorPortfolioRequests.length },
        ]}
      />
      <SurfaceCard>
        <p className="section-label" id="team-editors">
          Team editors
        </p>
        <SimpleDataTable
          columns={[
            {
              key: "editor",
              header: "Editor",
              render: (editor) => (
                <div>
                  <strong>{editor.name}</strong>
                  <span className="muted-copy">{editor.specialties.slice(0, 2).join(" / ")}</span>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (editor) => {
                const membership = editorAgencyMemberships.find((item) => item.agencyId === agency.id && item.editorId === editor.id);
                return <StatusPill>{membership?.status ?? "Requested"}</StatusPill>;
              },
            },
            { key: "workload", header: "Workload", render: (editor) => editor.workloadBand },
            { key: "karma", header: "Karma", render: (editor) => `${editor.karma.score} (${editor.karma.band})` },
            { key: "leader", header: "Leader", render: (editor) => `${editor.leader.score} (${editor.leader.tier})` },
            { key: "agencies", header: "Agencies", render: (editor) => editor.activeAgencyCount },
          ]}
          emptyLabel="No active team editors yet."
          getRowKey={(editor) => editor.id}
          rows={activeAgencyEditors}
        />
      </SurfaceCard>
      <AdminServiceApprovalsPanel />
    </div>
  );
}

function SubscriptionSectionTitle({
  badge,
  icon: Icon,
  subtitle,
  title,
}: {
  badge?: string;
  icon: LucideIcon;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="subscription-section-title">
      <div className="subscription-title-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={1.9} />
      </div>
      <div>
        {badge ? <span className="subscription-section-kicker">{badge}</span> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
  );
}

function SubscriptionStatCard({
  badge,
  description,
  icon,
  title,
}: {
  badge: string;
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  const Icon = icon;

  return (
    <article className="subscription-stat-card">
      <div className="subscription-stat-card-top">
        <span className="subscription-stat-badge">{badge}</span>
        <span className="subscription-stat-icon" aria-hidden="true">
          <Icon size={20} strokeWidth={1.9} />
        </span>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

function SubscriptionSectionContainer({
  badge,
  children,
  icon,
  subtitle,
  title,
}: {
  badge?: string;
  children: ReactNode;
  icon: LucideIcon;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="subscription-section-card">
      <SubscriptionSectionTitle badge={badge} icon={icon} subtitle={subtitle} title={title} />
      <div className="subscription-section-body">{children}</div>
    </section>
  );
}

function AdminServiceApprovalsPanel() {
  return (
    <div className="dashboard-grid gx-clean-two-column">
      <SurfaceCard>
        <p className="section-label" id="service-approvals">
          Pending service moderation
        </p>
        <AdminServiceModerationBoard />
      </SurfaceCard>
      <aside className="board-stack">
        <SurfaceCard>
          <p className="section-label" id="team-invites">
            Team requests
          </p>
          <SimpleDataTable
            columns={[
              { key: "agency", header: "Agency", render: (invite) => invite.agencyName },
              { key: "work", header: "Work type", render: (invite) => invite.workType },
              { key: "status", header: "Status", render: (invite) => <StatusPill>{invite.status}</StatusPill> },
            ]}
            emptyLabel="No team requests yet."
            getRowKey={(invite) => invite.id}
            rows={editorInvites}
          />
        </SurfaceCard>
        <SurfaceCard>
          <p className="section-label" id="portfolio-requests">
            Portfolio requests
          </p>
          <SimpleDataTable
            columns={[
              { key: "agency", header: "Agency", render: (request) => request.agencyName },
              { key: "summary", header: "Request", render: (request) => request.summary },
              { key: "status", header: "Status", render: (request) => <StatusPill>{request.status}</StatusPill> },
            ]}
            emptyLabel="No portfolio requests yet."
            getRowKey={(request) => request.id}
            rows={editorPortfolioRequests}
          />
        </SurfaceCard>
      </aside>
    </div>
  );
}

export function AdminServiceApprovalsSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Service approvals</p>
      <h2 className="section-heading">Admin can moderate freelancer listings for public discovery while still keeping team invites and portfolio requests visible in the same operating area.</h2>
      <AdminServiceApprovalsPanel />
    </div>
  );
}

export async function AdminPackagesSection() {
  const billedSeats = getActiveSeatUsage(agency.id);
  const session = await getSessionContext();
  const billingUserId = session.userId;
  const subscriptions = billingUserId
    ? await prisma.userSubscription.findMany({
        where: { userId: billingUserId },
        include: { package: true },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 12,
      })
    : [];
  const invoices = billingUserId
    ? await prisma.paymentTransaction.findMany({
        where: {
          userId: billingUserId,
          status: "SUCCESS",
        },
        include: {
          package: true,
          subscription: true,
        },
        orderBy: [{ paidAt: "desc" }, { updatedAt: "desc" }],
        take: 50,
      })
    : [];
  const activeSubscription = subscriptions.find((subscription) => subscription.status === "ACTIVE" || subscription.status === "TRIALING") ?? subscriptions[0];

  return (
    <div className="dashboard-shell compact subscription-page-shell">
      <div className="subscription-summary-grid">
        <SubscriptionStatCard
          badge={activeSubscription?.package.name ?? plan.planName}
          description={activeSubscription ? `Expires ${formatDateOnly(activeSubscription.expiresAt ?? activeSubscription.renewsAt)}` : `Renewal window: ${plan.renewalWindow}`}
          icon={Crown}
          title="Current tenant plan"
        />
        <SubscriptionStatCard
          badge={`${billedSeats}/${plan.seatLimit}`}
          description={`${plan.activeSeats - billedSeats + plan.invitedSeats} editors are still non-billable because they are not active seats yet.`}
          icon={Users}
          title="Billed seats"
        />
        <SubscriptionStatCard
          badge={`${plan.activeManagers}/${plan.managerLimit}`}
          description="Manager seats should scale with chat and assignment load, not just editor volume."
          icon={UserCog}
          title="Manager capacity"
        />
      </div>

      <SubscriptionSectionContainer
        badge="Billing status"
        icon={CreditCard}
        subtitle="Active package, expiry, and renewal records for this agency workspace."
        title="Subscription Activate"
      >
        <SimpleDataTable
          className="subscription-data-table"
          columns={[
            {
              key: "description",
              header: "Description",
              render: (subscription) => (
                <div>
                  <strong>{subscription.package.name}</strong>
                  <span className="muted-copy">
                    {subscription.status} - {subscription.billingInterval.replace(/_/g, " ")}
                  </span>
                </div>
              ),
            },
            {
              key: "price",
              header: "Price",
              render: (subscription) => formatCurrency(toNumber(subscription.amount)),
            },
            {
              key: "expireDate",
              header: "Expire Date",
              render: (subscription) => formatDateOnly(subscription.expiresAt ?? subscription.renewsAt),
            },
            {
              key: "total",
              header: "Total",
              render: (subscription) => formatCurrency(toNumber(subscription.amount)),
            },
          ]}
          emptyLabel="No subscription is active yet. Buy a package from pricing and it will appear here."
          getRowKey={(subscription) => subscription.id}
          rows={subscriptions}
        />
      </SubscriptionSectionContainer>

      <SubscriptionSectionContainer
        badge="Receipts"
        icon={ReceiptText}
        subtitle="Completed PhonePe payments appear here with downloadable invoice PDFs."
        title="Download Invoices"
      >
        <SimpleDataTable
          className="subscription-data-table"
          columns={[
            {
              key: "description",
              header: "Description",
              render: (invoice) => (
                <div>
                  <strong>{invoice.package.name}</strong>
                  <span className="muted-copy">
                    {formatPaymentProviderLabel(invoice.provider)} - {invoice.merchantOrderId ?? invoice.merchantTransactionId ?? invoice.id}
                  </span>
                </div>
              ),
            },
            {
              key: "price",
              header: "Price",
              render: (invoice) => formatCurrency(toNumber(invoice.amount)),
            },
            {
              key: "expireDate",
              header: "Expire Date",
              render: (invoice) => formatDateOnly(invoice.subscription?.expiresAt ?? invoice.subscription?.renewsAt),
            },
            {
              key: "total",
              header: "Total",
              render: (invoice) => (
                <div className="simple-table-actions">
                  <strong>{formatCurrency(toNumber(invoice.amount))}</strong>
                  <a className="simple-table-action" href={`/api/billing/invoices/${invoice.id}`}>
                    Download PDF
                  </a>
                </div>
              ),
            },
          ]}
          emptyLabel="No paid invoices yet. Completed PhonePe payments will be listed here."
          getRowKey={(invoice) => invoice.id}
          rows={invoices}
        />
      </SubscriptionSectionContainer>

      <SubscriptionSectionContainer
        badge="Plan options"
        icon={Package}
        subtitle="Compare available package models before choosing or changing a billing path."
        title="Available Packages"
      >
        <div className="subscription-package-grid">
          {adminPackageCards.map((card, index) => (
            <article className={index === 1 ? "subscription-package-card recommended" : "subscription-package-card"} key={card.title}>
              <div className="subscription-package-card-top">
                <span className="subscription-package-icon" aria-hidden="true">
                  <Package size={19} strokeWidth={1.9} />
                </span>
                <span className="subscription-package-badge">{index === 1 ? "Recommended" : "Available"}</span>
              </div>
              <h3>{card.title}</h3>
              <strong>{card.fee}</strong>
              <p>{card.note}</p>
            </article>
          ))}
        </div>
      </SubscriptionSectionContainer>
    </div>
  );
}

export function AdminAssignmentsSection() {
  return (
    <div className="dashboard-shell compact gx-clean-operating-page">
      <AdminWorkHubClient />
      <section id="delivery-review">
        <DeliveryReviewWorkspace audience="admin" detailHrefBase="/admin/delivery-review" portfolioHrefBase="/admin/portfolio-review" />
      </section>
    </div>
  );
}

export function AdminWalletReviewSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Payout control</p>
      <h2 className="section-heading">Payout safety is where the agency model becomes trustworthy. Admin can operate it, but the underlying rulebook stays platform-controlled.</h2>
      <div className="dashboard-grid">
        <SurfaceCard>
          <p className="section-label">Payout stage mix</p>
          <InsightBars items={adminSnapshot.payoutStages} />
        </SurfaceCard>
        <aside className="board-stack">
          <SurfaceCard>
            <div className="stack-list">
              <div className="bullet-row">
                <WalletCards size={16} strokeWidth={1.8} />
                <p>Assignment should not move into real work until the job reaches secured-for-editor status.</p>
              </div>
              <div className="bullet-row">
                <CreditCard size={16} strokeWidth={1.8} />
                <p>Agencies may collect money externally in v1, but editor release should still remain governed inside Gigxomi.</p>
              </div>
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}

export function AdminPayoutRequestsSection() {
  return <AdminPayoutAccountingClient />;
}

export function AdminMonetizationSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Monetization</p>
      <h2 className="section-heading">The agency business has two layers: SaaS monetization from seats and operations, plus editor monetization across all work sources.</h2>
      <div className="dashboard-grid">
        <SurfaceCard>
          <p className="section-label">Project mix</p>
          <InsightBars items={adminSnapshot.projectMix} />
        </SurfaceCard>
        <aside className="board-stack">
          <SurfaceCard>
            <div className="stack-list">
              <div className="bullet-row">
                <CreditCard size={16} strokeWidth={1.8} />
                <p>Agency plan can monetize setup, seats, managers, WhatsApp ops, and showcase access.</p>
              </div>
              <div className="bullet-row">
                <WalletCards size={16} strokeWidth={1.8} />
                <p>Editors remain on one Gigxomi-controlled monetization model whether the lead came from marketplace or agency routing.</p>
              </div>
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}

export async function AdminWhatsAppOnboardingSection({
  tenantId = "tenant-gigxomi",
  fallbackPhoneNumber,
  variant = "compact",
}: {
  tenantId?: string;
  fallbackPhoneNumber?: string | null;
  variant?: "compact" | "full";
} = {}) {
  const tenantConnection = await getWhatsAppConnectionStateFromFile(tenantId);

  if (variant === "compact") {
    return (
      <div className="dashboard-shell compact">
        <p className="eyebrow">WhatsApp API setup</p>
        <h2 className="section-heading">Setup WhatsApp</h2>
        <MetaPartnerTrustBanner />
        <AdminWhatsAppSetupPanel
          fallbackPhoneNumber={fallbackPhoneNumber}
          initialConnection={tenantConnection}
          tenantId={tenantId}
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">WhatsApp API setup</p>
      <h2 className="section-heading">Complete Meta onboarding, webhook verification, and delivery readiness only after the WhatsApp plugin is enabled from the integrations hub.</h2>
      <MetaPartnerTrustBanner />
      <div className="brief-grid two-up">
        <AdminWhatsAppConnectionCard fallbackPhoneNumber={fallbackPhoneNumber} initialConnection={tenantConnection} tenantId={tenantId} />
        <div className="brief-card">
          <span className="meta-pill">Checklist</span>
          <strong>Launch stack</strong>
          <p className="muted-copy">Business details, Meta signup, number connection, webhook handoff, and outbound test-send remain the go-live gates.</p>
        </div>
      </div>
      <AdminWhatsAppSetupPanel fallbackPhoneNumber={fallbackPhoneNumber} initialConnection={tenantConnection} tenantId={tenantId} />
      <SurfaceCard>
        <p className="section-label">Integration map</p>
        <div className="brief-grid three-up">
          {adminIntegrationCards.map((card) => (
            <div className="brief-card" key={card.title}>
              <div className="plugin-card-heading">
                <PluginBrandMark brand={card.brand} size="sm" />
                <div>
                  <span className="meta-pill">Integration</span>
                  <strong>{card.title}</strong>
                </div>
              </div>
              <p className="muted-copy">{card.note}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

export function AdminAnalyticsSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Analytics</p>
      <h2 className="section-heading">Analytics ties together lead flow, workload, and payout safety so admins can decide what to accept, route, or decline.</h2>
      <div className="metric-grid">
        {adminSnapshot.kpis.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="dashboard-grid">
        <SurfaceCard>
          <p className="section-label">Project mix</p>
          <InsightBars items={adminSnapshot.projectMix} />
        </SurfaceCard>
        <aside className="board-stack">
          <SurfaceCard>
            <p className="section-label">Workload distribution</p>
            <InsightBars items={adminSnapshot.workloadDistribution} />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">Invite funnel</p>
            <InsightBars items={adminSnapshot.inviteFunnel} />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">Payout stages</p>
            <InsightBars items={adminSnapshot.payoutStages} />
          </SurfaceCard>
        </aside>
      </div>

      <SurfaceCard>
        <p className="section-label">Active assignments</p>
        <div className="board-list">
          {activeAgencyProjects.map((project) => (
            <article className="lead-row" key={project.id}>
              <div className="status-row">
                <StatusPill>{project.openStatus}</StatusPill>
              </div>
              <h3>{project.title}</h3>
              <p>{project.specialty}</p>
              <p>
                <strong>Budget:</strong> {project.budgetRange} - <strong>Turnaround:</strong> {project.turnaround}
              </p>
              <p>
                <strong>Shortlist:</strong> {project.shortlistCount} - <strong>Matched editors:</strong> {project.matchedEditorIds.length}
              </p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

export function AdminShowcaseSection() {
  const publicAgency = agencyDirectoryCards.find((item) => item.id === agency.id) ?? agency;

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Showcase page</p>
      <h2 className="section-heading">Public agency visibility should help agencies hire editors and win clients without exposing the internal operating layer.</h2>
      <div className="board-list">
        <article className="lead-row">
          <div className="status-row">
            <StatusPill>{publicAgency.hiringStatus}</StatusPill>
          </div>
          <h3>{publicAgency.name}</h3>
          <p>{publicAgency.niche}</p>
          <p>
            <strong>Open opportunities:</strong> {publicAgency.openOpportunities} - <strong>Active services:</strong> {publicAgency.activeServices}
          </p>
          <p>{publicAgency.trustSummary}</p>
        </article>
      </div>
    </div>
  );
}

export function AdminBrandingSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Branding</p>
      <h2 className="section-heading">Agency owners need a client-facing identity, but the backend trust system should still run consistently across all tenants.</h2>
      <div className="brief-grid three-up">
        <div className="brief-card">
          <span className="meta-pill">Client-facing</span>
          <strong>Agency first</strong>
          <p className="muted-copy">Clients see the agency brand, number, and showcase rather than the platform operator layer.</p>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Editor privacy</span>
          <strong>Masked by default</strong>
          <p className="muted-copy">Editors can earn from the tenant without exposing personal phone number or direct identity to clients.</p>
        </div>
        <div className="brief-card">
          <span className="meta-pill">Trust continuity</span>
          <strong>Gigxomi governance stays underneath</strong>
          <p className="muted-copy">Karma, leader score, seat billing, and payout safety continue to run from the same platform rulebook.</p>
        </div>
      </div>
    </div>
  );
}

export function AdminAgencySettingsSection() {
  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Agency settings</p>
      <h2 className="section-heading">Admin settings should support growth without breaking trust: team activation rules, project gating, seat billing, and route masking.</h2>
      <div className="dashboard-grid">
        <SurfaceCard>
          <div className="stack-list">
            <div className="bullet-row">
              <ShieldCheck size={16} strokeWidth={1.8} />
              <p>Only active team members should become assignable. Invited and requested editors must stay outside active delivery flow.</p>
            </div>
            <div className="bullet-row">
              <Users size={16} strokeWidth={1.8} />
              <p>Project posts should be shown only to relevant editors based on specialty, workload, karma, and current team eligibility.</p>
            </div>
            <div className="bullet-row">
              <MessageCircleMore size={16} strokeWidth={1.8} />
              <p>Managers and editors can work the same opportunity, but client contact details stay hidden from editor view by default.</p>
            </div>
          </div>
        </SurfaceCard>
        <aside className="board-stack">
          <SurfaceCard>
            <p className="section-label">YouTube delivery channel</p>
            <AdminYouTubeConnectionCard />
          </SurfaceCard>
          <SurfaceCard>
            <p className="section-label">UPI payment setup</p>
            <AdminUpiSettingsPanel />
          </SurfaceCard>
        </aside>
      </div>
      <SurfaceCard>
        <p className="section-label">YouTube upload setup</p>
        <AdminYouTubeSetupPanel />
      </SurfaceCard>
    </div>
  );
}

export function AdminContactsSection() {
  return <ContactsTable audience="admin" />;
}

export { AdminChatSection } from "@/components/admin/admin-chat-section";
