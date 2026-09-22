"use client";

import { useEffect, useState } from "react";

import { AppSelect } from "@/components/ui/app-select";
import type { AppRole, ManagedAuthUser } from "@/lib/auth/types";

type UsersPayload = {
  ok?: boolean;
  error?: string;
  users?: ManagedAuthUser[];
  user?: ManagedAuthUser;
};

const defaultFormState = {
  role: "ADMIN" as AppRole,
  displayName: "",
  email: "",
  phone: "",
  password: "",
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SuperAdminUserManagement() {
  const [users, setUsers] = useState<ManagedAuthUser[]>([]);
  const [formState, setFormState] = useState(defaultFormState);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/super-admin/users", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as UsersPayload;

        if (cancelled) {
          return;
        }

        if (!response.ok || payload.ok === false) {
          setStatus(payload.error ?? "Unable to load internal users.");
          setUsers([]);
          setIsLoading(false);
          return;
        }

        setUsers(payload.users ?? []);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setStatus("Unable to load internal users.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const response = await fetch("/api/super-admin/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => ({}))) as UsersPayload;

    if (!response.ok || payload.ok === false) {
      setStatus(payload.error ?? "Unable to create the user right now.");
      setIsSubmitting(false);
      return;
    }

    setUsers(payload.users ?? []);
    setFormState(defaultFormState);
    setStatus(`Created ${payload.user?.role ?? "internal"} user ${payload.user?.displayName ?? ""}. Use the password you entered to log in.`.trim());
    setIsSubmitting(false);
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">User accounts</p>
      <h2 className="section-heading">Create and review internal credentials for admin, manager, and freelancer testing without reopening public signup.</h2>

      <div className="brief-grid two-up">
        <section className="brief-card">
          <span className="meta-pill">Super-admin only</span>
          <strong>Create internal users</strong>
          <p className="muted-copy">Internal users default to tenant `tenant-gigxomi`. The owner super-admin identity is locked and cannot be created from this panel.</p>
          <form className="freelancer-form-grid" onSubmit={handleSubmit}>
            <label className="freelancer-field">
              <span>Role</span>
              <AppSelect value={formState.role} onChange={(nextValue) => setFormState((current) => ({ ...current, role: nextValue as AppRole }))}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="FREELANCER">Freelancer</option>
              </AppSelect>
            </label>
            <label className="freelancer-field">
              <span>Display name</span>
              <input value={formState.displayName} onChange={(event) => setFormState((current) => ({ ...current, displayName: event.target.value }))} required />
            </label>
            <label className="freelancer-field">
              <span>Email</span>
              <input type="email" value={formState.email} onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))} required />
            </label>
            <label className="freelancer-field">
              <span>Phone</span>
              <input value={formState.phone} onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))} placeholder="+91 90000 00005" required />
            </label>
            <label className="freelancer-field freelancer-field-full">
              <span>Password</span>
              <input type="password" value={formState.password} onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))} minLength={8} required />
            </label>
            <div className="freelancer-action-grid">
              <button className="freelancer-primary-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating user..." : "Create internal user"}
              </button>
            </div>
          </form>
        </section>

        <section className="brief-card">
          <span className="meta-pill">Testing notes</span>
          <strong>Current auth model</strong>
          <div className="stack-list">
            <p className="muted-copy">Shared `/login` remains the normal auth page for admin, manager, and freelancer accounts.</p>
            <p className="muted-copy">`/super-admin/login` is now a dedicated owner-login route with locked WhatsApp numbers and password fallback.</p>
            <p className="muted-copy">Freelancers can now enter through WhatsApp OTP signup. This panel stays for internal roles and controlled account creation.</p>
          </div>
        </section>
      </div>

      {status ? <p className="helper-text">{status}</p> : null}

      <section className="brief-card">
        <span className="meta-pill">Internal users</span>
        <strong>{isLoading ? "Loading users..." : `${users.length} user accounts available for staging`}</strong>
        <div className="brief-grid two-up">
          {users.map((user) => (
            <article className="brief-card" key={user.id}>
              <span className="meta-pill">{user.role.replace("_", " ")}</span>
              <strong>{user.displayName}</strong>
              <p className="muted-copy">Email: {user.email}</p>
              <p className="muted-copy">Phone: {user.phone}</p>
              <p className="muted-copy">Tenant: {user.tenantId ?? "Platform-wide"}</p>
              <p className="muted-copy">{user.isSeeded ? "Seeded account" : "Created from super-admin console"}</p>
              <p className="muted-copy">Created: {formatDateTime(user.createdAt)}</p>
              <p className="muted-copy">Last login: {formatDateTime(user.lastLoginAt)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
