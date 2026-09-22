"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Banknote, BriefcaseBusiness, FolderKanban, LayoutDashboard, MessageSquareText, PlusCircle, Sparkles, UserRound, WalletCards } from "lucide-react";
import { usePathname } from "next/navigation";

import { InternalAppShell } from "@/components/ui/internal-app-shell";
import {
  freelancerAppLabel,
  freelancerHeaderPills,
  freelancerNavItems,
  freelancerProfileMeta,
  freelancerProfileName,
  type FreelancerSection,
} from "@/lib/gigxomi/freelancer-data";

const navIcons: Record<FreelancerSection, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  "add-service": PlusCircle,
  "draft-services": Sparkles,
  "published-services": Sparkles,
  "apply-work": BriefcaseBusiness,
  chats: MessageSquareText,
  services: Sparkles,
  "portfolio-drafts": Sparkles,
  profile: UserRound,
  wallet: WalletCards,
  payouts: Banknote,
};

const sectionTitles: Record<FreelancerSection, string> = {
  dashboard: "Dashboard",
  projects: "Project Tracking",
  "add-service": "Add Service",
  "draft-services": "Draft Services",
  "published-services": "Published Services",
  "apply-work": "Apply for Work",
  chats: "Chats",
  services: "My Services",
  "portfolio-drafts": "Portfolio Drafts",
  profile: "Profile",
  wallet: "Wallet",
  payouts: "Payouts",
};

type FreelancerShellProps = {
  children: ReactNode;
};

type ShellIdentity = {
  displayName: string;
  meta: string;
};

let cachedTrustPills: string[] | null = null;
let trustPillsRequest: Promise<string[]> | null = null;

function getActiveFreelancerSection(pathname: string): FreelancerSection {
  if (
    pathname.startsWith("/freelancer/projects") ||
    pathname.startsWith("/freelancer/project-tracking")
  ) {
    return "projects";
  }

  if (
    pathname.startsWith("/freelancer/add-service") ||
    pathname.startsWith("/freelancer/draft-services") ||
    pathname.startsWith("/freelancer/published-services") ||
    pathname.startsWith("/freelancer/portfolio-drafts") ||
    pathname.startsWith("/freelancer/portfolio") ||
    pathname.startsWith("/freelancer/services")
  ) {
    return "services";
  }

  const matchedItem = freelancerNavItems.find((item) => item.href === pathname);
  return matchedItem?.id ?? "dashboard";
}

export function FreelancerShell({ children }: FreelancerShellProps) {
  const pathname = usePathname();
  const activeSection = getActiveFreelancerSection(pathname);
  const contentClassName = pathname === "/freelancer/chat" ? "internal-content-chat manager-chat-page-shell" : undefined;
  const [identity, setIdentity] = useState<ShellIdentity>({
    displayName: freelancerProfileName,
    meta: freelancerProfileMeta,
  });
  const [trustPills, setTrustPills] = useState<string[]>(cachedTrustPills ?? freelancerHeaderPills);

  useEffect(() => {
    let isActive = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!isActive || !payload?.authenticated || !payload?.session) {
          return;
        }

        const session = payload.session as {
          displayName?: string | null;
          packageName?: string | null;
          workspaceMode?: string | null;
        };

        setIdentity({
          displayName: session.displayName?.trim() || freelancerProfileName,
          meta: session.packageName?.trim() || (session.workspaceMode === "FREELANCER" ? "Freelancer workspace" : freelancerProfileMeta),
        });
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    if (cachedTrustPills) {
      setTrustPills(cachedTrustPills);
      return () => { isActive = false; };
    }
    trustPillsRequest ??= fetch("/api/freelancer/onboarding", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload?.ok) return freelancerHeaderPills;
        const score = Number(payload.onboarding?.trust?.score ?? 0);
        const verified = Boolean(payload.onboarding?.identity?.verified);
        return [`Trust ${score}/100`, ...(verified ? ["Identity verified"] : [])];
      })
      .catch(() => freelancerHeaderPills);
    void trustPillsRequest.then((pills) => {
      cachedTrustPills = pills;
      if (isActive) setTrustPills(pills);
    });
    return () => { isActive = false; };
  }, []);

  return (
    <InternalAppShell
      activeSection={activeSection}
      appLabel={freelancerAppLabel}
      contentClassName={contentClassName}
      headerPills={trustPills}
      homeHref="/"
      navItems={freelancerNavItems.map((item) => ({ ...item, icon: navIcons[item.id] }))}
      onNavigate={() => {}}
      profileMeta={identity.meta}
      profileName={identity.displayName}
      showNotifications
      title={sectionTitles[activeSection]}
    >
      {children}
    </InternalAppShell>
  );
}
