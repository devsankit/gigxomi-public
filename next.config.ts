import type { NextConfig } from "next";
import { retiredBlogRedirects } from "./src/lib/seo/retired-blog-redirects";

const noIndexRouteSources = [
  "/admin",
  "/admin/:path*",
  "/manager",
  "/manager/:path*",
  "/freelancer",
  "/freelancer/:path*",
  "/super-admin",
  "/super-admin/:path*",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
  "/chat",
  "/editor",
  "/meta/:path*",
  "/unauthorized",
  "/codedocs",
  "/staging-health",
];

const noIndexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "gigxomi.com" },
      { protocol: "https", hostname: "www.gigxomi.com" },
      { protocol: "https", hostname: "postproduction.work" },
      { protocol: "https", hostname: "www.postproduction.work" },
      { protocol: "https", hostname: "blog.gigxomi.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return [
      ...retiredBlogRedirects.map(({ source, destination }) => ({
        source,
        destination,
        permanent: true,
      })),
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/terms-and-conditions-of-use",
        destination: "https://blog.gigxomi.com/terms-and-conditions-of-use/",
        permanent: true,
      },
      {
        source: "/refund-policy",
        destination: "https://blog.gigxomi.com/refund-policy/",
        permanent: true,
      },
      {
        source: "/service",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/service/:slug+",
        destination: "/services/:slug+",
        permanent: true,
      },
      {
        source: "/services",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/freelancers/:slug+",
        destination: "/freelancers",
        permanent: true,
      },
      {
        source: "/freelancer-dashboard/:path*",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/become-seller/:path*",
        destination: "/freelancers",
        permanent: true,
      },
      {
        source: "/projects/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/employer/:path*",
        destination: "/pricing",
        permanent: true,
      },
      {
        source: "/service-tag/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/service-category/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/product-category/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/shop/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/tag/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/register/:path*",
        destination: "/signup",
        permanent: true,
      },
      {
        source: "/cart/:path*",
        destination: "/pricing",
        permanent: true,
      },
      {
        source: "/help/:path*",
        destination: "/knowledge-base",
        permanent: true,
      },
      {
        source: "/faq/:path*",
        destination: "/pricing#faq",
        permanent: true,
      },
      {
        source: "/messages/:path*",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/refund-cancellation-policy/:path*",
        destination: "/refund-and-cancellation-policy",
        permanent: true,
      },
      {
        source: "/privacy-policy-2/:path*",
        destination: "/privacy-policy",
        permanent: true,
      },
      {
        source: "/apus_header/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/sample-page/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/search/:path*",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/100",
        destination: "/",
        permanent: true,
      },
      {
        source: "/5",
        destination: "/",
        permanent: true,
      },
      {
        source: "/gigs",
        destination: "/discover",
        permanent: true,
      },
      {
        source: "/gigs/:slug*",
        destination: "/services/:slug*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Authorization, Content-Type",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|woff|woff2|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(self)",
          },
        ],
      },
      ...noIndexRouteSources.map((source) => ({
        source,
        headers: noIndexHeaders,
      })),
    ];
  },
  webpack: (config) => {
    const existingIgnored = config.watchOptions?.ignored;
    const ignoredList = Array.isArray(existingIgnored)
      ? existingIgnored.filter((item): item is string => typeof item === "string")
      : typeof existingIgnored === "string"
        ? [existingIgnored]
        : [];
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [...ignoredList, "**/*.log", "**/.gigxomi/**"],
    };
    return config;
  },
};

export default nextConfig;
