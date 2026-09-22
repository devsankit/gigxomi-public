"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Play,
  RefreshCcw,
  Send,
  Smartphone,
  User,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/ui/dashboard-primitives";

type OverviewData = {
  stats: {
    totalNotifications: number;
    readNotifications: number;
    unreadNotifications: number;
    readRatePercent: number;
    avgTimeToReadMs: number;
    avgTimeToReadFormatted: string;
    deviceTokens: {
      total: number;
      android: number;
      ios: number;
      web: number;
      uniqueUsers: number;
    };
    dripStats: {
      total: number;
      sent: number;
      pending: number;
      failed: number;
      skipped: number;
    };
  };
  campaigns: Array<{
    id: string;
    name: string;
    trigger: string;
    audiences: string[];
    delayMinutes: number;
    cooldownMinutes: number;
    maxSendsPerUser: number;
    localWindowStart: string;
    localWindowEnd: string;
    titleTemplate: string;
    bodyTemplate: string;
    destination: string | null;
    isActive: boolean;
    _count?: { deliveries: number };
  }>;
  recentDripDeliveries: Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    trigger: string;
    userId: string;
    userName: string;
    userPhone: string;
    userRole: string;
    status: string;
    triggerKey: string;
    scheduledAt: string;
    sentAt: string | null;
    failedAt: string | null;
    error: string | null;
    metadata: Record<string, unknown>;
  }>;
  users: Array<{
    id: string;
    displayName: string;
    phone: string;
    email: string | null;
    role: string;
    workspaceMode: string | null;
    deviceTokenCount: number;
    dripDeliveriesCount: number;
  }>;
};

type UserTimelineData = {
  user: {
    id: string;
    displayName: string;
    phone: string;
    email: string | null;
    role: string;
    workspaceMode: string | null;
    tenantId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalReceived: number;
    readCount: number;
    unreadCount: number;
    readRatePercent: number;
    avgIntervalMs: number;
    avgIntervalFormatted: string;
    avgTimeToReadMs: number;
    avgTimeToReadFormatted: string;
    firstNotificationAt: string | null;
    lastNotificationAt: string | null;
  };
  deviceTokens: Array<{
    id: string;
    platform: string;
    isActive: boolean;
    tokenPreview: string;
    createdAt: string;
    updatedAt: string;
    lastSeenAt: string;
  }>;
  dripDeliveries: Array<{
    id: string;
    campaignName: string;
    trigger: string;
    status: string;
    scheduledAt: string;
    sentAt: string | null;
    failedAt: string | null;
    error: string | null;
    triggerKey: string;
  }>;
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    entityType: string | null;
    entityId: string | null;
    status: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    readAt: string | null;
    intervalMs: number;
    intervalFormatted: string;
    timeToReadMs: number | null;
    timeToReadFormatted: string;
  }>;
};

type ActiveTab = "user-explorer" | "drip-campaigns" | "send-push";

