"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Clapperboard,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export type HomepageBlogPost = {
  excerpt: string;
  id: number;
  title: string;
  url: string;
};

export function HomepageBrandSections({ blogPosts }: { blogPosts: HomepageBlogPost[] }) {
  return (
    <>
      <section className="homepage-network-section" aria-labelledby="network-title">
        <div className="homepage-network-intro">
          <p className="section-label">One path from editor to business owner.</p>
          <h2 id="network-title">Start your online video editing business. Build it to deliver reliably.</h2>
          <p>Gigxomi connects client acquisition, business operations, and team delivery so creative work can move through one trusted system.</p>
        </div>
        <div className="homepage-network-paths">
          <article>
            <span className="homepage-network-icon"><Clapperboard size={19} /></span>
            <div>
              <p>Start the business</p>
              <h3>Package your editing skill as a clear business offer.</h3>
              <ul>
                <li><Check size={14} /> Define focused services</li>
                <li><Check size={14} /> Convert enquiries into clients</li>
                <li><Check size={14} /> Track projects and collections</li>
              </ul>
            </div>
          </article>
          <article>
            <span className="homepage-network-icon"><BriefcaseBusiness size={19} /></span>
            <div>
              <p>Grow the business</p>
              <h3>Add delivery capacity without losing control.</h3>
              <ul>
                <li><Check size={14} /> Match vetted editors</li>
                <li><Check size={14} /> Review work before handoff</li>
                <li><Check size={14} /> Keep team and money visible</li>
              </ul>
            </div>
          </article>
        </div>
        <Link className="primary-button homepage-network-cta" href="/pricing">
          View pricing plans <ArrowRight size={15} />
        </Link>
      </section>

      <section className="homepage-brand-proof" aria-label="Gigxomi brand promises">
        <div className="homepage-brand-proof-copy">
          <p className="section-label">Built for real creative work</p>
          <h2>Discovery is only useful when delivery stays accountable.</h2>
          <p>
            Gigxomi brings service proof, human support, structured handoffs, and transparent workflow signals into one recognizable brand experience.
          </p>
        </div>
        <div className="homepage-brand-proof-grid">
          {[
            { icon: BadgeCheck, title: "Proof before promises", copy: "Service samples, profile detail, and delivery expectations are visible before engagement." },
            { icon: ShieldCheck, title: "Protected workflows", copy: "Agency relationships, scoped access, approval steps, and trust signals stay part of the operating layer." },
            { icon: MessageCircle, title: "WhatsApp-first support", copy: "The experience respects how Indian creative businesses already start and manage conversations." },
            { icon: HeartHandshake, title: "Human when it matters", copy: "Gigxomi support can help with onboarding, provider alignment, and practical resolution paths." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={19} strokeWidth={1.7} />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="homepage-mobile-app" aria-labelledby="homepage-mobile-title">
        <div className="homepage-mobile-app-copy">
          <p className="section-label">Gigxomi mobile application</p>
          <h2 id="homepage-mobile-title">Keep every lead, assignment, and payout within reach.</h2>
          <p>
            A connected mobile workspace for agency owners coordinating clients, editors, managers, delivery, and payouts. Move from notification to action without losing the project context.
          </p>
          <div className="homepage-mobile-role-grid">
            <div><Users size={17} /><strong>Delivery team</strong><span>Assignments, chats, reviews, delivery, earnings.</span></div>
            <div><BriefcaseBusiness size={17} /><strong>Agency owner</strong><span>Leads, clients, approvals, team, accounts.</span></div>
          </div>
          <Link className="primary-button" href="/pricing">View pricing plans <ArrowRight size={15} /></Link>
        </div>
        <div className="homepage-mobile-device" aria-label="Gigxomi mobile app preview">
          <div className="homepage-mobile-device-bar"><span>9:41</span><strong>GIGXOMI</strong><span>●●●</span></div>
          <div className="homepage-mobile-greeting"><span>Workspace overview</span><strong>Good work stays visible.</strong></div>
          <div className="homepage-mobile-kpis">
            <div><MessageCircle size={16} /><span>Active chats</span><strong>12</strong></div>
            <div><Wallet size={16} /><span>Balance</span><strong>₹18.4k</strong></div>
          </div>
          <div className="homepage-mobile-task"><span><Smartphone size={15} /> Next action</span><strong>Review delivery • Wedding highlight</strong><i /></div>
          <div className="homepage-mobile-nav"><span className="active">Home</span><span>Projects</span><span>Chat</span><span>Money</span></div>
        </div>
      </section>

      <section className="homepage-journal" aria-labelledby="journal-title">
        <div className="matcher-homepage-section-head">
          <div>
            <p className="section-label">Gigxomi Journal</p>
            <h2 className="matcher-homepage-section-title" id="journal-title">Ideas for better creative work and agency growth.</h2>
          </div>
          <Link className="matcher-homepage-link" href="/blog">View all blogs</Link>
        </div>
        {blogPosts.length ? (
          <div className="homepage-journal-grid">
            {blogPosts.map((post) => (
              <article key={post.id}>
                <span><BookOpen size={14} /> Article</span>
                <h3>{post.title}</h3>
                {post.excerpt ? <p>{post.excerpt}</p> : null}
                <Link href={post.url}>Read article <ArrowUpRight size={14} /></Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="homepage-journal-empty">
            <div><Sparkles size={20} /><span>New editorial stories are in production.</span></div>
            <p>Use the Gigxomi knowledge base now for practical guidance on services, profiles, payments, chat, and delivery.</p>
            <Link href="/knowledge-base">Explore practical guides <ArrowRight size={14} /></Link>
          </div>
        )}
      </section>

      <section className="homepage-founder" aria-labelledby="founder-title">
        <div className="homepage-founder-portrait">
          <Image alt="Ankit Rathore, founder of Gigxomi" fill sizes="(max-width: 720px) 100vw, 260px" src="/images/gapp/ankit-rathore-gapp-hero.png" />
          <span>Founder-led</span>
        </div>
        <div className="homepage-founder-story">
          <p className="section-label">Built from operator experience</p>
          <h2 id="founder-title">The system behind Gigxomi is taught by the person building it.</h2>
          <p>Ankit Rathore works with the same questions freelancers and agency founders face every day: how to package the offer, protect the client, review delivery, and make team economics visible.</p>
          <div className="homepage-founder-signals">
            <span><BadgeCheck size={14} /> Product operator</span>
            <span><Users size={14} /> Agency-delivery builder</span>
            <span><BriefcaseBusiness size={14} /> Creative-team systems</span>
          </div>
          <div className="homepage-founder-actions">
            <Link className="primary-button" href="/blog/video-editing-agency-management-software-system">Read Agency Blueprint <ArrowRight size={15} /></Link>
            <Link className="ghost-button" href="/pricing">View pricing plans</Link>
          </div>
        </div>
      </section>
    </>
  );
}
