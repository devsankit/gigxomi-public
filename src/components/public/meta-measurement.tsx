"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { hasMetaConsent, META_CONSENT_COOKIE, publicMetaUrl } from "@/lib/meta/conversion-contract";

function subscribe(onChange: () => void) {
  window.addEventListener("meta-preferences", onChange);
  window.addEventListener("popstate", onChange);
  return () => { window.removeEventListener("meta-preferences", onChange); window.removeEventListener("popstate", onChange); };
}
function browserPreferences() {
  const optedOut = navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  const choice = optedOut ? "denied" : hasMetaConsent(document.cookie) ? "granted" : document.cookie.includes(`${META_CONSENT_COOKIE}=denied`) ? "denied" : "";
  return `${Boolean(publicMetaUrl(window.location.href))}|${choice}`;
}
const initializedPixels = new Set<string>();

export function MetaMeasurement() {
  const [datasetId, setDatasetId] = useState("");
  const pathname = usePathname();
  const snapshot = useSyncExternalStore(subscribe, browserPreferences, () => "false|");
  const [eligible, choice] = snapshot.split("|");
  const [visible, setVisible] = useState(false);
  const allowed = eligible === "true" && /^\d+$/.test(datasetId);
  const showPrompt = visible || !choice;

  useEffect(() => {
    // Runtime switch: never bake a secret or stale activation flag into ISR pages.
    let active = true;
    void fetch("/api/meta/conversions", { cache: "no-store" }).then((response) => response.json()).then((config) => {
      if (active) setDatasetId(typeof config.datasetId === "string" ? config.datasetId : "");
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!allowed || choice !== "granted") { window.fbq?.("consent", "revoke"); return; }
    const url = publicMetaUrl(window.location.href);
    if (!url) return;
    if (!window.fbq) {
      type Queue = ((...args: unknown[]) => void) & { queue: unknown[][]; callMethod?: (...args: unknown[]) => void; push?: Queue; loaded?: boolean; version?: string };
      const queue: Queue = Object.assign((...args: unknown[]) => { if (queue.callMethod) queue.callMethod(...args); else queue.queue.push(args); }, { queue: [] as unknown[][] });
      queue.push = queue; queue.loaded = true; queue.version = "2.0";
      window.fbq = queue;
      (window as Window & { _fbq?: Queue })._fbq = queue;
      const script = document.createElement("script"); script.src = "https://connect.facebook.net/en_US/fbevents.js"; script.async = true;
      document.head.appendChild(script);
    }
    if (!initializedPixels.has(datasetId)) {
      window.fbq("set", "autoConfig", false, datasetId);
      window.fbq("init", datasetId);
      initializedPixels.add(datasetId);
    }
    window.fbq("consent", "grant");
    const eventId = `pv_${crypto.randomUUID()}`;
    window.fbq("trackSingle", datasetId, "PageView", {}, { eventID: eventId });
    void fetch("/api/meta/conversions", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName: "PageView", eventId, eventSourceUrl: url }) }).catch(() => undefined);
    return () => { window.fbq?.("consent", "revoke"); };
  }, [allowed, choice, datasetId, pathname]);

  function choose(value: "granted" | "denied") {
    document.cookie = `${META_CONSENT_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax; Secure`;
    window.dispatchEvent(new Event("meta-preferences")); setVisible(false);
    if (value === "denied") {
      window.fbq?.("consent", "revoke");
      for (const name of ["_fbp", "_fbc"]) {
        document.cookie = `${name}=; Path=/; Max-Age=0; Secure`;
        document.cookie = `${name}=; Path=/; Max-Age=0; Domain=.gigxomi.com; Secure`;
      }
    }
  }
  if (!allowed) return null;
  return <aside aria-label="Marketing measurement preferences" style={{ position: "fixed", bottom: 12, left: 12, zIndex: 90, maxWidth: 350, padding: showPrompt ? 16 : 6, background: "#12161c", color: "#fff", border: "1px solid #667", borderRadius: 12 }}>
    {showPrompt ? <><p style={{ margin: "0 0 12px" }}>Allow Meta marketing measurement? With your permission, we share page visits, registration events and hashed contact details with Meta to measure our marketing. No chat content is shared. <a href="https://www.gigxomi.com/privacy-policy" style={{ textDecoration: "underline" }}>Privacy policy</a></p>
      <button type="button" onClick={() => choose("granted")} style={{ padding: 8, marginRight: 12 }}>Allow</button><button type="button" onClick={() => choose("denied")} style={{ padding: 8 }}>Decline</button></>
      : <button type="button" onClick={() => setVisible(true)}>Marketing preferences</button>}
  </aside>;
}
