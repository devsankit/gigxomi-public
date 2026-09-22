"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Loader2,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  ChevronUp,
} from "lucide-react";

import { AppSelect } from "@/components/ui/app-select";
import { formatManagedUserPhone, isManagedUserInAudience } from "@/lib/auth/managed-user-utils";
import type { ManagedAuthUser, PackageStatus } from "@/lib/auth/types";
import type { FreelancerAdminProgress, FreelancerPortfolioStatus } from "@/lib/gigxomi/freelancer-admin-progress";
import type { DummyWhatsAppConnectionState } from "@/lib/gigxomi/dummy-platform-store";
import type { RegistrationPackage } from "@/lib/gigxomi/public-growth-types";

type SuperAdminAccessControlProps = {
  audience: "AGENCY" | "FREELANCER";
  users: ManagedAuthUser[];
  packages: RegistrationPackage[];
  whatsappStates?: DummyWhatsAppConnectionState[];
  title: string;
  description: string;
  freelancerProgress?: Record<string, FreelancerAdminProgress>;
};

type AccessDraft = {
  packageId: string;
  packageStatus: Exclude<PackageStatus, null>;
};

type CreateAccountDraft = AccessDraft & {
  displayName: string;
  email: string;
  phone: string;
  password: string;
};

type StatusFilter = "ALL" | "ACTIVE" | "PAUSED" | "EXPIRED" | "PENDING";
type WhatsAppFilter = "ALL" | "CONNECTED" | "NOT_CONNECTED" | "PENDING_SETUP";

const STATUS_OPTIONS: Array<Exclude<PackageStatus, null>> = ["ACTIVE", "PAUSED", "EXPIRED"];

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
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

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildDrafts(users: ManagedAuthUser[], packages: RegistrationPackage[], audience: "AGENCY" | "FREELANCER") {
  const packageOptions = packages.filter((item) => item.audience === audience);
  const fallbackPackageId = packageOptions[0]?.id ?? "";

  return users.reduce<Record<string, AccessDraft>>((accumulator, user) => {
    if (!isManagedUserInAudience(user, audience)) {
      return accumulator;
    }

    accumulator[user.id] = {
      packageId: user.packageId ?? fallbackPackageId,
      packageStatus: user.packageStatus ?? "ACTIVE",
    };

    return accumulator;
  }, {});
}

function buildCreateDraft(packages: RegistrationPackage[], audience: "AGENCY" | "FREELANCER"): CreateAccountDraft {
  const packageId =
    packages
      .filter((item) => item.audience === audience)
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)[0]?.id ?? "";

  return {
    displayName: "",
    email: "",
    phone: "",
    password: "",
    packageId,
    packageStatus: "ACTIVE",
  };
}

function getWhatsAppDetails(user: ManagedAuthUser, whatsappStates: DummyWhatsAppConnectionState[]) {
  return whatsappStates.find((item) => item.tenantId === user.tenantId) ?? null;
}

function getStatusLabel(status: PackageStatus) {
  return status ?? "PENDING";
}

function getStatusTone(status: PackageStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED") return "warning";
  if (status === "EXPIRED") return "error";
  return "neutral";
}

function getWhatsAppStateLabel(user: ManagedAuthUser, audience: "AGENCY" | "FREELANCER", whatsappStates: DummyWhatsAppConnectionState[]) {
  if (audience !== "AGENCY") {
    return "Pending setup";
  }

  const details = getWhatsAppDetails(user, whatsappStates);
  if (!details) {
    return "Not connected";
  }

  const status = details.status.toLowerCase();
  if (status.includes("ready") || status.includes("connected")) {
    return "Connected";
  }

  if (status.includes("progress") || status.includes("submitted") || status.includes("started")) {
    return "Pending setup";
  }

  return "Not connected";
}

function getWhatsAppTone(label: string) {
  if (label === "Connected") return "success";
  if (label === "Pending setup") return "warning";
  return "neutral";
}

function matchesWhatsAppFilter(label: string, filter: WhatsAppFilter) {
  if (filter === "ALL") return true;
  if (filter === "CONNECTED") return label === "Connected";
  if (filter === "PENDING_SETUP") return label === "Pending setup";
  return label === "Not connected";
}

function getStatusFilterValue(status: PackageStatus): StatusFilter {
  return status ?? "PENDING";
}

