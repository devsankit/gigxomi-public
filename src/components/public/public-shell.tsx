"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, type Ref, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Clapperboard,
  Compass,
  Crown,
  LayoutGrid,
  Mail,
  Menu,
  Mic,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";

import { BrandWordmark } from "@/components/ui/brand-wordmark";
import { MarketingSiteFooter } from "@/components/public/marketing-site-footer";
import {
  PUBLIC_DISCOVERY_NAV,
  PUBLIC_GROWTH_NAV,
  PUBLIC_INFO_NAV,
  PUBLIC_SURFACE_NAV,
  type PublicPresetKey,
  type PublicShellIcon,
  type PublicSurfaceKey,
} from "@/lib/gigxomi/public-shell-nav";

type PublicShellAction = {
  external?: boolean;
  href?: string;
  icon?: PublicShellIcon;
  label: string;
  onClick?: () => void;
  variant?: "link" | "pill";
};

type PublicShellProps = {
  activePreset?: PublicPresetKey | null;
  activeSurface?: PublicSurfaceKey | null;
  canvasClassName?: string;
  canvasRef?: Ref<HTMLDivElement>;
  children: ReactNode;
  fullScreen?: boolean;
  mainClassName?: string;
  onPresetSelect?: (preset: PublicPresetKey) => void;
  onSurfaceSelect?: (surface: PublicSurfaceKey) => void;
  showCategoryNav?: boolean;
  title: string;
  topbarActions?: PublicShellAction[];
};

const iconMap = {
  "badge-check": BadgeCheck,
  clapperboard: Clapperboard,
  compass: Compass,
  crown: Crown,
  "layout-grid": LayoutGrid,
  mail: Mail,
  sparkles: Sparkles,
  shield: ShieldCheck,
  "timer-reset": TimerReset,
  users: Users,
  video: Video,
  wallet: Wallet,
  mic: Mic,
} satisfies Record<PublicShellIcon | "mic", typeof Sparkles>;

