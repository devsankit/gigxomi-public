"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, CircleUserRound, LayoutDashboard, LogOut, Menu, MessageCircle, Settings, X } from "lucide-react";

import { BrandWordmark } from "@/components/ui/brand-wordmark";

export function MarketingSiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  type HeaderSession = {
    authenticated: boolean;
    primaryTitle: string;
    subtitle: string;
    avatarInitials: string;
    role: string;
    isAgency: boolean;
    dashboardHref: string;
    settingsHref: string;
    whatsappPhone: string;
  };

  const [profileOpen, setProfileOpen] = useState(false);
  const [userSession, setUserSession] = useState<HeaderSession | null>(null);
  const headerInnerRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.authenticated || !data?.session) return;
        const role = data.session.role;
        const isAgency = role === "ADMIN" || role === "SUPER_ADMIN" || data.session.workspaceMode === "AGENCY" || data.session.packageAudience === "AGENCY";

        let dashboardHref = "/admin";
        let settingsHref = "/admin/system-settings";
        if (role === "MANAGER") {
          dashboardHref = "/manager";
          settingsHref = "/manager/settings";
        } else if (role === "FREELANCER") {
          dashboardHref = "/freelancer";
          settingsHref = "/freelancer/profile";
        } else if (role === "CLIENT") {
          dashboardHref = "/client";
          settingsHref = "/client/settings";
        }

        const primaryTitle = isAgency
          ? (data.session.agencyName || "Post Production Work")
          : (data.session.displayName || data.session.agencyName || "Workspace");

        const subtitle = isAgency
          ? `${data.session.displayName || "Owner"} · Agency owner`
          : (data.session.displayName ? `${data.session.displayName} · ${data.roleLabel || role}` : (data.roleLabel || role));

        const avatarInitials = primaryTitle
          .split(/\s+/)
          .filter(Boolean)
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "GX";

        setUserSession({
          authenticated: true,
          primaryTitle,
          subtitle,
          avatarInitials,
          role,
          isAgency,
          dashboardHref,
          settingsHref,
          whatsappPhone: "919993328124",
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [pathname]);

  const isLoginPage = pathname === "/login" || pathname?.startsWith("/login");
  const isSignupPage = pathname === "/signup" || pathname?.startsWith("/signup");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = headerInnerRef.current;
    if (!el) return;
    el.dataset.interactive = "true";
    const rect = el.getBoundingClientRect();
    const x = Math.max(65, Math.min(e.clientX - rect.left, rect.width - 65));
    el.style.setProperty("--neon-x", `${x}px`);
    el.style.setProperty("--neon-opacity", "1");
  };

  const handleMouseLeave = () => {
    const el = headerInnerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const restingX = Math.max(60, rect.width - 150);
    el.style.setProperty("--neon-x", `${restingX}px`);
    el.style.setProperty("--neon-opacity", "0.85");
  };

  // Close menus on escape
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setResourcesOpen(false);
        setProductOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close product dropdown on click outside
  useEffect(() => {
    if (!productOpen) return undefined;
    const onClickOutside = (event: MouseEvent) => {
      if (productRef.current && !productRef.current.contains(event.target as Node)) {
        setProductOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [productOpen]);

  // Close resources dropdown on click outside
  useEffect(() => {
    if (!resourcesOpen) return undefined;
    const onClickOutside = (event: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [resourcesOpen]);

  // Close profile dropdown on click outside
  useEffect(() => {
    if (!profileOpen) return undefined;
    const onClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setResourcesOpen(false);
    setProductOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="gx-site-header">
      <div
        ref={headerInnerRef}
        className="gx-site-header-inner"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <BrandWordmark className="gx-site-logo" priority />

        <nav aria-label="Primary navigation" className={menuOpen ? "gx-site-nav is-open" : "gx-site-nav"}>
          <div ref={productRef} className="gx-nav-dropdown">
            <button
              type="button"
              aria-expanded={productOpen}
              aria-haspopup="true"
              aria-controls="gx-product-menu"
              className={`gx-nav-dropdown-btn ${pathname.startsWith("/product") || pathname.startsWith("/features/") ? "is-active" : ""}`}
              onClick={() => setProductOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && !productOpen) {
                  e.preventDefault();
                  setProductOpen(true);
                }
              }}
            >
              <span>Product</span>
              <ChevronDown size={14} className={`gx-nav-chevron ${productOpen ? "is-open" : ""}`} aria-hidden="true" />
            </button>
            {productOpen && (
              <div id="gx-product-menu" role="menu" className="gx-nav-dropdown-menu gx-nav-product-menu">
                <Link role="menuitem" href="/product" className={`gx-nav-dropdown-link ${pathname.startsWith("/product") ? "is-active" : ""}`} onClick={() => setProductOpen(false)} prefetch={false}>
                  <span className="gx-dropdown-link-title">Product overview</span>
                  <span className="gx-dropdown-link-desc">One workspace for editing operations</span>
                </Link>
                <Link role="menuitem" href="/features/unified-inbox" className={`gx-nav-dropdown-link ${pathname === "/features/unified-inbox" ? "is-active" : ""}`} onClick={() => setProductOpen(false)} prefetch={false}>
                  <span className="gx-dropdown-link-title">Unified Inbox</span>
                  <span className="gx-dropdown-link-desc">Keep WhatsApp and Instagram distinct</span>
                </Link>
                <Link role="menuitem" href="/features/editor-management" className={`gx-nav-dropdown-link ${pathname === "/features/editor-management" ? "is-active" : ""}`} onClick={() => setProductOpen(false)} prefetch={false}>
                  <span className="gx-dropdown-link-title">Editor Management</span>
                  <span className="gx-dropdown-link-desc">Match briefs to available editors</span>
                </Link>
                <Link role="menuitem" href="/features/client-collaboration" className={`gx-nav-dropdown-link ${pathname === "/features/client-collaboration" ? "is-active" : ""}`} onClick={() => setProductOpen(false)} prefetch={false}>
                  <span className="gx-dropdown-link-title">Client Collaboration</span>
                  <span className="gx-dropdown-link-desc">Use internal lanes before client replies</span>
                </Link>
                <Link role="menuitem" href="/features/project-tracking" className={`gx-nav-dropdown-link ${pathname === "/features/project-tracking" ? "is-active" : ""}`} onClick={() => setProductOpen(false)} prefetch={false}>
                  <span className="gx-dropdown-link-title">Project Tracking</span>
                  <span className="gx-dropdown-link-desc">Follow work across five stages</span>
                </Link>
                <Link role="menuitem" href="/features/work-hub" className={`gx-nav-dropdown-link ${pathname === "/features/work-hub" ? "is-active" : ""}`} onClick={() => setProductOpen(false)} prefetch={false}>
                  <span className="gx-dropdown-link-title">Work Hub</span>
                  <span className="gx-dropdown-link-desc">Keep assets with project context</span>
                </Link>
              </div>
            )}
          </div>
          <Link
            aria-current={pathname.startsWith("/for-video-editing-agencies") ? "page" : undefined}
            className={pathname.startsWith("/for-video-editing-agencies") ? "is-active" : undefined}
            href="/for-video-editing-agencies"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>For agencies</span>
          </Link>
          <Link
            aria-current={pathname.startsWith("/for-freelance-editors-building-teams") ? "page" : undefined}
            className={pathname.startsWith("/for-freelance-editors-building-teams") ? "is-active" : undefined}
            href="/for-freelance-editors-building-teams"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>For editors</span>
          </Link>
          <Link
            aria-current={pathname.startsWith("/pricing") ? "page" : undefined}
            className={pathname.startsWith("/pricing") ? "is-active" : undefined}
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>Pricing</span>
          </Link>

          <div ref={resourcesRef} className="gx-nav-dropdown">
            <button
              type="button"
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
              aria-controls="gx-resources-menu"
              className={`gx-nav-dropdown-btn ${pathname.startsWith("/blog") || pathname.startsWith("/knowledge-base") ? "is-active" : ""}`}
              onClick={() => setResourcesOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && !resourcesOpen) {
                  e.preventDefault();
                  setResourcesOpen(true);
                }
              }}
            >
              <span>Resources</span>
              <ChevronDown
                size={14}
                className={`gx-nav-chevron ${resourcesOpen ? "is-open" : ""}`}
                aria-hidden="true"
              />
            </button>
            {resourcesOpen && (
              <div id="gx-resources-menu" role="menu" className="gx-nav-dropdown-menu">
                <Link
                  role="menuitem"
                  href="/blog"
                  className={`gx-nav-dropdown-link ${pathname.startsWith("/blog") ? "is-active" : ""}`}
                  onClick={() => setResourcesOpen(false)}
                  prefetch={false}
                >
                  <span className="gx-dropdown-link-title">Blog</span>
                  <span className="gx-dropdown-link-desc">Guides, articles &amp; systems</span>
                </Link>
                <Link
                  role="menuitem"
                  href="/knowledge-base"
                  className={`gx-nav-dropdown-link ${pathname.startsWith("/knowledge-base") ? "is-active" : ""}`}
                  onClick={() => setResourcesOpen(false)}
                  prefetch={false}
                >
                  <span className="gx-dropdown-link-title">Knowledge base</span>
                  <span className="gx-dropdown-link-desc">Setup manuals &amp; documentation</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            aria-current={pathname.startsWith("/product") ? "page" : undefined}
            className={`gx-nav-mobile-item ${pathname.startsWith("/product") ? "is-active" : ""}`}
            href="/product"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>Product overview</span>
          </Link>
          <Link
            aria-current={pathname.startsWith("/features") ? "page" : undefined}
            className={`gx-nav-mobile-item ${pathname.startsWith("/features") ? "is-active" : ""}`}
            href="/features/unified-inbox"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>Product features</span>
          </Link>
          <Link
            aria-current={pathname.startsWith("/blog") ? "page" : undefined}
            className={`gx-nav-mobile-item ${pathname.startsWith("/blog") ? "is-active" : ""}`}
            href="/blog"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>Blog</span>
          </Link>
          <Link
            aria-current={pathname.startsWith("/knowledge-base") ? "page" : undefined}
            className={`gx-nav-mobile-item ${pathname.startsWith("/knowledge-base") ? "is-active" : ""}`}
            href="/knowledge-base"
            onClick={() => setMenuOpen(false)}
            prefetch={false}
          >
            <span>Knowledge base</span>
          </Link>

          <div className="gx-site-nav-mobile-actions">
            {userSession?.authenticated ? (
              <div className="gx-nav-mobile-profile-stack">
                <div className="gx-profile-menu-card">
                  <span className="gx-profile-pill-badge is-menu">{userSession.avatarInitials}</span>
                  <div className="gx-profile-menu-card-copy">
                    <strong>{userSession.primaryTitle}</strong>
                    <span>{userSession.subtitle}</span>
                  </div>
                </div>
                <div className="gx-nav-mobile-profile-links">
                  <Link className="gx-nav-agency" href={userSession.dashboardHref} onClick={() => setMenuOpen(false)} prefetch={false}>
                    <LayoutDashboard size={16} />
                    <span>Open dashboard</span>
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link className="gx-nav-mobile-profile-sublink" href={userSession.settingsHref} onClick={() => setMenuOpen(false)} prefetch={false}>
                    <Settings size={15} />
                    <span>Settings &amp; Preferences</span>
                  </Link>
                  <a className="gx-nav-mobile-profile-sublink" href={`https://wa.me/${userSession.whatsappPhone}`} target="_blank" rel="noreferrer">
                    <MessageCircle size={15} />
                    <span>WhatsApp Support (+{userSession.whatsappPhone})</span>
                  </a>
                  <a className="gx-nav-mobile-profile-signout" href="/api/auth/logout">
                    <LogOut size={15} />
                    <span>Sign out</span>
                  </a>
                </div>
              </div>
            ) : (
              <>
                {!isLoginPage && (
                  <a
                    className="gx-nav-login"
                    href="https://app.gigxomi.com/login"
                    rel="nofollow"
                    onClick={() => setMenuOpen(false)}
                  >
                    <CircleUserRound size={17} />
                    <span>Login</span>
                  </a>
                )}
                {!isSignupPage && (
                  <a className="gx-nav-agency" href="https://app.gigxomi.com/signup?role=agency" onClick={() => setMenuOpen(false)}>
                    <span>Start free workspace</span>
                    <ArrowUpRight size={17} />
                  </a>
                )}
              </>
            )}
          </div>
        </nav>

        <div className="gx-header-actions">
          {userSession?.authenticated ? (
            <div className="gx-header-profile-wrap" ref={profileMenuRef}>
              <button
                type="button"
                aria-expanded={profileOpen}
                aria-haspopup="true"
                aria-label={`Logged in as ${userSession.primaryTitle}`}
                className={`gx-header-profile-pill ${profileOpen ? "is-open" : ""}`}
                onClick={() => setProfileOpen((prev) => !prev)}
              >
                <span className="gx-profile-pill-badge">{userSession.avatarInitials}</span>
                <span className="gx-profile-pill-copy">
                  <strong className="gx-profile-pill-title">{userSession.primaryTitle}</strong>
                  <span className="gx-profile-pill-subtitle">{userSession.subtitle}</span>
                </span>
                <ChevronDown
                  size={14}
                  className={`gx-profile-pill-chevron ${profileOpen ? "is-open" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {profileOpen && (
                <div className="gx-header-profile-menu" role="menu">
                  <div className="gx-profile-menu-card">
                    <span className="gx-profile-pill-badge is-menu">{userSession.avatarInitials}</span>
                    <div className="gx-profile-menu-card-copy">
                      <strong>{userSession.primaryTitle}</strong>
                      <span>{userSession.subtitle}</span>
                    </div>
                  </div>

                  <div className="gx-profile-menu-divider" />

                  <Link
                    href={userSession.dashboardHref}
                    role="menuitem"
                    className="gx-profile-menu-link"
                    onClick={() => setProfileOpen(false)}
                    prefetch={false}
                  >
                    <span className="gx-profile-menu-icon">
                      <LayoutDashboard size={15} />
                    </span>
                    <div className="gx-profile-menu-text">
                      <strong>Dashboard</strong>
                      <span>Overview &amp; operational stats</span>
                    </div>
                  </Link>

                  <Link
                    href={userSession.settingsHref}
                    role="menuitem"
                    className="gx-profile-menu-link"
                    onClick={() => setProfileOpen(false)}
                    prefetch={false}
                  >
                    <span className="gx-profile-menu-icon">
                      <Settings size={15} />
                    </span>
                    <div className="gx-profile-menu-text">
                      <strong>Settings</strong>
                      <span>Preferences &amp; system config</span>
                    </div>
                  </Link>

                  <a
                    href={`https://wa.me/${userSession.whatsappPhone}`}
                    role="menuitem"
                    target="_blank"
                    rel="noreferrer"
                    className="gx-profile-menu-link is-support"
                    onClick={() => setProfileOpen(false)}
                  >
                    <span className="gx-profile-menu-icon is-whatsapp">
                      <MessageCircle size={15} />
                    </span>
                    <div className="gx-profile-menu-text">
                      <div className="gx-profile-support-head">
                        <strong>Support</strong>
                        <span className="gx-profile-whatsapp-badge">WHATSAPP</span>
                      </div>
                      <span className="gx-profile-whatsapp-num">+{userSession.whatsappPhone}</span>
                    </div>
                  </a>

                  <div className="gx-profile-menu-divider" />

                  <a
                    href="/api/auth/logout"
                    role="menuitem"
                    className="gx-profile-menu-link is-signout"
                    onClick={() => setProfileOpen(false)}
                  >
                    <span className="gx-profile-menu-icon is-signout-icon">
                      <LogOut size={15} />
                    </span>
                    <div className="gx-profile-menu-text">
                      <strong>Sign out</strong>
                    </div>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {!isLoginPage && (
                <a
                  aria-label="Login to Gigxomi"
                  className="gx-header-login"
                  href="https://app.gigxomi.com/login"
                  rel="nofollow"
                >
                  <CircleUserRound size={17} strokeWidth={1.9} />
                  <span>Login</span>
                </a>
              )}
              {!isSignupPage && (
                <a className="gx-header-primary" href="https://app.gigxomi.com/signup?role=agency">
                  <span>Start free workspace</span>
                  <ArrowUpRight className="gx-header-primary-arrow" size={17} strokeWidth={2} />
                </a>
              )}
            </>
          )}
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="gx-nav-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <span className="gx-header-neon-tracker" aria-hidden="true" />
      </div>
      <button
        aria-hidden="true"
        aria-label="Close navigation"
        className={menuOpen ? "gx-site-nav-backdrop is-open" : "gx-site-nav-backdrop"}
        onClick={() => setMenuOpen(false)}
        tabIndex={-1}
        type="button"
      />
    </header>
  );
}
