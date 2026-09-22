import fs from "node:fs";
import path from "node:path";
import { growthPillarPosts } from "../src/lib/seo/growth-pillar-posts";
import { growthSupportingPosts } from "../src/lib/seo/growth-support-posts";

const ORDERED_SLUGS = [
  // 1-3: Core get-clients pillars
  "how-to-get-video-editing-clients",
  "how-to-get-your-first-video-editing-client",
  "how-to-get-video-editing-clients-as-a-beginner",
  // 4-6: Supporting conversion & funnel guides
  "why-not-getting-video-editing-clients",
  "where-to-find-video-editing-clients-online",
  "video-editing-client-acquisition-funnel",
  // 7-12: Channel & geography acquisition pillars
  "how-to-get-video-editing-clients-in-india",
  "how-to-get-international-video-editing-clients",
  "how-to-get-video-editing-clients-on-instagram",
  "how-to-get-video-editing-clients-on-linkedin",
  "how-to-get-video-editing-clients-without-upwork",
  "how-to-find-youtubers-who-need-video-editors",
  // 13-14: Outreach templates
  "video-editor-cold-dm-template",
  "video-editing-cold-email-template",
  // 15-17: Pricing & proposals
  "how-much-should-i-charge-for-video-editing",
  "video-editing-rates-in-india",
  "video-editing-proposal-template",
  // 18-19: Client management & CRM
  "how-to-manage-video-editing-clients",
  "crm-for-video-editors",
  // 20-23: Agency scale & hiring
  "how-to-outsource-video-editing",
  "how-to-hire-video-editors",
  "how-to-start-a-video-editing-agency",
  "how-to-scale-a-video-editing-business",
  // 24-27: Agency operations & contract gaps
  "video-editor-contract-template-for-agencies",
  "video-editing-client-onboarding-checklist",
  "multi-editor-revision-management-for-agencies",
  "video-editing-retainer-pricing-for-agencies",
];

const EXISTING_WP_POST_IDS: Record<string, number> = {
  "how-to-get-video-editing-clients": 13412,
  "how-to-get-your-first-video-editing-client": 13414,
  "how-to-get-video-editing-clients-as-a-beginner": 13416,
  "why-not-getting-video-editing-clients": 13418,
  "where-to-find-video-editing-clients-online": 13420,
  "video-editing-client-acquisition-funnel": 13422,
};

const EXISTING_PIN_ALTS: Record<string, string> = {
  "how-to-get-video-editing-clients":
    "A three-stage Gigxomi visual showing a portfolio sample, client conversation, and paid video editing project.",
  "how-to-get-your-first-video-editing-client":
    "A Gigxomi roadmap from video editing proof to outreach and a paid pilot project.",
  "how-to-get-video-editing-clients-as-a-beginner":
    "A Gigxomi beginner roadmap showing editing practice, portfolio proof, and focused client outreach.",
  "why-not-getting-video-editing-clients":
    "Gigxomi diagnostic pipeline showing targeting, offer, proof, outreach, and paid pilot stages for video editing client acquisition.",
  "where-to-find-video-editing-clients-online":
    "Gigxomi source map connecting online demand signals to a qualified video editing client brief.",
  "video-editing-client-acquisition-funnel":
    "Gigxomi five-stage video editing client funnel from qualified prospect to reply, call, paid pilot, and retainer.",
};

const EXISTING_PIN_DESCRIPTIONS: Record<string, string> = {
  "how-to-get-video-editing-clients":
    "Build a repeatable video editing client pipeline with a clear niche, relevant proof, focused outreach, paid pilots, and a practical follow-up system.",
  "how-to-get-your-first-video-editing-client":
    "Use one relevant proof piece, carefully chosen prospects, specific outreach, and a paid pilot to win your first video editing client professionally.",
  "how-to-get-video-editing-clients-as-a-beginner":
    "A beginner-friendly plan for building editing skills, creating focused portfolio proof, choosing a niche, and contacting prospects with a useful offer.",
  "why-not-getting-video-editing-clients":
    "Diagnose the first broken stage in your client pipeline: targeting, offer, proof, outreach, paid pilot, or delivery. Fix the constraint before sending more messages.",
  "where-to-find-video-editing-clients-online":
    "Find qualified editing prospects using visible demand signals on YouTube, LinkedIn, Instagram, agency websites, communities, job boards, and referrals.",
  "video-editing-client-acquisition-funnel":
    "Build a measurable client funnel from qualified prospect and reply to discovery call, paid pilot, reliable delivery, and a justified recurring retainer.",
};

