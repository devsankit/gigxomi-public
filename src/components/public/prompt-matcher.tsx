"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";

import { DiscoveryServiceCard } from "@/components/public/discovery-service-card";
import { HeroMatcher } from "@/components/public/hero-matcher";
import { HomepageServiceCard } from "@/components/public/homepage-service-card";
import { HomepageBrandSections, type HomepageBlogPost } from "@/components/public/homepage-brand-sections";
import { HowItWorks } from "@/components/public/how-it-works";
import { MobileUnifiedSearch } from "@/components/public/mobile-unified-search";
import { PublicAuthPanel } from "@/components/public/public-auth-panel";
import { PublicShell } from "@/components/public/public-shell";
import { ServiceChips } from "@/components/public/service-chips";
import type { AppRole, PackageAudience, WorkspaceMode } from "@/lib/auth/types";
import { publicAgencyReasons } from "@/lib/gigxomi/business-ecosystem-data";
import type { AgencyListingProfile } from "@/lib/gigxomi/agency-listing-types";
import { buildAgencyInquiryHref } from "@/lib/gigxomi/public-contact";
import { pushGrowthEvent } from "@/lib/gigxomi/public-growth-client";
import {
  getPublicSurfaceTitle,
  PUBLIC_DISCOVERY_NAV,
  type PublicPresetKey,
  type PublicSurfaceKey,
} from "@/lib/gigxomi/public-shell-nav";
import type { RegistrationPackage } from "@/lib/gigxomi/public-growth-types";
import type { MarketplaceSurfaceService } from "@/lib/gigxomi/wordpress-marketplace";

type MarketplaceSurface = PublicSurfaceKey;
type DiscoveryPreset = PublicPresetKey;
type AuthMode = "login" | "signup";
type BudgetFilter = "all" | "under-2500" | "2500-5000" | "5000-10000" | "10000-plus";
type AgencyHiringFilter = "all" | AgencyListingProfile["hiringStatus"];
type AgencyOfficeFilter = "all" | "office" | "remote";
type AgencySortOption = "karma" | "reviews" | "orders";
type AgencyMapPin = {
  agencies: AgencyListingProfile[];
  count: number;
  key: string;
  label: string;
  x: number;
  y: number;
};

