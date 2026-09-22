"use client";

import { useEffect } from "react";

function canBootstrapWebPush() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_BOOTSTRAP_ENABLED !== "0";
}

export function WebPushBootstrap() {
  useEffect(() => {
    let stopped = false;
    let unsubscribeForegroundListener: (() => void) | undefined;

    const run = async () => {
      if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
      }
      if (!canBootstrapWebPush()) {
        return;
      }
      if (Notification.permission !== "granted") {
        return;
      }

      const { startWebPushNotifications } = await import("@/lib/web-push/client-registration");
      const result = await startWebPushNotifications({
        requestPermission: false,
        showForegroundNotification: true,
      });

      if (!stopped && result.ok) {
        unsubscribeForegroundListener = result.unsubscribe;
        console.info("Web push token registered.");
      } else {
        console.warn("Web push token not available.", result.status);
      }
    };

    void run().catch((error) => {
      console.error("Web push bootstrap failed:", error);
    });

    return () => {
      stopped = true;
      unsubscribeForegroundListener?.();
    };
  }, []);

  return null;
}
