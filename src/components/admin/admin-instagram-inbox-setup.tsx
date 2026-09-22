"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, CheckCircle2, Copy, ExternalLink, Pencil, Plus, RefreshCw, Smartphone } from "lucide-react";

import type { ChannelConnection, DummyInstagramConnectionState } from "@/lib/gigxomi/dummy-platform-store";

type SetupPayload = {
  ok?: boolean;
  error?: string;
  canManageToken?: boolean;
  connection?: (DummyInstagramConnectionState & { hasAccessToken?: boolean }) | null;
};

async function readConnection() {
  const response = await fetch("/api/admin/instagram", { cache: "no-store", credentials: "include" });
  const payload = (await response.json().catch(() => ({}))) as SetupPayload;
  return { response, payload };
}

export function AdminInstagramInboxSetup({ initialWebhookUrl }: { initialWebhookUrl: string }) {
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<(DummyInstagramConnectionState & { hasAccessToken?: boolean }) | null>(null);
  const [canManageToken, setCanManageToken] = useState(false);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSyncingMessages, setIsSyncingMessages] = useState(false);

  // Multi-account channel connections state
  const [connectionsList, setConnectionsList] = useState<ChannelConnection[]>([]);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [editingConnName, setEditingConnName] = useState<string>("");
  const [isSavingConnName, setIsSavingConnName] = useState<boolean>(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [newAccountLabel, setNewAccountLabel] = useState<string>("");
  const [newAccountHandle, setNewAccountHandle] = useState<string>("");
  const [newAccountIgId, setNewAccountIgId] = useState<string>("");
  const [isSavingNewAccount, setIsSavingNewAccount] = useState<boolean>(false);

  const queryError = searchParams.get("instagramError");
  const querySuccess = searchParams.get("instagramConnected") === "1";

  const fetchChannelConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/channel-connections?provider=INSTAGRAM", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && Array.isArray(data.connections)) {
        setConnectionsList(data.connections);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    readConnection()
      .then(({ response, payload }) => {
        if (!response.ok || payload.ok === false) {
          setStatus(payload.error ?? "Unable to load Instagram Inbox setup.");
          return;
        }
        setConnection(payload.connection ?? null);
        setCanManageToken(Boolean(payload.canManageToken));
      })
      .catch(() => setStatus("Unable to load Instagram Inbox setup."));

    fetchChannelConnections();
  }, [fetchChannelConnections]);

  async function save(updates: Partial<DummyInstagramConnectionState>) {
    setIsSaving(true);
    const response = await fetch("/api/admin/instagram", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pluginEnabled: true, ...updates }),
    });
    const payload = (await response.json().catch(() => ({}))) as SetupPayload;
    setIsSaving(false);
    if (!response.ok || payload.ok === false) {
      setStatus(payload.error ?? "Unable to save Instagram Inbox settings.");
      return;
    }
    setConnection(payload.connection ?? null);
    setCanManageToken(Boolean(payload.canManageToken));
    setStatus("Instagram Inbox setup saved.");
    fetchChannelConnections();
  }

  async function handleSaveConnectionLabel(connId: string) {
    if (!editingConnName.trim()) return;
    setIsSavingConnName(true);
    try {
      const res = await fetch(`/api/admin/channel-connections/${connId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName: editingConnName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setConnectionsList((prev) =>
          prev.map((c) => (c.id === connId ? { ...c, displayName: editingConnName.trim() } : c)),
        );
        setEditingConnId(null);
        setStatus(`Account label updated to "${editingConnName.trim()}". This label now appears across the unified inbox.`);
      } else {
        setStatus(data.error ?? "Failed to update account label.");
      }
    } catch {
      setStatus("Failed to update account label.");
    } finally {
      setIsSavingConnName(false);
    }
  }

  function copyToClipboard(text: string, fieldId: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField((cur) => (cur === fieldId ? null : cur)), 2500);
  }

  async function testWebhookConnection() {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const verifyToken = connection?.verifyToken ?? "";
      const res = await fetch(
        `/api/meta/instagram/webhook?hub.mode=subscribe&hub.challenge=test12345&hub.verify_token=${encodeURIComponent(verifyToken)}`,
      );
      const text = await res.text();
      if (res.ok && text.trim() === "test12345") {
        setWebhookTestResult({ ok: true, message: "Webhook is reachable and responds 200 OK." });
      } else {
        setWebhookTestResult({ ok: false, message: `Webhook check returned status ${res.status}.` });
      }
    } catch {
      setWebhookTestResult({ ok: false, message: "Failed to connect to webhook route." });
    } finally {
      setIsTestingWebhook(false);
    }
  }

  async function handleSyncMessages() {
    setIsSyncingMessages(true);
    setStatus("Syncing messages from Instagram Graph API...");
    try {
      const res = await fetch("/api/admin/instagram/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus(`Successfully synced ${data.processedMessages || 0} messages across ${data.threadsCount || 0} Instagram conversation threads.`);
      } else {
        setStatus(data.error ?? "Failed to sync Instagram messages.");
      }
    } catch {
      setStatus("Failed to connect to sync endpoint.");
    } finally {
      setIsSyncingMessages(false);
    }
  }

  async function handleSetPrimaryDefault(connId: string) {
    try {
      const res = await fetch(`/api/admin/channel-connections/${connId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setConnectionsList((prev) =>
          prev.map((c) => ({ ...c, isDefault: c.id === connId })),
        );
        setStatus("Primary Instagram account updated.");
      } else {
        setStatus(data.error ?? "Failed to update default account.");
      }
    } catch {
      setStatus("Failed to update default account.");
    }
  }

  async function handleDisconnectChannelConnection(connId: string) {
    try {
      const res = await fetch(`/api/admin/channel-connections/${connId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setConnectionsList((prev) => prev.filter((c) => c.id !== connId));
        setStatus("Instagram account disconnected. Past chat history was preserved.");
      } else {
        setStatus(data.error ?? "Failed to disconnect account.");
      }
    } catch {
      setStatus("Failed to disconnect account.");
    }
  }

  async function handleCreateChannelConnection() {
    if (!newAccountLabel.trim() && !newAccountHandle.trim()) {
      setStatus("Provide an account label and username for the new Instagram account.");
      return;
    }
    setIsSavingNewAccount(true);
    try {
      const cleanHandle = newAccountHandle.trim().replace(/^@/, "");
      const res = await fetch("/api/admin/channel-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          provider: "INSTAGRAM",
          displayName: newAccountLabel.trim() || `@${cleanHandle}`,
          accountHandle: cleanHandle ? `@${cleanHandle}` : undefined,
          username: cleanHandle,
          instagramBusinessAccountId: newAccountIgId.trim() || undefined,
          isDefault: connectionsList.length === 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok && data.connection) {
        setConnectionsList((prev) => [...prev, data.connection]);
        setShowAddAccountModal(false);
        setNewAccountLabel("");
        setNewAccountHandle("");
        setNewAccountIgId("");
        setStatus(`Added "${data.connection.displayName}". Direct messages will show this account in the unified inbox.`);
      } else {
        setStatus(data.error ?? "Failed to add Instagram account.");
      }
    } catch {
      setStatus("Failed to add Instagram account.");
    } finally {
      setIsSavingNewAccount(false);
    }
  }

  const isConnected = Boolean(connection?.instagramBusinessAccountId?.trim() && connection?.hasAccessToken);

  const displayConnections = connectionsList.length > 0 ? connectionsList : (connection?.username || connection?.instagramBusinessAccountId ? [{
    id: `conn-ig-default`,
    tenantId: "tenant-gigxomi",
    provider: "INSTAGRAM" as const,
    displayName: connection?.username ? `@${connection.username.replace(/^@/, "")}` : connection?.displayName || "Instagram Account",
    accountHandle: connection?.username ? `@${connection.username.replace(/^@/, "")}` : undefined,
    instagramBusinessAccountId: connection?.instagramBusinessAccountId || undefined,
    status: isConnected ? ("ACTIVE" as const) : ("DISCONNECTED" as const),
    isDefault: true,
    createdAt: connection?.updatedAt || new Date().toISOString(),
    updatedAt: connection?.updatedAt || new Date().toISOString(),
  }] : []);

  return (
    <section className="dashboard-shell compact">
      <p className="eyebrow">Instagram Inbox Setup</p>
      <h2 className="section-heading">Connect professional accounts, receive DMs in Chat Inbox, and reply from the existing customer lane.</h2>

      {/* Connected Accounts List */}
      <div className="brief-grid two-up" style={{ marginBottom: "var(--space-4)" }}>
        {displayConnections.map((conn) => {
          const isEditing = editingConnId === conn.id;
          const isPrimary = Boolean(conn.isDefault);

          return (
            <article className="brief-card" key={conn.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span className="meta-pill">{conn.status === "ACTIVE" ? "Connected" : conn.status}</span>
                  {isPrimary ? (
                    <span className="meta-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                      Primary
                    </span>
                  ) : null}
                </div>
                {!isEditing ? (
                  <button
                    className="secondary-button"
                    style={{ fontSize: "12px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    onClick={() => {
                      setEditingConnId(conn.id);
                      setEditingConnName(conn.displayName || "");
                    }}
                    type="button"
                  >
                    <Pencil size={12} />
                    Edit Label
                  </button>
                ) : null}
              </div>

              {isEditing ? (
                <div style={{ display: "grid", gap: "8px", margin: "8px 0" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600" }}>Account Label (in Unified Inbox):</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input
                      type="text"
                      value={editingConnName}
                      onChange={(e) => setEditingConnName(e.target.value)}
                      placeholder="e.g. @gigxomi - Main Brand"
                      style={{
                        flex: 1,
                        minHeight: "34px",
                        padding: "0 8px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-surface)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <button
                      className="freelancer-primary-button"
                      style={{ minHeight: "34px", padding: "0 12px" }}
                      disabled={isSavingConnName || !editingConnName.trim()}
                      onClick={() => handleSaveConnectionLabel(conn.id)}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="secondary-button"
                      style={{ minHeight: "34px", padding: "0 10px" }}
                      onClick={() => setEditingConnId(null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ margin: "6px 0" }}>
                  <strong style={{ fontSize: "16px" }}>{conn.displayName || "Instagram Account"}</strong>
                  <p className="muted-copy" style={{ marginTop: "2px" }}>
                    {conn.accountHandle ? `Handle: ${conn.accountHandle} · ` : ""}
                    {conn.instagramBusinessAccountId ? `IG ID: ${conn.instagramBusinessAccountId} · ` : ""}
                    Meta professional account connected for live DM routing.
                  </p>
                </div>
              )}

              <div className="freelancer-action-grid">
                <a className="secondary-button" href="/api/meta/instagram/oauth/connect">
                  {conn.status === "ACTIVE" ? "Reconnect Instagram" : "Connect Instagram"}
                </a>
                {!isPrimary ? (
                  <button className="secondary-button" onClick={() => handleSetPrimaryDefault(conn.id)} type="button">
                    Set as Primary
                  </button>
                ) : null}
                {displayConnections.length > 1 ? (
                  <button
                    className="secondary-button"
                    style={{ color: "#ef4444" }}
                    onClick={() => handleDisconnectChannelConnection(conn.id)}
                    type="button"
                  >
                    Disconnect
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}

        {/* Add Another Instagram Account Card */}
        <article className="brief-card" style={{ borderStyle: "dashed" }}>
          {!showAddAccountModal ? (
            <div>
              <span className="meta-pill">Multi-Account</span>
              <strong>Connect another Instagram Account</strong>
              <p className="muted-copy">Add a second Instagram professional account to manage in the same unified inbox.</p>
              <div className="freelancer-action-grid" style={{ marginTop: "12px" }}>
                <button
                  className="freelancer-primary-button"
                  onClick={() => setShowAddAccountModal(true)}
                  type="button"
                >
                  <Plus size={14} />
                  Add Instagram Account
                </button>
                <a className="secondary-button" href="/api/meta/instagram/oauth/connect">
                  Connect via Meta OAuth
                </a>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              <span className="meta-pill">Add Account</span>
              <strong>Add New Instagram Account</strong>
              <label className="freelancer-field">
                <span>Account Label (e.g. Main Brand, Marketing Handle)</span>
                <input
                  type="text"
                  value={newAccountLabel}
                  onChange={(e) => setNewAccountLabel(e.target.value)}
                  placeholder="e.g. Agency Main Handle"
                />
              </label>
              <label className="freelancer-field">
                <span>Instagram Username</span>
                <input
                  type="text"
                  value={newAccountHandle}
                  onChange={(e) => setNewAccountHandle(e.target.value)}
                  placeholder="e.g. gigxomi_official"
                />
              </label>
              <label className="freelancer-field">
                <span>Instagram Business Account ID (Optional)</span>
                <input
                  type="text"
                  value={newAccountIgId}
                  onChange={(e) => setNewAccountIgId(e.target.value)}
                  placeholder="e.g. 17841400000000000"
                />
              </label>
              <div className="freelancer-action-grid">
                <button
                  className="freelancer-primary-button"
                  disabled={isSavingNewAccount || (!newAccountLabel.trim() && !newAccountHandle.trim())}
                  onClick={handleCreateChannelConnection}
                  type="button"
                >
                  {isSavingNewAccount ? "Saving..." : "Save & Connect"}
                </button>
                <button className="secondary-button" onClick={() => setShowAddAccountModal(false)} type="button">
                  Cancel
                </button>
                <a className="secondary-button" href="/api/meta/instagram/oauth/connect">
                  Meta OAuth Flow
                </a>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Operational Guide: Instagram Mobile Setting */}
      <article
        className="brief-card"
        style={{
          marginBottom: "var(--space-4)",
          borderColor: "rgba(16, 185, 129, 0.35)",
          background: "rgba(16, 185, 129, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Smartphone size={18} style={{ color: "#10b981" }} />
          <strong style={{ fontSize: "15px" }}>Required Instagram Mobile App Setting</strong>
          <span className="meta-pill" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.3)" }}>
            Important
          </span>
        </div>
        <p className="muted-copy" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
          Meta requires you to allow connected tools inside the Instagram app, otherwise incoming DMs are blocked before reaching webhooks:
        </p>
        <ol style={{ paddingLeft: "20px", margin: "8px 0 10px 0", fontSize: "13px", lineHeight: "1.6", color: "var(--color-text-secondary)" }}>
          <li>Open the <strong>Instagram mobile app</strong> on the phone logged into <strong>@{connection?.username || "gigxomi"}</strong>.</li>
          <li>Go to <strong>Settings and privacy</strong> &gt; <strong>Messages and story replies</strong>.</li>
          <li>Tap <strong>Message controls</strong> &gt; <strong>Connected tools</strong>.</li>
          <li>Toggle <strong>&quot;Allow access to messages&quot;</strong> to <strong>ON</strong>.</li>
        </ol>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>
          Once toggled ON, any DM sent to @{connection?.username || "gigxomi"} instantly appears in your Unified Chat Inbox.
        </p>
      </article>

      {/* Integration details: Webhook & Delivery */}
      <div className="brief-grid two-up">
        <article className="brief-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="meta-pill">Webhook Setup</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="secondary-button"
                style={{ fontSize: "12px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                disabled={isSyncingMessages}
                onClick={handleSyncMessages}
                type="button"
              >
                <RefreshCw size={12} className={isSyncingMessages ? "animate-spin" : ""} />
                {isSyncingMessages ? "Syncing..." : "Sync Messages"}
              </button>
              <button
                className="secondary-button"
                style={{ fontSize: "12px", padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                disabled={isTestingWebhook}
                onClick={testWebhookConnection}
                type="button"
              >
                <RefreshCw size={12} className={isTestingWebhook ? "animate-spin" : ""} />
                {isTestingWebhook ? "Testing..." : "Test Webhook"}
              </button>
            </div>
          </div>
          <strong>Register this callback in Meta</strong>
          <p className="muted-copy">In Meta App Dashboard &gt; Webhooks &gt; Instagram, subscribe to the <code>messages</code> field.</p>
          
          <label className="freelancer-field">
            <span>Callback URL</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <input readOnly value={initialWebhookUrl} style={{ flex: 1 }} />
              <button
                className="secondary-button"
                style={{ padding: "0 8px", minHeight: "36px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onClick={() => copyToClipboard(initialWebhookUrl, "url")}
                type="button"
              >
                {copiedField === "url" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copiedField === "url" ? "Copied" : "Copy"}
              </button>
            </div>
          </label>

          <label className="freelancer-field">
            <span>Verify token</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                defaultValue={connection?.verifyToken ?? ""}
                key={`verify-${connection?.updatedAt ?? ""}`}
                onBlur={(event) => save({ verifyToken: event.target.value }).catch(() => undefined)}
                placeholder="Webhook verify token"
                style={{ flex: 1 }}
              />
              <button
                className="secondary-button"
                style={{ padding: "0 8px", minHeight: "36px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onClick={() => copyToClipboard(connection?.verifyToken ?? "", "token")}
                type="button"
              >
                {copiedField === "token" ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copiedField === "token" ? "Copied" : "Copy"}
              </button>
            </div>
          </label>

          {webhookTestResult ? (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: webhookTestResult.ok ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: webhookTestResult.ok ? "#10b981" : "#ef4444",
                border: `1px solid ${webhookTestResult.ok ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              }}
            >
              {webhookTestResult.ok ? <CheckCircle2 size={14} /> : null}
              <span>{webhookTestResult.message}</span>
            </div>
          ) : null}
        </article>

        <article className="brief-card">
          <span className="meta-pill">Delivery</span>
          <strong>Replies stay in the Unified Chat Inbox</strong>
          <p className="muted-copy">Every Instagram conversation receives its distinct account badge (e.g. <code>Instagram · @{connection?.username || "handle"}</code>) so editors and agents always know which account owns the chat.</p>
          <label className="freelancer-field">
            <span>Graph API version</span>
            <input defaultValue={connection?.graphApiVersion ?? "v25.0"} key={`version-${connection?.updatedAt ?? ""}`} onBlur={(event) => save({ graphApiVersion: event.target.value }).catch(() => undefined)} placeholder="v25.0" />
          </label>
        </article>

        {canManageToken ? (
          <article className="brief-card">
            <span className="meta-pill">Recovery</span>
            <strong>Manual token fallback</strong>
            <p className="muted-copy">Use this only for a replacement token issued by Meta.</p>
            <label className="freelancer-field">
              <span>Access token {connection?.hasAccessToken ? "(saved)" : ""}</span>
              <textarea defaultValue={connection?.accessToken ?? ""} key={`token-${connection?.updatedAt ?? ""}`} onBlur={(event) => save({ accessToken: event.target.value }).catch(() => undefined)} />
            </label>
          </article>
        ) : null}
      </div>

      {querySuccess && (
        <div
          style={{
            margin: "12px 0",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          <span>Instagram account connected successfully. Webhook and routing are active.</span>
        </div>
      )}

      {queryError && <p className="helper-text" style={{ color: "#ef4444" }}>{queryError}</p>}
      {status && !querySuccess && <p className="helper-text">{status}</p>}

      <div className="freelancer-action-grid">
        <Link className="secondary-button" href="/admin/integrations">Back to integrations</Link>
        <Link className="secondary-button" href="/admin/chat">Open Unified Chat Inbox</Link>
      </div>
      {isSaving ? <p className="helper-text">Saving…</p> : null}
    </section>
  );
}
