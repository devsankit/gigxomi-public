import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CircleCheckBig,
  Clock3,
  FileCheck2,
  Film,
  Fingerprint,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  WalletCards,
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";

export function FreelancerRegistrationLanding({ signupHref }: { signupHref: string }) {
  return (
    <MarketingSiteShell>
      <main>
        <section className="gx-freelancer-hero">
          <div className="gx-hero-copy">
            <p className="gx-eyebrow"><Sparkles size={14} /> Free Freelancer registration</p>
            <h1>Get more projects from Gigxomi agencies.</h1>
            <p className="gx-hero-lede">Agency owners attend our business workshop, set up their editing business on Gigxomi, and post projects for trusted freelance editors.</p>
            <div className="gx-cta-row"><Link className="gx-button gx-button-primary" href={signupHref}>Yes, Register for Freelancing <ArrowRight size={17} /></Link><Link className="gx-button gx-button-secondary" href="/pricing">Pricing & Plans</Link></div>
            <p className="gx-small-note"><Check size={14} /> Freelancer Starter is free. Portfolio approval is required before services become publicly visible.</p>
          </div>

          <div className="gx-freelancer-stage" aria-label="Freelancer profile and agency project preview">
            <div className="gx-profile-card">
              <div className="gx-profile-cover"><span>AE</span><em><BadgeCheck size={14} /> Verification coming soon</em></div>
              <h2>Aarav Editor</h2><p>Short-form storytelling · Premiere Pro · After Effects</p>
              <div className="gx-profile-stats"><span><b>14</b> projects</span><span><b>4.9</b> rating</span><span><b>2d</b> turnaround</span></div>
              <div className="gx-portfolio-strip"><span><Play size={16} /></span><span><Film size={16} /></span><span><Play size={16} /></span></div>
            </div>
            <div className="gx-match-card"><small>NEW AGENCY MATCH</small><h3>8 founder-led reels</h3><p>Premiere Pro · 4-day delivery</p><div><strong>₹12,000</strong><span>92% skill match</span></div><button type="button">Apply with profile <ArrowRight size={14} /></button></div>
          </div>
        </section>

        <section className="gx-freelancer-value">
          <div className="gx-section-heading gx-centered-heading"><p className="gx-eyebrow">What registration unlocks</p><h2>Build proof once. Use it to access better agency work.</h2></div>
          <div className="gx-value-grid">
            <article><BriefcaseBusiness size={22} /><h3>Agency projects</h3><p>Apply to projects posted by approved Gigxomi agencies when your skills match.</p></article>
            <article><FileCheck2 size={22} /><h3>Portfolio visibility</h3><p>Show original work, your exact editing role, services, turnaround, and realistic pricing after approval.</p></article>
            <article><ShieldCheck size={22} /><h3>Assigned communication</h3><p>Receive the context needed to deliver while the agency keeps ownership of its client relationship.</p></article>
            <article><WalletCards size={22} /><h3>Earnings visibility</h3><p>See project earnings and payout-request progress without chasing updates in private messages.</p></article>
          </div>
        </section>

        <section className="gx-project-opportunities">
          <div className="gx-project-opportunity-copy"><p className="gx-eyebrow">Projects built around editing skills</p><h2>See what agencies need before you apply.</h2><p>Clear scope, expected software, turnaround, proposed price, and project format help both sides choose honestly.</p><Link href={signupHref}>Create your Freelancer profile <ArrowRight size={15} /></Link></div>
          <div className="gx-opportunity-feed">
            <div className="gx-opportunity-head"><span>PROJECT FEED</span><em>Recommended for you</em></div>
            <article><div className="gx-feed-icon primary"><Film size={17} /></div><p><strong>Founder-led reel package</strong><small>Short-form storytelling · 8 videos</small><span><Clock3 size={13} /> 4 days · Premiere Pro</span></p><b>₹12,000</b></article>
            <article><div className="gx-feed-icon neutral"><Play size={17} /></div><p><strong>YouTube documentary</strong><small>Long-form retention · 18–22 minutes</small><span><Clock3 size={13} /> 7 days · Premiere + AE</span></p><b>₹18,500</b></article>
            <article><div className="gx-feed-icon dim"><Star size={17} /></div><p><strong>Podcast highlight system</strong><small>Multicam · Motion graphics · 6 clips</small><span><Clock3 size={13} /> 3 days · DaVinci Resolve</span></p><b>₹8,000</b></article>
          </div>
        </section>

        <section className="gx-onboarding-path">
          <div className="gx-section-heading"><p className="gx-eyebrow">A clear approval path</p><h2>Register today. Build trust through real work.</h2><p>The expanded verification system is a separate launch phase. Until then, the registration page clearly explains what will be reviewed.</p></div>
          <ol>
            <li><span>01</span><div><UploadCloud size={21} /><h3>Submit an original project</h3><p>Share a project you edited, your exact role, software, turnaround, revisions, and proposed service price.</p></div></li>
            <li><span>02</span><div><FileCheck2 size={21} /><h3>Answer qualification questions</h3><p>Help reviewers understand ownership, creative decisions, delivery responsibility, and the quality you can reproduce.</p></div></li>
            <li><span>03</span><div><Fingerprint size={21} /><h3>Verification in the next phase</h3><p>Secure document upload, DigiLocker identity verification, blue ticks, and trust scores will launch separately.</p></div></li>
          </ol>
        </section>

        <section className="gx-trust-standards">
          <div className="gx-trust-scorecard"><div><span>TRUST PROFILE</span><em>Coming soon</em></div><strong>Blue tick + trust score</strong><p>Identity and work-sample approval will create a stronger signal for agencies after the separate verification system launches.</p><section><span><CircleCheckBig size={15} /> Original work</span><span><CircleCheckBig size={15} /> Identity checked</span><span><CircleCheckBig size={15} /> Skills validated</span></section></div>
          <div className="gx-standards-copy"><p className="gx-eyebrow">Professional standards, explained clearly</p><h2>Honest portfolios protect good editors.</h2><p>Gigxomi reviews ownership, quality, service clarity, and pricing so agencies can trust what they see and skilled editors compete on credible proof.</p><ul><li><Check size={16} /><span><strong>Submit only work you edited.</strong> Accurately describe your role and the result you can reproduce.</span></li><li><Check size={16} /><span><strong>Use realistic market pricing.</strong> Services can be returned for correction or rejected when price, scope, and quality do not align.</span></li><li><Check size={16} /><span><strong>Misrepresentation triggers review.</strong> Credible fraud flags pause public visibility; permanent removal follows evidence review and an appeal opportunity.</span></li></ul></div>
        </section>

        <section className="gx-owner-switch">
          <div><p className="gx-eyebrow">Want to become the agency owner?</p><h2>Learn the business model, then open your own delivery workspace.</h2></div>
          <div className="gx-cta-row"><Link className="gx-button gx-button-primary" href="/blog/video-editing-agency-management-software-system">Read Agency Blueprint</Link><Link className="gx-button gx-button-secondary" href="/pricing">View Pricing Plans</Link></div>
        </section>

        <section className="gx-final-cta">
          <p className="gx-eyebrow">Ready to be considered for agency projects?</p><h2>Register free and build an honest Gigxomi Freelancer profile.</h2>
          <p>Use original work, explain your role clearly, and price the service at a level you can confidently deliver.</p>
          <div className="gx-cta-row"><Link className="gx-button gx-button-primary" href={signupHref}>Yes, Register for Freelancing</Link><Link className="gx-text-link" href="/blog/video-editing-agency-management-software-system">Read Agency Blueprint <ArrowRight size={15} /></Link></div>
        </section>
      </main>
    </MarketingSiteShell>
  );
}
