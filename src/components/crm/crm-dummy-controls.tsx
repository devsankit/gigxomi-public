"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";

import { DataTable, DetailDrawer, EmptyState, StatusBadge, UsageLimitMeter } from "@/components/ui/product-system";
import { editorPerformanceProfiles } from "@/lib/gigxomi/business-ecosystem-data";
import type {
  DummyContactRecord,
  DummyCustomerPrivacySettings,
  DummyLeadStatus,
  DummyManagerAccount,
  DummyManagerPermissionKey,
  DummyUpiConfig,
} from "@/lib/gigxomi/dummy-platform-store";

type ContactsPayload = {
  contacts: DummyContactRecord[];
  statuses: DummyLeadStatus[];
  managers: DummyManagerAccount[];
};

type ManagerSeatLimits = {
  activeManagers: number;
  canCreateManager: boolean;
  limitSource: string;
  managerSeatLimit: number | null;
  packageName: string | null;
  reason: string | null;
};

type ManagersPayload = {
  managers: DummyManagerAccount[];
  limits: ManagerSeatLimits | null;
};

async function fetchContactsPayload() {
  const response = await fetch("/api/admin/contacts", { cache: "no-store" });
  const payload = await response.json();
  return {
    contacts: (payload.contacts ?? []) as DummyContactRecord[],
    statuses: (payload.statuses ?? []) as DummyLeadStatus[],
    managers: (payload.managers ?? []) as DummyManagerAccount[],
  } satisfies ContactsPayload;
}

async function fetchManagers() {
  const response = await fetch("/api/admin/managers", { cache: "no-store" });
  const payload = await response.json();
  return {
    limits: (payload.limits ?? null) as ManagerSeatLimits | null,
    managers: (payload.managers ?? []) as DummyManagerAccount[],
  } satisfies ManagersPayload;
}

async function fetchUpiConfig() {
  const response = await fetch("/api/admin/upi", { cache: "no-store" });
  const payload = await response.json();
  return (payload.config ?? null) as DummyUpiConfig | null;
}

async function fetchAdminCustomerPrivacySettings() {
  const response = await fetch("/api/admin/customer-privacy", { cache: "no-store" });
  const payload = await response.json();
  return (payload.settings ?? null) as DummyCustomerPrivacySettings | null;
}

async function fetchManagerCustomerPrivacySettings() {
  const response = await fetch("/api/manager/customer-privacy", { cache: "no-store" });
  const payload = await response.json();
  return (payload.settings ?? null) as DummyCustomerPrivacySettings | null;
}

function formatTimeLabel(value: string) {
  if (!value) {
    return "No activity";
  }

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return value;
}

const managerPermissionLabels: Array<{ key: DummyManagerPermissionKey; label: string }> = [
  { key: "chatInbox", label: "Chat Inbox" },
  { key: "assignedChats", label: "Assigned Chats" },
  { key: "quoteReview", label: "Quote Review" },
  { key: "deliveryReview", label: "Delivery Review" },
  { key: "walletReview", label: "Wallet Review" },
  { key: "escalations", label: "Escalations" },
  { key: "allContacts", label: "All Contacts" },
];

