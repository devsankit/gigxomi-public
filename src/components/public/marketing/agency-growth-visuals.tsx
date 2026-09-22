"use client";

import { type CSSProperties, type PointerEvent, type ReactNode, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  FileCheck2,
  Inbox,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

type VisualIcon = typeof Sparkles;

type MetricItem = {
  label: string;
  value: string;
  tone?: "accent" | "muted";
};

type TalentCard = {
  category: string;
  initials: string;
  price: string;
  score: string;
  skill: string;
  speed: string;
};

type FlowStep = {
  icon: VisualIcon;
  label: string;
  title: string;
};

const heroMetrics: MetricItem[] = [
  { label: "Active leads", value: "12", tone: "accent" },
  { label: "Under review", value: "04" },
  { label: "Freelancers ready", value: "18" },
];

const controlMetrics: MetricItem[] = [
  { label: "Active leads", value: "12", tone: "accent" },
  { label: "Pending assignments", value: "06" },
  { label: "Delivery under review", value: "04" },
  { label: "Available freelancers", value: "18" },
  { label: "Earnings this month", value: "Visible" },
  { label: "Client activity", value: "Live" },
];

const talentCards: TalentCard[] = [
  {
    initials: "RV",
    skill: "Wedding editor",
    category: "Highlight films",
    score: "Karma 84",
    speed: "2-3 day delivery",
    price: "Mid range",
  },
  {
    initials: "AK",
    skill: "Reels specialist",
    category: "Short-form ads",
    score: "Karma 91",
    speed: "24 hr batches",
    price: "Starter friendly",
  },
  {
    initials: "MN",
    skill: "Podcast editor",
    category: "Long-form cleanup",
    score: "Karma 79",
    speed: "Weekly slots",
    price: "Project based",
  },
];

const flowSteps: FlowStep[] = [
  { icon: MessageCircle, label: "Lead arrives", title: "WhatsApp / Instagram / referral" },
  { icon: Inbox, label: "Request received", title: "Agency inbox captures context" },
  { icon: Users, label: "Assign freelancer", title: "Manager or founder routes work" },
  { icon: BadgeCheck, label: "Freelancer accepts", title: "Scope and status become visible" },
  { icon: FileCheck2, label: "Delivery reviewed", title: "Quality check before client handoff" },
  { icon: Wallet, label: "Accounts tracked", title: "Collections and payouts stay clear" },
];

const freelancerSystemItems = [
  { label: "Profile completion", value: "72%", icon: BadgeCheck },
  { label: "Published services", value: "Reels + YouTube", icon: LayoutDashboard },
  { label: "Apply for work", value: "Agency openings", icon: BriefcaseBusiness },
  { label: "Wallet / payout", value: "Request visible", icon: Wallet },
  { label: "Assigned chats", value: "Scoped access", icon: MessageCircle },
  { label: "Delivery queue", value: "Review ready", icon: FileCheck2 },
];

function VisualChrome({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`agency-visual-chrome ${className}`}>
      <span />
      <span />
      <span />
      {children}
    </div>
  );
}

function MiniGraph({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`agency-mini-graph ${className}`} viewBox="0 0 180 70">
      <path className="agency-mini-graph-grid" d="M8 55H172M8 35H172M8 15H172" />
      <path className="agency-mini-graph-line" d="M10 52 C36 42 44 43 62 31 C82 17 94 21 112 28 C132 36 142 20 170 13" pathLength="1" />
      <path className="agency-mini-graph-fill" d="M10 52 C36 42 44 43 62 31 C82 17 94 21 112 28 C132 36 142 20 170 13 L170 65 L10 65 Z" />
    </svg>
  );
}

function StatusDot({ active = false }: { active?: boolean }) {
  return <span className={active ? "agency-status-dot active" : "agency-status-dot"} />;
}

