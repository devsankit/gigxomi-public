"use client";

import { animate, createTimeline, stagger } from "animejs";
import {
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  Clock,
  FileText,
  Instagram,
  LayoutDashboard,
  MessageCircleMore,
  MousePointer2,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

export const beats = [
  {
    id: "enquiry",
    step: "01",
    label: "Client Inbound",
    short: "Inbound",
    title: "A new client message enters the agency inbox.",
    copy: "WhatsApp stays visible as the verified channel source. Instagram connects directly, but never mixes into an unlabeled, personal chat.",
    tag: "WhatsApp Cloud API",
    tagColor: "#25D366",
  },
  {
    id: "project",
    step: "02",
    label: "Manager Action",
    short: "Manager",
    title: "The brief becomes a qualified project with clear deal notes.",
    copy: "The manager qualifies the brief, sets the project timeline, logs deal value (₹18,000) vs editor payout (₹6,000), and records 0% platform fee.",
    tag: "Deal Margin ₹12,000",
    tagColor: "#dfff00",
  },
  {
    id: "editor",
    step: "03",
    label: "Editor Choice",
    short: "Roster Match",
    title: "Match capacity to the brief from your verified roster.",
    copy: "Review pacing styles, software skills (Premiere & DaVinci), and verified SLA trust scores to dispatch targeted project offers.",
    tag: "98% Match · Sagar K.",
    tagColor: "#58a6ff",
  },
  {
    id: "mobile",
    step: "04",
    label: "Mobile Proof",
    short: "Mobile SLA",
    title: "The editor receives the project offer away from the desk.",
    copy: "Native Android push alerts let assigned editors review briefs, references, and milestones with zero latency and 4-hour SLA.",
    tag: "Android Push SLA",
    tagColor: "#25D366",
  },
  {
    id: "collaboration",
    step: "05",
    label: "Two-Lane Privacy",
    short: "Anti-Poaching",
    title: "Client access is gated by agency permission.",
    copy: "The editor coordinates in the private internal lane. Direct client reply activates only when manager approves; phone numbers remain 100% masked.",
    tag: "Phone Masked: +91 ***** **842",
    tagColor: "#f59e0b",
  },
  {
    id: "tracking",
    step: "06",
    label: "Delivery Tracking",
    short: "Kanban",
    title: "Real-time visibility across the 5 production stages.",
    copy: "Track deliveries through Inbound, Quotation Sent, In Progress, Review, and Delivered with linked client context and zero lost briefs.",
    tag: "5-Stage Pipeline",
    tagColor: "#dfff00",
  },
] as const;

export type Beat = (typeof beats)[number]["id"];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Chat Inbox", icon: MessageCircleMore },
  { label: "Assign Staff", icon: UsersRound },
  { label: "Find Editors", icon: Search },
  { label: "Contacts", icon: CircleUserRound },
  { label: "Work Hub", icon: BriefcaseBusiness },
  { label: "Project Tracking", icon: FileText },
] as const;

function Pill({
  children,
  kind = "neutral",
}: {
  children: React.ReactNode;
  kind?: "whatsapp" | "instagram" | "lime" | "neutral" | "danger";
}) {
  return (
    <span className={`gx-canvas-pill is-${kind}`}>
      {kind === "whatsapp" ? <MessageCircleMore size={12} /> : null}
      {kind === "instagram" ? <Instagram size={12} /> : null}
      {children}
    </span>
  );
}

