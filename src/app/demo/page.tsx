"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Layers3,
  Lock,
  MessageCircle,
  Play,
  RotateCcw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Users,
  Wallet
} from "lucide-react";

import { MarketingSiteShell } from "@/components/public/marketing-site-shell";

type KanbanStage = "inbound" | "quotation" | "in_progress" | "review" | "delivered";

export default function InteractiveAgencyDemoPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [channel, setChannel] = useState<"whatsapp" | "instagram">("whatsapp");
  const [dealValue, setDealValue] = useState<number>(18000);
  const [editorPayout, setEditorPayout] = useState<number>(6000);
  const [allowEditorReply, setAllowEditorReply] = useState<boolean>(false);
  const [activeLane, setActiveLane] = useState<"customer" | "internal">("customer");
  const [kanbanStage, setKanbanStage] = useState<KanbanStage>("in_progress");
  const [editorDispatched, setEditorDispatched] = useState<boolean>(true);
  const [editorAccepted, setEditorAccepted] = useState<boolean>(true);
  const [customerMessages, setCustomerMessages] = useState<Array<{ sender: "client" | "agency" | "editor"; text: string; time: string }>>([
    { sender: "client", text: "Hi team! We need three 9:16 product launch reels by Friday. High-energy kinetic whip pans. Here are the raw drive links.", time: "10:42 AM" },
    { sender: "agency", text: "Received! Brief qualified. Deal notes recorded at ₹18,000. Assigning specialist editor now.", time: "10:44 AM" }
  ]);
  const [internalMessages, setInternalMessages] = useState<Array<{ sender: "manager" | "editor"; text: string; time: string }>>([
    { sender: "manager", text: "Sagar, raw 4K footage is in Drive. Emphasize product color grade in shot 3. 24h rough cut SLA.", time: "10:45 AM" },
    { sender: "editor", text: "Got it. Downloading assets now. Will send rough cut by tomorrow 2 PM.", time: "10:48 AM" }
  ]);
  const [newMessage, setNewMessage] = useState("");

  const grossMargin = dealValue - editorPayout;
  const marginPercentage = dealValue > 0 ? ((grossMargin / dealValue) * 100).toFixed(1) : "0";

  const stages: Array<{ id: KanbanStage; label: string; count: number }> = [
    { id: "inbound", label: "Inbound Lead", count: kanbanStage === "inbound" ? 1 : 0 },
    { id: "quotation", label: "Quote Sent", count: kanbanStage === "quotation" ? 1 : 0 },
    { id: "in_progress", label: "In Progress", count: kanbanStage === "in_progress" ? 1 : 0 },
    { id: "review", label: "Client Review", count: kanbanStage === "review" ? 1 : 0 },
    { id: "delivered", label: "Delivered & Paid", count: kanbanStage === "delivered" ? 1 : 0 },
  ];

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (activeLane === "customer") {
      setCustomerMessages(prev => [...prev, {
        sender: allowEditorReply ? "editor" : "agency",
        text: newMessage.trim(),
        time: "Just now"
      }]);
    } else {
      setInternalMessages(prev => [...prev, {
        sender: "manager",
        text: newMessage.trim(),
        time: "Just now"
      }]);
    }
    setNewMessage("");
  }

  function resetSimulator() {
    setActiveStep(1);
    setChannel("whatsapp");
    setDealValue(18000);
    setEditorPayout(6000);
    setAllowEditorReply(false);
    setActiveLane("customer");
    setKanbanStage("in_progress");
    setEditorDispatched(true);
    setEditorAccepted(true);
  }

  return (
    <MarketingSiteShell>
      <div className="gx-demo-page" style={{ background: "#050608", color: "#f3f4f6", minHeight: "100vh", padding: "40px 20px 80px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          
          {/* Header Banner */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(223, 255, 0, 0.12)", color: "#dfff00", padding: "6px 14px", borderRadius: "999px", fontSize: "clamp(10px, 3vw, 12px)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", border: "1px solid rgba(223, 255, 0, 0.3)", maxWidth: "100%", textAlign: "center" }}>
              <Sparkles size={14} /> Interactive Operations Sandbox
            </div>
            <h1 style={{ fontSize: "clamp(1.75rem, 5.5vw, 3.2rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "14px", color: "#ffffff", wordBreak: "break-word" }}>
              Experience Gigxomi Agency Operations <span style={{ color: "#dfff00", fontStyle: "italic" }}>Live</span>
            </h1>
            <p style={{ maxWidth: "720px", margin: "0 auto", fontSize: "clamp(13px, 3.5vw, 16px)", color: "#9ca3af", lineHeight: 1.6 }}>
              Test the 5 core operational systems used by video editing studios: multi-channel inbound, brief qualification, editor dispatch, anti-poaching two-lane chat, and 5-stage Kanban tracking.
            </p>
          </div>

          {/* Interactive Steps Control Rail */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "28px" }}>
            {[
              { num: 1, title: "1. Client Inbound", desc: "WhatsApp & Instagram" },
              { num: 2, title: "2. Brief & Margin", desc: "Deal pricing & 0% fee" },
              { num: 3, title: "3. Roster Dispatch", desc: "Specialist mobile SLA" },
              { num: 4, title: "4. Anti-Poaching", desc: "Two-Lane phone mask" },
              { num: 5, title: "5. Kanban Delivery", desc: "5-stage pipeline" },
            ].map((step) => (
              <button
                key={step.num}
                onClick={() => setActiveStep(step.num)}
                style={{
                  background: activeStep === step.num ? "rgba(223, 255, 0, 0.14)" : "rgba(255, 255, 255, 0.03)",
                  border: activeStep === step.num ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "700", color: activeStep === step.num ? "#dfff00" : "#ffffff", marginBottom: "4px" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: "12px", color: "#8b949e" }}>{step.desc}</div>
              </button>
            ))}
          </div>

          {/* Main Simulator Frame */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 360px) 1fr", gap: "24px", alignItems: "start" }}>
            
            {/* Left Deck: Live Simulator Controls */}
            <div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "14px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#dfff00" }}>
                  Step {activeStep} Controls
                </span>
                <button
                  onClick={resetSimulator}
                  style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "#8b949e", fontSize: "12px", cursor: "pointer" }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>

              {activeStep === 1 && (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Simulate Inbound Lead</h3>
                  <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "16px", lineHeight: 1.5 }}>
                    See how incoming client enquiries route to your multi-seat agency inbox without exposing your personal phone.
                  </p>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
                    <button
                      onClick={() => setChannel("whatsapp")}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        background: channel === "whatsapp" ? "rgba(37, 211, 102, 0.2)" : "rgba(255, 255, 255, 0.04)",
                        border: channel === "whatsapp" ? "1px solid #25D366" : "1px solid rgba(255, 255, 255, 0.1)",
                        color: channel === "whatsapp" ? "#25D366" : "#9ca3af",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      WhatsApp Cloud API
                    </button>
                    <button
                      onClick={() => setChannel("instagram")}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        background: channel === "instagram" ? "rgba(225, 48, 108, 0.2)" : "rgba(255, 255, 255, 0.04)",
                        border: channel === "instagram" ? "1px solid #E1306C" : "1px solid rgba(255, 255, 255, 0.1)",
                        color: channel === "instagram" ? "#E1306C" : "#9ca3af",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Instagram Direct
                    </button>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "12px", borderRadius: "8px", fontSize: "12px", color: "#8b949e", borderLeft: "3px solid #dfff00" }}>
                    <strong>Agency Founder Benefit:</strong> Multiple managers can reply from the official brand number. Zero shared SIM cards.
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Qualify Brief & Deal Margin</h3>
                  <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "16px", lineHeight: 1.5 }}>
                    Log deal values and contractor payouts with real-time gross margin calculation and 0% platform take rate.
                  </p>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>Client Deal Value (₹)</label>
                    <input
                      type="number"
                      value={dealValue}
                      onChange={(e) => setDealValue(Number(e.target.value))}
                      style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "6px", padding: "8px 12px", color: "#ffffff", fontSize: "14px", fontWeight: "600" }}
                    />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>Editor Payout (₹)</label>
                    <input
                      type="number"
                      value={editorPayout}
                      onChange={(e) => setEditorPayout(Number(e.target.value))}
                      style={{ width: "100%", background: "#161b22", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "6px", padding: "8px 12px", color: "#ffffff", fontSize: "14px", fontWeight: "600" }}
                    />
                  </div>
                  <div style={{ background: "rgba(223, 255, 0, 0.08)", border: "1px solid rgba(223, 255, 0, 0.2)", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#8b949e" }}>Agency Retained Margin:</span>
                      <strong style={{ color: "#dfff00" }}>₹{grossMargin.toLocaleString("en-IN")} ({marginPercentage}%)</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#8b949e" }}>Gigxomi Commission:</span>
                      <strong style={{ color: "#25D366" }}>₹0 (0% Take Rate)</strong>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Dispatch to Specialist Roster</h3>
                  <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "16px", lineHeight: 1.5 }}>
                    Match the brief to a verified specialist with push notifications and strict acceptance turnaround timers.
                  </p>
                  <div style={{ background: "#161b22", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "14px", color: "#ffffff" }}>Sagar K.</strong>
                      <span style={{ background: "rgba(223, 255, 0, 0.15)", color: "#dfff00", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>98% Match</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8b949e", marginBottom: "8px" }}>Senior Short-Form Specialist · DaVinci & Premiere</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#25D366" }}>
                      <Clock size={12} /> 4-Hour Acceptance SLA Active
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditorDispatched(true);
                      setEditorAccepted(true);
                    }}
                    style={{ width: "100%", background: "#dfff00", color: "#000", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Simulate Mobile App Push Alert
                  </button>
                </div>
              )}

              {activeStep === 4 && (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Two-Lane Anti-Poaching Gate</h3>
                  <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "16px", lineHeight: 1.5 }}>
                    Toggle manager permissions to see how client phone numbers remain cryptographically masked.
                  </p>
                  
                  <div style={{ background: "#161b22", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>Allow Editor Reply</span>
                      <button
                        onClick={() => setAllowEditorReply(!allowEditorReply)}
                        style={{
                          background: allowEditorReply ? "#25D366" : "rgba(255, 255, 255, 0.1)",
                          border: "none",
                          borderRadius: "999px",
                          width: "44px",
                          height: "24px",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s ease"
                        }}
                      >
                        <div style={{
                          width: "18px",
                          height: "18px",
                          background: "#ffffff",
                          borderRadius: "50%",
                          position: "absolute",
                          top: "3px",
                          left: allowEditorReply ? "22px" : "4px",
                          transition: "left 0.2s ease"
                        }} />
                      </button>
                    </div>
                    <div style={{ fontSize: "11px", color: allowEditorReply ? "#25D366" : "#8b949e" }}>
                      {allowEditorReply ? "✓ Direct editor relay active (phone still encrypted)" : "🔒 Read-only customer lane (Anti-poaching shield active)"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                    <button
                      onClick={() => setActiveLane("customer")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: activeLane === "customer" ? "rgba(223, 255, 0, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        border: activeLane === "customer" ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
                        color: activeLane === "customer" ? "#dfff00" : "#9ca3af",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Customer Lane
                    </button>
                    <button
                      onClick={() => setActiveLane("internal")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        background: activeLane === "internal" ? "rgba(223, 255, 0, 0.15)" : "rgba(255, 255, 255, 0.04)",
                        border: activeLane === "internal" ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
                        color: activeLane === "internal" ? "#dfff00" : "#9ca3af",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Internal Backchannel
                    </button>
                  </div>
                </div>
              )}

              {activeStep === 5 && (
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>5-Stage Kanban Delivery</h3>
                  <p style={{ fontSize: "13px", color: "#8b949e", marginBottom: "16px", lineHeight: 1.5 }}>
                    Click any production stage to advance the project card and synchronize workspace status in real time.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {stages.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setKanbanStage(st.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: kanbanStage === st.id ? "rgba(223, 255, 0, 0.15)" : "#161b22",
                          border: kanbanStage === st.id ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
                          color: kanbanStage === st.id ? "#dfff00" : "#ffffff",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer"
                        }}
                      >
                        <span>{st.label}</span>
                        {kanbanStage === st.id && <CheckCircle2 size={14} color="#dfff00" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <button
                  disabled={activeStep === 1}
                  onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                  style={{ background: "none", border: "1px solid rgba(255, 255, 255, 0.15)", color: activeStep === 1 ? "#4b5563" : "#ffffff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", cursor: activeStep === 1 ? "not-allowed" : "pointer" }}
                >
                  Previous
                </button>
                <button
                  disabled={activeStep === 5}
                  onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
                  style={{ background: "#dfff00", color: "#000", border: "none", padding: "6px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: activeStep === 5 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Next Step <ChevronRight size={14} />
                </button>
              </div>

            </div>

            {/* Right Stage: Live Studio Workspace Simulator */}
            <div style={{ background: "#0a0c10", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)" }}>
              
              {/* Workspace Top Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#0d1117", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#dfff00", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px" }}>G</div>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#e6edf3" }}>Studio Workspace / Chat Inbox</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {channel === "whatsapp" ? (
                    <span style={{ background: "rgba(37, 211, 102, 0.15)", color: "#25D366", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", border: "1px solid rgba(37, 211, 102, 0.3)" }}>
                      ● WhatsApp Cloud API
                    </span>
                  ) : (
                    <span style={{ background: "rgba(225, 48, 108, 0.15)", color: "#E1306C", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", border: "1px solid rgba(225, 48, 108, 0.3)" }}>
                      ● Instagram Direct API
                    </span>
                  )}
                  <span style={{ background: "#dfff00", color: "#000", fontSize: "11px", fontWeight: "800", padding: "4px 10px", borderRadius: "6px" }}>
                    + Project #104
                  </span>
                </div>
              </div>

              {/* Workspace Split Body */}
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 240px", minHeight: "440px" }}>
                
                {/* 1. Inbound Lead List */}
                <div style={{ background: "#080a0e", borderRight: "1px solid rgba(255, 255, 255, 0.06)", padding: "14px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#8b949e", textTransform: "uppercase", marginBottom: "12px", display: "flex", justifyContent: "space-between" }}>
                    <span>Inbound Leads</span>
                    <span style={{ background: "#dfff00", color: "#000", padding: "1px 6px", borderRadius: "999px", fontSize: "10px" }}>2 New</span>
                  </div>

                  <div style={{ background: "rgba(223, 255, 0, 0.06)", border: "1px solid rgba(223, 255, 0, 0.3)", borderRadius: "8px", padding: "10px", marginBottom: "10px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: "#ffffff" }}>UrbanKicks</strong>
                      <span style={{ fontSize: "10px", color: "#8b949e" }}>Now</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "6px" }}>
                      "Need 3 product launch reels..."
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: channel === "whatsapp" ? "#25D366" : "#E1306C" }}>
                        {channel === "whatsapp" ? "WhatsApp" : "Instagram"}
                      </span>
                      <strong style={{ fontSize: "11px", color: "#dfff00" }}>₹{dealValue.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  <div style={{ background: "#0d1117", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "10px", opacity: 0.6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: "#ffffff" }}>Horizon FinTech</strong>
                      <span style={{ fontSize: "10px", color: "#8b949e" }}>18m</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      "Storyboard approved..."
                    </div>
                  </div>
                </div>

                {/* 2. Central Two-Lane Chat & Stage Display */}
                <div style={{ display: "flex", flexDirection: "column", background: "#0b0e14" }}>
                  
                  {/* Thread Header with Masking Banner */}
                  <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0e131b" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "13px", color: "#ffffff" }}>UrbanKicks Retail</strong>
                        <span style={{ background: "rgba(223, 255, 0, 0.15)", color: "#dfff00", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }}>Direct Client</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#8b949e", marginTop: "2px" }}>
                        <ShieldCheck size={13} color="#25D366" />
                        <span>Phone Masked: <code style={{ color: "#dfff00" }}>+91 ***** **842</code></span>
                      </div>
                    </div>

                    {/* Lane Tabs */}
                    <div style={{ display: "flex", background: "#161b22", padding: "3px", borderRadius: "6px" }}>
                      <button
                        onClick={() => setActiveLane("customer")}
                        style={{
                          background: activeLane === "customer" ? "#dfff00" : "none",
                          color: activeLane === "customer" ? "#000" : "#8b949e",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Customer Lane
                      </button>
                      <button
                        onClick={() => setActiveLane("internal")}
                        style={{
                          background: activeLane === "internal" ? "#dfff00" : "none",
                          color: activeLane === "internal" ? "#000" : "#8b949e",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        Internal Lane
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div style={{ flex: 1, padding: "18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {activeLane === "customer" ? (
                      customerMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            alignSelf: msg.sender === "client" ? "flex-start" : "flex-end",
                            maxWidth: "80%",
                            background: msg.sender === "client" ? "#161b22" : "rgba(223, 255, 0, 0.14)",
                            border: msg.sender === "client" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(223, 255, 0, 0.3)",
                            borderRadius: "10px",
                            padding: "10px 14px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: msg.sender === "client" ? "#9ca3af" : "#dfff00" }}>
                              {msg.sender === "client" ? "UrbanKicks (Client)" : msg.sender === "editor" ? "Sagar K. (Editor Relay)" : "Agency Manager"}
                            </span>
                            <span style={{ fontSize: "9px", color: "#6e7681" }}>{msg.time}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#f0f6fc", lineHeight: 1.4 }}>{msg.text}</div>
                        </div>
                      ))
                    ) : (
                      internalMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          style={{
                            alignSelf: msg.sender === "manager" ? "flex-end" : "flex-start",
                            maxWidth: "80%",
                            background: "#161b22",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "10px",
                            padding: "10px 14px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#58a6ff" }}>
                              {msg.sender === "manager" ? "Internal: Agency Manager" : "Internal: Sagar K. (Editor)"}
                            </span>
                            <span style={{ fontSize: "9px", color: "#6e7681" }}>{msg.time}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#f0f6fc", lineHeight: 1.4 }}>{msg.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input Box with Permission Lock Banner */}
                  <div style={{ padding: "12px 16px", background: "#0e131b", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                    {activeLane === "customer" && !allowEditorReply && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#8b949e", marginBottom: "8px" }}>
                        <Lock size={12} color="#f59e0b" />
                        <span>Anti-Poaching Shield Active · Direct editor replies disabled by agency</span>
                      </div>
                    )}
                    <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={
                          activeLane === "customer"
                            ? allowEditorReply
                              ? "Reply as editor (customer receives on WhatsApp)..."
                              : "Reply as agency manager..."
                            : "Internal team backchannel note..."
                        }
                        style={{
                          flex: 1,
                          background: "#161b22",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          color: "#ffffff",
                          fontSize: "12px"
                        }}
                      />
                      <button
                        type="submit"
                        style={{ background: "#dfff00", color: "#000", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer" }}
                      >
                        <Send size={13} />
                      </button>
                    </form>
                  </div>

                </div>

                {/* 3. Project Context Drawer */}
                <div style={{ background: "#080a0e", borderLeft: "1px solid rgba(255, 255, 255, 0.06)", padding: "16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#8b949e", textTransform: "uppercase", marginBottom: "12px" }}>
                    Project Context
                  </div>

                  <div style={{ background: "#0e131b", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>UrbanKicks Launch</div>
                    <div style={{ fontSize: "11px", color: "#8b949e", marginBottom: "10px" }}>3x 9:16 Vertical UGC Reels</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <div>
                        <span style={{ fontSize: "10px", color: "#8b949e", display: "block" }}>Deal Value</span>
                        <strong style={{ fontSize: "12px", color: "#ffffff" }}>₹{dealValue.toLocaleString("en-IN")}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "10px", color: "#8b949e", display: "block" }}>Editor Payout</span>
                        <strong style={{ fontSize: "12px", color: "#dfff00" }}>₹{editorPayout.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#8b949e", textTransform: "uppercase", marginBottom: "8px" }}>
                    Kanban Stage
                  </div>
                  <div style={{ background: "#161b22", borderRadius: "6px", padding: "8px 10px", fontSize: "11px", fontWeight: "600", color: "#dfff00", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Layers3 size={13} />
                    <span>{stages.find(s => s.id === kanbanStage)?.label}</span>
                  </div>

                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#8b949e", textTransform: "uppercase", marginBottom: "8px" }}>
                    Assigned Specialist
                  </div>
                  <div style={{ background: "#0e131b", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "12px", color: "#ffffff" }}>Sagar K.</strong>
                      <span style={{ color: "#25D366", fontSize: "10px" }}>● Active</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#8b949e" }}>Android Mobile Synced</div>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Bottom Conversion Section */}
          <div style={{ marginTop: "60px", background: "linear-gradient(180deg, rgba(223, 255, 0, 0.08) 0%, rgba(223, 255, 0, 0.02) 100%)", border: "1px solid rgba(223, 255, 0, 0.25)", borderRadius: "20px", padding: "40px 32px", textAlign: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", color: "#dfff00", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Ready to Upgrade Your Agency Operations?
            </span>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: "800", color: "#ffffff", marginTop: "10px", marginBottom: "14px" }}>
              Start Running Your Studio on Gigxomi Today
            </h2>
            <p style={{ maxWidth: "680px", margin: "0 auto 28px", fontSize: "15px", color: "#9ca3af", lineHeight: 1.6 }}>
              Get multi-seat WhatsApp & Instagram inbound, two-lane anti-poaching chat, 5-stage Kanban pipelines, and specialist editor capacity for a flat ₹2,000/mo with 0% platform commission.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href="/pricing"
                style={{
                  background: "#dfff00",
                  color: "#000",
                  padding: "14px 28px",
                  borderRadius: "10px",
                  fontWeight: "800",
                  fontSize: "14px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                Start 14-Day Free Trial (₹2,000/mo) <ArrowRight size={16} />
              </Link>
              <Link
                href="/knowledge-base"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#ffffff",
                  padding: "14px 24px",
                  borderRadius: "10px",
                  fontWeight: "700",
                  fontSize: "14px",
                  textDecoration: "none",
                  border: "1px solid rgba(255, 255, 255, 0.15)"
                }}
              >
                Explore Agency Manuals
              </Link>
            </div>
          </div>

        </div>
      </div>
    </MarketingSiteShell>
  );
}
