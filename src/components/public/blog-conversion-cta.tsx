import Link from "next/link";

import { publicSupportWhatsApp } from "@/lib/seo/public-support-contact";

type Props = {
  slug: string;
  title?: string;
};

export function BlogConversionCta({ slug, title }: Props) {
  const message = [
    "Hi Gigxomi team,",
    title ? `I read \"${title}\" on Gigxomi.` : "I found Gigxomi through your agency operations blog.",
    "I run a video editing agency and want to see how Gigxomi handles multi-seat WhatsApp inbound, two-lane phone masking, and editor dispatch.",
  ].join(" ");
  const whatsappUrl = `https://wa.me/${publicSupportWhatsApp.digits}?text=${encodeURIComponent(message)}`;

  return (
    <section className="blog-cta-panel">
      <p className="blog-kicker">Agency Operations & Workflow Software</p>
      <h2>Run your video editing agency without becoming the middleman</h2>
      <p>
        Connect your client WhatsApp and Instagram inboxes, delegate briefs to specialist editors with two-lane phone
        masking, and track 5-stage Kanban deliveries for a flat ₹2,000/mo with 0% platform commission.
      </p>
      <div className="blog-hero-actions">
        <Link className="blog-primary-link" href="/pricing">
          Start 14-day agency trial
        </Link>
        <Link className="blog-secondary-link" href="/demo">
          Try interactive demo
        </Link>
        <a className="blog-secondary-link" href={whatsappUrl} rel="noreferrer" target="_blank">
          Chat with onboarding team
        </a>
      </div>
      <small>WhatsApp Business: {publicSupportWhatsApp.display} · Flat ₹2,000/mo · 0% commission</small>
    </section>
  );
}

