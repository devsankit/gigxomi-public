import React from "react";

type FeatureCardProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  badge?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function FeatureCard({
  icon,
  title,
  description,
  badge,
  className = "",
  children,
}: FeatureCardProps) {
  return (
    <div className={`gx-surface-card gx-feature-card ${className}`.trim()}>
      <div className="gx-feature-card-header">
        {icon && <div className="gx-feature-card-icon" aria-hidden="true">{icon}</div>}
        {badge && <div className="gx-feature-card-badge">{badge}</div>}
      </div>
      <h3 className="gx-feature-card-title">{title}</h3>
      <p className="gx-feature-card-desc">{description}</p>
      {children && <div className="gx-feature-card-body">{children}</div>}
    </div>
  );
}
