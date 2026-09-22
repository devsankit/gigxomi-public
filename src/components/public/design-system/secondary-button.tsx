import React from "react";
import Link from "next/link";

type SecondaryButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  ariaLabel?: string;
  prefetch?: boolean;
};

export function SecondaryButton({
  children,
  href,
  onClick,
  className = "",
  type = "button",
  disabled = false,
  icon,
  iconPosition = "right",
  ariaLabel,
  prefetch = false,
}: SecondaryButtonProps) {
  const content = (
    <>
      {icon && iconPosition === "left" && <span className="gx-btn-icon-left" aria-hidden="true">{icon}</span>}
      <span className="gx-btn-label">{children}</span>
      {icon && iconPosition === "right" && <span className="gx-btn-icon-right" aria-hidden="true">{icon}</span>}
    </>
  );

  const combinedClassName = `gx-button-secondary ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClassName}
        onClick={onClick}
        aria-label={ariaLabel}
        prefetch={prefetch}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
