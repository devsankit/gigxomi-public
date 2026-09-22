"use client";

import React, { useState } from "react";
import { GigxomiMotionGraphicsWorkspace } from "@/components/public/gigxomi-motion-graphics-workspace";
import { Scene1BottleneckVisual } from "@/components/public/scene1-bottleneck-visual";
import { GigxomiDemoPreview } from "@/components/public/gigxomi-workflow-story";
import { Sparkles, LayoutDashboard, Clapperboard, RotateCcw } from "lucide-react";

export function GigxomiHeroDemoSwitcher() {
  const [viewMode, setViewMode] = useState<"3d-motion-graphics" | "3d-bottleneck" | "coded-preview">(
    "3d-motion-graphics"
  );
  const [replayKey, setReplayKey] = useState<number>(0);

  return (
    <div className="gx-hero-demo-wrapper" style={{ position: "relative", width: "100%" }}>
      {/* Top Floating Control Bar */}
      <div
        className="gx-hero-demo-nav"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "8px 12px",
          background: "rgba(14, 18, 15, 0.9)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "14px",
          marginBottom: "12px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Toggle Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {/* Primary: 3D Motion Graphics with Camera Zoom */}
          <button
            type="button"
            onClick={() => setViewMode("3d-motion-graphics")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "999px",
              fontSize: "11.5px",
              fontWeight: 750,
              fontFamily: "inherit",
              cursor: "pointer",
              border: viewMode === "3d-motion-graphics" ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
              background: viewMode === "3d-motion-graphics" ? "#dfff00" : "rgba(255, 255, 255, 0.04)",
              color: viewMode === "3d-motion-graphics" ? "#080C09" : "rgba(255, 255, 255, 0.7)",
              transition: "all 0.2s ease",
              boxShadow: viewMode === "3d-motion-graphics" ? "0 0 16px rgba(215, 255, 47, 0.35)" : "none",
            }}
          >
            <Clapperboard size={12} color={viewMode === "3d-motion-graphics" ? "#080C09" : "#dfff00"} />
            <span>3D Motion Graphics</span>
            <span
              style={{
                fontSize: "8.5px",
                padding: "1px 5px",
                borderRadius: "4px",
                background: viewMode === "3d-motion-graphics" ? "rgba(0, 0, 0, 0.18)" : "rgba(215, 255, 47, 0.15)",
                color: viewMode === "3d-motion-graphics" ? "#000" : "#dfff00",
                fontWeight: 800,
              }}
            >
              Zoom Camera
            </span>
          </button>

          {/* Secondary: 3D Kinetic Bottleneck Intro */}
          <button
            type="button"
            onClick={() => setViewMode("3d-bottleneck")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 12px",
              borderRadius: "999px",
              fontSize: "11.5px",
              fontWeight: 750,
              fontFamily: "inherit",
              cursor: "pointer",
              border: viewMode === "3d-bottleneck" ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
              background: viewMode === "3d-bottleneck" ? "#dfff00" : "rgba(255, 255, 255, 0.04)",
              color: viewMode === "3d-bottleneck" ? "#080C09" : "rgba(255, 255, 255, 0.7)",
              transition: "all 0.2s ease",
              boxShadow: viewMode === "3d-bottleneck" ? "0 0 16px rgba(215, 255, 47, 0.35)" : "none",
            }}
          >
            <Sparkles size={12} color={viewMode === "3d-bottleneck" ? "#080C09" : "#dfff00"} />
            <span>Kinetic Intro</span>
          </button>

          {/* Tertiary: Flat Coded Workspace */}
          <button
            type="button"
            onClick={() => setViewMode("coded-preview")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 12px",
              borderRadius: "999px",
              fontSize: "11.5px",
              fontWeight: 750,
              fontFamily: "inherit",
              cursor: "pointer",
              border: viewMode === "coded-preview" ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
              background: viewMode === "coded-preview" ? "#dfff00" : "rgba(255, 255, 255, 0.04)",
              color: viewMode === "coded-preview" ? "#080C09" : "rgba(255, 255, 255, 0.7)",
              transition: "all 0.2s ease",
              boxShadow: viewMode === "coded-preview" ? "0 0 16px rgba(215, 255, 47, 0.35)" : "none",
            }}
          >
            <LayoutDashboard size={12} color={viewMode === "coded-preview" ? "#080C09" : "rgba(255, 255, 255, 0.6)"} />
            <span>Flat Workspace</span>
          </button>
        </div>

        {/* Right Action: Replay */}
        <button
          type="button"
          onClick={() => setReplayKey((k) => k + 1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "rgba(255, 255, 255, 0.75)",
            padding: "4px 8px",
            borderRadius: "7px",
            fontSize: "10.5px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Restart Scene"
        >
          <RotateCcw size={11} />
          <span>Restart</span>
        </button>
      </div>

      {/* Main Stage */}
      <div className="gx-hero-demo-stage-container" style={{ position: "relative", minHeight: "560px" }}>
        {viewMode === "3d-motion-graphics" && (
          <GigxomiMotionGraphicsWorkspace key={`mg-${replayKey}`} />
        )}
        {viewMode === "3d-bottleneck" && (
          <Scene1BottleneckVisual key={`bn-${replayKey}`} mode="hero" />
        )}
        {viewMode === "coded-preview" && (
          <div className="gx-home-hero-demo" style={{ minHeight: "560px", margin: 0 }}>
            <GigxomiDemoPreview screen="manager" />
          </div>
        )}
      </div>
    </div>
  );
}