type PromptMatcherProps = {
  agencies: AgencyListingProfile[];
  blogPosts: HomepageBlogPost[];
  catalogStats: {
    videoEditors: number;
    designEditors: number;
    totalEditors: number;
    totalServices: number;
  };
  initialPreset: DiscoveryPreset;
  initialSurface: MarketplaceSurface;
  services: MarketplaceSurfaceService[];
  packages: RegistrationPackage[];
  session: {
    userId: string | null;
    role: AppRole | "GUEST";
    displayName: string | null;
    packageAudience: PackageAudience | null;
    workspaceMode: WorkspaceMode;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const budgetFilterOptions: Array<{ id: BudgetFilter; label: string }> = [
  { id: "all", label: "All budgets" },
  { id: "under-2500", label: "Under Rs 2,500" },
  { id: "2500-5000", label: "Rs 2,500 - 5,000" },
  { id: "5000-10000", label: "Rs 5,000 - 10,000" },
  { id: "10000-plus", label: "Rs 10,000+" },
];

const matcherHeroChips = [
  { id: "reels", label: "Reels", preset: "short-form" as const, prompt: "Instagram reels editing with strong hooks" },
  { id: "wedding", label: "Wedding", preset: "long-form" as const, prompt: "Wedding highlight film editing with cinematic storytelling" },
  { id: "youtube", label: "YouTube", preset: "long-form" as const, prompt: "YouTube video editing with retention-focused pacing" },
  { id: "ads", label: "Ads", preset: "best-sellers" as const, prompt: "Ad video editing for paid social campaigns" },
];

const popularServiceChipItems = [
  { id: "instagram-reels", label: "Instagram Reels", preset: "short-form" as const, prompt: "Instagram reels editing" },
  { id: "wedding-edit", label: "Wedding Edit", preset: "long-form" as const, prompt: "Wedding edit" },
  { id: "youtube-videos", label: "YouTube Videos", preset: "long-form" as const, prompt: "YouTube videos" },
  { id: "podcast-editing", label: "Podcast Editing", preset: "long-form" as const, prompt: "Podcast editing" },
  { id: "motion-graphics", label: "Motion Graphics", preset: "best-sellers" as const, prompt: "Motion graphics editing" },
  { id: "ad-videos", label: "Ad Videos", preset: "best-sellers" as const, prompt: "Ad videos" },
];

const howItWorksSteps = [
  {
    id: "tell",
    title: "1. Tell us your need",
    description: "Describe your project, budget, and style in one search.",
  },
  {
    id: "match",
    title: "2. AI matches services",
    description: "Gigxomi ranks the strongest service fits instantly.",
  },
  {
    id: "delivery",
    title: "3. Get delivery",
    description: "Choose the right service and move to delivery fast.",
  },
];

function getServicePreviewImage(service: MarketplaceSurfaceService) {
  return service.sampleThumbnailUrl || service.coverImageUrl || null;
}

function getDashboardHrefForSession(session: PromptMatcherProps["session"]) {
  if (session.role === "SUPER_ADMIN") {
    return "/super-admin";
  }

  if (session.packageAudience === "AGENCY" || session.workspaceMode === "AGENCY" || session.role === "ADMIN") {
    return "/admin/chat";
  }

  if (session.role === "MANAGER") {
    return "/manager/chat";
  }

  if (session.role === "FREELANCER") {
    return "/freelancer/chat";
  }

  return "/login";
}

function filterServices(services: MarketplaceSurfaceService[], preset: DiscoveryPreset) {
  if (preset === "best-sellers") return services;
  if (preset === "graphic-design") return services.filter((service) => service.category === "Graphic Design");
  if (preset === "budget-friendly") return services.filter((service) => service.basePrice <= 2500);
  if (preset === "fast-delivery") return services.filter((service) => /1 Day|2 Days|24|48/i.test(`${service.deliveryTime} ${service.turnaroundLabel}`));
  if (preset === "premium-editors") return services.filter((service) => service.trustBand === "Trusted" || service.trustBand === "Elite");
  if (preset === "short-form") return services.filter((service) => /short|reel|ugc/i.test(`${service.title} ${service.summary} ${service.specialty}`));
  if (preset === "long-form") return services.filter((service) => /long|podcast|webinar|youtube/i.test(`${service.title} ${service.summary} ${service.specialty}`));
  return services;
}

function matchesServiceQuery(service: MarketplaceSurfaceService, query: string) {
  if (!query.trim()) {
    return true;
  }

  const haystack = [
    service.title,
    service.summary,
    service.ownerName,
    service.ownerAlias,
    service.specialty,
    service.category,
    service.targetAudience,
    service.deliveryTime,
    service.turnaroundLabel,
    service.trustBand,
    service.workloadBand,
    service.activeAgencySummary,
    ...service.tags,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.trim().toLowerCase());
}

function matchesBudgetFilter(service: MarketplaceSurfaceService, budgetFilter: BudgetFilter) {
  if (budgetFilter === "all") {
    return true;
  }

  if (budgetFilter === "under-2500") {
    return service.basePrice < 2500;
  }

  if (budgetFilter === "2500-5000") {
    return service.basePrice >= 2500 && service.basePrice <= 5000;
  }

  if (budgetFilter === "5000-10000") {
    return service.basePrice > 5000 && service.basePrice <= 10000;
  }

  return service.basePrice > 10000;
}

function sortServicesByBudget(services: MarketplaceSurfaceService[]) {
  return [...services].sort((left, right) => {
    if (left.basePrice !== right.basePrice) {
      return left.basePrice - right.basePrice;
    }

    return left.title.localeCompare(right.title);
  });
}

function rankServicesByPrompt(services: MarketplaceSurfaceService[], prompt: string) {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const keywords = normalizedPrompt.split(/[^a-z0-9]+/i).filter((keyword) => keyword.length >= 2);

  if (!keywords.length) {
    return [];
  }

  return services
    .map((service) => {
      const haystack = [
        service.title,
        service.summary,
        service.ownerName,
        service.ownerAlias,
        service.specialty,
        service.category,
        service.targetAudience,
        service.deliveryTime,
        service.turnaroundLabel,
        service.trustBand,
        service.workloadBand,
        service.activeAgencySummary,
        ...service.tags,
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;

      for (const keyword of keywords) {
        if (service.title.toLowerCase().includes(keyword)) {
          score += 16;
        }

        if (haystack.includes(keyword)) {
          score += 8;
        }
      }

      if (/urgent|fast|asap|today|tomorrow|quick/i.test(normalizedPrompt) && /1 Day|2 Days|24|48/i.test(`${service.deliveryTime} ${service.turnaroundLabel}`)) {
        score += 12;
      }

      if (/budget|cheap|affordable|low cost/i.test(normalizedPrompt) && service.basePrice <= 2500) {
        score += 10;
      }

      if (/premium|best|expert|top/i.test(normalizedPrompt) && (service.trustBand === "Trusted" || service.trustBand === "Elite")) {
        score += 10;
      }

      return { service, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((item) => item.service);
}

function filterHomepageVideoServices(services: MarketplaceSurfaceService[]) {
  return services.filter((service) => {
    if (service.category !== "Video Editing") {
      return false;
    }

    const haystack = `${service.title} ${service.summary} ${service.specialty} ${service.category} ${service.tags.join(" ")}`.toLowerCase();
    return !/(poster|thumbnail|graphic design|design pack|cover design|logo)/i.test(haystack);
  });
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechRecognition = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
  ).SpeechRecognition;
  const webkitSpeechRecognition = (
    window as Window & {
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
  ).webkitSpeechRecognition;

  return speechRecognition ?? webkitSpeechRecognition ?? null;
}

export function PromptMatcher({ agencies, blogPosts, catalogStats, initialPreset, initialSurface, packages, services, session }: PromptMatcherProps) {
  const [activeSurface, setActiveSurface] = useState<MarketplaceSurface>(initialSurface);
  const [selectedPreset, setSelectedPreset] = useState<DiscoveryPreset>(initialPreset);
  const [promptValue, setPromptValue] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("all");
  const [activePlayerServiceId, setActivePlayerServiceId] = useState<string | null>(null);
  const [isComposerCompact, setIsComposerCompact] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [selectedAuthPackageId, setSelectedAuthPackageId] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const composerTextareaRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const matcherResultsRef = useRef<HTMLElement | null>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const freelancerPackages = useMemo(() => packages.filter((item) => item.audience === "FREELANCER"), [packages]);
  const defaultFreelancerPackageId = freelancerPackages[0]?.id ?? packages[0]?.id ?? "";
  const isAuthenticated = session.role !== "GUEST" && Boolean(session.userId);
  const dashboardHref = isAuthenticated ? getDashboardHrefForSession(session) : "/login";
  const profileLabel = session.displayName?.trim() || "My profile";

  const filteredServices = useMemo(
    () =>
      sortServicesByBudget(
        filterServices(services, selectedPreset)
          .filter((service) => matchesServiceQuery(service, searchQuery))
          .filter((service) => matchesBudgetFilter(service, budgetFilter)),
      ),
    [budgetFilter, searchQuery, selectedPreset, services],
  );

  const promptMatches = useMemo(() => {
    if (!activePrompt.trim()) {
      return [];
    }

    return sortServicesByBudget(
      rankServicesByPrompt(filterServices(services, selectedPreset), activePrompt)
        .filter((service) => matchesServiceQuery(service, searchQuery))
        .filter((service) => matchesBudgetFilter(service, budgetFilter)),
    );
  }, [activePrompt, budgetFilter, searchQuery, selectedPreset, services]);

  const hasActivePrompt = Boolean(activePrompt.trim());
  const surfacedServices = hasActivePrompt ? promptMatches : filteredServices;
  const matcherHomepageServices = filterHomepageVideoServices(surfacedServices).slice(0, 8);
  const homepagePreviewServices = filterHomepageVideoServices(filteredServices).slice(0, 6);
  const selectedPresetLabel = PUBLIC_DISCOVERY_NAV.find((item) => item.id === selectedPreset)?.label ?? "Discover";
  const selectedBudgetLabel = budgetFilterOptions.find((item) => item.id === budgetFilter)?.label ?? "All budgets";
  const hasSearchContext = Boolean(activePrompt.trim() || searchQuery.trim() || budgetFilter !== "all");
  const shouldUseCompactComposer = isComposerCompact || (isMobileViewport && hasSearchContext);
  const matcherTrustItems = [`${Math.max(120, catalogStats.totalServices)}+ Services`, "Sample Previews", "Agency Friendly"];
  const composerPlaceholder =
    activeSurface === "matcher"
      ? "Tell us the vibe, budget, and speed you want..."
      : "Describe the edit style, quality, budget, or delivery you need...";

  const openAuthModal = (mode: AuthMode, packageId = "") => {
    setAuthMode(mode);
    setSelectedAuthPackageId(packageId);
    setIsAuthOpen(true);
    pushGrowthEvent("gigxomi_auth_modal_opened", {
      authMode: mode,
      packageId: packageId || null,
      surface: activeSurface,
    });
  };

  const focusComposer = () => {
    composerTextareaRef.current?.focus();
  };

  const stopListening = () => {
    speechRecognitionRef.current?.stop();
    setIsListening(false);
  };

  const browseCategory = (preset: DiscoveryPreset) => {
    setSelectedPreset(preset);
    setActiveSurface("services");
    setActivePlayerServiceId(null);
    setActivePrompt("");
    setSearchQuery("");
    setBudgetFilter("all");
  };

  const applyMatcherShortcut = (preset: DiscoveryPreset, prompt: string, submit = false) => {
    setSelectedPreset(preset);
    setActiveSurface("matcher");
    setActivePlayerServiceId(null);
    setPromptValue(prompt);
    if (submit) {
      submitPrompt(prompt, "matcher");
      return;
    }
    focusComposer();
  };

  useEffect(() => {
    const recognitionConstructor = getSpeechRecognitionConstructor();
    if (!recognitionConstructor) {
      return undefined;
    }

    const recognition = new recognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        setPromptValue((current) => (current ? `${current.trim()} ${transcript}` : transcript));
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    speechRecognitionRef.current = recognition;

    return () => {
      recognition.stop();
      speechRecognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 640px)");
    const handleViewportChange = () => setIsMobileViewport(mediaQuery.matches);

    handleViewportChange();
    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    const scrollNode = scrollContainerRef.current;
    if (!scrollNode) {
      return undefined;
    }

    const handleScroll = () => {
      setIsComposerCompact(scrollNode.scrollTop > 72 || Boolean(searchQuery.trim()) || Boolean(activePrompt.trim()) || isMatching);
    };

    handleScroll();
    scrollNode.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollNode.removeEventListener("scroll", handleScroll);
  }, [activePrompt, activeSurface, isMatching, searchQuery]);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!searchQuery.trim()) {
      return undefined;
    }

    searchTimerRef.current = setTimeout(() => {
      pushGrowthEvent("gigxomi_search_query", {
        query: searchQuery.trim(),
        surface: activeSurface,
        category: selectedPreset,
      });
    }, 450);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [activeSurface, searchQuery, selectedPreset]);

  useEffect(() => {
    return () => {
      if (matchTimerRef.current) {
        clearTimeout(matchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeSurface !== "matcher" || !activePrompt.trim() || isMatching) {
      return;
    }

    const scrollToResults = () => {
      matcherResultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    const rafId = window.requestAnimationFrame(scrollToResults);
    return () => window.cancelAnimationFrame(rafId);
  }, [activePrompt, activeSurface, isMatching]);

  const submitPrompt = (nextPrompt: string, targetSurface: MarketplaceSurface = activeSurface === "services" ? "services" : "matcher") => {
    const normalizedPrompt = nextPrompt.trim();
    if (!normalizedPrompt) {
      return;
    }

    if (matchTimerRef.current) {
      clearTimeout(matchTimerRef.current);
    }

    stopListening();
    setIsMatching(true);
    setActiveSurface(targetSurface);
    setActivePlayerServiceId(null);
    pushGrowthEvent("gigxomi_prompt_submitted", {
      prompt: normalizedPrompt,
      promptLength: normalizedPrompt.length,
      category: selectedPreset,
      searchQuery: searchQuery.trim() || null,
    });

    matchTimerRef.current = setTimeout(() => {
      setActivePrompt(normalizedPrompt);
      setIsMatching(false);
    }, 900);
  };

  const toggleListening = () => {
    if (!speechRecognitionRef.current) {
      focusComposer();
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    setIsListening(true);
    try {
      speechRecognitionRef.current.start();
    } catch {
      setIsListening(false);
      focusComposer();
    }
  };

  const budgetFilterControls = hasSearchContext ? (
    <div className="result-budget-filter">
      <p className="message-role">Budget filter</p>
      <div className="result-budget-filter-pills">
        {budgetFilterOptions.map((option) => (
          <button
            className={budgetFilter === option.id ? "result-budget-filter-pill active" : "result-budget-filter-pill"}
            key={option.id}
            onClick={() => setBudgetFilter(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const composerPanel = (idle = false) => {
    const isDiscoverComposer = !idle && activeSurface === "services";
    const usesCompactInput = shouldUseCompactComposer || isDiscoverComposer;

    return (
    <div
      className={[
        "composer-shell",
        idle ? "composer-shell-idle" : "",
        isDiscoverComposer ? "composer-shell-discover" : "",
        !idle && isMobileViewport && hasSearchContext ? "composer-shell-mobile-sticky" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "composer-surface",
          usesCompactInput ? "compact" : "",
          isDiscoverComposer ? "composer-surface-discover" : "",
          hasSearchContext ? "has-search-context" : "is-initial-state",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="composer-categories">
          {PUBLIC_DISCOVERY_NAV.map((item) => (
            <button className={item.id === selectedPreset ? "composer-chip active" : "composer-chip"} key={item.id} onClick={() => setSelectedPreset(item.id)} type="button">
              {item.label}
            </button>
          ))}
        </div>

        <form
          className="composer-main"
          onSubmit={(event) => {
            event.preventDefault();
            submitPrompt(promptValue, isDiscoverComposer ? "services" : "matcher");
          }}
        >
          <div className="composer-hero">
            <div className="composer-hero-copy">
              <p className="composer-kicker">{isDiscoverComposer ? "Search the live marketplace" : "Gigxomi AI matcher"}</p>
              <h3>{activeSurface === "matcher" ? "Find freelancer video editor in a second" : "Tell us what you need. See proof before you contact."}</h3>
              <p>{isDiscoverComposer ? "Search by edit style, platform, quality, turnaround, or a complete project brief." : "Describe the style, quality, budget, or turnaround and we’ll show the best live matches fast."}</p>
            </div>
            <div className="composer-hero-meta">
              <span>{catalogStats.totalServices} live services</span>
              <span>{selectedPresetLabel}</span>
            </div>
          </div>

          <div className="composer-input-card">
            <div className="composer-input-header">
              <div className="composer-input-badge">
                <Search size={14} strokeWidth={2} />
                <span>Search brief</span>
              </div>
              <p>Write your requirement here so Gigxomi can find the right freelancer for you.</p>
            </div>
            <div className="composer-input-shell">
              {usesCompactInput ? (
                <input
                  className="composer-input-line"
                  onChange={(event) => setPromptValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.nativeEvent.isComposing) {
                      event.preventDefault();
                    }
                  }}
                  placeholder={composerPlaceholder}
                  ref={(node) => {
                    composerTextareaRef.current = node;
                  }}
                  type="text"
                  value={promptValue}
                />
              ) : (
                <textarea
                  className="composer-textarea"
                  onChange={(event) => setPromptValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
                      return;
                    }

                    event.preventDefault();
                    submitPrompt(promptValue, isDiscoverComposer ? "services" : "matcher");
                  }}
                  placeholder={composerPlaceholder}
                  ref={(node) => {
                    composerTextareaRef.current = node;
                  }}
                  rows={isMobileViewport ? 1 : 3}
                  value={promptValue}
                />
              )}
            </div>
            <div className="composer-footer">
              <div className="composer-controls">
                <button
                  aria-label={isListening ? "Stop voice input" : "Use voice input"}
                  className={isListening ? "composer-icon-button active" : "composer-icon-button"}
                  onClick={toggleListening}
                  type="button"
                >
                  <Mic size={16} strokeWidth={1.8} />
                </button>
                <button aria-label="Match freelancers" className="composer-submit" disabled={!promptValue.trim() || isMatching} type="submit">
                  <ArrowRight size={16} strokeWidth={1.9} />
                </button>
              </div>
            </div>
          </div>
          {isDiscoverComposer ? (
            <div className="composer-discover-suggestions" aria-label="Example search briefs">
              <span>Try a brief</span>
              {["10 premium reels for a founder", "Wedding film with cinematic colour", "YouTube edits with 48-hour delivery"].map((suggestion) => (
                <button key={suggestion} onClick={() => setPromptValue(suggestion)} type="button">{suggestion}</button>
              ))}
            </div>
          ) : null}
        </form>
      </div>
    </div>
    );
  };

  const matcherHomepage = (
    <section className="matcher-homepage flex flex-col gap-8 md:gap-10">
      <HeroMatcher
        chips={matcherHeroChips.map((chip) => ({
          id: chip.id,
          label: chip.label,
          onClick: () => applyMatcherShortcut(chip.preset, chip.prompt, true),
        }))}
        isListening={isListening}
        isMatching={isMatching}
        onPromptChange={setPromptValue}
        onSubmit={() => submitPrompt(promptValue, "matcher")}
        onToggleListening={toggleListening}
        placeholder="Describe your project, budget, style, or deadline..."
        promptValue={promptValue}
        trustItems={matcherTrustItems}
      />

      <section className="matcher-homepage-section matcher-audience-paths" aria-label="Choose how to join Gigxomi">
        <article className="matcher-audience-card matcher-audience-card-freelancer">
          <div className="matcher-audience-visual-strip" aria-hidden="true">
            <span className="matcher-audience-thumb matcher-audience-thumb-feature">
              <Image alt="" fill sizes="(max-width: 767px) 45vw, 18vw" src="/images/homepage/gigxomi-editor-hero.png" />
            </span>
            {homepagePreviewServices.slice(0, 2).map((service) => {
              const previewImage = getServicePreviewImage(service);

              return (
                <span
                  className="matcher-audience-thumb"
                  key={`freelancer-${service.id}`}
                  style={previewImage ? { backgroundImage: `url(${previewImage})` } : undefined}
                />
              );
            })}
          </div>
          <div className="matcher-audience-copy">
            <div className="matcher-audience-kicker">
              <Users size={14} strokeWidth={1.8} />
              <span>For freelance video editors</span>
            </div>
            <h2>Show your services where buyers are already searching.</h2>
            <p>Create a freelancer profile, list your editing services, and receive project leads from Gigxomi discovery.</p>
          </div>
          <button className="matcher-audience-action" onClick={() => openAuthModal("signup", defaultFreelancerPackageId)} type="button">
            Register as freelancer
            <ArrowRight size={15} strokeWidth={1.9} />
          </button>
        </article>

        <article className="matcher-audience-card matcher-audience-card-agency">
          <div className="matcher-audience-visual-strip" aria-hidden="true">
            <span className="matcher-audience-thumb matcher-audience-thumb-feature">
              <Image alt="" fill sizes="(max-width: 767px) 45vw, 18vw" src="/images/homepage/gigxomi-agency-network.png" />
            </span>
            {homepagePreviewServices.slice(2, 4).map((service) => {
              const previewImage = getServicePreviewImage(service);

              return (
                <span
                  className="matcher-audience-thumb"
                  key={`agency-${service.id}`}
                  style={previewImage ? { backgroundImage: `url(${previewImage})` } : undefined}
                />
              );
            })}
          </div>
          <div className="matcher-audience-copy">
            <div className="matcher-audience-kicker">
              <BriefcaseBusiness size={14} strokeWidth={1.8} />
              <span>For agencies and teams</span>
            </div>
            <h2>Build a managed video-editing supply engine.</h2>
            <p>Use the agency growth flow to add editors, manage services, and scale fulfillment under one brand.</p>
          </div>
          <Link className="matcher-audience-action" href="/pricing">
            View pricing plans
            <ArrowUpRight size={15} strokeWidth={1.9} />
          </Link>
        </article>
      </section>

      <section className="matcher-homepage-section matcher-homepage-services space-y-4" ref={matcherResultsRef}>
        <div className="matcher-homepage-section-head flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="matcher-homepage-section-title text-[1.4rem] font-semibold tracking-[-0.03em] text-white">Available Video Editing Services</h2>
            <p className="matcher-homepage-section-copy text-sm text-white/58">Browse live services from approved editors.</p>
          </div>
          <Link className="matcher-homepage-link text-sm font-medium text-white/72 transition hover:text-white" href="/discover?surface=services">
            View all services
          </Link>
        </div>

        {isMatching ? (
          <div className="homepage-service-rail homepage-service-rail-loading">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="homepage-service-card-skeleton" key={`matcher-skeleton-${index}`} />
            ))}
          </div>
        ) : matcherHomepageServices.length ? (
          <div className="homepage-service-rail">
            {matcherHomepageServices.map((service) => (
              <HomepageServiceCard
                isPlayerActive={activePlayerServiceId === service.id}
                key={service.id}
                onClosePlayer={() => setActivePlayerServiceId((currentId) => (currentId === service.id ? null : currentId))}
                onPlayPlayer={() => setActivePlayerServiceId(service.id)}
                service={service}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-white/64">
            No matching services yet. Try a clearer project brief, budget, or deadline.
          </div>
        )}
      </section>

      <section className="matcher-homepage-section matcher-homepage-popular space-y-4">
        <div className="homepage-popular-heading space-y-1">
          <h2 className="matcher-homepage-section-title text-[1.25rem] font-semibold tracking-[-0.03em] text-white">Popular Services</h2>
          <p className="matcher-homepage-section-copy text-sm text-white/58">Jump into common service types fast.</p>
        </div>
        <ServiceChips
          className="homepage-service-chip-rail"
          items={popularServiceChipItems.map((item) => ({
            id: item.id,
            label: item.label,
            onClick: () => applyMatcherShortcut(item.preset, item.prompt, true),
          }))}
          itemClassName="homepage-service-chip"
        />
      </section>

      <section className="matcher-homepage-section matcher-homepage-steps space-y-4">
        <div className="space-y-1">
          <h2 className="matcher-homepage-section-title text-[1.25rem] font-semibold tracking-[-0.03em] text-white">How It Works</h2>
          <p className="matcher-homepage-section-copy text-sm text-white/58">A simple AI-first flow inside your dashboard.</p>
        </div>
        <HowItWorks className="homepage-how-it-works" steps={howItWorksSteps} />
      </section>

      <HomepageBrandSections blogPosts={blogPosts.slice(0, 6)} />
    </section>
  );

  return (
    <>
      <PublicShell
        activePreset={selectedPreset}
        activeSurface={activeSurface}
        canvasClassName="chat-scroll"
        canvasRef={scrollContainerRef}
        onPresetSelect={browseCategory}
        onSurfaceSelect={(surface) => {
          setActiveSurface(surface);
          setActivePlayerServiceId(null);
        }}
        title={getPublicSurfaceTitle(activeSurface)}
        topbarActions={
          isAuthenticated
            ? [
                {
                  href: dashboardHref,
                  label: profileLabel,
                },
              ]
            : [
                {
                  label: "Login",
                  onClick: () => openAuthModal("login"),
                },
                {
                  label: "Register",
                  onClick: () => openAuthModal("signup", defaultFreelancerPackageId),
                },
              ]
        }
      >
        {activeSurface === "services" ? composerPanel(false) : null}

        <div className="chat-thread">
          {activeSurface === "matcher" ? matcherHomepage : null}

          {activeSurface === "services" ? (
            <section className="storefront-surface storefront-surface-discover">
              <div className={hasSearchContext ? "storefront-summary storefront-summary-mobile-compact" : "storefront-summary"}>
                <p className="message-role">Discovery</p>
                <h2>Explore real services with sample previews and WhatsApp-first contact.</h2>
                <p className="mobile-result-copy">
                  Showing {surfacedServices.length} services from {catalogStats.totalServices} approved listings. Browse by category or use the matcher below for a narrower shortlist.
                </p>
              </div>

              <p className="storefront-meta-line mobile-search-meta">
                Showing {surfacedServices.length} services
                {selectedPresetLabel ? ` | Category ${selectedPresetLabel}` : ""}
                {budgetFilter !== "all" ? ` | Budget ${selectedBudgetLabel}` : ""}
                {activePrompt.trim() ? " | Matched to your brief" : ""}
                {" | Lowest budget first"}
              </p>

              {budgetFilterControls}

              {isMatching && activePrompt.trim() ? (
                <div className="assistant-summary discover-result-note discover-result-loading mobile-search-summary">
                  <p className="message-role">Matching now</p>
                  <h3>Checking the strongest services for your brief</h3>
                  <p className="mobile-result-copy">Gigxomi AI is comparing title fit, delivery speed, and pricing for the best shortlist.</p>
                  <div className="thinking-pulse" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : activePrompt.trim() ? (
                <div className="assistant-summary discover-result-note mobile-search-summary">
                  <p className="message-role">Match result</p>
                  <h3>{promptMatches.length ? "These services matched your request best" : "No exact prompt match yet"}</h3>
                  <p className="mobile-result-copy">
                    {promptMatches.length
                      ? "We ranked these services using title, specialty, pricing, delivery speed, and sample fit."
                      : "No live service matched that prompt yet. Try a clearer brief or browse by category instead."}
                  </p>
                </div>
              ) : null}

              {isMatching ? (
                <div className="chat-card-row storefront-card-row storefront-card-row-loading" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div className="discover-service-card-skeleton" key={`discover-skeleton-${index}`} />
                  ))}
                </div>
              ) : surfacedServices.length ? (
                <div className="chat-card-row storefront-card-row">
                  {surfacedServices.map((service) => (
                    <DiscoveryServiceCard
                      isPlayerActive={activePlayerServiceId === service.id}
                      key={service.id}
                      onClosePlayer={() => setActivePlayerServiceId((currentId) => (currentId === service.id ? null : currentId))}
                      onPlayPlayer={() => setActivePlayerServiceId(service.id)}
                      service={service}
                    />
                  ))}
                </div>
              ) : (
                <div className="brief-card marketplace-empty-state">
                  <span className="meta-pill">No matches</span>
                  <strong>No service matched this search yet.</strong>
                  <p className="muted-copy">Try a broader query, switch category, or describe the brief in the matcher.</p>
                </div>
              )}
            </section>
          ) : null}

          {activeSurface === "agencies" ? <AgencyDirectoryFeed agencies={agencies} /> : null}
          {activeSurface === "why-agencies" ? <AgencyReasonsFeed /> : null}
        </div>
      </PublicShell>

      <MobileUnifiedSearch
        blogPosts={blogPosts}
        isListening={isListening}
        isMatching={isMatching}
        onPromptChange={setPromptValue}
        onSubmit={() => submitPrompt(promptValue, "matcher")}
        onToggleListening={toggleListening}
        promptValue={promptValue}
        services={services}
      />

      {isAuthOpen ? (
        <div
          className="public-auth-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsAuthOpen(false);
            }
          }}
          role="presentation"
        >
          <div className="public-auth-modal-shell">
            <button aria-label="Close authentication panel" className="public-auth-modal-close" onClick={() => setIsAuthOpen(false)} type="button">
              <X size={18} strokeWidth={1.8} />
            </button>
            <PublicAuthPanel
              defaultMode={authMode}
              onModeChange={setAuthMode}
              packageId={selectedAuthPackageId}
              packages={packages}
              redirectTo="/"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function getAgencyLocationLabel(agency: AgencyListingProfile) {
  return [agency.office.city, agency.office.state].filter(Boolean).join(", ");
}

function normalizeLocationToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

const agencyLocationCoordinates: Record<string, { lat: number; lon: number }> = {
  "ahmedabad gujarat": { lat: 23.0225, lon: 72.5714 },
  "bengaluru karnataka": { lat: 12.9716, lon: 77.5946 },
  "bangalore karnataka": { lat: 12.9716, lon: 77.5946 },
  "bhopal madhya pradesh": { lat: 23.2599, lon: 77.4126 },
  "chandigarh chandigarh": { lat: 30.7333, lon: 76.7794 },
  "chennai tamil nadu": { lat: 13.0827, lon: 80.2707 },
  "delhi delhi": { lat: 28.6139, lon: 77.209 },
  "gurugram haryana": { lat: 28.4595, lon: 77.0266 },
  "hyderabad telangana": { lat: 17.385, lon: 78.4867 },
  "indore madhya pradesh": { lat: 22.7196, lon: 75.8577 },
  "jaipur rajasthan": { lat: 26.9124, lon: 75.7873 },
  "kolkata west bengal": { lat: 22.5726, lon: 88.3639 },
  "lucknow uttar pradesh": { lat: 26.8467, lon: 80.9462 },
  "mumbai maharashtra": { lat: 19.076, lon: 72.8777 },
  "noida uttar pradesh": { lat: 28.5355, lon: 77.391 },
  "pune maharashtra": { lat: 18.5204, lon: 73.8567 },
  "surat gujarat": { lat: 21.1702, lon: 72.8311 },
  "london england": { lat: 51.5072, lon: -0.1276 },
  "new york new york": { lat: 40.7128, lon: -74.006 },
  "singapore singapore": { lat: 1.3521, lon: 103.8198 },
  "dubai dubai": { lat: 25.2048, lon: 55.2708 },
};

function getAgencyCoordinates(agency: AgencyListingProfile, index: number) {
  const locationKey = normalizeLocationToken([agency.office.city, agency.office.state].filter(Boolean).join(" "));
  const countryKey = normalizeLocationToken([agency.office.city, agency.office.country].filter(Boolean).join(" "));
  const coordinates = agencyLocationCoordinates[locationKey] ?? agencyLocationCoordinates[countryKey];

  if (coordinates) {
    return coordinates;
  }

  const seed = Array.from(`${agency.office.city}${agency.office.state}${agency.office.country}${agency.id}`).reduce((total, char) => total + char.charCodeAt(0), 0);
  const isIndia = normalizeLocationToken(agency.office.country).includes("india");

  if (isIndia) {
    return {
      lat: 8 + ((seed + index * 7) % 2500) / 100,
      lon: 68 + ((seed + index * 11) % 2900) / 100,
    };
  }

  return {
    lat: -50 + ((seed + index * 7) % 12000) / 100,
    lon: -150 + ((seed + index * 11) % 30000) / 100,
  };
}

function projectAgencyCoordinates(coordinates: { lat: number; lon: number }) {
  // Keep these bounds in sync with the India boundary drawn in AgencyCoverageMap.
  const x = 90 + ((coordinates.lon - 68) / 30) * 560;
  const y = 620 - ((coordinates.lat - 6) / 32) * 560;
  return {
    x: Math.max(92, Math.min(648, x)),
    y: Math.max(58, Math.min(618, y)),
  };
}

function buildAgencyMapPins(agencies: AgencyListingProfile[]) {
  const grouped = new Map<string, AgencyMapPin>();

  agencies.forEach((agency, index) => {
    const label = getAgencyLocationLabel(agency) || agency.office.country || "Remote";
    const key = normalizeLocationToken(label) || `remote-${agency.id}`;
    const coordinates = getAgencyCoordinates(agency, index);
    const projected = projectAgencyCoordinates(coordinates);
    const existing = grouped.get(key);

    if (existing) {
      existing.agencies.push(agency);
      existing.count += 1;
      existing.x = (existing.x * (existing.count - 1) + projected.x) / existing.count;
      existing.y = (existing.y * (existing.count - 1) + projected.y) / existing.count;
      return;
    }

    grouped.set(key, {
      agencies: [agency],
      count: 1,
      key,
      label,
      x: projected.x,
      y: projected.y,
    });
  });

  return Array.from(grouped.values()).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function agencyMatchesLocationSearch(agency: AgencyListingProfile, query: string) {
  const normalizedQuery = normalizeLocationToken(query);
  if (!normalizedQuery) return true;

  const searchableText = normalizeLocationToken(
    [
      agency.publicName,
      agency.ownerName,
      agency.tagline,
      agency.description,
      agency.niche,
      agency.hiringStatus,
      agency.office.city,
      agency.office.state,
      agency.office.country,
      ...agency.categories,
      ...agency.specialties,
      ...agency.serviceOffers.map((offer) => `${offer.title} ${offer.summary}`),
    ].join(" "),
  );

  return searchableText.includes(normalizedQuery);
}

function AgencyCoverageMap({
  activeLocation,
  agencies,
  onSelectLocation,
}: {
  activeLocation: string;
  agencies: AgencyListingProfile[];
  onSelectLocation: (location: string) => void;
}) {
  const pins = useMemo(() => buildAgencyMapPins(agencies), [agencies]);
  const primaryPin = pins[0] ?? null;

  return (
    <div className="agency-location-map-shell">
      <div className="agency-location-map-copy">
        <p className="agency-directory-filter-label">India creative network</p>
        <h3>{pins.length ? `Creative partners across ${pins.length} active location${pins.length > 1 ? "s" : ""}.` : "A trusted network, built city by city."}</h3>
        <p>{primaryPin ? `Start with ${primaryPin.label}, or select any live city to filter verified agency partners.` : "Published agencies appear as live pins once their location and profile are verified."}</p>
        <div className="agency-map-trust-row"><span>Verified profiles</span><span>Visible karma</span><span>Real work proof</span></div>
      </div>

      <div className="agency-location-map-canvas" aria-label="Agency location coverage map" role="img">
        <div className="agency-map-canvas-heading"><span>LIVE NETWORK</span><strong>INDIA / CREATIVE DELIVERY</strong></div>
        <svg className="agency-location-map-svg" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="agency-map-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(215,255,47,0.28)" />
              <stop offset="60%" stopColor="rgba(215,255,47,0.08)" />
              <stop offset="100%" stopColor="rgba(215,255,47,0)" />
            </radialGradient>
          </defs>
          <rect className="agency-map-canvas-bg" x="0" y="0" width="1000" height="640" rx="34" />
          <path className="agency-map-grid-line" d="M0 160H1000M0 320H1000M0 480H1000M200 0V640M400 0V640M600 0V640M800 0V640" />
          <ellipse className="agency-map-country-halo" cx="362" cy="334" rx="310" ry="294" />
          <path
            className="agency-map-india-outline"
            d="M215.3 76.4L202.9 80.8L195.9 79.0L199.6 82.7L184.6 82.7L182.9 87.0L175.5 90.6L174.2 96.1L184.9 97.1L190.8 102.8L197.9 103.3L196.6 108.6L204.5 110.6L202.6 114.7L191.4 120.9L195.2 146.0L208.6 151.6L215.2 150.3L214.8 156.5L222.6 156.6L227.6 161.1L213.3 166.9L211.1 170.0L214.2 175.0L211.5 180.2L215.0 181.2L200.8 191.4L201.5 196.5L190.7 200.9L182.3 217.0L172.0 221.5L162.8 235.7L143.6 240.2L138.3 234.8L134.3 234.8L119.6 249.3L118.2 257.0L130.6 260.4L129.2 271.1L132.4 275.0L139.7 275.2L139.7 280.6L147.8 293.0L146.0 297.2L148.2 298.0L140.7 301.2L137.8 297.6L127.8 302.0L105.1 299.5L104.1 305.5L96.8 305.3L93.5 309.7L96.1 312.5L104.6 307.2L97.4 314.9L112.3 325.4L121.8 327.2L135.5 323.1L130.4 330.2L126.3 329.2L123.7 333.0L118.1 332.1L112.9 335.5L109.9 331.6L107.5 334.7L129.1 355.6L142.7 362.9L166.9 354.0L171.1 334.9L180.9 335.8L175.6 336.4L174.0 340.6L178.6 340.5L174.2 345.2L179.6 346.1L175.4 347.8L175.7 352.9L181.4 364.7L176.8 377.5L181.6 387.4L179.2 387.6L179.6 394.5L183.8 392.6L180.6 397.8L184.5 405.3L182.1 406.2L191.9 444.3L208.7 471.0L224.4 514.9L234.4 526.3L249.5 569.2L257.7 578.4L268.3 583.6L277.9 578.5L280.2 568.8L284.3 565.6L298.8 562.6L303.7 564.9L301.2 561.8L295.2 561.3L294.0 557.1L300.9 545.4L311.8 544.8L309.6 521.5L320.6 492.3L314.9 461.2L319.5 450.3L327.0 447.1L331.7 449.8L338.2 439.8L356.9 435.0L358.0 425.8L391.0 404.6L406.7 387.1L417.9 380.3L433.4 375.7L446.4 362.0L443.6 361.6L442.7 352.0L460.5 344.7L463.1 338.4L466.9 338.1L462.6 335.2L467.2 337.1L468.4 347.8L468.9 344.0L471.5 346.7L475.9 336.4L476.0 341.0L480.0 336.9L483.8 337.5L479.1 322.3L481.9 318.7L476.8 318.0L478.3 313.8L473.8 311.1L477.7 305.3L477.1 300.2L463.5 293.3L465.9 288.6L470.8 288.5L471.6 284.0L482.1 282.9L478.5 278.3L473.4 278.6L465.5 273.5L466.6 267.4L473.1 263.7L469.5 261.6L470.8 259.0L477.3 263.9L475.8 265.4L482.9 265.8L480.2 262.9L483.6 263.0L488.6 269.9L492.8 270.5L494.7 265.8L498.6 271.0L497.5 282.3L508.9 285.0L539.4 284.3L545.9 287.0L547.1 289.8L542.3 289.2L541.1 297.7L536.5 299.1L536.2 302.6L533.2 300.7L530.3 303.7L526.3 303.1L522.3 311.8L525.8 320.7L527.8 317.9L530.9 323.6L534.9 320.9L533.6 317.2L537.4 314.1L537.2 309.7L543.2 310.0L549.3 340.4L551.1 337.3L554.9 341.0L560.4 335.4L559.0 321.7L563.9 320.2L562.8 303.6L578.2 307.6L588.6 288.7L587.2 280.6L597.5 268.7L596.8 259.2L616.9 247.6L625.8 246.0L633.9 250.9L629.4 241.8L638.3 237.1L638.9 231.8L624.6 227.0L617.4 227.9L624.0 221.4L622.3 216.2L615.7 219.3L614.6 216.1L619.7 212.8L614.2 209.4L604.9 212.9L601.7 217.0L590.3 214.7L587.1 211.5L579.5 216.0L574.1 223.3L562.9 223.8L560.7 229.3L550.8 232.8L551.9 235.1L548.4 238.1L536.7 239.9L529.7 237.5L531.5 244.0L538.3 244.1L540.3 247.5L539.1 255.2L514.1 256.6L507.3 254.2L498.1 257.7L484.5 255.9L477.3 250.0L480.5 246.9L477.6 242.6L478.9 234.7L474.7 232.7L466.0 235.6L463.1 250.4L466.8 256.9L463.5 263.7L461.2 261.5L451.0 263.9L446.0 259.7L439.7 262.6L432.2 259.2L423.2 260.0L419.0 254.7L411.3 256.7L400.7 251.7L400.3 246.6L391.4 243.4L386.1 246.4L377.2 244.1L375.9 246.7L365.1 243.7L364.5 239.8L349.2 237.5L338.6 232.7L336.6 228.7L315.4 220.6L320.8 204.4L333.3 195.7L318.8 190.2L318.5 186.7L311.4 182.9L303.3 182.0L297.7 174.9L293.4 177.9L290.3 173.5L292.6 171.9L289.9 168.7L291.4 165.1L285.3 160.8L285.1 154.9L290.7 152.9L294.8 159.1L306.7 152.3L301.4 147.3L303.7 143.0L294.9 141.6L293.5 136.6L297.2 136.7L293.8 130.6L303.5 129.8L306.4 125.9L305.1 121.9L310.1 121.8L309.8 119.3L315.2 117.9L319.8 102.2L314.3 98.0L302.0 95.1L298.4 97.8L284.9 98.8L279.2 103.1L275.9 101.9L276.4 104.7L265.2 104.2L267.0 103.2L264.8 100.0L254.4 97.6L251.6 91.6L235.7 85.1L227.0 76.4L219.1 78.9L215.3 76.4Z"
          />
          <g className="agency-map-islands" aria-label="Lakshadweep and Andaman and Nicobar Islands">
            <circle cx="177" cy="510" r="2.6" />
            <circle cx="180" cy="526" r="2.2" />
            <circle cx="183" cy="543" r="2.6" />
            <circle cx="187" cy="562" r="2" />
            <ellipse cx="558" cy="487" rx="3" ry="6" />
            <ellipse cx="561" cy="505" rx="3" ry="7" />
            <ellipse cx="565" cy="525" rx="2.8" ry="7" />
            <ellipse cx="569" cy="547" rx="2.5" ry="6" />
            <ellipse cx="573" cy="568" rx="2.3" ry="6" />
            <ellipse cx="577" cy="591" rx="2" ry="5" />
          </g>
          <text className="agency-map-country-label" x="310" y="362">INDIA</text>

          {pins.slice(1).map((pin) => primaryPin ? <line className="agency-map-route" key={`route-${pin.key}`} x1={primaryPin.x} y1={primaryPin.y} x2={pin.x} y2={pin.y} /> : null)}

          {pins.map((pin, index) => {
            const isActive = activeLocation !== "all" && normalizeLocationToken(activeLocation) === pin.key;
            const city = pin.label.split(",")[0];
            const labelY = index % 2 === 0 ? -17 : 25;
            const placeLabelOnLeft = pin.x < 210;
            return (
              <g className={isActive ? "agency-map-pin active" : "agency-map-pin"} key={pin.key} transform={`translate(${pin.x} ${pin.y})`}>
                <title>{`${pin.label}: ${pin.count} ${pin.count === 1 ? "agency" : "agencies"}`}</title>
                <circle className="agency-map-pin-glow" r={pin.count > 1 ? 24 : 18} />
                <circle className="agency-map-pin-dot" r={pin.count > 1 ? 8 : 6} />
                <text
                  className="agency-map-pin-city"
                  textAnchor={placeLabelOnLeft ? "end" : "start"}
                  x={placeLabelOnLeft ? -14 : 14}
                  y={labelY}
                >
                  {`${pin.count} ${city}`}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="agency-location-map-pins" aria-label="Live agency locations">
          <p><span /> Live locations</p>
          {pins.slice(0, 8).map((pin) => (
            <button
              className={activeLocation !== "all" && normalizeLocationToken(activeLocation) === pin.key ? "agency-location-map-pin active" : "agency-location-map-pin"}
              key={pin.key}
              onClick={() => onSelectLocation(pin.label)}
              type="button"
            >
              <span>{pin.count}</span>
              <strong>{pin.label}</strong>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgencyDirectoryFeed({ agencies }: { agencies: AgencyListingProfile[] }) {
  const [hiringFilter, setHiringFilter] = useState<AgencyHiringFilter>("all");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState<AgencyOfficeFilter>("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState<AgencySortOption>("karma");
  const [locationQuery, setLocationQuery] = useState("");

  const locations = useMemo(
    () => ["all", ...Array.from(new Set(agencies.map((agency) => getAgencyLocationLabel(agency)).filter(Boolean))).slice(0, 8)],
    [agencies],
  );
  const niches = useMemo(
    () => ["all", ...Array.from(new Set(agencies.map((agency) => agency.niche.trim()).filter(Boolean))).slice(0, 8)],
    [agencies],
  );

  const searchScopedAgencies = useMemo(() => agencies.filter((agency) => agencyMatchesLocationSearch(agency, locationQuery)), [agencies, locationQuery]);

  const filteredAgencies = useMemo(() => {
    const nextAgencies = searchScopedAgencies.filter((agency) => {
      if (hiringFilter !== "all" && agency.hiringStatus !== hiringFilter) {
        return false;
      }

      if (nicheFilter !== "all" && agency.niche !== nicheFilter) {
        return false;
      }

      if (officeFilter === "office" && !agency.office.hasOffice) {
        return false;
      }

      if (officeFilter === "remote" && agency.office.hasOffice) {
        return false;
      }

      if (locationFilter !== "all" && getAgencyLocationLabel(agency) !== locationFilter) {
        return false;
      }

      return true;
    });

    nextAgencies.sort((left, right) => {
      if (sortBy === "reviews") {
        if (right.stats.averageRating !== left.stats.averageRating) {
          return right.stats.averageRating - left.stats.averageRating;
        }

        return right.stats.reviewCount - left.stats.reviewCount;
      }

      if (sortBy === "orders") {
        if (right.stats.completedOrders !== left.stats.completedOrders) {
          return right.stats.completedOrders - left.stats.completedOrders;
        }

        return right.reputation.score - left.reputation.score;
      }

      if (right.reputation.score !== left.reputation.score) {
        return right.reputation.score - left.reputation.score;
      }

      return right.stats.completedOrders - left.stats.completedOrders;
    });

    return nextAgencies;
  }, [hiringFilter, locationFilter, nicheFilter, officeFilter, searchScopedAgencies, sortBy]);

  const mappedAgencies = useMemo(
    () =>
      searchScopedAgencies.filter((agency) => {
        if (hiringFilter !== "all" && agency.hiringStatus !== hiringFilter) return false;
        if (nicheFilter !== "all" && agency.niche !== nicheFilter) return false;
        if (officeFilter === "office" && !agency.office.hasOffice) return false;
        if (officeFilter === "remote" && agency.office.hasOffice) return false;
        return true;
      }),
    [hiringFilter, nicheFilter, officeFilter, searchScopedAgencies],
  );

  return (
    <section className="storefront-surface storefront-surface-agencies">
      <div className="agency-location-search-panel">
        <label className="agency-location-search" htmlFor="agency-location-search">
          <Search size={18} strokeWidth={1.8} />
          <input
            id="agency-location-search"
            onChange={(event) => {
              setLocationQuery(event.target.value);
              if (event.target.value.trim()) {
                setLocationFilter("all");
              }
            }}
            placeholder="Search agencies by city, state, country, niche, specialty, or service"
            type="search"
            value={locationQuery}
          />
          {locationQuery ? (
            <button aria-label="Clear agency location search" onClick={() => setLocationQuery("")} type="button">
              <X size={16} strokeWidth={1.9} />
            </button>
          ) : null}
        </label>
        <p>
          {filteredAgencies.length} of {agencies.length} agenc{agencies.length === 1 ? "y" : "ies"} match the current search.
        </p>
      </div>

      <div className="storefront-summary">
        <p className="message-role">Verified Agency Network</p>
        <h2>Find a creative delivery partner with visible proof, location, hiring posture, and reputation.</h2>
        <p>
          Only active and completed agency listings appear here. Every profile carries location, hiring posture, proof of completed work, client reviews, and
          Gigxomi karma so customers and editors can judge reliability before they engage.
        </p>

        <div className="brief-grid three-up agency-directory-summary-grid">
          <div className="brief-card">
            <span className="meta-pill">
              <Users size={13} strokeWidth={1.8} />
              Agencies live
            </span>
            <strong>{agencies.length}</strong>
            <p className="muted-copy">Published agency pages currently visible inside the network directory.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">
              <BadgeCheck size={13} strokeWidth={1.8} />
              Verified offices
            </span>
            <strong>{agencies.filter((agency) => agency.office.hasOffice && agency.office.officeVerified).length}</strong>
            <p className="muted-copy">Physical office visibility is optional, but verified locations earn extra trust cues.</p>
          </div>
          <div className="brief-card">
            <span className="meta-pill">
              <ShieldCheck size={13} strokeWidth={1.8} />
              Avg karma
            </span>
            <strong>{Math.round(agencies.reduce((total, agency) => total + agency.reputation.score, 0) / Math.max(agencies.length, 1))}/100</strong>
            <p className="muted-copy">Karma blends response speed, completion rate, reviews, repeat clients, and dispute pressure.</p>
          </div>
        </div>
      </div>

      <AgencyCoverageMap activeLocation={locationFilter} agencies={mappedAgencies} onSelectLocation={setLocationFilter} />

      <div className="agency-directory-toolbar">
        <div className="agency-directory-filter-group">
          <p className="agency-directory-filter-label">Niche</p>
          <div className="agency-directory-filter-pills">
            {niches.map((niche) => (
              <button className={nicheFilter === niche ? "agency-directory-filter-pill active" : "agency-directory-filter-pill"} key={niche} onClick={() => setNicheFilter(niche)} type="button">
                {niche === "all" ? "All niches" : niche}
              </button>
            ))}
          </div>
        </div>

        <div className="agency-directory-filter-group">
          <p className="agency-directory-filter-label">Hiring</p>
          <div className="agency-directory-filter-pills">
            {(["all", "Actively hiring", "Selective hiring", "Invite only"] as AgencyHiringFilter[]).map((option) => (
              <button
                className={hiringFilter === option ? "agency-directory-filter-pill active" : "agency-directory-filter-pill"}
                key={option}
                onClick={() => setHiringFilter(option)}
                type="button"
              >
                {option === "all" ? "All agencies" : option}
              </button>
            ))}
          </div>
        </div>

        <div className="agency-directory-filter-group">
          <p className="agency-directory-filter-label">Office</p>
          <div className="agency-directory-filter-pills">
            {(
              [
                ["all", "All setups"],
                ["office", "Verified office"],
                ["remote", "Remote first"],
              ] as Array<[AgencyOfficeFilter, string]>
            ).map(([option, label]) => (
              <button
                className={officeFilter === option ? "agency-directory-filter-pill active" : "agency-directory-filter-pill"}
                key={option}
                onClick={() => setOfficeFilter(option)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="agency-directory-filter-group">
          <p className="agency-directory-filter-label">Location</p>
          <div className="agency-directory-filter-pills">
            {locations.map((location) => (
              <button
                className={locationFilter === location ? "agency-directory-filter-pill active" : "agency-directory-filter-pill"}
                key={location}
                onClick={() => setLocationFilter(location)}
                type="button"
              >
                {location === "all" ? "All cities" : location}
              </button>
            ))}
          </div>
        </div>

        <div className="agency-directory-filter-group">
          <p className="agency-directory-filter-label">Sort</p>
          <div className="agency-directory-filter-pills">
            {(
              [
                ["karma", "Karma first"],
                ["orders", "Most orders"],
                ["reviews", "Best reviews"],
              ] as Array<[AgencySortOption, string]>
            ).map(([option, label]) => (
              <button
                className={sortBy === option ? "agency-directory-filter-pill active" : "agency-directory-filter-pill"}
                key={option}
                onClick={() => setSortBy(option)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredAgencies.length ? (
        <div className="agency-directory-grid">
          {filteredAgencies.map((agency) => (
            <article className="agency-directory-card" key={agency.id}>
              <div className="agency-directory-cover">
                <div className="agency-directory-cover-copy">
                  <div className="agency-directory-head">
                    <span className="meta-pill">{agency.hiringStatus}</span>
                    {agency.office.hasOffice && agency.office.officeVerified ? (
                      <span className="meta-pill">
                        <BadgeCheck size={13} strokeWidth={1.8} />
                        Verified office
                      </span>
                    ) : null}
                  </div>

                  <div className="agency-directory-brand">
                    <div className="agency-directory-logo">{agency.publicName.slice(0, 2).toUpperCase()}</div>
                    <div className="agency-directory-brand-copy">
                      <h4>{agency.publicName}</h4>
                      <p className="agency-directory-subcopy">{agency.tagline || agency.niche}</p>
                    </div>
                  </div>

                  <div className="agency-directory-location">
                    <MapPin size={14} strokeWidth={1.8} />
                    <span>{getAgencyLocationLabel(agency) || agency.office.country}</span>
                  </div>
                </div>
              </div>

              <div className="agency-directory-stats">
                <div className="agency-directory-stat">
                  <span>
                    <ShieldCheck size={13} strokeWidth={1.8} />
                    Karma
                  </span>
                  <strong>
                    {agency.reputation.band} - {agency.reputation.score}/100
                  </strong>
                </div>
                <div className="agency-directory-stat">
                  <span>
                    <Star size={13} strokeWidth={1.8} />
                    Reviews
                  </span>
                  <strong>
                    {agency.stats.averageRating || 0}/5 - {agency.stats.reviewCount}
                  </strong>
                </div>
                <div className="agency-directory-stat">
                  <span>
                    <BriefcaseBusiness size={13} strokeWidth={1.8} />
                    Orders
                  </span>
                  <strong>{agency.stats.completedOrders}</strong>
                </div>
                <div className="agency-directory-stat">
                  <span>
                    <Users size={13} strokeWidth={1.8} />
                    Active editors
                  </span>
                  <strong>{agency.stats.activeEditors}</strong>
                </div>
              </div>

              <p>{agency.description}</p>

              <div className="service-signal-row agency-directory-specialties">
                {agency.specialties.slice(0, 4).map((specialty) => (
                  <span className="service-signal-chip" key={specialty}>
                    {specialty}
                  </span>
                ))}
              </div>

              <div className="agency-directory-services">
                {agency.serviceOffers.slice(0, 2).map((offer) => (
                  <div className="agency-directory-service" key={offer.id}>
                    <strong>{offer.title}</strong>
                    <span>{offer.priceLabel}</span>
                    <p>{offer.summary}</p>
                  </div>
                ))}
              </div>

              <div className="agency-directory-card-actions">
                <Link className="primary-button" href={`/agency/${agency.slug}`}>
                  View Agency
                  <ArrowUpRight size={14} strokeWidth={1.9} />
                </Link>
                <a
                  className="ghost-button"
                  href={buildAgencyInquiryHref({
                    agencyName: agency.publicName,
                    agencySlug: agency.slug,
                    whatsappNumber: agency.whatsappNumber,
                  })}
                  rel="noreferrer"
                  target="_blank"
                >
                  Chat with agency
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="brief-card agency-directory-empty">
          <span className="meta-pill">No agencies match</span>
          <strong>No agency fits the current filter set.</strong>
          <p className="muted-copy">Try broadening the hiring, office, or location chips to see more public agency pages.</p>
        </div>
      )}
    </section>
  );
}

function AgencyReasonsFeed() {
  const reasons = [
    ...publicAgencyReasons,
    { title: "Protect client relationships", note: "Editors receive the project context they need while agencies retain ownership of client communication, commercial terms, and final approval." },
    { title: "Review before client handoff", note: "Route delivery through founder or manager review so quality checks, revisions, and approval happen before files reach the client." },
    { title: "Keep accounts visible", note: "Collections, editor payouts, wallet activity, and delivery status stay connected to the work instead of scattered across chats and sheets." },
  ];

  return (
    <section className="storefront-surface storefront-surface-agencies">
      <div className="storefront-summary">
        <p className="message-role">Why agencies join</p>
        <h2>One operating layer for discovery, intake, fulfillment, and money.</h2>
        <p>Agencies use Gigxomi to discover editors faster, route client requests, protect relationships, review delivery, and keep team economics visible.</p>
      </div>

      <section className="agency-webinar-promo" aria-labelledby="agency-webinar-title">
        <div className="agency-webinar-promo-orbit" aria-hidden="true"><span>LEADS</span><span>TEAM</span><span>DELIVERY</span></div>
        <div className="agency-webinar-promo-copy">
          <p className="message-role"><CalendarClock size={14} /> Video Editing Agency System</p>
          <h3 id="agency-webinar-title">Build a high-margin video editing agency team—without losing creative control.</h3>
          <p>Use Gigxomi to manage freelance editors, automate client reviews, protect client relationships with two-lane masked messaging, and retain 100% of your earnings.</p>
          <div className="agency-webinar-promo-actions">
            <a className="primary-button" href="https://app.gigxomi.com/signup" rel="nofollow">Start Free with Google <ArrowRight size={15} /></a>
            <Link className="ghost-button" href="/blog/video-editing-agency-management-software-system">Agency Blueprint</Link>
          </div>
        </div>
      </section>

      <div className="brief-grid three-up agency-reasons-grid">
        {reasons.map((reason, index) => (
          <div className="brief-card" key={reason.title}>
            <span className="meta-pill">{String(index + 1).padStart(2, "0")} • Agency layer</span>
            <strong>{reason.title}</strong>
            <p className="muted-copy">{reason.note}</p>
          </div>
        ))}
      </div>

      <div className="agency-operating-flow" aria-label="Gigxomi agency operating flow">
        {["Lead captured", "Editor matched", "Work assigned", "Delivery reviewed", "Client approved", "Payout tracked"].map((item, index) => (
          <span key={item}><b>{index + 1}</b>{item}</span>
        ))}
      </div>
    </section>
  );
}
