import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import type { Prisma } from "@prisma/client";

import { ManualUpiPaymentActions } from "@/components/billing/manual-upi-payment-actions";
import { PublicShell } from "@/components/public/public-shell";
import { getSessionContext } from "@/lib/auth/session";
import { getManualUpiFallbackPaymentById } from "@/lib/billing/manual-upi-fallback-store";
import { buildUpiPaymentUri, buildWhatsAppHref, getManualUpiAdminConfig } from "@/lib/billing/manual-upi-config-service";
import { prisma } from "@/lib/prisma";

type ManualPaymentTransaction = Prisma.PaymentTransactionGetPayload<{
  include: {
    package: true;
    subscription: true;
    user: true;
  };
}>;

export const metadata: Metadata = {
  title: "Complete payment | Gigxomi",
  description: "Complete your Gigxomi package payment using UPI.",
  robots: {
    index: false,
    follow: false,
  },
};

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") return Number(value) || 0;
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value ?? 0) || 0;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function readManualPaymentPayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const paymentMode = record.paymentMode === "SUPPORT_ONLY" ? "SUPPORT_ONLY" : "UPI_QR";
  const upiId = typeof record.upiId === "string" ? record.upiId.trim() : "";
  const payeeName = typeof record.payeeName === "string" ? record.payeeName.trim() : "";
  const upiUri = typeof record.upiUri === "string" ? record.upiUri.trim() : "";
  const paymentReference = typeof record.paymentReference === "string" ? record.paymentReference.trim() : "";
  const supportWhatsApp = typeof record.supportWhatsApp === "string" ? record.supportWhatsApp.trim() : "";
  const instructions = typeof record.instructions === "string" ? record.instructions.trim() : "";

  if (!paymentReference && !upiId && !supportWhatsApp) {
    return null;
  }

  return {
    paymentMode,
    upiId,
    payeeName,
    upiUri,
    paymentReference,
    supportWhatsApp,
    instructions,
  };
}

