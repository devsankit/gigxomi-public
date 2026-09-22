"use client";

import Link from "next/link";
import Image from "next/image";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  Gift,
  ShieldCheck,
  Timer,
  Video,
  Zap,
} from "lucide-react";

type GappWebinarView = {
  capacity: number | null;
  countdownEnabled: boolean;
  currency: string;
  description: string;
  id: string;
  meetingLink: string | null;
  phonePeEnabled: boolean;
  priceAmount: number;
  priceMode: "FREE" | "PAID";
  registrationEnabled: boolean;
  registrationCount: number;
  scheduledAt: string;
  thumbnailUrl: string | null;
  title: string;
};

type RegisterPayload = {
  ok?: boolean;
  error?: string;
  redirectUrl?: string;
};

const founderStoryStill = "/images/gapp/ankit-rathore-founder-story-still.png";
const officePortraitImage = "/images/gapp/ankit-rathore-post-production-work-office.jpg";
const awardRecognitionImage = "/images/gapp/ankit-rathore-bni-award-recognition.png";
const heroFounderImage = "/images/gapp/ankit-rathore-gapp-hero.png";

const trustSignals = ["Workmob Story", "Post Production Work", "Google Reviews", "Live Workshop", "Video Testimonials"];

const problemCards = [
  {
    image: "/images/gapp/problem-everything-depends-on-you.png",
    problem: "Everything Depends On You",
    solution: "Build a delivery system so clients, editors, revisions, and approvals stop living only in your head.",
  },
  {
    image: "/images/gapp/problem-editors-no-process.png",
    problem: "Editors Don't Follow A Process",
    solution: "Give editors a clear brief, revision flow, quality checks, and project payout structure.",
  },
  {
    image: "/images/gapp/problem-client-approval-delay.png",
    problem: "Clients Delay Approvals",
    solution: "Reduce copy-paste work and move approvals faster with protected client-editor communication.",
  },
];

const webinarAgenda = [
  "Scale from freelancer to agency owner",
  "Build systems instead of manual operations",
  "Manage editors and clients professionally",
  "Reduce copy-paste revision work",
  "Get approvals faster under your own brand",
  "Use GAPP as agency growth infrastructure",
];

const bonuses = ["Facebook Ads Mastery", "Google Ads Mastery", "Premium editing assets", "Agency scaling blueprint", "Client onboarding templates"];

const notForAudience = [
  "You are not ready to build a video editing agency",
  "You are just starting your freelancing or editing career",
  "You do not see video editing as a serious career path",
  "You are not comfortable using tools, apps, or online systems",
  "You do not have a PC or laptop for video editing work",
];

const testimonialVideos = [
  ["/videos/gapp/testimonial-edits-4.mp4", "Student result"],
  ["/videos/gapp/testimonial-edits-5.mp4", "Workshop result"],
  ["/videos/gapp/testimonial-edits-7.mp4", "Career momentum"],
  ["/videos/gapp/testimonial-edits-6.mp4", "Agency learning"],
];

const faqs = [
  ["Is this only for agencies?", "No. It is for freelancers and agency owners who want a scalable editing delivery system."],
  ["Can freelancers join?", "Yes. This workshop is built for serious video editors who want to grow beyond solo work."],
  ["Will my clients see Gigxomi branding?", "No. The GAPP model keeps your agency brand in front."],
  ["Is this only software?", "No. GAPP is an agency growth ecosystem: systems, editors, delivery flow, trust, and growth infrastructure."],
  ["What happens after registration?", "You reach the thank-you page and receive the next joining instructions."],
  ["Is the webinar free or paid?", "The admin controls each batch. If paid, payment unlocks the thank-you page."],
];

function formatWebinarDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCompactTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCountdownParts(target: string) {
  const distance = Math.max(0, new Date(target).getTime() - Date.now());
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;
  return {
    days: Math.floor(distance / day),
    hours: Math.floor((distance % day) / hour),
    minutes: Math.floor((distance % hour) / minute),
    seconds: Math.floor((distance % minute) / 1000),
  };
}

function track(event: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    path: window.location.pathname,
    url: window.location.href,
    ...payload,
  });
  if (typeof window.fbq === "function") {
    try {
      window.fbq("trackCustom", event, payload);
    } catch {
      // Pixel failure should not block registration.
    }
  }
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

