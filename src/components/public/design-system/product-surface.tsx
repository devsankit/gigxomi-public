import React from "react";

type ProductSurfaceProps = {
  children: React.ReactNode;
  elevation?: "base" | "raised" | "glass";
  className?: string;
  id?: string;
  style?: React.CSSProperties;
};

export function ProductSurface({
  children,
  elevation = "raised",
  className = "",
  id,
  style,
}: ProductSurfaceProps) {
  const elevationClasses = {
    base: "gx-surface-base",
    raised: "gx-surface-card",
    glass: "gx-surface-glass",
  };

  return (
    <div
      id={id}
      style={style}
      className={`${elevationClasses[elevation]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
