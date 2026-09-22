import React from "react";

type SectionEyebrowProps = {
  children: React.ReactNode;
  className?: string;
  showDot?: boolean;
  dotColor?: string;
};

export function SectionEyebrow({
  children,
  className = "",
  showDot = true,
  dotColor,
}: SectionEyebrowProps) {
  return (
    <div className={`gx-eyebrow ${className}`.trim()}>
      {showDot && (
        <span
          className="gx-eyebrow-dot"
          style={dotColor ? { backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` } : undefined}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </div>
  );
}
