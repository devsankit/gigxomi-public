import React from "react";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

type BrandLogoProps = {
  className?: string;
  href?: string;
  ariaLabel?: string;
  priority?: boolean;
  size?: "default" | "sm" | "lg";
};

export function BrandLogo({
  className = "",
  href = "/",
  ariaLabel = "Gigxomi home",
  priority = false,
  size = "default",
}: BrandLogoProps) {
  const sizeClasses = {
    sm: "gx-brand-logo-sm",
    default: "gx-brand-logo-default",
    lg: "gx-brand-logo-lg",
  };

  return (
    <div className={`gx-brand-logo-container ${sizeClasses[size]} ${className}`.trim()}>
      <BrandWordmark
        ariaLabel={ariaLabel}
        className="gx-brand-logo-link"
        href={href}
        priority={priority}
      />
    </div>
  );
}
