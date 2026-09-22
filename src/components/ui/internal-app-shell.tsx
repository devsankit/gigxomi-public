import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Settings, X } from "lucide-react";

import { BrandWordmark } from "@/components/ui/brand-wordmark";

type ShellNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
};

type InternalAppShellProps = {
  appLabel: string;
  title: string;
  role?: string;
  homeHref?: string;
  profileName: string;
  profileMeta: string;
  navItems: ShellNavItem[];
  activeSection: string;
  onNavigate: (section: string) => void;
  headerPills?: string[];
  sidebarMode?: "default" | "collapsed";
  showTopbar?: boolean;
  showTopbarLabel?: boolean;
  showNotifications?: boolean;
  contentClassName?: string;
  topbarAccessory?: ReactNode;
  rootClassName?: string;
  children: ReactNode;
};

type ShellNotificationItem = {
  body?: string;
  createdAt: string;
  id: string;
  message?: string;
  status: "READ" | "UNREAD" | string;
  title: string;
};

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function InternalAppShell({
  appLabel,
  title,
  role,
  homeHref = "/",
  profileName,
  profileMeta,
  navItems,
  activeSection,
  onNavigate,
  headerPills = [],
  sidebarMode = "default",
  showTopbar = true,
  showTopbarLabel = false,
  showNotifications = false,
  contentClassName,
  topbarAccessory,
  rootClassName,
  children,
}: InternalAppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);
  const [notifications, setNotifications] = useState<ShellNotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(() => new Set());
  const [notificationError, setNotificationError] = useState("");
  const [collapsedState, setCollapsedState] = useState(false);
  const [pendingNavId, setPendingNavId] = useState<string | null>(null);
  const isChatContent = (contentClassName?.includes("internal-content-chat") || contentClassName?.includes("manager-chat-page-shell")) ?? false;
  const initials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const settingsHref =
    role === "SUPER_ADMIN"
      ? "/super-admin/platform-settings"
      : role === "FREELANCER"
      ? "/freelancer/profile"
      : "/admin/system-settings";

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    setPendingNavId(null);
    setIsProfileMenuOpen(false);
  }, [activeSection]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gigxomi_sidebar_collapsed");
      if (stored === "1") {
        setCollapsedState(true);
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gigxomi_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const isCollapsed = sidebarMode === "collapsed" || (sidebarMode === "default" && collapsedState);

  useEffect(() => {
    if (!isMobileMenuClosing) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsMobileMenuMounted(false);
      setIsMobileMenuClosing(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [isMobileMenuClosing]);

  useEffect(() => {
    if (!showNotifications) {
      return undefined;
    }

    let isActive = true;
    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store", signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { notifications?: ShellNotificationItem[] };
        if (isActive) {
          setNotifications(payload.notifications ?? []);
        }
      } catch {
        return;
      }
    };

    void fetchNotifications();
    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 30_000);

    return () => {
      isActive = false;
      controller.abort();
      window.clearInterval(interval);
    };
  }, [showNotifications]);

  const openMobileMenu = () => {
    setIsMobileMenuMounted(true);
    setIsMobileMenuClosing(false);
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileMenuClosing(true);
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen && !isMobileMenuClosing) {
      closeMobileMenu();
      return;
    }

    openMobileMenu();
  };

  const sidebarMeta = !showTopbar ? (
    <div className="internal-sidebar-meta">
      <div className="internal-profile-card">
        <div className="internal-avatar">{initials}</div>
        {isCollapsed ? null : (
          <div>
            <strong>{profileName}</strong>
            <span>{profileMeta}</span>
          </div>
        )}
      </div>

      <a
        className="freelancer-secondary-button internal-signout-button"
        data-tooltip={isCollapsed ? "Sign out" : undefined}
        href="/api/auth/logout"
        title={isCollapsed ? "Sign out" : undefined}
      >
        <LogOut size={16} strokeWidth={1.8} />
        {isCollapsed ? <span className="sr-only">Sign out</span> : <span>Sign out</span>}
      </a>
    </div>
  ) : null;

  const handleNavClick = (item: ShellNavItem, closeAfterNavigate = false) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gigxomi:internal-navigation-start"));
    }
    if (item.id !== activeSection) {
      setPendingNavId(item.id);
    }
    if (closeAfterNavigate) {
      closeMobileMenu();
    }
  };

  const renderNavItem = (item: ShellNavItem, keyPrefix = "nav", closeAfterNavigate = false) => {
    const Icon = item.icon;
    const isCurrentActive = activeSection === item.id;
    const isPending = pendingNavId === item.id;
    const isSelected = isPending || (isCurrentActive && !pendingNavId);
    const content = (
      <>
        <Icon size={18} strokeWidth={1.8} />
        {isCollapsed && !closeAfterNavigate ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
      </>
    );

    if (item.href) {
      const isExternal = item.href.startsWith("http://") || item.href.startsWith("https://");
      if (isExternal) {
        return (
          <a
            className="sidebar-nav-item internal-nav-item"
            data-tooltip={isCollapsed ? item.label : undefined}
            href={item.href}
            key={`${keyPrefix}-${item.id}`}
            onClick={() => {
              if (closeAfterNavigate) {
                closeMobileMenu();
              }
            }}
            rel="noopener noreferrer"
            target="_blank"
            title={isCollapsed ? item.label : undefined}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          className={isSelected ? "sidebar-nav-item internal-nav-item active" : "sidebar-nav-item internal-nav-item"}
          data-tooltip={isCollapsed ? item.label : undefined}
          href={item.href}
          key={`${keyPrefix}-${item.id}`}
          onClick={() => handleNavClick(item, closeAfterNavigate)}
          title={isCollapsed ? item.label : undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        className={isSelected ? "sidebar-nav-item internal-nav-item active" : "sidebar-nav-item internal-nav-item"}
        data-tooltip={isCollapsed ? item.label : undefined}
        key={`${keyPrefix}-${item.id}`}
        onClick={() => {
          handleNavClick(item, closeAfterNavigate);
          onNavigate(item.id);
        }}
        title={isCollapsed ? item.label : undefined}
        type="button"
      >
        {content}
      </button>
    );
  };

  const dashboardHomeHref = navItems.find((item) => item.href)?.href ?? homeHref;
  const unreadCount = notifications.filter((notification) => notification.status === "UNREAD").length;

  const markNotificationRead = async (notificationId: string) => {
    setNotificationError("");
    setMarkingReadIds((current) => new Set(current).add(notificationId));

    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setNotificationError(payload?.error ?? "Could not mark this notification as read. Please try again.");
        return;
      }
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                status: "READ",
              }
            : notification,
        ),
      );
    } catch {
      setNotificationError("Could not mark this notification as read. Check your connection and try again.");
    } finally {
      setMarkingReadIds((current) => {
        const next = new Set(current);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter((notification) => notification.status === "UNREAD").map((notification) => notification.id);
    await Promise.all(unreadIds.map((notificationId) => markNotificationRead(notificationId)));
  };

  return (
    <main className={`app-shell internal-theme-root${rootClassName ? ` ${rootClassName}` : ""}`}>
      {pendingNavId ? <div className="gx-nav-top-progress" aria-hidden="true" /> : null}
      <div className={isCollapsed ? "workspace-shell internal-shell internal-shell-collapsed" : "workspace-shell internal-shell"}>
        <aside className={isCollapsed ? "workspace-sidebar internal-sidebar internal-sidebar-collapsed" : "workspace-sidebar internal-sidebar"}>
          <div className="internal-sidebar-brand-row">
            <BrandWordmark ariaLabel="Go to dashboard home" className="sidebar-brand internal-brand-block" href={dashboardHomeHref} />
            <button
              aria-label={isCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
              className="internal-sidebar-collapse-toggle"
              data-tooltip={isCollapsed ? "Expand sidebar" : undefined}
              onClick={toggleSidebarCollapse}
              title={isCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
              type="button"
            >
              {isCollapsed ? <ChevronRight size={16} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />}
            </button>
          </div>

          {sidebarMeta}

          <nav aria-label={`${appLabel} navigation`} className="sidebar-nav secondary internal-nav">
            {!isCollapsed ? <p className="sidebar-nav-label">Workspace</p> : null}
            {navItems.map((item) => renderNavItem(item))}
          </nav>
        </aside>

        <section className={isChatContent ? "workspace-main internal-main internal-main-chat" : "workspace-main internal-main"}>
          {showTopbar ? (
            <header className="workspace-topbar internal-topbar">
              <div className="internal-topbar-heading">
                <BrandWordmark ariaLabel="Go to dashboard home" className="topbar-brand internal-mobile-topbar-brand" href={dashboardHomeHref} />
                <div className="internal-topbar-heading-copy">
                  {showTopbarLabel ? <p className="topbar-label">{appLabel}</p> : null}
                  <h1 className="app-page-title">{title}</h1>
                </div>
              </div>
              <div className="internal-topbar-right">
                {headerPills.length && !isChatContent ? (
                  <div className="topbar-actions internal-topbar-pills">
                    {headerPills.map((pill) => (
                      <span className="topbar-pill" key={pill}>
                        {pill}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="internal-topbar-desktop-actions">
                  {topbarAccessory}
                  {showNotifications ? (
                    <div className="internal-notification-wrap">
                      <button
                        aria-expanded={isNotificationsOpen}
                        aria-label={isNotificationsOpen ? "Close notifications" : "Open notifications"}
                        className="internal-notification-button"
                        onClick={() => {
                          setNotificationError("");
                          setIsNotificationsOpen((open) => !open);
                        }}
                        type="button"
                      >
                        <Bell size={16} strokeWidth={1.9} />
                        {unreadCount ? <span className="internal-notification-dot">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
                      </button>
                      {isNotificationsOpen ? (
                        <aside aria-label="Notifications" className="internal-notification-popover">
                          <header>
                            <div>
                              <strong>Notifications</strong>
                              <span>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</span>
                            </div>
                            {unreadCount ? (
                              <button
                                className="internal-notification-mark-all"
                                disabled={markingReadIds.size > 0}
                                onClick={() => void markAllNotificationsRead()}
                                type="button"
                              >
                                Mark all read
                              </button>
                            ) : null}
                          </header>
                          {notificationError ? (
                            <p className="internal-notification-error" role="alert">
                              {notificationError}
                            </p>
                          ) : null}
                          <div className="internal-notification-list">
                            {notifications.map((notification) => {
                              const isUnread = notification.status === "UNREAD";
                              const isMarkingRead = markingReadIds.has(notification.id);
                              const formattedTime = formatNotificationTime(notification.createdAt);

                              return (
                                <article
                                  className={isUnread ? "internal-notification-item is-unread" : "internal-notification-item"}
                                  key={notification.id}
                                >
                                  <span aria-hidden="true" className="internal-notification-status-dot" />
                                  <div className="internal-notification-copy">
                                    <strong>{notification.title}</strong>
                                    <p>{notification.message ?? notification.body}</p>
                                    <div className="internal-notification-meta">
                                      {formattedTime ? <time dateTime={notification.createdAt}>{formattedTime}</time> : null}
                                      {!isUnread ? <span className="internal-notification-read">Read</span> : null}
                                    </div>
                                  </div>
                                  {isUnread ? (
                                    <button
                                      disabled={isMarkingRead}
                                      onClick={() => void markNotificationRead(notification.id)}
                                      type="button"
                                    >
                                      <Check size={14} strokeWidth={2.2} />
                                      {isMarkingRead ? "Marking..." : "Mark read"}
                                    </button>
                                  ) : null}
                                </article>
                              );
                            })}
                            {!notifications.length ? <p className="internal-notification-empty">No notifications yet.</p> : null}
                          </div>
                        </aside>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    className="internal-profile-menu-wrapper"
                    onMouseEnter={() => setIsProfileMenuOpen(true)}
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                    ref={profileMenuRef}
                  >
                    <button
                      aria-expanded={isProfileMenuOpen}
                      aria-haspopup="true"
                      aria-label={`${profileName} (${profileMeta}) options`}
                      className={`internal-topbar-profile internal-topbar-profile-trigger${isProfileMenuOpen ? " is-active" : ""}`}
                      onClick={() => setIsProfileMenuOpen((open) => !open)}
                      type="button"
                    >
                      <div className="internal-avatar">{initials}</div>
                      <div className="internal-topbar-profile-copy">
                        <strong>{profileName}</strong>
                        <span>{profileMeta}</span>
                      </div>
                      <ChevronDown
                        className={`internal-profile-chevron${isProfileMenuOpen ? " is-rotated" : ""}`}
                        size={14}
                        strokeWidth={2.2}
                      />
                    </button>

                    <div
                      aria-label={`${profileName} menu`}
                      className={`internal-profile-dropdown-menu${isProfileMenuOpen ? " is-open" : ""}`}
                      role="menu"
                    >
                      <div className="internal-profile-dropdown-header">
                        <div className="internal-avatar internal-avatar-sm">{initials}</div>
                        <div className="internal-profile-dropdown-header-copy">
                          <strong className="internal-profile-dropdown-title">{profileName}</strong>
                          <span className="internal-profile-dropdown-badge">{profileMeta}</span>
                        </div>
                      </div>

                      <div className="internal-profile-dropdown-divider" role="separator" />

                      <Link
                        className="internal-profile-dropdown-item"
                        href={settingsHref}
                        onClick={() => setIsProfileMenuOpen(false)}
                        role="menuitem"
                      >
                        <span className="internal-dropdown-item-icon">
                          <Settings size={15} strokeWidth={2} />
                        </span>
                        <div className="internal-dropdown-item-copy">
                          <span className="internal-dropdown-item-title">Settings</span>
                          <span className="internal-dropdown-item-desc">Preferences & system config</span>
                        </div>
                      </Link>

                      <a
                        className="internal-profile-dropdown-item internal-profile-dropdown-support"
                        href="https://wa.me/916267605079?text=Hello%20Gigxomi%20Support%2C%20I%20need%20assistance"
                        onClick={() => setIsProfileMenuOpen(false)}
                        rel="noopener noreferrer"
                        role="menuitem"
                        target="_blank"
                      >
                        <span className="internal-dropdown-item-icon whatsapp-accent-icon">
                          <svg
                            aria-hidden="true"
                            fill="none"
                            height="16"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            width="16"
                          >
                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                          </svg>
                        </span>
                        <div className="internal-dropdown-item-copy">
                          <div className="internal-dropdown-item-row">
                            <span className="internal-dropdown-item-title">Support</span>
                            <span className="internal-dropdown-badge-pill">WhatsApp</span>
                          </div>
                          <span className="internal-dropdown-item-desc whatsapp-number">+91 6267605079</span>
                        </div>
                      </a>

                      <div className="internal-profile-dropdown-divider" role="separator" />

                      <a
                        className="internal-profile-dropdown-item internal-profile-dropdown-signout"
                        href="/api/auth/logout"
                        role="menuitem"
                      >
                        <span className="internal-dropdown-item-icon">
                          <LogOut size={15} strokeWidth={1.8} />
                        </span>
                        <div className="internal-dropdown-item-copy">
                          <span className="internal-dropdown-item-title">Sign out</span>
                        </div>
                      </a>
                    </div>
                  </div>

                  <a className="topbar-link internal-topbar-signout-button" href="/api/auth/logout">
                    Sign out
                  </a>
                </div>

                <div className="internal-mobile-topbar-actions">
                  {topbarAccessory}
                  <div className="internal-avatar internal-mobile-avatar">{initials}</div>
                  <button
                    aria-label={isMobileMenuOpen ? "Close dashboard menu" : "Open dashboard menu"}
                    className="internal-mobile-menu-button"
                    onClick={toggleMobileMenu}
                    type="button"
                  >
                    {isMobileMenuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            </header>
          ) : null}

          <div className={isChatContent ? "public-shell-canvas internal-canvas internal-canvas-chat" : "public-shell-canvas internal-canvas"}>
            <div className={contentClassName ? `internal-content app-shell-content ${contentClassName}` : "internal-content app-shell-content"}>{children}</div>
          </div>
        </section>
      </div>

      {isMobileMenuMounted ? (
        <div className={`internal-mobile-drawer-backdrop${isMobileMenuClosing ? " is-closing" : " is-open"}`}>
          <button aria-label="Close dashboard menu" className="internal-mobile-drawer-scrim" onClick={closeMobileMenu} type="button" />
          <aside className={`internal-mobile-drawer${isMobileMenuClosing ? " is-closing" : " is-open"}`}>
            <div className="internal-mobile-drawer-head">
              <BrandWordmark ariaLabel="Go to dashboard home" href={dashboardHomeHref} onClick={closeMobileMenu} />
              <button
                aria-label="Close dashboard menu"
                className="internal-mobile-menu-button"
                onClick={closeMobileMenu}
                type="button"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="internal-mobile-drawer-profile-wrap">
              <Link className="internal-profile-card internal-mobile-drawer-profile" href={dashboardHomeHref} onClick={closeMobileMenu}>
                <div className="internal-avatar">{initials}</div>
                <div>
                  <strong>{profileName}</strong>
                  <span>{profileMeta}</span>
                </div>
              </Link>
              <div className="internal-mobile-quick-actions">
                <Link className="internal-mobile-quick-link" href={settingsHref} onClick={closeMobileMenu}>
                  <Settings size={14} strokeWidth={2} />
                  Settings
                </Link>
                <a
                  className="internal-mobile-quick-link internal-mobile-quick-support"
                  href="https://wa.me/916267605079?text=Hello%20Gigxomi%20Support%2C%20I%20need%20assistance"
                  onClick={closeMobileMenu}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="14"
                    stroke="#25D366"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="14"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                  </svg>
                  Support (6267605079)
                </a>
              </div>
            </div>

            <nav aria-label={`${appLabel} navigation`} className="sidebar-nav secondary internal-nav internal-mobile-nav">
              <p className="sidebar-nav-label">Workspace</p>
              {navItems.map((item) => renderNavItem(item, "drawer", true))}
            </nav>

            <a className="freelancer-secondary-button internal-signout-button internal-mobile-drawer-signout" href="/api/auth/logout">
              Sign out
            </a>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

