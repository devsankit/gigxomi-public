"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Edit3,
  ExternalLink,
  Filter,
  FolderKanban,
  Kanban,
  Layers,
  Loader2,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  StickyNote,
  Table2,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

import { crmStatuses, type AssignableUser, type StatusConfig } from "@/lib/gigxomi/crm-data";
import type { DummyConversationView, DummyLeadStatus, DummyLeadStatusTone } from "@/lib/gigxomi/dummy-platform-store";

function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return "Recently";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function ManagerProjectTrackingKanban() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"kanban" | "sheet">("kanban");
  const [conversations, setConversations] = useState<DummyConversationView[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<DummyLeadStatus[]>([]);
  const [assignableEditors, setAssignableEditors] = useState<AssignableUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<"all" | "whatsapp" | "instagram">("all");
  const [editorFilter, setEditorFilter] = useState<string>("all");

  // Drag-and-drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Detail Drawer state
  const [selectedLead, setSelectedLead] = useState<DummyConversationView | null>(null);
  const [drawerNotes, setDrawerNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [noteSavedMessage, setNoteSavedMessage] = useState<string>("");
  const [isAssigningEditor, setIsAssigningEditor] = useState<boolean>(false);

  // New Section / Stage creation state (Todoist + Add section)
  const [isAddingSection, setIsAddingSection] = useState<boolean>(false);
  const [newSectionLabel, setNewSectionLabel] = useState<string>("");
  const [newSectionTone, setNewSectionTone] = useState<DummyLeadStatusTone>("accent");
  const [isCreatingSection, setIsCreatingSection] = useState<boolean>(false);

  // Load conversations & support data
  async function loadData(silent = false) {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch("/api/conversations?audience=manager&includeSupportData=1", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok || data.conversations) {
        const convs = (data.conversations ?? []) as DummyConversationView[];
        setConversations(convs);
        if (Array.isArray(data.leadStatuses) && data.leadStatuses.length > 0) {
          setLeadStatuses(data.leadStatuses);
        }
        if (data.assignableEditors) setAssignableEditors(data.assignableEditors);

        if (selectedLead) {
          const updated = convs.find((c) => c.id === selectedLead.id);
          if (updated) setSelectedLead(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load project tracking data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute active dynamic columns from agency's actual lead statuses
  const activeColumns = useMemo(() => {
    const list = leadStatuses.length > 0
      ? leadStatuses.filter((s) => s.active)
      : crmStatuses.map((s) => ({
          id: s.id,
          label: s.label,
          tone: s.tone as DummyLeadStatusTone,
          order: s.order,
          active: s.active,
        }));
    return list.slice().sort((a, b) => a.order - b.order);
  }, [leadStatuses]);

  // Sync drawer notes when lead changes
  useEffect(() => {
    if (selectedLead) {
      setDrawerNotes(selectedLead.internalNotes || "");
      setNoteSavedMessage("");
    }
  }, [selectedLead?.id]);

  // Get matching column ID for a conversation
  function getLeadColumnId(conversation: DummyConversationView): string {
    const rawId = String(conversation.leadStatusId || "").trim().toLowerCase();
    // 1. Direct match with an active column id
    const exact = activeColumns.find((col) => col.id.toLowerCase() === rawId);
    if (exact) return exact.id;

    // 2. Normalized match (e.g. "workdone" vs "work-done")
    const normalized = rawId.replace(/[^a-z0-9]/g, "");
    const matched = activeColumns.find(
      (col) =>
        col.id.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized ||
        col.label.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized,
    );
    if (matched) return matched.id;

    // 3. Fallback: first column (usually "new" / "New Leads")
    return activeColumns[0]?.id || "new";
  }

  // Update lead status (calls API and syncs 1:1 with chat!)
  async function updateLeadStage(conversationId: string, nextStatusId: string) {
    // Optimistic UI update
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, leadStatusId: nextStatusId } : c)),
    );

    if (selectedLead && selectedLead.id === conversationId) {
      setSelectedLead((prev) => (prev ? { ...prev, leadStatusId: nextStatusId } : null));
    }

    try {
      const res = await fetch(`/api/conversations/${conversationId}/lead-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatusId: nextStatusId }),
      });
      if (!res.ok) {
        await loadData(true);
      }
    } catch (err) {
      console.error("Failed to update lead status:", err);
      await loadData(true);
    }
  }

  // Save persistent internal notes
  async function saveNotes(conversationId: string, notesToSave: string) {
    setIsSavingNotes(true);
    setNoteSavedMessage("");

    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, internalNotes: notesToSave } : c)),
    );
    if (selectedLead && selectedLead.id === conversationId) {
      setSelectedLead((prev) => (prev ? { ...prev, internalNotes: notesToSave } : null));
    }

    try {
      const res = await fetch(`/api/conversations/${conversationId}/lead-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesToSave }),
      });
      if (res.ok) {
        setNoteSavedMessage("Note saved & synced to chat!");
        setTimeout(() => setNoteSavedMessage(""), 3500);
      } else {
        setNoteSavedMessage("Failed to save note.");
      }
    } catch (err) {
      console.error("Failed to save note:", err);
      setNoteSavedMessage("Error saving note.");
    } finally {
      setIsSavingNotes(false);
    }
  }

  // Assign or unassign editor
  async function handleAssignEditor(conversationId: string, freelancerId: string) {
    setIsAssigningEditor(true);
    try {
      if (!freelancerId) {
        const res = await fetch(`/api/conversations/${conversationId}/assignment`, {
          method: "DELETE",
        });
        if (res.ok) await loadData(true);
      } else {
        const res = await fetch(`/api/conversations/${conversationId}/assignment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freelancerId,
            assignmentMode: "replace",
          }),
        });
        if (res.ok) {
          // If in "new", auto-advance to "assigned" if assigned column exists
          const current = conversations.find((c) => c.id === conversationId);
          if (current && getLeadColumnId(current) === activeColumns[0]?.id && activeColumns[1]) {
            await updateLeadStage(conversationId, activeColumns[1].id);
          }
          await loadData(true);
        }
      }
    } catch (err) {
      console.error("Assignment failed:", err);
    } finally {
      setIsAssigningEditor(false);
    }
  }

  // Create new section/stage (Todoist style)
  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    const label = newSectionLabel.trim();
    if (!label) return;

    setIsCreatingSection(true);
    try {
      const res = await fetch("/api/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          label,
          tone: newSectionTone,
        }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.statuses)) {
        setLeadStatuses(data.statuses);
        setNewSectionLabel("");
        setIsAddingSection(false);
      }
    } catch (err) {
      console.error("Failed to create new stage:", err);
    } finally {
      setIsCreatingSection(false);
    }
  }

  // Advance stage sequentially
  function advanceStage(e: React.MouseEvent, conversation: DummyConversationView) {
    e.stopPropagation();
    const currentId = getLeadColumnId(conversation);
    const idx = activeColumns.findIndex((col) => col.id === currentId);
    if (idx !== -1 && idx < activeColumns.length - 1) {
      updateLeadStage(conversation.id, activeColumns[idx + 1].id);
    }
  }

  // HTML5 Drag and Drop handlers
  function handleDragStart(e: DragEvent<HTMLDivElement>, conversationId: string) {
    setDraggedLeadId(conversationId);
    e.dataTransfer.setData("text/plain", conversationId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, columnId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>, columnId: string) {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, columnId: string) {
    e.preventDefault();
    setDragOverColumnId(null);
    const conversationId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    if (conversationId) {
      updateLeadStage(conversationId, columnId);
    }
    setDraggedLeadId(null);
  }

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      // Channel
      if (channelFilter !== "all") {
        const chan = item.sourceChannel ?? (item.isInAppCustomerThread ? "in-app" : "whatsapp");
        if (chan !== channelFilter) return false;
      }

      // Editor
      if (editorFilter === "unassigned") {
        if (item.assignedFreelancerId) return false;
      } else if (editorFilter !== "all") {
        if (item.assignedFreelancerId !== editorFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.customerDisplayName?.toLowerCase().includes(q);
        const matchPhone = item.customerPhoneDisplay?.toLowerCase().includes(q);
        const matchNotes = item.internalNotes?.toLowerCase().includes(q);
        const matchService = item.serviceTitle?.toLowerCase().includes(q);
        const matchEditor = item.assignedFreelancerName?.toLowerCase().includes(q);
        const matchSummary = item.summary?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchNotes && !matchService && !matchEditor && !matchSummary) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, channelFilter, editorFilter, searchQuery]);

  // Grouped by stage for Kanban
  const stageGroups = useMemo(() => {
    const groups: Record<string, DummyConversationView[]> = {};
    for (const col of activeColumns) {
      groups[col.id] = [];
    }
    for (const c of filteredConversations) {
      const colId = getLeadColumnId(c);
      if (!groups[colId]) groups[colId] = [];
      groups[colId].push(c);
    }
    return groups;
  }, [filteredConversations, activeColumns]);

  return (
    <div className="pt-kanban-root">
      {/* Top Header & Workflow Bar */}
      <div className="pt-header-bar">
        <div className="pt-header-titles">
          <div className="pt-title-row">
            <h1 className="pt-main-title">Project Tracking</h1>
            <span className="pt-live-pill">
              <span className="pt-live-dot" /> 1:1 Chat Lead Synced
            </span>
          </div>
          <p className="pt-subtitle">
            Todoist-style Kanban workflow &amp; Google Sheet grid. Every column matches your agency&apos;s live chat statuses and updates dynamically.
          </p>
        </div>

        {/* View Switcher & Action buttons */}
        <div className="pt-header-actions">
          <div className="pt-view-toggle">
            <button
              type="button"
              className={`pt-view-btn ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
            >
              <Kanban size={15} />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              className={`pt-view-btn ${viewMode === "sheet" ? "active" : ""}`}
              onClick={() => setViewMode("sheet")}
            >
              <Table2 size={15} />
              <span>Google Sheet</span>
            </button>
          </div>

          <button
            type="button"
            className="pt-refresh-btn"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Refresh leads from chat engine"
          >
            <RefreshCcw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="pt-toolbar">
        <div className="pt-search-box">
          <Search size={15} className="pt-search-icon" />
          <input
            type="text"
            className="pt-search-input"
            placeholder="Search lead, phone, notes, or editor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="pt-search-clear" onClick={() => setSearchQuery("")}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="pt-filter-group">
          <div className="pt-select-wrapper">
            <span className="pt-filter-label">Channel:</span>
            <select
              className="pt-select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as "all" | "whatsapp" | "instagram")}
            >
              <option value="all">All Channels ({conversations.length})</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          <div className="pt-select-wrapper">
            <span className="pt-filter-label">Editor:</span>
            <select
              className="pt-select"
              value={editorFilter}
              onChange={(e) => setEditorFilter(e.target.value)}
            >
              <option value="all">All Editors</option>
              <option value="unassigned">Unassigned Only</option>
              {assignableEditors.map((ed) => (
                <option key={ed.id} value={ed.id}>
                  {ed.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-stats-summary">
          <span className="pt-stat-item">
            <strong>{filteredConversations.length}</strong> Total Leads
          </span>
          <span className="pt-stat-divider">·</span>
          <span className="pt-stat-item">
            <strong>{activeColumns.length}</strong> Workflow Stages
          </span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="pt-loading-state">
          <Loader2 size={32} className="animate-spin text-lime-400" />
          <p>Loading project tracking boards...</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW (Todoist-Style with Dynamic Columns & Add Section) */
        <div className="pt-kanban-board">
          {activeColumns.map((column, colIdx) => {
            const items = stageGroups[column.id] || [];
            const isDragOver = dragOverColumnId === column.id;
            const isLastStage = colIdx === activeColumns.length - 1;

            return (
              <div
                key={column.id}
                className={`pt-kanban-column ${isDragOver ? "drag-over" : ""}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header matching Todoist screenshot */}
                <div className="pt-col-header">
                  <div className="pt-col-title-wrap">
                    <span className={`pt-col-indicator tone-${column.tone || "accent"}`} />
                    <h3 className="pt-col-title">{column.label}</h3>
                    <span className="pt-col-count">{items.length}</span>
                  </div>
                  <span className="pt-col-dots">•••</span>
                </div>

                {/* Cards Container */}
                <div className="pt-cards-list">
                  {items.length === 0 ? (
                    <div className="pt-empty-column">
                      <p>No leads in {column.label}</p>
                      <span className="pt-empty-hint">Drag leads here</span>
                    </div>
                  ) : (
                    items.map((lead) => {
                      const channel = lead.sourceChannel ?? (lead.isInAppCustomerThread ? "in-app" : "whatsapp");

                      return (
                        <div
                          key={lead.id}
                          className={`pt-todoist-card ${draggedLeadId === lead.id ? "dragging" : ""}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead.id)}
                          onClick={() => setSelectedLead(lead)}
                        >
                          {/* Left Todoist Circle */}
                          <button
                            type="button"
                            className={`pt-circle-btn ${isLastStage ? "checked" : ""}`}
                            onClick={(e) => advanceStage(e, lead)}
                            title={isLastStage ? "Completed stage" : "Advance to next stage"}
                          >
                            {isLastStage ? (
                              <CheckCircle2 size={18} className="pt-check-icon text-emerald-400" />
                            ) : (
                              <Circle size={18} className="pt-ring-icon" />
                            )}
                          </button>

                          {/* Card Content */}
                          <div className="pt-card-main">
                            <div className="pt-card-top-row">
                              <span className="pt-customer-name">{lead.customerDisplayName}</span>
                              <span className={`pt-channel-tag ${channel}`}>
                                {channel === "instagram" ? "IG" : "WA"}
                              </span>
                            </div>

                            {/* Service / Brief title */}
                            {(lead.serviceTitle || lead.summary) && (
                              <p className="pt-card-service-title">
                                {lead.serviceTitle || lead.summary}
                              </p>
                            )}

                            {/* Sticky Note Snippet if internal notes exist */}
                            {lead.internalNotes ? (
                              <div className="pt-note-chip" title={lead.internalNotes}>
                                <StickyNote size={12} className="text-amber-300 shrink-0" />
                                <span className="pt-note-text">{lead.internalNotes}</span>
                              </div>
                            ) : (
                              <div
                                className="pt-add-note-hint"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLead(lead);
                                }}
                              >
                                <Edit3 size={11} />
                                <span>+ Add note</span>
                              </div>
                            )}

                            {/* Bottom Card Meta: Editor + Last Activity */}
                            <div className="pt-card-footer">
                              {lead.assignedFreelancerName ? (
                                <span className="pt-editor-badge" title={`Assigned to ${lead.assignedFreelancerName}`}>
                                  <UserCheck size={12} className="text-cyan-400" />
                                  <span className="truncate">{lead.assignedFreelancerName}</span>
                                </span>
                              ) : (
                                <span className="pt-unassigned-badge">
                                  <UserPlus size={11} />
                                  <span>Unassigned</span>
                                </span>
                              )}

                              <span className="pt-time-ago">
                                <Clock size={11} />
                                {formatRelativeTime(lead.lastCustomerActivityAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Todoist-Style "+ Add task" / Link to Chat */}
                  <button
                    type="button"
                    className="pt-add-task-btn"
                    onClick={() => router.push("/manager/chat")}
                  >
                    <Plus size={15} />
                    <span>Open in Chat Inbox</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Todoist "+ Add section" Button & Form */}
          <div className="pt-add-section-container">
            {isAddingSection ? (
              <form className="pt-add-section-form" onSubmit={handleCreateSection}>
                <h4 className="pt-add-section-title">Add Stage / Section</h4>
                <input
                  type="text"
                  className="pt-add-section-input"
                  placeholder="Stage name (e.g. Work Done)..."
                  value={newSectionLabel}
                  onChange={(e) => setNewSectionLabel(e.target.value)}
                  autoFocus
                />
                <div className="pt-tone-picker">
                  <span className="pt-tone-label">Tone:</span>
                  <div className="pt-tone-options">
                    {(["accent", "warning", "success", "neutral"] as DummyLeadStatusTone[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={`pt-tone-dot tone-${t} ${newSectionTone === t ? "active" : ""}`}
                        onClick={() => setNewSectionTone(t)}
                        title={t}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-add-section-actions">
                  <button
                    type="submit"
                    className="pt-add-section-submit"
                    disabled={isCreatingSection || !newSectionLabel.trim()}
                  >
                    {isCreatingSection ? "Adding..." : "Add Stage"}
                  </button>
                  <button
                    type="button"
                    className="pt-add-section-cancel"
                    onClick={() => {
                      setIsAddingSection(false);
                      setNewSectionLabel("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="pt-add-section-btn"
                onClick={() => setIsAddingSection(true)}
              >
                <Plus size={16} />
                <span>Add section</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* GOOGLE SHEET / TABLE VIEW */
        <div className="pt-sheet-container">
          <div className="pt-sheet-table-wrapper">
            <table className="pt-sheet-table">
              <thead>
                <tr>
                  <th className="pt-th-lead">Lead / Customer</th>
                  <th className="pt-th-channel">Channel</th>
                  <th className="pt-th-stage">Workflow Stage</th>
                  <th className="pt-th-editor">Assigned Editor</th>
                  <th className="pt-th-notes">Manager Notes</th>
                  <th className="pt-th-service">Service / Intake</th>
                  <th className="pt-th-time">Last Activity</th>
                  <th className="pt-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="pt-sheet-empty">
                      No matching leads found.
                    </td>
                  </tr>
                ) : (
                  filteredConversations.map((lead) => {
                    const stageId = getLeadColumnId(lead);
                    const channel = lead.sourceChannel ?? (lead.isInAppCustomerThread ? "in-app" : "whatsapp");
                    const stageCol = activeColumns.find((k) => k.id === stageId);

                    return (
                      <tr key={lead.id} className="pt-sheet-row" onClick={() => setSelectedLead(lead)}>
                        {/* Lead Name & Phone */}
                        <td className="pt-td-lead">
                          <div className="pt-lead-name-box">
                            <span className="pt-sheet-name">{lead.customerDisplayName}</span>
                            <span className="pt-sheet-phone">{(lead.customerPhoneDisplay || "Direct").replaceAll("â€¢", "•")}</span>
                          </div>
                        </td>

                        {/* Channel */}
                        <td className="pt-td-channel">
                          <span className={`pt-channel-tag ${channel}`}>
                            {channel === "instagram" ? "Instagram" : "WhatsApp"}
                          </span>
                        </td>

                        {/* Workflow Stage Dropdown (Inline editable with dynamic statuses!) */}
                        <td className="pt-td-stage" onClick={(e) => e.stopPropagation()}>
                          <select
                            className={`pt-sheet-stage-select tone-${stageCol?.tone || "accent"}`}
                            value={stageId}
                            onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                          >
                            {activeColumns.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Assigned Editor Dropdown (Inline editable!) */}
                        <td className="pt-td-editor" onClick={(e) => e.stopPropagation()}>
                          <select
                            className="pt-sheet-editor-select"
                            value={lead.assignedFreelancerId || ""}
                            onChange={(e) => handleAssignEditor(lead.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {assignableEditors.map((ed) => (
                              <option key={ed.id} value={ed.id}>
                                {ed.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Manager Notes */}
                        <td className="pt-td-notes">
                          {lead.internalNotes ? (
                            <div className="pt-sheet-note-preview" title={lead.internalNotes}>
                              <StickyNote size={13} className="text-amber-400 shrink-0 inline mr-1" />
                              <span>{lead.internalNotes}</span>
                            </div>
                          ) : (
                            <span className="pt-sheet-empty-note">+ Add note</span>
                          )}
                        </td>

                        {/* Service / Summary */}
                        <td className="pt-td-service">
                          <span className="pt-sheet-service-text truncate block max-w-xs">
                            {lead.serviceTitle || lead.summary || "General inquiry"}
                          </span>
                        </td>

                        {/* Last Activity */}
                        <td className="pt-td-time">
                          <span className="pt-sheet-time-text">
                            {formatRelativeTime(lead.lastCustomerActivityAt)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="pt-td-actions" onClick={(e) => e.stopPropagation()}>
                          <div className="pt-sheet-action-btns">
                            <button
                              type="button"
                              className="pt-sheet-chat-btn"
                              onClick={() => router.push(`/manager/chat?id=${lead.id}`)}
                              title="Open in Chat"
                            >
                              <MessageSquare size={13} />
                              <span>Chat</span>
                            </button>
                            <button
                              type="button"
                              className="pt-sheet-detail-btn"
                              onClick={() => setSelectedLead(lead)}
                              title="View & Edit Lead Details"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL SLIDE-OVER DRAWER */}
      {selectedLead && (
        <div className="pt-drawer-backdrop" onClick={() => setSelectedLead(null)}>
          <aside className="pt-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="pt-drawer-header">
              <div className="pt-drawer-header-left">
                <span className="pt-drawer-eyebrow">LEAD DETAILS</span>
                <h2 className="pt-drawer-title">{selectedLead.customerDisplayName}</h2>
                <div className="pt-drawer-badges">
                  <span className={`pt-channel-tag ${selectedLead.sourceChannel ?? "whatsapp"}`}>
                    {selectedLead.sourceChannel === "instagram" ? "Instagram DM" : "WhatsApp Chat"}
                  </span>
                  <span className="pt-drawer-phone">{(selectedLead.customerPhoneDisplay || "Direct Lead").replaceAll("â€¢", "•")}</span>
                </div>
              </div>
              <button
                type="button"
                className="pt-drawer-close"
                onClick={() => setSelectedLead(null)}
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="pt-drawer-body">
              {/* 1. Stage Selector (1:1 with Chat!) */}
              <div className="pt-drawer-section">
                <label className="pt-section-label">Workflow Stage (1:1 with Chat)</label>
                <div className="pt-stage-pills">
                  {activeColumns.map((col) => {
                    const isCurrent = getLeadColumnId(selectedLead) === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        className={`pt-stage-pill ${isCurrent ? `active tone-${col.tone || "accent"}` : ""}`}
                        onClick={() => updateLeadStage(selectedLead.id, col.id)}
                      >
                        {col.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Persistent Manager Notes (Todoist Clickable Note) */}
              <div className="pt-drawer-section">
                <div className="pt-section-header-row">
                  <label className="pt-section-label flex items-center gap-1.5">
                    <StickyNote size={14} className="text-amber-400" />
                    <span>Manager Internal Notes (Synced to Chat)</span>
                  </label>
                  {noteSavedMessage && (
                    <span className="pt-note-saved-badge">{noteSavedMessage}</span>
                  )}
                </div>
                <textarea
                  className="pt-notes-textarea"
                  rows={4}
                  placeholder="Put project brief notes, instructions, client requests, or deadlines here..."
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                />
                <div className="pt-notes-actions">
                  <button
                    type="button"
                    className="pt-save-note-btn"
                    onClick={() => saveNotes(selectedLead.id, drawerNotes)}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? "Saving..." : "Save Note"}
                  </button>
                  <span className="pt-notes-hint">Notes automatically appear in the manager chat sidebar.</span>
                </div>
              </div>

              {/* 3. Editor Assignment */}
              <div className="pt-drawer-section">
                <label className="pt-section-label flex items-center gap-1.5">
                  <UserCheck size={14} className="text-cyan-400" />
                  <span>Assigned Editor</span>
                </label>
                <div className="pt-assignment-box">
                  <select
                    className="pt-drawer-select"
                    value={selectedLead.assignedFreelancerId || ""}
                    onChange={(e) => handleAssignEditor(selectedLead.id, e.target.value)}
                    disabled={isAssigningEditor}
                  >
                    <option value="">No editor assigned (Unassigned)</option>
                    {assignableEditors.map((ed) => (
                      <option key={ed.id} value={ed.id}>
                        {ed.name} ({ed.specialty || ed.role})
                      </option>
                    ))}
                  </select>

                  {selectedLead.assignedFreelancerId && (
                    <button
                      type="button"
                      className="pt-unassign-btn"
                      onClick={() => handleAssignEditor(selectedLead.id, "")}
                      disabled={isAssigningEditor}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="pt-assignment-subtext">
                  Assigning an editor gives them immediate access to workspace task orders and brief history.
                </p>
              </div>

              {/* 4. Project Service & Brief Intake */}
              <div className="pt-drawer-section">
                <label className="pt-section-label">Project Intake &amp; Details</label>
                <div className="pt-intake-card">
                  <div className="pt-intake-field">
                    <span className="pt-intake-key">Service:</span>
                    <span className="pt-intake-val">{selectedLead.serviceTitle || "Custom Editing"}</span>
                  </div>
                  {selectedLead.projectIntake?.expectedDeliveryLabel && (
                    <div className="pt-intake-field">
                      <span className="pt-intake-key">Delivery:</span>
                      <span className="pt-intake-val">{selectedLead.projectIntake.expectedDeliveryLabel}</span>
                    </div>
                  )}
                  {selectedLead.projectIntake?.googleDriveLink && (
                    <div className="pt-intake-field">
                      <span className="pt-intake-key">Drive:</span>
                      <a
                        href={selectedLead.projectIntake.googleDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="pt-intake-val text-cyan-400 underline truncate max-w-xs"
                      >
                        {selectedLead.projectIntake.googleDriveLink}
                      </a>
                    </div>
                  )}
                  {selectedLead.summary && (
                    <div className="pt-intake-field flex-col items-start gap-1">
                      <span className="pt-intake-key">Summary:</span>
                      <p className="pt-intake-body">{selectedLead.summary}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer CTA */}
            <div className="pt-drawer-footer">
              <button
                type="button"
                className="pt-open-chat-cta"
                onClick={() => router.push(`/manager/chat?id=${selectedLead.id}`)}
              >
                <MessageSquare size={16} />
                <span>Open in Manager Chat</span>
                <ExternalLink size={14} className="ml-auto" />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
