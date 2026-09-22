"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BadgeCheck, BadgeIndianRupee, ChevronDown, Clapperboard, ExternalLink, Info, MessageCircle, Play, Scissors, ShieldCheck, Sparkles, TimerReset, X } from "lucide-react";

import { buildServiceInquiryHref } from "@/lib/gigxomi/public-contact";
import { getPlayerEmbedUrl, getVideoPresentation } from "@/lib/gigxomi/media";
import { pushGrowthEvent } from "@/lib/gigxomi/public-growth-client";
import { buildEditorTrustSignalSummary, type EditorTrustSignal } from "@/lib/gigxomi/editor-trust-signals";
import type { MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";

type HomepageServiceCardProps = {
  service: MarketplaceSurfaceService;
  isPlayerActive: boolean;
  onClosePlayer: () => void;
  onPlayPlayer: () => void;
};

function formatPrice(value: number) {
  return `From INR ${value.toLocaleString("en-IN")}`;
}

const coverIcons = [Scissors, Sparkles, Clapperboard] as const;
const coverThemes = ["slate", "graphite", "olive", "ink"] as const;

function getCoverIndex(value: string, max: number) {
  return [...value].reduce((total, character) => total + character.charCodeAt(0), 0) % max;
}

function getCoverVisual(service: MarketplaceSurfaceService) {
  const haystack = `${service.title} ${service.specialty} ${service.category}`.toLowerCase();

  if (haystack.includes("reel") || haystack.includes("short")) {
    return { format: "9:16", scene: "reels", signal: "Hook + Captions" };
  }

  if (haystack.includes("promo") || haystack.includes("ad")) {
    return { format: "1:1 / 9:16", scene: "promo", signal: "Offer + CTA" };
  }

  if (haystack.includes("youtube") || haystack.includes("long")) {
    return { format: "16:9", scene: "youtube", signal: "Story + Pacing" };
  }

  return { format: "9:16 / 16:9", scene: "studio", signal: "Fast delivery" };
}

function EditorTrustSignalBar({ signal }: { signal: EditorTrustSignal }) {
  const isCollecting = signal.percentage === null;

  return (
    <div className={`homepage-editor-signal homepage-editor-signal-${signal.state}`}>
      <div className="homepage-editor-signal-top">
        <span>{signal.label}</span>
        <strong>{signal.valueLabel}</strong>
      </div>
      <div
        aria-label={`${signal.label}: ${signal.valueLabel}`}
        className={isCollecting ? "homepage-editor-signal-track collecting" : "homepage-editor-signal-track"}
        role="img"
        style={isCollecting ? undefined : { "--signal-progress": `${signal.percentage}%` } as CSSProperties}
        title={signal.note}
      />
    </div>
  );
}

export function HomepageServiceCard({ service, isPlayerActive, onClosePlayer, onPlayPlayer }: HomepageServiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const inquiryHref = useMemo(
    () =>
      buildServiceInquiryHref({
        title: service.title,
        slug: service.slug,
        basePrice: service.basePrice,
        deliveryTime: service.deliveryTime,
        ownerName: service.ownerName?.trim() || service.ownerAlias,
        publicHref: service.publicHref ?? null,
      }),
    [service.basePrice, service.deliveryTime, service.ownerAlias, service.ownerName, service.publicHref, service.slug, service.title],
  );
  const samplePresentation = useMemo(
    () => (service.sampleVideoUrl ? getVideoPresentation(service.sampleVideoUrl) : null),
    [service.sampleVideoUrl],
  );
  const autoplayEmbedUrl = useMemo(
    () => (service.sampleVideoUrl ? getPlayerEmbedUrl(service.sampleVideoUrl) : ""),
    [service.sampleVideoUrl],
  );
  const previewImage = service.coverImageUrl || service.sampleThumbnailUrl || null;
  const canPlaySample = Boolean(service.sampleVideoUrl && samplePresentation && (samplePresentation.embedUrl || samplePresentation.directUrl));
  const isPortraitSample = samplePresentation?.variant === "portrait";
  const editorTrustSignals = useMemo(() => buildEditorTrustSignalSummary(), []);
  const serviceHref = service.publicHref ?? `/services/${service.slug}`;
  const coverVisual = getCoverVisual(service);
  const CoverIcon = coverIcons[getCoverIndex(service.id || service.slug, coverIcons.length)];
  const coverTheme = coverThemes[getCoverIndex(service.slug || service.title, coverThemes.length)];
  const playSample = () => {
    if (!canPlaySample) return;
    pushGrowthEvent("gigxomi_homepage_sample_played", {
      serviceId: service.id,
      serviceTitle: service.title,
      mediaVariant: isPortraitSample ? "portrait" : "landscape",
    });
    onPlayPlayer();
  };

  useEffect(() => {
    const node = cardRef.current;
    if (!isPlayerActive || !node || typeof window === "undefined" || window.matchMedia("(min-width: 768px)").matches) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isPlayerActive]);

  return (
    <article
      className={`homepage-service-card${isExpanded ? " homepage-service-card-expanded" : ""}${isPlayerActive ? " is-player-active" : ""}`}
      ref={cardRef}
    >
      <div
        className={[
          "homepage-service-media",
          isPortraitSample ? "homepage-service-media-portrait" : "",
          isPlayerActive ? "homepage-service-media-playing" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={!previewImage && !isPlayerActive ? { background: service.media[0]?.accent } : undefined}
      >
        {isPlayerActive && samplePresentation ? (
          <>
            <div
              className={[
                "homepage-service-player-shell",
                "relative z-[1] w-full overflow-hidden rounded-[18px]",
                isPortraitSample ? "homepage-service-player-shell-portrait" : "homepage-service-player-shell-landscape",
              ].join(" ")}
            >
              {samplePresentation.embedUrl ? (
                autoplayEmbedUrl ? (
                  <div className="gigxomi-player-frame homepage-service-inline-frame player-controls-on-hover">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="homepage-service-player"
                      referrerPolicy="strict-origin-when-cross-origin"
                      src={autoplayEmbedUrl}
                      title={`${service.title} sample`}
                    />
                    <div className="player-click-guard player-click-guard-top" />
                    <div className="player-click-guard player-click-guard-corner" />
                    <div className="player-click-guard player-click-guard-share" />
                  </div>
                ) : null
              ) : samplePresentation.directUrl ? (
                <video autoPlay className="homepage-service-player player-controls-on-hover" controls playsInline preload="metadata" src={samplePresentation.directUrl} />
              ) : null}
            </div>
            <button
              aria-label="Close sample"
              className="homepage-service-close absolute right-3 top-3 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-white"
              onClick={onClosePlayer}
              type="button"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            {previewImage ? (
              <div className="homepage-service-real-cover">
                <Image
                  alt={service.title}
                  className="homepage-service-image"
                  fill
                  sizes="(max-width: 767px) 72vw, (max-width: 1023px) 48vw, 25vw"
                  src={previewImage}
                />
                <div className="homepage-service-real-cover-frame" />
              </div>
            ) : (
              <div className={`homepage-service-premium-cover homepage-service-premium-cover-${coverTheme}`}>
                <div className="homepage-service-cover-grid" />
                <div className="homepage-service-cover-orbit" />
                <div className="homepage-service-cover-header">
                  <span>Gigxomi</span>
                  <strong>{coverVisual.format}</strong>
                </div>
                <div className="homepage-service-cover-center">
                  <span className="homepage-service-cover-mark">
                    <CoverIcon size={22} strokeWidth={2} />
                  </span>
                  <div className={`homepage-service-cover-scene homepage-service-cover-scene-${coverVisual.scene}`}>
                    <span className="homepage-service-scene-screen">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="homepage-service-scene-strip">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="homepage-service-scene-avatar" />
                  </div>
                </div>
                <div className="homepage-service-cover-timeline" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="homepage-service-cover-footer">
                  <span>{coverVisual.signal}</span>
                  <span>{service.turnaroundLabel}</span>
                </div>
              </div>
            )}
            <div className="homepage-service-overlay">
              <div className="homepage-service-pills">
                <span className="meta-pill inline-flex min-h-[32px] items-center rounded-full border border-white/12 px-3 text-[0.82rem] font-medium text-white/86 backdrop-blur-[10px]">
                  {service.category === "Graphic Design" ? "Design" : service.category}
                </span>
                <span className="meta-pill inline-flex min-h-[32px] items-center rounded-full border border-white/12 px-3 text-[0.82rem] font-medium text-white/86 backdrop-blur-[10px]">
                  {service.turnaroundLabel}
                </span>
              </div>
              {canPlaySample ? (
                <button
                  aria-label={`Watch ${service.title} sample video`}
                  className="homepage-service-watch"
                  onClick={playSample}
                  type="button"
                >
                  <span className="homepage-service-watch-icon">
                    <Play fill="currentColor" size={13} strokeWidth={1.8} />
                  </span>
                  <span className="homepage-service-watch-label">Watch sample</span>
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className="homepage-service-body">
        <div className="homepage-service-copy">
          <p className="homepage-service-kicker">{service.specialty}</p>
          <h3 className="homepage-service-title">{service.title}</h3>
          {service.identityVerified ? <span className="gigxomi-verified-badge"><BadgeCheck size={14} /> Gigxomi Identity Verified</span> : null}
        </div>

        <div className="homepage-service-meta">
          <div className="homepage-service-meta-item grid gap-1 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3" title={`Starting price: ${formatPrice(service.basePrice)}`}>
            <span className="inline-flex items-center gap-[6px] text-[0.74rem] uppercase leading-[1.3] tracking-[0.08em] text-white/56">
              <BadgeIndianRupee size={13} strokeWidth={1.8} />
              Price
            </span>
            <strong className="text-[1.02rem] leading-[1.2] text-white">{formatPrice(service.basePrice)}</strong>
          </div>
          <div className="homepage-service-meta-item grid gap-1 rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-3" title={`Delivery timeline: ${service.deliveryTime}`}>
            <span className="inline-flex items-center gap-[6px] text-[0.74rem] uppercase leading-[1.3] tracking-[0.08em] text-white/56">
              <TimerReset size={13} strokeWidth={1.8} />
              Delivery
            </span>
            <strong className="text-[1.02rem] leading-[1.2] text-white">{service.deliveryTime}</strong>
          </div>
        </div>

        {isExpanded ? (
          <div className="homepage-service-expanded-panel">
            <p>{service.description || "Review this editor package, watch the sample, then place the order with the Gigxomi team on WhatsApp."}</p>
            <div>
              <span>{service.ownerName?.trim() || service.ownerAlias}</span>
              <span>{service.turnaroundLabel}</span>
              <span>{formatPrice(service.basePrice)}</span>
            </div>
            <div className="homepage-editor-signal-card" aria-label="Editor trust collection status">
              <div className="homepage-editor-signal-heading">
                <ShieldCheck size={14} strokeWidth={1.8} />
                <span>Verified editor signals</span>
                <span className="homepage-editor-signal-help">
                  <Info size={13} strokeWidth={2} />
                  <em>Trust score and response time update after completed Gigxomi orders.</em>
                </span>
              </div>
              <div className="homepage-editor-signal-expanded">
                <EditorTrustSignalBar signal={editorTrustSignals.trustScore} />
                <EditorTrustSignalBar signal={editorTrustSignals.responseTime} />
              </div>
            </div>
          </div>
        ) : null}

        <div className="homepage-service-actions">
          <a
            className="homepage-service-primary inline-flex min-h-[46px] w-full items-center justify-center rounded-[14px] border border-[color:var(--gx-primary-border)] bg-white/[0.02] px-[18px] text-[0.92rem] font-semibold text-white no-underline transition hover:-translate-y-px hover:border-[color:var(--gx-primary-border)] hover:bg-[color:var(--gx-primary-soft)]"
            href={inquiryHref}
            onClick={() =>
              pushGrowthEvent("gigxomi_homepage_whatsapp_cta_clicked", {
                serviceId: service.id,
                serviceTitle: service.title,
                startingPrice: service.basePrice,
                deliveryTime: service.deliveryTime,
              })
            }
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle size={16} strokeWidth={2} />
            Order on WhatsApp
          </a>
          <a
            className="homepage-service-secondary"
            href={serviceHref}
            onClick={() =>
              pushGrowthEvent("gigxomi_homepage_service_details_opened", {
                serviceId: service.id,
                serviceTitle: service.title,
                publicHref: serviceHref,
              })
            }
          >
            <ExternalLink size={15} strokeWidth={2} />
            Full page
          </a>
          <button
            aria-expanded={isExpanded}
            className="homepage-service-toggle"
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            Details
            <ChevronDown size={15} strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
