"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { InternalAppShell } from "@/components/ui/internal-app-shell";
import {
  adminAppLabel,
  adminHeaderPills,
  adminNavItems,
  adminProfileMeta,
  adminProfileName,
  type AdminSection,
} from "@/lib/gigxomi/internal-panels-data";
import type { DummyInstagramConnectionState, DummyWhatsAppConnectionState } from "@/lib/gigxomi/dummy-platform-store";

type AdminShellProps = {
  children: ReactNode;
  contentClassName?: string;
  impersonationAgencyName?: string | null;
  profileName?: string | null;
};

function getActiveAdminSection(pathname: string): AdminSection {
  if (pathname.startsWith("/admin/delivery-review")) {
    return "assignments";
  }

  if (pathname.startsWith("/admin/portfolio-review")) {
    return "agency-settings";
  }

  if (pathname.startsWith("/admin/integrations/whatsapp")) {
    return "whatsapp-api-setup";
  }

  if (pathname.startsWith("/admin/integrations/instagram")) {
    return "instagram-inbox-setup";
  }

  if (pathname.startsWith("/admin/settings/whatsapp")) {
    return "agency-settings";
  }

  if (pathname.startsWith("/admin/chatbot")) {
    return "chatbot-builder";
  }

  const aliases: Record<string, AdminSection> = {
    "/admin/chat": "chat-inbox",
    "/admin/staff": "assign-staff",
    "/admin/managers": "assign-staff",
    "/admin/roles": "assign-staff",
    "/admin/freelancers": "team-editors",
    "/admin/service-approvals": "team-editors",
    "/admin/packages": "subscription",
    "/admin/wallet-review": "payout-control",
    "/admin/payout-requests": "payout-control",
    "/admin/monetization": "payout-control",
    "/admin/integrations": "integrations",
    "/admin/chatbot": "chatbot-builder",
    "/admin/analytics": "agency-settings",
    "/admin/theme-branding": "agency-settings",
    "/admin/system-settings": "agency-settings",
  };

  if (aliases[pathname]) {
    return aliases[pathname];
  }

  const matchedItem = adminNavItems.find((item) => item.href === pathname);
  return matchedItem?.id ?? "overview";
}

export function AdminShell({ children, contentClassName, impersonationAgencyName = null, profileName = null }: AdminShellProps) {
  const pathname = usePathname();
  const [whatsAppConnection, setWhatsAppConnection] = useState<DummyWhatsAppConnectionState | null>(null);
  const [instagramConnection, setInstagramConnection] = useState<DummyInstagramConnectionState | null>(null);
  const activeSection = getActiveAdminSection(pathname);
  const navItems = adminNavItems.filter(
    (item) => {
      if (item.id === "whatsapp-api-setup") {
        return whatsAppConnection ? Boolean(whatsAppConnection.pluginEnabled) : true;
      }
      if (item.id === "instagram-inbox-setup") {
        return instagramConnection ? Boolean(instagramConnection.pluginEnabled) : true;
      }
      return true;
    },
  );
  const activeItem = navItems.find((item) => item.id === activeSection) ?? adminNavItems.find((item) => item.id === activeSection);
  const pageTitle = activeSection === "overview" ? "Agency Overview" : activeItem?.label ?? "Admin";
  const resolvedContentClassName = pathname === "/admin/chat" ? "internal-content-chat manager-chat-page-shell" : contentClassName;

  useEffect(() => {
    const refreshWhatsAppConnection = () => {
      fetch("/api/admin/whatsapp?ensureDraft=1", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload) => setWhatsAppConnection((payload.connection ?? null) as DummyWhatsAppConnectionState | null))
        .catch(() => setWhatsAppConnection(null));
    };
    const refreshInstagramConnection = () => {
      fetch("/api/admin/instagram?ensureDraft=1", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload) => setInstagramConnection((payload.connection ?? null) as DummyInstagramConnectionState | null))
        .catch(() => setInstagramConnection(null));
    };

    refreshWhatsAppConnection();
    refreshInstagramConnection();
    window.addEventListener("gigxomi:whatsapp-plugin-updated", refreshWhatsAppConnection);
    window.addEventListener("gigxomi:instagram-plugin-updated", refreshInstagramConnection);

    return () => {
      window.removeEventListener("gigxomi:whatsapp-plugin-updated", refreshWhatsAppConnection);
      window.removeEventListener("gigxomi:instagram-plugin-updated", refreshInstagramConnection);
    };
  }, []);

  return (
    <>
      {impersonationAgencyName ? (
        <aside className="agency-impersonation-banner" aria-label="Agency login mode">
          <div>
            <strong>Viewing as {impersonationAgencyName}</strong>
            <span>You are securely logged in from Super Admin.</span>
          </div>
          <form action="/api/auth/impersonation/stop" method="post">
            <button className="gx-button gx-button-primary" type="submit">
              Return to Super Admin
            </button>
          </form>
        </aside>
      ) : null}
      <InternalAppShell
        activeSection={activeSection}
        appLabel={adminAppLabel}
        contentClassName={resolvedContentClassName}
        headerPills={adminHeaderPills}
        navItems={navItems}
        onNavigate={() => {}}
        profileMeta={adminProfileMeta}
        profileName={profileName || adminProfileName}
        role="ADMIN"
        title={pageTitle}
      >
        {children}
      </InternalAppShell>
    </>
  );
}
