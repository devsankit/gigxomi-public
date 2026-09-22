"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Lock,
  MessageCircle,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Unlock,
  Users,
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import {
  PrimaryButton,
  SecondaryButton,
  SectionEyebrow,
  SourceBadge,
  StatusChip,
  RoleCard,
} from "@/components/public/design-system";
import { MarketingFaq } from "@/components/public/marketing-faq";
import { HOMEPAGE_FAQS } from "@/lib/seo/public-faqs";
import { trackCtaClick } from "@/lib/analytics/funnel";
import { openDemoModal } from "@/components/public/demo-modal";

const HOMEPAGE_GUIDES = [
  {
    category: "Client Operations",
    title: "Agency Operations & Management Blueprint",
    description: "Connect client communication channels into a structured workspace to qualify briefs, coordinate editors, and keep production organized.",
    href: "/blog/video-editing-agency-management-software-system",
  },
  {
    category: "Production Operations",
    title: "Top 10 Workflows for Video Editing Teams",
    description: "Standardize post-production delivery pipelines, revision management, and editor assignments to ship consistent work on time.",
    href: "/blog/top-10-workflows-video-editing-agency",
  },
  {
    category: "Agency Finance",
    title: "Pricing Video Services for Recurring Campaigns",
    description: "How creative studios structure monthly retainers, calculate editor margins, and maintain healthy, predictable cash flow.",
    href: "/blog/video-editing-pricing-for-recurring-campaigns",
  },
];

type GigxomiHomepageProps = {
  agencies?: unknown[];
  agencySignupHref?: string;
};

