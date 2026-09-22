import React from "react";

type SourceBadgeChannel = "whatsapp" | "instagram" | "internal" | "system";

type SourceBadgeProps = {
  channel: SourceBadgeChannel;
  children?: React.ReactNode;
  className?: string;
  showDot?: boolean;
};

export function SourceBadge({
  channel,
  children,
  className = "",
  showDot = true,
}: SourceBadgeProps) {
  const channelConfig: Record<SourceBadgeChannel, { defaultLabel: string; className: string; dotColor?: string }> = {
    whatsapp: {
      defaultLabel: "WhatsApp",
      className: "gx-badge-wa",
      dotColor: "#25d366",
    },
    instagram: {
      defaultLabel: "Instagram",
      className: "gx-badge-ig",
      dotColor: "#ff5487",
    },
    internal: {
      defaultLabel: "Internal Lane",
      className: "gx-badge-internal",
      dotColor: "#f4f7ef",
    },
    system: {
      defaultLabel: "System",
      className: "gx-badge-internal",
      dotColor: "#a4aba1",
    },
  };

  const config = channelConfig[channel];

  return (
    <span className={`${config.className} ${className}`.trim()}>
      {showDot && (
        <span
          className="gx-badge-dot"
          style={config.dotColor ? { backgroundColor: config.dotColor } : undefined}
          aria-hidden="true"
        />
      )}
      <span>{children ?? config.defaultLabel}</span>
    </span>
  );
}
