"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, type Transition } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Film,
  Play,
  ShieldCheck,
  X,
  MessageCircle,
  BadgeIndianRupee,
  TimerReset,
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/public/design-system";
import { buildServiceInquiryHref } from "@/lib/gigxomi/public-contact";
import { getPlayerEmbedUrl, getVideoPresentation } from "@/lib/gigxomi/media";
import type { DummyPublicServiceCard } from "@/lib/gigxomi/dummy-platform-store";
import { MarketingFaq } from "@/components/public/marketing-faq";
import { FREELANCER_FAQS } from "@/lib/seo/public-faqs";
import {
  trackCtaClick,
  trackFreelancerFilterUsed,
  trackPortfolioPlayed,
  trackFreelancerProfileOpened,
} from "@/lib/analytics/funnel";

import styles from "@/app/for-freelance-editors-building-teams/cohub.module.css";

export type MappedEditorProfile = {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  description: string;
  skills: [string, string];
  availability: string;
  category: "short-form" | "motion" | "youtube" | "general";
  availableNow: boolean;
  thisWeek: boolean;
  basePrice: number;
  deliveryTime: string;
  sampleVideoUrl: string | null;
  deliverables: string[];
  media: Array<{ kind: string; title: string; sourceUrl?: string; accent?: string }>;
  workFrame: {
    format: string;
    aspect: string;
    sampleTitle: string;
    progress: number;
    gradient: string;
  };
  samples: Array<{ title: string; type: string; aspect: string }>;
};

const FILTER_OPTIONS = [
  "All editors",
  "Short-form",
  "Motion design",
  "YouTube",
  "Available now",
] as const;

type FilterType = (typeof FILTER_OPTIONS)[number];