function getPortfolioLabel(status: FreelancerPortfolioStatus) {
  if (status === "NOT_STARTED") return "Not started";
  if (status === "CHANGES_REQUESTED") return "Needs changes";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getPortfolioTone(status: FreelancerPortfolioStatus) {
  if (status === "APPROVED") return "success";
  if (status === "CHANGES_REQUESTED" || status === "REJECTED") return "error";
  if (status === "SUBMITTED") return "warning";
  return "neutral";
}

const EMPTY_FREELANCER_PROGRESS: FreelancerAdminProgress = {
  profileCompleted: false,
  portfolioStatus: "NOT_STARTED",
  onboardingCompleted: false,
};

export function SuperAdminAccessControl({
  audience,
  users,
  packages,
  whatsappStates = [],
  title,
  description,
  freelancerProgress = {},
}: SuperAdminAccessControlProps) {
  const [allUsers, setAllUsers] = useState(users);
  const [drafts, setDrafts] = useState(() => buildDrafts(users, packages, audience));
  const [createDraft, setCreateDraft] = useState(() => buildCreateDraft(packages, audience));
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [impersonatingIds, setImpersonatingIds] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [packageFilter, setPackageFilter] = useState("ALL");
  const [whatsappFilter, setWhatsAppFilter] = useState<WhatsAppFilter>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportingScope, setExportingScope] = useState<"all" | "visible" | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const packageOptions = useMemo(
    () =>
      packages
        .filter((item) => item.audience === audience)
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [audience, packages],
  );

  const baseUsers = useMemo(
    () =>
      allUsers
        .filter((user) => isManagedUserInAudience(user, audience))
        .slice()
        .sort((left, right) => {
          const createdAtDifference = Date.parse(right.createdAt ?? "") - Date.parse(left.createdAt ?? "");
          return Number.isFinite(createdAtDifference) && createdAtDifference !== 0
            ? createdAtDifference
            : left.displayName.localeCompare(right.displayName);
        }),
    [allUsers, audience],
  );

  const stats = useMemo(() => {
    let active = 0;
    let paused = 0;
    let expired = 0;
    for (const u of baseUsers) {
      if (u.packageStatus === "ACTIVE") active++;
      else if (u.packageStatus === "PAUSED") paused++;
      else if (u.packageStatus === "EXPIRED") expired++;
    }
    return {
      total: baseUsers.length,
      active,
      paused,
      expired,
    };
  }, [baseUsers]);

  const filteredUsers = useMemo(() => {
    return baseUsers.filter((user) => {
      const query = search.trim().toLowerCase();
      const status = getStatusFilterValue(user.packageStatus);
      const waLabel = getWhatsAppStateLabel(user, audience, whatsappStates);

      const matchesSearch =
        !query ||
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query) ||
        (user.packageName ?? "").toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || statusFilter === status;
      const matchesPackage = packageFilter === "ALL" || (user.packageId ?? "") === packageFilter;
      const matchesWhatsApp = matchesWhatsAppFilter(waLabel, whatsappFilter);

      return matchesSearch && matchesStatus && matchesPackage && matchesWhatsApp;
    });
  }, [audience, baseUsers, packageFilter, search, statusFilter, whatsappFilter, whatsappStates]);

  const selectedUser = useMemo(() => baseUsers.find((user) => user.id === selectedUserId) ?? null, [baseUsers, selectedUserId]);

  useEffect(() => {
    if (!selectedUser) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedUserId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser]);

  const updateDraft = (userId: string, next: Partial<AccessDraft>) => {
    setDrafts((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] ?? {
          packageId: packageOptions[0]?.id ?? "",
          packageStatus: "ACTIVE",
        }),
        ...next,
      },
    }));
  };

  const updateCreateDraft = (next: Partial<CreateAccountDraft>) => {
    setCreateDraft((current) => ({ ...current, ...next }));
  };

  const createAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createDraft.packageId) {
      setCreateMessage(`Create at least one ${audience === "AGENCY" ? "agency" : "freelancer"} package before adding this account.`);
      return;
    }

    setIsCreating(true);
    setCreateMessage(null);

    try {
      const response = await fetch("/api/super-admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: audience === "AGENCY" ? "ADMIN" : "FREELANCER",
          displayName: createDraft.displayName,
          email: createDraft.email,
          phone: createDraft.phone,
          password: createDraft.password,
          packageId: createDraft.packageId,
          packageStatus: createDraft.packageStatus,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            user?: ManagedAuthUser;
            users?: ManagedAuthUser[];
          }
        | null;

      if (!response.ok || !payload?.ok || !Array.isArray(payload.users)) {
        throw new Error(payload?.error || `Unable to create ${audience === "AGENCY" ? "agency" : "freelancer"} account.`);
      }

      setAllUsers(payload.users);
      setDrafts(buildDrafts(payload.users, packages, audience));
      setCreateDraft(buildCreateDraft(packages, audience));
      setSelectedUserId(payload.user?.id ?? null);
      setSearch(payload.user?.phone ?? createDraft.phone);
      setIsAddFormOpen(false);
      setCreateMessage(`${audience === "AGENCY" ? "Agency" : "Freelancer"} account created and package assigned.`);
    } catch (error) {
      setCreateMessage(error instanceof Error ? error.message : `Unable to create ${audience === "AGENCY" ? "agency" : "freelancer"} account.`);
    } finally {
      setIsCreating(false);
    }
  };

  const submit = async (userId: string, overrides?: Partial<AccessDraft>) => {
    const nextDraft = {
      ...(drafts[userId] ?? {
        packageId: packageOptions[0]?.id ?? "",
        packageStatus: "ACTIVE" as const,
      }),
      ...overrides,
    };

    if (!nextDraft.packageId) {
      setMessages((current) => ({ ...current, [userId]: "Choose a package before saving." }));
      return;
    }

    setSavingIds((current) => ({ ...current, [userId]: true }));
    setMessages((current) => ({ ...current, [userId]: "" }));

    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextDraft),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            users?: ManagedAuthUser[];
          }
        | null;

      if (!response.ok || !payload?.ok || !Array.isArray(payload.users)) {
        throw new Error(payload?.error || "We could not save this access change.");
      }

      setAllUsers(payload.users);
      setDrafts(buildDrafts(payload.users, packages, audience));
      setMessages((current) => ({ ...current, [userId]: "Saved successfully." }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [userId]: error instanceof Error ? error.message : "We could not save this access change.",
      }));
    } finally {
      setSavingIds((current) => ({ ...current, [userId]: false }));
    }
  };

  const deleteAccount = async (user: ManagedAuthUser) => {
    const label = audience === "AGENCY" ? "agency" : "freelancer";
    const confirmed = window.confirm(`Delete ${user.displayName}? This removes the ${label} login and cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeletingIds((current) => ({ ...current, [user.id]: true }));
    setMessages((current) => ({ ...current, [user.id]: "" }));

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            users?: ManagedAuthUser[];
          }
        | null;

      if (!response.ok || !payload?.ok || !Array.isArray(payload.users)) {
        throw new Error(payload?.error || `Unable to delete this ${label}.`);
      }

      setAllUsers(payload.users);
      setDrafts(buildDrafts(payload.users, packages, audience));
      setSelectedUserId((current) => (current === user.id ? null : current));
      setCreateMessage(`${audience === "AGENCY" ? "Agency" : "Freelancer"} deleted.`);
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [user.id]: error instanceof Error ? error.message : `Unable to delete this ${label}.`,
      }));
    } finally {
      setDeletingIds((current) => ({ ...current, [user.id]: false }));
    }
  };

  const loginAsManagedUser = async (user: ManagedAuthUser) => {
    const accountLabel = audience === "AGENCY" ? "agency" : "freelancer";
    const destinationLabel = audience === "AGENCY" ? "WhatsApp setup" : "freelancer dashboard";
    if (!window.confirm(`Login as ${user.displayName} and open their ${destinationLabel}?`)) {
      return;
    }

    setImpersonatingIds((current) => ({ ...current, [user.id]: true }));
    setMessages((current) => ({ ...current, [user.id]: "" }));

    try {
      const response = await fetch(`/api/super-admin/users/${user.id}/impersonate`, {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; redirectTo?: string } | null;

      if (!response.ok || !payload?.ok || !payload.redirectTo) {
        throw new Error(payload?.error || `Unable to login as this ${accountLabel}.`);
      }

      window.location.assign(payload.redirectTo);
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [user.id]: error instanceof Error ? error.message : `Unable to login as this ${accountLabel}.`,
      }));
      setImpersonatingIds((current) => ({ ...current, [user.id]: false }));
    }
  };

  const openPanel = (userId: string) => {
    setSelectedUserId(userId);
    setMessages((current) => ({ ...current, [userId]: "" }));
  };

  const closePanel = () => {
    setSelectedUserId(null);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const exportFreelancers = async (scope: "all" | "visible") => {
    setExportingScope(scope);
    setExportMessage(null);

    try {
      const response = await fetch("/api/super-admin/freelancers/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          scope === "visible"
            ? { scope, userIds: filteredUsers.map((user) => user.id) }
            : { scope },
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to export freelancer data.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const fileName = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "gigxomi-freelancers.csv";
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      setExportMessage(`${scope === "visible" ? filteredUsers.length : baseUsers.length} freelancers exported.`);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "Unable to export freelancer data.");
    } finally {
      setExportingScope(null);
    }
  };

  return (
    <div className="gx-page super-admin-access-page">
      {/* Page Header */}
      <div className="gx-page-header agency-access-header">
        <div>
          <p className="eyebrow">{audience === "AGENCY" ? "Agency Network" : "Freelancer Roster"}</p>
          <h1>{title}</h1>
          <p className="gx-muted-text">{description}</p>
        </div>

        <div className="agency-access-top-actions">
          <button
            className="gx-button gx-button-primary"
            onClick={() => setIsAddFormOpen((prev) => !prev)}
            type="button"
          >
            {isAddFormOpen ? <ChevronUp size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
            {audience === "AGENCY" ? "Add Agency" : "Add Freelancer"}
          </button>

          {audience === "FREELANCER" ? (
            <div className="agency-access-export-actions">
              <button
                className="gx-button gx-button-secondary"
                disabled={Boolean(exportingScope) || !baseUsers.length}
                onClick={() => exportFreelancers("all").catch(() => undefined)}
                type="button"
              >
                {exportingScope === "all" ? <Loader2 className="spin" size={14} strokeWidth={1.8} /> : <Download size={14} strokeWidth={1.8} />}
                Export All
              </button>
              <button
                className="gx-button gx-button-secondary"
                disabled={Boolean(exportingScope) || !filteredUsers.length}
                onClick={() => exportFreelancers("visible").catch(() => undefined)}
                type="button"
              >
                {exportingScope === "visible" ? <Loader2 className="spin" size={14} strokeWidth={1.8} /> : <Download size={14} strokeWidth={1.8} />}
                Export Visible ({filteredUsers.length})
              </button>
            </div>
          ) : null}

          <button className="gx-button gx-button-secondary" onClick={handleRefresh} type="button">
            {isRefreshing ? <Loader2 className="spin" size={14} strokeWidth={1.8} /> : <RefreshCw size={14} strokeWidth={1.8} />}
            Refresh
          </button>
        </div>
      </div>

      {exportMessage ? <p className="agency-access-export-message">{exportMessage}</p> : null}

      {/* KPI Stats Strip */}
      <div className="agency-access-kpis">
        <div className="agency-kpi-pill">
          <span className="agency-kpi-label">Total {audience === "AGENCY" ? "Agencies" : "Freelancers"}</span>
          <strong className="agency-kpi-val">{stats.total}</strong>
        </div>
        <div className="agency-kpi-pill is-active">
          <span className="agency-kpi-label">Active</span>
          <strong className="agency-kpi-val text-success">{stats.active}</strong>
        </div>
        <div className="agency-kpi-pill is-paused">
          <span className="agency-kpi-label">Paused</span>
          <strong className="agency-kpi-val text-warning">{stats.paused}</strong>
        </div>
        <div className="agency-kpi-pill is-expired">
          <span className="agency-kpi-label">Expired</span>
          <strong className="agency-kpi-val text-danger">{stats.expired}</strong>
        </div>
      </div>

      {/* Collapsible Create Account Form */}
      {isAddFormOpen ? (
        <div className="gx-card agency-access-create-card animate-fadeIn">
          <div className="agency-access-create-head">
            <div>
              <span className="gx-badge gx-badge-success">Super Admin Quick Create</span>
              <h2>Add new {audience === "AGENCY" ? "agency" : "freelancer"} account</h2>
              <p className="gx-muted-text">
                Create credentials, assign an active package, and configure instant login access immediately.
                {audience === "AGENCY" ? " Agency creation automatically provisions tenant workspace." : ""}
              </p>
            </div>
            <button className="gx-button gx-button-ghost" onClick={() => setIsAddFormOpen(false)} type="button">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <form className="gx-form-grid agency-access-create-form" onSubmit={createAccount}>
            <label className="agency-access-field">
              <span className="gx-label">{audience === "AGENCY" ? "Agency / Studio Name" : "Freelancer Full Name"}</span>
              <input
                className="gx-input"
                onChange={(event) => updateCreateDraft({ displayName: event.target.value })}
                placeholder={audience === "AGENCY" ? "e.g. Gigxomi Creative Studio" : "e.g. Rahul Sharma"}
                required
                value={createDraft.displayName}
              />
            </label>

            <label className="agency-access-field">
              <span className="gx-label">Email Address</span>
              <input
                className="gx-input"
                onChange={(event) => updateCreateDraft({ email: event.target.value })}
                placeholder={audience === "AGENCY" ? "agency@example.com" : "freelancer@example.com"}
                required
                type="email"
                value={createDraft.email}
              />
            </label>

            <label className="agency-access-field">
              <span className="gx-label">WhatsApp Phone Number</span>
              <input
                className="gx-input"
                inputMode="tel"
                onChange={(event) => updateCreateDraft({ phone: event.target.value })}
                placeholder="e.g. 9981807309"
                required
                value={createDraft.phone}
              />
            </label>

            <label className="agency-access-field">
              <span className="gx-label">Initial Password</span>
              <input
                className="gx-input"
                minLength={8}
                onChange={(event) => updateCreateDraft({ password: event.target.value })}
                placeholder="Min. 8 characters"
                required
                type="password"
                value={createDraft.password}
              />
            </label>

            <label className="agency-access-field">
              <span className="gx-label">Assign Package</span>
              <AppSelect onChange={(value) => updateCreateDraft({ packageId: value })} value={createDraft.packageId}>
                {packageOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.priceLabel}
                  </option>
                ))}
              </AppSelect>
            </label>

            <label className="agency-access-field">
              <span className="gx-label">Initial Status</span>
              <AppSelect onChange={(value) => updateCreateDraft({ packageStatus: value as Exclude<PackageStatus, null> })} value={createDraft.packageStatus}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </AppSelect>
            </label>

            <div className="agency-access-create-actions">
              <button className="gx-button gx-button-primary" disabled={isCreating || !createDraft.packageId} type="submit">
                {isCreating ? <Loader2 className="spin" size={14} strokeWidth={1.8} /> : <Plus size={14} strokeWidth={1.8} />}
                Create &amp; Assign Package
              </button>
            </div>
          </form>

          {createMessage ? <p className={`agency-access-message ${createMessage.includes("created") ? "is-success" : "is-error"}`}>{createMessage}</p> : null}
        </div>
      ) : null}

      {/* Filter and Search Toolbar */}
      <div className="gx-card agency-access-utility">
        <div className="agency-access-utility-grid">
          <label className="agency-access-field agency-search-field">
            <span className="gx-label">Search Accounts</span>
            <div className="agency-search-input-wrap">
              <Search className="agency-search-icon" size={15} strokeWidth={2} />
              <input
                className="gx-input agency-search-input"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, phone, or package..."
                value={search}
              />
              {search ? (
                <button aria-label="Clear search" className="agency-search-clear" onClick={() => setSearch("")} type="button">
                  <X size={13} strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </label>

          <label className="agency-access-field">
            <span className="gx-label">Status</span>
            <AppSelect onChange={(value) => setStatusFilter(value as StatusFilter)} value={statusFilter}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="EXPIRED">Expired</option>
              <option value="PENDING">Pending</option>
            </AppSelect>
          </label>

          <label className="agency-access-field">
            <span className="gx-label">Package</span>
            <AppSelect onChange={(value) => setPackageFilter(value)} value={packageFilter}>
              <option value="ALL">All packages</option>
              {packageOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </AppSelect>
          </label>

          {audience === "AGENCY" ? (
            <label className="agency-access-field">
              <span className="gx-label">WhatsApp Status</span>
              <AppSelect onChange={(value) => setWhatsAppFilter(value as WhatsAppFilter)} value={whatsappFilter}>
                <option value="ALL">All WhatsApp states</option>
                <option value="CONNECTED">Connected</option>
                <option value="NOT_CONNECTED">Not connected</option>
                <option value="PENDING_SETUP">Pending setup</option>
              </AppSelect>
            </label>
          ) : null}

          <div className="agency-access-count-badge">
            <span className="gx-badge gx-badge-neutral">{filteredUsers.length} visible of {baseUsers.length}</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="agency-access-table-card">
        {isRefreshing ? (
          <div className="agency-access-skeleton-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="gx-skeleton agency-access-skeleton-row" key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredUsers.length ? (
          <>
            <div className="agency-access-table-wrap">
              <table className="agency-access-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: "220px" }}>{audience === "AGENCY" ? "Agency / User" : "Freelancer"}</th>
                    <th style={{ minWidth: "120px" }}>Role</th>
                    <th style={{ minWidth: "130px" }}>Phone / WhatsApp</th>
                    <th style={{ minWidth: "100px" }}>Status</th>
                    {audience === "FREELANCER" ? <th style={{ minWidth: "100px" }}>Profile</th> : null}
                    {audience === "FREELANCER" ? <th style={{ minWidth: "110px" }}>Portfolio</th> : null}
                    {audience === "AGENCY" ? <th style={{ minWidth: "130px" }}>WhatsApp</th> : null}
                    <th style={{ minWidth: "130px" }}>Package</th>
                    <th style={{ minWidth: "120px" }}>Registered</th>
                    <th style={{ minWidth: "110px" }}>Expiry</th>
                    <th style={{ minWidth: "130px" }}>Last Activity</th>
                    <th style={{ minWidth: "170px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const packageRecord = packageOptions.find((item) => item.id === (user.packageId ?? ""));
                    const statusLabel = getStatusLabel(user.packageStatus);
                    const waLabel = getWhatsAppStateLabel(user, audience, whatsappStates);
                    const progress = freelancerProgress[user.id] ?? EMPTY_FREELANCER_PROGRESS;
                    const initials = getUserInitials(user.displayName);

                    return (
                      <tr className="agency-access-table-row" key={user.id} onClick={() => openPanel(user.id)}>
                        <td>
                          <div className="agency-user-cell">
                            <div className="agency-access-avatar">{initials}</div>
                            <div className="agency-access-cell-stack">
                              <strong className="agency-user-name">{user.displayName}</strong>
                              <span className="agency-user-email">{user.email || "No email provided"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="agency-role-text">
                            {audience === "AGENCY"
                              ? (user.assignedRole === "ADMIN" ? "Agency admin" : user.role)
                              : "Freelancer"}
                          </span>
                        </td>
                        <td>
                          <span className="agency-phone-text">{formatManagedUserPhone(user.phone)}</span>
                        </td>
                        <td>
                          <span className={`gx-badge gx-badge-${getStatusTone(user.packageStatus)}`}>{statusLabel}</span>
                        </td>
                        {audience === "FREELANCER" ? (
                          <td>
                            <span className={`gx-badge gx-badge-${progress.profileCompleted ? "success" : "neutral"}`}>
                              {progress.profileCompleted ? "Complete" : "Incomplete"}
                            </span>
                          </td>
                        ) : null}
                        {audience === "FREELANCER" ? (
                          <td>
                            <span className={`gx-badge gx-badge-${getPortfolioTone(progress.portfolioStatus)}`}>
                              {getPortfolioLabel(progress.portfolioStatus)}
                            </span>
                          </td>
                        ) : null}
                        {audience === "AGENCY" ? (
                          <td>
                            <span className={`gx-badge gx-badge-${getWhatsAppTone(waLabel)}`}>{waLabel}</span>
                          </td>
                        ) : null}
                        <td>
                          <span className="agency-package-tag">{packageRecord?.name ?? user.packageName ?? "Not assigned"}</span>
                        </td>
                        <td>
                          <span className="agency-date-text">{formatDate(user.createdAt)}</span>
                        </td>
                        <td>
                          <span className="agency-date-text">{formatDate(user.packageExpiresAt)}</span>
                        </td>
                        <td>
                          <span className="agency-date-text">{formatDateTime(user.lastLoginAt)}</span>
                        </td>
                        <td>
                          <div className="agency-access-actions-inline" onClick={(event) => event.stopPropagation()}>
                            <button
                              className="agency-row-login-btn"
                              disabled={Boolean(impersonatingIds[user.id]) || user.packageStatus !== "ACTIVE"}
                              onClick={() => loginAsManagedUser(user).catch(() => undefined)}
                              title={
                                user.packageStatus === "ACTIVE"
                                  ? `Login as ${audience === "AGENCY" ? "Agency" : "Freelancer"}`
                                  : `Activate ${audience === "AGENCY" ? "agency" : "freelancer"} package first to login`
                              }
                              type="button"
                            >
                              {impersonatingIds[user.id] ? (
                                <Loader2 className="spin" size={13} strokeWidth={2} />
                              ) : (
                                <LogIn size={13} strokeWidth={2} />
                              )}
                              <span>Login</span>
                            </button>
                            <button
                              className="agency-row-manage-btn"
                              onClick={() => openPanel(user.id)}
                              title="Manage account settings"
                              type="button"
                            >
                              <SlidersHorizontal size={13} strokeWidth={2} />
                              <span>Manage</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Responsive Mobile Card View */}
            <div className="agency-access-mobile-list">
              {filteredUsers.map((user) => {
                const statusLabel = getStatusLabel(user.packageStatus);
                const waLabel = getWhatsAppStateLabel(user, audience, whatsappStates);
                const progress = freelancerProgress[user.id] ?? EMPTY_FREELANCER_PROGRESS;
                const initials = getUserInitials(user.displayName);

                return (
                  <article className="agency-access-mobile-card" key={`mobile-${user.id}`} onClick={() => openPanel(user.id)}>
                    <div className="agency-mobile-card-header">
                      <div className="agency-user-cell">
                        <div className="agency-access-avatar">{initials}</div>
                        <div>
                          <strong className="agency-user-name">{user.displayName}</strong>
                          <p className="agency-user-email">{user.email || "No email"}</p>
                        </div>
                      </div>
                      <span className={`gx-badge gx-badge-${getStatusTone(user.packageStatus)}`}>{statusLabel}</span>
                    </div>

                    <div className="agency-mobile-card-meta">
                      <div>
                        <span className="agency-meta-label">Phone:</span>
                        <span>{formatManagedUserPhone(user.phone)}</span>
                      </div>
                      <div>
                        <span className="agency-meta-label">Package:</span>
                        <span>{user.packageName ?? "None"}</span>
                      </div>
                      {audience === "AGENCY" ? (
                        <div>
                          <span className="agency-meta-label">WhatsApp:</span>
                          <span className={`gx-badge gx-badge-${getWhatsAppTone(waLabel)}`}>{waLabel}</span>
                        </div>
                      ) : null}
                      {audience === "FREELANCER" ? (
                        <div>
                          <span className="agency-meta-label">Portfolio:</span>
                          <span className={`gx-badge gx-badge-${getPortfolioTone(progress.portfolioStatus)}`}>
                            {getPortfolioLabel(progress.portfolioStatus)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="agency-mobile-card-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="agency-row-login-btn"
                        disabled={Boolean(impersonatingIds[user.id]) || user.packageStatus !== "ACTIVE"}
                        onClick={() => loginAsManagedUser(user).catch(() => undefined)}
                        type="button"
                      >
                        {impersonatingIds[user.id] ? (
                          <Loader2 className="spin" size={13} strokeWidth={2} />
                        ) : (
                          <LogIn size={13} strokeWidth={2} />
                        )}
                        <span>Login</span>
                      </button>
                      <button className="agency-row-manage-btn" onClick={() => openPanel(user.id)} type="button">
                        <SlidersHorizontal size={13} strokeWidth={2} />
                        <span>Manage</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="gx-empty-state">
            <strong>No {audience === "AGENCY" ? "agencies" : "freelancers"} found</strong>
            <p className="gx-muted-text">Try adjusting search or filter criteria.</p>
            <button className="gx-button gx-button-secondary" onClick={handleRefresh} type="button">
              Reset / Refresh
            </button>
          </div>
        )}
      </div>

      {/* Slide-Over Side Panel Drawer */}
      {selectedUser ? (
        <div className="agency-access-drawer-backdrop" onClick={closePanel} role="presentation">
          <aside
            aria-label={`Manage ${selectedUser.displayName}`}
            className="agency-access-drawer"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="agency-access-drawer-header">
              <div className="agency-access-drawer-user-meta">
                <div className="agency-access-avatar large">
                  {getUserInitials(selectedUser.displayName)}
                </div>
                <div className="agency-access-drawer-titles">
                  <h2>{selectedUser.displayName}</h2>
                  <div className="agency-access-drawer-subtags">
                    <span className={`gx-badge gx-badge-${getStatusTone((drafts[selectedUser.id]?.packageStatus ?? selectedUser.packageStatus))}`}>
                      {(drafts[selectedUser.id]?.packageStatus ?? selectedUser.packageStatus) ?? "PENDING"}
                    </span>
                    <span className="agency-access-role-pill">
                      {audience === "AGENCY"
                        ? (selectedUser.assignedRole === "ADMIN" ? "Agency Admin" : selectedUser.role)
                        : "Freelancer"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                aria-label="Close panel"
                className="agency-access-drawer-close"
                onClick={closePanel}
                title="Close panel (Esc)"
                type="button"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </header>

            <div className="agency-access-drawer-body">
              {/* Primary Direct Workspace Access Card */}
              <section className="agency-access-hero-card">
                <div className="agency-access-hero-copy">
                  <h4>Direct Workspace Access</h4>
                  <p className="gx-muted-text">
                    {selectedUser.packageStatus === "ACTIVE"
                      ? `Enter ${selectedUser.displayName}'s ${audience === "AGENCY" ? "agency workspace and WhatsApp integration console" : "freelancer workspace and projects"}.`
                      : "This account is currently paused/expired. Activate package to enable workspace login."}
                  </p>
                </div>
                <button
                  className="agency-hero-login-btn"
                  disabled={Boolean(impersonatingIds[selectedUser.id]) || selectedUser.packageStatus !== "ACTIVE"}
                  onClick={() => loginAsManagedUser(selectedUser).catch(() => undefined)}
                  type="button"
                >
                  {impersonatingIds[selectedUser.id] ? (
                    <Loader2 className="spin" size={16} strokeWidth={2} />
                  ) : (
                    <LogIn size={16} strokeWidth={2} />
                  )}
                  <span>Login as {audience === "AGENCY" ? "Agency Workspace" : "Freelancer Account"}</span>
                </button>
              </section>

              {/* Account Information */}
              <section className="agency-access-panel-section">
                <h3>Account Information</h3>
                <div className="agency-access-form-grid">
                  <label>
                    <span className="gx-label">Display / Studio Name</span>
                    <input className="gx-input" readOnly value={selectedUser.displayName} />
                  </label>
                  <label>
                    <span className="gx-label">Email Address</span>
                    <input className="gx-input" readOnly value={selectedUser.email || "No email registered"} />
                  </label>
                  <label>
                    <span className="gx-label">WhatsApp Phone</span>
                    <input className="gx-input" readOnly value={formatManagedUserPhone(selectedUser.phone)} />
                  </label>
                  <label>
                    <span className="gx-label">Assigned Role</span>
                    <input className="gx-input" readOnly value={selectedUser.assignedRole === "ADMIN" ? "Agency admin" : selectedUser.role} />
                  </label>
                  <label>
                    <span className="gx-label">Registration Date</span>
                    <input className="gx-input" readOnly value={formatDateTime(selectedUser.createdAt)} />
                  </label>
                  <label>
                    <span className="gx-label">Last Activity / Login</span>
                    <input className="gx-input" readOnly value={formatDateTime(selectedUser.lastLoginAt)} />
                  </label>
                </div>
              </section>

              {/* Package & Subscription Control */}
              <section className="agency-access-panel-section">
                <h3>Package &amp; Access Control</h3>
                <div className="agency-access-form-grid">
                  <label>
                    <span className="gx-label">Current Package</span>
                    <AppSelect
                      onChange={(value) => updateDraft(selectedUser.id, { packageId: value })}
                      value={(drafts[selectedUser.id]?.packageId ?? selectedUser.packageId ?? packageOptions[0]?.id ?? "")}
                    >
                      {packageOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {item.priceLabel}
                        </option>
                      ))}
                    </AppSelect>
                  </label>

                  <label>
                    <span className="gx-label">Package Status</span>
                    <AppSelect
                      onChange={(value) => updateDraft(selectedUser.id, { packageStatus: value as Exclude<PackageStatus, null> })}
                      value={drafts[selectedUser.id]?.packageStatus ?? selectedUser.packageStatus ?? "ACTIVE"}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </AppSelect>
                  </label>

                  <label>
                    <span className="gx-label">Expiry Date</span>
                    <input className="gx-input" readOnly value={formatDate(selectedUser.packageExpiresAt)} />
                  </label>

                  <label>
                    <span className="gx-label">Renewal Cycle</span>
                    <input
                      className="gx-input"
                      readOnly
                      value={
                        packageOptions.find((item) => item.id === (drafts[selectedUser.id]?.packageId ?? selectedUser.packageId ?? ""))?.billingLabel ??
                        "Standard"
                      }
                    />
                  </label>
                </div>
              </section>

              {/* WhatsApp Readiness (Agency) OR Portfolio Review (Freelancer) */}
              {audience === "AGENCY" ? (
                <section className="agency-access-panel-section">
                  <h3>WhatsApp Integration Readiness</h3>
                  <div className="agency-access-form-grid">
                    <label>
                      <span className="gx-label">WhatsApp Number</span>
                      <input
                        className="gx-input"
                        readOnly
                        value={
                          audience === "AGENCY"
                            ? getWhatsAppDetails(selectedUser, whatsappStates)?.phoneNumber || "Not connected"
                            : "Not applicable"
                        }
                      />
                    </label>

                    <label>
                      <span className="gx-label">Connection Status</span>
                      <input
                        className="gx-input"
                        readOnly
                        value={getWhatsAppStateLabel(selectedUser, audience, whatsappStates)}
                      />
                    </label>

                    <label className="agency-access-full-row">
                      <span className="gx-label">API Onboarding Status</span>
                      <input
                        className="gx-input"
                        readOnly
                        value={
                          audience === "AGENCY"
                            ? getWhatsAppDetails(selectedUser, whatsappStates)?.status || "Not started"
                            : "Not applicable"
                        }
                      />
                    </label>
                  </div>
                </section>
              ) : (
                <section className="agency-access-panel-section">
                  <h3>Onboarding &amp; Portfolio Verification</h3>
                  <div className="agency-access-form-grid">
                    <label>
                      <span className="gx-label">Profile Status</span>
                      <input
                        className="gx-input"
                        readOnly
                        value={(freelancerProgress[selectedUser.id] ?? EMPTY_FREELANCER_PROGRESS).profileCompleted ? "Complete" : "Incomplete"}
                      />
                    </label>

                    <label>
                      <span className="gx-label">Portfolio Review Status</span>
                      <input
                        className="gx-input"
                        readOnly
                        value={getPortfolioLabel((freelancerProgress[selectedUser.id] ?? EMPTY_FREELANCER_PROGRESS).portfolioStatus)}
                      />
                    </label>

                    <label className="agency-access-full-row">
                      <span className="gx-label">Onboarding Process</span>
                      <input
                        className="gx-input"
                        readOnly
                        value={(freelancerProgress[selectedUser.id] ?? EMPTY_FREELANCER_PROGRESS).onboardingCompleted ? "Onboarding Finished" : "In Progress"}
                      />
                    </label>
                  </div>
                </section>
              )}

              {/* Status Quick Actions & Danger Zone */}
              <section className="agency-access-panel-section">
                <h3>Quick Status Toggles &amp; Actions</h3>
                <div className="agency-access-admin-actions">
                  <button
                    className="gx-button gx-button-ghost"
                    onClick={() => updateDraft(selectedUser.id, { packageStatus: "ACTIVE" })}
                    type="button"
                  >
                    Set Active
                  </button>
                  <button
                    className="gx-button gx-button-ghost"
                    onClick={() => updateDraft(selectedUser.id, { packageStatus: "PAUSED" })}
                    type="button"
                  >
                    Pause Access
                  </button>
                  <button
                    className="gx-button gx-button-ghost"
                    onClick={() => updateDraft(selectedUser.id, { packageStatus: "EXPIRED" })}
                    type="button"
                  >
                    Set Expired
                  </button>
                  <button
                    className="gx-button gx-button-danger"
                    disabled={Boolean(deletingIds[selectedUser.id])}
                    onClick={() => deleteAccount(selectedUser).catch(() => undefined)}
                    type="button"
                  >
                    {deletingIds[selectedUser.id] ? (
                      <Loader2 className="spin" size={14} strokeWidth={1.8} />
                    ) : (
                      <Trash2 size={14} strokeWidth={1.8} />
                    )}
                    Delete {audience === "AGENCY" ? "Agency" : "Freelancer"}
                  </button>
                </div>
                {messages[selectedUser.id] ? (
                  <p className={`agency-access-message ${messages[selectedUser.id].includes("Saved") ? "is-success" : "is-error"}`}>
                    {messages[selectedUser.id]}
                  </p>
                ) : null}
              </section>
            </div>

            <footer className="agency-access-drawer-footer">
              <button className="gx-button gx-button-ghost" onClick={closePanel} type="button">
                Cancel
              </button>
              <button
                className="gx-button gx-button-primary"
                disabled={Boolean(savingIds[selectedUser.id])}
                onClick={() => submit(selectedUser.id)}
                type="button"
              >
                {savingIds[selectedUser.id] ? <Loader2 className="spin" size={14} strokeWidth={1.8} /> : null}
                Save Changes
              </button>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
