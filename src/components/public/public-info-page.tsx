import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";

type PublicInfoPageProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function PublicInfoPage({ children, description, eyebrow, title }: PublicInfoPageProps) {
  return (
    <MarketingSiteShell>
      <main className="gx-editorial-page">
        <section className="gx-editorial-hero">
          <p className="gx-editorial-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <section className="gx-editorial-body">
          {children}
          <div className="gx-editorial-actions">
            <Link className="gx-button gx-button-primary" href="/agencies">
              Browse agencies
            </Link>
            <Link className="gx-button gx-button-secondary" href="/">
              Back to home
            </Link>
          </div>
        </section>
      </main>
    </MarketingSiteShell>
  );
}
