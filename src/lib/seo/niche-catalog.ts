import type { EditorCategory } from "@/lib/gigxomi/freelancer-assessment-bank";
import type { DummyService } from "@/lib/gigxomi/dummy-platform-store";
import type { MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";

export type NicheCategoryDefinition = {
  slug: string;
  categoryName: EditorCategory;
  title: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  targetKeywords: string[];
  summary: string;
  workflowBlueprint: string;
  deliverables: string[];
  turnaroundStandard: string;
  priceBenchmarkInr: string;
  priceBenchmarkUsd: string;
  buyerGuide: {
    overview: string;
    whatToLookFor: string[];
    commonMistakes: string[];
  };
  faqs: Array<{ question: string; answer: string }>;
};

export const NICHE_CATEGORIES: NicheCategoryDefinition[] = [
  {
    slug: "real-estate-video-editing",
    categoryName: "Real Estate",
    title: "Real Estate Video Editing",
    h1: "Professional Real Estate Video Editing Services",
    seoTitle: "Real Estate Video Editing Services | Hire Expert Property Editors",
    seoDescription:
      "Hire vetted real estate video editors for luxury property walkthroughs, drone footage pacing, architectural vertical reels, and fast 24-48hr listing delivery.",
    targetKeywords: [
      "real estate video editing",
      "hire real estate video editor",
      "property walkthrough video editing",
      "drone footage real estate editor",
      "real estate reels editor",
      "architectural video post production",
    ],
    summary:
      "Transform raw property footage and drone scans into high-converting architectural showcases, cinematic walkthroughs, and social-first property reels that attract buyers.",
    workflowBlueprint:
      "Organize property walking route, balance interior window exposure with exterior skies, calibrate true-to-life architectural color, and deliver 16:9 MLS and 9:16 social listing formats.",
    deliverables: [
      "Cinematic MLS-compliant 4K 16:9 walkthrough",
      "Fast-paced 9:16 vertical Instagram & TikTok property reel",
      "Sky replacement & interior window pull balancing",
      "Motion graphics property highlights (sq ft, bedrooms, price callout)",
      "Agent branded and unbranded MLS exports",
    ],
    turnaroundStandard: "24 to 48 Hours",
    priceBenchmarkInr: "₹2,500 – ₹7,500 per property",
    priceBenchmarkUsd: "$35 – $110 per property",
    buyerGuide: {
      overview:
        "High-performing real estate videos require a strict balance between cinematic emotion and factual property representation. The right editor understands speed-ramping, window masking, and platform requirements.",
      whatToLookFor: [
        "Proven experience with HDR window pulls and drone footage stabilization",
        "Clear understanding of MLS non-branded rules versus social-first promotional reels",
        "Consistent 24-48 hour turnaround so listings go live on schedule",
      ],
      commonMistakes: [
        "Digitally altering permanent room features which causes buyer disputes",
        "Over-warping ultra-wide lens footage creating unnatural room distortions",
        "Using copyrighted music that gets flagged on social platforms",
      ],
    },
    faqs: [
      {
        question: "How much does professional real estate video editing cost in 2026?",
        answer:
          "Professional real estate video editing typically ranges from ₹2,500 to ₹7,500 ($35 to $110 USD) per property on Gigxomi. Pricing depends on runtime, drone integration, window pull complexity, and whether both 16:9 and 9:16 formats are required.",
      },
      {
        question: "How fast can I get a completed real estate listing video?",
        answer:
          "Standard turnaround is 24 to 48 hours from footage intake. For urgent open-house deadlines, editors can deliver priority cuts within 24 hours when raw footage is uploaded through Gigxomi's project workspace.",
      },
      {
        question: "How does Gigxomi protect agencies hiring real estate video editors?",
        answer:
          "Gigxomi provides a two-lane masked communication workflow that prevents direct client poaching. Agencies retain full client ownership, maintain 0% platform commission on billing, and manage multi-editor deliveries with automated review gates.",
      },
    ],
  },
  {
    slug: "youtube-long-form-editing",
    categoryName: "Long-form YouTube",
    title: "YouTube Long-Form Video Editing",
    h1: "Expert YouTube Long-Form & Automation Video Editing",
    seoTitle: "YouTube Long-Form Video Editing Services | Retainers & Explainer Edits",
    seoDescription:
      "Hire top YouTube video editors for talking head retention, finance explainers, documentary pacing, B-roll layering, and recurring weekly channel uploads.",
    targetKeywords: [
      "youtube video editing services",
      "hire youtube video editor",
      "long-form youtube editor",
      "youtube automation video editing",
      "finance video editor youtube",
      "retention video editing",
    ],
    summary:
      "Turn raw recordings and talking-head podcasts into high-retention YouTube masterpieces with narrative structure, dynamic B-roll, custom sound design, and clean chapters.",
    workflowBlueprint:
      "Build the story timeline first, trim dead air and verbal crutches, insert context-reinforcing B-roll and motion graphics, balance loudness to -14 LUFS, and optimize the crucial first 30 seconds for maximum viewer retention.",
    deliverables: [
      "High-retention full 1080p/4K YouTube master",
      "Optimized 30-second retention hook sequencing",
      "Custom sound design, whooshes, and copyright-cleared background music",
      "Motion graphics callouts, lower thirds, and subscriber CTAs",
      "Exported chapter markers and clean audio master",
    ],
    turnaroundStandard: "48 to 72 Hours",
    priceBenchmarkInr: "₹3,500 – ₹12,000 per episode",
    priceBenchmarkUsd: "$50 – $180 per episode",
    buyerGuide: {
      overview:
        "YouTube long-form editing is fundamentally about audience retention and rhythm. An exceptional editor knows when to let a point breathe and when to deploy pattern interrupts to prevent drop-off.",
      whatToLookFor: [
        "Understanding of YouTube retention graphs and average view duration (AVD)",
        "Ability to source relevant B-roll and craft visual metaphors without hand-holding",
        "Consistent weekly delivery discipline for creator upload calendars",
      ],
      commonMistakes: [
        "Over-editing every sentence with excessive zooms that exhausts the audience",
        "Failing to balance voice loudness against background music, making dialogue muddy",
        "Neglecting the first 15-30 seconds where 40%+ of YouTube drop-offs occur",
      ],
    },
    faqs: [
      {
        question: "How do YouTube editors on Gigxomi maximize viewer retention?",
        answer:
          "Gigxomi editors analyze hook dynamics, apply subtle pattern interrupts every 4 to 7 seconds, clean up pauses without losing natural speech flow, and layer sound effects to reinforce core takeaways.",
      },
      {
        question: "Can I hire a YouTube editor on a recurring weekly retainer?",
        answer:
          "Yes. Most creators and agencies on Gigxomi hire editors on weekly retainers (e.g., 2 to 4 long-form videos per month). Projects and payments are organized transparently with zero platform commission.",
      },
      {
        question: "What files do I need to supply to my YouTube editor?",
        answer:
          "Supply your primary A-roll camera footage, separate audio WAV file (if recorded externally), brand assets (logo, font styles), and any specific reference links or script notes.",
      },
    ],
  },
  {
    slug: "short-form-reels-editing",
    categoryName: "Short-form/Reels/Shorts",
    title: "Short-Form, Reels & Shorts Editing",
    h1: "High-Retention Reels, TikTok & Shorts Video Editing",
    seoTitle: "Short-Form Video Editing Services | Instagram Reels & YouTube Shorts",
    seoDescription:
      "Hire specialized short-form video editors for viral Instagram Reels, TikToks, and YouTube Shorts. Dynamic burned captions, kinetic typography, and hook optimization.",
    targetKeywords: [
      "short-form video editor",
      "instagram reels video editing",
      "youtube shorts editor",
      "tiktok video editing services",
      "kinetic captions video editor",
      "hire viral shorts editor",
    ],
    summary:
      "Transform long-form podcasts, webinar recordings, and raw talking heads into viral 9:16 clips designed for maximum watch time, shares, and algorithmic reach.",
    workflowBlueprint:
      "Isolate high-impact moments, edit ruthlessly for zero dead time, add stylized kinetic subtitles within safe zones, integrate relevant sound cues, and deliver vertical H.264 masters.",
    deliverables: [
      "9:16 vertical MP4 export optimized for Reels/Shorts/TikTok",
      "Engaging kinetic subtitles with highlighted focus words",
      "Sound design pops, swooshes, and trend-aligned background audio",
      "B-roll overlays and visual pattern breaks",
      "Safe-zone compliant layout (no captions hidden by UI buttons)",
    ],
    turnaroundStandard: "24 to 48 Hours",
    priceBenchmarkInr: "₹800 – ₹2,500 per short",
    priceBenchmarkUsd: "$12 – $40 per short",
    buyerGuide: {
      overview:
        "Short-form algorithms reward completion rates and replays. Editors must master immediate 1.5-second visual hooks, kinetic typography pacing, and safe-zone compliance.",
      whatToLookFor: [
        "Proven ability to find the strongest clip hooks in 60-minute raw footage",
        "Clean, error-free typography that enhances comprehension rather than distracting",
        "Strict adherence to Instagram and TikTok interface safe zones",
      ],
      commonMistakes: [
        "Placing captions too low where TikTok captions and like buttons cover them",
        "Leaving a 2-second silence before speaking which causes users to scroll past",
        "Using cheesy, low-effort auto-caption animations that cheapen personal brand authority",
      ],
    },
    faqs: [
      {
        question: "How many short-form reels can an editor produce per week?",
        answer:
          "A dedicated short-form editor typically produces 5 to 15 polished reels or shorts per week, depending on whether they are cutting from raw bespoke footage or repurposing long-form podcast episodes.",
      },
      {
        question: "Can an editor repurpose my existing YouTube videos into Shorts?",
        answer:
          "Yes. Editors can review your long-form YouTube catalog, extract 3 to 5 viral moments per episode, reframe them into 9:16, add kinetic captions, and deliver upload-ready reels.",
      },
    ],
  },
  {
    slug: "podcast-interview-editing",
    categoryName: "Podcast/Interview",
    title: "Podcast & Interview Video Editing",
    h1: "Podcast & Interview Video Post-Production Services",
    seoTitle: "Podcast Video Editing Services | Multicam Sync & Audio Mastering",
    seoDescription:
      "Hire professional podcast video editors for multi-camera angle switching, studio audio noise reduction, chapter timestamps, and social-first promotional clips.",
    targetKeywords: [
      "podcast video editing",
      "multicam podcast editor",
      "hire podcast video editor",
      "podcast audio cleanup service",
      "interview video editing",
      "podcast video production",
    ],
    summary:
      "Streamline your podcast production with seamless multi-cam switching, room-noise elimination, speech level normalization, and high-impact episode packaging.",
    workflowBlueprint:
      "Sync multi-track audio and multi-angle video sources, de-reverb and de-hum audio channels, automate or manual cut camera angles to active speakers, insert title cards and guest names, and generate full episode masters.",
    deliverables: [
      "Full episode multi-cam 4K/1080p master",
      "Mastered audio track (WAV/MP3) normalized to broadcast standards",
      "Lower thirds identifying hosts and guest speakers",
      "Intro/outro bumper integration",
      "3x short-form teaser highlights for Instagram and LinkedIn promotion",
    ],
    turnaroundStandard: "48 to 72 Hours",
    priceBenchmarkInr: "₹4,000 – ₹15,000 per episode",
    priceBenchmarkUsd: "$60 – $220 per episode",
    buyerGuide: {
      overview:
        "Podcast listeners notice bad audio immediately. A great podcast editor ensures pristine dialogue intelligibility, natural conversational rhythm, and fluid camera switching.",
      whatToLookFor: [
        "Advanced audio restoration skills (de-noise, de-reverb, compression)",
        "Experience with multi-cam angle switching and speaker anticipation",
        "Reliability in delivering weekly release schedules",
      ],
      commonMistakes: [
        "Over-cutting conversational pauses so speakers sound like robots",
        "Allowing audio and video to drift out of sync across a 60-minute episode",
        "Switching camera angles erratically every time someone laughs or coughs",
      ],
    },
    faqs: [
      {
        question: "What is included in full podcast video post-production?",
        answer:
          "Full service includes multi-track audio sync, noise/echo removal, multi-camera switching, lower thirds, chapter markers, and optional social media teaser cutdowns.",
      },
      {
        question: "Can the editor clean up bad room echo and background noise?",
        answer:
          "Yes. Editors use professional spectral repair and AI-assisted de-noise plugins to minimize room reflections, hum, and microphone pops.",
      },
    ],
  },
  {
    slug: "ugc-performance-ad-editing",
    categoryName: "Ads/UGC/Performance",
    title: "UGC & Performance Ad Video Editing",
    h1: "High-Converting UGC & Performance Ad Video Editing",
    seoTitle: "UGC & DTC Ad Video Editing | High-ROAS Performance Creative",
    seoDescription:
      "Hire performance video editors for Meta, TikTok, and YouTube DTC ads. Modular hook variations, problem-solution pacing, and CTR-optimized direct response creative.",
    targetKeywords: [
      "ugc video editing",
      "performance ad video editor",
      "dtc video editing agency",
      "meta ads video editor",
      "tiktok ad video editing",
      "direct response video editor",
    ],
    summary:
      "Scale your advertising ROAS with performance-focused video editing. We turn raw customer testimonials and creator footage into high-converting Meta and TikTok video ads.",
    workflowBlueprint:
      "Slice raw UGC footage into modular 3-second hook variations, establish clear problem-solution arcs, emphasize product benefits with bold kinetic text, and deliver clear direct-response CTAs.",
    deliverables: [
      "Core 9:16 and 4:5 performance ad cuts",
      "3x to 5x modular hook variations for A/B creative testing",
      "Callout overlays, discount code bumpers, and direct response stickers",
      "Soundtrack and native voiceover mix",
      "Ad-ready files pre-formatted for Meta Ads Manager and TikTok Ads",
    ],
    turnaroundStandard: "24 to 48 Hours",
    priceBenchmarkInr: "₹2,000 – ₹6,000 per creative batch",
    priceBenchmarkUsd: "$30 – $90 per creative batch",
    buyerGuide: {
      overview:
        "Performance creative requires marketing psychology, not just cinematic aesthetics. Editors must understand thumb-stopping rates, hook drop-off, and conversion funnels.",
      whatToLookFor: [
        "Familiarity with direct response frameworks (Hook -> Problem -> Agitate -> Solution -> Proof -> CTA)",
        "Ability to deliver multiple hook variations per video concept for ad testing",
        "Experience with DTC and e-commerce conversion benchmarks",
      ],
      commonMistakes: [
        "Treating an ad like a cinematic short film with a 5-second slow logo intro",
        "Altering regulated product claims without explicit brand sign-off",
        "Missing clear, urgent call-to-action cards at the end of the video",
      ],
    },
    faqs: [
      {
        question: "Why are multiple hook variations important for video ads?",
        answer:
          "Testing 3 to 5 different 3-second hooks against the same core product body allows ad buyers to discover low-CAC winners without paying to film completely new videos.",
      },
      {
        question: "What formats do editors deliver for social ad campaigns?",
        answer:
          "Editors deliver native 9:16 (Stories, Reels, TikTok), 4:5 (Feed), and 16:9 (YouTube) exports formatted to meet platform compression and bitrate specifications.",
      },
    ],
  },
  {
    slug: "wedding-cinematic-editing",
    categoryName: "Wedding/Event",
    title: "Wedding & Event Video Editing",
    h1: "Cinematic Wedding & Luxury Event Video Editing",
    seoTitle: "Wedding Video Editing Services | Cinematic Highlight Reels & Teasers",
    seoDescription:
      "Outsource your wedding post-production to elite editors. Emotion-first pacing, multi-cam vows sync, cinematic color grading, and fast same-week teaser turnaround.",
    targetKeywords: [
      "wedding video editing service",
      "outsource wedding video editing",
      "cinematic wedding highlight reel",
      "wedding teaser editor",
      "event video post production",
      "color grade wedding film",
    ],
    summary:
      "Help wedding cinematographers clear post-production backlogs with emotion-driven highlight films, same-week social teasers, and full multicam ceremony edits.",
    workflowBlueprint:
      "Organize footage by camera card and chronological event, sync vows and speeches, craft an emotion-first music-led narrative, color grade LOG footage for natural skin tones, and output archival masters.",
    deliverables: [
      "3 to 5 minute cinematic wedding highlight film",
      "60-second vertical teaser for Instagram within 7 days",
      "Full multicam ceremony and reception speeches master",
      "Cinematic color grading matching studio color profile",
      "Archival ProRes and web-optimized H.264 masters",
    ],
    turnaroundStandard: "3 to 7 Days",
    priceBenchmarkInr: "₹6,000 – ₹25,000 per wedding film",
    priceBenchmarkUsd: "$90 – $350 per wedding film",
    buyerGuide: {
      overview:
        "Wedding filmmaking is irreplaceable emotional footage. Outsource partners must demonstrate bulletproof data safety, skin-tone color precision, and storytelling taste.",
      whatToLookFor: [
        "Consistent color grading that keeps bride and groom skin tones looking natural",
        "Seamless narrative pacing that weaves ceremony vows over b-roll footage",
        "Verified redundant backup procedures during project intake",
      ],
      commonMistakes: [
        "Over-saturating skin tones or crushing shadow details in dimly lit reception halls",
        "Using generic pop tracks that don't match the solemnity of the ceremony",
        "Missing crucial family members or key emotional glances during vows",
      ],
    },
    faqs: [
      {
        question: "How do wedding studios outsource editing during peak season?",
        answer:
          "Wedding studios partner with Gigxomi editors to handle heavy raw footage intake, synchronized multicam prep, and first-cut highlight editing, freeing the principal shooter to film more weddings.",
      },
      {
        question: "Can the editor match my studio's unique color grade and LUTs?",
        answer:
          "Yes. You can supply your custom camera LUTs, color profiles, and reference films to ensure every delivered cut matches your studio brand identity.",
      },
    ],
  },
  {
    slug: "corporate-brand-editing",
    categoryName: "Corporate/Brand",
    title: "Corporate & Brand Video Editing",
    h1: "Corporate & Brand Video Post-Production Services",
    seoTitle: "Corporate Video Editing Services | B2B Case Studies & Brand Films",
    seoDescription:
      "Hire professional corporate video editors for B2B brand films, customer case studies, executive interviews, internal all-hands, and corporate event recaps.",
    targetKeywords: [
      "corporate video editing",
      "b2b video editing services",
      "brand film post production",
      "customer case study video editor",
      "executive interview editing",
      "corporate video agency",
    ],
    summary:
      "Elevate your enterprise communication with polished corporate video editing. From customer case studies to brand manifestos, deliver broadcast-quality business video.",
    workflowBlueprint:
      "Align with brand guidelines and typography kits, structure narrative customer stories, incorporate clean motion graphics charts, and output accessibility-compliant masters with burned captions.",
    deliverables: [
      "Master brand film export (16:9 and 1:1)",
      "Branded lower thirds and animated stat callouts",
      "Color grading compliant with enterprise corporate guidelines",
      "SRT closed caption files and accessibility compliance pass",
      "Compressed versions for LinkedIn and intranet distribution",
    ],
    turnaroundStandard: "3 to 5 Days",
    priceBenchmarkInr: "₹5,000 – ₹20,000 per video",
    priceBenchmarkUsd: "$75 – $280 per video",
    buyerGuide: {
      overview:
        "Corporate post-production demands brand governance, clean pacing, and enterprise polish. The editor must understand stakeholder hierarchies and brand book specifications.",
      whatToLookFor: [
        "Experience adhering strictly to corporate brand books and font licensing",
        "Ability to make dry business interviews feel engaging and credible",
        "Understanding of accessibility requirements (closed captioning, color contrast)",
      ],
      commonMistakes: [
        "Using unapproved fonts, colors, or unofficial logo variations",
        "Misspelling executive names or corporate titles in lower thirds",
        "Cutting explanations in ways that misrepresent product capabilities",
      ],
    },
    faqs: [
      {
        question: "Can editors deliver videos formatted for LinkedIn corporate pages?",
        answer:
          "Yes. Corporate editors provide 1:1 square and 16:9 widescreen masters with burned captions, since over 80% of LinkedIn video feeds are watched with sound muted.",
      },
      {
        question: "How are enterprise NDAs and confidential footage handled?",
        answer:
          "Gigxomi enforces strict workspace privacy protocols. Client identities are protected, and editors operate under verified terms of confidentiality.",
      },
    ],
  },
  {
    slug: "course-webinar-editing",
    categoryName: "Education/Course/Webinar",
    title: "Course & Webinar Video Editing",
    h1: "Online Course & Webinar Video Post-Production",
    seoTitle: "Online Course Video Editing Services | Webinar & Education Packaging",
    seoDescription:
      "Hire specialized course and webinar video editors. Trim dead time, optimize slide readability, add chapter timestamps, and package curriculum video modules.",
    targetKeywords: [
      "online course video editing",
      "webinar video editing",
      "educational video editor",
      "course module video editor",
      "tutorial video post production",
      "elearning video editing",
    ],
    summary:
      "Transform sprawling webinar recordings and raw screen captures into crisp, professional online course curriculum modules that maximize student completion rates.",
    workflowBlueprint:
      "Clean vocal filler words and long pauses, enhance slide readability, zoom in on key software UI interactions, insert module intro/outro bumpers, and generate structured chapter markers.",
    deliverables: [
      "Bite-sized lesson modules with standardized titles",
      "Software UI zoom callouts and highlight pointers",
      "Clean dialogue audio mastering and silence trimming",
      "Full course chapter list and timeline timestamps",
      "Compressed LMS-ready MP4 exports for Kajabi, Teachable, or custom portals",
    ],
    turnaroundStandard: "2 to 4 Days",
    priceBenchmarkInr: "₹2,500 – ₹10,000 per module",
    priceBenchmarkUsd: "$35 – $150 per module",
    buyerGuide: {
      overview:
        "Educational editing is focused on clarity and learning outcomes. Every graphic, zoom, and cut must serve understanding rather than decorative flair.",
      whatToLookFor: [
        "Patience to edit complex instructional material without cutting necessary context",
        "Crisp screen capture upscaling and intelligent focal zooms",
        "Consistent module titling across 20+ lesson courses",
      ],
      commonMistakes: [
        "Cutting so aggressively that the instructor's technical explanation becomes confusing",
        "Leaving tiny text unzoomed on mobile screens",
        "Inconsistent audio loudness between different lesson recordings",
      ],
    },
    faqs: [
      {
        question: "Can an editor batch-edit an entire 15-module course?",
        answer:
          "Yes. Course creators regularly book batch projects on Gigxomi. Editors establish a template in lesson 1, then apply consistent styling across the entire curriculum.",
      },
      {
        question: "Do course editors add quizzes or text overlays?",
        answer:
          "Editors can add visual text summaries, key takeaway callouts, and transition cards between learning concepts.",
      },
    ],
  },
  {
    slug: "motion-graphics-vfx",
    categoryName: "Motion Graphics/VFX",
    title: "Motion Graphics & VFX Packaging",
    h1: "Custom Motion Graphics, Intros & Visual Effects",
    seoTitle: "Motion Graphics & VFX Video Services | 2D/3D Animation & Channel Packaging",
    seoDescription:
      "Hire top motion graphics designers and VFX artists for channel intro animations, logo reveals, lower thirds systems, 3D product renders, and kinetic typography.",
    targetKeywords: [
      "motion graphics video services",
      "hire motion graphics artist",
      "youtube channel intro animation",
      "kinetic typography designer",
      "vfx video editing",
      "logo reveal animation service",
    ],
    summary:
      "Bring your brand to life with bespoke 2D/3D motion graphics, eye-catching logo intros, kinetic title packages, and seamless visual effects compositing.",
    workflowBlueprint:
      "Develop storyboard styleframes, build vector assets, animate easing curves and kinetic elements in After Effects/Blender, composite with sound design, and output transparent alpha channel masters.",
    deliverables: [
      "Bespoke motion graphic animations in 4K/60fps",
      "Transparent ProRes 4444 overlay files for video editors",
      "Custom sound effects designed to accent motion cues",
      "MOGRT (Motion Graphics Template) files for Premiere Pro upon request",
      "Web-ready lightweight MP4 and WebM previews",
    ],
    turnaroundStandard: "3 to 5 Days",
    priceBenchmarkInr: "₹3,000 – ₹18,000 per project",
    priceBenchmarkUsd: "$45 – $250 per project",
    buyerGuide: {
      overview:
        "High-end motion graphics require refined timing, easing curves, and design taste. Look for artists who understand restraint rather than chaotic plugin presets.",
      whatToLookFor: [
        "Strong portfolio demonstrating custom keyframe easing and typography layout",
        "Ability to deliver transparent alpha channel files ready for editing timelines",
        "Deep expertise in Adobe After Effects, Cinema 4D, or Blender",
      ],
      commonMistakes: [
        "Relying on outdated canned templates that look generic",
        "Neglecting custom sound design, making motion feel hollow",
        "Exporting heavy uncompressed files that slow down the client's editing software",
      ],
    },
    faqs: [
      {
        question: "Can I use the animated intro across all my company videos?",
        answer:
          "Yes. Once delivered, you have full commercial rights to use your intro bumper, logo reveal, and lower thirds across all your public and private video content.",
      },
      {
        question: "Can the motion designer provide editable Premiere Pro MOGRTs?",
        answer:
          "Yes. Many motion artists can package lower thirds and titles into editable MOGRT files so your in-house team can easily swap text without opening After Effects.",
      },
    ],
  },
  {
    slug: "gaming-stream-editing",
    categoryName: "Gaming/Streaming",
    title: "Gaming & Stream Highlights Editing",
    h1: "Gaming & Stream Highlights Video Editing Services",
    seoTitle: "Gaming Video Editing Services | Twitch Stream Highlights & Montages",
    seoDescription:
      "Hire gaming video editors for Twitch stream cutdowns, funny moments montages, esports fragmovies, dynamic subtitles, and engaging YouTube gaming videos.",
    targetKeywords: [
      "gaming video editor",
      "stream highlights video editing",
      "twitch stream editor",
      "esports fragmovie editing",
      "funny gaming moments editor",
      "youtube gaming video post production",
    ],
    summary:
      "Condense 6-hour Twitch streams into action-packed 12-minute YouTube videos and viral TikTok clips featuring comedic zooms, meme soundboards, and high-energy pacing.",
    workflowBlueprint:
      "Review stream VOD timestamps, sync facecam with gameplay feed, extract peak comedy and clutch gameplay moments, insert punchy zooms and meme SFX, and deliver high-energy exports.",
    deliverables: [
      "10 to 15 minute YouTube stream highlight compilation",
      "Facecam and gameplay audio balance with copyright-safe music",
      "Comedic kinetic subtitles for group banter",
      "3x viral gaming TikToks/Shorts per stream",
      "Thumbnail concept suggestions and title ideation",
    ],
    turnaroundStandard: "24 to 48 Hours",
    priceBenchmarkInr: "₹1,500 – ₹6,000 per video",
    priceBenchmarkUsd: "$20 – $90 per video",
    buyerGuide: {
      overview:
        "Gaming editing demands deep gaming culture knowledge and comic timing. The editor must know the game mechanics and anticipate streamer humor.",
      whatToLookFor: [
        "Understanding of the specific game title (Valorant, GTA RP, Minecraft, Apex, Warzone)",
        "Sharp audio balancing between Discord banter, game sound, and background music",
        "Fast turnaround so stream highlights publish while topics are still trending",
      ],
      commonMistakes: [
        "Covering critical in-game HUD elements (health, ammo, map) with memes",
        "Using copyrighted music that results in stream VOD muting or YouTube strikes",
        "Cutting so frenetically that viewers cannot follow the gameplay action",
      ],
    },
    faqs: [
      {
        question: "Can an editor find the best moments without timestamps?",
        answer:
          "Yes, experienced gaming editors can review Twitch chat spikes and audio waveforms to pinpoint clutch plays, laughter, and high-energy moments.",
      },
      {
        question: "How do editors handle copyright strikes on gaming background music?",
        answer:
          "Gigxomi gaming editors use strictly royalty-free or licensed music tracks safe for YouTube monetization and Twitch VOD playback.",
      },
    ],
  },
  {
    slug: "documentary-film-editing",
    categoryName: "Documentary/Film",
    title: "Documentary & Film Narrative Editing",
    h1: "Documentary & Independent Film Editing Services",
    seoTitle: "Documentary Video Editing Services | Narrative Story Post-Production",
    seoDescription:
      "Hire narrative documentary editors for investigative stories, founder journeys, festival submissions, historical retrospectives, and deep emotional storytelling.",
    targetKeywords: [
      "documentary video editing",
      "narrative video editor",
      "founder story documentary editor",
      "film post production services",
      "investigative video editor",
      "cinematic documentary storytelling",
    ],
    summary:
      "Craft compelling, deeply moving documentary narratives. Our editors weave archival footage, intimate interviews, and atmospheric soundscapes into festival-caliber films.",
    workflowBlueprint:
      "Transcribe and organize extensive interview archives, build paper cuts and narrative story arcs, weave historic B-roll and newspaper clippings, create a dynamic soundstage, and finish with cinematic color grading.",
    deliverables: [
      "Feature or short documentary master in 4K DCI",
      "Comprehensive archival footage and historical photo integration pass",
      "Atmospheric 5.1 or stereo sound mix with Foley textures",
      "Complete festival submission package with trailer and poster cues",
      "Clean dialogue subtitle track and international language exports",
    ],
    turnaroundStandard: "1 to 3 Weeks",
    priceBenchmarkInr: "₹12,000 – ₹60,000 per film",
    priceBenchmarkUsd: "$180 – $850 per film",
    buyerGuide: {
      overview:
        "Documentary editing is the art of writing the film in the edit suite. Editors must possess deep storytelling sensitivity, patience for massive footage libraries, and pacing mastery.",
      whatToLookFor: [
        "Demonstrated ability to uncover emotional narrative threads in unscripted footage",
        "Meticulous footage organization and metadata tagging workflows",
        "Expertise in archival photo motion (2.5D parallax Ken Burns treatments)",
      ],
      commonMistakes: [
        "Relying solely on talking heads without establishing environmental atmosphere",
        "Rushing emotional beats before audiences have absorbed critical revelations",
        "Using low-resolution archival photos without clean upscaling or texture treatment",
      ],
    },
    faqs: [
      {
        question: "How do documentary editors handle hours of unscripted interview footage?",
        answer:
          "Editors transcribe audio, tag thematic soundbites, construct a written paper cut of the narrative structure, and then build the visual assembly edit.",
      },
      {
        question: "Can the editor help with festival deliverables and DCP creation?",
        answer:
          "Yes. Many documentary post-production editors can prepare film festival submission masters, trailers, and DCP-ready packages.",
      },
    ],
  },
  {
    slug: "music-video-editing",
    categoryName: "Music Video",
    title: "Music Video Editing & Color Grading",
    h1: "Music Video Editing & Cinematic Color Grading",
    seoTitle: "Music Video Editing Services | Visual Pacing, VFX & Color Grading",
    seoDescription:
      "Hire music video editors for rhythm-locked pacing, performance lip-sync, stylized color grading, film grain textures, and high-energy music video finishing.",
    targetKeywords: [
      "music video editing",
      "hire music video editor",
      "music video color grading",
      "lip sync performance editor",
      "music video post production",
      "hip hop music video editor",
    ],
    summary:
      "Turn your performance footage into an unforgettable visual track. Rhythm-locked pacing, glitch transitions, speed ramps, and stylized analog film color grading.",
    workflowBlueprint:
      "Sync multi-take performance footage against master audio track, build narrative cutaways, execute rhythmic cut-on-beat transitions, apply stylized film halation and grain, and output broadcast masters.",
    deliverables: [
      "4K widescreen music video master synchronized to final audio",
      "Stylized color grade with film grain and halation emulation",
      "Performance lip-sync perfection across multiple outfit changes",
      "30-second Spotify Canvas and Instagram teaser cutdowns",
      "VFX speed ramps, split screens, and lens flare integration",
    ],
    turnaroundStandard: "3 to 6 Days",
    priceBenchmarkInr: "₹5,000 – ₹22,000 per music video",
    priceBenchmarkUsd: "$70 – $320 per music video",
    buyerGuide: {
      overview:
        "Music video editing requires acute musical sensibility, rhythmic instinct, and visual style. The edit must amplify the artist's persona and sonic dynamics.",
      whatToLookFor: [
        "Impeccable lip-sync accuracy across multiple performance speeds",
        "Stylistic versatility ranging from gritty vintage 16mm to hyper-clean digital VFX",
        "Understanding of music pacing, drop builds, and tempo changes",
      ],
      commonMistakes: [
        "Cutting mechanically on every single snare beat rather than building visual phrasing",
        "Losing track of lip-sync timing during speed-ramped transitions",
        "Over-relying on cheap digital glitch plugins that distract from the artist's charisma",
      ],
    },
    faqs: [
      {
        question: "How is lip-sync maintained across slow-motion or fast-motion shots?",
        answer:
          "Professional editors match footage shot at higher frame rates (e.g. 48fps or 60fps with 2x playback on set) back to the 24fps master audio timeline for flawless slow-motion lip-sync.",
      },
      {
        question: "Can the editor deliver vertical teasers for Spotify Canvas and TikTok?",
        answer:
          "Yes. Editors provide 9:16 vertical 8-second Spotify Canvas loops and social teasers reformatted to keep the artist centered.",
      },
    ],
  },
];

export function getNicheBySlug(slug: string): NicheCategoryDefinition | undefined {
  return NICHE_CATEGORIES.find((item) => item.slug === slug);
}

export function getAllNicheSlugs(): string[] {
  return NICHE_CATEGORIES.map((item) => item.slug);
}

export function filterServicesForNiche(
  services: Array<DummyService | MarketplaceSurfaceService>,
  niche: NicheCategoryDefinition,
): Array<DummyService | MarketplaceSurfaceService> {
  const matching = services.filter((service) => {
    if (service.primaryEditorCategory === niche.categoryName) {
      return true;
    }
    if (service.specialty && service.specialty.toLowerCase().includes(niche.title.toLowerCase())) {
      return true;
    }
    if (service.category === "Video Editing") {
      const haystack = [
        service.title,
        service.description,
        service.specialty,
        ...(service.tags || []),
        ...(service.seoKeywords || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const ignoredTokens = new Set(["video", "editing", "service", "services"]);
      const tokens = niche.slug
        .split("-")
        .filter((t) => t.length > 3 && !ignoredTokens.has(t));
      return tokens.length > 0 && tokens.some((token) => haystack.includes(token));
    }
    return false;
  });

  if (matching.length > 0) {
    return matching;
  }

  return services.filter((s) => s.category === "Video Editing").slice(0, 6);
}