function renderLinkOrButton({
  active,
  className,
  href,
  icon,
  keyValue,
  label,
  onClick,
  onNavigate,
}: {
  active: boolean;
  className: string;
  href?: string;
  icon: PublicShellIcon;
  keyValue: string;
  label: string;
  onClick?: () => void;
  onNavigate?: () => void;
}) {
  const Icon = iconMap[icon];
  const finalClassName = active ? `${className} active` : className;

  if (onClick) {
    return (
      <button className={finalClassName} key={keyValue} onClick={onClick} type="button">
        <Icon size={16} strokeWidth={1.7} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link className={finalClassName} href={href ?? "/"} key={keyValue} onClick={onNavigate}>
      <Icon size={16} strokeWidth={1.7} />
      <span>{label}</span>
    </Link>
  );
}

function renderTopbarAction(action: PublicShellAction) {
  const className = action.variant === "pill" ? "topbar-pill" : "topbar-link";
  const Icon = action.icon ? iconMap[action.icon] : null;

  if (action.href === "#open-support") {
    return (
      <button className={className} key={action.label} onClick={() => window.dispatchEvent(new Event("gigxomi:open-support-bot"))} type="button">
        {Icon ? <Icon size={14} strokeWidth={1.7} /> : null}
        <span>{action.label}</span>
      </button>
    );
  }

  if (action.onClick) {
    return (
      <button className={className} key={action.label} onClick={action.onClick} type="button">
        {Icon ? <Icon size={14} strokeWidth={1.7} /> : null}
        <span>{action.label}</span>
      </button>
    );
  }

  if (action.external) {
    return (
      <a className={className} href={action.href} key={action.label} rel="noreferrer" target="_blank">
        {Icon ? <Icon size={14} strokeWidth={1.7} /> : null}
        <span>{action.label}</span>
      </a>
    );
  }

  return (
    <Link className={className} href={action.href ?? "/"} key={action.label}>
      {Icon ? <Icon size={14} strokeWidth={1.7} /> : null}
      <span>{action.label}</span>
    </Link>
  );
}

function getDrawerActionMeta(action?: PublicShellAction) {
  const label = action?.label?.trim().toLowerCase() ?? "";

  if (!label) {
    return "Tap to continue";
  }

  if (label.includes("login")) {
    return "Open login";
  }

  if (label.includes("register") || label.includes("signup")) {
    return "Create account";
  }

  if (label.includes("back")) {
    return "Return home";
  }

  if (label.includes("logout") || label.includes("sign out")) {
    return "Manage account";
  }

  return "Open dashboard";
}

function getAvatarLabel(action?: PublicShellAction) {
  const source = action?.label?.trim() || "GX";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "GX";
}

export function PublicShell({
  activePreset = null,
  activeSurface = null,
  canvasClassName,
  canvasRef,
  children,
  fullScreen = false,
  mainClassName,
  onPresetSelect,
  onSurfaceSelect,
  showCategoryNav = true,
  title,
  topbarActions = [],
}: PublicShellProps) {
  const pathname = usePathname();
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileDrawerMounted, setIsMobileDrawerMounted] = useState(false);
  const [isMobileDrawerClosing, setIsMobileDrawerClosing] = useState(false);
  const mobileCategoryNav = showCategoryNav ? PUBLIC_DISCOVERY_NAV : [];
  const canvasClasses = ["public-shell-canvas", canvasClassName].filter(Boolean).join(" ");
  const mainClasses = ["workspace-main", mainClassName].filter(Boolean).join(" ");
  const shellClasses = [
    "workspace-shell public-shell",
    fullScreen ? "public-shell-fullscreen" : "",
    !fullScreen && isDesktopSidebarOpen ? "public-shell-sidebar-open" : "",
    !fullScreen && !isDesktopSidebarOpen ? "public-shell-sidebar-closed" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const mobileAvatar = useMemo(() => getAvatarLabel(topbarActions[0]), [topbarActions]);
  const primaryDrawerAction = topbarActions[0];
  const drawerActions = topbarActions.slice(1);

  useEffect(() => {
    if (!isMobileDrawerClosing) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsMobileDrawerMounted(false);
      setIsMobileDrawerClosing(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [isMobileDrawerClosing]);

  const openMobileDrawer = () => {
    setIsMobileDrawerMounted(true);
    setIsMobileDrawerClosing(false);
    setIsMobileDrawerOpen(true);
  };

  const closeMobileDrawer = () => {
    setIsMobileDrawerOpen(false);
    setIsMobileDrawerClosing(true);
  };

  const toggleMobileDrawer = () => {
    if (isMobileDrawerOpen && !isMobileDrawerClosing) {
      closeMobileDrawer();
      return;
    }

    openMobileDrawer();
  };

  return (
    <div className={shellClasses}>
      {!fullScreen ? (
      <aside aria-label="Primary site navigation" className="workspace-sidebar public-shell-sidebar" id="public-shell-sidebar">
        <div className="sidebar-brand">
          <BrandWordmark />
          <span className="public-shell-sidebar-brand-note">Creative work OS</span>
        </div>

        <nav aria-label="Explore surfaces" className="sidebar-nav secondary">
          <p className="sidebar-nav-label">Explore</p>
          {PUBLIC_SURFACE_NAV.map((item) =>
            renderLinkOrButton({
              active: item.id === activeSurface,
              className: "sidebar-nav-item",
              href: item.href,
              icon: item.icon,
              keyValue: item.id,
              label: item.label,
              onClick: onSurfaceSelect ? () => onSurfaceSelect(item.id) : undefined,
            }),
          )}
        </nav>

        <nav aria-label="Growth pages" className="sidebar-nav secondary">
          <p className="sidebar-nav-label">Grow</p>
          {PUBLIC_GROWTH_NAV.map((item) =>
            renderLinkOrButton({
              active: pathname === item.href,
              className: "sidebar-nav-item",
              href: item.href,
              icon: item.icon,
              keyValue: item.id,
              label: item.label,
            }),
          )}
        </nav>

        {showCategoryNav ? (
          <nav aria-label="Discover categories" className="sidebar-nav secondary">
            <p className="sidebar-nav-label">Categories</p>
            {PUBLIC_DISCOVERY_NAV.map((item) =>
              renderLinkOrButton({
                active: item.id === activePreset && activeSurface === "services",
                className: "sidebar-nav-item",
                href: item.href,
                icon: item.icon,
                keyValue: item.id,
                label: item.label,
                onClick: onPresetSelect ? () => onPresetSelect(item.id) : undefined,
              }),
            )}
          </nav>
        ) : null}

        <div className="sidebar-spacer" />

        <nav aria-label="Information pages" className="sidebar-nav secondary sidebar-nav-utility">
          <p className="sidebar-nav-label">Info</p>
          <div className="sidebar-utility-links">
            {PUBLIC_INFO_NAV.map((item) => (
              <Link className="sidebar-utility-link" href={item.href} key={item.id}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
      ) : null}

      <section className={mainClasses}>
        <div aria-label={`${title} page controls`} className="workspace-topbar public-shell-topbar public-shell-contextbar" role="toolbar">
          <div className="topbar-leading">
            {!fullScreen ? (
              <button
                aria-controls="public-shell-sidebar"
                aria-expanded={isDesktopSidebarOpen}
                aria-label={isDesktopSidebarOpen ? "Close menu" : "Open menu"}
                className={isDesktopSidebarOpen ? "public-shell-desktop-menu-button is-open" : "public-shell-desktop-menu-button"}
                onClick={() => setIsDesktopSidebarOpen((current) => !current)}
                type="button"
              >
                {isDesktopSidebarOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
              </button>
            ) : null}
            <div className="topbar-copy" data-surface-title>
              <p className="topbar-label">{title}</p>
            </div>
          </div>

          <div className="topbar-actions public-shell-desktop-actions">
            {topbarActions.map((action) => renderTopbarAction(action))}
          </div>

          <div className="public-shell-mobile-topbar-actions">
            <div className="public-shell-mobile-avatar">
              {mobileAvatar}
            </div>
            <button
              aria-label="Open menu"
              className={isMobileDrawerMounted ? "public-shell-mobile-menu-button is-drawer-open" : "public-shell-mobile-menu-button"}
              onClick={toggleMobileDrawer}
              type="button"
            >
              <Menu size={19} strokeWidth={2} />
            </button>
          </div>
        </div>

        {!fullScreen ? (
        <div className="workspace-mobile-nav public-shell-mobile-nav">
          <div aria-label="Explore surfaces" className="workspace-mobile-row">
            {PUBLIC_SURFACE_NAV.map((item) =>
              renderLinkOrButton({
                active: item.id === activeSurface,
                className: "workspace-mobile-chip",
                href: item.href,
                icon: item.icon,
                keyValue: `mobile-${item.id}`,
                label: item.label,
                onClick: onSurfaceSelect ? () => onSurfaceSelect(item.id) : undefined,
              }),
            )}
          </div>

          {showCategoryNav && mobileCategoryNav.length ? (
            <div aria-label="Discover categories" className="workspace-mobile-row">
              {mobileCategoryNav.map((item) =>
                renderLinkOrButton({
                  active: item.id === activePreset && activeSurface === "services",
                  className: "workspace-mobile-chip",
                  href: item.href,
                  icon: item.icon,
                  keyValue: `mobile-${item.id}`,
                  label: item.label,
                  onClick: onPresetSelect ? () => onPresetSelect(item.id) : undefined,
                }),
              )}
            </div>
          ) : null}
        </div>
        ) : null}

        <div className={canvasClasses} ref={canvasRef}>
          {children}
          <MarketingSiteFooter />
        </div>
      </section>

      {isMobileDrawerMounted ? (
        <div
          className={`public-shell-mobile-drawer-backdrop min-[921px]:hidden${isMobileDrawerClosing ? " is-closing" : " is-open"}`}
        >
          <div aria-hidden="true" className="absolute inset-0" onClick={closeMobileDrawer} />
          <aside aria-label="Site menu" className={`public-shell-mobile-drawer-panel${isMobileDrawerClosing ? " is-closing" : " is-open"}`}>
            <div className="mb-5 flex items-center justify-between border-b border-white/6 pb-4">
              <BrandWordmark onClick={closeMobileDrawer} />
              <button
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white"
                onClick={closeMobileDrawer}
                type="button"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {primaryDrawerAction?.onClick ? (
              <button
                className="mb-5 flex w-full items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
                onClick={() => {
                  closeMobileDrawer();
                  primaryDrawerAction.onClick?.();
                }}
                type="button"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
                  {mobileAvatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{primaryDrawerAction.label}</p>
                  <p className="text-xs text-white/52">{getDrawerActionMeta(primaryDrawerAction)}</p>
                </div>
              </button>
            ) : primaryDrawerAction?.external ? (
              <a
                className="mb-5 flex items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
                href={primaryDrawerAction.href}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
                  {mobileAvatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{primaryDrawerAction.label}</p>
                  <p className="text-xs text-white/52">{getDrawerActionMeta(primaryDrawerAction)}</p>
                </div>
              </a>
            ) : (
              <Link
                className="mb-5 flex items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/12 hover:bg-white/[0.05]"
                href={primaryDrawerAction?.href ?? "/"}
                onClick={closeMobileDrawer}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-white">
                  {mobileAvatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{primaryDrawerAction?.label ?? "Gigxomi"}</p>
                  <p className="text-xs text-white/52">{getDrawerActionMeta(primaryDrawerAction)}</p>
                </div>
              </Link>
            )}

            <nav aria-label="Explore surfaces" className="sidebar-nav secondary">
              <p className="sidebar-nav-label">Explore</p>
              {PUBLIC_SURFACE_NAV.map((item) =>
                renderLinkOrButton({
                  active: item.id === activeSurface,
                    className: "sidebar-nav-item",
                    href: item.href,
                    icon: item.icon,
                    keyValue: `drawer-${item.id}`,
                    label: item.label,
                    onClick: onSurfaceSelect
                      ? () => {
                        onSurfaceSelect(item.id);
                        closeMobileDrawer();
                      }
                      : undefined,
                }),
              )}
            </nav>

            <nav aria-label="Growth pages" className="sidebar-nav secondary mt-3">
              <p className="sidebar-nav-label">Grow</p>
              {PUBLIC_GROWTH_NAV.map((item) =>
                renderLinkOrButton({
                  active: pathname === item.href,
                  className: "sidebar-nav-item",
                  href: item.href,
                  icon: item.icon,
                  keyValue: `drawer-growth-${item.id}`,
                  label: item.label,
                  onNavigate: closeMobileDrawer,
                }),
              )}
            </nav>

            {showCategoryNav ? (
              <nav aria-label="Discover categories" className="sidebar-nav secondary mt-3">
                <p className="sidebar-nav-label">Categories</p>
                {PUBLIC_DISCOVERY_NAV.map((item) =>
                  renderLinkOrButton({
                    active: item.id === activePreset && activeSurface === "services",
                    className: "sidebar-nav-item",
                    href: item.href,
                    icon: item.icon,
                    keyValue: `drawer-${item.id}`,
                    label: item.label,
                    onClick: onPresetSelect
                      ? () => {
                          onPresetSelect(item.id);
                          closeMobileDrawer();
                        }
                      : undefined,
                  }),
                )}
              </nav>
            ) : null}

            {drawerActions.length ? (
              <div className="mt-5 flex flex-col gap-3">
                {drawerActions.map((action) => (
                  <div key={`drawer-action-${action.label}`} onClick={closeMobileDrawer}>
                    {renderTopbarAction(action)}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-auto pt-6">
              <p className="mb-3 px-2 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-white/36">Resources</p>
              <div className="flex flex-wrap gap-3 px-2">
                {PUBLIC_INFO_NAV.map((item) => (
                  <Link
                    className="text-xs text-white/62 transition hover:text-white"
                    href={item.href}
                    key={`drawer-info-${item.id}`}
                    onClick={closeMobileDrawer}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
