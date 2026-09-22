"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  MessageCircleMore,
  UsersRound,
  ShieldCheck,
  Columns3,
  BriefcaseBusiness,
  Layers3,
  LockKeyhole,
  Search,
  CircleCheck,
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";
import {
  PrimaryButton,
  SecondaryButton,
} from "@/components/public/design-system";
import { MarketingFaq } from "@/components/public/marketing-faq";
import { AGENCY_FAQS } from "@/lib/seo/public-faqs";
import { trackCtaClick, MarketingPageType } from "@/lib/analytics/funnel";
import { openDemoModal } from "@/components/public/demo-modal";
import styles from "./gigxomi-product-hub.module.css";

export type ProductPage = {
  eyebrow: string;
  title: string;
  description: string;
  outcome: string;
  icon: "inbox" | "editors" | "collaboration" | "tracking" | "workhub" | "product" | "agency" | "freelancer";
  proof: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  related: { href: string; label: string; text: string }[];
};

function WorkspaceProof({ page }: { page: ProductPage }) {
  const isTracking = page.icon === "tracking";
  const isEditors = page.icon === "editors" || page.icon === "workhub";
  const isCollaboration = page.icon === "collaboration";

  return (
    <aside className={`${styles.workspaceProof} ${isTracking ? styles.isTracking : ""} ${isEditors ? styles.isEditors : ""} ${isCollaboration ? styles.isCollaboration : ""}`} aria-label="Gigxomi workspace preview">
      <div className={styles.workspaceTopbar}>
        <span className={styles.workspaceBrand}><Layers3 size={14} /> Gigxomi workspace</span>
        <div className={styles.workspaceSources}><span>WhatsApp</span><span>Instagram</span></div>
      </div>
      <div className={styles.workspaceBody}>
        <div className={styles.workspaceRail} aria-hidden="true">
          <MessageCircleMore size={16} /><UsersRound size={16} /><Search size={16} /><Columns3 size={16} />
        </div>
        <div className={styles.workspaceInbox}>
          <small>CLIENT INBOXES</small>
          <div className={styles.workspaceThreadActive}><b>Nova Studio</b><span>3 reels for Friday</span><em>WA</em></div>
          <div className={styles.workspaceThread}><b>Horizon Media</b><span>Footage shared</span><em>IG</em></div>
        </div>
        <div className={styles.workspaceMain}>
          <div className={styles.workspaceMainHead}><b>3 kinetic reels</b><span>Aarav / Editor</span></div>
          <div className={styles.workspaceBrief}><small>CLIENT BRIEF · WHATSAPP</small><p>Need three 9:16 reels for Friday. Footage is in the shared folder.</p></div>
          <div className={styles.workspaceLane}><small><LockKeyhole size={11} /> INTERNAL TEAM LANE</small><p><b>Manager:</b> Brief and files added.</p><p><b>Aarav:</b> I have the reference and context.</p></div>
          {isEditors ? (
            <div className={styles.workspaceRoster}><span><b>Aarav</b><em>Available this week</em></span><button>Assign</button></div>
          ) : isTracking ? (
            <div className={styles.workspaceStages}><span>New</span><b>Assigned</b><span>Waiting</span><span>Quote</span><span>Payment</span></div>
          ) : (
            <div className={styles.workspacePermission}><CircleCheck size={13} /><span>{isCollaboration ? "Client reply enabled by manager" : "Project assigned · context linked"}</span></div>
          )}
        </div>
      </div>
      <div className={styles.workspaceCaption}><span>What this changes</span><strong>{page.outcome}</strong></div>
    </aside>
  );
}

function ProductVisualStrip() {
  return (
    <section className={styles.productVisuals} aria-label="Gigxomi product views">
      <figure className={styles.productVisualWide}>
        <Image
          src="/images/app/app-banner-landscape.png"
          alt="Gigxomi mobile workspace overview"
          width={1024}
          height={500}
          sizes="(max-width: 800px) 100vw, 60vw"
          priority
        />
        <figcaption>See project context and assigned work away from your desk.</figcaption>
      </figure>
      <figure className={styles.productVisualPhone}>
        <Image
          src="/images/app/app-screen-agency.png"
          alt="Gigxomi agency mobile workspace screen"
          width={576}
          height={1024}
          sizes="(max-width: 800px) 44vw, 18vw"
        />
        <figcaption>Keep the team aligned from one workspace.</figcaption>
      </figure>
      <figure className={styles.productVisualPhone}>
        <Image
          src="/images/app/app-screen-talent.png"
          alt="Gigxomi editor mobile workspace screen"
          width={576}
          height={1024}
          sizes="(max-width: 800px) 44vw, 18vw"
        />
        <figcaption>Give editors the brief and context they need.</figcaption>
      </figure>
    </section>
  );
}
const icons: Record<ProductPage["icon"], LucideIcon> = {
  inbox: MessageCircleMore,
  editors: UsersRound,
  collaboration: ShieldCheck,
  tracking: Columns3,
  workhub: BriefcaseBusiness,
  product: Layers3,
  agency: BriefcaseBusiness,
  freelancer: UsersRound,
};

