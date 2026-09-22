"use client";

import { useState } from "react";
import { Clipboard, MessageCircle } from "lucide-react";

export function ManualUpiPaymentActions({
  upiId,
  whatsappHref,
}: {
  upiId: string;
  whatsappHref: string;
}) {
  const [copied, setCopied] = useState<"upi" | null>(null);

  async function copy(value: string, key: "upi") {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="manual-upi-actions">
      <button className="primary-button" onClick={() => copy(upiId, "upi")} type="button">
        <Clipboard size={15} strokeWidth={1.9} />
        {copied === "upi" ? "UPI copied" : "Copy UPI ID"}
      </button>
      {whatsappHref ? (
        <a className="secondary-button" href={whatsappHref} rel="noreferrer" target="_blank">
          <MessageCircle size={15} strokeWidth={1.9} />
          Send screenshot on WhatsApp
        </a>
      ) : null}
    </div>
  );
}
