"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Users,
  UserCog,
  ShieldCheck,
  Lock,
  EyeOff,
  Eye,
  Ban,
  MessageSquare,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Shield,
  Clock,
  Sparkles,
  Sliders,
  Check,
} from "lucide-react";

import { AdminCustomerPrivacyPanel } from "@/components/crm/crm-dummy-controls";
import {
  DataTable,
  DetailDrawer,
  EmptyState,
  SectionTabs,
  StatusBadge,
} from "@/components/ui/product-system";

type InHouseSettings = {
  exclusiveAgencyOnly: boolean;
  marketplaceVisible: boolean;
  canCreateGigs: boolean;
  canSendCustomerMessage: boolean;
  directClientDelivery: boolean;
};

type InHouseEditorItem = {
  id: string;
  membershipId: string;
  freelancerId: string;
  name: string;
  phone: string;
  email: string | null;
  roleType: string;
  status: string;
  inHouseSettings: InHouseSettings;
  joinedAt: string;
  updatedAt: string;
};

type ManagerItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  queue: string;
  active: boolean;
  permissions: {
    chatInbox: boolean;
    assignedChats: boolean;
    quoteReview: boolean;
    deliveryReview: boolean;
    walletReview: boolean;
    escalations: boolean;
    allContacts: boolean;
  };
  createdAt: string;
  lastLoginAt: string | null;
};

type PendingInviteItem = {
  id: string;
  freelancerId: string;
  name: string;
  roleType: string;
  status: string;
  message: string;
  inHouseSettings: InHouseSettings;
  createdAt: string;
  expiresAt: string | null;
};

type StaffData = {
  counts: {
    managers: number;
    inhouseEditors: number;
    restrictedEditors: number;
    pendingInvites: number;
  };
  managers: ManagerItem[];
  inhouseEditors: InHouseEditorItem[];
  pendingInvites: PendingInviteItem[];
};