function scrollToElement(id: string, eventName: string) {
  track(eventName);
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionIntro({ body, eyebrow, title }: { body?: string; eyebrow?: string; title: string }) {
  return (
    <div className="gapp-section-intro">
      {eyebrow ? <p>{eyebrow}</p> : null}
      <h2>{title}</h2>
      {body ? <span>{body}</span> : null}
    </div>
  );
}

function CheckRow({ children }: { children: ReactNode }) {
  return (
    <div className="gapp-check-row">
      <Check size={16} strokeWidth={2.2} />
      <span>{children}</span>
    </div>
  );
}

function Countdown({ scheduledAt, variant = "default" }: { scheduledAt: string; variant?: "default" | "hero" }) {
  const [parts, setParts] = useState<ReturnType<typeof getCountdownParts> | null>(null);

  useEffect(() => {
    const initial = window.setTimeout(() => setParts(getCountdownParts(scheduledAt)), 0);
    const timer = window.setInterval(() => setParts(getCountdownParts(scheduledAt)), 1_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [scheduledAt]);

  return (
    <div className={variant === "hero" ? "gapp-countdown hero" : "gapp-countdown"} aria-label="Webinar countdown">
      {variant === "hero" ? (
        <div className="gapp-countdown-label">
          <Clock3 size={16} />
          <span>Registration closes soon</span>
        </div>
      ) : null}
      {[
        ["Days", parts?.days ?? null],
        ["Hours", parts?.hours ?? null],
        ["Minutes", parts?.minutes ?? null],
        ["Seconds", parts?.seconds ?? null],
      ].map(([label, value]) => (
        <div key={label}>
          <strong>{value === null ? "--" : String(value).padStart(2, "0")}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function GappWebinarLanding({ supportPhone, webinar }: { supportPhone: string; webinar: GappWebinarView }) {
  const [form, setForm] = useState({
    currentMonthlyProjects: "",
    email: "",
    fullName: "",
    participantType: "",
    whatsappNumber: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPaid = webinar.priceMode === "PAID";
  const activePrice = isPaid ? `INR ${webinar.priceAmount}` : "Free";
  const scheduledLabel = useMemo(() => formatWebinarDate(webinar.scheduledAt), [webinar.scheduledAt]);
  const compactDate = useMemo(() => formatCompactDate(webinar.scheduledAt), [webinar.scheduledAt]);
  const compactTime = useMemo(() => formatCompactTime(webinar.scheduledAt), [webinar.scheduledAt]);
  const registrationCount = Math.max(0, webinar.registrationCount);
  const seatsRemaining = webinar.capacity ? Math.max(0, webinar.capacity - registrationCount) : null;
  const registrationProgress = webinar.capacity
    ? Math.min(100, Math.max(0, (registrationCount / webinar.capacity) * 100))
    : null;
  const registrationHeadline = registrationCount
    ? `${registrationCount.toLocaleString("en-IN")} ${registrationCount === 1 ? "registration" : "registrations"}`
    : "Registration is now open";

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    track("gapp_webinar_form_submitted", {
      participantType: form.participantType,
      priceMode: webinar.priceMode,
    });

    const response = await fetch("/api/gapp/webinar/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sourcePath: window.location.pathname,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as RegisterPayload;
    if (!response.ok || payload.ok === false || !payload.redirectUrl) {
      setError(payload.error ?? "Registration could not be completed right now.");
      setIsSubmitting(false);
      return;
    }

    track(isPaid ? "gapp_webinar_payment_started" : "gapp_webinar_registration_success", {
      priceMode: webinar.priceMode,
    });
    window.location.href = payload.redirectUrl;
  }

  return (
    <main className="gapp-page gapp-reset-page">
      <section className="gapp-urgency-strip">Limited-time offer: reserve your seat now</section>

      <section className="gapp-seat-status-card">
        <div>
          <strong>{registrationHeadline}</strong>
          <span>{registrationCount ? "Confirmed for this live batch" : `Be among the first for ${compactDate}`}</span>
        </div>
        <div
          aria-label={registrationProgress === null ? "Registration is open" : `${Math.round(registrationProgress)}% of seats registered`}
          className={registrationProgress === null ? "gapp-seat-progress is-open" : "gapp-seat-progress"}
          role="progressbar"
          aria-valuemax={registrationProgress === null ? undefined : 100}
          aria-valuemin={registrationProgress === null ? undefined : 0}
          aria-valuenow={registrationProgress === null ? undefined : Math.round(registrationProgress)}
        >
          <i style={registrationProgress === null ? undefined : { width: `${registrationProgress}%` }} />
        </div>
        <div>
          <strong>{seatsRemaining === null ? "Live online batch" : `${seatsRemaining.toLocaleString("en-IN")} seats remaining`}</strong>
          <span>{webinar.capacity ? `${webinar.capacity.toLocaleString("en-IN")} total capacity` : `Scheduled for ${compactDate}`}</span>
        </div>
      </section>

      <section className="gapp-hero">
        <div className="gapp-hero-copy">
          <p className="gapp-live-pill">
            I Will Show You <span>LIVE</span>
          </p>
          <h1>Stop Doing Everything Yourself.</h1>
          <h2>Build A Scalable Video Editing Agency.</h2>
          <p className="gapp-subheadline">Systems, skilled editors, faster approvals, and your brand in front.</p>
          <div className="gapp-hero-actions">
            <button className="gapp-primary-button" onClick={() => scrollToElement("gapp-registration", "gapp_webinar_cta_clicked")} type="button">
              Reserve My Seat
              <ArrowRight size={17} strokeWidth={2} />
            </button>
          </div>
          <div className="gapp-hero-meta">
            <span>Limited batch seats</span>
            <span>{scheduledLabel}</span>
            <span>Support: {supportPhone}</span>
          </div>
          {webinar.countdownEnabled ? <Countdown scheduledAt={webinar.scheduledAt} variant="hero" /> : null}
        </div>

        <div className="gapp-webinar-detail-card hero-founder-card">
          <Image alt="Ankit Rathore, host of the GAPP workshop" height={1928} priority sizes="(max-width: 720px) calc(100vw - 24px), (max-width: 1040px) calc(100vw - 32px), 42vw" src={heroFounderImage} width={1543} />
          <div className="gapp-webinar-detail-grid">
            <div>
              <CalendarClock size={20} />
              <span>Date</span>
              <strong>{compactDate}</strong>
            </div>
            <div>
              <Clock3 size={20} />
              <span>Time</span>
              <strong>{compactTime}</strong>
            </div>
            <div>
              <Timer size={20} />
              <span>Duration</span>
              <strong>Live Workshop</strong>
            </div>
            <div>
              <Video size={20} />
              <span>Mode</span>
              <strong>Online</strong>
            </div>
          </div>
          <div className="gapp-webinar-price">
            <span>{isPaid ? "Limited-time workshop price" : "This batch"}</span>
            <strong>{activePrice}</strong>
            {isPaid ? <s>INR 999</s> : null}
          </div>
        </div>
      </section>

      <section className="gapp-trust-logo-band" aria-label="Trust signals">
        <p>Trust Signals</p>
        <div>
          {trustSignals.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </section>

      <section className="gapp-award-section">
        <div className="gapp-award-card">
          <div className="gapp-award-image">
            <Image alt="Ankit Rathore receiving BNI recognition award" height={1086} loading="lazy" sizes="(max-width: 720px) calc(100vw - 56px), 46vw" src={awardRecognitionImage} width={1448} />
          </div>
          <div className="gapp-award-copy">
            <p className="gapp-eyebrow">Authority</p>
            <h2>Recognized founder. Real post-production operator.</h2>
            <span>BNI recognition, founder story, live workshop experience, and real agency delivery work behind GAPP.</span>
            <div>
              {["BNI recognition", "Post Production Work", "Founder-led workshop"].map((item) => (
                <strong key={item}>
                  <BadgeCheck size={16} />
                  {item}
                </strong>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="gapp-problem-section">
        <SectionIntro
          eyebrow="Workshop Problems"
          title="How To Fix The Problems Keeping Your Editing Agency Trapped"
          body="No theory. Only the bottlenecks every growing editor hits."
        />
        <div className="gapp-problem-grid">
          {problemCards.map((card, index) => (
            <article className="gapp-problem-card" key={card.problem}>
              <div className="gapp-problem-image">
                <Image alt={card.problem} fill loading="lazy" sizes="(max-width: 720px) calc(100vw - 24px), (max-width: 1040px) 50vw, 33vw" src={card.image} />
                <span>Problem {String(index + 1).padStart(2, "0")}</span>
              </div>
              <div>
                <h3>{card.problem}</h3>
                <p>
                  <Zap size={15} />
                  Solution
                </p>
                <span>{card.solution}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gapp-host-section">
        <div className="gapp-host-card">
          <div className="gapp-host-portrait clean">
            <Image alt="Ankit Rathore, founder of Post Production Work" fill loading="lazy" sizes="(max-width: 1040px) calc(100vw - 32px), 42vw" src={officePortraitImage} />
            <span>Host</span>
          </div>
          <div className="gapp-host-copy">
            <p className="gapp-eyebrow">Hosted by</p>
            <h2>Ankit Rathore</h2>
            <strong>Founder, Post Production Work, Dewas, Madhya Pradesh</strong>
            <div className="gapp-host-authority-grid">
              {["Post-production operator", "Agency delivery builder", "Creative team systems mentor"].map((item) => (
                <span key={item}>
                  <BadgeCheck size={16} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="gapp-workmob-section">
        <div className="gapp-workmob-card">
          <div>
            <p className="gapp-eyebrow">Featured In Workmob YourStory</p>
            <h2>17-minute founder journey behind Post Production Work.</h2>
            <span>Featured story of Ankit Rathore, Founder at Post Production Work, Dewas, Madhya Pradesh. From editing delivery to agency infrastructure, presented here as founder-led authority for the registration page.</span>
          </div>
          <div className="gapp-workmob-story story-visual">
            <Image alt="Ankit Rathore founder story" fill loading="lazy" sizes="(max-width: 720px) calc(100vw - 64px), 32vw" src={founderStoryStill} />
            <div>
              <span className="gapp-story-badge">17 min story</span>
              <strong>Founder Journey</strong>
              <span>Workmob profile story</span>
            </div>
          </div>
        </div>
      </section>

      <section className="gapp-video-section" id="gapp-video-section">
        <SectionIntro eyebrow="Client Results" title="Real Video Testimonials From Workshop Attendees" />
        <div className="gapp-testimonial-video-grid compact">
          {testimonialVideos.map(([src, title]) => (
            <article className="gapp-testimonial-video-card" key={src}>
              <video controls playsInline preload="none">
                <source src={src} type="video/mp4" />
              </video>
              <div>
                <span>Video testimonial</span>
                <strong>{title}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gapp-section split">
        <div>
          <SectionIntro eyebrow="You Will Learn" title="What Changes After This Workshop" />
          <div className="gapp-agenda-timeline">
            {webinarAgenda.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionIntro eyebrow="Bonus Gifts" title="Free Bonus Gifts For Attendees" />
          <div className="gapp-bonus-stack">
            {bonuses.map((title) => (
              <div key={title}>
                <Gift size={18} />
                <strong>{title}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gapp-section gapp-not-for-section">
        <SectionIntro
          eyebrow="Not For Everyone"
          title="This Workshop Is Not For You If..."
          body="GAPP is for serious video editors who want to build an agency with systems, clients, and delivery discipline. It is not a beginner motivation session."
        />
        <div className="gapp-not-for-grid">
          {notForAudience.map((item, index) => (
            <article className="gapp-not-for-card" key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </section>
      <section className="gapp-registration-section" id="gapp-registration">
        <div className="gapp-registration-copy">
          <p className="gapp-eyebrow">Reserve Your Seat</p>
          <h2>{isPaid ? "Reserve Your Seat" : "Reserve Your Free Seat"}</h2>
          <p>Seats close once the batch is full. Bonuses unlock after registration.</p>
          {webinar.countdownEnabled ? <Countdown scheduledAt={webinar.scheduledAt} /> : null}
          <div className="gapp-mini-stack">
            <CheckRow>Webinar: {scheduledLabel}</CheckRow>
            <CheckRow>
              {isPaid ? <s>INR 999</s> : null}
              {isPaid ? `Workshop price: ${activePrice}` : "Free registration"}
            </CheckRow>
            <CheckRow>WhatsApp support: {supportPhone}</CheckRow>
          </div>
        </div>

        <form className="gapp-form" onSubmit={submitRegistration}>
          <div className="gapp-form-head">
            <span>Workshop Registration</span>
            <strong>{activePrice}</strong>
          </div>
          <label>
            <span>Full Name</span>
            <input
              autoComplete="name"
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Your full name"
              required
              value={form.fullName}
            />
          </label>
          <label>
            <span>WhatsApp Number</span>
            <input
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) => setForm((current) => ({ ...current, whatsappNumber: event.target.value }))}
              placeholder="9993328124"
              required
              type="tel"
              value={form.whatsappNumber}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="you@example.com"
              required
              type="email"
              value={form.email}
            />
          </label>
          <label>
            <span>Are you a freelancer or agency?</span>
            <select
              onChange={(event) => setForm((current) => ({ ...current, participantType: event.target.value }))}
              required
              value={form.participantType}
            >
              <option value="">Select one</option>
              <option>Freelancer video editor</option>
              <option>Growing editing agency</option>
              <option>Creator/team building editing operations</option>
            </select>
          </label>
          <label>
            <span>Current monthly projects</span>
            <select
              onChange={(event) => setForm((current) => ({ ...current, currentMonthlyProjects: event.target.value }))}
              required
              value={form.currentMonthlyProjects}
            >
              <option value="">Select volume</option>
              <option>0-2 projects</option>
              <option>3-5 projects</option>
              <option>6-10 projects</option>
              <option>10+ projects</option>
            </select>
          </label>
          {error ? <p className="gapp-form-error">{error}</p> : null}
          <button className="gapp-primary-button full" disabled={!webinar.registrationEnabled || isSubmitting} type="submit">
            {isSubmitting ? "Securing your seat..." : isPaid ? "Continue to Secure Payment" : "Reserve My Webinar Seat"}
            <CreditCard size={17} strokeWidth={2} />
          </button>
          {!webinar.registrationEnabled ? <p className="gapp-form-error">Registration is currently closed for this batch.</p> : null}
          <div className="gapp-form-trust-row">
            {["Secure PhonePe payment", "No spam", "WhatsApp follow-up only", "Your brand stays yours"].map((item) => (
              <span key={item}>
                <ShieldCheck size={14} />
                {item}
              </span>
            ))}
          </div>
        </form>
      </section>

      <section className="gapp-final-offer-card">
        <p>One Last Moment Before You Leave...</p>
        <h2>{activePrice}</h2>
        {isPaid ? <span>Inc. GST / Limited seats available</span> : <span>Limited seats available</span>}
        <button className="gapp-primary-button" onClick={() => scrollToElement("gapp-registration", "gapp_final_offer_cta_clicked")} type="button">
          Reserve My Seat Now
          <ArrowRight size={17} />
        </button>
        <div>
          <CheckRow>Live interactive workshop</CheckRow>
          <CheckRow>Founder-led agency systems</CheckRow>
          <CheckRow>Attendee bonuses included</CheckRow>
        </div>
      </section>

      <section className="gapp-section">
        <SectionIntro eyebrow="FAQ" title="Quick Answers" />
        <div className="gapp-faq-grid">
          {faqs.map(([question, answer], index) => (
            <details className="gapp-faq-item" key={question} open={index === 0}>
              <summary>
                <span>{question}</span>
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="gapp-policy-title" className="gapp-policy-panel">
        <div>
          <p>Clear workshop policies</p>
          <h2 id="gapp-policy-title">Know the payment, cancellation, and delivery terms before registering.</h2>
          <p>
            GAPP is a scheduled digital workshop. Your seat and attendee access are confirmed after successful payment.
            Cancellation and refund eligibility depend on when the request is made and whether workshop access or delivery has begun.
          </p>
        </div>
        <ul>
          <li><strong>Before access begins</strong><span>Eligible cancellation requests are reviewed under the published refund policy.</span></li>
          <li><strong>After access begins</strong><span>Consumed live or digital access is generally non-refundable, except where required by law.</span></li>
          <li><strong>Delivery</strong><span>Registration confirmation, workshop access, and follow-up material are delivered digitally.</span></li>
        </ul>
        <nav aria-label="Workshop policies">
          <Link href="/refund-and-cancellation-policy">Refund &amp; Cancellation Policy</Link>
          <Link href="/service-delivery-policy">Service Delivery Policy</Link>
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </nav>
      </section>

      <div className="gapp-bottom-conversion-bar" role="region" aria-label="GAPP registration shortcut">
        <div>
          <span>GAPP Live Workshop</span>
          <strong>{compactDate} / {compactTime} / Online</strong>
        </div>
        <button className="gapp-mobile-sticky-cta" onClick={() => scrollToElement("gapp-registration", "gapp_mobile_sticky_cta_clicked")} type="button">
          <Zap size={16} />
          Reserve Seat
        </button>
      </div>

    </main>
  );
}
