import Link from "next/link";
import type { Metadata } from "next";

import { noIndexMetadata } from "@/lib/seo/no-index";

export const metadata: Metadata = {
  ...noIndexMetadata,
  title: "Unauthorized",
};

export default function UnauthorizedPage() {
  return (
    <main className="app-shell">
      <section className="dashboard-shell compact">
        <div className="brief-card">
          <span className="meta-pill">Unauthorized</span>
          <strong>You do not have permission to open this workspace.</strong>
          <p className="muted-copy">Sign in with the correct internal role or return to the login page.</p>
          <div className="freelancer-action-grid">
            <Link className="primary-button" href="/login">
              Go to login
            </Link>
            <Link className="secondary-button" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