function formatTimestamp(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function SuperAdminPushNotificationsConsole({
  initialOverview,
}: {
  initialOverview?: OverviewData | null;
}) {
  const [overview, setOverview] = useState<OverviewData | null>(initialOverview ?? null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("user-explorer");
  const [isLoadingOverview, setIsLoadingOverview] = useState(!initialOverview);
  const [overviewError, setOverviewError] = useState("");

  // User timeline state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [userTimeline, setUserTimeline] = useState<UserTimelineData | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  // Push sender form state
  const [sendTargetMode, setSendTargetMode] = useState<"user" | "audience">("audience");
  const [sendTargetUserId, setSendTargetUserId] = useState("");
  const [sendAudience, setSendAudience] = useState<"both" | "agency" | "freelancer" | "editor" | "all">("both");
  const [sendPlatform, setSendPlatform] = useState<"all" | "mobile" | "web">("all");
  const [sendTitle, setSendTitle] = useState("Gigxomi update");
  const [sendMessage, setSendMessage] = useState("");
  const [sendDeepLink, setSendDeepLink] = useState("/notifications");
  const [isSending, setIsSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // Drip evaluation trigger
  const [isRunningDrip, setIsRunningDrip] = useState(false);
  const [dripRunResult, setDripRunResult] = useState<string | null>(null);

  async function fetchOverview() {
    setIsLoadingOverview(true);
    setOverviewError("");
    try {
      const res = await fetch("/api/super-admin/push-notifications/overview", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to load overview.");
      }
      setOverview(data);
      if (!selectedUserId && data.users?.length > 0) {
        setSelectedUserId(data.users[0].id);
      }
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : "Failed to load push overview.");
    } finally {
      setIsLoadingOverview(false);
    }
  }

  async function fetchUserTimeline(userId: string) {
    if (!userId) return;
    setIsLoadingTimeline(true);
    setTimelineError("");
    try {
      const res = await fetch(`/api/super-admin/push-notifications/user/${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to load user notification timeline.");
      }
      setUserTimeline(data);
    } catch (err) {
      setTimelineError(err instanceof Error ? err.message : "Failed to load user timeline.");
    } finally {
      setIsLoadingTimeline(false);
    }
  }

  async function handleSendPush(e: React.FormEvent) {
    e.preventDefault();
    if (!sendMessage.trim()) return;
    setIsSending(true);
    setSendFeedback(null);
    try {
      const res = await fetch("/api/super-admin/push-notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMode: sendTargetMode,
          targetUserId: sendTargetMode === "user" ? sendTargetUserId : undefined,
          audience: sendAudience,
          platform: sendPlatform,
          title: sendTitle,
          message: sendMessage,
          deepLinkUrl: sendDeepLink,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to dispatch notification.");
      }
      setSendFeedback({
        tone: "success",
        text: data.message || `Dispatched to ${data.recipientsCount} recipient(s).`,
      });
      setSendMessage("");
      void fetchOverview();
      if (selectedUserId) {
        void fetchUserTimeline(selectedUserId);
      }
    } catch (err) {
      setSendFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "Failed to send notification.",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function handleRunDripCycle() {
    setIsRunningDrip(true);
    setDripRunResult(null);
    try {
      const res = await fetch("/api/super-admin/drip-campaigns/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Drip campaign execution failed.");
      }
      setDripRunResult(data.message);
      void fetchOverview();
    } catch (err) {
      setDripRunResult(`Error: ${err instanceof Error ? err.message : "Execution failed"}`);
    } finally {
      setIsRunningDrip(false);
    }
  }

  useEffect(() => {
    if (!initialOverview) {
      void fetchOverview();
    } else if (initialOverview.users?.length && !selectedUserId) {
      setSelectedUserId(initialOverview.users[0].id);
    }
  }, [initialOverview]);

  useEffect(() => {
    if (selectedUserId) {
      void fetchUserTimeline(selectedUserId);
    }
  }, [selectedUserId]);

  const filteredUsers = useMemo(() => {
    if (!overview?.users) return [];
    if (!userSearch.trim()) return overview.users;
    const q = userSearch.toLowerCase();
    return overview.users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q),
    );
  }, [overview?.users, userSearch]);

  const stats = overview?.stats;

  return (
    <div className="dashboard-shell compact">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="eyebrow">Communications & Retention</p>
          <h2 className="section-heading">Push Notifications & Drip Campaign Intelligence</h2>
          <p style={{ color: "#94A3B8", fontSize: "0.875rem", marginTop: "-0.5rem" }}>
            Inspect exact per-user notification delivery cadences, read rates, registered device tokens, and manage automated onboarding drip triggers.
          </p>
        </div>

        <button
          className="freelancer-secondary-button"
          disabled={isLoadingOverview}
          onClick={() => {
            void fetchOverview();
            if (selectedUserId) void fetchUserTimeline(selectedUserId);
          }}
          type="button"
          style={{ minWidth: "130px" }}
        >
          <RefreshCcw className={isLoadingOverview ? "spin" : ""} size={15} strokeWidth={1.8} />
          {isLoadingOverview ? "Refreshing..." : "Refresh Feed"}
        </button>
      </div>

      {overviewError ? (
        <div style={{ padding: "0.85rem", borderRadius: "8px", background: "#7F1D1D26", border: "1px solid #EF4444", color: "#FCA5A5", fontSize: "0.875rem" }}>
          {overviewError}
        </div>
      ) : null}

      {/* Global Performance Metrics */}
      <div className="metric-grid">
        <MetricCard label="Total delivered alerts" value={stats ? String(stats.totalNotifications) : "..."} />
        <MetricCard
          label="Global read rate"
          value={stats ? `${stats.readRatePercent}% (${stats.readNotifications} read)` : "..."}
        />
        <MetricCard label="Avg time to read" value={stats?.avgTimeToReadFormatted || "..."} />
        <MetricCard
          label="Active push devices"
          value={
            stats
              ? `${stats.deviceTokens.total} (${stats.deviceTokens.android} Android, ${stats.deviceTokens.web} Web)`
              : "..."
          }
        />
        <MetricCard label="Active drip campaigns" value={overview ? String(overview.campaigns.length) : "..."} />
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #1E293B", paddingBottom: "0.75rem", marginTop: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("user-explorer")}
          className={activeTab === "user-explorer" ? "freelancer-primary-button" : "freelancer-secondary-button"}
          type="button"
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
        >
          <User size={15} />
          Per-User Notification Explorer
        </button>
        <button
          onClick={() => setActiveTab("drip-campaigns")}
          className={activeTab === "drip-campaigns" ? "freelancer-primary-button" : "freelancer-secondary-button"}
          type="button"
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
        >
          <Flame size={15} />
          Drip Campaigns & Deliveries
        </button>
        <button
          onClick={() => setActiveTab("send-push")}
          className={activeTab === "send-push" ? "freelancer-primary-button" : "freelancer-secondary-button"}
          type="button"
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
        >
          <Send size={15} />
          Send Push Notification
        </button>
      </div>

      {/* TAB 1: PER-USER NOTIFICATION EXPLORER */}
      {activeTab === "user-explorer" ? (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem", marginTop: "1rem" }}>
          {/* Left User Selection Sidebar */}
          <section className="brief-card" style={{ height: "fit-content" }}>
            <span className="meta-pill">Target recipient</span>
            <strong style={{ display: "block", marginBottom: "0.75rem" }}>Select User to Inspect</strong>

            <input
              className="freelancer-field"
              placeholder="Search by name, phone, role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: "100%", padding: "0.55rem 0.75rem", marginBottom: "0.75rem", borderRadius: "6px", background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC" }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "550px", overflowY: "auto" }}>
              {filteredUsers.map((u) => {
                const isSelected = u.id === selectedUserId;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    type="button"
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "6px",
                      background: isSelected ? "#1E293B" : "#0B1118",
                      border: isSelected ? "1px solid #38BDF8" : "1px solid #1E293B",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: isSelected ? "#38BDF8" : "#F8FAFC", fontSize: "0.875rem" }}>
                        {u.displayName}
                      </span>
                      <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", borderRadius: "4px", background: "#334155", color: "#94A3B8" }}>
                        {u.role}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#64748B" }}>{u.phone}</span>
                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.7rem", color: "#94A3B8", marginTop: "0.1rem" }}>
                      {u.deviceTokenCount > 0 ? (
                        <span style={{ color: "#4ADE80", display: "flex", alignItems: "center", gap: "3px" }}>
                          <Smartphone size={11} /> {u.deviceTokenCount} device{u.deviceTokenCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span style={{ color: "#64748B" }}>No active device</span>
                      )}
                      {u.dripDeliveriesCount > 0 ? (
                        <span style={{ color: "#F59E0B" }}>• {u.dripDeliveriesCount} drip{u.dripDeliveriesCount > 1 ? "s" : ""}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 ? (
                <p style={{ color: "#64748B", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>No users match search.</p>
              ) : null}
            </div>
          </section>

          {/* Right User Notification Cadence & History */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {isLoadingTimeline ? (
              <div className="brief-card" style={{ textAlign: "center", padding: "3rem" }}>
                <Activity className="spin" size={24} style={{ margin: "0 auto 0.5rem auto", color: "#38BDF8" }} />
                <p style={{ color: "#94A3B8" }}>Loading recipient notification stream and intervals...</p>
              </div>
            ) : timelineError ? (
              <div className="brief-card" style={{ color: "#FCA5A5", background: "#7F1D1D26", border: "1px solid #EF4444" }}>
                {timelineError}
              </div>
            ) : userTimeline ? (
              <>
                {/* User Header & Device Summary */}
                <section className="brief-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div>
                      <span className="meta-pill">{userTimeline.user.role} profile</span>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0.2rem 0" }}>{userTimeline.user.displayName}</h3>
                      <p style={{ color: "#94A3B8", fontSize: "0.85rem", margin: 0 }}>
                        {userTimeline.user.phone} {userTimeline.user.email ? `• ${userTimeline.user.email}` : ""} • Joined {formatTimestamp(userTimeline.user.createdAt)}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="freelancer-secondary-button"
                        onClick={() => {
                          setSendTargetMode("user");
                          setSendTargetUserId(userTimeline.user.id);
                          setActiveTab("send-push");
                        }}
                        type="button"
                        style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                      >
                        <Send size={13} />
                        Send Direct Push
                      </button>
                    </div>
                  </div>

                  {/* Device Push Tokens */}
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #1E293B", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>Push devices:</span>
                    {userTimeline.deviceTokens.length > 0 ? (
                      userTimeline.deviceTokens.map((token) => (
                        <div
                          key={token.id}
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "4px",
                            background: token.isActive ? "#064E3B40" : "#1E293B",
                            border: token.isActive ? "1px solid #059669" : "1px solid #334155",
                            color: token.isActive ? "#34D399" : "#94A3B8",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                          }}
                        >
                          <Smartphone size={12} />
                          <strong style={{ textTransform: "capitalize" }}>{token.platform}</strong>
                          <span style={{ opacity: 0.8 }}>({token.tokenPreview})</span>
                          <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>• Active {formatTimestamp(token.lastSeenAt)}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "#F59E0B" }}>⚠️ No registered device tokens yet. (Web in-app alerts active)</span>
                    )}
                  </div>
                </section>

                {/* User Cadence & Engagement Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                  <div className="app-panel app-metric-card metric-card">
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Total alerts received</span>
                    <strong style={{ fontSize: "1.4rem" }}>{userTimeline.stats.totalReceived}</strong>
                  </div>
                  <div className="app-panel app-metric-card metric-card">
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>User read rate</span>
                    <strong style={{ fontSize: "1.4rem", color: userTimeline.stats.readRatePercent > 50 ? "#4ADE80" : "#F8FAFC" }}>
                      {userTimeline.stats.readRatePercent}%
                    </strong>
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>
                      {userTimeline.stats.readCount} read / {userTimeline.stats.unreadCount} unread
                    </span>
                  </div>
                  <div className="app-panel app-metric-card metric-card">
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Average cadence / gap</span>
                    <strong style={{ fontSize: "1.4rem", color: "#38BDF8" }}>
                      {userTimeline.stats.avgIntervalFormatted || "N/A"}
                    </strong>
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Avg time between consecutive alerts</span>
                  </div>
                  <div className="app-panel app-metric-card metric-card">
                    <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>Avg time to open / read</span>
                    <strong style={{ fontSize: "1.4rem" }}>
                      {userTimeline.stats.avgTimeToReadFormatted || "N/A"}
                    </strong>
                    <span style={{ fontSize: "0.7rem", color: "#64748B" }}>Elapsed time before opening app</span>
                  </div>
                </div>

                {/* Notification Timeline */}
                <section className="brief-card">
                  <span className="meta-pill">Chronological timeline</span>
                  <strong style={{ display: "block", marginBottom: "1rem" }}>
                    Notification Stream ({userTimeline.timeline.length} events)
                  </strong>

                  {userTimeline.timeline.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748B" }}>
                      <Bell size={28} style={{ margin: "0 auto 0.5rem auto", opacity: 0.5 }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>No notifications recorded for this user yet.</p>
                      <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        Broadcast a notification or trigger an automated qualification drip to evaluate this user.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {userTimeline.timeline.map((notif, idx) => {
                        const isRead = notif.status === "READ";
                        return (
                          <div
                            key={notif.id}
                            style={{
                              padding: "0.85rem 1rem",
                              borderRadius: "8px",
                              background: isRead ? "#0F172A" : "#131C2E",
                              border: isRead ? "1px solid #1E293B" : "1px solid #2563EB40",
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.45rem",
                              position: "relative",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "4px",
                                    background: "#1E293B",
                                    color: "#38BDF8",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.03em",
                                  }}
                                >
                                  {notif.type}
                                </span>

                                {/* Duration interval badge */}
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    padding: "0.15rem 0.5rem",
                                    borderRadius: "4px",
                                    background: "#0284C720",
                                    color: "#38BDF8",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <Clock size={11} />
                                  {notif.intervalFormatted}
                                </span>

                                <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                                  {formatTimestamp(notif.createdAt)}
                                </span>
                              </div>

                              {/* Read Status Badge */}
                              {isRead ? (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "4px",
                                    background: "#064E3B40",
                                    border: "1px solid #059669",
                                    color: "#34D399",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontWeight: 600,
                                  }}
                                >
                                  <CheckCircle2 size={12} />
                                  {notif.timeToReadFormatted}
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "4px",
                                    background: "#33415540",
                                    border: "1px solid #475569",
                                    color: "#94A3B8",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <AlertCircle size={12} />
                                  Unread
                                </span>
                              )}
                            </div>

                            <div style={{ marginTop: "0.2rem" }}>
                              <strong style={{ fontSize: "0.95rem", color: "#F8FAFC" }}>{notif.title}</strong>
                              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#CBD5E1", lineHeight: 1.45 }}>
                                {notif.message}
                              </p>
                            </div>

                            {notif.entityType || notif.metadata?.deepLinkUrl ? (
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.75rem", color: "#64748B", marginTop: "0.2rem" }}>
                                <span>Entity: {notif.entityType || "general"}</span>
                                {Boolean(notif.metadata?.deepLinkUrl) ? (
                                  <span style={{ display: "flex", alignItems: "center", gap: "2px", color: "#38BDF8" }}>
                                    <ExternalLink size={11} />
                                    {String(notif.metadata.deepLinkUrl)}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* TAB 2: DRIP CAMPAIGNS & DELIVERIES */}
      {activeTab === "drip-campaigns" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
          {/* Action Header */}
          <section className="brief-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span className="meta-pill">Automated sequences</span>
              <strong style={{ fontSize: "1.1rem", display: "block", marginTop: "0.2rem" }}>Connected Platform Drip Engines</strong>
              <p style={{ color: "#94A3B8", fontSize: "0.85rem", margin: 0 }}>
                Drip triggers evaluate profile completion, missed work, low trust scores, and training progress to send timed nudge sequences.
              </p>
            </div>

            <button
              className="freelancer-primary-button"
              disabled={isRunningDrip}
              onClick={() => void handleRunDripCycle()}
              type="button"
            >
              <Play size={15} />
              {isRunningDrip ? "Evaluating Candidates..." : "Run Drip Evaluation Cycle Now"}
            </button>
          </section>

          {dripRunResult ? (
            <div style={{ padding: "0.85rem", borderRadius: "8px", background: "#064E3B40", border: "1px solid #059669", color: "#34D399", fontSize: "0.875rem" }}>
              {dripRunResult}
            </div>
          ) : null}

          {/* Drip Campaigns Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            {overview?.campaigns.map((camp) => (
              <section key={camp.id} className="brief-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <div>
                    <span className="meta-pill">{camp.trigger}</span>
                    <strong style={{ display: "block", fontSize: "1rem", marginTop: "0.3rem" }}>{camp.name}</strong>
                  </div>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      background: camp.isActive ? "#064E3B40" : "#334155",
                      color: camp.isActive ? "#34D399" : "#94A3B8",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {camp.isActive ? "ACTIVE" : "PAUSED"}
                  </span>
                </div>

                <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "6px", background: "#0F172A", border: "1px solid #1E293B" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "#F8FAFC" }}>{camp.titleTemplate}</p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#94A3B8" }}>{camp.bodyTemplate}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.75rem", color: "#94A3B8" }}>
                  <div><strong>Audiences:</strong> {camp.audiences.join(", ") || "All"}</div>
                  <div><strong>Max sends:</strong> {camp.maxSendsPerUser} per user</div>
                  <div><strong>Initial delay:</strong> {camp.delayMinutes / 60}h</div>
                  <div><strong>Cooldown:</strong> {camp.cooldownMinutes / 60}h</div>
                  <div><strong>Local window:</strong> {camp.localWindowStart} - {camp.localWindowEnd}</div>
                  <div><strong>Total sends:</strong> {camp._count?.deliveries ?? 0} deliveries</div>
                </div>
              </section>
            ))}
          </div>

          {/* Recent Drip Deliveries Table */}
          <section className="brief-card">
            <span className="meta-pill">Live execution logs</span>
            <strong style={{ display: "block", marginBottom: "0.75rem" }}>Recent Drip Deliveries ({overview?.recentDripDeliveries.length ?? 0})</strong>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155", color: "#94A3B8" }}>
                    <th style={{ padding: "0.5rem" }}>Recipient</th>
                    <th style={{ padding: "0.5rem" }}>Campaign</th>
                    <th style={{ padding: "0.5rem" }}>Status</th>
                    <th style={{ padding: "0.5rem" }}>Scheduled</th>
                    <th style={{ padding: "0.5rem" }}>Sent At</th>
                    <th style={{ padding: "0.5rem" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.recentDripDeliveries.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #1E293B" }}>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <strong style={{ color: "#F8FAFC" }}>{d.userName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{d.userPhone} ({d.userRole})</div>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <span style={{ color: "#38BDF8" }}>{d.campaignName}</span>
                        <div style={{ fontSize: "0.7rem", color: "#64748B" }}>Trigger: {d.trigger}</div>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <span
                          style={{
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: d.status === "SENT" ? "#064E3B40" : d.status === "FAILED" ? "#7F1D1D26" : "#1E293B",
                            color: d.status === "SENT" ? "#34D399" : d.status === "FAILED" ? "#FCA5A5" : "#94A3B8",
                          }}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#94A3B8", fontSize: "0.75rem" }}>
                        {formatTimestamp(d.scheduledAt)}
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#94A3B8", fontSize: "0.75rem" }}>
                        {d.sentAt ? formatTimestamp(d.sentAt) : "-"}
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#64748B", fontSize: "0.75rem" }}>
                        {d.error ? <span style={{ color: "#EF4444" }}>{d.error}</span> : d.triggerKey}
                      </td>
                    </tr>
                  ))}
                  {!overview?.recentDripDeliveries.length ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "1.5rem", textAlign: "center", color: "#64748B" }}>
                        No drip deliveries recorded yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB 3: SEND PUSH NOTIFICATION */}
      {activeTab === "send-push" ? (
        <div style={{ maxWidth: "700px", margin: "1rem auto 0 auto" }}>
          <section className="brief-card">
            <span className="meta-pill">Dispatch center</span>
            <strong style={{ fontSize: "1.1rem", display: "block", marginBottom: "0.25rem" }}>Broadcast or Direct Push Dispatch</strong>
            <p style={{ color: "#94A3B8", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
              Dispatches Firebase Cloud Messaging push notifications and immediately records in-app notifications so they appear in user drawers and read tracking reports.
            </p>

            <form onSubmit={handleSendPush} className="freelancer-form-grid marketing-form-grid">
              {/* Target Mode */}
              <div className="freelancer-field freelancer-field-full">
                <span>Dispatch Mode</span>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="targetMode"
                      checked={sendTargetMode === "audience"}
                      onChange={() => setSendTargetMode("audience")}
                    />
                    Audience Segment
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="targetMode"
                      checked={sendTargetMode === "user"}
                      onChange={() => setSendTargetMode("user")}
                    />
                    Specific User
                  </label>
                </div>
              </div>

              {sendTargetMode === "audience" ? (
                <label className="freelancer-field">
                  <span>Audience</span>
                  <select
                    value={sendAudience}
                    onChange={(e) => setSendAudience(e.target.value as "both" | "agency" | "freelancer" | "editor" | "all")}
                  >
                    <option value="both">Freelancers + Editors</option>
                    <option value="agency">Agencies & Managers</option>
                    <option value="freelancer">Freelancers Only</option>
                    <option value="editor">Editors Only</option>
                    <option value="all">Everyone</option>
                  </select>
                </label>
              ) : (
                <label className="freelancer-field">
                  <span>Select Specific User</span>
                  <select
                    value={sendTargetUserId}
                    onChange={(e) => setSendTargetUserId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {overview?.users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName} ({u.phone} • {u.role})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="freelancer-field">
                <span>Device Platform</span>
                <select
                  value={sendPlatform}
                  onChange={(e) => setSendPlatform(e.target.value as "all" | "mobile" | "web")}
                >
                  <option value="all">Phones + Web</option>
                  <option value="mobile">Phones Only (Android/iOS)</option>
                  <option value="web">Web Only</option>
                </select>
              </label>

              <label className="freelancer-field freelancer-field-full">
                <span>Notification Title</span>
                <input
                  value={sendTitle}
                  onChange={(e) => setSendTitle(e.target.value)}
                  placeholder="e.g. Gigxomi Important Update"
                  required
                />
              </label>

              <label className="freelancer-field freelancer-field-full">
                <span>Notification Message</span>
                <textarea
                  rows={4}
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="Write the message that will display in phone push banner and in-app drawer..."
                  required
                />
              </label>

              <label className="freelancer-field freelancer-field-full">
                <span>Target Deep Link URL</span>
                <input
                  value={sendDeepLink}
                  onChange={(e) => setSendDeepLink(e.target.value)}
                  placeholder="/notifications, /projects, /chats, etc."
                />
              </label>

              <div className="package-form-actions freelancer-field-full" style={{ marginTop: "0.5rem" }}>
                <button
                  className="freelancer-primary-button"
                  disabled={isSending || !sendMessage.trim()}
                  type="submit"
                >
                  <Send size={15} />
                  {isSending ? "Dispatching Push..." : "Send Notification Now"}
                </button>
              </div>
            </form>

            {sendFeedback ? (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.85rem",
                  borderRadius: "6px",
                  background: sendFeedback.tone === "success" ? "#064E3B40" : "#7F1D1D26",
                  border: sendFeedback.tone === "success" ? "1px solid #059669" : "1px solid #EF4444",
                  color: sendFeedback.tone === "success" ? "#34D399" : "#FCA5A5",
                  fontSize: "0.875rem",
                }}
              >
                {sendFeedback.text}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
