import Image from "next/image";

export type PluginBrand =
  | "google-analytics"
  | "google-drive"
  | "instagram"
  | "manual-upi"
  | "phonepe"
  | "plugin-policy"
  | "razorpay"
  | "stripe"
  | "search-console"
  | "theme-branding"
  | "whatsapp"
  | "youtube";

const brandAssets: Partial<Record<PluginBrand, { label: string; src: string }>> = {
  "google-analytics": { label: "Google Analytics", src: "/icons/3d/analytics.png" },
  "google-drive": { label: "Google Drive", src: "/icons/3d/google-drive.png" },
  instagram: { label: "Instagram", src: "/icons/3d/instagram.png" },
  "manual-upi": { label: "Manual UPI", src: "/icons/3d/manual-upi.png" },
  phonepe: { label: "PhonePe", src: "/icons/3d/phonepe.png" },
  "plugin-policy": { label: "Plugin policy", src: "/icons/3d/plugin-policy.png" },
  razorpay: { label: "Razorpay", src: "/icons/3d/manual-upi.png" },
  stripe: { label: "Stripe", src: "/icons/3d/manual-upi.png" },
  "search-console": { label: "Search Console", src: "/icons/3d/search-console.png" },
  "theme-branding": { label: "Theme and branding", src: "/icons/3d/theme-branding.png" },
  whatsapp: { label: "WhatsApp", src: "/icons/3d/whatsapp.png" },
  youtube: { label: "YouTube", src: "/icons/3d/youtube.png" },
};

const iconSizes = {
  sm: 34,
  md: 46,
  lg: 58,
};

export function PluginBrandMark({ brand, size = "md" }: { brand: PluginBrand; size?: "sm" | "md" | "lg" }) {
  const className = `plugin-brand-mark ${brand} ${size}`;
  const asset = brandAssets[brand] ?? { label: brand, src: "/icons/3d/plugin-policy.png" };
  const iconSize = iconSizes[size];

  if (brand === "razorpay") {
    return (
      <span aria-label="Razorpay brand mark" className={className} role="img" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#0c2340", borderRadius: "12px" }}>
        <svg width={iconSize * 0.65} height={iconSize * 0.65} viewBox="0 0 24 24" fill="none">
          <path d="M14.6 3L6.5 13.5H11.5L9.5 21L17.5 10.5H12.5L14.6 3Z" fill="#3395FF" />
        </svg>
      </span>
    );
  }

  if (brand === "stripe") {
    return (
      <span aria-label="Stripe brand mark" className={className} role="img" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#635bff", borderRadius: "12px" }}>
        <svg width={iconSize * 0.65} height={iconSize * 0.65} viewBox="0 0 24 24" fill="none">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.521.5 6.766.5 2.821 3.528 2.821 8.356c0 5.485 5.253 6.643 8.653 7.828 2.378.831 3.197 1.554 3.197 2.502 0 1.018-.941 1.583-2.449 1.583-2.673 0-5.464-1.286-7.394-2.35l-.946 5.617c1.78.966 4.887 1.565 8.34 1.565 6.035 0 10.235-2.88 10.235-8.083 0-5.748-5.263-6.958-8.48-8.268z" fill="#ffffff" />
        </svg>
      </span>
    );
  }

  return (
    <span aria-label={`${asset.label} 3D icon`} className={className} role="img">
      <Image alt="" className="plugin-brand-image" height={iconSize} src={asset.src} width={iconSize} />
    </span>
  );
}
