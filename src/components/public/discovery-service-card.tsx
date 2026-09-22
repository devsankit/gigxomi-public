"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { BadgeCheck, BadgeIndianRupee, Play, TimerReset, X } from "lucide-react";

import { buildServiceInquiryHref } from "@/lib/gigxomi/public-contact";
import { getPlayerEmbedUrl, getVideoPresentation } from "@/lib/gigxomi/media";
import { pushGrowthEvent } from "@/lib/gigxomi/public-growth-client";
import type { MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";

function formatPrice(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

type DiscoveryServiceCardProps = {
  service: MarketplaceSurfaceService;
  isPlayerActive: boolean;
  onClosePlayer: () => void;
  onPlayPlayer: () => void;
};

export function DiscoveryServiceCard({ service, isPlayerActive, onClosePlayer, onPlayPlayer }: DiscoveryServiceCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);
  const hasTrackedViewRef = useRef(false);
  const displayOwnerName = service.ownerName?.trim() || service.ownerAlias;
  const displayOwnerMeta = service.ownerAlias !== displayOwnerName ? service.ownerAlias : null;
  const inquiryHref = useMemo(
    () =>
      buildServiceInquiryHref({
        title: service.title,
        slug: service.slug,
        basePrice: service.basePrice,
        deliveryTime: service.deliveryTime,
        ownerName: displayOwnerName,
        publicHref: service.publicHref ?? null,
      }),
    [displayOwnerName, service.basePrice, service.deliveryTime, service.publicHref, service.slug, service.title],
  );
  const samplePresentation = useMemo(
    () => (service.sampleVideoUrl ? getVideoPresentation(service.sampleVideoUrl) : null),
    [service.sampleVideoUrl],
  );
  const autoplayEmbedUrl = useMemo(
    () => (service.sampleVideoUrl ? getPlayerEmbedUrl(service.sampleVideoUrl) : ""),
    [service.sampleVideoUrl],
  );
  const previewImage = service.sampleThumbnailUrl || service.coverImageUrl || null;
  const canPlaySample = Boolean(service.sampleVideoUrl && samplePresentation && (samplePresentation.embedUrl || samplePresentation.directUrl));
  const isPortraitSample = samplePresentation?.variant === "portrait";

  useEffect(() => {
    const node = cardRef.current;
    if (!node || hasTrackedViewRef.current || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || hasTrackedViewRef.current) {
          return;
        }

        hasTrackedViewRef.current = true;
        pushGrowthEvent("gigxomi_service_viewed", {
          serviceId: service.id,
          serviceTitle: service.title,
          ownerName: displayOwnerName,
          startingPrice: service.basePrice,
          publicHref: service.publicHref ?? `/services/${service.slug}`,
        });
        observer.disconnect();
      },
      {
        threshold: 0.45,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [displayOwnerName, service.basePrice, service.id, service.publicHref, service.slug, service.title]);

  useEffect(() => {
    const node = cardRef.current;
    if (!isPlayerActive || !node || typeof window === "undefined" || window.matchMedia("(min-width: 921px)").matches) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isPlayerActive]);

  return (
    <article className={isPlayerActive ? "marketplace-discovery-card is-player-active" : "marketplace-discovery-card"} ref={cardRef}>
      <div
        className={[
          "marketplace-discovery-media",
          isPortraitSample ? "marketplace-discovery-media-portrait" : "",
          isPlayerActive ? "marketplace-discovery-media-playing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={!previewImage && !isPlayerActive ? { background: service.media[0]?.accent } : undefined}
      >
        {isPlayerActive && samplePresentation ? (
          <>
            <div
              className={[
                "marketplace-discovery-player-shell",
                isPortraitSample ? "marketplace-discovery-player-shell-portrait" : "marketplace-discovery-player-shell-landscape",
              ].join(" ")}
            >
              {samplePresentation.embedUrl ? (
                autoplayEmbedUrl ? (
                  <div className="gigxomi-player-frame marketplace-discovery-inline-frame player-controls-on-hover">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="marketplace-discovery-player"
                      referrerPolicy="strict-origin-when-cross-origin"
                      src={autoplayEmbedUrl}
                      title={`${service.title} sample`}
                    />
                    <div className="player-click-guard player-click-guard-top" />
                    <div className="player-click-guard player-click-guard-corner" />
                    <div className="player-click-guard player-click-guard-share" />
                    <div className="player-brand-badge">Gigxomi</div>
                  </div>
                ) : null
              ) : samplePresentation.directUrl ? (
                <video
                  autoPlay
                  className="marketplace-discovery-player player-controls-on-hover"
                  controls
                  playsInline
                  preload="metadata"
                  src={samplePresentation.directUrl}
                />
              ) : null}
            </div>
            <button aria-label="Close sample" className="marketplace-discovery-inline-close" onClick={onClosePlayer} type="button">
              <X size={16} strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            {previewImage ? (
              <Image
                alt={service.title}
                className="marketplace-discovery-image"
                fill
                sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 25vw"
                src={previewImage}
              />
            ) : null}
            <div className="marketplace-discovery-overlay">
              <div className="service-signal-row">
                <span className="meta-pill">{service.category === "Graphic Design" ? "Design" : service.category}</span>
                <span className="meta-pill">{service.turnaroundLabel}</span>
              </div>
              {canPlaySample ? (
                <button
                  className="marketplace-discovery-watch"
                  onClick={() => {
                    pushGrowthEvent("gigxomi_sample_played", {
                      serviceId: service.id,
                      serviceTitle: service.title,
                      ownerName: displayOwnerName,
                      mediaVariant: isPortraitSample ? "portrait" : "landscape",
                    });
                    onPlayPlayer();
                  }}
                  type="button"
                >
                  <span className="marketplace-discovery-watch-icon">
                    <Play fill="currentColor" size={14} strokeWidth={1.8} />
                  </span>
                  Watch sample
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className="marketplace-discovery-body">
        <div className="marketplace-discovery-head">
          <span className="marketplace-discovery-kicker">{service.specialty}</span>
          <h3>{service.title}</h3>
          <p className="marketplace-discovery-owner">{displayOwnerName} {service.identityVerified ? <span className="gigxomi-verified-badge" title="Gigxomi Identity Verified"><BadgeCheck size={15} /> Identity verified</span> : null}</p>
          {displayOwnerMeta ? <p className="marketplace-discovery-owner-meta">@{displayOwnerMeta}</p> : null}
          <div className="chat-result-rating">
            <span className="chat-result-rating-dot" />
            <span>{service.trustScore ? `Trust score ${service.trustScore}/100` : "Ratings appear after completed projects"}</span>
          </div>
        </div>

        <div className="marketplace-discovery-metrics">
          <div>
            <span>
              <BadgeIndianRupee size={13} strokeWidth={1.8} />
              Starting at
            </span>
            <strong>{formatPrice(service.basePrice)}</strong>
          </div>
          <div>
            <span>
              <TimerReset size={13} strokeWidth={1.8} />
              Delivery
            </span>
            <strong>{service.deliveryTime}</strong>
          </div>
        </div>

        <div className="marketplace-discovery-actions">
          <a
            className="primary-button"
            href={inquiryHref}
            onClick={() =>
              pushGrowthEvent("gigxomi_whatsapp_cta_clicked", {
                serviceId: service.id,
                serviceTitle: service.title,
                ownerName: displayOwnerName,
                startingPrice: service.basePrice,
                deliveryTime: service.deliveryTime,
              })
            }
            rel="noreferrer"
            target="_blank"
          >
            Connect on WhatsApp
          </a>
          <Link
            className="ghost-button"
            href={`/services/${service.slug}`}
            onClick={() =>
              pushGrowthEvent("gigxomi_service_link_opened", {
                serviceId: service.id,
                serviceTitle: service.title,
                ownerName: displayOwnerName,
                publicHref: `/services/${service.slug}`,
              })
            }
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