export function AdminStaffHub() {
  const [data, setData] = useState<StaffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "editors" | "managers" | "invites">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  // Create Drawer state (using DetailDrawer for consistent, beautiful slide-out UX)
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [createRole, setCreateRole] = useState<"FREELANCER" | "MANAGER">("FREELANCER");
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRoleType, setCreateRoleType] = useState("In-house Video Editor");
  const [createPin, setCreatePin] = useState("");
  const [createQueue, setCreateQueue] = useState("General operations");

  // In-house settings for creation
  const [inHouseExclusive, setInHouseExclusive] = useState(true);
  const [inHouseMarketplaceVisible, setInHouseMarketplaceVisible] = useState(false);
  const [inHouseCanCreateGigs, setInHouseCanCreateGigs] = useState(false);
  const [inHouseCanSendCustomerMessage, setInHouseCanSendCustomerMessage] = useState(false);
  const [inHouseDirectClientDelivery, setInHouseDirectClientDelivery] = useState(false);

  // Manager permissions for creation
  const [mgrChatInbox, setMgrChatInbox] = useState(true);
  const [mgrAssignedChats, setMgrAssignedChats] = useState(true);
  const [mgrQuoteReview, setMgrQuoteReview] = useState(false);
  const [mgrDeliveryReview, setMgrDeliveryReview] = useState(false);
  const [mgrWalletReview, setMgrWalletReview] = useState(false);
  const [mgrEscalations, setMgrEscalations] = useState(false);
  const [mgrAllContacts, setMgrAllContacts] = useState(false);

  // Edit In-House Editor state
  const [editingEditor, setEditingEditor] = useState<InHouseEditorItem | null>(null);
  const [editInHouseSettings, setEditInHouseSettings] = useState<InHouseSettings>({
    exclusiveAgencyOnly: true,
    marketplaceVisible: false,
    canCreateGigs: false,
    canSendCustomerMessage: false,
    directClientDelivery: false,
  });

  // Edit Manager state
  const [editingManager, setEditingManager] = useState<ManagerItem | null>(null);
  const [editMgrPermissions, setEditMgrPermissions] = useState<ManagerItem["permissions"]>({
    chatInbox: true,
    assignedChats: true,
    quoteReview: false,
    deliveryReview: false,
    walletReview: false,
    escalations: false,
    allContacts: false,
  });
  const [editMgrQueue, setEditMgrQueue] = useState("General operations");
  const [editMgrPin, setEditMgrPin] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/staff", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load staff records");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error fetching staff data";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const handleCreateStaff = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!createName.trim() || !createPhone.trim()) {
      setStatusMessage({ type: "error", text: "Please provide staff member name and WhatsApp number." });
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const payload: Record<string, unknown> = {
        role: createRole,
        name: createName.trim(),
        phone: createPhone.trim(),
        email: createEmail.trim() || undefined,
      };

      if (createRole === "MANAGER") {
        payload.pin = createPin.trim() || undefined;
        payload.queue = createQueue.trim() || "General operations";
        payload.permissions = {
          chatInbox: mgrChatInbox,
          assignedChats: mgrAssignedChats,
          quoteReview: mgrQuoteReview,
          deliveryReview: mgrDeliveryReview,
          walletReview: mgrWalletReview,
          escalations: mgrEscalations,
          allContacts: mgrAllContacts,
        };
      } else {
        payload.roleType = createRoleType.trim() || "In-house Video Editor";
        payload.inHouseSettings = {
          exclusiveAgencyOnly: inHouseExclusive,
          marketplaceVisible: inHouseMarketplaceVisible,
          canCreateGigs: inHouseCanCreateGigs,
          canSendCustomerMessage: inHouseCanSendCustomerMessage,
          directClientDelivery: inHouseDirectClientDelivery,
        };
      }

      const res = await fetch("/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || "Failed to create staff member.");
      }

      setStatusMessage({ type: "success", text: result.message || "Staff member assigned successfully!" });
      setShowCreateDrawer(false);
      resetCreateForm();
      fetchStaffData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while creating staff.";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditorPermissions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingEditor) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/staff/editors/${editingEditor.freelancerId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inHouseSettings: editInHouseSettings }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        throw new Error(result.error || "Failed to update permissions.");
      }

      setStatusMessage({ type: "success", text: `Permissions updated for ${editingEditor.name}.` });
      setEditingEditor(null);
      fetchStaffData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update permissions.";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveManagerPermissions = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingManager) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/managers/${editingManager.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queue: editMgrQueue,
          permissions: editMgrPermissions,
          pin: editMgrPin.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) {
        throw new Error(result.error || "Failed to update manager.");
      }

      setStatusMessage({ type: "success", text: `Manager settings updated for ${editingManager.name}.` });
      setEditingManager(null);
      fetchStaffData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update manager.";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setCreateName("");
    setCreatePhone("");
    setCreateEmail("");
    setCreatePin("");
    setInHouseExclusive(true);
    setInHouseMarketplaceVisible(false);
    setInHouseCanCreateGigs(false);
    setInHouseCanSendCustomerMessage(false);
    setInHouseDirectClientDelivery(false);
    setMgrChatInbox(true);
    setMgrAssignedChats(true);
    setMgrQuoteReview(false);
    setMgrDeliveryReview(false);
    setMgrWalletReview(false);
    setMgrEscalations(false);
    setMgrAllContacts(false);
  };

  const openEditEditor = (editor: InHouseEditorItem) => {
    setEditingEditor(editor);
    setEditInHouseSettings({ ...editor.inHouseSettings });
  };

  const openEditManager = (manager: ManagerItem) => {
    setEditingManager(manager);
    setEditMgrPermissions({ ...manager.permissions });
    setEditMgrQueue(manager.queue || "General operations");
    setEditMgrPin("");
  };

  // Filter lists by search query
  const query = searchQuery.trim().toLowerCase();
  const filteredEditors = (data?.inhouseEditors || []).filter(
    (e) => !query || e.name.toLowerCase().includes(query) || e.phone.includes(query) || (e.email && e.email.toLowerCase().includes(query))
  );
  const filteredManagers = (data?.managers || []).filter(
    (m) => !query || m.name.toLowerCase().includes(query) || m.phone.includes(query) || m.email.toLowerCase().includes(query)
  );

  return (
    <div className="dashboard-shell compact gx-clean-operating-page gx-ops-workspace">
      {/* Top Customer Privacy Control Box (matching native Managers workspace) */}
      <div className="board-list">
        <AdminCustomerPrivacyPanel />
      </div>

      {/* Clean Operating Header */}
      <div className="gx-clean-header-row">
        <div>
          <p className="section-label">Agency Team & In-House Control</p>
          <h2 className="app-section-title">Assign Staff & In-House Editors</h2>
        </div>
        <button
          className="gx-button gx-button-primary"
          onClick={() => {
            resetCreateForm();
            setShowCreateDrawer(true);
          }}
          type="button"
        >
          <Plus size={16} />
          Create & Assign Staff
        </button>
      </div>

      {/* Alert / Notification Feedback */}
      {statusMessage && (
        <div
          className={`gx-card flex items-center justify-between p-3.5 rounded-xl border ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
          style={{ fontSize: "0.8125rem" }}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            className="gx-button gx-button-ghost"
            onClick={() => setStatusMessage(null)}
            style={{ minHeight: "1.75rem", padding: "0 0.5rem" }}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Standard Compact Metric Strip */}
      <div className="gx-compact-metric-strip">
        <div className="gx-compact-metric">
          <span>Total active staff</span>
          <strong>{(data?.inhouseEditors.length ?? 0) + (data?.managers.length ?? 0)}</strong>
        </div>
        <div className="gx-compact-metric">
          <span>In-house editors</span>
          <strong>{data?.counts.inhouseEditors ?? 0}</strong>
        </div>
        <div className="gx-compact-metric">
          <span>Locked & restricted</span>
          <strong>{data?.counts.restrictedEditors ?? 0}</strong>
        </div>
        <div className="gx-compact-metric">
          <span>Operations managers</span>
          <strong>{data?.counts.managers ?? 0}</strong>
        </div>
      </div>

      {/* Navigation Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionTabs
          activeTab={filterTab}
          onTabChange={(id) => setFilterTab(id as "all" | "editors" | "managers" | "invites")}
          tabs={[
            { id: "all", label: "All Staff", count: (data?.inhouseEditors.length ?? 0) + (data?.managers.length ?? 0) },
            { id: "editors", label: "In-House Editors", count: data?.inhouseEditors.length ?? 0 },
            { id: "managers", label: "Operations Managers", count: data?.managers.length ?? 0 },
            { id: "invites", label: "Pending Invites", count: data?.pendingInvites.length ?? 0 },
          ]}
        />

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
          <input
            className="gx-input pl-8"
            placeholder="Search staff by name or phone..."
            style={{ minHeight: "2.25rem", fontSize: "0.75rem" }}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 1. In-House Video Editors Section */}
      {(filterTab === "all" || filterTab === "editors") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="app-section-title" style={{ fontSize: "0.875rem" }}>
              In-House Video Editors (Dedicated Agency Staff)
            </h3>
            <span className="gx-muted-text">{filteredEditors.length} members</span>
          </div>

          <DataTable
            columns={[
              {
                key: "editor",
                header: "Editor",
                render: (editor: InHouseEditorItem) => (
                  <div className="gx-table-identity">
                    <strong>{editor.name}</strong>
                    <span>{editor.phone}</span>
                    <span className="text-xs text-muted-foreground">{editor.roleType}</span>
                  </div>
                ),
              },
              {
                key: "exclusivity",
                header: "Exclusivity",
                render: (editor: InHouseEditorItem) => (
                  <StatusBadge tone={editor.inHouseSettings.exclusiveAgencyOnly ? "accent" : "neutral"}>
                    {editor.inHouseSettings.exclusiveAgencyOnly ? "Exclusive" : "Independent"}
                  </StatusBadge>
                ),
              },
              {
                key: "marketplace",
                header: "Marketplace Search",
                render: (editor: InHouseEditorItem) => (
                  <StatusBadge tone={!editor.inHouseSettings.marketplaceVisible ? "neutral" : "info"}>
                    {!editor.inHouseSettings.marketplaceVisible ? "Hidden from rivals" : "Public Visible"}
                  </StatusBadge>
                ),
              },
              {
                key: "gigs",
                header: "Gig Creation",
                render: (editor: InHouseEditorItem) => (
                  <StatusBadge tone={!editor.inHouseSettings.canCreateGigs ? "error" : "success"}>
                    {!editor.inHouseSettings.canCreateGigs ? "Blocked Gigs" : "Allowed"}
                  </StatusBadge>
                ),
              },
              {
                key: "chat",
                header: "Client Chat",
                render: (editor: InHouseEditorItem) => (
                  <StatusBadge tone={!editor.inHouseSettings.canSendCustomerMessage ? "neutral" : "success"}>
                    {!editor.inHouseSettings.canSendCustomerMessage ? "Read-Only" : "Direct Chat"}
                  </StatusBadge>
                ),
              },
              {
                key: "delivery",
                header: "Delivery",
                render: (editor: InHouseEditorItem) => (
                  <StatusBadge tone={!editor.inHouseSettings.directClientDelivery ? "warning" : "success"}>
                    {!editor.inHouseSettings.directClientDelivery ? "Review Required" : "Direct"}
                  </StatusBadge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (editor: InHouseEditorItem) => (
                  <div className="gx-table-actions">
                    <button
                      className="gx-button gx-button-secondary gx-system-action"
                      onClick={() => openEditEditor(editor)}
                      type="button"
                    >
                      <Sliders size={13} className="mr-1" />
                      Edit Permissions
                    </button>
                  </div>
                ),
              },
            ]}
            emptyState={
              <EmptyState
                title="No in-house editors assigned yet"
                description="Assign freelance video editors as dedicated in-house staff to lock their marketplace gigs and protect them from rival agencies."
              />
            }
            getRowKey={(row) => row.id}
            loading={loading}
            rows={filteredEditors}
          />
        </div>
      )}

      {/* 2. Operations Managers Section */}
      {(filterTab === "all" || filterTab === "managers") && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="app-section-title" style={{ fontSize: "0.875rem" }}>
              Operations Managers (Sub-Admins under Agency)
            </h3>
            <span className="gx-muted-text">{filteredManagers.length} managers</span>
          </div>

          <DataTable
            columns={[
              {
                key: "manager",
                header: "Manager",
                render: (manager: ManagerItem) => (
                  <div className="gx-table-identity">
                    <strong>{manager.name}</strong>
                    <span>{manager.email}</span>
                    <span>{manager.phone}</span>
                  </div>
                ),
              },
              {
                key: "queue",
                header: "Queue",
                render: (manager: ManagerItem) => manager.queue || "General operations",
              },
              {
                key: "status",
                header: "Status",
                render: (manager: ManagerItem) => (
                  <StatusBadge tone={manager.active ? "success" : "warning"}>
                    {manager.active ? "Active" : "Paused"}
                  </StatusBadge>
                ),
              },
              {
                key: "permissions",
                header: "Active Capabilities",
                render: (manager: ManagerItem) => {
                  const enabled = Object.values(manager.permissions).filter(Boolean).length;
                  return (
                    <span className="text-xs font-medium text-foreground">
                      {enabled} / 7 capabilities active
                    </span>
                  );
                },
              },
              {
                key: "actions",
                header: "Actions",
                render: (manager: ManagerItem) => (
                  <div className="gx-table-actions">
                    <button
                      className="gx-button gx-button-secondary gx-system-action"
                      onClick={() => openEditManager(manager)}
                      type="button"
                    >
                      <Sliders size={13} className="mr-1" />
                      Configure
                    </button>
                  </div>
                ),
              },
            ]}
            emptyState={
              <EmptyState
                title="No managers registered"
                description="Add operations managers with designated permissions to handle client inboxes, quote moderation, and delivery reviews."
              />
            }
            getRowKey={(row) => row.id}
            loading={loading}
            rows={filteredManagers}
          />
        </div>
      )}

      {/* 3. Pending Staff Invites Section */}
      {(filterTab === "all" || filterTab === "invites") && (data?.pendingInvites?.length ?? 0) > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="app-section-title" style={{ fontSize: "0.875rem" }}>
              Pending Staff Invitations
            </h3>
            <span className="gx-muted-text">{data?.pendingInvites.length} pending</span>
          </div>

          <DataTable
            columns={[
              {
                key: "invitee",
                header: "Invitee",
                render: (invite: PendingInviteItem) => (
                  <div className="gx-table-identity">
                    <strong>{invite.name}</strong>
                    <span>{invite.roleType}</span>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: () => <StatusBadge tone="warning">Pending Acceptance</StatusBadge>,
              },
              {
                key: "terms",
                header: "Configured Controls",
                render: (invite: PendingInviteItem) => (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {invite.inHouseSettings.exclusiveAgencyOnly && (
                      <StatusBadge tone="accent">Exclusive</StatusBadge>
                    )}
                    {!invite.inHouseSettings.marketplaceVisible && (
                      <StatusBadge tone="neutral">Stealth</StatusBadge>
                    )}
                    {!invite.inHouseSettings.canCreateGigs && (
                      <StatusBadge tone="error">Gigs Blocked</StatusBadge>
                    )}
                  </div>
                ),
              },
              {
                key: "date",
                header: "Invited At",
                render: (invite: PendingInviteItem) => new Date(invite.createdAt).toLocaleDateString("en-IN"),
              },
            ]}
            emptyState={<EmptyState title="No pending invites" description="All staff invitations have been resolved." />}
            getRowKey={(row) => row.id}
            rows={data?.pendingInvites || []}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE & ASSIGN STAFF DRAWER (Native DetailDrawer with Lime Checkmarks) */}
      {/* ========================================================================= */}
      <DetailDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        title="Create & Assign Staff Member"
        subtitle="Add an operations manager or dedicated in-house video editor to your agency"
        sections={[
          {
            title: "Staff Role",
            children: (
              <div className="space-y-3">
                <div className="gx-section-tabs" role="tablist" style={{ width: "100%" }}>
                  <button
                    type="button"
                    role="tab"
                    className={`gx-section-tab ${createRole === "FREELANCER" ? "gx-section-tab-active" : ""}`}
                    onClick={() => setCreateRole("FREELANCER")}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <span>In-House Video Editor</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`gx-section-tab ${createRole === "MANAGER" ? "gx-section-tab-active" : ""}`}
                    onClick={() => setCreateRole("MANAGER")}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    <span>Operations Manager</span>
                  </button>
                </div>
                <p className="gx-muted-text" style={{ fontSize: "0.75rem", lineHeight: 1.4 }}>
                  {createRole === "FREELANCER"
                    ? "Dedicated creative editor locked exclusively to your agency. Gigs blocked & hidden from rivals."
                    : "Operations sub-admin who can manage client chat inboxes, quote review, or delivery inspection."}
                </p>
              </div>
            ),
          },
          {
            title: "Staff Information",
            children: (
              <div style={{ display: "grid", gap: "0.875rem" }}>
                <div>
                  <label className="gx-label">Full Name *</label>
                  <input
                    className="gx-input"
                    placeholder="e.g. Rahul Verma"
                    required
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="gx-label">WhatsApp Number (OTP login) *</label>
                  <input
                    className="gx-input"
                    placeholder="+919876543210"
                    required
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                  />
                </div>

                {createRole === "FREELANCER" ? (
                  <div>
                    <label className="gx-label">Role Title</label>
                    <input
                      className="gx-input"
                      placeholder="e.g. In-house Video Editor, Senior Colorist"
                      type="text"
                      value={createRoleType}
                      onChange={(e) => setCreateRoleType(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="gx-label">Manager Email *</label>
                      <input
                        className="gx-input"
                        placeholder="manager@agency.com"
                        required
                        type="email"
                        value={createEmail}
                        onChange={(e) => setCreateEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="gx-label">6-Digit Manager PIN *</label>
                      <input
                        className="gx-input"
                        maxLength={6}
                        placeholder="654321"
                        required
                        type="password"
                        value={createPin}
                        onChange={(e) => setCreatePin(e.target.value.replace(/\D/g, ""))}
                      />
                      <small className="gx-muted-text" style={{ display: "block", marginTop: "0.25rem", fontSize: "0.6875rem" }}>
                        Set a 6-digit PIN because the manager login uses the same 6-digit OTP field.
                      </small>
                    </div>
                    <div>
                      <label className="gx-label">Designated Queue / Work Lane</label>
                      <input
                        className="gx-input"
                        placeholder="General operations"
                        type="text"
                        value={createQueue}
                        onChange={(e) => setCreateQueue(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            ),
          },
          ...(createRole === "FREELANCER"
            ? [
                {
                  title: "In-House Protection & Controls",
                  children: (
                    <div className="space-y-3">
                      {/* Insight Notice */}
                      <div
                        style={{
                          padding: "0.75rem",
                          border: "1px solid var(--color-primary-border, rgba(215,255,47,0.2))",
                          background: "var(--color-primary-soft, rgba(215,255,47,0.06))",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <strong
                          style={{
                            color: "var(--color-primary, #D7FF2F)",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <ShieldCheck size={15} /> Agency Ownership & Exclusivity Guard
                        </strong>
                        <p
                          style={{
                            margin: "0.25rem 0 0",
                            color: "var(--color-text-secondary)",
                            fontSize: "0.75rem",
                            lineHeight: "1.4",
                          }}
                        >
                          In-house editors cannot be poached by rival agencies, are hidden from discovery searches, and cannot publish marketplace gigs.
                        </p>
                      </div>

                      {/* Native crm-toggle-row inputs with custom Lime checkmarks */}
                      <div className="crm-permission-grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                        <label className="crm-toggle-row">
                          <div>
                            <span style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              Exclusive Agency Lock (Poaching Protection)
                            </span>
                            <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              Editor cannot accept invitations from or work with other agencies.
                            </small>
                          </div>
                          <input
                            type="checkbox"
                            checked={inHouseExclusive}
                            onChange={(e) => setInHouseExclusive(e.target.checked)}
                          />
                        </label>

                        <label className="crm-toggle-row">
                          <div>
                            <span style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              Marketplace Stealth Mode (Hide Profile)
                            </span>
                            <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              Completely hidden from public directory and competitor searches.
                            </small>
                          </div>
                          <input
                            type="checkbox"
                            checked={!inHouseMarketplaceVisible}
                            onChange={(e) => setInHouseMarketplaceVisible(!e.target.checked)}
                          />
                        </label>

                        <label className="crm-toggle-row">
                          <div>
                            <span style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              Lock Gig Creation (No Freelance Gigs)
                            </span>
                            <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              Strictly block editor from creating, editing, or publishing public gigs.
                            </small>
                          </div>
                          <input
                            type="checkbox"
                            checked={!inHouseCanCreateGigs}
                            onChange={(e) => setInHouseCanCreateGigs(!e.target.checked)}
                          />
                        </label>

                        <label className="crm-toggle-row">
                          <div>
                            <span style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              Read-Only Customer Chat Lanes
                            </span>
                            <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              Editor can read client chats but cannot directly send messages to clients.
                            </small>
                          </div>
                          <input
                            type="checkbox"
                            checked={!inHouseCanSendCustomerMessage}
                            onChange={(e) => setInHouseCanSendCustomerMessage(!e.target.checked)}
                          />
                        </label>

                        <label className="crm-toggle-row">
                          <div>
                            <span style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                              Delivery Review Gate
                            </span>
                            <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              Submitted videos require manager/admin sign-off before client delivery.
                            </small>
                          </div>
                          <input
                            type="checkbox"
                            checked={!inHouseDirectClientDelivery}
                            onChange={(e) => setInHouseDirectClientDelivery(!e.target.checked)}
                          />
                        </label>
                      </div>
                    </div>
                  ),
                },
              ]
            : [
                {
                  title: "Manager Capabilities & Permissions",
                  children: (
                    <div className="crm-permission-grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                      {[
                        { key: "chatInbox", label: "Chat Inbox Access", state: mgrChatInbox, setter: setMgrChatInbox },
                        { key: "assignedChats", label: "Assigned Chats Only", state: mgrAssignedChats, setter: setMgrAssignedChats },
                        { key: "quoteReview", label: "Quote Review & Custom Pricing", state: mgrQuoteReview, setter: setMgrQuoteReview },
                        { key: "deliveryReview", label: "Delivery Review & File Approval", state: mgrDeliveryReview, setter: setMgrDeliveryReview },
                        { key: "walletReview", label: "Wallet & Ledger Review", state: mgrWalletReview, setter: setMgrWalletReview },
                        { key: "escalations", label: "Client Dispute Escalations", state: mgrEscalations, setter: setMgrEscalations },
                        { key: "allContacts", label: "All Contacts & CRM Access", state: mgrAllContacts, setter: setMgrAllContacts },
                      ].map((perm) => (
                        <label className="crm-toggle-row" key={perm.key}>
                          <span style={{ color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 500 }}>
                            {perm.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={perm.state}
                            onChange={(e) => perm.setter(e.target.checked)}
                          />
                        </label>
                      ))}
                    </div>
                  ),
                },
              ]),
        ]}
        footer={
          <div className="flex items-center justify-end gap-3" style={{ width: "100%" }}>
            <button
              className="gx-button gx-button-ghost"
              onClick={() => setShowCreateDrawer(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="gx-button gx-button-primary"
              disabled={submitting}
              onClick={() => handleCreateStaff()}
              type="button"
            >
              {submitting ? "Assigning..." : "Assign Staff Member"}
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 5. EDIT IN-HOUSE EDITOR PERMISSIONS DRAWER */}
      {/* ========================================================================= */}
      <DetailDrawer
        open={Boolean(editingEditor)}
        onClose={() => setEditingEditor(null)}
        title={editingEditor ? `Permissions: ${editingEditor.name}` : "Permissions"}
        subtitle={editingEditor ? `${editingEditor.roleType} • ${editingEditor.phone}` : undefined}
        status={
          editingEditor?.inHouseSettings.exclusiveAgencyOnly ? (
            <StatusBadge tone="accent">Exclusive In-House</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Independent</StatusBadge>
          )
        }
        sections={[
          {
            title: "Exclusivity & Poaching Protection",
            children: (
              <div className="crm-permission-grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                <label className="crm-toggle-row">
                  <div>
                    <strong style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem" }}>
                      Exclusive Agency Lock
                    </strong>
                    <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      Locked to your agency. Outside agencies cannot send team invitations or hire this editor.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={editInHouseSettings.exclusiveAgencyOnly}
                    onChange={(e) =>
                      setEditInHouseSettings((s) => ({ ...s, exclusiveAgencyOnly: e.target.checked }))
                    }
                  />
                </label>

                <label className="crm-toggle-row">
                  <div>
                    <strong style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem" }}>
                      Marketplace Stealth Mode
                    </strong>
                    <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      Editor profile is completely hidden from competitor discovery and marketplace search.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={!editInHouseSettings.marketplaceVisible}
                    onChange={(e) =>
                      setEditInHouseSettings((s) => ({ ...s, marketplaceVisible: !e.target.checked }))
                    }
                  />
                </label>
              </div>
            ),
          },
          {
            title: "Gig Creation & Monetization",
            children: (
              <div className="crm-permission-grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                <label className="crm-toggle-row">
                  <div>
                    <strong style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem" }}>
                      Lock Gig Publishing
                    </strong>
                    <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      In-house editors cannot create, edit, or sell public gigs. Attempts return 403 Forbidden.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={!editInHouseSettings.canCreateGigs}
                    onChange={(e) =>
                      setEditInHouseSettings((s) => ({ ...s, canCreateGigs: !e.target.checked }))
                    }
                  />
                </label>
              </div>
            ),
          },
          {
            title: "Client Messaging & Quality Control",
            children: (
              <div className="crm-permission-grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                <label className="crm-toggle-row">
                  <div>
                    <strong style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem" }}>
                      Read-Only Customer Chat
                    </strong>
                    <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      Editor can read client chats in read-only mode, preventing unauthorized direct contact.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={!editInHouseSettings.canSendCustomerMessage}
                    onChange={(e) =>
                      setEditInHouseSettings((s) => ({ ...s, canSendCustomerMessage: !e.target.checked }))
                    }
                  />
                </label>

                <label className="crm-toggle-row">
                  <div>
                    <strong style={{ display: "block", color: "var(--color-text-primary)", fontSize: "0.8125rem" }}>
                      Require Delivery Review
                    </strong>
                    <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      Submitted videos must be inspected and approved by an agency manager before reaching the client.
                    </small>
                  </div>
                  <input
                    type="checkbox"
                    checked={!editInHouseSettings.directClientDelivery}
                    onChange={(e) =>
                      setEditInHouseSettings((s) => ({ ...s, directClientDelivery: !e.target.checked }))
                    }
                  />
                </label>
              </div>
            ),
          },
        ]}
        footer={
          <div className="flex items-center justify-end gap-3" style={{ width: "100%" }}>
            <button
              className="gx-button gx-button-ghost"
              onClick={() => setEditingEditor(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="gx-button gx-button-primary"
              disabled={submitting}
              onClick={() => handleSaveEditorPermissions()}
              type="button"
            >
              {submitting ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 6. EDIT MANAGER DRAWER */}
      {/* ========================================================================= */}
      <DetailDrawer
        open={Boolean(editingManager)}
        onClose={() => setEditingManager(null)}
        title={editingManager ? `Configure: ${editingManager.name}` : "Configure Manager"}
        subtitle={editingManager ? `${editingManager.email} • ${editingManager.phone}` : undefined}
        status={<StatusBadge tone={editingManager?.active ? "success" : "warning"}>{editingManager?.active ? "Active" : "Paused"}</StatusBadge>}
        sections={[
          {
            title: "Manager Routing Queue",
            children: (
              <div>
                <label className="gx-label">Assigned Queue</label>
                <input
                  className="gx-input"
                  placeholder="General operations"
                  type="text"
                  value={editMgrQueue}
                  onChange={(e) => setEditMgrQueue(e.target.value)}
                />
              </div>
            ),
          },
          {
            title: "Reset Manager PIN (Optional)",
            children: (
              <div>
                <label className="gx-label">New 6-Digit PIN</label>
                <input
                  className="gx-input"
                  maxLength={6}
                  placeholder="Leave empty to keep existing PIN"
                  type="password"
                  value={editMgrPin}
                  onChange={(e) => setEditMgrPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            ),
          },
          {
            title: "Active Capabilities",
            children: (
              <div className="crm-permission-grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
                {(
                  [
                    ["chatInbox", "Chat Inbox Access"],
                    ["assignedChats", "Assigned Chats Only"],
                    ["quoteReview", "Quote Review & Custom Pricing"],
                    ["deliveryReview", "Delivery Review & File Approval"],
                    ["walletReview", "Wallet & Ledger Review"],
                    ["escalations", "Client Dispute Escalations"],
                    ["allContacts", "All Contacts & CRM Access"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="crm-toggle-row">
                    <span style={{ color: "var(--color-text-primary)", fontSize: "0.8125rem", fontWeight: 500 }}>
                      {label}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(editMgrPermissions[key])}
                      onChange={(e) =>
                        setEditMgrPermissions((p) => ({ ...p, [key]: e.target.checked }))
                      }
                    />
                  </label>
                ))}
              </div>
            ),
          },
        ]}
        footer={
          <div className="flex items-center justify-end gap-3" style={{ width: "100%" }}>
            <button
              className="gx-button gx-button-ghost"
              onClick={() => setEditingManager(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="gx-button gx-button-primary"
              disabled={submitting}
              onClick={() => handleSaveManagerPermissions()}
              type="button"
            >
              {submitting ? "Saving..." : "Save Manager Settings"}
            </button>
          </div>
        }
      />
    </div>
  );
}