function generateCadenceSlots(startDateIso = "2026-09-07", totalSlots = 23) {
  const slots: { date: string; dayOfWeek: string; blogPublishAt: string; pinPublishAt: string }[] = [];
  const current = new Date(`${startDateIso}T00:00:00+05:30`);
  const daysMap: Record<number, string> = {
    1: "Mon",
    3: "Wed",
    5: "Fri",
  };

  while (slots.length < totalSlots) {
    const day = current.getDay();
    if (day === 1 || day === 3 || day === 5) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const date = String(current.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${date}`;
      slots.push({
        date: dateStr,
        dayOfWeek: daysMap[day],
        blogPublishAt: `${dateStr}T09:30:00+05:30`,
        pinPublishAt: `${dateStr}T15:30:00+05:30`,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return slots;
}

export function generateManifest() {
  const allPosts = new Map([...growthPillarPosts, ...growthSupportingPosts].map((p) => [p.slug, p]));
  const slots = generateCadenceSlots("2026-09-07", ORDERED_SLUGS.length);

  // Validate slug completeness
  if (ORDERED_SLUGS.length !== 27) {
    throw new Error(`Expected 27 ordered slugs, found ${ORDERED_SLUGS.length}`);
  }

  // Validate slot uniqueness
  const uniqueDates = new Set(slots.map((s) => s.date));
  if (uniqueDates.size !== slots.length) {
    throw new Error(`Slot collision detected! ${slots.length} slots but only ${uniqueDates.size} unique dates.`);
  }

  const defaultHero = "public/images/blog/video-editing-agency-seo-hero.png";
  if (!fs.existsSync(path.resolve(defaultHero))) {
    throw new Error(`Default hero image missing: ${defaultHero}`);
  }

  const pins = ORDERED_SLUGS.map((slug, index) => {
    const post = allPosts.get(slug);
    if (!post) {
      throw new Error(`Post not found in growthPillarPosts or growthSupportingPosts: ${slug}`);
    }

    const slot = slots[index];
    const dedicatedPinImage = `public/images/blog/pinterest/${slug}-pin.png`;
    const imagePath = fs.existsSync(path.resolve(dedicatedPinImage)) ? dedicatedPinImage : defaultHero;

    const altText =
      EXISTING_PIN_ALTS[slug] ||
      post.heroAlt ||
      `${post.title} — practical Gigxomi guide for video editors`;

    const description = EXISTING_PIN_DESCRIPTIONS[slug] || post.metaDescription;

    const entry: Record<string, unknown> = {
      slug,
      blogPublishAt: slot.blogPublishAt,
      pinPublishAt: slot.pinPublishAt,
      title: post.title,
      description,
      altText,
      blogPath: `/blog/${slug}`,
      imagePath,
    };

    if (EXISTING_WP_POST_IDS[slug]) {
      entry.wordpressPostId = EXISTING_WP_POST_IDS[slug];
    }

    entry.publicationStatus = "asset-ready";
    entry.pinStatus = "blocked-until-blog-live-and-production-token";

    return entry;
  });

  return {
    campaign: "seo_growth_2026",
    environment: "production-required-for-public-pins",
    boardName: "Gigxomi Video Editing Growth",
    canonicalDomain: "https://www.gigxomi.com",
    creativeSpec: {
      aspectRatio: "2:3",
      recommendedPixels: "1000x1500",
      titleMaximumCharacters: 100,
      descriptionMaximumCharacters: 500,
    },
    pins,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]).toLowerCase().endsWith("generate-growth-distribution-manifest.ts")) {
  const manifest = generateManifest();
  const targetFile = path.resolve("content/pinterest-distribution.json");
  fs.writeFileSync(targetFile, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`Successfully generated manifest with ${manifest.pins.length} slots to ${targetFile}`);
}
