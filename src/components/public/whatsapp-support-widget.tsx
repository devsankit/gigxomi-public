import { MessageCircle } from "lucide-react";

import { publicSupportWhatsApp } from "@/lib/seo/public-support-contact";

export function WhatsAppSupportWidget() {
  return (
    <a
      aria-label={`Chat with Gigxomi support on WhatsApp at ${publicSupportWhatsApp.display}`}
      className="gx-whatsapp-support-widget"
      href={publicSupportWhatsApp.href}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircle aria-hidden="true" size={21} />
      <span><strong>WhatsApp support</strong><small>{publicSupportWhatsApp.display}</small></span>
    </a>
  );
}
