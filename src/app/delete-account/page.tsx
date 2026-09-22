import type { Metadata } from "next";

import { PublicInfoPage } from "@/components/public/public-info-page";
import { buildSiteUrl, companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";

const title = `Account and Data Deletion Request | ${companyKnowledgeBase.brandName} & GXcloser`;
const description = `Learn how to request deletion of your account, call recordings, messages, and associated personal data for Gigxomi and GXcloser apps.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/delete-account",
  },
  openGraph: {
    title,
    description,
    url: buildSiteUrl("/delete-account"),
    type: "website",
    images: [{ url: companyKnowledgeBase.logoPath, alt: `${companyKnowledgeBase.brandName} logo` }],
  },
};

export default function DeleteAccountPage() {
  return (
    <PublicInfoPage
      description={description}
      eyebrow="Data safety & user control"
      title="Request Account & Data Deletion"
    >
      <div className="stack-list">
        <article className="brief-card">
          <span className="meta-pill">Google Play Data Safety Compliance</span>
          <strong>Developer & Applications Covered</strong>
          <p className="muted-copy">
            This policy covers accounts and user data for applications developed and operated by <strong>Gigxomi</strong>, including <strong>GXcloser</strong> (package: <code>com.gigxomi.crm</code>) and the <strong>Gigxomi</strong> web and mobile platforms.
          </p>
          <p className="muted-copy">
            We are committed to user privacy and providing transparent, accessible controls to delete your account and associated personal data at any time.
          </p>
        </article>

        <article className="brief-card">
          <strong>Steps to Request Account and Data Deletion</strong>
          <p className="muted-copy">
            You can request the deletion of your account and all associated data through either of the following methods:
          </p>
          <div className="stack-list" style={{ marginTop: "1rem" }}>
            <div className="brief-card">
              <span className="meta-pill">Method 1: Email Support Request (Recommended)</span>
              <p className="muted-copy" style={{ marginTop: "0.5rem" }}>
                Send an email to our dedicated data privacy team at{" "}
                <a href="mailto:support@gigxomi.com?subject=Account%20and%20Data%20Deletion%20Request">
                  <strong>support@gigxomi.com</strong>
                </a>{" "}
                with the following details:
              </p>
              <ul className="feature-list" style={{ marginTop: "0.5rem" }}>
                <li>Subject: <code>Account and Data Deletion Request</code></li>
                <li>Your registered phone number and/or email address</li>
                <li>App name: <strong>GXcloser</strong> or <strong>Gigxomi</strong></li>
              </ul>
              <p className="muted-copy" style={{ marginTop: "0.5rem" }}>
                Our team will verify your identity and process the deletion within <strong>7 business days</strong>. You will receive a confirmation once the deletion is complete.
              </p>
            </div>

            <div className="brief-card">
              <span className="meta-pill">Method 2: In-App Request</span>
              <p className="muted-copy" style={{ marginTop: "0.5rem" }}>
                Open the <strong>GXcloser</strong> or <strong>Gigxomi</strong> mobile app, navigate to <strong>Profile / Settings</strong> ➔ <strong>Privacy & Security</strong> ➔ <strong>Delete Account</strong>, and confirm your request.
              </p>
            </div>
          </div>
        </article>

        <section className="brief-grid two-up">
          <article className="brief-card">
            <strong>Data That Will Be Permanently Deleted</strong>
            <ul className="feature-list" style={{ marginTop: "0.5rem" }}>
              <li>User profile: Name, phone number, email, and authentication credentials</li>
              <li>Call recordings and local audio telephony logs</li>
              <li>Customer notes, stage history, and sales CRM pipeline assignments</li>
              <li>Direct messages, chat history, and uploaded project attachments</li>
              <li>Push notification device tokens and active login sessions</li>
            </ul>
          </article>

          <article className="brief-card">
            <strong>Data That May Be Retained & Retention Period</strong>
            <p className="muted-copy">
              In accordance with applicable commercial and financial regulations:
            </p>
            <ul className="feature-list" style={{ marginTop: "0.5rem" }}>
              <li>
                <strong>Financial & Payment Records:</strong> Invoices, transaction IDs, and settlement records are retained for up to <strong>180 days</strong> to comply with accounting, tax, and anti-fraud statutory obligations.
              </li>
              <li>
                <strong>Security & Abuse Prevention Logs:</strong> Server access logs and security event records may be retained for up to <strong>90 days</strong> before automated deletion.
              </li>
            </ul>
          </article>
        </section>

        <article className="brief-card">
          <strong>Questions or Assistance?</strong>
          <p className="muted-copy">
            If you have questions regarding data privacy, please contact our Data Protection Officer at{" "}
            <a href="mailto:support@gigxomi.com">support@gigxomi.com</a> or visit our full{" "}
            <a href="/privacy-policy">Privacy Policy</a>.
          </p>
        </article>
      </div>
    </PublicInfoPage>
  );
}