function MetricTile({ label, value, tone }: MetricItem) {
  return (
    <div className={tone === "accent" ? "agency-metric-tile accent" : "agency-metric-tile"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function handleHeroPointerMove(event: PointerEvent<HTMLDivElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;
  event.currentTarget.style.setProperty("--tilt-x", `${x * 7}deg`);
  event.currentTarget.style.setProperty("--tilt-y", `${y * -6}deg`);
  event.currentTarget.style.setProperty("--parallax-x", `${x * 12}px`);
  event.currentTarget.style.setProperty("--parallax-y", `${y * 10}px`);
}

export function AgencyPremiumHeroVisual() {
  return (
    <div
      className="agency-hero-dashboard-stage agency-visual-reveal"
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--tilt-x", "0deg");
        event.currentTarget.style.setProperty("--tilt-y", "0deg");
        event.currentTarget.style.setProperty("--parallax-x", "0px");
        event.currentTarget.style.setProperty("--parallax-y", "0px");
      }}
      onPointerMove={handleHeroPointerMove}
    >
      <span className="agency-ambient-light agency-ambient-light-one" />
      <span className="agency-ambient-light agency-ambient-light-two" />
      <VisualChrome className="agency-hero-dashboard-shell">
        <div className="agency-hero-dashboard-head">
          <div>
            <span>Agency Control Dashboard</span>
            <strong>Video editing operations</strong>
          </div>
          <span className="agency-live-pill">
            <StatusDot active />
            Live workflow
          </span>
        </div>

        <div className="agency-hero-dashboard-grid">
          <aside className="agency-hero-sidebar">
            {["Inbox", "Assignments", "Team", "Reviews", "Accounts"].map((item, index) => (
              <span className={index === 1 ? "active" : ""} key={item}>
                {item}
              </span>
            ))}
          </aside>

          <div className="agency-hero-main-panel">
            <div className="agency-metric-row">
              {heroMetrics.map((metric) => (
                <MetricTile {...metric} key={metric.label} />
              ))}
            </div>

            <div className="agency-hero-work-grid">
              <div className="agency-lead-thread-card">
                <div>
                  <span>One Inbox</span>
                  <strong>Wedding highlight lead</strong>
                  <p>WhatsApp-first request with files, quote context, and delivery date.</p>
                </div>
                <span className="agency-status-pill">New</span>
              </div>

              <div className="agency-assignment-card">
                <div className="agency-avatar-stack">
                  <span>RV</span>
                  <span>AK</span>
                  <span>MN</span>
                </div>
                <strong>Assign freelancer</strong>
                <div className="agency-progress-track">
                  <i style={{ width: "68%" }} />
                </div>
                <p>3 editors available for this category</p>
              </div>
            </div>

            <MiniGraph />
          </div>
        </div>
      </VisualChrome>

      <div className="agency-floating-card one">
        <MessageCircle size={16} strokeWidth={1.8} />
        <div>
          <span>Lead protected</span>
          <strong>Client relationship stays with agency</strong>
        </div>
      </div>
      <div className="agency-floating-card two">
        <FileCheck2 size={16} strokeWidth={1.8} />
        <div>
          <span>Delivery review</span>
          <strong>Founder approval before handoff</strong>
        </div>
      </div>
      <div className="agency-floating-card three">
        <CircleDollarSign size={16} strokeWidth={1.8} />
        <div>
          <span>Wallet / accounts</span>
          <strong>Collections and payouts visible</strong>
        </div>
      </div>
      <div className="agency-floating-card four">
        <ShieldCheck size={16} strokeWidth={1.8} />
        <div>
          <span>Public page</span>
          <strong>Showcase services and proof</strong>
        </div>
      </div>
    </div>
  );
}

export function AgencyControlWorkspaceVisual() {
  return (
    <div className="agency-control-workspace agency-visual-reveal">
      <VisualChrome className="agency-wide-dashboard">
        <div className="agency-wide-sidebar">
          <strong>Gigxomi OS</strong>
          {["Leads", "Assignments", "Team", "Delivery", "Accounts"].map((item) => (
            <span className={item === "Assignments" ? "active" : ""} key={item}>
              {item}
            </span>
          ))}
        </div>

        <div className="agency-wide-main">
          <div className="agency-wide-top">
            <div>
              <span>Agency workspace</span>
              <strong>Control your agency from one workspace</strong>
            </div>
            <span className="agency-live-pill">
              <StatusDot active />
              Operations view
            </span>
          </div>

          <div className="agency-wide-metrics">
            {controlMetrics.map((metric) => (
              <MetricTile {...metric} key={metric.label} />
            ))}
          </div>

          <div className="agency-wide-panels">
            <div className="agency-dashboard-panel inbox-panel">
              <span>Inbox panel</span>
              <strong>Client lead: Reels package</strong>
              <p>Quote pending, files received, owner assigned.</p>
              <div className="agency-message-bars">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="agency-dashboard-panel assignment-panel">
              <span>Assignment panel</span>
              <strong>Manager review</strong>
              <div className="agency-checklist">
                {["Scope locked", "Editor matched", "Review queue"].map((item) => (
                  <p key={item}>
                    <Check size={13} strokeWidth={2} />
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="agency-dashboard-panel team-panel">
              <span>Team panel</span>
              <strong>Available freelancers</strong>
              <div className="agency-team-list">
                {["Wedding", "Reels", "Podcast"].map((item) => (
                  <p key={item}>
                    <StatusDot active={item !== "Podcast"} />
                    {item} editor
                  </p>
                ))}
              </div>
            </div>
            <div className="agency-dashboard-panel finance-panel">
              <span>Finance panel</span>
              <strong>Accounts visible</strong>
              <MiniGraph className="compact" />
            </div>
          </div>
        </div>
      </VisualChrome>
    </div>
  );
}

export function FreelancerTalentSystemVisual() {
  return (
    <div className="agency-talent-system agency-visual-reveal">
      <div className="agency-talent-card-stack">
        {talentCards.map((card, index) => (
          <article className="agency-talent-card" key={card.initials} style={{ "--stack-index": index } as CSSProperties}>
            <div className="agency-talent-head">
              <span className="agency-talent-avatar">{card.initials}</span>
              <div>
                <strong>{card.skill}</strong>
                <span>{card.category}</span>
              </div>
            </div>
            <div className="agency-talent-tags">
              <span>{card.score}</span>
              <span>{card.speed}</span>
              <span>{card.price}</span>
            </div>
            <div className="agency-progress-track">
              <i style={{ width: `${72 + index * 8}%` }} />
            </div>
          </article>
        ))}
      </div>

      <div className="agency-assign-connector" aria-hidden="true" />

      <article className="agency-project-assign-card">
        <span className="section-label">Project routing</span>
        <h3>Assign to client project</h3>
        <p>Founder keeps the client relationship while freelancers receive the work context they need.</p>
        <button type="button">Assign to Project</button>
      </article>
    </div>
  );
}

export function AgencyWorkflowVisual() {
  return (
    <div className="agency-workflow-visual agency-visual-reveal">
      <svg aria-hidden="true" className="agency-flow-line" viewBox="0 0 1100 180" preserveAspectRatio="none">
        <path className="agency-flow-line-base" d="M40 100 C210 20 315 165 470 92 C620 22 710 154 860 92 C950 56 1010 74 1060 104" />
        <path className="agency-flow-line-active" d="M40 100 C210 20 315 165 470 92 C620 22 710 154 860 92 C950 56 1010 74 1060 104" pathLength="1" />
      </svg>
      <div className="agency-flow-node-grid">
        {flowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article className="agency-flow-node" key={step.label} style={{ "--flow-index": index } as CSSProperties}>
              <span className="agency-flow-number">{index + 1}</span>
              <div className="agency-card-icon-shell">
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <strong>{step.label}</strong>
              <p>{step.title}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function FreelancerWorkspaceEcosystemVisual() {
  const [activeItem, setActiveItem] = useState(0);

  return (
    <div className="agency-freelancer-system agency-visual-reveal">
      <VisualChrome className="agency-freelancer-device">
        <div className="agency-freelancer-profile">
          <span className="agency-talent-avatar">GX</span>
          <div>
            <strong>Freelancer workspace</strong>
            <p>Profile, services, work applications, delivery queue, and payout flow.</p>
          </div>
        </div>
        <div className="agency-progress-track large">
          <i style={{ width: "72%" }} />
        </div>
        <div className="agency-freelancer-grid">
          {freelancerSystemItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                className={activeItem === index ? "active" : ""}
                key={item.label}
                onMouseEnter={() => setActiveItem(index)}
                onFocus={() => setActiveItem(index)}
                type="button"
              >
                <Icon size={15} strokeWidth={1.8} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </button>
            );
          })}
        </div>
      </VisualChrome>
    </div>
  );
}

export function AgencyTrustVisuals() {
  const items = [
    { icon: ShieldCheck, title: "Built from real agency pain", body: "Designed around hiring pressure, client protection, delivery review, and payout clarity." },
    { icon: MessageCircle, title: "WhatsApp-first creative businesses", body: "Supports the way Indian creative work actually starts: chats, referrals, and quick lead context." },
    { icon: Workflow, title: "Lead to delivery workflow", body: "Connects lead intake, freelancer assignment, manager review, and accounts visibility." },
  ];

  return (
    <section className="agency-trust-visuals agency-visual-reveal" aria-label="Gigxomi trust visuals">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article key={item.title}>
            <div className="agency-card-icon-shell">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
