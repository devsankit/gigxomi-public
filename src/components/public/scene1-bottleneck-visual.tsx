"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Instagram, ShieldCheck, Play, Pause, RefreshCcw } from "lucide-react";

/**
 * Standard damped harmonic spring function (identical to Remotion's spring math)
 */
function calculateSpring(frame: number, delay = 0, damping = 14, stiffness = 120): number {
  const current = frame - delay;
  if (current <= 0) return 0;
  const t = current / 60;
  const omega = Math.sqrt(stiffness);
  const zeta = damping / (2 * omega);
  const decay = Math.exp(-zeta * omega * t);
  const val = 1 - decay * Math.cos(omega * Math.sqrt(Math.max(0, 1 - zeta * zeta)) * t);
  return Math.min(Math.max(val, 0), 1);
}

function interpolateVal(
  val: number,
  inRange: [number, number],
  outRange: [number, number],
  clamp = true
): number {
  const [inMin, inMax] = inRange;
  const [outMin, outMax] = outRange;
  if (inMax === inMin) return outMin;
  const progress = (val - inMin) / (inMax - inMin);
  const result = outMin + progress * (outMax - outMin);
  if (!clamp) return result;
  const min = Math.min(outMin, outMax);
  const max = Math.max(outMin, outMax);
  return Math.min(Math.max(result, min), max);
}

interface Scene1BottleneckVisualProps {
  mode?: "hero" | "bottleneck" | "standalone";
  defaultAct?: "auto" | "act1" | "act2" | "act3";
}

