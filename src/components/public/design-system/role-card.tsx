import React from "react";

type RoleCardProps = {
  role: string;
  badge: string;
  badgeColor?: string;
  headline: string;
  description: string;
  bulletPoints: string[];
  icon?: React.ReactNode;
  className?: string;
};

export function RoleCard({
  role,
  badge,
  badgeColor = "var(--gx-lime)",
  headline,
  description,
  bulletPoints,
  icon,
  className = "",
}: RoleCardProps) {
  return (
    <div className={`gx-surface-card gx-role-card ${className}`.trim()}>
      <div className="gx-role-card-top">
        <div className="gx-role-badge" style={{ borderColor: badgeColor, color: badgeColor }}>
          {badge}
        </div>
        {icon && <div className="gx-role-icon" aria-hidden="true">{icon}</div>}
      </div>
      <h3 className="gx-role-title">{role}</h3>
      <h4 className="gx-role-headline">{headline}</h4>
      <p className="gx-role-desc">{description}</p>
      <ul className="gx-role-bullets">
        {bulletPoints.map((bullet, idx) => (
          <li key={idx}>
            <span className="gx-role-bullet-dot" style={{ backgroundColor: badgeColor }} aria-hidden="true" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
