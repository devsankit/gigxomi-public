"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

export function FreelancerOnboardingGate({ children, bypass = false, enabled = true }: { children: ReactNode; bypass?: boolean; enabled?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [accessGranted, setAccessGranted] = useState(false);
  const [gateError, setGateError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const bypassGate = !enabled || bypass;
  const onboardingScreen = pathname === "/freelancer/onboarding";

  useEffect(() => {
    if (bypassGate || onboardingScreen || accessGranted) return;
    if (typeof window !== "undefined") {
      if (document.cookie.includes("gx_freelancer_skipped=1") || localStorage.getItem("gx_freelancer_onboarding_skipped") === "1") {
        setAccessGranted(true);
        return;
      }
    }
    let active = true;
    fetch("/api/freelancer/onboarding", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error || "Unable to verify onboarding status.");
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        const isCompletedOrSkipped = payload?.ok && (payload.onboarding?.completed || payload.onboarding?.skipped || payload.onboarding?.status === "SKIPPED");
        if (isCompletedOrSkipped) {
          setAccessGranted(true);
        } else {
          router.replace("/freelancer/onboarding");
        }
      })
      .catch((error) => {
        if (active) setGateError(error instanceof Error ? error.message : "Unable to verify onboarding status.");
      });
    return () => { active = false; };
  }, [accessGranted, bypassGate, onboardingScreen, retryKey, router]);

  if (!bypassGate && !onboardingScreen && !accessGranted) return <div aria-busy={!gateError} style={{ minHeight: "100vh", background: "#080a09", color: "#f4f7f2", display: "grid", placeItems: "center", padding: 24 }}><div style={{ maxWidth: 420, textAlign: "center" }}>{gateError ? <><p>{gateError}</p><button onClick={() => { setGateError(""); setRetryKey((value) => value + 1); }} style={{ background: "#b9f719", border: 0, borderRadius: 999, color: "#080a09", cursor: "pointer", fontWeight: 800, padding: "12px 20px" }} type="button">Try again</button></> : <p>Checking your editor onboarding…</p>}</div></div>;
  return children;
}
