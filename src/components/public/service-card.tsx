"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, MessageCircle, Play, Star } from "lucide-react";

type ServiceCardProps = {
  deliveryLabel: string;
  href: string;
  priceLabel: string;
  ratingLabel: string;
  thumbnailAccent?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  whatsappHref: string;
};

export function ServiceCard({
  deliveryLabel,
  href,
  priceLabel,
  ratingLabel,
  thumbnailAccent,
  thumbnailUrl,
  title,
  whatsappHref,
}: ServiceCardProps) {
  return (
    <article className="group flex min-w-[270px] flex-col gap-4 rounded-[24px] border border-[color:var(--gx-glass-border)] bg-[color:var(--gx-glass-bg)] p-4 transition duration-200 hover:-translate-y-1 hover:border-[color:var(--gx-primary-border)]">
      <div
        className="relative h-40 overflow-hidden rounded-[20px] border border-white/8 bg-[color:var(--gx-surface)]"
        style={!thumbnailUrl && thumbnailAccent ? { background: thumbnailAccent } : undefined}
      >
        {thumbnailUrl ? (
          <Image
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            fill
            sizes="(max-width: 767px) 78vw, (max-width: 1279px) 44vw, 23vw"
            src={thumbnailUrl}
            unoptimized
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-start">
          <Link
            className="inline-flex items-center gap-2 rounded-[10px] border border-[color:var(--gx-primary-border)] bg-[color:var(--gx-glass-bg)] px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-[color:var(--gx-primary-border)] hover:bg-[color:var(--gx-primary-soft)]"
            href={href}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--gx-primary-border)] bg-[color:var(--gx-primary-soft)] text-[color:var(--gx-primary)]">
              <Play className="ml-0.5" size={13} strokeWidth={2.2} />
            </span>
            Watch sample
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="line-clamp-2 text-lg font-medium leading-6 text-white">{title}</h3>
        <div className="flex items-center justify-between gap-4 text-sm text-white/70">
          <span className="font-medium text-white">{priceLabel}</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} strokeWidth={1.8} />
            {deliveryLabel}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-sm text-white/82">
          <Star className="fill-[color:var(--gx-warning)] text-[color:var(--gx-warning)]" size={14} strokeWidth={1.8} />
          {ratingLabel}
        </div>
      </div>

      <a
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-[color:var(--gx-primary-border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm font-semibold text-white transition hover:border-[color:var(--gx-primary-border)] hover:bg-[color:var(--gx-primary-soft)]"
        href={whatsappHref}
        rel="noreferrer"
        target="_blank"
      >
        <MessageCircle className="text-[color:var(--gx-primary)]" size={16} strokeWidth={2} />
        Connect on WhatsApp
      </a>
    </article>
  );
}
