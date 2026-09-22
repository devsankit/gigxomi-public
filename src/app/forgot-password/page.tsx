import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Internal Gigxomi password recovery screen.",
  robots: {
    index: false,
    follow: false,
  },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const message = getValue(params.message);
  const error = getValue(params.error);
  const resetToken = getValue(params.resetToken);

  return (
    <main className="app-shell">
      <section className="dashboard-shell compact">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">Password recovery</p>
            <h1 className="section-heading">Create a staging-safe reset token for seeded internal users.</h1>
          </div>
          <Link className="secondary-button" href="/login">
            Back to login
          </Link>
        </div>

        {message ? <p className="helper-text">{message}</p> : null}
        {error ? <p className="helper-text">{error}</p> : null}

        <section className="brief-card">
          <form action="/api/auth/forgot-password" className="freelancer-form-grid" method="post">
            <label className="freelancer-field freelancer-field-full">
              <span>Phone or email</span>
              <input name="identifier" placeholder="freelancer@gigxomi.local" required />
            </label>
            <button className="freelancer-primary-button" type="submit">
              Create reset token
            </button>
          </form>
        </section>

        {resetToken ? (
          <section className="brief-card">
            <span className="meta-pill">Staging reset token</span>
            <strong>{resetToken}</strong>
            <p className="muted-copy">Use this token immediately on the reset page.</p>
            <Link className="primary-button" href={`/reset-password?token=${encodeURIComponent(resetToken)}`}>
              Open reset page
            </Link>
          </section>
        ) : null}
      </section>
    </main>
  );
}