function normalizeManagerPin(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function AdminManagerPermissionsPanel() {
  const [managers, setManagers] = useState<DummyManagerAccount[]>([]);
  const [managerLimits, setManagerLimits] = useState<ManagerSeatLimits | null>(null);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", password: "", queue: "" });
  const [editDraft, setEditDraft] = useState({ name: "", email: "", phone: "", password: "", queue: "" });
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<Partial<Record<DummyManagerPermissionKey, boolean>>>({});
  const [status, setStatus] = useState("");
  const [isSavingManager, setIsSavingManager] = useState(false);
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);

  useEffect(() => {
    fetchManagers()
      .then((payload) => {
        setManagers(payload.managers);
        setManagerLimits(payload.limits);
      })
      .catch(() => {
        setManagers([]);
        setManagerLimits(null);
      });
  }, []);

  const selectedManager = useMemo(() => managers.find((manager) => manager.id === selectedManagerId) ?? null, [managers, selectedManagerId]);
  const activeManagers = managers.filter((manager) => manager.active).length;
  const pendingInvites = 0;
  const assignedQueues = new Set(managers.map((manager) => manager.queue).filter(Boolean)).size;
  const managerSeatLimit = managerLimits?.managerSeatLimit ?? null;
  const canCreateManager = managerLimits?.canCreateManager ?? true;
  const managerSeatHelper =
    managerLimits?.limitSource === "super_admin_override"
      ? "Super admin override"
      : managerSeatLimit === null
        ? `Package limit: unlimited${managerLimits?.packageName ? ` in ${managerLimits.packageName}` : ""}`
        : `${activeManagers}/${managerSeatLimit} seats from ${managerLimits?.packageName ?? "current package"}`;
  const selectedEnabledPermissionCount = selectedManager
    ? managerPermissionLabels.filter((permission) => Boolean(permissionDraft[permission.key])).length
    : 0;

  async function reload() {
    const payload = await fetchManagers().catch(() => ({ managers: [], limits: null }) satisfies ManagersPayload);
    startTransition(() => {
      setManagers(payload.managers);
      setManagerLimits(payload.limits);
    });
  }

  async function createManager() {
    if (!canCreateManager) {
      setStatus(managerLimits?.reason ?? "Your current package does not allow another manager seat.");
      return;
    }

    if (!draft.name.trim()) {
      setStatus("Add a manager name first.");
      return;
    }
    if (!draft.email.trim() || !draft.email.includes("@")) {
      setStatus("Add a valid manager email.");
      return;
    }
    if (!draft.phone.trim()) {
      setStatus("Add the manager WhatsApp number for OTP login.");
      return;
    }
    if (!/^\d{6}$/.test(draft.password.trim())) {
      setStatus("Add a 6-digit manager PIN.");
      return;
    }

    setIsSavingManager(true);
    const response = await fetch("/api/admin/managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);
    const payload = response ? await response.json() : { ok: false, error: "Network error while creating manager." };
    setIsSavingManager(false);
    if (!response?.ok || !payload.ok) {
      setStatus(payload.error ?? "Unable to create manager.");
      return;
    }

    setStatus("Manager created. They can login with WhatsApp OTP or password at /manager-login.");
    setDraft({ name: "", email: "", phone: "", password: "", queue: "" });
    setDrawerMode(null);
    setManagers((payload.managers ?? []) as DummyManagerAccount[]);
    setManagerLimits((payload.limits ?? null) as ManagerSeatLimits | null);
  }

  async function updateManager() {
    if (!selectedManager) {
      return;
    }

    if (!editDraft.name.trim()) {
      setStatus("Manager name is required.");
      return;
    }
    if (!editDraft.email.trim() || !editDraft.email.includes("@")) {
      setStatus("Add a valid manager email.");
      return;
    }
    if (!editDraft.phone.trim()) {
      setStatus("Add the manager WhatsApp number for OTP login.");
      return;
    }
    if (editDraft.password.trim() && !/^\d{6}$/.test(editDraft.password.trim())) {
      setStatus("New manager PIN must be exactly 6 digits.");
      return;
    }

    setIsSavingManager(true);
    const response = await fetch(`/api/admin/managers/${selectedManager.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editDraft.name,
        email: editDraft.email,
        phone: editDraft.phone,
        password: editDraft.password,
        queue: editDraft.queue,
        permissions: permissionDraft,
      }),
    }).catch(() => null);
    const payload = response ? await response.json() : { ok: false, error: "Network error while updating manager." };
    setIsSavingManager(false);
    if (!response?.ok || !payload.ok) {
      setStatus(payload.error ?? "Unable to update manager.");
      return;
    }

    setManagers((currentManagers) =>
      currentManagers.map((manager) => (manager.id === payload.manager?.id ? ((payload.manager ?? manager) as DummyManagerAccount) : manager)),
    );
    setStatus(editDraft.password.trim() ? "Manager updated and password reset." : "Manager updated.");
    setDrawerMode(null);
    await reload();
  }

  async function deleteManager(manager: DummyManagerAccount) {
    const confirmed = window.confirm(`Delete ${manager.name}? This removes their manager login and cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setIsSavingManager(true);
    const response = await fetch(`/api/admin/managers/${manager.id}`, {
      method: "DELETE",
    }).catch(() => null);
    const payload = response ? await response.json() : { ok: false, error: "Network error while deleting manager." };
    setIsSavingManager(false);
    if (!response?.ok || !payload.ok) {
      setStatus(payload.error ?? "Unable to delete manager.");
      return;
    }

    setManagers((payload.managers ?? []) as DummyManagerAccount[]);
    setSelectedManagerId(null);
    setDrawerMode(null);
    setStatus("Manager deleted.");
    await reload();
  }

  function openCreateDrawer() {
    if (!canCreateManager) {
      setStatus(managerLimits?.reason ?? "Your current package does not allow another manager seat.");
      return;
    }

    setDraft({ name: "", email: "", phone: "", password: "", queue: "" });
    setEditDraft({ name: "", email: "", phone: "", password: "", queue: "" });
    setShowCreatePin(false);
    setShowEditPin(false);
    setDrawerMode("create");
    setSelectedManagerId(null);
    setStatus("");
  }

  function openManagerDrawer(manager: DummyManagerAccount) {
    setSelectedManagerId(manager.id);
    setEditDraft({
      name: manager.name,
      email: manager.email,
      phone: manager.phone ?? "",
      password: "",
      queue: manager.queue || "General operations",
    });
    setShowEditPin(false);
    setPermissionDraft(manager.permissions);
    setDrawerMode("edit");
    setStatus("");
  }

  return (
    <div className="gx-ops-workspace admin-manager-workspace">
      <div className="gx-clean-header-row">
        <div>
          <p className="section-label">Manager control</p>
          <h2 className="app-section-title">Manager seats, permissions, and privacy</h2>
        </div>
        <button className="gx-button gx-button-primary" disabled={!canCreateManager || isSavingManager} onClick={openCreateDrawer} type="button">
          Create Manager
        </button>
      </div>

      <div className="gx-compact-metric-strip">
        <div className="gx-compact-metric">
          <span>Active managers</span>
          <strong>{activeManagers}</strong>
        </div>
        <UsageLimitMeter
          className="gx-compact-meter"
          helper={managerSeatHelper}
          label="Manager seats used"
          limit={managerSeatLimit ?? Math.max(activeManagers, 1)}
          tone={canCreateManager ? "accent" : "warning"}
          used={activeManagers}
        />
        <div className="gx-compact-metric">
          <span>Pending invites</span>
          <strong>{pendingInvites}</strong>
        </div>
        <div className="gx-compact-metric">
          <span>Queues</span>
          <strong>{assignedQueues}</strong>
        </div>
      </div>

      {!canCreateManager ? (
        <p className="helper-text">
          {managerLimits?.reason ?? "Manager creation is locked by the active package."} Update the Managers/staff limit from Packages or upgrade the subscription.
        </p>
      ) : null}
      {status ? <p className="helper-text">{status}</p> : null}

      <DataTable
        columns={[
          {
            key: "manager",
            header: "Manager",
            render: (manager) => (
              <div className="gx-table-identity">
                <strong>{manager.name}</strong>
                <span>{manager.email}</span>
                {manager.phone ? <span>{manager.phone}</span> : null}
              </div>
            ),
          },
          { key: "queue", header: "Queue", render: (manager) => manager.queue || "General" },
          {
            key: "status",
            header: "Status",
            render: (manager) => <StatusBadge tone={manager.active ? "success" : "warning"}>{manager.active ? "Active" : "Paused"}</StatusBadge>,
          },
          {
            key: "permissions",
            header: "Permissions",
            render: (manager) => `${managerPermissionLabels.filter((permission) => Boolean(manager.permissions[permission.key])).length}/${managerPermissionLabels.length} enabled`,
          },
          {
            key: "actions",
            header: "Actions",
            render: (manager) => (
              <div className="gx-table-actions">
                <button className="gx-button gx-button-secondary gx-table-row-action" onClick={() => openManagerDrawer(manager)} type="button">
                  Edit
                </button>
                <button className="gx-button gx-button-danger gx-table-row-action" onClick={() => deleteManager(manager).catch(() => undefined)} type="button">
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        emptyState={
          <EmptyState
            title="No managers yet"
            description={
              canCreateManager
                ? "Create your first manager when the agency needs queue ownership."
                : "Manager seats are controlled by the active package. Increase the Managers/staff limit before adding a manager."
            }
            actionLabel={canCreateManager ? "Create Manager" : undefined}
            onAction={canCreateManager ? openCreateDrawer : undefined}
          />
        }
        getRowKey={(manager) => manager.id}
        rows={managers}
      />

      <details className="gx-help-accordion">
        <summary>Manager scoring guide</summary>
        <div className="gx-help-accordion-grid">
          <div>
            <strong>Manager</strong>
            <span>Runs chat, assignments, reviews, and escalations inside tenant limits.</span>
          </div>
          <div>
            <strong>Queue</strong>
            <span>A queue is the work lane a manager owns, such as Sales, Delivery, Support, or Revisions.</span>
          </div>
          <div>
            <strong>Karma</strong>
            <span>Protects trust: response speed, delivery quality, dispute risk.</span>
          </div>
          <div>
            <strong>Leader score</strong>
            <span>Supports routing and incentives when performance history is available.</span>
          </div>
        </div>
      </details>

      <DetailDrawer
        footer={
          drawerMode === "create" ? (
            <>
              <button className="gx-button gx-button-ghost" onClick={() => setDrawerMode(null)} type="button">
                Cancel
              </button>
              <button className="gx-button gx-button-primary" disabled={!canCreateManager || isSavingManager} onClick={createManager} type="button">
                Create Manager
              </button>
            </>
          ) : (
            <>
              {selectedManager ? (
                <button className="gx-button gx-button-danger" disabled={isSavingManager} onClick={() => deleteManager(selectedManager).catch(() => undefined)} type="button">
                  Delete Manager
                </button>
              ) : null}
              <button className="gx-button gx-button-ghost" disabled={isSavingManager} onClick={() => setDrawerMode(null)} type="button">
                Cancel
              </button>
              <button className="gx-button gx-button-primary" disabled={isSavingManager} onClick={updateManager} type="button">
                Save Changes
              </button>
            </>
          )
        }
        onClose={() => setDrawerMode(null)}
        open={drawerMode !== null}
        sections={
          drawerMode === "create"
            ? [
                {
                  title: "Manager details",
                  children: (
                    <div className="gx-form-grid">
                      <label className="freelancer-field">
                        <span>Manager name</span>
                        <input onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} value={draft.name} />
                      </label>
                      <label className="freelancer-field">
                        <span>Email</span>
                        <input autoComplete="email" onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} type="email" value={draft.email} />
                      </label>
                      <label className="freelancer-field">
                        <span>WhatsApp number (OTP login)</span>
                        <input
                          autoComplete="tel"
                          inputMode="tel"
                          onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                          placeholder="+919876543210"
                          value={draft.phone}
                        />
                      </label>
                      <label className="freelancer-field">
                        <span>6-digit manager PIN</span>
                        <div className="gx-pin-input-wrap">
                          <input
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(event) => setDraft((current) => ({ ...current, password: normalizeManagerPin(event.target.value) }))}
                            pattern="[0-9]{6}"
                            placeholder="6 digit PIN"
                            type={showCreatePin ? "text" : "password"}
                            value={draft.password}
                          />
                          <button
                            aria-label={showCreatePin ? "Hide manager PIN" : "Show manager PIN"}
                            className="gx-pin-eye-button"
                            onClick={() => setShowCreatePin((current) => !current)}
                            type="button"
                          >
                            {showCreatePin ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <small>Set a 6-digit PIN because the manager login uses the same 6-digit OTP-style code field.</small>
                      </label>
                      <label className="freelancer-field">
                        <span>Queue / work lane</span>
                        <input
                          onChange={(event) => setDraft((current) => ({ ...current, queue: event.target.value }))}
                          placeholder="General, Sales, Delivery, Support"
                          value={draft.queue}
                        />
                        <small>Queue decides which chat/work lane this manager owns. Leave blank for General operations.</small>
                      </label>
                      <p className="helper-text freelancer-field-full">
                        Manager seats are controlled by the Managers/staff limit in the active package. After creation, this phone can receive WhatsApp OTP
                        for web or mobile login; the 6-digit PIN is the fallback credential when OTP delivery is unavailable.
                      </p>
                    </div>
                  ),
                },
              ]
            : [
                {
                  title: "Manager details",
                  children: (
                    <div className="gx-form-grid">
                      <label className="freelancer-field">
                        <span>Manager name</span>
                        <input onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} value={editDraft.name} />
                      </label>
                      <label className="freelancer-field">
                        <span>Email</span>
                        <input autoComplete="email" onChange={(event) => setEditDraft((current) => ({ ...current, email: event.target.value }))} type="email" value={editDraft.email} />
                      </label>
                      <label className="freelancer-field">
                        <span>WhatsApp number (OTP login)</span>
                        <input
                          autoComplete="tel"
                          inputMode="tel"
                          onChange={(event) => setEditDraft((current) => ({ ...current, phone: event.target.value }))}
                          placeholder="+919876543210"
                          value={editDraft.phone}
                        />
                      </label>
                      <label className="freelancer-field">
                        <span>Reset 6-digit manager PIN</span>
                        <div className="gx-pin-input-wrap">
                          <input
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            maxLength={6}
                            onChange={(event) => setEditDraft((current) => ({ ...current, password: normalizeManagerPin(event.target.value) }))}
                            pattern="[0-9]{6}"
                            placeholder="Leave blank to keep current PIN"
                            type={showEditPin ? "text" : "password"}
                            value={editDraft.password}
                          />
                          <button
                            aria-label={showEditPin ? "Hide manager PIN" : "Show manager PIN"}
                            className="gx-pin-eye-button"
                            onClick={() => setShowEditPin((current) => !current)}
                            type="button"
                          >
                            {showEditPin ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <small>Use exactly 6 digits. Leave blank if the current PIN should stay unchanged.</small>
                      </label>
                      <label className="freelancer-field">
                        <span>Queue / work lane</span>
                        <input
                          onChange={(event) => setEditDraft((current) => ({ ...current, queue: event.target.value }))}
                          placeholder="General, Sales, Delivery, Support"
                          value={editDraft.queue}
                        />
                        <small>Queue is the chat/work lane this manager owns, for example Sales, Delivery, Revisions, or Support.</small>
                      </label>
                    </div>
                  ),
                },
                {
                  title: "Permissions",
                  children: (
                    <div className="crm-permission-grid">
                      {managerPermissionLabels.map((permission) => (
                        <label className="crm-toggle-row" key={permission.key}>
                          <span>{permission.label}</span>
                          <input
                            checked={Boolean(permissionDraft[permission.key])}
                            onChange={() => setPermissionDraft((current) => ({ ...current, [permission.key]: !current[permission.key] }))}
                            type="checkbox"
                          />
                        </label>
                      ))}
                    </div>
                  ),
                },
              ]
        }
        status={drawerMode === "edit" ? <StatusBadge tone="success">{selectedEnabledPermissionCount} enabled</StatusBadge> : <StatusBadge tone="info">New seat</StatusBadge>}
        subtitle={drawerMode === "edit" ? selectedManager?.email : "Create a focused operator seat for chats, reviews, or assignments."}
        title={drawerMode === "edit" ? selectedManager?.name ?? "Manager" : "Create Manager"}
      />
    </div>
  );
}

export function AdminCustomerPrivacyPanel() {
  const [settings, setSettings] = useState<DummyCustomerPrivacySettings | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchAdminCustomerPrivacySettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  async function toggleSetting(key: "maskCustomerPhoneForManagers" | "maskCustomerPhoneForFreelancers", currentValue: boolean) {
    const response = await fetch("/api/admin/customer-privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [key]: !currentValue,
      }),
    });
    const payload = await response.json();
    if (payload.ok) {
      setSettings(payload.settings ?? null);
      setStatus(key === "maskCustomerPhoneForManagers" ? "Manager phone visibility updated." : "Freelancer phone visibility default updated.");
      return;
    }

    setStatus(payload.error ?? "Unable to update customer privacy settings.");
  }

  return (
    <article className="gx-card gx-privacy-panel">
      <div>
        <span className="meta-pill">Customer privacy</span>
        <strong>Phone visibility</strong>
      </div>
      <div className="crm-permission-grid">
        <label className="crm-toggle-row">
          <span>Mask customer number for managers</span>
          <input
            checked={Boolean(settings?.maskCustomerPhoneForManagers)}
            onChange={() => toggleSetting("maskCustomerPhoneForManagers", Boolean(settings?.maskCustomerPhoneForManagers))}
            type="checkbox"
          />
        </label>
        <label className="crm-toggle-row">
          <span>Mask customer number for freelancers</span>
          <input
            checked={Boolean(settings?.maskCustomerPhoneForFreelancers)}
            onChange={() => toggleSetting("maskCustomerPhoneForFreelancers", Boolean(settings?.maskCustomerPhoneForFreelancers))}
            type="checkbox"
          />
        </label>
      </div>
      {status ? <p className="helper-text">{status}</p> : null}
    </article>
  );
}

export function ManagerCustomerPrivacyPanel() {
  const [settings, setSettings] = useState<DummyCustomerPrivacySettings | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchManagerCustomerPrivacySettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  async function toggleMasking() {
    const currentValue = Boolean(settings?.maskCustomerPhoneForFreelancers);
    const response = await fetch("/api/manager/customer-privacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maskCustomerPhoneForFreelancers: !currentValue,
      }),
    });
    const payload = await response.json();
    if (payload.ok) {
      setSettings(payload.settings ?? null);
      setStatus("Freelancer phone visibility updated.");
      return;
    }

    setStatus(payload.error ?? "Unable to update freelancer masking.");
  }

  return (
    <div className="dashboard-shell compact">
      <p className="eyebrow">Freelancer privacy</p>
      <h2 className="section-heading">Managers can decide whether routed freelancers should see the real client number or a masked version while handling assigned conversations.</h2>
      <div className="board-list">
        <article className="brief-card">
          <span className="meta-pill">Freelancer visibility</span>
          <label className="crm-toggle-row">
            <span>Mask customer number for freelancers</span>
            <input checked={Boolean(settings?.maskCustomerPhoneForFreelancers)} onChange={toggleMasking} type="checkbox" />
          </label>
          <p className="muted-copy">
            {settings?.maskCustomerPhoneForFreelancers
              ? "Freelancers currently see a masked client number."
              : "Freelancers currently see the full client number on assigned conversations."}
          </p>
          {status ? <p className="helper-text">{status}</p> : null}
        </article>
      </div>
    </div>
  );
}

