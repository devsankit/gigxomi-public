import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";

import { WebPushBootstrap } from "@/components/pwa/web-push-bootstrap";
import { MetaMeasurement } from "@/components/public/meta-measurement";
import { UnifiedPublicSiteChrome } from "@/components/public/unified-public-site-chrome";
import { getMarketingIntegrationSettings } from "@/lib/gigxomi/public-growth-store";
import { companyKnowledgeBase } from "@/lib/seo/company-knowledge-base";
import "./public-foundation.css";
import "./public-marketing.css";
import "./gigxomi-marketing-v2.css";
import "./public-theme-v3.css";

const DEFAULT_GTM_CONTAINER_ID = "GTM-TLDKR5RF";
const DEFAULT_GA4_MEASUREMENT_ID = "G-PX8RB59TXB";
const DEFAULT_FACEBOOK_APP_ID = "1385995129001581";
// Checkout URLs contain short-lived signed intents. Never send them to marketing trackers.
const billingPrivacyGuard = `if (['/subscription-checkout', '/mobile/billing-return'].some(function(path){return window.location.pathname === path || window.location.pathname.indexOf(path + '/') === 0;})) return;`;
const facebookAppId =
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() ||
  process.env.FACEBOOK_APP_ID?.trim() ||
  process.env.NEXT_PUBLIC_META_APP_ID?.trim() ||
  process.env.META_APP_ID?.trim() ||
  process.env.GIGXOMI_META_APP_ID?.trim() ||
  DEFAULT_FACEBOOK_APP_ID;

const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(companyKnowledgeBase.siteUrl),
  title: {
    default: companyKnowledgeBase.homeTitle,
    template: "%s | Gigxomi",
  },
  description: companyKnowledgeBase.homeDescription,
  applicationName: companyKnowledgeBase.brandName,
  alternates: {
    canonical: "/",
  },
  authors: [
    {
      name: companyKnowledgeBase.brandName,
      url: companyKnowledgeBase.siteUrl,
    },
  ],
  category: "Business Software",
  creator: companyKnowledgeBase.brandName,
  publisher: companyKnowledgeBase.brandName,
  keywords: [...companyKnowledgeBase.keywords],
  icons: {
    icon: [
      {
        url: companyKnowledgeBase.iconSvgPath,
        type: "image/svg+xml",
      },
      {
        url: companyKnowledgeBase.iconPath,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: companyKnowledgeBase.iconPath,
    apple: [
      {
        url: companyKnowledgeBase.iconPath,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: companyKnowledgeBase.homeTitle,
    description: companyKnowledgeBase.homeDescription,
    url: companyKnowledgeBase.siteUrl,
    siteName: companyKnowledgeBase.brandName,
    type: "website",
    images: [
      {
        url: "/og.png",
        alt: `${companyKnowledgeBase.brandName} business workspace for video editors`,
      },
    ],
  },
  facebook: {
    appId: facebookAppId,
  },
  twitter: {
    card: "summary_large_image",
    title: companyKnowledgeBase.homeTitle,
    description: companyKnowledgeBase.homeDescription,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
};

export const revalidate = 300;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const marketingSettings = await getMarketingIntegrationSettings();
  const ga4MeasurementId = marketingSettings.ga4MeasurementId.trim() || DEFAULT_GA4_MEASUREMENT_ID;
  const gtmContainerId = marketingSettings.gtmContainerId.trim() || DEFAULT_GTM_CONTAINER_ID;
  const searchConsoleVerification = marketingSettings.searchConsoleVerification.trim();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {searchConsoleVerification ? <meta content={searchConsoleVerification} name="google-site-verification" /> : null}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
        <Script id="gigxomi-marketing-config" strategy="beforeInteractive">
          {`window.dataLayer=window.dataLayer||[];window.gigxomiMarketingConfig=${JSON.stringify({
            pixelEndpoint: marketingSettings.pixelEndpoint || null,
          })};`}
        </Script>

        {gtmContainerId ? (
          <>
            <Script id="gigxomi-gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){${billingPrivacyGuard}w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`}
            </Script>
            <noscript>
              <iframe
                height="0"
                src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
                style={{ display: "none", visibility: "hidden" }}
                width="0"
              />
            </noscript>
          </>
        ) : null}

        {ga4MeasurementId && !gtmContainerId ? (
          <>
            <Script id="gigxomi-ga4-src" src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`} strategy="lazyOnload" />
            <Script id="gigxomi-ga4" strategy="lazyOnload">
              {`(function(){${billingPrivacyGuard}window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;window.gtag('js', new Date());window.gtag('config','${ga4MeasurementId}');})();`}
            </Script>
          </>
        ) : null}

        <MetaMeasurement />

        <Script id="gigxomi-mobile-bridge" strategy="lazyOnload">
          {`(function () {
            if (typeof window === "undefined") return;
            var bridge = window.ReactNativeWebView;
            if (!bridge || typeof bridge.postMessage !== "function") return;

            var post = function (payload) {
              try {
                bridge.postMessage(JSON.stringify(payload));
              } catch (_error) {
                // Swallow bridge serialization failures to avoid breaking page UX.
              }
            };

            var syncSession = async function () {
              try {
                var response = await fetch("/api/mobile/session", { credentials: "include" });
                if (!response.ok) return;
                var data = await response.json();
                if (!data || !data.ok || !data.session) return;
                post({ type: "MOBILE_SESSION", session: data.session });
              } catch (_error) {}
            };

            var registerPushToken = async function (token, platform, provider) {
              if (!token) return;
              try {
                await fetch("/api/mobile/push-token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ token: token, platform: platform || "android", provider: provider || "fcm" }),
                });
              } catch (_error) {}
            };

            window.addEventListener("message", function (event) {
              var raw = event && event.data;
              if (!raw || typeof raw !== "string") return;
              try {
                var payload = JSON.parse(raw);
                if (payload && payload.type === "REGISTER_PUSH_TOKEN") {
                  registerPushToken(String(payload.token || ""), String(payload.platform || "android"), String(payload.provider || "fcm"));
                }
              } catch (_error) {}
            });

            syncSession();
          })();`}
        </Script>

        <UnifiedPublicSiteChrome>{children}</UnifiedPublicSiteChrome>
        <WebPushBootstrap />
      </body>
    </html>
  );
}
