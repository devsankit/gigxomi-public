"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, unknown>) => void) => void;
    };
  }
}

type RazorpayCheckoutClientProps = {
  intent: string;
  amountInRupees: number;
  packageName: string;
  billingCycle: "MONTHLY" | "YEARLY";
  returnTarget: string;
  prefillPhone?: string;
  prefillEmail?: string;
};

export function RazorpayCheckoutClient({
  intent,
  amountInRupees,
  packageName,
  billingCycle,
  returnTarget,
  prefillPhone = "",
  prefillEmail = "",
}: RazorpayCheckoutClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setScriptLoaded(true);
    }
  }, []);

  async function handlePay() {
    if (!scriptLoaded && typeof window !== "undefined" && !window.Razorpay) {
      setError("Payment gateway is still loading. Please wait a moment.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const orderRes = await fetch("/api/billing/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.ok) {
        throw new Error(orderData.error || "Could not create payment order. Please check Razorpay keys.");
      }

      const { order } = orderData;

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Gigxomi Workspace",
        description: `${packageName} (${billingCycle === "YEARLY" ? "Yearly" : "Monthly"})`,
        image: "https://www.gigxomi.com/icon.png",
        order_id: order.orderId,
        prefill: {
          name: order.prefill?.name || "",
          email: order.prefill?.email || prefillEmail,
          contact: order.prefill?.contact || prefillPhone,
        },
        theme: {
          color: "#b9f719",
          backdrop_color: "#0a0d14",
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          setLoading(true);
          try {
            const verifyRes = await fetch("/api/billing/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                intent,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amountInRupees,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.ok) {
              setSuccess(true);
              setTimeout(() => {
                window.location.href = verifyData.redirectUrl || returnTarget || "/mobile/billing-return?status=success";
              }, 1200);
            } else {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }
          } catch (verifyErr: unknown) {
            setError(verifyErr instanceof Error ? verifyErr.message : "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (failResponse: Record<string, unknown>) {
        const errObj = failResponse?.error as { description?: string } | undefined;
        setError(errObj?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
      />

      {error ? (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          borderColor: "rgba(239, 68, 68, 0.4)",
          borderWidth: 1,
          borderStyle: "solid",
          borderRadius: 12,
          padding: 14,
          color: "#ef4444",
          fontSize: 14,
          marginBottom: 16,
          lineHeight: 1.5,
        }}>
          <strong>Payment Notice:</strong> {error}
        </div>
      ) : null}

      {success ? (
        <div style={{
          backgroundColor: "rgba(185, 247, 25, 0.12)",
          borderColor: "rgba(185, 247, 25, 0.4)",
          borderWidth: 1,
          borderStyle: "solid",
          borderRadius: 12,
          padding: 16,
          color: "#b9f719",
          fontSize: 15,
          fontWeight: "bold",
          marginBottom: 16,
          textAlign: "center",
        }}>
          ✓ Payment Successful! Activating your Agency Premium workspace...
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: "#b9f719",
            color: "#0a0d14",
            fontWeight: "900",
            fontSize: "16px",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s ease",
            marginBottom: "14px",
            boxShadow: "0 4px 14px rgba(185, 247, 25, 0.25)",
          }}
        >
          {loading ? "Connecting to Razorpay..." : `Pay ₹${amountInRupees.toLocaleString("en-IN")} via Razorpay →`}
        </button>
      )}

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        color: "#94a3b8",
        fontSize: "12px",
        marginTop: "8px",
        textAlign: "center",
      }}>
        <span>🔒 256-Bit Encrypted</span>
        <span>•</span>
        <span>UPI / GPay / PhonePe / Cards</span>
        <span>•</span>
        <span>Instant Activation</span>
      </div>
    </>
  );
}
