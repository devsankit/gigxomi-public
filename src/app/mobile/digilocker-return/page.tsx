"use client";

import { useEffect } from "react";

export default function MobileDigiLockerReturnPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("identity") === "verified";
    const link = `gigxomi://onboarding?identity=${success ? "verified" : "failed"}`;
    window.location.assign(link);
  }, []);

  return <main style={{ minHeight: "100vh", background: "#080a09", color: "#f4f7f2", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif" }}><section style={{ maxWidth: 460, textAlign: "center" }}><p style={{ color: "#b9f719", fontWeight: 900, letterSpacing: ".12em" }}>GIGXOMI IDENTITY</p><h1>Return to Gigxomi.</h1><p style={{ color: "#a2aaa2", lineHeight: 1.6 }}>Open the Gigxomi app to continue your freelancer onboarding and see the latest verification status.</p><a href="gigxomi://onboarding" style={{ display: "inline-block", marginTop: 16, borderRadius: 999, background: "#b9f719", color: "#080a09", padding: "13px 20px", textDecoration: "none", fontWeight: 900 }}>Return to Gigxomi</a></section></main>;
}
