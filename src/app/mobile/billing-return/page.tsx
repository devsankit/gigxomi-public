import Link from "next/link";

export default function MobileBillingReturnPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#05070a", color: "#f6f7f8" }}>
      <section style={{ width: "min(100%, 520px)", padding: 28, border: "1px solid #273119", borderRadius: 24, background: "#0d1218" }}>
        <p style={{ color: "#b7ff16", fontWeight: 800, textTransform: "uppercase" }}>Gigxomi · Payment status</p>
        <h1>Return to Gigxomi</h1>
        <p style={{ color: "#a6adb7", lineHeight: 1.6 }}>Your plan is activated only after Gigxomi verifies payment with PhonePe. Open the app and refresh payment status. If you closed checkout without paying, your plan has not changed.</p>
        <p><a href="gigxomi://mobile/billing-return" style={{ display: "block", padding: 14, borderRadius: 14, background: "#b7ff16", color: "#071000", fontWeight: 800, textAlign: "center", textDecoration: "none" }}>Open Gigxomi app</a></p>
        <p><Link href="/pricing" style={{ color: "#f6f7f8" }}>Continue on the web</Link></p>
      </section>
    </main>
  );
}
