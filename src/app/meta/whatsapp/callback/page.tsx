"use client";

import { useEffect, useMemo } from "react";
import { extractMetaEmbeddedSignupData, pickMetaText } from "@/lib/gigxomi/meta-whatsapp-signup";

type CallbackEvent = "FINISH" | "CODE" | "TOKEN" | "CANCEL";

type CallbackSignal = {
  type: "GIGXOMI_WA_EMBEDDED_SIGNUP";
  event: CallbackEvent;
  code?: string;
  accessToken?: string;
  data?: Record<string, string>;
};

const STORAGE_KEY = "gigxomi-meta-whatsapp-signup-result";

function text(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "";
}

function collectParams(input: URLSearchParams) {
  const data: Record<string, string> = {};
  for (const [key, value] of input.entries()) {
    const normalized = text(value);
    if (normalized) {
      data[key] = normalized;
    }
  }
  return data;
}

function buildSignal(searchParams: URLSearchParams, hashParams: URLSearchParams): CallbackSignal {
  const rawData = {
    ...collectParams(searchParams),
    ...collectParams(hashParams),
  };
  const data = extractMetaEmbeddedSignupData(rawData);

  const code = pickMetaText(searchParams.get("code"), hashParams.get("code"), data.code);
  const accessToken = pickMetaText(searchParams.get("access_token"), hashParams.get("access_token"), data.access_token);
  const hasMetaDetails = Boolean(
    data.business_id ||
      data.businessId ||
      data.business_portfolio_id ||
      data.business_manager_id ||
      data.waba_id ||
      data.whatsapp_business_account_id ||
      data.phone_number_id ||
      data.display_phone_number,
  );

  const event: CallbackEvent = hasMetaDetails ? "FINISH" : accessToken ? "TOKEN" : code ? "CODE" : "CANCEL";

  return {
    type: "GIGXOMI_WA_EMBEDDED_SIGNUP",
    event,
    code: code || undefined,
    accessToken: accessToken || undefined,
    data,
  };
}

export default function MetaWhatsAppCallbackPage() {
  const signal = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "");
    return buildSignal(searchParams, hashParams);
  }, []);

  useEffect(() => {
    if (!signal || typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(signal));
    } catch {
      // Ignore storage errors; postMessage can still notify the opener.
    }

    if (window.opener) {
      try {
        window.opener.postMessage(signal, window.location.origin);
      } catch {
        // Ignore postMessage errors and keep the fallback UI visible.
      }

      const closeTimer = window.setTimeout(() => {
        window.close();
      }, 600);

      return () => window.clearTimeout(closeTimer);
    }

    return;
  }, [signal]);

  return (
    <main className="empty-state-shell">
      <section className="empty-state-card">
        <p className="eyebrow">Meta WhatsApp signup</p>
        <h1 className="section-heading">
          {signal?.event === "CANCEL"
            ? "The signup window closed before Gigxomi received the setup details."
            : "Meta signup finished. Return to Gigxomi to continue the official WhatsApp setup."}
        </h1>
        <p className="muted-copy">
          {signal?.event === "CANCEL"
            ? "Go back to the WhatsApp Control page and try the signup again."
            : "If this tab does not close automatically, switch back to the WhatsApp Control page and Gigxomi will finish capturing the returned setup data."}
        </p>
      </section>
    </main>
  );
}
