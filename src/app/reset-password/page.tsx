import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Internal Gigxomi password reset screen.",
  robots: {
    index: false,
    follow: false,
  },
};

function getValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = getValue(params.token);
  const error = getValue(params.error);

  return (
    <main className="app-shell">
      <section className="dashboard-shell compact">
        <div className="freelancer-section-head">
          <div>
            <p className="section-label">Reset password</p>
            <h1 className="section-heading">Set a new fallback password for your internal account.</h1>
          </div>
          <Link className="secondary-button" href="/login">
            Back to login
          </Link>
        </div>

        {error ? <p className="helper-text">{error}</p> : null}

        <section className="brief-card">
          {token ? (
            <form action="/api/auth/reset-password" className="freelancer-form-grid" method="post">
              <input name="token" type="hidden" value={token} />
              <label className="freelancer-field freelancer-field-full">
                <span>New password</span>
                <input name="password" required type="password" />
              </label>
              <label className="freelancer-field freelancer-field-full">
                <span>Confirm password</span>
                <input name="confirmPassword" required type="password" />
              </label>
              <button className="freelancer-primary-button" type="submit">
                Update password
              </button>
            </form>
          ) : (
            <>
              <strong>Reset token missing</strong>
              <p className="muted-copy">Create a token from the forgot password page first.</p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
