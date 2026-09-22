"use client";

import { useEffect, useState } from "react";

import { StatusPill, SurfaceCard } from "@/components/ui/dashboard-primitives";

type PublicAuthIntent = {
  id: string;
  flow: "LOGIN" | "SIGNUP";
  status: "PENDING_WHATSAPP" | "OTP_ISSUED" | "PENDING_SUBSCRIPTION" | "VERIFIED" | "EXPIRED" | "SUPERSEDED";
  displayName: string | null;
  phone: string;
  email: string | null;
  packageId: string | null;
  challengeId: string | null;
  challengeIssuedAt: string | null;
  updatedAt: string;
  createdAt: string;
  redirectTo: string | null;
  userId: string | null;
};

function formatIntentStage(intent: PublicAuthIntent) {
  if (intent.status === "PENDING_WHATSAPP") return "Pending WhatsApp";
  if (intent.status === "OTP_ISSUED") return "Pending OTP";
  if (intent.status === "PENDING_SUBSCRIPTION") return "Pending Subscription";
  if (intent.status === "VERIFIED") return "Verified";
  if (intent.status === "EXPIRED") return "Expired";
  return "Superseded";
}

function formatIntentTimestamp(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return "Unknown number";
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return value.trim().startsWith("+") ? value.trim() : `+${digits}`;
}

export function SuperAdminWhatsAppOtpRequests() {
  const [intents, setIntents] = useState<PublicAuthIntent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/super-admin/whatsapp-otp-intents?limit=10", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          intents?: PublicAuthIntent[];
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || payload.ok === false) {
          setError(payload.error ?? "Unable to load recent OTP requests right now.");
          setIntents([]);
          return;
        }

        setIntents(Array.isArray(payload.intents) ? payload.intents : []);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setError("Unable to load recent OTP requests right now.");
        setIntents([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SurfaceCard>
      <div className="board-header">
        <div>
          <p className="section-label">Recent OTP requests</p>
          <h2 className="app-section-title">
            Super admin can audit every OTP request with the real requester identity, contact details, and current status without blocking the main WhatsApp Control route.
          </h2>
        </div>
        <StatusPill>{intents === null ? "Loading" : `${intents.length} recent`}</StatusPill>
      </div>

      <div className="otp-request-table-wrap">
        {intents === null ? (
          <div className="brief-card">
            <span className="meta-pill">Loading</span>
            <strong>Recent OTP requests are loading.</strong>
            <p className="muted-copy">The WhatsApp control workspace now opens first and fills the audit table after.</p>
          </div>
        ) : error ? (
          <div className="brief-card">
            <span className="meta-pill">Temporarily unavailable</span>
            <strong>Recent OTP requests could not be loaded.</strong>
            <p className="muted-copy">{error}</p>
          </div>
        ) : intents.length ? (
          <table className="otp-request-table">
            <thead>
              <tr>
                <th>Flow</th>
                <th>Requester</th>
                <th>Contact</th>
                <th>OTP state</th>
                <th>Timeline</th>
                <th>Routing</th>
              </tr>
            </thead>
            <tbody>
              {intents.map((intent) => (
                <tr key={intent.id}>
                  <td>
                    <div className="otp-request-stack">
                      <StatusPill>{formatIntentStage(intent)}</StatusPill>
                      <strong>{intent.flow === "SIGNUP" ? "Signup" : "Login"}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="otp-request-stack">
                      <strong>{intent.displayName || "Name not submitted yet"}</strong>
                      <span>{formatPhoneNumber(intent.phone)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="otp-request-stack">
                      <strong>{intent.email || "WhatsApp-only request"}</strong>
                      <span>{intent.packageId ? `Package ${intent.packageId}` : "No package selected"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="otp-request-stack">
                      <strong>{formatIntentStage(intent)}</strong>
                      <span>{intent.challengeIssuedAt ? `Issued ${formatIntentTimestamp(intent.challengeIssuedAt)}` : "No code sent yet"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="otp-request-stack">
                      <strong>Updated {formatIntentTimestamp(intent.updatedAt)}</strong>
                      <span>Created {formatIntentTimestamp(intent.createdAt)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="otp-request-stack">
                      <strong>{intent.redirectTo || "/"}</strong>
                      <span>{intent.userId ? `Linked user ${intent.userId}` : "No linked user yet"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="brief-card">
            <span className="meta-pill">No activity yet</span>
            <strong>The public OTP channel has no matching intents yet.</strong>
            <p className="muted-copy">Website login or signup must start first, then users send Get OTP from the same WhatsApp number.</p>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}
