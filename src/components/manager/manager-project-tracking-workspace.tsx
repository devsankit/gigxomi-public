"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  FolderKanban,
  Kanban,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  StickyNote,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import type {
  DummyAssignableEditor,
  DummyConversationLane,
  DummyConversationRole,
  DummyConversationSourceChannel,
  DummyConversationView,
  DummyLeadStatus,
  DummyLeadStatusTone,
} from "@/lib/gigxomi/dummy-platform-store";
import {
  broadcastChatWorkspaceSync,
  subscribeToChatWorkspaceSync,
} from "@/components/chat/chat-sync";

import styles from "./manager-project-tracking.module.css";

type ViewMode = "kanban" | "sheet";

export function ManagerProjectTrackingWorkspace() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [conversations, setConversations] = useState<DummyConversationView[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<DummyLeadStatus[]>([]);
  const [assignableEditors, setAssignableEditors] = useState<DummyAssignableEditor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [editorFilter, setEditorFilter] = useState<string>("all");

  // Selected lead for Todoist detail inspector
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [inspectorNotes, setInspectorNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  // Drag & Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Modals
  const [isManageStatusesOpen, setIsManageStatusesOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // New Lead Form State
  const [newLeadCustomerName, setNewLeadCustomerName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadChannel, setNewLeadChannel] = useState<DummyConversationSourceChannel>("whatsapp");
  const [newLeadServiceTitle, setNewLeadServiceTitle] = useState("");
  const [newLeadNotes, setNewLeadNotes] = useState("");
  const [newLeadStatusId, setNewLeadStatusId] = useState("new");
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const response = await fetch("/api/manager/inbox?includeSupportData=1", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load manager inbox");
      }
      const data = await response.json();
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
      if (Array.isArray(data.leadStatuses) && data.leadStatuses.length > 0) {
        setLeadStatuses(data.leadStatuses.slice().sort((a: DummyLeadStatus, b: DummyLeadStatus) => a.order - b.order));
      }
      if (Array.isArray(data.assignableEditors)) {
        setAssignableEditors(data.assignableEditors);
      }
    } catch (error) {
      console.error("Manager project tracking load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();

    // Subscribe to cross-tab/workspace chat sync
    const unsubscribe = subscribeToChatWorkspaceSync((payload) => {
      if (
        payload.reason === "lead-status" ||
        payload.reason === "assignment" ||
        payload.reason === "message" ||
        payload.reason === "refresh"
      ) {
        void loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  // Selected Active Lead
  const selectedLead = useMemo(() => {
    return conversations.find((c) => c.id === selectedLeadId) ?? null;
  }, [conversations, selectedLeadId]);

  // Sync notes to inspector whenever selected lead changes
  useEffect(() => {
    if (selectedLead) {
      setInspectorNotes(selectedLead.internalNotes || "");
      setNotesSaveSuccess(false);
    }
  }, [selectedLeadId, selectedLead]);

  // Filtered Leads
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      if (channelFilter !== "all" && conv.sourceChannel !== channelFilter) {
        return false;
      }
      if (editorFilter === "assigned" && !conv.assignedFreelancerId) {
        return false;
      }
      if (editorFilter === "unassigned" && conv.assignedFreelancerId) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesClient = conv.customerDisplayName.toLowerCase().includes(query);
        const matchesService = conv.serviceTitle.toLowerCase().includes(query);
        const matchesEditor = (conv.assignedFreelancerName || "").toLowerCase().includes(query);
        const matchesNotes = (conv.internalNotes || "").toLowerCase().includes(query);
        if (!matchesClient && !matchesService && !matchesEditor && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [conversations, channelFilter, editorFilter, searchQuery]);

  // Leads Grouped by Status
  const leadsByStatus = useMemo(() => {
    const map = new Map<string, DummyConversationView[]>();
    for (const status of leadStatuses) {
      map.set(status.id, []);
    }
    for (const conv of filteredConversations) {
      const statusId = conv.leadStatusId || "new";
      if (!map.has(statusId)) {
        map.set(statusId, []);
      }
      map.get(statusId)!.push(conv);
    }
    return map;
  }, [filteredConversations, leadStatuses]);

  // Update Lead Status Handler
  const handleUpdateStatus = async (conversationId: string, nextStatusId: string) => {
    // Optimistic local update
    const targetStatus = leadStatuses.find((s) => s.id === nextStatusId);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              leadStatusId: nextStatusId,
              leadStatusLabel: targetStatus?.label ?? c.leadStatusLabel,
              leadStatusTone: targetStatus?.tone ?? c.leadStatusTone,
            }
          : c,
      ),
    );

    try {
      const response = await fetch(`/api/conversations/${conversationId}/lead-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatusId: nextStatusId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      broadcastChatWorkspaceSync({
        reason: "lead-status",
        conversationId,
      });
    } catch (err) {
      console.error("Status update error:", err);
      void loadData(); // Revert on error
    }
  };

  // Move Lead to Next Stage in Kanban progression
  const handleAdvanceStage = (conversation: DummyConversationView) => {
    const currentIndex = leadStatuses.findIndex((s) => s.id === conversation.leadStatusId);
    if (currentIndex >= 0 && currentIndex < leadStatuses.length - 1) {
      const nextStatus = leadStatuses[currentIndex + 1];
      void handleUpdateStatus(conversation.id, nextStatus.id);
    }
  };

  // Save Notes Handler
  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setIsSavingNotes(true);
    setNotesSaveSuccess(false);

    try {
      const response = await fetch(`/api/conversations/${selectedLead.id}/lead-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: inspectorNotes }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === selectedLead.id ? { ...c, internalNotes: inspectorNotes } : c)),
      );
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 3000);

      broadcastChatWorkspaceSync({
        reason: "message",
        conversationId: selectedLead.id,
      });
    } catch (err) {
      console.error("Save notes error:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Assign Editor Handler
  const handleAssignEditor = async (conversationId: string, editorId: string) => {
    const editor = assignableEditors.find((e) => e.editorId === editorId);
    if (!editor) return;

    // Optimistically update
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              assignedFreelancerId: editor.editorId,
              assignedFreelancerName: editor.displayName,
              leadStatusId: c.leadStatusId === "new" ? "assigned" : c.leadStatusId,
              leadStatusLabel: c.leadStatusId === "new" ? "Editor Assigned" : c.leadStatusLabel,
            }
          : c,
      ),
    );

    try {
      const response = await fetch(`/api/conversations/${conversationId}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentMode: "direct",
          freelancerId: editor.editorId,
        }),
      });

      if (!response.ok) {
        throw new Error("Assignment failed");
      }

      broadcastChatWorkspaceSync({
        reason: "assignment",
        conversationId,
      });
      void loadData();
    } catch (err) {
      console.error("Assignment error:", err);
      void loadData();
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, colStatusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColId !== colStatusId) {
      setDragOverColId(colStatusId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, colStatusId: string) => {
    if (dragOverColId === colStatusId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colStatusId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    setDraggedLeadId(null);
    setDragOverColId(null);

    if (leadId) {
      void handleUpdateStatus(leadId, colStatusId);
    }
  };

  // Status Management API calls
  const handleStatusReorder = async (statusId: string, direction: "up" | "down") => {
    const currentIndex = leadStatuses.findIndex((s) => s.id === statusId);
    if (currentIndex === -1) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= leadStatuses.length) return;

    const reordered = [...leadStatuses];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    const updatedWithOrder = reordered.map((s, idx) => ({ ...s, order: idx + 1 }));
    setLeadStatuses(updatedWithOrder);

    try {
      await fetch("/api/manager/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          orderedIds: updatedWithOrder.map((s) => s.id),
        }),
      });
      broadcastChatWorkspaceSync({ reason: "lead-status" });
    } catch (err) {
      console.error("Reorder status error:", err);
      void loadData();
    }
  };

  const handleAddCustomStatus = async (label: string, tone: DummyLeadStatusTone) => {
    if (!label.trim()) return;
    try {
      const response = await fetch("/api/manager/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          label: label.trim(),
          tone,
        }),
      });
      const data = await response.json();
      if (Array.isArray(data.statuses)) {
        setLeadStatuses(data.statuses);
      }
      broadcastChatWorkspaceSync({ reason: "lead-status" });
    } catch (err) {
      console.error("Add status error:", err);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    try {
      const response = await fetch("/api/manager/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          statusId,
        }),
      });
      const data = await response.json();
      if (Array.isArray(data.statuses)) {
        setLeadStatuses(data.statuses);
      }
      broadcastChatWorkspaceSync({ reason: "lead-status" });
    } catch (err) {
      console.error("Delete status error:", err);
    }
  };

  // Create New Lead Handler
  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadCustomerName.trim() || !newLeadPhone.trim()) return;
    setIsCreatingLead(true);

    try {
      const response = await fetch("/api/conversations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "manager",
          customerName: newLeadCustomerName.trim(),
          customerPhone: newLeadPhone.trim(),
          serviceTitle: newLeadServiceTitle.trim() || "Video Editing Project",
          channel: newLeadChannel,
          initialNotes: newLeadNotes.trim(),
          leadStatusId: newLeadStatusId,
        }),
      });

      if (!response.ok) {
        // Fallback to inbox reload if manual endpoint returns non-200
        console.warn("Manual endpoint response not ok, checking store");
      }

      setIsNewLeadOpen(false);
      setNewLeadCustomerName("");
      setNewLeadPhone("");
      setNewLeadServiceTitle("");
      setNewLeadNotes("");
      void loadData();
      broadcastChatWorkspaceSync({ reason: "new-chat" });
    } catch (err) {
      console.error("Create lead error:", err);
    } finally {
      setIsCreatingLead(false);
    }
  };

  // Quick Stats Metrics
  const stats = useMemo(() => {
    const total = conversations.length;
    const newLeads = conversations.filter((c) => (c.leadStatusId || "new") === "new").length;
    const assigned = conversations.filter((c) => Boolean(c.assignedFreelancerId)).length;
    const forReview = conversations.filter((c) => c.leadStatusId === "for-review" || c.leadStatusId === "work-done").length;
    const delivered = conversations.filter((c) => c.leadStatusId === "delivered").length;
    return { total, newLeads, assigned, forReview, delivered };
  }, [conversations]);

  return (
    <div className={styles.workspace}>
      {/* ---------------- Top Telemetry & Header ---------------- */}
      <div className={styles.headerWrap}>
        <div className={styles.titleRow}>
          <div className={styles.titleLockup}>
            <h1 className={styles.heading}>
              <FolderKanban size={22} color="#6366f1" />
              <span>Project Tracking & Lead Pipeline</span>
              <span className={styles.headingBadge}>Ops Engine</span>
            </h1>
            <p className={styles.subheading}>
              Track creator leads from incoming WhatsApp & Instagram DMs, assign vetted editors, review video cuts, and manage stages.
            </p>
          </div>

          <div className={styles.topStats}>
            <div className={styles.statPill}>
              <span className={styles.syncDot} />
              <span>Live Synced</span>
            </div>
            <div className={styles.statPill}>
              <span>Total:</span>
              <strong>{stats.total}</strong>
            </div>
            <div className={styles.statPill}>
              <span style={{ color: "#38bdf8" }}>● New Leads:</span>
              <strong>{stats.newLeads}</strong>
            </div>
            <div className={styles.statPill}>
              <span style={{ color: "#f59e0b" }}>● Assigned:</span>
              <strong>{stats.assigned}</strong>
            </div>
            <div className={styles.statPill}>
              <span style={{ color: "#a855f7" }}>● Review Queue:</span>
              <strong>{stats.forReview}</strong>
            </div>
            <div className={styles.statPill}>
              <span style={{ color: "#10b981" }}>● Delivered:</span>
              <strong>{stats.delivered}</strong>
            </div>
          </div>
        </div>

        {/* ---------------- Action Toolbar ---------------- */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {/* View Switcher Toggle */}
            <div className={styles.viewSwitcher} role="group" aria-label="View format">
              <button
                className={`${styles.viewBtn} ${viewMode === "kanban" ? styles.viewBtnActive : ""}`}
                onClick={() => setViewMode("kanban")}
                type="button"
              >
                <Kanban size={14} />
                <span>Kanban Board</span>
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === "sheet" ? styles.viewBtnActive : ""}`}
                onClick={() => setViewMode("sheet")}
                type="button"
              >
                <FileSpreadsheet size={14} />
                <span>Google Sheet View</span>
              </button>
            </div>

            {/* Search Input */}
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} size={14} />
              <input
                className={styles.searchInput}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, project, editor, notes..."
                type="text"
                value={searchQuery}
              />
            </div>

            {/* Channel Filter */}
            <select
              aria-label="Filter by channel"
              className={styles.filterSelect}
              onChange={(e) => setChannelFilter(e.target.value)}
              value={channelFilter}
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp Direct</option>
              <option value="instagram">Instagram DM</option>
            </select>

            {/* Editor Filter */}
            <select
              aria-label="Filter by editor status"
              className={styles.filterSelect}
              onChange={(e) => setEditorFilter(e.target.value)}
              value={editorFilter}
            >
              <option value="all">All Assignments</option>
              <option value="assigned">Editor Assigned</option>
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>

          <div className={styles.toolbarRight}>
            <button
              className={styles.btnSecondary}
              onClick={() => setIsManageStatusesOpen(true)}
              type="button"
            >
              <Settings2 size={14} />
              <span>Manage Statuses</span>
            </button>
            <button
              className={styles.btnPrimary}
              onClick={() => setIsNewLeadOpen(true)}
              type="button"
            >
              <Plus size={15} />
              <span>+ New Lead</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Kanban Board View ---------------- */}
      {viewMode === "kanban" ? (
        <div className={styles.kanbanFrame}>
          {leadStatuses.map((column) => {
            const columnLeads = leadsByStatus.get(column.id) ?? [];
            const isDragOver = dragOverColId === column.id;

            return (
              <div
                className={`${styles.kanbanColumn} ${isDragOver ? styles.kanbanColumnDragOver : ""}`}
                key={column.id}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={styles.columnHeader}>
                  <div className={styles.colHeaderLeft}>
                    <span className={`${styles.colToneDot} ${styles[`tone_${column.tone}`] || styles.tone_neutral}`} />
                    <span className={styles.colTitle}>{column.label}</span>
                    <span className={styles.colCount}>{columnLeads.length}</span>
                  </div>
                  <button
                    aria-label={`Add lead to ${column.label}`}
                    className={styles.colAddBtn}
                    onClick={() => {
                      setNewLeadStatusId(column.id);
                      setIsNewLeadOpen(true);
                    }}
                    title={`Add new lead to ${column.label}`}
                    type="button"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Column Body / Draggable Cards */}
                <div className={styles.columnBody}>
                  {columnLeads.map((lead) => {
                    const isSelected = selectedLeadId === lead.id;
                    const isDragging = draggedLeadId === lead.id;

                    return (
                      <div
                        className={`${styles.card} ${isDragging ? styles.cardDragging : ""}`}
                        draggable
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        style={isSelected ? { borderColor: "#6366f1", background: "rgba(99, 102, 241, 0.12)" } : undefined}
                      >
                        {/* Card Top: Checkbox & Title */}
                        <div className={styles.cardTop}>
                          <button
                            aria-label={`Advance ${lead.serviceTitle} to next stage`}
                            className={`${styles.checkCircle} ${column.id === "delivered" ? styles.checkCircleDone : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdvanceStage(lead);
                            }}
                            title="Click to advance stage"
                            type="button"
                          >
                            {column.id === "delivered" ? <Check size={11} strokeWidth={3} /> : null}
                          </button>
                          <div className={styles.cardTitle}>{lead.serviceTitle || "Video Project"}</div>
                        </div>

                        {/* Client Row & Channel Badge */}
                        <div className={styles.cardClientRow}>
                          <div className={styles.clientMeta}>
                            <span className={styles.clientAvatar}>
                              {lead.customerDisplayName.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{lead.customerDisplayName}</span>
                          </div>
                          <span
                            className={`${styles.channelBadge} ${
                              lead.sourceChannel === "instagram" ? styles.channelInstagram : styles.channelWhatsApp
                            }`}
                          >
                            {lead.sourceChannel === "instagram" ? "IG DM" : "WhatsApp"}
                          </span>
                        </div>

                        {/* Notes Excerpt (if present) */}
                        {lead.internalNotes ? (
                          <div className={styles.notesExcerpt} title={lead.internalNotes}>
                            <StickyNote size={11} style={{ display: "inline-block", marginRight: 4 }} />
                            {lead.internalNotes}
                          </div>
                        ) : null}

                        {/* Card Bottom: Assigned Editor & Quick Chat */}
                        <div className={styles.cardBottom}>
                          <div className={styles.editorChip}>
                            {lead.assignedFreelancerName ? (
                              <>
                                <span className={styles.editorAvatarMini}>
                                  {lead.assignedFreelancerName.slice(0, 2).toUpperCase()}
                                </span>
                                <span>{lead.assignedFreelancerName}</span>
                              </>
                            ) : (
                              <span className={styles.editorUnassigned}>No editor</span>
                            )}
                          </div>

                          <div className={styles.cardMetaRight}>
                            <Link
                              className={styles.chatQuickBtn}
                              href={`/manager/chat?conversationId=${encodeURIComponent(lead.id)}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Open live chat with client"
                            >
                              <MessageSquare size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnLeads.length === 0 ? (
                    <div className={styles.columnEmpty}>
                      <span>No leads in this stage</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ---------------- Google Sheet View ---------------- */
        <div className={styles.sheetContainer}>
          <table className={styles.sheetTable}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ minWidth: 170 }}>Client / Lead</th>
                <th style={{ minWidth: 200 }}>Project / Service Scope</th>
                <th style={{ minWidth: 150 }}>Lead Status</th>
                <th style={{ minWidth: 170 }}>Assigned Editor</th>
                <th style={{ minWidth: 220 }}>Internal Notes</th>
                <th style={{ minWidth: 110 }}>Channel</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConversations.map((lead, index) => (
                <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} style={{ cursor: "pointer" }}>
                  <td style={{ color: "#64748b", fontWeight: 600 }}>{index + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={styles.clientAvatar}>{lead.customerDisplayName.slice(0, 2).toUpperCase()}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{lead.customerDisplayName}</div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{lead.customerPhoneDisplay}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{lead.serviceTitle || "Video Editing Work"}</div>
                    {lead.summary ? (
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}>
                        {lead.summary}
                      </div>
                    ) : null}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      aria-label="Change lead status"
                      className={styles.sheetSelect}
                      onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                      value={lead.leadStatusId || "new"}
                    >
                      {leadStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      aria-label="Assign editor"
                      className={styles.sheetSelect}
                      onChange={(e) => handleAssignEditor(lead.id, e.target.value)}
                      value={lead.assignedFreelancerId || ""}
                    >
                      <option value="">Unassigned</option>
                      {assignableEditors.map((editor) => (
                        <option key={editor.editorId} value={editor.editorId}>
                          {editor.displayName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className={styles.sheetNotesCell} title={lead.internalNotes || "Click to add notes"}>
                      {lead.internalNotes ? (
                        <span>{lead.internalNotes}</span>
                      ) : (
                        <span style={{ fontStyle: "italic", color: "#64748b" }}>+ Add notes</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.channelBadge} ${
                        lead.sourceChannel === "instagram" ? styles.channelInstagram : styles.channelWhatsApp
                      }`}
                    >
                      {lead.sourceChannel === "instagram" ? "Instagram" : "WhatsApp"}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Link
                      className={styles.sheetActionBtn}
                      href={`/manager/chat?conversationId=${encodeURIComponent(lead.id)}`}
                      title="Open chat"
                    >
                      <MessageSquare size={13} />
                      <span>Chat</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- Todoist-Style Detail Inspector (Slide-over Drawer) ---------------- */}
      {selectedLead ? (
        <div className={styles.drawerBackdrop} onClick={() => setSelectedLeadId(null)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderActions}>
                <select
                  aria-label="Change project status"
                  className={styles.sheetSelect}
                  onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                  style={{ fontWeight: 700, padding: "6px 12px" }}
                  value={selectedLead.leadStatusId || "new"}
                >
                  {leadStatuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <button
                  className={styles.btnSecondary}
                  onClick={() => handleAdvanceStage(selectedLead)}
                  title="Move to next stage in workflow"
                  type="button"
                >
                  <span>Next Stage</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <button
                aria-label="Close inspector"
                className={styles.closeBtn}
                onClick={() => setSelectedLeadId(null)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className={styles.drawerBody}>
              {/* Title Section */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionLabel}>Project / Scope</span>
                <h2 className={styles.drawerTitleInput}>{selectedLead.serviceTitle || "Video Editing Retainer"}</h2>
                {selectedLead.summary ? (
                  <p style={{ fontSize: "0.84rem", color: "#94a3b8", margin: "2px 0 0" }}>{selectedLead.summary}</p>
                ) : null}
              </div>

              {/* Direct Chat CTA Banner */}
              <div className={styles.chatCtaBanner}>
                <div className={styles.chatCtaText}>
                  <div className={styles.chatCtaTitle}>Direct Client Communication Relay</div>
                  <div className={styles.chatCtaSub}>
                    Client is chatting on {selectedLead.sourceChannel === "instagram" ? "Instagram DM" : "WhatsApp"}. Phone number is masked for freelance editors.
                  </div>
                </div>
                <Link
                  className={styles.chatCtaBtn}
                  href={`/manager/chat?conversationId=${encodeURIComponent(selectedLead.id)}`}
                >
                  <MessageSquare size={14} />
                  <span>Open Live Chat</span>
                </Link>
              </div>

              {/* Client Info Grid */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionLabel}>Client Details</span>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Client Name</span>
                    <span className={styles.infoCardVal}>{selectedLead.customerDisplayName}</span>
                  </div>
                  <div className={styles.infoCard}>
                    <span className={styles.infoCardLabel}>Channel & Phone</span>
                    <span className={styles.infoCardVal}>
                      {selectedLead.sourceChannel === "instagram" ? "Instagram Direct" : selectedLead.customerPhoneDisplay}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editor Assignment */}
              <div className={styles.drawerSection}>
                <span className={styles.sectionLabel}>Assigned Editor</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <select
                    aria-label="Assign editor to lead"
                    className={styles.sheetSelect}
                    onChange={(e) => handleAssignEditor(selectedLead.id, e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
                    value={selectedLead.assignedFreelancerId || ""}
                  >
                    <option value="">No editor assigned (Unassigned)</option>
                    {assignableEditors.map((editor) => (
                      <option key={editor.editorId} value={editor.editorId}>
                        {editor.displayName} ({editor.specialty || "Video Editor"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Todoist-Style Notes Section */}
              <div className={styles.drawerSection}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={styles.sectionLabel}>
                    <StickyNote size={13} />
                    <span>Project & Lead Notes</span>
                  </span>
                  {notesSaveSuccess ? (
                    <span className={styles.notesSavedFeedback}>
                      <Check size={12} strokeWidth={3} />
                      <span>Saved!</span>
                    </span>
                  ) : null}
                </div>

                <textarea
                  className={styles.notesArea}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      void handleSaveNotes();
                    }
                  }}
                  placeholder="Put internal project notes, revision requirements, pacing references, google drive links, or client preferences here... (Ctrl+Enter to save)"
                  value={inspectorNotes}
                />

                <div className={styles.notesActionBar}>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Tip: Press Ctrl+Enter to save notes</span>
                  <button
                    className={styles.btnPrimary}
                    disabled={isSavingNotes}
                    onClick={handleSaveNotes}
                    type="button"
                  >
                    {isSavingNotes ? <RefreshCw className={styles.syncDot} size={13} /> : <Check size={13} />}
                    <span>{isSavingNotes ? "Saving..." : "Save Notes"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- Manage Lead Statuses Modal ---------------- */}
      {isManageStatusesOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setIsManageStatusesOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Manage Lead Statuses & Kanban Columns</h3>
              <button
                aria-label="Close status manager"
                className={styles.closeBtn}
                onClick={() => setIsManageStatusesOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ fontSize: "0.82rem", color: "#94a3b8", margin: 0 }}>
                Customize the lead stages for your agency. These stages appear as Kanban columns, Google Sheet status dropdowns, and in the Chat section lead status manager.
              </p>

              <div className={styles.statusAdminList}>
                {leadStatuses.map((status, idx) => (
                  <div className={styles.statusAdminRow} key={status.id}>
                    <div className={styles.statusRowInfo}>
                      <span className={`${styles.colToneDot} ${styles[`tone_${status.tone}`] || styles.tone_neutral}`} />
                      <span style={{ fontWeight: 600, fontSize: "0.84rem" }}>{status.label}</span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>({status.id})</span>
                    </div>

                    <div className={styles.statusRowActions}>
                      <button
                        aria-label="Move stage up"
                        className={styles.iconBtn}
                        disabled={idx === 0}
                        onClick={() => handleStatusReorder(status.id, "up")}
                        title="Move column left"
                        type="button"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        aria-label="Move stage down"
                        className={styles.iconBtn}
                        disabled={idx === leadStatuses.length - 1}
                        onClick={() => handleStatusReorder(status.id, "down")}
                        title="Move column right"
                        type="button"
                      >
                        <ArrowDown size={13} />
                      </button>
                      {status.id.startsWith("custom-") ? (
                        <button
                          aria-label="Delete stage"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => handleDeleteStatus(status.id)}
                          title="Delete custom stage"
                          type="button"
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Stage Form */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                <span className={styles.sectionLabel} style={{ marginBottom: 10 }}>Add New Custom Stage</span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem("stageLabel") as HTMLInputElement;
                    const toneSelect = form.elements.namedItem("stageTone") as HTMLSelectElement;
                    if (input?.value.trim()) {
                      void handleAddCustomStatus(input.value.trim(), toneSelect?.value as DummyLeadStatusTone);
                      input.value = "";
                    }
                  }}
                  style={{ display: "flex", gap: 10 }}
                >
                  <input
                    className={styles.formInput}
                    name="stageLabel"
                    placeholder="e.g. Rough Cut Rendered, Client Call Scheduled..."
                    required
                    style={{ flex: 1 }}
                    type="text"
                  />
                  <select className={styles.filterSelect} name="stageTone">
                    <option value="accent">Blue Accent</option>
                    <option value="warning">Orange Warning</option>
                    <option value="success">Green Success</option>
                    <option value="neutral">Purple Neutral</option>
                  </select>
                  <button className={styles.btnPrimary} type="submit">
                    + Add Stage
                  </button>
                </form>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.btnPrimary}
                onClick={() => setIsManageStatusesOpen(false)}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- Create New Lead Modal ---------------- */}
      {isNewLeadOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setIsNewLeadOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>+ Intake New Lead / Project</h3>
              <button
                aria-label="Close new lead form"
                className={styles.closeBtn}
                onClick={() => setIsNewLeadOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateNewLead}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Client / Creator Name</label>
                    <input
                      className={styles.formInput}
                      onChange={(e) => setNewLeadCustomerName(e.target.value)}
                      placeholder="e.g. Neil Fitness, Alex Media"
                      required
                      type="text"
                      value={newLeadCustomerName}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>WhatsApp / Instagram Handle</label>
                    <input
                      className={styles.formInput}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                      placeholder="+91 99818 07309 or @username"
                      required
                      type="text"
                      value={newLeadPhone}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Inbound Channel</label>
                    <select
                      className={styles.filterSelect}
                      onChange={(e) => setNewLeadChannel(e.target.value as DummyConversationSourceChannel)}
                      value={newLeadChannel}
                    >
                      <option value="whatsapp">WhatsApp Business API</option>
                      <option value="instagram">Instagram Direct DM</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Initial Pipeline Stage</label>
                    <select
                      className={styles.filterSelect}
                      onChange={(e) => setNewLeadStatusId(e.target.value)}
                      value={newLeadStatusId}
                    >
                      {leadStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Project Scope / Service</label>
                  <input
                    className={styles.formInput}
                    onChange={(e) => setNewLeadServiceTitle(e.target.value)}
                    placeholder="e.g. 8x High-Retention Reels + 2 Podcast Episodes"
                    type="text"
                    value={newLeadServiceTitle}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Internal Notes / Requirements</label>
                  <textarea
                    className={styles.notesArea}
                    onChange={(e) => setNewLeadNotes(e.target.value)}
                    placeholder="Client's target style, pacing references, turnaround urgency, budget..."
                    style={{ minHeight: 80 }}
                    value={newLeadNotes}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.btnSecondary}
                  onClick={() => setIsNewLeadOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={styles.btnPrimary}
                  disabled={isCreatingLead}
                  type="submit"
                >
                  {isCreatingLead ? "Creating..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