type ContactsTableProps = {
  audience: "admin" | "manager";
  managerId?: string;
};

export function ContactsTable({ audience, managerId = "manager-rahul" }: ContactsTableProps) {
  const [payload, setPayload] = useState<ContactsPayload>({ contacts: [], statuses: [], managers: [] });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "lastActivity" | "unreadCount">("lastActivity");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetchContactsPayload().then(setPayload).catch(() => setPayload({ contacts: [], statuses: [], managers: [] }));
  }, []);

  const activeManager = useMemo(
    () => payload.managers.find((manager) => manager.id === managerId) ?? payload.managers[0] ?? null,
    [managerId, payload.managers],
  );

  const hasAccess = audience === "admin" || Boolean(activeManager?.permissions.allContacts);
  const assigneeOptions = useMemo(
    () => [
      ...payload.managers.map((manager) => ({ id: manager.id, name: manager.name })),
      ...editorPerformanceProfiles.map((editor) => ({ id: editor.id, name: editor.name })),
    ],
    [payload.managers],
  );

  const visibleContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const nextContacts = payload.contacts.filter((contact) => {
      if (!query) {
        return true;
      }

      const haystack = [
        contact.name,
        contact.phone,
        contact.currentService,
        contact.latestStatusLabel,
        contact.assignedUserName,
        contact.notes,
        ...contact.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    return nextContacts.sort((left, right) => {
      if (sortBy === "name") {
        return left.name.localeCompare(right.name);
      }

      if (sortBy === "unreadCount") {
        return right.unreadCount - left.unreadCount;
      }

      return right.lastActivity.localeCompare(left.lastActivity);
    });
  }, [payload.contacts, search, sortBy]);

  async function updateContact(contactId: string, updates: Record<string, unknown>) {
    const response = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        ...updates,
      }),
    });
    const nextPayload = await fetchContactsPayload().catch(() => payload);
    startTransition(() => {
      setPayload(nextPayload);
    });
    const result = await response.json();
    setStatusMessage(result.ok ? "Contact updated." : result.error ?? "Unable to update contact.");
  }

  if (!hasAccess) {
    return (
      <div className="dashboard-shell compact">
        <p className="eyebrow">All contacts</p>
        <h2 className="section-heading">This simulated manager account does not have All Contacts access yet.</h2>
        <p className="muted-copy">Enable the All Contacts toggle in Admin &gt; Managers to unlock this spreadsheet view.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell compact crm-contacts-page">
      <header className="crm-contacts-header">
        <p className="eyebrow">All contacts</p>
        <h2 className="section-heading">Client contact CRM</h2>
        <p className="muted-copy">Search contacts, update status, assign owners, and open the linked chat.</p>
      </header>
      <div className="crm-contacts-toolbar">
        <label className="chat-search-field crm-contacts-search">
          <input
            className="chat-search-input"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search contacts, phone, tags, service, notes"
            style={{
              border: "0",
              borderWidth: "0",
              outline: "0",
              background: "transparent",
              backgroundColor: "transparent",
              boxShadow: "none",
              borderRadius: "0",
              padding: "0",
            }}
            value={search}
          />
        </label>
        <label className="freelancer-field crm-contacts-sort">
          <span>Sort by</span>
          <select onChange={(event) => setSortBy(event.target.value as "name" | "lastActivity" | "unreadCount")} value={sortBy}>
            <option value="lastActivity">Last activity</option>
            <option value="unreadCount">Unread count</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      {statusMessage ? <p className="helper-text">{statusMessage}</p> : null}
      <div className="crm-table-shell">
        <table className="crm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Tags</th>
              <th>Current service</th>
              <th>Status</th>
              <th>Unread</th>
              <th>Last activity</th>
              <th>Assigned user</th>
              <th>Notes</th>
              <th>Chat</th>
            </tr>
          </thead>
          <tbody>
            {visibleContacts.map((contact) => (
              <tr key={contact.id}>
                <td data-label="Name">{contact.name}</td>
                <td data-label="Phone">{contact.phone}</td>
                <td data-label="Tags">
                  <input
                    defaultValue={contact.tags.join(", ")}
                    onBlur={(event) =>
                      updateContact(contact.id, {
                        tags: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }).catch(() => undefined)
                    }
                  />
                </td>
                <td data-label="Current service">{contact.currentService}</td>
                <td data-label="Status">
                  <select
                    defaultValue={contact.latestStatusId}
                    onChange={(event) => updateContact(contact.id, { latestStatusId: event.target.value }).catch(() => undefined)}
                  >
                    {payload.statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Unread">{contact.unreadCount || "-"}</td>
                <td data-label="Last activity">{formatTimeLabel(contact.lastActivity)}</td>
                <td data-label="Assigned user">
                  <select
                    defaultValue={contact.assignedUserId}
                    onChange={(event) => updateContact(contact.id, { assignedUserId: event.target.value }).catch(() => undefined)}
                  >
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Notes">
                  <textarea defaultValue={contact.notes} onBlur={(event) => updateContact(contact.id, { notes: event.target.value }).catch(() => undefined)} />
                </td>
                <td data-label="Chat">
                  {contact.conversationId ? (
                    <Link className="secondary-button" href={`/${audience}/chat?conversationId=${contact.conversationId}`}>
                      Open
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminUpiSettingsPanel() {
  const [config, setConfig] = useState<DummyUpiConfig | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetchUpiConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  async function persist(updates: Partial<DummyUpiConfig>) {
    const response = await fetch("/api/admin/upi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: updates.enabled ?? config?.enabled,
        upiId: updates.upiId ?? config?.upiId,
        payeeName: updates.payeeName ?? config?.payeeName,
        currency: updates.currency ?? config?.currency,
        notePrefix: updates.notePrefix ?? config?.notePrefix,
      }),
    });
    const payload = await response.json();
    setConfig((payload.config ?? null) as DummyUpiConfig | null);
    setStatus(payload.ok ? "UPI settings saved for dummy chat payments." : payload.error ?? "Unable to save UPI settings.");
  }

  if (!config) {
    return null;
  }

  const previewUrl = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=${encodeURIComponent(config.payeeName)}&am=4900&cu=${config.currency}&tn=${encodeURIComponent(`${config.notePrefix}: Finance With Rahul`)}`;
  const previewMessage = `*Admin:* Please complete the payment on ${config.upiId} for INR 4,900.`;

  return (
    <div className="stack-list admin-upi-settings-panel">
      <div className="freelancer-form-grid">
        <label className="freelancer-field">
          <span>Enabled</span>
          <select defaultValue={config.enabled ? "yes" : "no"} onChange={(event) => persist({ enabled: event.target.value === "yes" }).catch(() => undefined)}>
            <option value="yes">yes</option>
            <option value="no">no</option>
          </select>
        </label>
        <label className="freelancer-field">
          <span>UPI ID / VPA</span>
          <input defaultValue={config.upiId} onBlur={(event) => persist({ upiId: event.target.value }).catch(() => undefined)} />
        </label>
        <label className="freelancer-field">
          <span>Payee / business name</span>
          <input defaultValue={config.payeeName} onBlur={(event) => persist({ payeeName: event.target.value }).catch(() => undefined)} />
        </label>
        <label className="freelancer-field">
          <span>Currency</span>
          <input defaultValue={config.currency} onBlur={(event) => persist({ currency: event.target.value as "INR" }).catch(() => undefined)} />
        </label>
        <label className="freelancer-field freelancer-field-full">
          <span>Default payment note prefix</span>
          <input defaultValue={config.notePrefix} onBlur={(event) => persist({ notePrefix: event.target.value }).catch(() => undefined)} />
        </label>
      </div>
      <div className="brief-grid two-up admin-upi-preview-grid">
        <article className="brief-card admin-upi-preview-card">
          <span className="meta-pill">UPI preview</span>
          <strong className="admin-upi-preview-value">{previewUrl}</strong>
          <p className="muted-copy">This deep link is what the chat-side payment request flow will generate for the client.</p>
        </article>
        <article className="brief-card admin-upi-preview-card">
          <span className="meta-pill">WhatsApp template preview</span>
          <strong className="admin-upi-preview-value">{previewMessage}</strong>
          <p className="muted-copy">Customer-lane payment requests will use this style of message until a live gateway is added.</p>
        </article>
      </div>
      {status ? <p className="helper-text">{status}</p> : null}
    </div>
  );
}
