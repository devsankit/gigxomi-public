"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function Submit({ oneTime, collect }: { oneTime: boolean; collect: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} type="submit">{pending ? "Opening secure checkout…" : oneTime ? "Pay once with PhonePe" : collect ? "Send UPI approval request" : "Open PhonePe / UPI Intent"}</button>;
}

export function GatewayCheckoutForm({ intent, coupon, autopay, oneTime, preferOneTime, cycle }: {
  intent: string; coupon: string; autopay: boolean; oneTime: boolean; preferOneTime: boolean; cycle: string;
}) {
  const [kind, setKind] = useState(oneTime && (preferOneTime || !autopay) ? "ONE_TIME" : "AUTOPAY");
  const [mode, setMode] = useState("UPI_INTENT");
  return <form action="/api/billing/checkout/confirm" method="post">
    <input name="intent" type="hidden" value={intent} />
    <label>How would you like to pay?
      <select name="paymentKind" value={kind} onChange={(event) => setKind(event.target.value)}>
        {autopay ? <option value="AUTOPAY">AutoPay — automatic renewal</option> : null}
        {oneTime ? <option value="ONE_TIME">Pay once — no automatic renewal</option> : null}
      </select>
    </label>
    {kind === "ONE_TIME" ? <p className="gx-checkout-disclosure">Pay for one {cycle === "YEARLY" ? "year" : "month"}. No mandate or automatic debit. PhonePe provides available UPI apps and its secure QR option; Gigxomi confirms payment automatically with the gateway.</p> : <>
      <p className="gx-checkout-disclosure">Authorize recurring payments for your selected billing cycle. Cancelling stops future renewals; access continues for your paid period.</p>
      <label>Payment method<select name="paymentMode" value={mode} onChange={(event) => setMode(event.target.value)}><option value="UPI_INTENT">PhonePe / UPI app</option><option value="UPI_COLLECT">UPI ID Collect fallback</option></select></label>
      {mode === "UPI_COLLECT" ? <label>UPI ID<input required autoCapitalize="none" autoCorrect="off" name="upiVpa" placeholder="name@bank" /></label> : null}
    </>}
    <label>Coupon (optional)<input autoCapitalize="characters" defaultValue={coupon} name="couponCode" maxLength={32} placeholder="Enter your offer code" /></label>
    <Submit oneTime={kind === "ONE_TIME"} collect={mode === "UPI_COLLECT"} />
    <small>Premium activates only after PhonePe confirms payment. Opening or closing this page does not activate your plan.</small>
  </form>;
}
