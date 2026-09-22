"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const SESSION_CHECK_INTERVAL_MS = 60_000;
const AUTH_FREE_PATHS = new Set(["/login", "/signup", "/verify-otp", "/super-admin/login"]);

function shouldSkipSessionCheck(pathname: string | null) {
  if (!pathname) {
    return true;
  }

  if (AUTH_FREE_PATHS.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/api/");
}

function buildLoginRedirect(pathname: string) {
  const search = typeof window === "undefined" ? "" : window.location.search;
  const redirectTo = `${pathname}${search}`;
  const loginPath = pathname.startsWith("/super-admin") ? "/super-admin/login" : "/login";
  const params = new URLSearchParams({ redirectTo });

  return `${loginPath}?${params.toString()}`;
}

export function SessionExpiryRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const isCheckingRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (shouldSkipSessionCheck(pathname)) {
      return undefined;
    }

    let isMounted = true;

    const redirectToLogin = () => {
      if (!isMounted || hasRedirectedRef.current || !pathname) {
        return;
      }

      hasRedirectedRef.current = true;
      router.replace(buildLoginRedirect(pathname));
    };

    const checkSession = async () => {
      if (isCheckingRef.current || hasRedirectedRef.current) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403 || (payload && (payload.authenticated === false || !payload.session?.userId))) {
          redirectToLogin();
        }
      } catch {
        // Network hiccups should not kick a valid user out. The next heartbeat/focus check will retry.
      } finally {
        isCheckingRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkSession();
      }
    };

    const interval = window.setInterval(() => {
      void checkSession();
    }, SESSION_CHECK_INTERVAL_MS);

    window.addEventListener("focus", checkSession);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void checkSession();

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkSession);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router]);

  return null;
}
