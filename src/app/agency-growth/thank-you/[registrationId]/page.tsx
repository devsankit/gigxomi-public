import type { Metadata } from "next";
import { AlertCircle, CalendarClock, CheckCircle2, MessageCircle, Radio, Users } from "lucide-react";

import { GAPP_SUPPORT_PHONE, getGappRegistrationForThankYou, getPublicGappLinks } from "@/lib/gigxomi/gapp-webinar-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GAPP Registration Status",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(value);
}

export default async function GappThankYouPage({ params }: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await params;
  const result = await getGappRegistrationForThankYou(registrationId);
  const links = getPublicGappLinks();

  if (!result) {
    return (
      <main className="gapp-thank-you-page">
        <section className="gapp-thank-you-card">
          <AlertCircle size={38} strokeWidth={1.8} />
          <h1>Registration not found</h1>
          <p>Please check your payment return link or contact WhatsApp support: {GAPP_SUPPORT_PHONE}</p>
        </section>
      </main>
    );
  }

  const { canJoin, registration } = result;
  const payment = registration.payments[0] ?? null;

  return (
    <main className="gapp-thank-you-page">
      <section className="gapp-thank-you-card">
        {canJoin ? <CheckCircle2 size={42} strokeWidth={1.8} /> : <AlertCircle size={42} strokeWidth={1.8} />}
        <p className="gapp-eyebrow">{canJoin ? "Registration successful" : "Payment status pending"}</p>
        <h1>{canJoin ? "You are registered for the GAPP webinar." : "Your seat is not unlocked yet."}</h1>
        <p>
          {canJoin
            ? "Join the official WhatsApp spaces below. Webinar reminders and follow-up messages will be scheduled from the registration list."
            : "If your payment was deducted, wait a moment and refresh this page. The joining links unlock only after successful registration/payment."}
        </p>

        <div className="gapp-thank-you-details">
          <div>
            <CalendarClock size={18} strokeWidth={1.8} />
            <span>{formatDateTime(registration.webinar.scheduledAt)}</span>
          </div>
          <div>
            <MessageCircle size={18} strokeWidth={1.8} />
            <span>WhatsApp support: {GAPP_SUPPORT_PHONE}</span>
          </div>
          {payment ? (
            <div>
              <CheckCircle2 size={18} strokeWidth={1.8} />
              <span>Payment status: {payment.status}</span>
            </div>
          ) : null}
        </div>

        {canJoin ? (
          <div className="gapp-join-grid">
            {registration.webinar.meetingLink ? (
              <a className="gapp-join-card" href={registration.webinar.meetingLink} rel="noreferrer" target="_blank">
                <Radio size={22} strokeWidth={1.8} />
                <strong>Webinar Meeting Link</strong>
                <span>Open webinar room</span>
              </a>
            ) : null}
            <a className="gapp-join-card" href={links.channelUrl} rel="noreferrer" target="_blank">
              <MessageCircle size={22} strokeWidth={1.8} />
              <strong>WhatsApp Channel</strong>
              <span>Join official updates</span>
            </a>
            <a className="gapp-join-card" href={links.communityUrl} rel="noreferrer" target="_blank">
              <Users size={22} strokeWidth={1.8} />
              <strong>Community Link</strong>
              <span>Join attendee community</span>
            </a>
          </div>
        ) : (
          <div className="gapp-payment-pending-panel">
            <strong>Joining links are hidden until payment is successful.</strong>
            <span>Support: {GAPP_SUPPORT_PHONE}</span>
          </div>
        )}
      </section>
    </main>
  );
}
