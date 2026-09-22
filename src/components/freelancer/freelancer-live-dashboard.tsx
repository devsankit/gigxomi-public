"use client";

import { BadgeCheck, Clock3, Eye, FolderCheck, Send, ShieldCheck, Smartphone, Sparkles, Target, TrendingUp, Users2, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type FreelancerDashboardPayload = {
  ok: boolean;
  stats: {
    projectsDone: number;
    workingWithAgencies: number;
    serviceViews: number;
    applicationsAccepted?: number;
    applicationsRejected?: number;
    applicationsShortlisted?: number;
    applicationsSubmitted?: number;
    applicationSelectionRate?: number;
    averageApplyResponseHours?: number;
  };
};

type TrustPayload = {
  snapshot: {
    score: number;
    provisional: boolean;
    completedAssignments: number;
    nextAction: string | null;
    components: Record<string, { points: number; max: number }>;
  };
  events: Array<{ id: string; component: string; delta: number; reason: string; occurredAt: string; status: string; dispute?: { status: string } | null }>;
  preferences: { trustImprovementNotifications: boolean };
};

const trustLabels: Record<string, string> = { assessment: "Qualification", profile: "Profile", portfolio: "Portfolio", identity: "Identity", reliability: "Workload reliability", onTime: "On-time delivery", response: "Response speed", updates: "Progress updates", rating: "Agency rating" };
const nextActionLabels: Record<string, string> = { COMPLETE_SERVICE: "Complete your editor service", COMPLETE_ASSESSMENT: "Complete your qualification", COMPLETE_PROFILE: "Complete your profile", REVISE_PORTFOLIO: "Revise your portfolio", VERIFY_IDENTITY: "Verify your identity", RESPOND_TO_ASSIGNMENT: "Respond to your assignment", POST_PROGRESS_UPDATE: "Post a work update", COMPLETE_RELIABLE_WORK: "Complete three reliable assignments" };

const defaultPayload: FreelancerDashboardPayload = {
  ok: true,
  stats: {
    projectsDone: 0,
    workingWithAgencies: 0,
    serviceViews: 0,
    applicationsAccepted: 0,
    applicationsRejected: 0,
    applicationsShortlisted: 0,
    applicationsSubmitted: 0,
    applicationSelectionRate: 0,
    averageApplyResponseHours: 0,
  },
};

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="freelancer-stat-card freelancer-stat-card-compact">
      <div className="freelancer-stat-card-head">
        <span className="freelancer-stat-card-icon">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className="section-label">{label}</span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export function FreelancerLiveDashboard() {
  const [data, setData] = useState<FreelancerDashboardPayload>(defaultPayload);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trust, setTrust] = useState<TrustPayload | null>(null);

  async function refreshTrust() {
    const response = await fetch("/api/freelancer/trust", { cache: "no-store" });
    const payload = (await response.json()) as TrustPayload;
    if (response.ok) setTrust(payload);
  }

  async function disputeTrustEvent(eventId: string) {
    const reason = window.prompt("Explain which fact is incorrect. Gigxomi will freeze this score change during review.");
    if (!reason?.trim()) return;
    const response = await fetch("/api/freelancer/trust/disputes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, reason }) });
    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error ?? "The dispute could not be submitted.");
      return;
    }
    await refreshTrust();
  }

  async function setTrustNotifications(enabled: boolean) {
    const response = await fetch("/api/freelancer/onboarding", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignOptOut: !enabled }) });
    if (response.ok) setTrust((current) => current ? { ...current, preferences: { trustImprovementNotifications: enabled } } : current);
  }

  useEffect(() => {
    let active = true;

    Promise.all([fetch("/api/freelancer/dashboard", { cache: "no-store" }), fetch("/api/freelancer/trust", { cache: "no-store" })])
      .then(async ([dashboardResponse, trustResponse]) => {
        const payload = (await dashboardResponse.json()) as FreelancerDashboardPayload;
        const trustPayload = (await trustResponse.json()) as TrustPayload;
        if (!dashboardResponse.ok) {
          throw new Error("Freelancer dashboard could not load right now.");
        }

        if (!active) {
          return;
        }

        setData(payload);
        if (trustResponse.ok) setTrust(trustPayload);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError("Dashboard metrics are syncing. Please refresh in a moment.");
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
      <div className="freelancer-app-stack freelancer-dashboard-live compact-kpi-only">
        <section className="freelancer-app-panel freelancer-dashboard-summary">
          <div className="freelancer-section-head">
            <div>
              <p className="section-label">Dashboard</p>
              <h2>Live freelancer performance snapshot.</h2>
            </div>
          </div>

          {error ? <p className="public-auth-error compact">{error}</p> : null}

          <div className="freelancer-dashboard-metric-grid compact-three">
            <MetricCard icon={FolderCheck} label="Projects done" note="Completed projects delivered successfully." value={String(data.stats.projectsDone)} />
            <MetricCard icon={Users2} label="Working with agencies" note="Active agency memberships currently live." value={String(data.stats.workingWithAgencies)} />
            <MetricCard icon={Eye} label="Service views" note="Public views tracked on your listed services." value={String(data.stats.serviceViews)} />
            <MetricCard icon={Send} label="Applications sent" note="Marketplace work applications submitted." value={String(data.stats.applicationsSubmitted ?? 0)} />
            <MetricCard icon={BadgeCheck} label="Selected work" note="Applications accepted into assignment history." value={String(data.stats.applicationsAccepted ?? 0)} />
            <MetricCard icon={Target} label="Selection rate" note="Selection rate from submitted applications." value={`${data.stats.applicationSelectionRate ?? 0}%`} />
            <MetricCard icon={Clock3} label="Apply response" note="Average time from work post to your application." value={`${data.stats.averageApplyResponseHours ?? 0}h`} />
          </div>

          {trust ? <section className="freelancer-trust-score-panel">
            <div className="freelancer-trust-score-main">
              <div className="freelancer-trust-score-ring" style={{ "--trust-progress": `${trust.snapshot.score * 3.6}deg` } as React.CSSProperties}>
                <span><strong>{trust.snapshot.score}</strong>/100</span>
              </div>
              <div><p className="section-label">Gigxomi Trust Score</p><h3>{trust.snapshot.provisional ? "Provisional editor profile" : "Established editor profile"}</h3><p>{trust.snapshot.provisional ? `${trust.snapshot.completedAssignments}/3 assignments completed before the score becomes established.` : "Calculated from your recent qualification, delivery and agency signals."}</p>{trust.snapshot.nextAction ? <a href={["COMPLETE_SERVICE", "COMPLETE_ASSESSMENT", "COMPLETE_PROFILE", "VERIFY_IDENTITY"].includes(trust.snapshot.nextAction) ? "/freelancer/onboarding" : trust.snapshot.nextAction === "REVISE_PORTFOLIO" ? "/freelancer/services" : "/freelancer/apply-for-work"}><TrendingUp size={15} /> Next: {nextActionLabels[trust.snapshot.nextAction] ?? trust.snapshot.nextAction}</a> : null}</div>
            </div>
            <div className="freelancer-trust-components">{Object.entries(trust.snapshot.components).map(([key, component]) => <div key={key}><span>{trustLabels[key] ?? key}<b>{component.points}/{component.max}</b></span><i><em style={{ width: `${component.max ? (component.points / component.max) * 100 : 0}%` }} /></i></div>)}</div>
            {trust.events.length ? <div className="freelancer-trust-history"><strong>Recent score movement</strong>{trust.events.slice(0, 5).map((event) => <div key={event.id}><ShieldCheck size={14} /><span>{event.reason}<small>{new Date(event.occurredAt).toLocaleDateString("en-IN")}</small></span><b className={event.delta >= 0 ? "positive" : "negative"}>{event.delta >= 0 ? "+" : ""}{event.delta}</b>{event.delta < 0 && event.status === "APPLIED" && !event.dispute ? <button onClick={() => void disputeTrustEvent(event.id)} type="button">Dispute</button> : event.dispute ? <em>{event.dispute.status}</em> : null}</div>)}</div> : null}
            <label className="freelancer-trust-notification-toggle"><input checked={trust.preferences.trustImprovementNotifications} onChange={(event) => void setTrustNotifications(event.target.checked)} type="checkbox" /><span>Daily Trust improvement reminders</span></label>
          </section> : null}

          <div className="freelancer-dashboard-karma-panel">
            <Sparkles size={18} />
            <div>
              <strong>Your Trust Score is evidence-led.</strong>
              <p>
                Gigxomi uses assignment response, on-time delivery, progress updates and structured agency feedback. Private chat wording is never analyzed.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "20px 24px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(204, 255, 0, 0.08) 0%, rgba(14, 18, 15, 0.95) 100%)",
              border: "1px solid rgba(204, 255, 0, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", maxWidth: "620px" }}>
              <span
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(204, 255, 0, 0.15)",
                  border: "1px solid rgba(204, 255, 0, 0.35)",
                  color: "#ccff00",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <Smartphone size={22} />
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>Gigxomi Mobile App for Editors</strong>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "#ccff00",
                      color: "#080b09",
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                    }}
                  >
                    PLAY STORE
                  </span>
                </div>
                <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  Get real-time push alerts for new project invitations, client feedback, file approvals, and instant payout notifications right on your phone.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
              <a
                href="https://play.google.com/store/apps/details?id=com.gigxomi.app"
                target="_blank"
                rel="noreferrer"
                className="internal-play-store-btn"
                title="Download Gigxomi on Google Play Store"
              >
                <svg className="internal-play-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="#4285F4" d="M3.6 1.8L13.5 12 3.6 22.2c-.4-.3-.6-.8-.6-1.4V3.2c0-.6.2-1.1.6-1.4z" />
                  <path fill="#FBBC04" d="M16.8 8.7L4.7 1.8c-.3-.2-.7-.2-1.1 0l9.9 10.2 3.3-3.3z" />
                  <path fill="#0F9D58" d="M16.8 15.3l-3.3-3.3-9.9 10.2c.4.2.8.2 1.1 0l12.1-6.9z" />
                  <path fill="#EA4335" d="M20.8 10.4l-4 2.3-3.3-3.3 3.3-3.3 4 2.3c.7.4.7 1.6 0 2z" />
                </svg>
                <div className="internal-play-btn-text">
                  <span className="internal-play-btn-sub">GET IT ON</span>
                  <strong className="internal-play-btn-title">Google Play</strong>
                </div>
              </a>
              <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                iPhone users: Work directly from this web dashboard
              </span>
            </div>
          </div>

          {isLoading ? <p className="muted-copy">Loading latest metrics...</p> : null}
        </section>
      </div>
    </div>
  );
}