export function Scene1BottleneckVisual({ mode = "hero", defaultAct = "auto" }: Scene1BottleneckVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAct, setSelectedAct] = useState<"auto" | "act1" | "act2" | "act3">(defaultAct);
  // Default to frame 30 so initial mount has the kinetic text fully rendered
  const [frame, setFrame] = useState<number>(defaultAct === "act2" ? 85 : defaultAct === "act3" ? 200 : 35);
  const [isPlaying, setIsPlaying] = useState<boolean>(defaultAct === "auto");
  const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 60 FPS continuous animation loop (360 frames = 6.0 seconds per cycle)
  const TOTAL_CYCLE_FRAMES = 360;

  // URL param detection (?act=1, ?act=2, ?act=3)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const act = params.get("act");
      if (act === "1") handleActSelect("act1");
      else if (act === "2") handleActSelect("act2");
      else if (act === "3") handleActSelect("act3");
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let startTime: number | null = null;
    const baseFrame = frame;

    const loop = (time: number) => {
      if (startTime === null) startTime = time;
      const elapsed = time - startTime;
      const addedFrames = Math.floor((elapsed / 1000) * 60);
      setFrame((baseFrame + addedFrames) % TOTAL_CYCLE_FRAMES);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, frame]);

  const handleActSelect = (act: "auto" | "act1" | "act2" | "act3") => {
    setSelectedAct(act);
    if (act === "auto") {
      setIsPlaying(true);
    } else if (act === "act1") {
      setIsPlaying(false);
      setFrame(35); // Kinetic typography
    } else if (act === "act2") {
      setIsPlaying(false);
      setFrame(85); // Bottleneck chaos node
    } else if (act === "act3") {
      setIsPlaying(false);
      setFrame(200); // Dashboard swoop
    }
  };

  // 1. Kinetic Typography Spring
  // The text snaps into place quickly from +400px Z depth
  const typeSpring = calculateSpring(frame, 0, 14, 120);
  const typeTranslateZ = interpolateVal(typeSpring, [0, 1], [400, 0]);
  const typeOpacity = interpolateVal(typeSpring, [0, 1], [0, 1]);
  const typeFadeOut = interpolateVal(frame, [80, 105], [1, 0]);

  // 2. The Bottleneck Node Chaos (WhatsApp/Instagram laser lines)
  const chaosScale = calculateSpring(frame, 30, 10, 100);
  const chaosCollapse = interpolateVal(frame, [115, 138], [1, 0]);
  const whatsappRotate = interpolateVal(frame, [0, 300], [0, 120]);
  const instagramRotate = interpolateVal(frame, [0, 300], [0, -75]);

  // 3. Dashboard UI Card Reveal
  // Swoops in exactly as the chaos collapses from +260px below
  const dashboardSpring = calculateSpring(frame, 128, 14, 90);
  const dashTranslateY = interpolateVal(dashboardSpring, [0, 1], [260, 0]);
  const dashTranslateZ = interpolateVal(dashboardSpring, [0, 1], [260, 0]);
  const dashOpacity = dashboardSpring;

  // Camera Dolly
  const cameraZ = interpolateVal(frame, [0, 300], [0, -120]);

  // Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: nx * 8, y: ny * -6 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`gx-bottleneck-3d-stage ${mode}`}
      style={{
        position: "relative",
        width: "100%",
        height: mode === "hero" ? "580px" : "480px",
        minHeight: mode === "hero" ? "580px" : "480px",
        backgroundColor: "#07090D",
        borderRadius: "20px",
        overflow: "hidden",
        perspective: "1200px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 25px 70px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        userSelect: "none",
      }}
    >
      {/* Background Ambience & Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 40%, rgba(215, 255, 47, 0.07) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(225, 48, 108, 0.05) 0%, transparent 40%), radial-gradient(circle at 20% 70%, rgba(37, 211, 102, 0.05) 0%, transparent 40%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Act Selector Floating Chips (Top Right) */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "14px",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: "rgba(10, 14, 11, 0.85)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          padding: "4px 8px",
          borderRadius: "999px",
        }}
      >
        <button
          type="button"
          onClick={() => handleActSelect("auto")}
          style={{
            padding: "3px 9px",
            borderRadius: "999px",
            fontSize: "10.5px",
            fontWeight: 750,
            cursor: "pointer",
            border: selectedAct === "auto" ? "1px solid #dfff00" : "1px solid transparent",
            background: selectedAct === "auto" ? "#dfff00" : "transparent",
            color: selectedAct === "auto" ? "#07090D" : "rgba(255, 255, 255, 0.7)",
          }}
        >
          Auto Loop
        </button>

        <button
          type="button"
          onClick={() => handleActSelect("act1")}
          style={{
            padding: "3px 9px",
            borderRadius: "999px",
            fontSize: "10.5px",
            fontWeight: 750,
            cursor: "pointer",
            border: selectedAct === "act1" ? "1px solid #dfff00" : "1px solid transparent",
            background: selectedAct === "act1" ? "#dfff00" : "transparent",
            color: selectedAct === "act1" ? "#07090D" : "rgba(255, 255, 255, 0.7)",
          }}
        >
          1. Hook
        </button>

        <button
          type="button"
          onClick={() => handleActSelect("act2")}
          style={{
            padding: "3px 9px",
            borderRadius: "999px",
            fontSize: "10.5px",
            fontWeight: 750,
            cursor: "pointer",
            border: selectedAct === "act2" ? "1px solid #dfff00" : "1px solid transparent",
            background: selectedAct === "act2" ? "#dfff00" : "transparent",
            color: selectedAct === "act2" ? "#07090D" : "rgba(255, 255, 255, 0.7)",
          }}
        >
          2. Bottleneck
        </button>

        <button
          type="button"
          onClick={() => handleActSelect("act3")}
          style={{
            padding: "3px 9px",
            borderRadius: "999px",
            fontSize: "10.5px",
            fontWeight: 750,
            cursor: "pointer",
            border: selectedAct === "act3" ? "1px solid #dfff00" : "1px solid transparent",
            background: selectedAct === "act3" ? "#dfff00" : "transparent",
            color: selectedAct === "act3" ? "#07090D" : "rgba(255, 255, 255, 0.7)",
          }}
        >
          3. Solution
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            display: "grid",
            placeItems: "center",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#FFFFFF",
            cursor: "pointer",
            marginLeft: "2px",
          }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
        </button>
      </div>

      {/* 3D Camera Wrapper with Isometric Tilt & Mouse Parallax */}
      <div
        className="gx-bottleneck-3d-camera"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transformOrigin: "50% 50%",
          transform: `scale(var(--stage-scale, 1)) translateZ(${cameraZ}px) rotateX(${15 + mouseTilt.y}deg) rotateY(${-10 + mouseTilt.x}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* ========================================================
            ACT 1: KINETIC TYPOGRAPHY HOOK
            "STOP BEING THE MIDDLEMAN"
            ======================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            transform: `translateZ(${typeTranslateZ}px)`,
            opacity: typeOpacity * typeFadeOut,
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div
            style={{
              color: "#ffffff",
              fontSize: "clamp(26px, 4.2vw, 44px)",
              fontFamily: "Inter, var(--font-geist-sans), -apple-system, sans-serif",
              fontWeight: 850,
              letterSpacing: "-0.035em",
              textAlign: "center",
              textTransform: "uppercase",
              textShadow: "0 10px 35px rgba(0, 0, 0, 0.9)",
              maxWidth: "800px",
              padding: "0 20px",
            }}
          >
            <span>Stop Being The </span>
            <span style={{ color: "#dfff00", textDecoration: "underline", textDecorationColor: "rgba(215, 255, 47, 0.45)" }}>
              Middleman
            </span>
          </div>
          <p style={{ color: "rgba(255, 255, 255, 0.55)", fontSize: "14px", marginTop: "12px", fontWeight: 500 }}>
            Unified WhatsApp & Instagram operations for video editing agencies
          </p>
        </div>

        {/* ========================================================
            ACT 2: CHAOS / OWNER NODE DIAGRAM
            WhatsApp & Instagram laser ping frequency
            ======================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: `scale(${chaosScale * chaosCollapse})`,
            opacity: chaosCollapse,
            pointerEvents: "none",
            zIndex: 12,
          }}
        >
          {/* Incoming WhatsApp Ping Beam (Left) */}
          <div
            style={{
              position: "absolute",
              width: "360px",
              height: "2px",
              background: "linear-gradient(90deg, #25D366 0%, rgba(37, 211, 102, 0.4) 60%, transparent 100%)",
              top: "50%",
              left: "calc(50% - 360px)",
              transform: `rotate(${whatsappRotate}deg)`,
              transformOrigin: "right center",
              boxShadow: "0 0 12px #25D366",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "-12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(37, 211, 102, 0.15)",
                border: "1px solid #25D366",
                borderRadius: "999px",
                padding: "2px 8px",
                color: "#25D366",
                fontSize: "10px",
                fontWeight: 700,
                boxShadow: "0 0 10px rgba(37, 211, 102, 0.3)",
              }}
            >
              <MessageCircle size={10} /> WhatsApp
            </div>
          </div>

          {/* Incoming Instagram Ping Beam (Right) */}
          <div
            style={{
              position: "absolute",
              width: "360px",
              height: "2px",
              background: "linear-gradient(90deg, transparent 0%, rgba(225, 48, 108, 0.4) 40%, #E1306C 100%)",
              top: "50%",
              left: "50%",
              transform: `rotate(${instagramRotate}deg)`,
              transformOrigin: "left center",
              boxShadow: "0 0 12px #E1306C",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "-12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(225, 48, 108, 0.15)",
                border: "1px solid #E1306C",
                borderRadius: "999px",
                padding: "2px 8px",
                color: "#E1306C",
                fontSize: "10px",
                fontWeight: 700,
                boxShadow: "0 0 10px rgba(225, 48, 108, 0.3)",
              }}
            >
              <Instagram size={10} /> Instagram
            </div>
          </div>

          {/* Central Agency Owner Node */}
          <div
            style={{
              width: "128px",
              height: "128px",
              borderRadius: "50%",
              background: "radial-gradient(circle at center, #1E252A 0%, #11151A 100%)",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "#E2ECE5",
              fontFamily: "Inter, sans-serif",
              fontWeight: 700,
              fontSize: "13px",
              textAlign: "center",
              lineHeight: 1.25,
              boxShadow: "0 15px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 255, 255, 0.08)",
              position: "relative",
              zIndex: 15,
            }}
          >
            <span style={{ fontSize: "10px", color: "#f87171", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
              Bottleneck
            </span>
            <span>Agency</span>
            <span>Owner</span>
            <div
              style={{
                position: "absolute",
                bottom: "-10px",
                background: "#f43f5e",
                color: "#fff",
                fontSize: "8.5px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "999px",
                letterSpacing: "0.04em",
                boxShadow: "0 4px 12px rgba(244, 63, 94, 0.4)",
              }}
            >
              100+ DMs / Day
            </div>
          </div>
        </div>

        {/* ========================================================
            ACT 3: THE CLEAN GIGXOMI UI LAYOUT
            Frosted Glass 3D Dashboard Swoop
            ======================================================== */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateY(${dashTranslateY}px) translateZ(${dashTranslateZ}px)`,
            opacity: dashOpacity,
            width: "min(92%, 840px)",
            height: "460px",
            background: "rgba(14, 18, 22, 0.88)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "18px",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            boxShadow:
              "0 35px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 40px rgba(215, 255, 47, 0.12)",
            display: "flex",
            overflow: "hidden",
            zIndex: 18,
          }}
        >
          {/* Simulated UI Sidebar */}
          <div
            style={{
              width: "210px",
              background: "#0A0D10",
              borderRight: "1px solid rgba(255, 255, 255, 0.07)",
              padding: "18px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Logo Mark */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: "var(--gx-primary, #dfff00)",
                  color: "#0B0F0C",
                  fontWeight: 900,
                  fontSize: "13px",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 10px rgba(215, 255, 47, 0.4)",
                }}
              >
                G
              </div>
              <strong style={{ fontSize: "13px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Gigxomi OS</strong>
            </div>

            {/* Nav Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(215, 255, 47, 0.14)",
                  border: "1px solid rgba(215, 255, 47, 0.3)",
                  color: "var(--gx-primary, #dfff00)",
                  fontSize: "11px",
                  fontWeight: 750,
                }}
              >
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dfff00", boxShadow: "0 0 6px #dfff00" }} />
                <span>Chat Inbox</span>
                <small style={{ marginLeft: "auto", background: "#dfff00", color: "#0A0E0B", padding: "1px 5px", borderRadius: "999px", fontSize: "9px", fontWeight: 800 }}>
                  2 New
                </small>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", color: "rgba(255, 255, 255, 0.45)", fontSize: "11px", fontWeight: 600 }}>
                <span>Work Hub</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", color: "rgba(255, 255, 255, 0.45)", fontSize: "11px", fontWeight: 600 }}>
                <span>Project Tracking</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", color: "rgba(255, 255, 255, 0.45)", fontSize: "11px", fontWeight: 600 }}>
                <span>Editor Capacity</span>
              </div>
            </div>

            {/* Bottom Controlled Collaboration Lane */}
            <div
              style={{
                marginTop: "auto",
                padding: "10px",
                borderRadius: "9px",
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={11} /> Controlled Lane
              </span>
              <small style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                Client: +91 ***** **842
              </small>
            </div>
          </div>

          {/* Simulated UI Main Canvas */}
          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
            {/* Topbar inside workspace */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.07)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", color: "#FFFFFF", fontWeight: 750, letterSpacing: "-0.02em" }}>
                  Agency Operations Control
                </h3>
                <small style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "10px" }}>
                  WhatsApp & Instagram unified · 0% commission retained
                </small>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <span style={{ padding: "3px 8px", borderRadius: "5px", background: "rgba(37, 211, 102, 0.12)", color: "#25D366", border: "1px solid rgba(37, 211, 102, 0.25)", fontSize: "9.5px", fontWeight: 700 }}>
                  WhatsApp Connected
                </span>
                <span style={{ padding: "3px 8px", borderRadius: "5px", background: "rgba(225, 48, 108, 0.12)", color: "#E1306C", border: "1px solid rgba(225, 48, 108, 0.25)", fontSize: "9.5px", fontWeight: 700 }}>
                  Instagram Connected
                </span>
              </div>
            </div>

            {/* Live Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", flex: 1 }}>
              {/* Left Live Chat Simulation */}
              <div
                style={{
                  background: "#0D1115",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "12px", color: "#FFFFFF" }}>UrbanKicks Retail</strong>
                  <span style={{ fontSize: "10px", color: "var(--gx-primary, #dfff00)", fontWeight: 750 }}>₹18,000 Deal</span>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.04)", borderRadius: "8px", padding: "10px", fontSize: "10.5px", color: "#D1D5DB", lineHeight: 1.4 }}>
                  "Hi team! We need three 9:16 reels for Friday. High-energy whip pans."
                </div>

                <div style={{ background: "rgba(215, 255, 47, 0.12)", border: "1px solid rgba(215, 255, 47, 0.25)", borderRadius: "8px", padding: "10px", fontSize: "10.5px", color: "#FFFFFF", marginLeft: "auto", maxWidth: "85%" }}>
                  <strong style={{ color: "#dfff00", display: "block", fontSize: "9px" }}>Manager:</strong>
                  "Brief qualified. Assigned to Sagar (Editor). SLA: 24 hours."
                </div>

                <div style={{ marginTop: "auto", fontSize: "9px", color: "rgba(255, 255, 255, 0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={11} color="#25D366" /> Two-Lane Active · Direct client contact locked
                </div>
              </div>

              {/* Right Margin & Payout Stats */}
              <div
                style={{
                  background: "#0D1115",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div>
                  <small style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", fontWeight: 750 }}>
                    Retained Agency Margin
                  </small>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#dfff00", margin: "2px 0" }}>
                    ₹12,000 <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>(66.7%)</span>
                  </div>
                  <span style={{ fontSize: "9px", color: "rgba(255, 255, 255, 0.4)" }}>0% platform take rate</span>
                </div>

                <div style={{ paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
                    <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Client Value:</span>
                    <strong style={{ color: "#FFFFFF" }}>₹18,000</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
                    <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Editor Payout:</span>
                    <strong style={{ color: "#FFFFFF" }}>₹6,000</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px" }}>
                    <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Platform Fee:</span>
                    <strong style={{ color: "#25D366" }}>₹0 (0%)</strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    background: "rgba(215, 255, 47, 0.08)",
                    border: "1px solid rgba(215, 255, 47, 0.2)",
                    borderRadius: "8px",
                    padding: "8px",
                    textAlign: "center",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#dfff00",
                  }}
                >
                  ✓ Workflow Streamlined
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Indicator / Time Bar (Subtle Bottom Edge) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: `${(frame / TOTAL_CYCLE_FRAMES) * 100}%`,
          height: "3px",
          background: "linear-gradient(90deg, #25D366, #dfff00, #E1306C)",
          boxShadow: "0 0 10px rgba(215, 255, 47, 0.5)",
          transition: "width 0.05s linear",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
