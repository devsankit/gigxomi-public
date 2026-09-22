"use client";

import { useState } from "react";
import { Play, PlayCircle } from "lucide-react";

function getYouTubeThumbnail(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    const match = url.pathname.match(/\/(embed|v|shorts)\/([a-zA-Z0-9_-]+)/);
    if (match?.[2]) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
  } catch {
    // Fallback if not standard URL
  }
  return null;
}

export function AgencyServicePreview({
  embedUrl,
  directUrl,
  imageUrl,
  editorName,
  serviceTitle,
}: {
  embedUrl?: string | null;
  directUrl?: string | null;
  imageUrl?: string | null;
  editorName: string;
  serviceTitle?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const title = serviceTitle || `${editorName}'s portfolio`;
  const resolvedThumbnail = imageUrl || (embedUrl ? getYouTubeThumbnail(embedUrl) : null);

  if (embedUrl) {
    if (isPlaying) {
      const playSrc = embedUrl.includes("autoplay=1")
        ? embedUrl
        : `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`;

      return (
        <div className="agency-service-preview agency-service-preview-active">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            src={playSrc}
            title={`${title} video preview`}
          />
        </div>
      );
    }

    return (
      <div
        className="agency-service-preview agency-service-preview-facade"
        onClick={() => setIsPlaying(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsPlaying(true);
          }
        }}
        aria-label={`Play portfolio preview video for ${title}`}
        style={resolvedThumbnail ? { backgroundImage: `url(${JSON.stringify(resolvedThumbnail)})` } : undefined}
      >
        <div className="agency-service-preview-backdrop-overlay" />
        <div className="agency-service-preview-play-button">
          <Play size={20} className="fill-current translate-x-0.5" />
        </div>
        <span className="agency-service-preview-play-label">Preview Work</span>
      </div>
    );
  }

  if (directUrl) {
    return (
      <div className="agency-service-preview">
        <video
          controls
          playsInline
          preload="metadata"
          src={directUrl}
          title={`${title} video preview`}
        />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div
        aria-label={`${title} portfolio cover`}
        className="agency-service-preview agency-service-preview-image"
        role="img"
        style={{ backgroundImage: `url(${JSON.stringify(imageUrl)})` }}
      />
    );
  }

  return (
    <div className="agency-service-preview agency-service-preview-empty">
      <PlayCircle size={30} strokeWidth={1.7} />
      <strong>Portfolio preview</strong>
      <span>No sample video attached yet</span>
    </div>
  );
}
