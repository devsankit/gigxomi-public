"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, LogIn, Send } from "lucide-react";

function SalesPasswordField({
  name,
  label,
  autoComplete,
  placeholder,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label>
      <span>{label}</span>
      <span className="sales-password-field">
        <input autoComplete={autoComplete} minLength={8} name={name} placeholder={placeholder} required type={isVisible ? "text" : "password"} />
        <button
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

export function SalesSignupForm() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setStatus("Passwords do not match.");
      return;
    }
    const response = await fetch("/api/sales/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(form.get("displayName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        password,
        confirmPassword,
      }),
    });
    const payload = await response.json().catch(() => null);
    setIsSubmitting(false);

    if (!response.ok || !payload?.ok) {
      setStatus(payload?.error ?? "Unable to create sales account.");
      return;
    }

    setStatus("Sales account created. Super-admin approval may be required before login.");
    router.refresh();
  }

  return (
    <form className="sales-auth-form" onSubmit={handleSubmit}>
      <label>
        <span>Name</span>
        <input name="displayName" placeholder="Your full name" required />
      </label>
      <label>
        <span>Email</span>
        <input name="email" placeholder="you@example.com" required type="email" />
      </label>
      <label>
        <span>WhatsApp number</span>
        <input name="phone" placeholder="+91..." required />
      </label>
      <SalesPasswordField autoComplete="new-password" label="Password" name="password" placeholder="Create at least 8 characters" />
      <SalesPasswordField autoComplete="new-password" label="Confirm password" name="confirmPassword" placeholder="Enter the same password again" />
      <button className="sales-primary-button" disabled={isSubmitting} type="submit">
        <Send size={16} />
        {isSubmitting ? "Creating account..." : "Request sales access"}
      </button>
      {status ? <p className="sales-form-status">{status}</p> : null}
    </form>
  );
}

export function SalesPasswordLoginForm({ redirectTo = "/sales", error = "" }: { redirectTo?: string; error?: string }) {
  return (
    <form action="/api/auth/login/password" className="sales-auth-form" method="post">
      <input name="loginScope" type="hidden" value="sales" />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <label>
        <span>Email or phone</span>
        <input name="identifier" placeholder="sales@gigxomi.local" required />
      </label>
      <SalesPasswordField autoComplete="current-password" label="Password" name="password" placeholder="Enter your sales password" />
      <button className="sales-primary-button" type="submit">
        <LogIn size={16} />
        Login to sales dashboard
      </button>
      {error ? <p className="sales-form-status">{error}</p> : null}
    </form>
  );
}