export function CanvasWorkspace({
  active,
  isStandalone = false,
}: {
  active: Beat;
  isStandalone?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Map active beat to active nav rail item
  const currentNav =
    active === "enquiry" || active === "project"
      ? "Chat Inbox"
      : active === "editor"
      ? "Find Editors"
      : active === "tracking"
      ? "Project Tracking"
      : "Chat Inbox";

  // Timeline choreography on beat change
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tl = createTimeline({
      defaults: {
        ease: "out(4)",
        duration: 480,
      },
    });

    if (active === "enquiry") {
      tl.add(container.querySelectorAll(".gx-thread-enquiry"), {
        opacity: [0.3, 1],
        translateX: [-12, 0],
        duration: 400,
      })
      .add(container.querySelectorAll(".gx-cursor-enquiry"), {
        opacity: [0, 1],
        translateX: [40, 0],
        translateY: [20, 0],
        duration: 500,
      }, "-=200");
    } else if (active === "project") {
      tl.add(container.querySelectorAll(".gx-canvas-context"), {
        opacity: [0.4, 1],
        scale: [0.97, 1],
        duration: 450,
      })
      .add(container.querySelectorAll(".gx-canvas-project-link"), {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 380,
      }, "-=150");
    } else if (active === "editor") {
      tl.add(container.querySelectorAll(".gx-canvas-editor-sheet"), {
        opacity: [0, 1],
        translateY: [14, 0],
        duration: 420,
      })
      .add(container.querySelectorAll(".gx-editor-card"), {
        opacity: [0, 1],
        translateY: [12, 0],
        delay: stagger(60),
        duration: 400,
      }, "-=200");
    } else if (active === "mobile") {
      tl.add(container.querySelectorAll(".gx-canvas-phone"), {
        opacity: [0.2, 1],
        translateY: [25, 0],
        duration: 550,
      })
      .add(container.querySelectorAll(".gx-canvas-notification"), {
        opacity: [0, 1],
        scale: [0.92, 1],
        duration: 400,
      }, "-=250");
    } else if (active === "collaboration") {
      tl.add(container.querySelectorAll(".gx-canvas-collaboration"), {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 450,
      })
      .add(container.querySelectorAll(".gx-collab-badge"), {
        scale: [0.9, 1],
        duration: 350,
      }, "-=200");
    } else if (active === "tracking") {
      tl.add(container.querySelectorAll(".gx-canvas-tracking"), {
        opacity: [0.4, 1],
        duration: 400,
      })
      .add(container.querySelectorAll(".gx-kanban-assigned-card"), {
        opacity: [0, 1],
        translateY: [16, 0],
        scale: [0.96, 1],
        duration: 450,
      }, "-=150");
    }
  }, [active]);

  return (
    <div
      className={`gx-canvas-workspace ${isStandalone ? "is-standalone" : ""}`}
      data-workflow-state={active}
      ref={containerRef}
    >
      {/* 1. SIDEBAR RAIL */}
      <aside className="gx-canvas-rail" aria-label="Studio Navigation Rail">
        <div className="gx-canvas-logo" title="Gigxomi Studio">
          G
        </div>
        <nav className="gx-canvas-nav">
          {navItems.map(({ label, icon: Icon }) => {
            const isActive = currentNav === label;
            return (
              <button
                type="button"
                className={`gx-rail-item ${isActive ? "is-active" : ""}`}
                key={label}
                title={label}
              >
                <span className="gx-rail-icon-box">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span className="gx-rail-label">{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="gx-canvas-person" title="Ankit Rathore (Agency Owner)">
          <span>AR</span>
          <i className="gx-person-online" />
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <section className="gx-canvas-body">
        {/* Workspace Top Bar */}
        <header className="gx-canvas-topbar">
          <div className="gx-topbar-title-block">
            <div className="gx-topbar-breadcrumb">
              <span className="gx-crumb-parent">Studio Workspace</span>
              <span className="gx-crumb-separator">/</span>
              <strong className="gx-crumb-active">{currentNav}</strong>
            </div>
            <p className="gx-topbar-subtitle">
              {active === "tracking"
                ? "5 active production stages · Direct linked conversation"
                : "UrbanKicks Retail · Launch Campaign 9:16"}
            </p>
          </div>

          <div className="gx-canvas-top-actions">
            <Pill kind="whatsapp">WhatsApp Cloud API</Pill>
            <Pill kind="instagram">Instagram Direct</Pill>
            <button type="button" className="gx-btn-create-project">
              <span>+ Create Project</span>
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Stage */}
        <div className="gx-canvas-stage">
          {/* Surface A: Inbound Channels & Message Stream */}
          <div className={`gx-canvas-chat-layout ${active === "editor" || active === "mobile" || active === "tracking" ? "is-dimmed" : ""}`}>
            {/* Thread List */}
            <aside className="gx-canvas-inbox">
              <div className="gx-canvas-inbox-header">
                <span className="gx-inbox-title">Client Inbound</span>
                <span className="gx-badge-unread">
                  {active === "enquiry" ? "3 New" : "2 New"}
                </span>
              </div>

              <div className="gx-canvas-inbox-tabs">
                <button type="button" className="gx-inbox-tab is-active">All</button>
                <button type="button" className="gx-inbox-tab">
                  Unread <span className="gx-unread-dot" />
                </button>
                <button type="button" className="gx-inbox-tab">Waiting</button>
              </div>

              <div className="gx-canvas-thread-list">
                <article className={`gx-canvas-thread gx-thread-enquiry ${active === "enquiry" || active === "project" ? "is-active" : ""}`}>
                  <div className="gx-thread-avatar">UK</div>
                  <div className="gx-thread-content">
                    <div className="gx-thread-row">
                      <strong>UrbanKicks Retail</strong>
                      <small className="gx-thread-time">Just now</small>
                    </div>
                    <p className="gx-thread-snippet">
                      "Need 3 product reels for Friday launch! Can we swap transition at 0:03?"
                    </p>
                    <div className="gx-thread-meta">
                      <Pill kind="whatsapp">WhatsApp</Pill>
                      <span className="gx-thread-deal">₹18,000</span>
                    </div>
                  </div>
                </article>

                <article className="gx-canvas-thread">
                  <div className="gx-thread-avatar hz">HZ</div>
                  <div className="gx-thread-content">
                    <div className="gx-thread-row">
                      <strong>Horizon FinTech</strong>
                      <small className="gx-thread-time">18m ago</small>
                    </div>
                    <p className="gx-thread-snippet">
                      "Storyboard approved. Ready to assign to Sagar."
                    </p>
                    <div className="gx-thread-meta">
                      <Pill kind="instagram">Instagram</Pill>
                      <span className="gx-thread-deal">₹24,000</span>
                    </div>
                  </div>
                </article>
              </div>
            </aside>

            {/* Conversation View */}
            <section className="gx-canvas-conversation">
              <header className="gx-conversation-header">
                <div className="gx-conv-left">
                  <div className="gx-conv-avatar">UK</div>
                  <div>
                    <div className="gx-conv-title-row">
                      <strong>UrbanKicks Retail</strong>
                      <span className="gx-conv-tag">Direct Client Lead</span>
                    </div>
                    <small className="gx-conv-subtitle">
                      <Pill kind="whatsapp">WhatsApp Business API</Pill>
                      <span>Phone Masked: +91 ••••• ••842</span>
                    </small>
                  </div>
                </div>
                <div className="gx-conv-status">
                  <span className="gx-status-indicator" />
                  <span>Relay Active</span>
                </div>
              </header>

              {/* Message Stream */}
              <div className="gx-canvas-message-area">
                <div className="gx-bubble is-client">
                  <div className="gx-bubble-header">
                    <span>UrbanKicks (Client)</span>
                    <small>10:42 AM</small>
                  </div>
                  <p>Hi team! We need three 9:16 launch reels by Friday. High energy kinetic whip pans. Here are the raw drive links.</p>
                </div>

                <div className={`gx-bubble is-agency ${active !== "enquiry" ? "is-visible" : ""}`}>
                  <div className="gx-bubble-header">
                    <span>Agency Manager</span>
                    <small>10:44 AM</small>
                  </div>
                  <p>Received! Brief qualified. Deal notes recorded at ₹18,000. Assigning specialist editor now.</p>
                </div>

                {/* Project Link Milestone */}
                <div className={`gx-canvas-project-link ${active !== "enquiry" ? "is-visible" : ""}`}>
                  <FileText size={16} className="gx-icon-accent" />
                  <div className="gx-proj-link-text">
                    <strong>Project #104 Initialized</strong>
                    <small>UrbanKicks 3x Reels · Deal Price ₹18,000</small>
                  </div>
                  <span className="gx-link-check">
                    <Check size={14} /> Assigned
                  </span>
                </div>

                {/* Internal Lane Messages */}
                {active === "collaboration" ? (
                  <div className="gx-internal-lane-stream">
                    <div className="gx-internal-banner">
                      <ShieldCheck size={14} />
                      <span>Internal Agency Lane · Hidden from Client</span>
                    </div>
                    <div className="gx-bubble is-internal-editor">
                      <strong>Rahul Sharma (Assigned Editor):</strong>
                      <p>Footage proxy ingested. Can I confirm if client wants kinetic blur on transition 2?</p>
                    </div>
                    <div className="gx-bubble is-internal-manager">
                      <strong>Ankit (Agency Owner):</strong>
                      <p>Yes, approved. Client direct reply permission enabled. Keep number masked.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Reply Box Footer */}
              <footer className="gx-conversation-footer">
                <div className="gx-footer-composer">
                  <input
                    type="text"
                    readOnly
                    value={
                      active === "collaboration"
                        ? "Reply via Masked Relay (Editor Direct Reply Enabled)..."
                        : "Direct client messaging disabled by agency. Reply internally..."
                    }
                    className={active === "collaboration" ? "is-reply-enabled" : "is-reply-locked"}
                  />
                  <button type="button" className="gx-btn-send" aria-label="Send reply">
                    <Send size={15} />
                  </button>
                </div>
                <div className="gx-composer-notice">
                  {active === "collaboration" ? (
                    <span className="gx-notice-success">
                      ✓ Client communication enabled for editor · Client phone number masked
                    </span>
                  ) : (
                    <span className="gx-notice-muted">
                      🔒 Anti-Poaching Shield Active · Raw client contact protected
                    </span>
                  )}
                </div>
              </footer>
            </section>

            {/* Context Drawer */}
            <aside className={`gx-canvas-context ${active === "project" ? "is-highlighted" : ""}`}>
              <div className="gx-context-card">
                <span className="gx-card-kicker">PROJECT CONTEXT</span>
                <h4>UrbanKicks Launch</h4>
                <p className="gx-card-desc">3x 9:16 Vertical UGC Reels · Friday Deadline</p>
                <div className="gx-context-meta-row">
                  <div>
                    <small>Deal Value</small>
                    <strong>₹18,000</strong>
                  </div>
                  <div>
                    <small>Editor Payout</small>
                    <strong className="gx-text-lime">₹6,000 (0% Fee)</strong>
                  </div>
                </div>
              </div>

              <div className="gx-context-card">
                <span className="gx-card-kicker">ASSIGNMENT DELEGATION</span>
                <div className="gx-delegation-action">
                  <small>Manager Status</small>
                  <strong>Find Specialist Editor</strong>
                  <button type="button" className="gx-btn-assign-editor">
                    <UserRoundCheck size={14} /> Assign Specialist
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Overlay Surface B: Find Editors Roster Sheet */}
          {active === "editor" ? (
            <div className="gx-canvas-overlay-sheet gx-canvas-editor-sheet">
              <div className="gx-sheet-header">
                <div>
                  <Pill kind="lime">FIND EDITORS ROSTER</Pill>
                  <h3>Match Specialist Capacity</h3>
                </div>
                <div className="gx-sheet-search">
                  <Search size={14} />
                  <span>Short-form Reels · Kinetic Typography</span>
                </div>
              </div>

              <div className="gx-editor-cards-grid">
                <article className="gx-editor-card is-selected">
                  <div className="gx-ed-avatar">RS</div>
                  <div className="gx-ed-info">
                    <div className="gx-ed-name-row">
                      <strong>Rahul Sharma</strong>
                      <span className="gx-trust-score">98% SLA Trust</span>
                    </div>
                    <p>Reels & TikTok Specialist · Premiere & After Effects</p>
                    <div className="gx-ed-tags">
                      <Pill kind="lime">Available Now</Pill>
                      <span className="gx-tag-rate">₹2,000 / reel</span>
                    </div>
                  </div>
                  <button type="button" className="gx-btn-offer">
                    Send Offer <Send size={12} />
                  </button>
                </article>

                <article className="gx-editor-card">
                  <div className="gx-ed-avatar sk">SK</div>
                  <div className="gx-ed-info">
                    <div className="gx-ed-name-row">
                      <strong>Sneha Kapoor</strong>
                      <span className="gx-trust-score">97% SLA Trust</span>
                    </div>
                    <p>Colorist & Aesthetic Cut Specialist · DaVinci Resolve</p>
                    <div className="gx-ed-tags">
                      <Pill kind="neutral">Available Monday</Pill>
                      <span className="gx-tag-rate">₹2,500 / cut</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          ) : null}

          {/* Overlay Surface C: Android Mobile Companion Scene */}
          {active === "mobile" ? (
            <div className="gx-canvas-overlay-sheet gx-canvas-phone-scene">
              <div className="gx-canvas-phone">
                <div className="gx-phone-bezel">
                  <div className="gx-phone-notch" />
                  <div className="gx-phone-status-bar">
                    <small>9:41</small>
                    <div className="gx-status-icons">
                      <span className="gx-net-dot" />
                      <span className="gx-battery-pill" />
                    </div>
                  </div>

                  <div className="gx-phone-screen-content">
                    <div className="gx-canvas-notification">
                      <div className="gx-notif-top">
                        <span className="gx-notif-logo">G</span>
                        <div className="gx-notif-app-info">
                          <strong>Gigxomi Mobile</strong>
                          <small>Project Offer Alert</small>
                        </div>
                        <span className="gx-notif-time">Now</span>
                      </div>
                      <div className="gx-notif-body">
                        <strong>UrbanKicks Retail · 3x Launch Reels</strong>
                        <p>Compensation: ₹6,000 (0% platform cut) · Delivery: Friday</p>
                      </div>
                      <div className="gx-notif-actions">
                        <button type="button" className="gx-btn-accept">Accept Cut</button>
                        <button type="button" className="gx-btn-decline">Decline</button>
                      </div>
                    </div>

                    <div className="gx-phone-app-preview">
                      <Pill kind="lime">Offer Accepted</Pill>
                      <h4>UrbanKicks Production Ready</h4>
                      <small>Assignment context synced with desktop workspace</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="gx-phone-annotation">
                <Smartphone size={22} className="gx-text-lime" />
                <h4>Android Companion Notification</h4>
                <p>Editors accept work on the move. Immediate assignment context and timecoded notes sync to their workstation.</p>
              </div>
            </div>
          ) : null}

          {/* Overlay Surface D: 5-Stage Project Tracking Kanban */}
          {active === "tracking" ? (
            <div className="gx-canvas-overlay-sheet gx-canvas-tracking">
              <div className="gx-tracking-topbar">
                <div>
                  <Pill kind="lime">REAL PROJECT TRACKING</Pill>
                  <h3>Operational Production Board</h3>
                </div>
                <div className="gx-tracking-switch">
                  <span className="is-active">Kanban Board</span>
                  <span>Table View</span>
                </div>
              </div>

              <div className="gx-kanban-board">
                {["New", "Assigned", "Waiting", "Quote Sent", "Payment Pending"].map((column) => {
                  const isAssignedCol = column === "Assigned";
                  return (
                    <div className="gx-kanban-column" key={column}>
                      <header className="gx-col-header">
                        <strong>{column}</strong>
                        <span className="gx-col-count">{isAssignedCol ? "1" : "0"}</span>
                      </header>

                      {isAssignedCol ? (
                        <article className="gx-kanban-card gx-kanban-assigned-card">
                          <div className="gx-kb-card-top">
                            <Pill kind="whatsapp">WA</Pill>
                            <span className="gx-kb-deal-tag">₹18,000</span>
                          </div>
                          <strong>UrbanKicks Retail</strong>
                          <p>3x 9:16 Launch Reels · Revision 1</p>
                          <footer className="gx-kb-footer">
                            <span className="gx-editor-chip">RS · Rahul Sharma</span>
                            <span className="gx-kb-due"><Clock size={11} /> Due Fri</span>
                          </footer>
                        </article>
                      ) : (
                        <div className="gx-kanban-empty-slot">
                          <small>No pending items</small>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Synthetic cursor animation */}
          <MousePointer2 className={`gx-canvas-cursor is-${active}`} size={22} />
        </div>
      </section>
    </div>
  );
}

export function GigxomiWorkflowStory() {
  const [active, setActive] = useState<Beat>("enquiry");
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  const activeIndex = beats.findIndex((b) => b.id === active);
  const currentBeat = beats[activeIndex] || beats[0];

  // Auto-advancing continuous timer with smooth progress bar (Frame.io Standard)
  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const stepIncrement = (interval / duration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActive((curr) => {
            const idx = beats.findIndex((b) => b.id === curr);
            const nextIdx = (idx + 1) % beats.length;
            return beats[nextIdx].id;
          });
          return 0;
        }
        return prev + stepIncrement;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  function handleSelectBeat(id: Beat) {
    setActive(id);
    setProgress(0);
  }

  return (
    <section className="gx-workflow-showcase-section" id="workflow">
      <div className="gx-workflow-showcase-container">
        
        {/* Head Section */}
        <div className="gx-workflow-showcase-head">
          <div className="gx-workflow-pill-kicker">
            <Sparkles size={13} /> The Gigxomi Workflow Engine
          </div>
          <h2>Continuous Operations.<br />Zero Relay Chaos.</h2>
          <p>
            Experience how a client enquiry transforms into editor-ready work,
            permission-gated collaboration, and visible delivery.
          </p>
        </div>

        {/* Tab Navigator (Frame.io Standard - Continuous Loop, No Player Controls) */}
        <nav className="gx-workflow-nav-bar" aria-label="Workflow Stages">
          <div className="gx-workflow-tabs-scrollable">
            {beats.map((beat, idx) => {
              const isActive = active === beat.id;
              const isPast = activeIndex > idx;
              return (
                <button
                  key={beat.id}
                  className={`gx-workflow-tab-item ${isActive ? "is-active" : ""}`}
                  onClick={() => handleSelectBeat(beat.id)}
                  type="button"
                >
                  <div className="gx-tab-header">
                    <span className="gx-tab-step">{beat.step}</span>
                    <span className="gx-tab-label">{beat.label}</span>
                  </div>
                  <div className="gx-tab-progress-track">
                    <div
                      className="gx-tab-progress-fill"
                      style={{
                        width: isActive ? `${progress}%` : isPast ? "100%" : "0%",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Current Beat Context Banner */}
        <div className="gx-workflow-context-callout">
          <div
            className="gx-context-tag"
            style={{
              color: currentBeat.tagColor,
              borderColor: `${currentBeat.tagColor}50`,
              backgroundColor: `${currentBeat.tagColor}15`,
            }}
          >
            {currentBeat.tag}
          </div>
          <div className="gx-context-text">
            <strong>{currentBeat.title}</strong>
            <span>{currentBeat.copy}</span>
          </div>
        </div>

        {/* Persistent Frame.io Standard Workspace Canvas */}
        <div className="gx-workflow-canvas-wrap">
          <div className="gx-workflow-ambient-glow" />
          <CanvasWorkspace active={active} />
        </div>

      </div>
    </section>
  );
}

export function GigxomiDemoPreview({
  screen = "manager",
}: {
  screen?: "manager" | "inbox" | "editors" | "tracking";
}) {
  const beatMap: Record<string, Beat> = {
    manager: "project",
    inbox: "enquiry",
    editors: "editor",
    tracking: "tracking",
  };
  return <CanvasWorkspace active={beatMap[screen] || "project"} isStandalone />;
}
