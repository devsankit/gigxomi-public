"use client";

import Link from "next/link";

type EmptyStateGuidanceProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

export function EmptyStateGuidance({ title, description, ctaLabel, ctaHref }: EmptyStateGuidanceProps) {
  return (
    <div className="gx-empty-state gx-empty-state-guidance">
      <strong>{title}</strong>
      <p>{description}</p>
      <Link className="gx-button gx-button-primary" href={ctaHref}>
        {ctaLabel}
      </Link>
    </div>
  );
}
