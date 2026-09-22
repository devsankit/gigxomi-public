"use client";

import Image from "next/image";
import { Check, Clipboard, Clock3, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const OFFER_DURATION_MS = 30 * 60 * 1000;
const STORAGE_KEY = "gigxomi-token-offer-expires-at";

function getOrCreateExpiry() {
  const now = Date.now();
  const saved = Number(window.localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(saved) && saved > 0 && saved <= now + OFFER_DURATION_MS) {
    return saved;
  }

  const expiry = now + OFFER_DURATION_MS;
  window.localStorage.setItem(STORAGE_KEY, String(expiry));
  return expiry;
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TokenOffer({
  payeeName,
  qrDataUrl,
  upiId,
  upiUri,
  whatsappHref,
}: {
  payeeName: string;
  qrDataUrl: string;
  upiId: string;
  upiUri: string;
  whatsappHref: string;
}) {
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      setExpiresAt(getOrCreateExpiry());
      setNow(Date.now());
    }, 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(initialize);
      window.clearInterval(interval);
    };
  }, []);

  const remaining = expiresAt === null ? OFFER_DURATION_MS : Math.max(0, expiresAt - now);
  const expired = expiresAt !== null && remaining <= 0;
  const timer = useMemo(() => formatTime(remaining), [remaining]);

  async function copyUpiId() {
    await navigator.clipboard.writeText(upiId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="tokenPage">
      <div className="tokenGlow tokenGlowOne" />
      <div className="tokenGlow tokenGlowTwo" />

      <div aria-label="Payment security" className="tokenHeader" role="status">
        <div className="tokenBrand">
          <ShieldCheck aria-hidden="true" size={18} />
          <span>Payment details</span>
        </div>
        <div className="secureBadge">
          <ShieldCheck aria-hidden="true" size={17} />
          Secure UPI payment
        </div>
      </div>

      <section className="tokenHero">
        <div className="tokenCopy">
          <div className="webinarBadge">
            <span />
            Webinar-only offer
          </div>
          <h1>Reserve your package with just <em>₹2,000</em></h1>
          <p className="tokenLead">
            Lock in the special price today. Your ₹2,000 token amount will be adjusted against the final package price.
          </p>

          <div className="offerPriceCard">
            <div>
              <span className="priceLabel">Original package price</span>
              <span className="originalPrice">₹17,700</span>
            </div>
            <div className="priceDivider" />
            <div>
              <span className="priceLabel">Webinar offer price</span>
              <strong>₹11,999</strong>
            </div>
            <span className="savingsPill">Save ₹5,701</span>
          </div>

          <div className={`timerCard${expired ? " timerExpired" : ""}`} aria-live="polite">
            <Clock3 aria-hidden="true" size={26} />
            <div>
              <span>{expired ? "Offer window ended" : "Complete your token payment within"}</span>
              <strong>{expired ? "00:00" : timer}</strong>
            </div>
            <small>{expired ? "Please contact our team for availability." : "Minutes : Seconds"}</small>
          </div>

          <ul className="tokenBenefits">
            <li><Check aria-hidden="true" size={18} /> Locks your ₹11,999 offer price</li>
            <li><Check aria-hidden="true" size={18} /> Token adjusted in the final payment</li>
            <li><Check aria-hidden="true" size={18} /> Instant confirmation on WhatsApp</li>
          </ul>
        </div>

        <div className="paymentCard">
          <div className="paymentCardTop">
            <div>
              <span>Token amount</span>
              <strong>₹2,000</strong>
            </div>
            <div className="phonePeBadge">PhonePe</div>
          </div>

          <div className={`qrFrame${expired ? " qrExpired" : ""}`}>
            <div className="qrCorner qrCornerTl" />
            <div className="qrCorner qrCornerTr" />
            <div className="qrCorner qrCornerBl" />
            <div className="qrCorner qrCornerBr" />
            <Image alt="PhonePe UPI QR code for ₹2,000 token payment" height={300} priority src={qrDataUrl} unoptimized width={300} />
            {expired ? <div className="expiredOverlay">Offer expired</div> : null}
          </div>

          <div className="scanPrompt">
            <Smartphone aria-hidden="true" size={20} />
            <div>
              <strong>Scan using PhonePe</strong>
              <span>Amount is fixed at ₹2,000</span>
            </div>
          </div>

          <div className="payeeLine">
            <span>Paying to</span>
            <strong>{payeeName}</strong>
          </div>

          {!expired ? (
            <>
              <a className="openUpiButton" href={upiUri}>
                Pay ₹2,000 now
              </a>
              <button className="copyButton" onClick={copyUpiId} type="button">
                {copied ? <Check aria-hidden="true" size={17} /> : <Clipboard aria-hidden="true" size={17} />}
                {copied ? "UPI ID copied" : "Copy UPI ID"}
              </button>
            </>
          ) : (
            <a className="openUpiButton supportButton" href={whatsappHref} rel="noreferrer" target="_blank">
              <MessageCircle aria-hidden="true" size={18} />
              Contact the team
            </a>
          )}

          <p className="paymentNote">
            After payment, send your screenshot or UTR on WhatsApp for confirmation.
          </p>

          {whatsappHref ? (
            <a className="whatsappLink" href={whatsappHref} rel="noreferrer" target="_blank">
              <MessageCircle aria-hidden="true" size={18} />
              Send payment screenshot
            </a>
          ) : null}
        </div>
      </section>

      <footer className="tokenFooter">
        <ShieldCheck aria-hidden="true" size={15} /> Your payment is processed securely through UPI.
      </footer>
    </main>
  );
}