export function GigxomiHomepage({}: GigxomiHomepageProps = {}) {
  const shouldReduceMotion = useReducedMotion();

  // Interactive state for approval toggle demo (Chapter 5)
  const [approvalEnabled, setApprovalEnabled] = useState(true);

  // Motion transitions
  const transition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: [0.16, 1, 0.3, 1] };

  return (
    <MarketingSiteShell hideFooterCta={true}>
      <div className="gx-homepage-root gx-v3-home">
        {/* =================================================================
            1. HERO CHAPTER
            ================================================================= */}
        <section className="gx-chapter gx-hero-chapter" id="hero">
          <div className="gx-chapter-container">
            <div className="gx-hero-grid">
              {/* Copy Block */}
              <motion.div
                className="gx-hero-copy"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
              >
                <SectionEyebrow>Video editing agency management workspace</SectionEyebrow>

                <h1 className="gx-hero-heading gx-heading-to-p">
                  Manage your video editors, team and client work in one place.
                </h1>

                <p className="gx-chapter-desc gx-heading-to-p">
                  Keep client conversations, editor coordination and project status connected without relaying every message yourself.
                </p>

                <div className="gx-hero-actions">
                  <PrimaryButton
                    href="https://app.gigxomi.com/signup?role=agency"
                    icon={<ArrowRight size={16} />}
                    onClick={() =>
                      trackCtaClick({
                        ctaText: "Start free workspace",
                        location: "hero",
                        pageType: "homepage",
                        targetUrl: "https://app.gigxomi.com/signup?role=agency",
                      })
                    }
                  >
                    Start free workspace
                  </PrimaryButton>
                  <SecondaryButton
                    onClick={() => {
                      trackCtaClick({
                        ctaText: "Book a demo",
                        location: "hero",
                        pageType: "homepage",
                        targetUrl: "demo_modal",
                      });
                      openDemoModal("hero");
                    }}
                  >
                    Book a demo
                  </SecondaryButton>
                  <Link className="gx-hero-pricing-link" href="/pricing" prefetch={false}>
                    View pricing <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </div>

                <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "var(--gx-muted-strong, #a3aba0)" }}>
                  Workspace setup begins with agency details, then client channels and team workflow.
                </p>

                <div className="gx-hero-proof-list">
                  <div className="gx-hero-proof-item">
                    <Check size={16} />
                    <span>Separate WhatsApp and Instagram client inboxes</span>
                  </div>
                  <div className="gx-hero-proof-item">
                    <Check size={16} />
                    <span>Manager-controlled editor collaboration</span>
                  </div>
                </div>
              </motion.div>

              {/* Integrated Coded Workspace Visual */}
              <div className="gx-hero-visual-wrap">
                <div aria-hidden="true" className="gx-hero-lime-glow" />
                <motion.div
                  className="gx-hero-workspace"
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.1 }}
                >
                {/* Topbar */}
                <div className="gx-mock-topbar">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} style={{ color: "var(--gx-lime)" }} />
                    <span className="gx-mock-title">Gigxomi workspace</span>
                  </div>
                  <div className="gx-mock-badges">
                    <SourceBadge channel="whatsapp" />
                    <SourceBadge channel="instagram" />
                  </div>
                </div>

                {/* Workspace Body */}
                <div className="gx-mock-body">
                  {/* Left Sidebar Nav */}
                  <div className="gx-mock-nav" aria-hidden="true">
                    <div className="gx-mock-nav-icon is-active">
                      <MessageCircle size={16} />
                    </div>
                    <div className="gx-mock-nav-icon">
                      <Users size={16} />
                    </div>
                    <div className="gx-mock-nav-icon">
                      <Search size={16} />
                    </div>
                    <div className="gx-mock-nav-icon">
                      <BriefcaseBusiness size={16} />
                    </div>
                  </div>

                  {/* Channel Inboxes */}
                  <div className="gx-mock-inbox-col">
                    <div className="gx-mock-col-header">Inboxes</div>
                    <div className="gx-mock-inbox-item is-active">
                      <span className="gx-mock-inbox-title">Nova Studio — 3 reels for Friday</span>
                      <SourceBadge channel="whatsapp" />
                    </div>
                    <div className="gx-mock-inbox-item">
                      <span className="gx-mock-inbox-title">Horizon Media — Footage folder shared</span>
                      <SourceBadge channel="instagram" />
                    </div>
                  </div>

                  {/* Project Context & Messages */}
                  <div className="gx-mock-thread-col">
                    <div className="gx-mock-thread-header">
                      <span className="gx-mock-project-label">3 kinetic reels</span>
                      <span className="gx-mock-editor-label">Aarav · Editor</span>
                    </div>

                    <div className="gx-mock-messages">
                      {/* Client Message */}
                      <div className="gx-mock-msg-bubble gx-mock-client-msg">
                        <div style={{ fontSize: "11px", color: "var(--gx-muted)", marginBottom: "4px" }}>
                          Client message
                        </div>
                        <div>Need three 9:16 reels for Friday. Footage is in the shared folder.</div>
                      </div>

                      {/* Internal Lane */}
                      <div className="gx-mock-internal-box">
                        <div className="gx-mock-internal-header">
                          <Lock size={12} />
                          <span>Internal team chat</span>
                        </div>
                        <div className="gx-mock-internal-msg">
                          <strong>Manager:</strong> Brief and files added. First cut Thursday.
                        </div>
                        <div className="gx-mock-internal-msg">
                          <strong>Aarav · Editor:</strong> Got it. Any reference for the motion style?
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="gx-mock-thread-footer">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CheckCircle2 size={14} style={{ color: "var(--gx-lime)" }} />
                        <span style={{ fontSize: "12px", color: "var(--gx-text)", fontWeight: 500 }}>
                          Client reply enabled
                        </span>
                      </div>
                      <StatusChip variant="assigned">Assigned</StatusChip>
                    </div>
                  </div>
                </div>
              </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            2. TRANSITION CHAPTER (No cards or visual)
            ================================================================= */}
        <section className="gx-chapter gx-transition-chapter" id="transition">
          <div className="gx-chapter-container">
            <motion.div
              className="gx-transition-inner"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              <SectionEyebrow>Built for growing editing teams</SectionEyebrow>
              <h2 className="gx-transition-heading">Less relaying. More work moving.</h2>
              <p className="gx-transition-copy">
                Gigxomi gives your agency one place for client context, editor coordination, and project tracking.
              </p>
            </motion.div>
          </div>
        </section>

        {/* =================================================================
            3. CLIENT CONVERSATIONS CHAPTER (Two columns: copy left, Inbox visual right)
            ================================================================= */}
        <section className="gx-chapter" id="client-conversations">
          <div className="gx-chapter-container">
            <div className="gx-chapter-grid">
              {/* Copy Left */}
              <motion.div
                className="gx-copy-block"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <SectionEyebrow>Client conversations</SectionEyebrow>
                <h2 className="gx-chapter-heading gx-heading-to-p">Start with the full brief.</h2>
                <p className="gx-chapter-desc gx-heading-to-p">
                  Keep WhatsApp and Instagram enquiries organised before work reaches an editor.
                </p>

                <ul className="gx-chapter-points">
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Source stays clear</span>
                  </li>
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Project context stays together</span>
                  </li>
                </ul>
              </motion.div>

              {/* Inbox Visual Right (Show ONLY the Inbox) */}
              <motion.div
                className="gx-inbox-visual-card"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <div className="gx-mock-topbar">
                  <span className="gx-mock-title">Client inboxes</span>
                  <div className="gx-mock-badges">
                    <SourceBadge channel="whatsapp" />
                    <SourceBadge channel="instagram" />
                  </div>
                </div>

                <div className="gx-inbox-list">
                  {/* WhatsApp Row */}
                  <div className="gx-inbox-item-row" style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                    <div className="gx-inbox-item-header">
                      <span className="gx-inbox-item-title">Nova Studio — 3 reels for Friday</span>
                      <SourceBadge channel="whatsapp" />
                    </div>
                    <div className="gx-inbox-item-preview">
                      Need three 9:16 reels for Friday. Footage is in the shared folder.
                    </div>
                  </div>

                  {/* Instagram Row */}
                  <div className="gx-inbox-item-row">
                    <div className="gx-inbox-item-header">
                      <span className="gx-inbox-item-title">Horizon Media — Footage folder shared</span>
                      <SourceBadge channel="instagram" />
                    </div>
                    <div className="gx-inbox-item-preview" style={{ color: "var(--gx-muted)" }}>
                      Project folder link uploaded for podcast clips.
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =================================================================
            4. TEAM COORDINATION CHAPTER (Reverse layout: Internal Team Chat visual left, copy right)
            ================================================================= */}
        <section className="gx-chapter" id="team-coordination">
          <div className="gx-chapter-container">
            <div className="gx-chapter-grid gx-chapter-grid-reverse">
              {/* Internal Team Chat Visual Left (Show ONLY project context and internal chat) */}
              <motion.div
                className="gx-team-chat-visual"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <div className="gx-team-chat-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gx-text)" }}>
                      3 kinetic reels
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--gx-muted)" }}>· Aarav · Editor</span>
                  </div>
                  <SourceBadge channel="internal">Private team chat</SourceBadge>
                </div>

                <div className="gx-team-chat-content">
                  <div className="gx-team-chat-bubble">
                    <span className="gx-team-chat-bubble-author">Manager</span>
                    <p className="gx-team-chat-bubble-text">
                      Brief and files added. First cut Thursday.
                    </p>
                  </div>

                  <div className="gx-team-chat-bubble">
                    <span className="gx-team-chat-bubble-author">Aarav · Editor</span>
                    <p className="gx-team-chat-bubble-text">
                      Got it. Any reference for the motion style?
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Copy Right */}
              <motion.div
                className="gx-copy-block"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <SectionEyebrow>Team coordination</SectionEyebrow>
                <h2 className="gx-chapter-heading gx-heading-to-p">Give editors the context to move.</h2>
                <p className="gx-chapter-desc gx-heading-to-p">
                  Managers add the brief, assign the editor, and keep questions inside the team.
                </p>

                <ul className="gx-chapter-points">
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Assign the right editor</span>
                  </li>
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Keep team chat private</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =================================================================
            5. MANAGER APPROVAL CHAPTER (Two columns: copy left, permission-state visual right)
            ================================================================= */}
        <section className="gx-chapter" id="manager-approval">
          <div className="gx-chapter-container">
            <div className="gx-chapter-grid">
              {/* Copy Left */}
              <motion.div
                className="gx-copy-block"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <SectionEyebrow>Manager control</SectionEyebrow>
                <h2 className="gx-chapter-heading gx-heading-to-p">Open client replies when you are ready.</h2>
                <p className="gx-chapter-desc gx-heading-to-p">
                  Editors can communicate with the client only after a manager enables access.
                </p>

                <ul className="gx-chapter-points">
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Manager-approved client replies</span>
                  </li>
                </ul>
              </motion.div>

              {/* Permission State Visual Right (Show ONLY disabled-to-enabled state) */}
              <motion.div
                className="gx-approval-visual"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--gx-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Client Reply Permission
                  </span>
                  <button
                    type="button"
                    onClick={() => setApprovalEnabled((prev) => !prev)}
                    className={`gx-approval-toggle-btn ${approvalEnabled ? "is-active" : "is-inactive"}`}
                    aria-label="Toggle client reply permission"
                  >
                    {approvalEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    <span>{approvalEnabled ? "Enabled" : "Disabled"}</span>
                  </button>
                </div>

                <div className={`gx-approval-state-row ${approvalEnabled ? "is-enabled" : "is-disabled"}`}>
                  <div className="gx-approval-state-label">
                    {approvalEnabled ? (
                      <Unlock size={18} style={{ color: "var(--gx-lime)" }} />
                    ) : (
                      <Lock size={18} style={{ color: "var(--gx-muted)" }} />
                    )}
                    <span>
                      {approvalEnabled ? "Client reply enabled" : "Client reply disabled"}
                    </span>
                  </div>
                  <span style={{ fontSize: "12.5px", color: approvalEnabled ? "var(--gx-lime)" : "var(--gx-muted)" }}>
                    {approvalEnabled ? "Editor can message client" : "Manager approval required"}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =================================================================
            6. EDITOR CAPACITY CHAPTER (Two columns: copy left, Find Editors visual right)
            ================================================================= */}
        <section className="gx-chapter" id="editor-capacity">
          <div className="gx-chapter-container">
            <div className="gx-chapter-grid">
              {/* Copy Left */}
              <motion.div
                className="gx-copy-block"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <SectionEyebrow>Editor capacity</SectionEyebrow>
                <h2 className="gx-chapter-heading gx-heading-to-p">Match work with the right editor.</h2>
                <p className="gx-chapter-desc gx-heading-to-p">
                  See skills and availability before assigning a project.
                </p>

                <ul className="gx-chapter-points">
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Find editors</span>
                  </li>
                  <li className="gx-chapter-point-item">
                    <span className="gx-point-icon">
                      <Check size={12} strokeWidth={2.5} />
                    </span>
                    <span>Explore Work Hub</span>
                  </li>
                </ul>
              </motion.div>

              {/* Find Editors Scene Right (Show ONE Find Editors scene; Work Hub is quiet secondary action) */}
              <motion.div
                className="gx-capacity-visual"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
                transition={transition}
              >
                <div className="gx-capacity-header">
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gx-text)" }}>
                    Find editors
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--gx-muted)" }}>Specialist roster</span>
                </div>

                <div className="gx-capacity-list">
                  {/* Selected Editor (Aarav gets lime border and 2px upward translation) */}
                  <div className="gx-capacity-editor-card is-selected">
                    <div className="gx-editor-info-block">
                      <span className="gx-editor-name-text">Aarav · Editor</span>
                      <span className="gx-editor-skill-text">Short-form · Reels · Motion</span>
                    </div>
                    <StatusChip variant="active">Available this week</StatusChip>
                  </div>

                  <div className="gx-capacity-editor-card">
                    <div className="gx-editor-info-block">
                      <span className="gx-editor-name-text">Meera · Editor</span>
                      <span className="gx-editor-skill-text">Motion designer · Reels · Ads</span>
                    </div>
                    <StatusChip variant="waiting">Available Monday</StatusChip>
                  </div>

                  <div className="gx-capacity-editor-card">
                    <div className="gx-editor-info-block">
                      <span className="gx-editor-name-text">Aman · Editor</span>
                      <span className="gx-editor-skill-text">YouTube editor · Long-form · Podcast</span>
                    </div>
                    <StatusChip variant="waiting">Taking requests</StatusChip>
                  </div>
                </div>

                {/* Quiet secondary action: Explore Work Hub */}
                <div className="gx-capacity-footer">
                  <Link href="/product" className="gx-workhub-quiet-link" prefetch={false}>
                    <span>Explore Work Hub</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =================================================================
            7. PROJECT TRACKING CHAPTER (Centered copy + Full-width Kanban, exactly 5 verified stages)
            ================================================================= */}
        <section className="gx-chapter gx-tracking-chapter" id="project-tracking">
          <div className="gx-chapter-container">
            <motion.div
              className="gx-tracking-copy-center"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              <SectionEyebrow>Project tracking</SectionEyebrow>
              <h2 className="gx-chapter-heading gx-heading-to-p">See where every project stands.</h2>
              <p className="gx-chapter-desc gx-heading-to-p">
                Managers update client work through one clear production view.
              </p>
            </motion.div>

            {/* Exactly 5 verified Kanban Stages: New, Assigned, Waiting, Quote sent, Payment pending */}
            <motion.div
              className="gx-tracking-board"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              {/* Column 1: New */}
              <div className="gx-tracking-column">
                <div className="gx-tracking-col-title">New</div>
                <div className="gx-tracking-card" style={{ opacity: 0.5 }}>
                  <span className="gx-tracking-card-title">Horizon Media</span>
                  <span className="gx-tracking-card-meta">Footage shared</span>
                </div>
              </div>

              {/* Column 2: Assigned (Project card moved here) */}
              <div className="gx-tracking-column">
                <div className="gx-tracking-col-title" style={{ color: "var(--gx-lime)" }}>
                  Assigned
                </div>
                <motion.div
                  className="gx-tracking-card is-active-project"
                  layoutId={shouldReduceMotion ? undefined : "active-project-card"}
                >
                  <span className="gx-tracking-card-title">3 kinetic reels</span>
                  <span className="gx-tracking-card-meta">Nova Studio · Aarav · Editor</span>
                  <StatusChip variant="assigned">Assigned</StatusChip>
                </motion.div>
              </div>

              {/* Column 3: Waiting */}
              <div className="gx-tracking-column">
                <div className="gx-tracking-col-title">Waiting</div>
                <div className="gx-tracking-card" style={{ opacity: 0.5 }}>
                  <span className="gx-tracking-card-title">Brand spot cut</span>
                  <span className="gx-tracking-card-meta">Client review</span>
                </div>
              </div>

              {/* Column 4: Quote sent */}
              <div className="gx-tracking-column">
                <div className="gx-tracking-col-title">Quote sent</div>
                <div className="gx-tracking-card" style={{ opacity: 0.5 }}>
                  <span className="gx-tracking-card-title">Podcast pilot</span>
                  <span className="gx-tracking-card-meta">Quote awaiting</span>
                </div>
              </div>

              {/* Column 5: Payment pending */}
              <div className="gx-tracking-column">
                <div className="gx-tracking-col-title">Payment pending</div>
                <div className="gx-tracking-card" style={{ opacity: 0.5 }}>
                  <span className="gx-tracking-card-title">Commercial reel</span>
                  <span className="gx-tracking-card-meta">Milestone payment</span>
                </div>
              </div>
            </motion.div>

            {/* Mobile-optimized single-project card (<= 768px) */}
            <div className="gx-tracking-mobile-card">
              <div className="gx-tracking-mobile-header">
                <span className="gx-tracking-mobile-eyebrow">Active Project Delivery</span>
                <StatusChip variant="assigned">Assigned</StatusChip>
              </div>
              <div className="gx-tracking-mobile-body">
                <h3 className="gx-tracking-mobile-title">3 kinetic reels</h3>
                <p className="gx-tracking-mobile-meta">Nova Studio · Aarav · Lead Editor</p>
                <div className="gx-tracking-mobile-progress">
                  <div className="gx-tracking-mobile-progress-bar">
                    <span className="gx-tracking-step-fill" style={{ width: "40%" }} />
                  </div>
                  <div className="gx-tracking-step-labels">
                    <span className="is-complete">New</span>
                    <span className="is-active">Assigned</span>
                    <span>Waiting</span>
                    <span>Quote</span>
                    <span>Payment</span>
                  </div>
                </div>
                <div className="gx-tracking-mobile-footer">
                  <span>Stage 2 of 5: Assigned</span>
                  <strong>Editor linked</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================
            8. ROLES CHAPTER (Agency, Manager, Editor)
            ================================================================= */}
        <section className="gx-chapter" id="roles">
          <div className="gx-chapter-container">
            <motion.div
              className="gx-roles-header"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              <SectionEyebrow>Built for the whole team</SectionEyebrow>
              <h2 className="gx-chapter-heading gx-heading-to-p">A clear role for everyone.</h2>
            </motion.div>

            <div className="gx-roles-grid">
              <RoleCard
                role="Agency"
                badge="Owner"
                headline="See client work and team activity in one place."
                description="Lead with clear visibility across active projects and communication channels."
                bulletPoints={[
                  "Connect client channels",
                  "Set team access",
                  "Track active projects",
                ]}
              />

              <RoleCard
                role="Manager"
                badge="Operations"
                headline="Turn client enquiries into organised project work."
                description="Delegate briefs with the exact context editors need to begin production."
                bulletPoints={[
                  "Add project context",
                  "Assign an editor",
                  "Control client replies",
                ]}
              />

              <RoleCard
                role="Editor"
                badge="Production"
                headline="Receive clear context and ask questions quickly."
                description="Stay focused on creative work with dedicated briefs and internal support."
                bulletPoints={[
                  "View assigned work",
                  "Chat internally",
                  "Reply when approved",
                ]}
              />
            </div>
          </div>
        </section>

        {/* =================================================================
            9. ANDROID COMPANION
            ================================================================= */}
        <section className="gx-chapter gx-android-chapter" id="android-companion">
          <div className="gx-chapter-container">
            <motion.div
              className="gx-android-inner"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              <SectionEyebrow>Gigxomi on Android</SectionEyebrow>
              <h2 className="gx-chapter-heading gx-heading-to-p">Stay connected when work moves.</h2>
              <p className="gx-chapter-desc gx-heading-to-p">
                Open assigned work, check project context, and stay aligned with your agency while away from the desk.
              </p>
              <div className="gx-android-actions">
                <a className="gx-android-play-link" href="https://play.google.com/store/apps/details?id=com.gigxomi.app" rel="noreferrer" target="_blank">
                  Get it on Google Play <ArrowUpRight size={15} aria-hidden="true" />
                </a>
                <a className="gx-android-video-link" href="https://youtu.be/7WIt28SIjoY" rel="noreferrer" target="_blank">
                  Watch the walkthrough <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>


            </motion.div>
          </div>
        </section>

        {/* =================================================================
            9.5 GUIDES FOR VIDEO EDITING TEAMS
            ================================================================= */}
        <section className="gx-chapter gx-guides-chapter" id="guides">
          <div className="gx-chapter-container">
            <motion.div
              className="gx-guides-header"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              <SectionEyebrow>Resource Guides</SectionEyebrow>
              <h2 className="gx-chapter-heading gx-heading-to-p">Guides for video editing teams</h2>
              <p className="gx-chapter-desc gx-heading-to-p">
                Practical systems for client work, editor coordination, and agency growth.
              </p>
            </motion.div>

            <div className="gx-guides-grid">
              {HOMEPAGE_GUIDES.map((guide) => (
                <article key={guide.href} className="gx-guide-card">
                  <div className="gx-guide-top">
                    <span className="gx-guide-category">{guide.category}</span>
                  </div>
                  <h3 className="gx-guide-title">{guide.title}</h3>
                  <p className="gx-guide-desc">{guide.description}</p>
                  <div className="gx-guide-footer">
                    <Link href={guide.href} className="gx-guide-link" prefetch={false}>
                      <span>Read guide</span>
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =================================================================
            FAQ SECTION
            ================================================================= */}
        <MarketingFaq items={HOMEPAGE_FAQS} page="homepage" />

        {/* =================================================================
            10. FINAL CTA CHAPTER
            ================================================================= */}
        <section className="gx-chapter gx-final-cta-chapter" id="final-cta">
          <div className="gx-chapter-container">
            <motion.div
              className="gx-final-cta-card"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05, margin: "0px 0px -40px 0px" }}
              transition={transition}
            >
              <h2 className="gx-final-cta-heading">Manage your team with a clearer system.</h2>
              <p className="gx-final-cta-copy">
                Bring client conversations, editor coordination, and project tracking into one workspace.
              </p>
              <div className="gx-final-cta-actions">
                <PrimaryButton
                  href="https://app.gigxomi.com/signup?role=agency"
                  icon={<ArrowRight size={15} />}
                  onClick={() =>
                    trackCtaClick({
                      ctaText: "Start free workspace",
                      location: "section",
                      pageType: "homepage",
                      targetUrl: "https://app.gigxomi.com/signup?role=agency",
                    })
                  }
                >
                  Start free workspace
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => {
                    trackCtaClick({
                      ctaText: "Book a demo",
                      location: "section",
                      pageType: "homepage",
                      targetUrl: "demo_modal",
                    });
                    openDemoModal("section");
                  }}
                >
                  Book a demo
                </SecondaryButton>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "20px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "14px",
                  fontSize: "0.85rem",
                  color: "var(--gx-muted-strong, #a3aba0)",
                }}
              >
                <div>
                  <span>Freelance video editor? </span>
                  <a
                    href="https://app.gigxomi.com/signup?role=freelancer"
                    style={{
                      color: "var(--gx-lime, #d7ff2f)",
                      fontWeight: 600,
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                    onClick={() =>
                      trackCtaClick({
                        ctaText: "Create editor profile",
                        location: "section",
                        pageType: "homepage",
                        targetUrl: "https://app.gigxomi.com/signup?role=freelancer",
                      })
                    }
                  >
                    Create editor profile &rarr;
                  </a>
                </div>
                <div>
                  <span>Joining an existing team? </span>
                  <Link
                    href="/login"
                    style={{
                      color: "#ffffff",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                    onClick={() =>
                      trackCtaClick({
                        ctaText: "Sign in with your agency invite",
                        location: "section",
                        pageType: "homepage",
                        targetUrl: "/login",
                      })
                    }
                  >
                    Sign in with your agency invite
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </MarketingSiteShell>
  );
}


