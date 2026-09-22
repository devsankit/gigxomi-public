"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { InternalAppShell } from "@/components/ui/internal-app-shell";
import {
  managerAppLabel,
  managerHeaderPills,
  managerNavItems,
  managerProfileMeta,
  managerProfileName,
  type ManagerSection,
} from "@/lib/gigxomi/internal-panels-data";
import type { DummyManagerAccount } from "@/lib/gigxomi/dummy-platform-store";

type ManagerShellProps = {
  children: ReactNode;
};

function getActiveManagerSection(pathname: string): ManagerSection {
  if (pathname === "/manager" || pathname.startsWith("/manager/assigned-chats")) {
    return "chat-inbox";
  }

  if (
    pathname.startsWith("/manager/verification-review") ||
    pathname.startsWith("/manager/quote-review") ||
    pathname.startsWith("/manager/delivery-review") ||
    pathname.startsWith("/manager/portfolio-review")
  ) {
    return "service-review";
  }

  if (pathname.startsWith("/manager/wallet-review")) {
    return "service-review";
  }

  const matchedItem = managerNavItems.find((item) => item.href === pathname);
  return matchedItem?.id ?? "chat-inbox";
}

export function ManagerShell({ children }: ManagerShellProps) {
  const pathname = usePathname();
  const [managerRecord, setManagerRecord] = useState<DummyManagerAccount | null>(null);
  const activeSection = getActiveManagerSection(pathname);
  const navItems =
    managerRecord && !managerRecord.permissions.allContacts
      ? managerNavItems.filter((item) => item.id !== "contacts")
      : managerNavItems;
  const activeItem = navItems.find((item) => item.id === activeSection);
  const contentClassName = pathname === "/manager/chat" ? "internal-content-chat manager-chat-page-shell" : undefined;

  useEffect(() => {
    fetch("/api/admin/managers", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setManagerRecord(((payload.managers ?? []) as DummyManagerAccount[])[0] ?? null))
      .catch(() => setManagerRecord(null));
  }, []);

  return (
    <InternalAppShell
      activeSection={activeSection}
      appLabel={managerAppLabel}
      contentClassName={contentClassName}
      headerPills={managerHeaderPills}
      navItems={navItems}
      onNavigate={() => {}}
      profileMeta={managerProfileMeta}
      profileName={managerProfileName}
      role="MANAGER"
      title={activeItem?.label ?? "Manager"}
    >
      {children}
    </InternalAppShell>
  );
}