export default async function ManualPaymentPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const [{ transactionId }, session, manualConfig] = await Promise.all([params, getSessionContext(), getManualUpiAdminConfig()]);
  let transaction: ManualPaymentTransaction | null = null;
  try {
    transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        package: true,
        subscription: true,
        user: true,
      },
    });
  } catch (error) {
    console.error("[billing] Manual payment transaction lookup failed; checking fallback store", {
      transactionId,
      error: error instanceof Error ? error.message : "Unknown manual payment lookup error",
    });
  }
  const fallbackPayment = !transaction ? await getManualUpiFallbackPaymentById(transactionId) : null;

  if (!transaction && !fallbackPayment) {
    if (session.role === "GUEST" || !session.userId) {
      redirect("/login");
    }
    notFound();
  }

  if (transaction) {
    if (session.role === "GUEST" || !session.userId) {
      redirect("/login");
    }

    if (transaction.provider !== "UPI_MANUAL") {
      notFound();
    }

    if (session.role !== "SUPER_ADMIN" && transaction.userId !== session.userId) {
      notFound();
    }

    if (transaction.status === "SUCCESS" || (transaction.subscription?.status === "ACTIVE" && transaction.transactionType !== "RENEWAL")) {
      redirect(transaction.package.packageType === "AGENCY" ? "/admin/analytics" : "/freelancer");
    }
  } else if (fallbackPayment && session.userId && session.role !== "SUPER_ADMIN" && fallbackPayment.userId && fallbackPayment.userId !== session.userId) {
    notFound();
  }

  const amount = transaction ? toNumber(transaction.amount) : toNumber(fallbackPayment?.amount);
  const currency = transaction?.currency || fallbackPayment?.currency || "INR";
  const storedPayload = transaction ? readManualPaymentPayload(transaction.rawRequest) : null;
  const paymentReference = storedPayload?.paymentReference || transaction?.merchantTransactionId || fallbackPayment?.paymentReference || transactionId;
  const packageName = transaction?.package.name || fallbackPayment?.packageName || "Gigxomi package";
  const statusLabel = (transaction?.status || fallbackPayment?.status || "INITIATED").toLowerCase();
  const userDisplayName = transaction?.user.displayName || fallbackPayment?.userDisplayName || "Gigxomi customer";
  const userPhone = transaction?.user.phone || fallbackPayment?.userPhone || "";
  const resolvedUpiId = storedPayload?.upiId || fallbackPayment?.upiId || manualConfig.settings.upiId;
  const resolvedPayeeName = storedPayload?.payeeName || fallbackPayment?.payeeName || manualConfig.settings.payeeName;
  const supportWhatsApp = storedPayload?.supportWhatsApp || fallbackPayment?.supportWhatsApp || manualConfig.settings.supportWhatsApp;
  const supportInstructions = storedPayload?.instructions || fallbackPayment?.instructions || manualConfig.settings.instructions;
  const paymentMode = storedPayload?.paymentMode ?? fallbackPayment?.paymentMode ?? "UPI_QR";
  const upiUri =
    storedPayload?.upiUri ||
    fallbackPayment?.upiUri ||
    (resolvedUpiId && resolvedPayeeName
      ? buildUpiPaymentUri({
          amount,
          currency,
          note: `Gigxomi ${packageName} ${paymentReference}`.slice(0, 80),
          payeeName: resolvedPayeeName,
          transactionReference: paymentReference,
          upiId: resolvedUpiId,
        })
      : null);
  const canRenderPayment = Boolean(upiUri && resolvedUpiId && resolvedPayeeName);
  const canRenderSupportState = Boolean(supportWhatsApp || supportInstructions);
  const qrDataUrl =
    canRenderPayment && upiUri
      ? await QRCode.toDataURL(upiUri, {
          margin: 1,
          width: 260,
          color: {
            dark: "#000000",
            light: "#D7FF2F",
          },
        })
      : null;
  const firstName = userDisplayName.trim().split(/\s+/)[0] || userDisplayName;
  const whatsappMessage = [
    `Hi Gigxomi team, I paid for ${packageName}.`,
    `Name: ${userDisplayName}`,
    `Phone: ${userPhone}`,
    `Amount: ${formatCurrency(amount, currency)}`,
    `Reference: ${paymentReference}`,
    "I am sending the payment screenshot/UTR for approval.",
  ].join("\n");
  const resolvedSupportWhatsApp = supportWhatsApp || manualConfig.settings.supportWhatsApp;
  const whatsappHref = resolvedSupportWhatsApp
    ? buildWhatsAppHref({
        phone: resolvedSupportWhatsApp,
        message: whatsappMessage,
      })
    : null;

  return (
    <main className="app-shell public-theme-root">
      <PublicShell
        canvasClassName="public-shell-page-canvas manual-payment-canvas"
        showCategoryNav={false}
        title="Complete payment"
        topbarActions={[
          ...(whatsappHref ? [{ href: whatsappHref, label: "WhatsApp support" as const }] : []),
          { href: session.role === "GUEST" ? "/login" : "/api/auth/logout", label: session.role === "GUEST" ? "Login" : "Logout", variant: "pill" },
        ]}
      >
        <div className="manual-payment-stack">
          <section className="manual-payment-hero">
            <div className="public-auth-page-copy">
              <p className="section-label">Payment pending</p>
              <h1 className="section-heading">Hi {firstName}, complete your {packageName} subscription.</h1>
              <p className="muted-copy">
                Scan the QR from any trusted UPI app, or enter the UPI ID manually. Then send the screenshot or UTR on WhatsApp. Super Admin will verify it and activate your package.
              </p>
            </div>
            <div className="manual-payment-amount-card">
              <span>Amount</span>
              <strong>{formatCurrency(amount, currency)}</strong>
              <small>{paymentReference}</small>
            </div>
          </section>

          {!canRenderPayment && canRenderSupportState ? (
            <section className="manual-payment-card manual-payment-card-support">
              <div className="manual-payment-qr-wrap manual-payment-qr-wrap-support">
                <div className="manual-payment-support-state">
                  <p className="section-label">Payment setup</p>
                  <h2 className="card-title">Complete this payment with support.</h2>
                  <p className="muted-copy">
                    Your transaction is ready and saved. Share the screenshot or UTR on WhatsApp and the team will activate your package after review.
                  </p>
                </div>
              </div>
              <div className="manual-payment-details">
                <p className="section-label">{paymentMode === "SUPPORT_ONLY" ? "Support payment" : "UPI details"}</p>
                <h2 className="card-title">{packageName}</h2>
                <div className="manual-payment-detail-grid">
                  <span>Support</span>
                  <strong>{supportWhatsApp || "WhatsApp support"}</strong>
                  <span>Package</span>
                  <strong>{packageName}</strong>
                  <span>Status</span>
                  <strong>{statusLabel}</strong>
                </div>
                <p className="muted-copy">{supportInstructions}</p>
                <div className="manual-upi-actions">
                  {whatsappHref ? (
                    <a className="primary-button" href={whatsappHref} rel="noreferrer" target="_blank">
                      Send screenshot on WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>
            </section>
          ) : !canRenderPayment ? (
            <p className="public-auth-error">We could not load your payment details right now. Please contact WhatsApp support.</p>
          ) : (
            <section className="manual-payment-card">
              <div className="manual-payment-qr-wrap">
                {qrDataUrl ? <Image alt="Gigxomi UPI payment QR" height={260} src={qrDataUrl} unoptimized width={260} /> : null}
              </div>
              <div className="manual-payment-details">
                <p className="section-label">UPI details</p>
                <h2 className="card-title">{resolvedPayeeName}</h2>
                <div className="manual-payment-detail-grid">
                  <span>UPI ID</span>
                  <strong>{resolvedUpiId}</strong>
                  <span>Package</span>
                  <strong>{packageName}</strong>
                  <span>Status</span>
                  <strong>{statusLabel}</strong>
                </div>
                <p className="muted-copy">{supportInstructions}</p>
                <p className="muted-copy">Link-based payment launch has been disabled here. Use the QR code or copy the UPI ID into PhonePe, Google Pay, Paytm, or any trusted UPI app.</p>
                <ManualUpiPaymentActions upiId={resolvedUpiId} whatsappHref={whatsappHref ?? ""} />
              </div>
            </section>
          )}

          <div className="auth-panel-actions">
            <Link className="secondary-button" href="/pricing">
              Change package
            </Link>
            <Link className="secondary-button" href="/subscription-required">
              Check status
            </Link>
          </div>
        </div>
      </PublicShell>
    </main>
  );
}
