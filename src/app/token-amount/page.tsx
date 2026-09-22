import type { Metadata } from "next";
import QRCode from "qrcode";

import { buildUpiPaymentUri, buildWhatsAppHref, getManualUpiAdminConfig } from "@/lib/billing/manual-upi-config-service";
import { TokenOffer } from "./token-offer";
import "./token-amount.css";

const TOKEN_AMOUNT = 2000;

export const metadata: Metadata = {
  title: "Webinar Token Offer",
  description: "Reserve your Gigxomi package for ₹11,999 with a ₹2,000 token payment.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function TokenAmountPage() {
  const paymentConfig = await getManualUpiAdminConfig().catch(() => null);
  const upiId = paymentConfig?.settings.upiId ?? "";
  const payeeName = paymentConfig?.settings.payeeName || "Gigxomi";
  const supportWhatsApp = paymentConfig?.settings.supportWhatsApp ?? "";

  if (!upiId) {
    return (
      <main className="tokenPage tokenUnavailable">
        <div className="unavailableCard">
          <span>Gigxomi webinar offer</span>
          <h1>Payment is temporarily unavailable</h1>
          <p>Our team is updating the secure payment QR. Please contact Gigxomi support to reserve your ₹11,999 offer.</p>
          {supportWhatsApp ? (
            <a href={buildWhatsAppHref({ phone: supportWhatsApp, message: "Hi Gigxomi team, I want to reserve the ₹11,999 webinar offer with the ₹2,000 token amount." })}>
              Contact support
            </a>
          ) : null}
        </div>
      </main>
    );
  }

  const upiUri = buildUpiPaymentUri({
    amount: TOKEN_AMOUNT,
    currency: "INR",
    note: "Gigxomi webinar package token",
    payeeName,
    upiId,
  });
  const qrDataUrl = await QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 600,
    color: {
      dark: "#17131f",
      light: "#ffffff",
    },
  });
  const whatsappHref = supportWhatsApp
    ? buildWhatsAppHref({
        phone: supportWhatsApp,
        message: "Hi Gigxomi team, I paid the ₹2,000 token amount for the ₹11,999 webinar package offer. I am sharing my payment screenshot/UTR for confirmation.",
      })
    : "";

  return <TokenOffer payeeName={payeeName} qrDataUrl={qrDataUrl} upiId={upiId} upiUri={upiUri} whatsappHref={whatsappHref} />;
}
