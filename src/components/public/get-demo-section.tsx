"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";

type DemoFormStatus = {
  message: string;
  state: "idle" | "submitting" | "success" | "error";
};

export function GetDemoSection() {
  const [status, setStatus] = useState<DemoFormStatus>({ message: "", state: "idle" });

  async function submitDemoRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!email && !phone) {
      setStatus({ message: "Please add an email or WhatsApp number.", state: "error" });
      return;
    }

    setStatus({ message: "", state: "submitting" });

    try {
      const response = await fetch("/api/demo-requests", {
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean };

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "We could not submit your request. Please try again.");
      }

      form.reset();
      setStatus({ message: "Thanks — your demo request is saved. The Gigxomi team will contact you shortly.", state: "success" });
    } catch (error) {
      setStatus({ message: error instanceof Error ? error.message : "We could not submit your request. Please try again.", state: "error" });
    }
  }

  return (
    <section aria-labelledby="gx-demo-title" className="gx-v3-demo" id="get-demo">
      <div className="gx-v3-demo-copy">
        <p className="gx-v3-kicker">See Gigxomi in action</p>
        <h2 id="gx-demo-title">Get a practical platform demo.</h2>
        <p>Tell us how your editing business works today. We will show you the most useful Gigxomi workflow for leads, editors, delivery, reviews, or payouts.</p>
        <div className="gx-v3-demo-points">
          <span><BadgeCheck size={15} /> Product walkthrough</span>
          <span><MessageCircle size={15} /> WhatsApp follow-up</span>
          <span><ShieldCheck size={15} /> No payment required</span>
        </div>
      </div>

      <form className="gx-v3-demo-form" onSubmit={submitDemoRequest}>
        <div className="gx-v3-demo-row">
          <label><span>Name</span><input autoComplete="name" name="name" placeholder="Your name" required type="text" /></label>
          <label><span>Business / agency</span><input autoComplete="organization" name="businessName" placeholder="Business name (optional)" type="text" /></label>
        </div>
        <div className="gx-v3-demo-row">
          <label><span>Email</span><input autoComplete="email" name="email" placeholder="you@company.com" type="email" /></label>
          <label><span>WhatsApp number</span><input autoComplete="tel" inputMode="tel" name="phone" placeholder="+91..." type="tel" /></label>
        </div>
        <label><span>What would you like to see?</span><textarea name="message" placeholder="Lead management, editor workflow, delivery review..." rows={3} /></label>
        <label aria-hidden="true" className="gx-v3-demo-honeypot"><span>Website</span><input autoComplete="off" name="website" tabIndex={-1} type="text" /></label>
        <button className="gx-v3-button gx-v3-button-primary gx-v3-demo-submit" disabled={status.state === "submitting"} type="submit">
          {status.state === "submitting" ? "Submitting..." : "Submit Demo Request"}<ArrowRight size={16} />
        </button>
        {status.message ? <p className={`gx-v3-demo-status is-${status.state}`} role="status">{status.message}</p> : null}
      </form>
    </section>
  );
}