function formatPrice(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function mapServiceToProfile(service: DummyPublicServiceCard, idx: number): MappedEditorProfile {
  const name = service.ownerName?.trim() || service.ownerAlias || "Verified Editor";
  const title = service.title;
  const specialty = service.specialty || service.category || "Video Editor";
  const text = `${specialty} ${service.category} ${title}`.toLowerCase();

  let category: MappedEditorProfile["category"] = "general";
  if (/reel|short|tiktok|vertical/i.test(text)) {
    category = "short-form";
  } else if (/motion|3d|vfx|design|thumbnail|poster/i.test(text)) {
    category = "motion";
  } else if (/youtube|podcast|long-form|doc|essay/i.test(text)) {
    category = "youtube";
  }

  const skills: [string, string] = [
    service.tags?.[0] || (category === "motion" ? "Motion" : "Editing"),
    service.tags?.[1] || (category === "youtube" ? "Pacing" : "Storytelling"),
  ];

  const firstVideoMedia = service.media?.find((m) => m.kind === "video" && m.sourceUrl);
  const sampleVideoUrl = service.sampleVideoUrl || firstVideoMedia?.sourceUrl || null;
  const gradient =
    service.media?.[0]?.accent ||
    (idx % 2 === 0
      ? "linear-gradient(135deg, rgba(215, 255, 47, 0.12) 0%, rgba(20, 26, 18, 0.95) 100%)"
      : "linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(12, 22, 28, 0.95) 100%)");

  const samples = (service.media && service.media.length > 0
    ? service.media.map((m) => ({
        title: m.title || "Project sample",
        type: m.kind === "video" ? "Video cut" : "Design asset",
        aspect: category === "short-form" ? "9:16" : "16:9",
      }))
    : [
        { title: title, type: specialty, aspect: category === "short-form" ? "9:16" : "16:9" },
      ]
  ).slice(0, 3);

  return {
    id: service.id,
    slug: service.slug,
    name,
    title,
    specialty,
    description: service.description || service.summary || "Professional video editing services with verified delivery workflows.",
    skills,
    availability: "Available now",
    category,
    availableNow: true,
    thisWeek: true,
    basePrice: service.basePrice || 2500,
    deliveryTime: service.deliveryTime || "3 days",
    sampleVideoUrl,
    deliverables: service.deliverables || ["Edited master video", "Audio balance", "Revision rounds"],
    media: service.media || [],
    workFrame: {
      format: category === "short-form" ? "Reels" : category === "youtube" ? "YouTube" : "Cut",
      aspect: category === "short-form" ? "9:16" : "16:9",
      sampleTitle: title,
      progress: 60 + (idx * 11) % 35,
      gradient,
    },
    samples,
  };
}

export function FreelancerCoHub({
  initialServices = [],
}: {
  initialServices?: DummyPublicServiceCard[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeFilter, setActiveFilter] = useState<FilterType>("All editors");
  const [selectedProfile, setSelectedProfile] = useState<MappedEditorProfile | null>(null);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const profiles = useMemo(() => {
    return initialServices.map((svc, idx) => mapServiceToProfile(svc, idx));
  }, [initialServices]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!selectedProfile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedProfile(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProfile]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (selectedProfile) {
      document.body.style.overflow = "hidden";
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProfile]);

  // Filtered profiles
  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      if (activeFilter === "All editors") return true;
      if (activeFilter === "Short-form") return profile.category === "short-form";
      if (activeFilter === "Motion design") return profile.category === "motion";
      if (activeFilter === "YouTube") return profile.category === "youtube";
      if (activeFilter === "Available now") return profile.availableNow;
      return true;
    });
  }, [profiles, activeFilter]);

  const transition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] };

  return (
    <MarketingSiteShell hideFooterCta={false}>
      <div className={styles.cohubRoot}>
        {/* HERO SECTION */}
        <section className={styles.heroSection} id="cohub-hero">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Gigxomi CoHub</span>

              <h1 className={styles.heading}>
                Bring the right freelancer into the work.
              </h1>

              <p className={styles.subcopy}>
                Browse available editing capacity, review verified work samples, and assign project work with full brief and asset context in Gigxomi.
              </p>

              <div className={styles.heroActions}>
                <PrimaryButton
                  href="https://app.gigxomi.com/signup?role=freelancer"
                  rel="nofollow"
                  icon={<ArrowRight size={16} />}
                  onClick={() =>
                    trackCtaClick({
                      ctaText: "Create editor profile",
                      location: "hero",
                      pageType: "freelancer",
                      targetUrl: "https://app.gigxomi.com/signup?role=freelancer",
                    })
                  }
                >
                  Create editor profile
                </PrimaryButton>
                <SecondaryButton
                  href="#gallery"
                  onClick={() =>
                    trackCtaClick({
                      ctaText: "Browse editor opportunities",
                      location: "hero",
                      pageType: "freelancer",
                      targetUrl: "#gallery",
                    })
                  }
                >
                  Browse editor opportunities
                </SecondaryButton>
              </div>

              <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "var(--gx-muted-strong, #a3aba0)" }}>
                Freelancers create a profile and portfolio before public visibility or project opportunities.
              </p>

              <div className={styles.trustRow}>
                <span><Film size={15} /> 150+ Verified Editors</span>
                <span><ShieldCheck size={15} /> Masked Client Privacy</span>
                <span><Clock size={15} /> 24–48h Turnaround</span>
              </div>
            </div>

            <div className={styles.heroPreviewCard} aria-label="Gigxomi editor roster preview">
              <header className={styles.previewHeader}>
                <span><i /> CURATED ROSTER CAPACITY</span>
                <em>Available now</em>
              </header>
              <div className={styles.previewMain}>
                <p>Verified post-production specialist</p>
                <strong>Short-Form & Reels Lead</strong>
                <span>Turnaround 24–48h · Verified 4K delivery</span>
              </div>
              <div className={styles.previewFlow}>
                <span><Film size={16} /><b>Portfolio</b><small>Verified clips</small></span>
                <span><ShieldCheck size={16} /><b>Security</b><small>Masked privacy</small></span>
                <span><BadgeIndianRupee size={16} /><b>Payout</b><small>Direct settlement</small></span>
              </div>
              <div className={styles.previewAlert}>
                <Clock size={16} />
                <p>
                  <strong>Active Roster Status</strong>
                  <span>150+ screened video editors ready for agency dispatch</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-STEP FLOW SECTION */}
        <section className={styles.flowSection} id="how-it-works">
          <div className={styles.flowContainer}>
            <div className={styles.flowGrid}>
              <div className={styles.flowCard}>
                <div className={styles.flowStepBadge}>1</div>
                <h3 className={styles.flowStepTitle}>Find capacity</h3>
                <p className={styles.flowStepDesc}>
                  Filter editors by editing specialization and availability window.
                </p>
              </div>

              <div className={styles.flowCard}>
                <div className={styles.flowStepBadge}>2</div>
                <h3 className={styles.flowStepTitle}>Review fit &amp; samples</h3>
                <p className={styles.flowStepDesc}>
                  Inspect craft specializations, work samples, and verified delivery records.
                </p>
              </div>

              <div className={styles.flowCard}>
                <div className={styles.flowStepBadge}>3</div>
                <h3 className={styles.flowStepTitle}>Assign with context</h3>
                <p className={styles.flowStepDesc}>
                  Dispatch project briefs, asset links, and deadlines directly from your workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section className={styles.gallerySection} id="gallery">
          <div className={styles.galleryContainer}>
            {/* Filter Chips Bar */}
            <div className={styles.filterBar} role="toolbar" aria-label="Filter editors by skill and availability">
              {FILTER_OPTIONS.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setActiveFilter(filter);
                      trackFreelancerFilterUsed(filter);
                    }}
                    className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
                    aria-pressed={isActive}
                  >
                    <span>{filter}</span>
                  </button>
                );
              })}
            </div>

            {/* Profiles Grid */}
            <div className={styles.galleryGrid}>
              {filteredProfiles.length === 0 ? (
                <div className={styles.emptyStateCard}>
                  <h3 className={styles.emptyStateTitle}>No editors currently listed</h3>
                  <p className={styles.emptyStateDesc}>
                    Check back soon or register as an editor to showcase your post-production services to agencies.
                  </p>
                  <PrimaryButton href="https://app.gigxomi.com/signup?role=freelancer" rel="nofollow" icon={<ArrowRight size={16} />}>
                    Register as an editor
                  </PrimaryButton>
                </div>
              ) : (
                filteredProfiles.map((profile, idx) => {
                  const isPlaying = activePlayerId === profile.id;
                  const samplePresentation = profile.sampleVideoUrl ? getVideoPresentation(profile.sampleVideoUrl) : null;
                  const autoplayEmbedUrl = profile.sampleVideoUrl ? getPlayerEmbedUrl(profile.sampleVideoUrl) : "";
                  const canPlaySample = Boolean(
                    profile.sampleVideoUrl && samplePresentation && (samplePresentation.embedUrl || samplePresentation.directUrl)
                  );

                  return (
                    <motion.div
                      key={profile.id}
                      className={styles.profileCard}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...transition, delay: shouldReduceMotion ? 0 : idx * 0.05 }}
                    >
                      {/* Image / Work Frame / Player */}
                      <div className={styles.workFrame} style={{ background: profile.workFrame.gradient }}>
                        {isPlaying && samplePresentation ? (
                          <div className={styles.inlinePlayerShell}>
                            {samplePresentation.embedUrl && autoplayEmbedUrl ? (
                              <iframe
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className={styles.inlinePlayerFrame}
                                referrerPolicy="strict-origin-when-cross-origin"
                                src={autoplayEmbedUrl}
                                title={`${profile.title} sample`}
                              />
                            ) : samplePresentation.directUrl ? (
                              <video
                                autoPlay
                                className={styles.inlinePlayerFrame}
                                controls
                                playsInline
                                src={samplePresentation.directUrl}
                              />
                            ) : null}
                            <button
                              aria-label="Close sample player"
                              className={styles.inlinePlayerClose}
                              onClick={() => setActivePlayerId(null)}
                              type="button"
                            >
                              <X size={16} strokeWidth={2} />
                            </button>
                          </div>
                        ) : (
                          <div className={styles.workFrameVisual}>
                            <div className={styles.workFrameTopRow}>
                              <span className={styles.workTag}>{profile.workFrame.format}</span>
                              <span className={styles.workAspect}>{profile.workFrame.aspect}</span>
                            </div>

                            <div className={styles.workFrameCenter}>
                              {canPlaySample ? (
                                <button
                                  type="button"
                                  className={styles.playGlyph}
                                  onClick={() => {
                                    setActivePlayerId(profile.id);
                                    trackPortfolioPlayed({
                                      editorId: profile.id,
                                      mediaType: "video",
                                    });
                                  }}
                                  aria-label={`Play sample reel for ${profile.name}`}
                                >
                                  <Play size={15} fill="currentColor" />
                                </button>
                              ) : (
                                <div className={styles.playGlyph} aria-hidden="true">
                                  <Film size={15} />
                                </div>
                              )}
                            </div>

                            <div className={styles.workFrameBottomRow}>
                              <span className={styles.sampleTitle}>{profile.workFrame.sampleTitle}</span>
                              <div className={styles.timelineScrubber}>
                                <div
                                  className={styles.timelineProgress}
                                  style={{ width: `${profile.workFrame.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Profile Card Content */}
                      <div className={styles.cardContent}>
                        {/* Name & Specialty */}
                        <div className={styles.cardHeader}>
                          <div className={styles.avatarInitial} aria-hidden="true">
                            {profile.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className={styles.cardMeta}>
                            <h3 className={styles.editorName}>{profile.name}</h3>
                            <span className={styles.editorSpecialty}>{profile.specialty}</span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className={styles.skillsRow}>
                          {profile.skills.map((skill) => (
                            <span key={skill} className={styles.skillPill}>
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Availability & Verification */}
                        <div className={styles.statusRow}>
                          <div className={styles.availabilityBadge}>
                            <span className={styles.availabilityDot} aria-hidden="true" />
                            <span>{profile.availability}</span>
                          </div>
                          <div className={styles.trustStatus}>
                            <ShieldCheck size={14} aria-hidden="true" />
                            <span>Verified Member</span>
                          </div>
                        </div>

                        {/* View Profile Action */}
                        <div className={styles.cardAction}>
                          <button
                            type="button"
                            className={styles.viewProfileBtn}
                            onClick={() => {
                              setSelectedProfile(profile);
                              trackFreelancerProfileOpened({
                                editorId: profile.id,
                                specialty: profile.specialty,
                              });
                            }}
                            aria-haspopup="dialog"
                          >
                            View profile
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* FREELANCER FAQ */}
        <MarketingFaq items={FREELANCER_FAQS} page="freelancer" />

        {/* BOTTOM CONVERSION BANNER */}
        <section
          style={{
            width: "min(1180px, calc(100% - 40px))",
            margin: "0 auto 80px",
            padding: "44px 36px",
            background: "linear-gradient(135deg, rgba(215, 255, 47, 0.08) 0%, rgba(20, 26, 18, 0.95) 100%)",
            border: "1px solid var(--gx-border-subtle, #232d21)",
            borderRadius: "20px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <span
              style={{
                color: "var(--gx-lime, #d7ff2f)",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Ready to expand your editing business?
            </span>
            <h2
              style={{
                fontFamily: 'var(--gx-font-display, "Space Grotesk", sans-serif)',
                fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
                margin: "8px 0 0",
                color: "#f5f7f0",
                lineHeight: 1.15,
                letterSpacing: "-0.04em",
              }}
            >
              Create your free editor profile on Gigxomi.
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                color: "var(--gx-muted-strong, #a3aba0)",
                fontSize: "0.96rem",
                lineHeight: 1.6,
              }}
            >
              Publish your video reel, set your delivery rates, and receive agency project offers directly into your workspace.
            </p>
          </div>
          <div>
            <PrimaryButton
              href="https://app.gigxomi.com/signup?role=freelancer"
              rel="nofollow"
              icon={<ArrowRight size={16} />}
              onClick={() =>
                trackCtaClick({
                  ctaText: "Create editor profile",
                  location: "banner",
                  pageType: "freelancer",
                  targetUrl: "https://app.gigxomi.com/signup?role=freelancer",
                })
              }
            >
              Create editor profile
            </PrimaryButton>
          </div>
        </section>

        {/* ACCESSIBLE PROFILE DRAWER */}
        <AnimatePresence>
          {selectedProfile && (
            <div
              className={styles.drawerOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-profile-name"
            >
              <motion.div
                className={styles.drawerBackdrop}
                onClick={() => setSelectedProfile(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />

              <motion.div
                className={styles.drawerPanel}
                initial={shouldReduceMotion ? { opacity: 1 } : { x: "100%" }}
                animate={{ x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
                transition={transition}
              >
                <div className={styles.drawerTop}>
                  <div>
                    <span className={styles.eyebrow}>Editor Profile</span>
                    <h2 id="drawer-profile-name" className={styles.drawerTitle}>
                      {selectedProfile.name}
                    </h2>
                    <span className={styles.drawerSpecialty}>{selectedProfile.specialty}</span>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className={styles.drawerCloseBtn}
                    onClick={() => setSelectedProfile(null)}
                    aria-label="Close profile drawer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.drawerBody}>
                  {/* Overview / Bio */}
                  <div className={styles.drawerSection}>
                    <span className={styles.drawerSectionLabel}>Service Overview</span>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.6, color: "var(--gx-muted-strong, #a3aba0)" }}>
                      {selectedProfile.description}
                    </p>
                  </div>

                  {/* Commercials & Delivery */}
                  <div className={styles.drawerSection}>
                    <span className={styles.drawerSectionLabel}>Commercial Terms</span>
                    <div className={styles.drawerPricingGrid}>
                      <div className={styles.drawerPricingCard}>
                        <span className={styles.drawerPricingLabel}>Starting at</span>
                        <strong className={styles.drawerPricingValue}>{formatPrice(selectedProfile.basePrice)}</strong>
                      </div>
                      <div className={styles.drawerPricingCard}>
                        <span className={styles.drawerPricingLabel}>Delivery turnaround</span>
                        <strong className={styles.drawerPricingValue}>{selectedProfile.deliveryTime}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className={styles.drawerSection}>
                    <span className={styles.drawerSectionLabel}>Core Capabilities</span>
                    <div className={styles.skillsRow}>
                      {selectedProfile.skills.map((skill) => (
                        <span key={skill} className={styles.skillPill}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Availability & Verification */}
                  <div className={styles.drawerSection}>
                    <span className={styles.drawerSectionLabel}>Capacity &amp; Status</span>
                    <div className={styles.drawerStatusGrid}>
                      <div className={styles.drawerStatusCard}>
                        <Clock size={16} style={{ color: "var(--gx-lime, #d7ff2f)" }} />
                        <span>{selectedProfile.availability}</span>
                      </div>
                      <div className={styles.drawerStatusCard}>
                        <ShieldCheck size={16} style={{ color: "var(--gx-lime, #d7ff2f)" }} />
                        <span>Verified Member</span>
                      </div>
                    </div>
                  </div>

                  {/* Work Samples */}
                  <div className={styles.drawerSection}>
                    <span className={styles.drawerSectionLabel}>Sample Portfolio Tracks</span>
                    <div className={styles.samplesList}>
                      {selectedProfile.samples.map((sample, idx) => (
                        <div key={idx} className={styles.sampleCard}>
                          <div className={styles.sampleIconWrap}>
                            <Film size={16} />
                          </div>
                          <div className={styles.sampleDetails}>
                            <span className={styles.sampleCardTitle}>{sample.title}</span>
                            <span className={styles.sampleCardSub}>
                              {sample.type} · {sample.aspect}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Context notice */}
                  <div className={styles.drawerContextNotice}>
                    Assigning this editor routes briefs, asset links, and project requirements directly into their workspace lane with approvals managed by your team.
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.drawerFooter}>
                  <a
                    href={buildServiceInquiryHref({
                      title: selectedProfile.title,
                      slug: selectedProfile.slug,
                      basePrice: selectedProfile.basePrice,
                      deliveryTime: selectedProfile.deliveryTime,
                      ownerName: selectedProfile.name,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inquireBtn}
                    onClick={() =>
                      trackCtaClick({
                        ctaText: "Inquire via WhatsApp",
                        location: "drawer",
                        pageType: "freelancer",
                        targetUrl: "whatsapp_inquiry",
                      })
                    }
                  >
                    <MessageCircle size={16} />
                    <span>Inquire via WhatsApp</span>
                  </a>
                  <a
                    href="https://app.gigxomi.com/login"
                    rel="nofollow"
                    className={styles.assignBtn}
                    onClick={() =>
                      trackCtaClick({
                        ctaText: "Assign from workspace",
                        location: "drawer",
                        pageType: "freelancer",
                        targetUrl: "https://app.gigxomi.com/login",
                      })
                    }
                  >
                    <span>Assign from workspace</span>
                    <ArrowRight size={16} />
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MarketingSiteShell>
  );
}
