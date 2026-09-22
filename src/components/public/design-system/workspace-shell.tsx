import React from "react";
import { ShieldCheck } from "lucide-react";

type WorkspaceShellProps = {
  title?: string;
  subtitle?: string;
  channels?: Array<{ name: string; type: "wa" | "ig" | "neutral"; statusText?: string }>;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function WorkspaceShell({
  title = "Gigxomi workspace",
  subtitle,
  channels = [
    { name: "WhatsApp", type: "wa", statusText: "WhatsApp" },
    { name: "Instagram", type: "ig", statusText: "Instagram" },
  ],
  headerRight,
  children,
  className = "",
}: WorkspaceShellProps) {
  return (
    <div className={`gx-workspace-canvas ${className}`.trim()}>
      <div className="gx-workspace-topbar">
        <div className="gx-workspace-brand">
          <div className="gx-workspace-brand-icon" aria-hidden="true">
            <ShieldCheck size={16} />
          </div>
          <div className="gx-workspace-title-group">
            <span className="gx-workspace-title">{title}</span>
            {subtitle && <span className="gx-workspace-subtitle">{subtitle}</span>}
          </div>
        </div>

        <div className="gx-workspace-topbar-controls">
          {channels.map((channel, idx) => {
            if (channel.type === "wa") {
              return (
                <span key={idx} className="gx-badge-wa">
                  <span className="gx-badge-dot" aria-hidden="true" />
                  <span>{channel.statusText ?? channel.name}</span>
                </span>
              );
            }
            if (channel.type === "ig") {
              return (
                <span key={idx} className="gx-badge-ig">
                  <span className="gx-badge-dot" aria-hidden="true" />
                  <span>{channel.statusText ?? channel.name}</span>
                </span>
              );
            }
            return (
              <span key={idx} className="gx-badge-internal">
                <span>{channel.statusText ?? channel.name}</span>
              </span>
            );
          })}
          {headerRight}
        </div>
      </div>

      <div className="gx-workspace-content">
        {children}
      </div>
    </div>
  );
}
