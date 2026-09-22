import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";

type BrandWordmarkProps = {
  ariaLabel?: string;
  className?: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  priority?: boolean;
};

export function BrandWordmark({
  ariaLabel = "Go to Gigxomi home",
  className = "brand-wordmark",
  href = "/",
  onClick,
  priority = false,
}: BrandWordmarkProps) {
  return (
    <Link aria-label={ariaLabel} className={className} href={href} onClick={onClick}>
      <Image alt="Gigxomi" className="brand-wordmark-full" height={64} priority={priority} src="/gigxomi-wordmark.svg" unoptimized width={240} />
      <Image alt="Gigxomi logo" className="brand-wordmark-mark" height={512} priority={priority} src="/gigxomi-logo.png" unoptimized width={512} />
    </Link>
  );
}