export function GigxomiProductHub({ page }: { page: ProductPage }) {
  const Icon = icons[page.icon];
  const isFreelancer = page.icon === "freelancer";
  const isAgency = page.icon === "agency";
  const pageType: MarketingPageType = isAgency ? "agency" : isFreelancer ? "freelancer" : "product";

  const primaryHref = isAgency
    ? "/signup?role=agency"
    : isFreelancer
    ? "/for-freelance-editors-building-teams#gallery"
    : "/signup?role=agency";
  const primaryLabel = isAgency
    ? "Start free workspace"
    : isFreelancer
    ? "Browse editors / Create profile"
    : "Start free workspace";
  const secondaryHref = isAgency ? "#demo" : isFreelancer ? "/pricing" : "/#workflow";
  const secondaryLabel = isAgency ? "Book a demo" : isFreelancer ? "Agency workspace plans" : "See the workflow";

  return (
    <MarketingSiteShell>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>
              <Icon size={15} />
              {page.eyebrow}
            </p>
            <h1>{page.title}</h1>
            <p className={styles.lede}>{page.description}</p>
            <div className={styles.actions}>
              <PrimaryButton
                href={primaryHref}
                icon={<ArrowRight size={16} />}
                onClick={() =>
                  trackCtaClick({
                    ctaText: primaryLabel,
                    location: "hero",
                    pageType,
                    targetUrl: primaryHref,
                  })
                }
              >
                {primaryLabel}
              </PrimaryButton>
              {isAgency ? (
                <SecondaryButton
                  onClick={() => {
                    trackCtaClick({
                      ctaText: "Book a demo",
                      location: "hero",
                      pageType,
                      targetUrl: "demo_modal",
                    });
                    openDemoModal("hero");
                  }}
                >
                  Book a demo
                </SecondaryButton>
              ) : (
                <SecondaryButton
                  href={secondaryHref}
                  onClick={() =>
                    trackCtaClick({
                      ctaText: secondaryLabel,
                      location: "hero",
                      pageType,
                      targetUrl: secondaryHref,
                    })
                  }
                >
                  {secondaryLabel}
                </SecondaryButton>
              )}
            </div>
            {isAgency && (
              <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "var(--gx-page-muted, #aab2a9)" }}>
                Workspace setup begins with agency details, then client channels and team workflow.
              </p>
            )}
            <p className={styles.signpost}>
              Invited by your agency?{" "}
              <Link
                href="/login"
                prefetch={false}
                onClick={() =>
                  trackCtaClick({
                    ctaText: "Join your workspace via invite",
                    location: "hero",
                    pageType,
                    targetUrl: "/login",
                  })
                }
              >
                Join your workspace via invite
              </Link>
            </p>
          </div>
          <WorkspaceProof page={page} />
        </section>

        <ProductVisualStrip />

        <section className={styles.section}>
          <header>
            <p className={styles.eyebrow}>What Gigxomi supports</p>
            <h2>Built around the work that moves an editing agency forward.</h2>
          </header>
          <div className={styles.grid}>
            {page.proof.map((item, index) => (
              <article key={item.title}>
                <b>0{index + 1}</b>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>


        <section className={styles.section}>
          <header>
            <p className={styles.eyebrow}>How it works</p>
            <h2>One clear operating sequence.</h2>
          </header>
          <ol className={styles.steps}>
            {page.steps.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>


        <section className={styles.section}>
          <header>
            <p className={styles.eyebrow}>Continue exploring</p>
            <h2>Explore the connected parts of Gigxomi.</h2>
          </header>
          <div className={styles.grid}>
            {page.related.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() =>
                  trackCtaClick({
                    ctaText: item.label,
                    location: "card",
                    pageType,
                    targetUrl: item.href,
                  })
                }
              >
                <h3>
                  {item.label} <ArrowRight size={16} />
                </h3>
                <p>{item.text}</p>
              </Link>
            ))}
          </div>
        </section>

        {isAgency && <MarketingFaq items={AGENCY_FAQS} page="agency" />}

        <section className={styles.cta}>
          <Check size={18} />
          <div>
            <p>Designed for video editing teams</p>
            <h2>Give every client enquiry, editor hand-off and project status a home.</h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <PrimaryButton
              href={primaryHref}
              icon={<ArrowRight size={16} />}
              onClick={() =>
                trackCtaClick({
                  ctaText: primaryLabel,
                  location: "section",
                  pageType,
                  targetUrl: primaryHref,
                })
              }
            >
              {primaryLabel}
            </PrimaryButton>
            {isAgency && (
              <SecondaryButton
                onClick={() => {
                  trackCtaClick({
                    ctaText: "Book a demo",
                    location: "section",
                    pageType,
                    targetUrl: "demo_modal",
                  });
                  openDemoModal("section");
                }}
              >
                Book a demo
              </SecondaryButton>
            )}
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  );
}
