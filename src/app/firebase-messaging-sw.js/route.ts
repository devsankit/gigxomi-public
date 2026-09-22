import { NextResponse } from "next/server";
import { readFirebaseWebRuntimeConfig } from "@/lib/web-push/runtime-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function quoteJs(value: string) {
  return JSON.stringify(value);
}

export async function GET() {
  const config = readFirebaseWebRuntimeConfig();

  const script = `
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: ${quoteJs(config.apiKey)},
  appId: ${quoteJs(config.appId)},
  authDomain: ${quoteJs(config.authDomain)},
  messagingSenderId: ${quoteJs(config.messagingSenderId)},
  projectId: ${quoteJs(config.projectId)},
  storageBucket: ${quoteJs(config.storageBucket)},
});

const messaging = firebase.messaging();

function getDeepLink(payload) {
  return payload?.data?.deepLinkUrl || payload?.data?.link || payload?.fcmOptions?.link || "/";
}

function getNotificationTag(payload) {
  if (payload?.data?.tag) {
    return payload.data.tag;
  }
  if (payload?.data?.conversationId) {
    return "gigxomi-chat-" + payload.data.conversationId;
  }
  return "gigxomi-update";
}

messaging.onBackgroundMessage(function (payload) {
  const title = payload?.notification?.title || "Gigxomi update";
  const options = {
    body: payload?.notification?.body || "You have a new notification.",
    icon: "/gigxomi-logo.png",
    badge: "/gigxomi-logo.png",
    data: {
      ...(payload?.data || {}),
      deepLinkUrl: getDeepLink(payload),
    },
    tag: getNotificationTag(payload),
    renotify: true,
    requireInteraction: true,
    timestamp: Date.now(),
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const deepLink = new URL(event.notification?.data?.deepLinkUrl || "/", self.location.origin).toString();
  event.waitUntil((async function () {
    const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    const exactClient = windowClients.find(function (client) {
      return client.url.split("#")[0] === deepLink.split("#")[0];
    });
    if (exactClient) {
      await exactClient.focus();
      exactClient.postMessage({ type: "GIGXOMI_NOTIFICATION_CLICK", deepLinkUrl: deepLink });
      return;
    }

    for (const client of windowClients) {
      try {
        if ("focus" in client && new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) {
            return client.navigate(deepLink);
          }
          return;
        }
      } catch {
        // Ignore malformed client URLs.
      }
    }
    return clients.openWindow(deepLink);
  })());
});
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

