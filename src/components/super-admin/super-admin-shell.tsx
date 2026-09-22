"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { InternalAppShell } from "@/components/ui/internal-app-shell";
import {
  superAdminAppLabel,
  superAdminHeaderPills,
  superAdminNavItems,
  superAdminProfileMeta,
  superAdminProfileName,
  type SuperAdminSection,
} from "@/lib/gigxomi/internal-panels-data";

function getActiveSuperAdminSection(pathname: string): SuperAdminSection {
  const matchedItem = superAdminNavItems.find((item) => item.href === pathname);
  return matchedItem?.id ?? "overview";
}

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/super-admin/login") {
    return <>{children}</>;
  }

  const activeSection = getActiveSuperAdminSection(pathname);
  const activeItem = superAdminNavItems.find((item) => item.id === activeSection);

  return (
    <InternalAppShell
      activeSection={activeSection}
      appLabel={superAdminAppLabel}
      headerPills={superAdminHeaderPills}
      navItems={superAdminNavItems}
      onNavigate={() => {}}
      profileMeta={superAdminProfileMeta}
      profileName={superAdminProfileName}
      role="SUPER_ADMIN"
      title={activeItem?.label ?? "Super Admin"}
    >
      {children}
    </InternalAppShell>
  );
}
