import type { Metadata } from "next";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Privacy Policy | ${companyKnowledgeBase.brandName}`;
const description = `${companyKnowledgeBase.brandName} explains how the web app, mobile app, dashboards, WhatsApp workflows, and marketplace features collect, use, disclose, protect, and manage user data.`;
const lastUpdated = "May 19, 2026";

const collectedData = [
  {
    title: "Account and identity data",
    body: "Name, agency or freelancer profile details, email address, WhatsApp or phone number, role, package status, login events, OTP challenge status, and account preferences.",
  },
  {
    title: "Agency, freelancer, and project data",
    body: "Service listings, portfolios, assignment records, project briefs, chat context, delivery files, review notes, payout and wallet states, task applications, and team permissions.",
  },
  {
    title: "Messages and communications",
    body: "Messages sent through in-app chat, WhatsApp Business API flows, support requests, internal notes, customer lane messages, manager comments, and notification delivery records.",
  },
  {
    title: "Media, files, and optional audio",
    body: "Files, thumbnails, videos, documents, images, voice notes, and audio recordings that users choose to upload or record. Microphone access is used only when a user starts an audio or voice-note feature.",
  },
  {
    title: "Payment and billing data",
    body: "Package selection, transaction identifiers, payment status, invoices, payout requests, wallet credits, refund or cancellation context, and payment provider references.",
  },
  {
    title: "Device, app, and usage data",
    body: "Device type, browser, operating system, app version, session cookies, push notification tokens, logs, crash or performance signals, security events, and analytics needed to operate the service.",
  },
];

const useCases = [
  "Create and authenticate agency, freelancer, manager, and super-admin accounts.",
  "Route customer messages, project requests, files, and internal notes to the correct tenant, role, and workspace.",
  "Provide WhatsApp onboarding, WhatsApp Business messaging, OTP delivery, push notifications, and operational alerts.",
  "Match agencies with editors or freelancers, manage tasks, track project delivery, process payouts, and support billing workflows.",
  "Maintain role-based privacy controls, customer phone masking, tenant isolation, fraud prevention, abuse prevention, platform security, and audit readiness.",
  "Improve reliability, troubleshoot bugs, measure app performance, and understand how product features are used.",
];

const disclosures = [
  {
    title: "Service providers",
    body: "We may disclose data to hosting, database, storage, analytics, notification, email, SMS or WhatsApp delivery, payment, fraud prevention, and support vendors that process data for Gigxomi.",
  },
  {
    title: "Connected platforms",
    body: "When users connect or use Meta, WhatsApp Business, Instagram, YouTube, Firebase, Google Play, payment processors, or similar integrations, relevant data may be shared with those services to complete the action requested by the user.",
  },
  {
    title: "Workspace participants",
    body: "Agency admins, managers, freelancers, customers, and super admins may see data that is necessary for their role, such as project status, assigned chat lanes, delivery files, masked contact data, or payout context.",
  },
  {
    title: "Legal, safety, and business transfers",
    body: "We may disclose data if required by law, to protect users or the platform, to investigate misuse, or as part of a merger, acquisition, financing, restructuring, or sale of business assets.",
  },
];

const controls = [
  "Update account and profile information from the relevant dashboard when available.",
  "Revoke browser or mobile permissions such as microphone, camera, notifications, and storage from device settings.",
  "Ask us to access, correct, export, restrict, or delete personal data, subject to identity verification, legal duties, fraud prevention, payment records, and legitimate operational needs.",
  "Disconnect optional integrations where available, such as WhatsApp, Instagram, YouTube, or push notifications.",
  "Request account deletion or data deletion by contacting the privacy point of contact below.",
];

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/privacy-policy"),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PublicInfoPage description={description} eyebrow="Privacy policy" title="Privacy Policy">
      <div className="stack-list">
        <article className="brief-card">
          <span className="meta-pill">Last updated: {lastUpdated}</span>
          <strong>Who this policy covers</strong>
          <p className="muted-copy">
            This Privacy Policy applies to Gigxomi, the Gigxomi website at {companyKnowledgeBase.siteUrl}, the Gigxomi mobile app, and related dashboards, APIs, WhatsApp workflows, marketplace, support, and payment features.
          </p>
          <p className="muted-copy">
            Gigxomi is named in this policy as the developer and service provider. For privacy questions, contact{" "}
            <a href={`mailto:${companyKnowledgeBase.contactEmail}`}>{companyKnowledgeBase.contactEmail}</a>.
          </p>
        </article>

        <section className="brief-grid">
          {collectedData.map((item) => (
            <article className="brief-card" key={item.title}>
              <strong>{item.title}</strong>
              <p className="muted-copy">{item.body}</p>
            </article>
          ))}
        </section>

        <article className="brief-card">
          <strong>How we use data</strong>
          <ul className="feature-list">
            {useCases.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <section className="brief-grid two-up">
          <article className="brief-card">
            <strong>App permissions</strong>
            <p className="muted-copy">
              The mobile app may request permissions such as notifications, microphone, camera, media, and file access. These permissions are used only for app features the user chooses, such as push notifications, recording a voice note, uploading project media, attaching files, or capturing delivery assets.
            </p>
            <p className="muted-copy">
              Gigxomi does not use microphone access to record in the background. Users can disable permissions at any time from their browser or device settings, though some features may stop working.
            </p>
          </article>

          <article className="brief-card">
            <strong>WhatsApp, Meta, and messaging</strong>
            <p className="muted-copy">
              Gigxomi supports WhatsApp Business API and Meta-connected workflows for OTP delivery, business onboarding, customer chat, and agency operations. When a user sends or receives messages through WhatsApp or a connected Meta service, the relevant message, phone, account, and delivery metadata may be processed by Meta or WhatsApp under their own terms and privacy policies.
            </p>
            <p className="muted-copy">
              Agency-owned WhatsApp numbers are intended to stay tenant-scoped so chats, access tokens, webhook events, and outbound replies route to the correct agency workspace.
            </p>
          </article>
        </section>

        <article className="brief-card">
          <strong>How we disclose data</strong>
          <div className="stack-list">
            {disclosures.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p className="muted-copy">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="muted-copy">
            We do not sell personal information, and we do not use customer project data or private chat content for third-party advertising.
          </p>
        </article>

        <section className="brief-grid two-up">
          <article className="brief-card">
            <strong>Security</strong>
            <p className="muted-copy">
              We use reasonable administrative, technical, and organizational safeguards, including role-based access, tenant isolation, encrypted transport where supported, session controls, credential protection, audit-oriented logs, and limited operational access. No online service can guarantee absolute security.
            </p>
          </article>

          <article className="brief-card">
            <strong>Retention and deletion</strong>
            <p className="muted-copy">
              We keep data for as long as needed to provide the service, maintain records, prevent fraud, resolve disputes, support legal obligations, and protect platform integrity. Project files, chats, payment records, logs, and support records may have different retention periods. When data is no longer needed, we delete, anonymize, or restrict it where practical.
            </p>
          </article>
        </section>

        <article className="brief-card">
          <strong>Your choices and rights</strong>
          <ul className="feature-list">
            {controls.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <section className="brief-grid two-up">
          <article className="brief-card">
            <strong>Children</strong>
            <p className="muted-copy">
              Gigxomi is a business and creator operations platform. It is not directed to children under 13, and we do not knowingly collect personal data from children under 13. If you believe a child provided personal data, contact us so we can review and remove it where required.
            </p>
          </article>

          <article className="brief-card">
            <strong>International processing</strong>
            <p className="muted-copy">
              Gigxomi, its infrastructure, and its service providers may process data in India, the United States, and other countries where we or our providers operate. Data protection laws may differ by location, but we take steps to protect data according to this policy.
            </p>
          </article>
        </section>

        <article className="brief-card">
          <strong>Changes and contact</strong>
          <p className="muted-copy">
            We may update this Privacy Policy when our product, legal obligations, or data practices change. The updated version will be posted on this page with a new effective date.
          </p>
          <p className="muted-copy">
            Privacy contact: <a href={`mailto:${companyKnowledgeBase.contactEmail}`}>{companyKnowledgeBase.contactEmail}</a>. You may also contact us through the public contact page or official support channels shown inside the Gigxomi app.
          </p>
        </article>
      </div>
    </PublicInfoPage>
  );
}
