"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Instagram,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Video,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
  Users,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Download,
} from "lucide-react";

interface BeatConfig {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  zoom: number;
  panX: number; // percentage offset
  panY: number;
  rotX: number; // degrees
  rotY: number; // degrees
  badge: string;
  stageView: "inbox" | "manager" | "roster" | "twolane" | "kanban" | "overview";
  activeNav: "inbox" | "roster" | "twolane" | "kanban";
}

const BEATS: BeatConfig[] = [
  {
    id: "inbound",
    name: "01 Inbound",
    startFrame: 0,
    endFrame: 600,
    zoom: 1.45,
    panX: 6,
    panY: -1,
    rotX: 5,
    rotY: -2,
    badge: "01 CLIENT INTAKE · WHATSAPP & INSTAGRAM CHANNELS",
    stageView: "inbox",
    activeNav: "inbox",
  },
  {
    id: "manager",
    name: "02 Manager",
    startFrame: 600,
    endFrame: 1200,
    zoom: 1.48,
    panX: -8,
    panY: -3,
    rotX: 5,
    rotY: 2,
    badge: "02 MANAGER QUALIFICATION · ₹18,000 DEAL · 24H SLA",
    stageView: "manager",
    activeNav: "inbox",
  },
  {
    id: "roster",
    name: "03 Editor Roster",
    startFrame: 1200,
    endFrame: 1800,
    zoom: 1.40,
    panX: 2,
    panY: -2,
    rotX: 5,
    rotY: 0,
    badge: "03 EDITOR CAPACITY · SAGAR K. (98% SLA) · DIRECT ASSIGNMENT",
    stageView: "roster",
    activeNav: "roster",
  },
  {
    id: "twolane",
    name: "04 Two-Lane Privacy",
    startFrame: 1800,
    endFrame: 2400,
    zoom: 1.46,
    panX: 6,
    panY: -4,
    rotX: 4,
    rotY: -1,
    badge: "04 TWO-LANE PRIVACY · INTERNAL LANE + MASKED (+91 ***** **842)",
    stageView: "twolane",
    activeNav: "twolane",
  },
  {
    id: "kanban",
    name: "05 Real Kanban",
    startFrame: 2400,
    endFrame: 3000,
    zoom: 1.36,
    panX: 0,
    panY: -1,
    rotX: 5,
    rotY: 1,
    badge: "05 PROJECT TRACKING · REAL 5-STAGE KANBAN BOARD",
    stageView: "kanban",
    activeNav: "kanban",
  },
  {
    id: "overview",
    name: "06 Full Overview",
    startFrame: 3000,
    endFrame: 3600,
    zoom: 1.02,
    panX: 0,
    panY: 0,
    rotX: 13,
    rotY: -8,
    badge: "06 ZERO OWNER BOTTLENECK · CONNECTED OPERATIONS",
    stageView: "overview",
    activeNav: "inbox",
  },
];

const TOTAL_CYCLE_FRAMES = 3600; // 60.0 seconds at 60 FPS (Madison Standard)

export function GigxomiMotionGraphicsWorkspace({ forceFullscreen = false }: { forceFullscreen?: boolean } = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [frame, setFrame] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("start");
      if (s) {
        const val = parseInt(s, 10);
        if (!isNaN(val)) return val;
      }
      const b = params.get("beat");
      if (b) {
        const found = BEATS.find(
          (beat) =>
            beat.id.toLowerCase() === b.toLowerCase() ||
            beat.name.toLowerCase().includes(beat.name.toLowerCase())
        );
        if (found) return found.startFrame + 25;
      }
    }
    return 0;
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("beat") && !params.has("start")) return false;
    }
    return true;
  });
  const [isVideoRecordMode, setIsVideoRecordMode] = useState<boolean>(() => {
    if (forceFullscreen) return true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("record") === "true" || params.get("record") === "1";
    }
    return false;
  });
  const [isCleanOverlay, setIsCleanOverlay] = useState<boolean>(() => {
    if (forceFullscreen) return true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("clean") === "true" || params.get("clean") === "1";
    }
    return false;
  });
  const [mouseTilt, setMouseTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Determine current beat
  const currentBeat =
    BEATS.find((b) => frame >= b.startFrame && frame < b.endFrame) || BEATS[0];

  // Madison Standard Audio & Recording Engine
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [isRecordingWebm, setIsRecordingWebm] = useState<boolean>(false);
  const bgMusicRef = useRef<any>(null);
  const voiceoverRef = useRef<any>(null);
  const activeBeatAudioRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Procedural SFX player
  const playSfx = (type: "whoosh" | "pop" | "toggle" | "chime") => {
    if (!isAudioEnabled || typeof window === "undefined" || typeof Audio === "undefined") return;
    try {
      const audio = new Audio(`/audio/sfx_${type}.wav`);
      audio.volume = type === "whoosh" ? 0.35 : type === "pop" ? 0.4 : type === "toggle" ? 0.5 : 0.45;
      audio.play().catch(() => {});
    } catch {}
  };

  // Synchronized voiceover and SFX triggers
  useEffect(() => {
    if (!isAudioEnabled || !isPlaying) return;

    // Detect beat transition
    const beatIndex = BEATS.findIndex((b) => b.id === currentBeat.id) + 1;
    if (currentBeat.id !== activeBeatAudioRef.current) {
      activeBeatAudioRef.current = currentBeat.id;
      playSfx("whoosh");

      // Stop previous voiceover
      if (voiceoverRef.current) {
        voiceoverRef.current.pause();
      }

      // Play corresponding scene voiceover (e.g. scene1_inbound.mp3)
      const vo = new Audio(`/audio/scene${beatIndex}_${currentBeat.id}.mp3`);
      vo.volume = 1.0;
      voiceoverRef.current = vo;

      // Auto-ducking background music
      if (bgMusicRef.current) {
        bgMusicRef.current.volume = 0.12;
      }
      vo.onended = () => {
        if (bgMusicRef.current) {
          bgMusicRef.current.volume = 0.28;
        }
      };
      vo.play().catch(() => {});
    }

    // Micro-interaction sound cues
    const delta = frame - currentBeat.startFrame;
    if (delta === 60 && currentBeat.id === "inbound") {
      playSfx("pop");
    } else if (delta === 120 && currentBeat.id === "manager") {
      playSfx("chime");
    } else if (delta === 150 && currentBeat.id === "twolane") {
      playSfx("toggle");
    } else if (delta === 180 && currentBeat.id === "kanban") {
      playSfx("chime");
    }
  }, [frame, currentBeat.id, isAudioEnabled, isPlaying]);

  // Ambient soundtrack loop with auto-ducking
  useEffect(() => {
    if (isAudioEnabled && isPlaying) {
      if (!bgMusicRef.current) {
        const bg = new Audio("/audio/ambient_tech_track.wav");
        bg.loop = true;
        bg.volume = 0.25;
        bgMusicRef.current = bg;
      }
      bgMusicRef.current.play().catch(() => {});
    } else {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
      }
      if (voiceoverRef.current) {
        voiceoverRef.current.pause();
      }
    }
  }, [isAudioEnabled, isPlaying]);

  // Screen recorder (MediaRecorder API)
  const handleToggleRecord = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.mediaDevices) return;
    if (isRecordingWebm) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingWebm(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 60, width: 1920, height: 1080 },
          audio: true,
        });
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `gigxomi-explainer-60s-${Date.now()}.webm`;
          a.click();
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecordingWebm(true);
        setFrame(0);
        setIsPlaying(true);
        setIsAudioEnabled(true);
      } catch (err) {
        console.error("Recording error:", err);
      }
    }
  };

  // Global keyboard shortcuts for video capture & demo control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (isCleanOverlay) {
          setIsCleanOverlay(false);
        } else if (isVideoRecordMode) {
          setIsVideoRecordMode(false);
        }
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "c" || e.key === "C") {
        if (isVideoRecordMode) {
          setIsCleanOverlay((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVideoRecordMode, isCleanOverlay]);

  // Client-side URL detection (?start=1800, ?beat=inbound, ?record=true, ?clean=true)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      const startParam = params.get("start");
      if (startParam) {
        const startVal = parseInt(startParam, 10);
        if (!isNaN(startVal)) {
          const targetBeat = BEATS.find((b) => startVal >= b.startFrame && startVal < b.endFrame) || BEATS[0];
          startTimestampRef.current = performance.now() - (startVal / 60) * 1000;
          setFrame(startVal);
          cameraState.current.zoom = targetBeat.zoom;
          cameraState.current.panX = targetBeat.panX;
          cameraState.current.panY = targetBeat.panY;
          cameraState.current.rotX = targetBeat.rotX;
          cameraState.current.rotY = targetBeat.rotY;
          setIsPlaying(true);
        }
      }

      const beatParam = params.get("beat");
      if (beatParam && !startParam) {
        const found = BEATS.find(
          (b) =>
            b.id.toLowerCase() === beatParam.toLowerCase() ||
            b.name.toLowerCase().includes(beatParam.toLowerCase())
        );
        if (found) {
          setIsPlaying(false);
          setFrame(found.startFrame + 25);
          cameraState.current.zoom = found.zoom;
          cameraState.current.panX = found.panX;
          cameraState.current.panY = found.panY;
          cameraState.current.rotX = found.rotX;
          cameraState.current.rotY = found.rotY;
        }
      }
      const recordParam = params.get("record");
      if (recordParam === "true" || recordParam === "1") {
        setIsVideoRecordMode(true);
      }
      const cleanParam = params.get("clean");
      if (cleanParam === "true" || cleanParam === "1") {
        setIsCleanOverlay(true);
      }
    }
  }, []);

  // Camera smooth physics state initialized to target beat
  const cameraState = useRef({
    zoom: currentBeat.zoom,
    panX: currentBeat.panX,
    panY: currentBeat.panY,
    rotX: currentBeat.rotX,
    rotY: currentBeat.rotY,
  });

  // 60 FPS continuous animation loop with delta timing
  const startTimestampRef = useRef<number>(
    typeof performance !== "undefined"
      ? performance.now() - (frame / 60) * 1000
      : 0
  );

  // Expose global window reset for deterministic recording & testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__resetMotionTimeline = () => {
        startTimestampRef.current = performance.now();
        setFrame(0);
        setIsPlaying(true);
      };
      (window as any).__startAtFrame = (startFrame: number) => {
        const targetBeat = BEATS.find((b) => startFrame >= b.startFrame && startFrame < b.endFrame) || BEATS[0];
        cameraState.current.zoom = targetBeat.zoom;
        cameraState.current.panX = targetBeat.panX;
        cameraState.current.panY = targetBeat.panY;
        cameraState.current.rotX = targetBeat.rotX;
        cameraState.current.rotY = targetBeat.rotY;
        startTimestampRef.current = performance.now() - (startFrame / 60) * 1000;
        setFrame(startFrame);
        setIsPlaying(true);
      };
      (window as any).__setExplicitFrame = (targetFrame: number) => {
        setIsPlaying(false);
        setFrame(targetFrame);
      };
    }
  }, []);

  // Wall-clock locked 60 FPS animation loop (zero frame drift, exact second sync)
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;

    const loop = (time: number) => {
      const elapsedMs = time - startTimestampRef.current;
      const currentCalculatedFrame = Math.floor((elapsedMs / 1000) * 60) % TOTAL_CYCLE_FRAMES;
      setFrame(currentCalculatedFrame);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Camera spring interpolation
  const targetZoom = currentBeat.zoom;
  const targetPanX = currentBeat.panX;
  const targetPanY = currentBeat.panY;
  const targetRotX = currentBeat.rotX;
  const targetRotY = currentBeat.rotY;

  if (isPlaying) {
    cameraState.current.zoom += (targetZoom - cameraState.current.zoom) * 0.08;
    cameraState.current.panX += (targetPanX - cameraState.current.panX) * 0.08;
    cameraState.current.panY += (targetPanY - cameraState.current.panY) * 0.08;
    cameraState.current.rotX += (targetRotX - cameraState.current.rotX) * 0.08;
    cameraState.current.rotY += (targetRotY - cameraState.current.rotY) * 0.08;
  } else {
    // Immediate snap when paused / selecting beat
    cameraState.current.zoom = targetZoom;
    cameraState.current.panX = targetPanX;
    cameraState.current.panY = targetPanY;
    cameraState.current.rotX = targetRotX;
    cameraState.current.rotY = targetRotY;
  }

  // Jump to specific beat
  const handleBeatJump = (beat: BeatConfig) => {
    setIsPlaying(false);
    setFrame(beat.startFrame + 25);
    cameraState.current.zoom = beat.zoom;
    cameraState.current.panX = beat.panX;
    cameraState.current.panY = beat.panY;
    cameraState.current.rotX = beat.rotX;
    cameraState.current.rotY = beat.rotY;
  };

  // Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseTilt({ x: nx * 4, y: ny * -3 });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  // Timecode calculation
  const seconds = Math.floor(frame / 60);
  const millis = Math.floor(((frame % 60) / 60) * 100);
  const timecode = `${String(seconds).padStart(2, "0")}:${String(millis).padStart(2, "0")}`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`gx-motion-graphics-workspace-root ${isVideoRecordMode ? "is-record-mode" : ""}`}
      style={{
        position: isVideoRecordMode ? "fixed" : "relative",
        inset: isVideoRecordMode ? 0 : "auto",
        zIndex: isVideoRecordMode ? 99999 : 1,
        width: "100%",
        height: isVideoRecordMode ? "100vh" : "550px",
        minHeight: isVideoRecordMode ? "100vh" : "550px",
        backgroundColor: "#06080B",
        borderRadius: isVideoRecordMode ? "0px" : "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        perspective: "1400px",
        border: isVideoRecordMode ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: isVideoRecordMode ? "none" : "0 30px 90px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        userSelect: "none",
      }}
    >

      {/* Global Embedded Keyframes for Motion UI */}
      <style>{`
        @keyframes flowDash {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.85); opacity: 0.7; }
          50% { transform: scale(1.25); opacity: 1; filter: drop-shadow(0 0 6px #25D366); }
        }
        @keyframes radarPing {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .flowing-energy-beam {
          animation: flowDash 1.2s linear infinite;
        }
        [data-nextjs-toast], [data-nextjs-dialog-overlay], #__next-build-watcher, nextjs-portal {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Ambient Lighting & Blueprint Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 30%, rgba(215, 255, 47, 0.08) 0%, transparent 65%), radial-gradient(circle at 85% 15%, rgba(225, 48, 108, 0.06) 0%, transparent 45%), radial-gradient(circle at 15% 75%, rgba(37, 211, 102, 0.06) 0%, transparent 45%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          pointerEvents: "none",
        }}
      />

      {/* Top HUD: Active Beat Sub-kicker & Video Record Switcher */}
      <div
        className="gx-mg-hud-top"
        style={{
          position: "absolute",
          top: "12px",
          left: "14px",
          right: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 50,
          pointerEvents: isCleanOverlay ? "none" : "auto",
          opacity: isCleanOverlay ? 0 : 1,
          transition: "opacity 0.25s ease",
        }}
      >
        {/* Left: Dynamic Live Action Sub-kicker */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(11, 15, 12, 0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "999px",
            padding: "5px 13px",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: isPlaying ? "#dfff00" : "#f59e0b",
              boxShadow: isPlaying ? "0 0 8px #dfff00" : "none",
            }}
          />
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.04em" }}>
            {currentBeat.badge}
          </span>
        </div>

        {/* Right: Record Mode & Fullscreen Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Sound ON/OFF Toggle */}
          <button
            type="button"
            onClick={() => setIsAudioEnabled((prev) => !prev)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 11px",
              borderRadius: "999px",
              background: isAudioEnabled ? "rgba(215, 255, 47, 0.18)" : "rgba(255, 255, 255, 0.08)",
              border: isAudioEnabled ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.15)",
              color: isAudioEnabled ? "#dfff00" : "rgba(255, 255, 255, 0.7)",
              fontSize: "10.5px",
              fontWeight: 750,
              cursor: "pointer",
              boxShadow: isAudioEnabled ? "0 0 14px rgba(215, 255, 47, 0.35)" : "none",
              transition: "all 0.2s ease",
            }}
            title={isAudioEnabled ? "Mute Studio Voiceover & SFX" : "Enable Studio Voiceover, SFX & Soundtrack"}
          >
            {isAudioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span>{isAudioEnabled ? "Sound ON (Voice + SFX)" : "Sound OFF"}</span>
            {isAudioEnabled && (
              <span style={{ display: "inline-flex", gap: "1.5px", alignItems: "flex-end", height: "9px" }}>
                <span style={{ width: "2px", height: "9px", background: "#dfff00", borderRadius: "1px" }} />
                <span style={{ width: "2px", height: "5px", background: "#dfff00", borderRadius: "1px" }} />
                <span style={{ width: "2px", height: "7px", background: "#dfff00", borderRadius: "1px" }} />
              </span>
            )}
          </button>

          {/* Export / Record Video Button */}
          <button
            type="button"
            onClick={handleToggleRecord}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 11px",
              borderRadius: "999px",
              background: isRecordingWebm ? "rgba(239, 68, 68, 0.25)" : "rgba(56, 189, 248, 0.15)",
              border: isRecordingWebm ? "1px solid #ef4444" : "1px solid rgba(56, 189, 248, 0.35)",
              color: isRecordingWebm ? "#ef4444" : "#38bdf8",
              fontSize: "10.5px",
              fontWeight: 750,
              cursor: "pointer",
              boxShadow: isRecordingWebm ? "0 0 14px rgba(239, 68, 68, 0.5)" : "none",
              transition: "all 0.2s ease",
            }}
            title="Record broadcast 1080p 60fps video with full audio"
          >
            <Download size={12} />
            <span>{isRecordingWebm ? "Recording..." : "Export Video"}</span>
          </button>

          {isVideoRecordMode && (
            <button
              type="button"
              onClick={() => setIsCleanOverlay(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(14px)",
                padding: "4px 11px",
                borderRadius: "999px",
                fontSize: "10.5px",
                fontWeight: 750,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Hide all UI overlays for pure video recording (Press 'C')"
            >
              <span>Clean Shot (C)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isVideoRecordMode) {
                setIsVideoRecordMode(false);
                setIsCleanOverlay(false);
              } else {
                setIsVideoRecordMode(true);
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: isVideoRecordMode ? "#f43f5e" : "rgba(11, 15, 12, 0.85)",
              color: isVideoRecordMode ? "#FFFFFF" : "rgba(255, 255, 255, 0.8)",
              border: isVideoRecordMode ? "1px solid #f43f5e" : "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(14px)",
              padding: "4px 11px",
              borderRadius: "999px",
              fontSize: "10.5px",
              fontWeight: 750,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={isVideoRecordMode ? "Exit Video Record Mode (Esc)" : "Clean Fullscreen for Screen Recording"}
          >
            <Video size={12} />
            <span>{isVideoRecordMode ? "Exit Record (Esc)" : "Video Record Mode"}</span>
          </button>
        </div>
      </div>

      {/* Clean shot indicator hidden to guarantee pristine broadcast recordings */}

      {/* ========================================================
          THE DYNAMIC 3D CAMERA RIG
          Controls scale, panX, panY, rotateX, rotateY
          ======================================================== */}
      <div
        className="gx-mg-camera-rig"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transformOrigin: "50% 50%",
          transform: `scale(${cameraState.current.zoom}) translate(${cameraState.current.panX}%, ${cameraState.current.panY}%) rotateX(${cameraState.current.rotX + mouseTilt.y}deg) rotateY(${cameraState.current.rotY + mouseTilt.x}deg)`,
          transformStyle: "preserve-3d",
          transition: isPlaying ? "transform 0.08s ease-out" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {/* ========================================================
            THE FULL GIGXOMI WORKSPACE CANVAS (FROSTED GLASS SHELL)
            ======================================================== */}
        <div
          className="gx-mg-workspace-canvas"
          style={{
            position: "absolute",
            width: "860px",
            height: "460px",
            background: "rgba(13, 17, 21, 0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "18px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow:
              "0 40px 100px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06), 0 0 50px rgba(215, 255, 47, 0.1)",
            display: "flex",
            overflow: "hidden",
            zIndex: 10,
          }}
        >
          {/* 1. SIDEBAR NAVIGATION */}
          <div
            style={{
              width: "205px",
              background: "#080B0E",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "16px 13px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              flexShrink: 0,
            }}
          >
            {/* Brand Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: "#dfff00",
                  color: "#080C09",
                  fontWeight: 900,
                  fontSize: "13px",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 10px rgba(215, 255, 47, 0.45)",
                }}
              >
                G
              </div>
              <div style={{ display: "grid" }}>
                <strong style={{ fontSize: "12.5px", color: "#FFFFFF", letterSpacing: "-0.02em" }}>Gigxomi Studio</strong>
                <small style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.45)" }}>Agency Operations</small>
              </div>
            </div>

            {/* Nav Tabs */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {/* Chat Inbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 9px",
                  borderRadius: "7px",
                  background: currentBeat.activeNav === "inbox" ? "rgba(215, 255, 47, 0.18)" : "transparent",
                  border: currentBeat.activeNav === "inbox" ? "1px solid rgba(215, 255, 47, 0.35)" : "1px solid transparent",
                  color: currentBeat.activeNav === "inbox" ? "#dfff00" : "rgba(255, 255, 255, 0.6)",
                  fontSize: "10px",
                  fontWeight: 750,
                  boxShadow: currentBeat.activeNav === "inbox" ? "0 0 12px rgba(215, 255, 47, 0.2)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#25D366", boxShadow: "0 0 6px #25D366" }} />
                <span>Chat Inbox</span>
                <small style={{ marginLeft: "auto", background: "#dfff00", color: "#080C09", padding: "1px 5px", borderRadius: "999px", fontSize: "8px", fontWeight: 800 }}>
                  2 New
                </small>
              </div>

              {/* Find Editors */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 9px",
                  borderRadius: "7px",
                  background: currentBeat.activeNav === "roster" ? "rgba(215, 255, 47, 0.18)" : "transparent",
                  border: currentBeat.activeNav === "roster" ? "1px solid rgba(215, 255, 47, 0.35)" : "1px solid transparent",
                  color: currentBeat.activeNav === "roster" ? "#dfff00" : "rgba(255, 255, 255, 0.6)",
                  fontSize: "10px",
                  fontWeight: 750,
                  boxShadow: currentBeat.activeNav === "roster" ? "0 0 12px rgba(215, 255, 47, 0.2)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <Users size={12} />
                <span>Find Editors</span>
                {currentBeat.activeNav === "roster" && (
                  <small style={{ marginLeft: "auto", background: "#58a6ff", color: "#000", padding: "1px 5px", borderRadius: "999px", fontSize: "7.5px", fontWeight: 800 }}>
                    Match
                  </small>
                )}
              </div>

              {/* Two-Lane Engine */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 9px",
                  borderRadius: "7px",
                  background: currentBeat.activeNav === "twolane" ? "rgba(245, 158, 11, 0.22)" : "transparent",
                  border: currentBeat.activeNav === "twolane" ? "1px solid #f59e0b" : "1px solid transparent",
                  color: currentBeat.activeNav === "twolane" ? "#f59e0b" : "rgba(255, 255, 255, 0.6)",
                  fontSize: "10px",
                  fontWeight: 750,
                  boxShadow: currentBeat.activeNav === "twolane" ? "0 0 12px rgba(245, 158, 11, 0.3)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <Layers size={12} />
                <span>Two-Lane Chat</span>
                {currentBeat.activeNav === "twolane" && (
                  <small style={{ marginLeft: "auto", background: "#f59e0b", color: "#000", padding: "1px 5px", borderRadius: "999px", fontSize: "7.5px", fontWeight: 800 }}>
                    Locked
                  </small>
                )}
              </div>

              {/* Project Tracking */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 9px",
                  borderRadius: "7px",
                  background: currentBeat.activeNav === "kanban" ? "rgba(215, 255, 47, 0.18)" : "transparent",
                  border: currentBeat.activeNav === "kanban" ? "1px solid rgba(215, 255, 47, 0.35)" : "1px solid transparent",
                  color: currentBeat.activeNav === "kanban" ? "#dfff00" : "rgba(255, 255, 255, 0.6)",
                  fontSize: "10px",
                  fontWeight: 750,
                  boxShadow: currentBeat.activeNav === "kanban" ? "0 0 12px rgba(215, 255, 47, 0.2)" : "none",
                  transition: "all 0.25s ease",
                }}
              >
                <Clock size={12} />
                <span>Project Tracking</span>
                {currentBeat.activeNav === "kanban" && (
                  <small style={{ marginLeft: "auto", background: "#dfff00", color: "#000", padding: "1px 5px", borderRadius: "999px", fontSize: "7.5px", fontWeight: 800 }}>
                    Kanban
                  </small>
                )}
              </div>
            </div>

            {/* Bottom Anti-Poaching Shield Callout */}
            <div
              style={{
                marginTop: "auto",
                padding: "9px",
                borderRadius: "9px",
                background: currentBeat.stageView === "twolane" ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.08)",
                border: currentBeat.stageView === "twolane" ? "1.5px solid #f59e0b" : "1px solid rgba(245, 158, 11, 0.25)",
                boxShadow: currentBeat.stageView === "twolane" ? "0 0 25px rgba(245, 158, 11, 0.45)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                transition: "all 0.3s ease",
              }}
            >
              <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={12} /> Anti-Poaching Active
              </span>
              <div style={{ fontSize: "8.5px", color: "#FFFFFF", fontWeight: 700 }}>
                Client: +91 ***** **842
              </div>
              <small style={{ fontSize: "7px", color: "rgba(255, 255, 255, 0.55)" }}>
                Direct contact encrypted
              </small>
            </div>
          </div>

          {/* 2. MAIN WORKSPACE CANVAS */}
          <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
            {/* Topbar inside workspace */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", color: "#FFFFFF", fontWeight: 750, letterSpacing: "-0.02em" }}>
                  Agency Operations Control
                </h3>
                <small style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "9px" }}>
                  WhatsApp & Instagram connected · Real 5-Stage Kanban · Zero founder bottleneck
                </small>
              </div>

              {/* Connected Integrations Pills */}
              <div style={{ display: "flex", gap: "6px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(37, 211, 102, 0.15)",
                    color: "#25D366",
                    border: "1px solid rgba(37, 211, 102, 0.35)",
                    fontSize: "9px",
                    fontWeight: 750,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 0 10px rgba(37, 211, 102, 0.2)",
                  }}
                >
                  <MessageCircle size={10} /> WhatsApp Live
                </span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(225, 48, 108, 0.15)",
                    color: "#E1306C",
                    border: "1px solid rgba(225, 48, 108, 0.35)",
                    fontSize: "9px",
                    fontWeight: 750,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 0 10px rgba(225, 48, 108, 0.2)",
                  }}
                >
                  <Instagram size={10} /> Instagram DM
                </span>
              </div>
            </div>

            {/* DYNAMIC VIEW ROUTER BASED ON STAGEVIEW */}

            {/* ========================================================
                VIEW A: SCENE 1 & 2 (CHAT INBOX & MANAGER QUALIFICATION)
                ======================================================== */}
            {(currentBeat.stageView === "inbox" || currentBeat.stageView === "manager") && (
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
                {/* Flowing SVG Energy Beam in Beat 1 (WhatsApp & Instagram dual intake) */}
                {currentBeat.id === "inbound" && (
                  <svg
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      pointerEvents: "none",
                      zIndex: 30,
                      overflow: "visible",
                    }}
                  >
                    <defs>
                      <linearGradient id="beamGradWhatsApp" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#25D366" stopOpacity="0.9" />
                        <stop offset="60%" stopColor="#dfff00" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#25D366" stopOpacity="0.9" />
                      </linearGradient>
                      <linearGradient id="beamGradInsta" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#E1306C" stopOpacity="0.8" />
                        <stop offset="60%" stopColor="#dfff00" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#25D366" stopOpacity="0.4" />
                      </linearGradient>
                      <filter id="beamBlur" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    {/* Primary WhatsApp Energy Beam */}
                    <path
                      d="M 485 -10 C 370 -10, 240 -8, 180 8"
                      fill="none"
                      stroke="url(#beamGradWhatsApp)"
                      strokeWidth="2.2"
                      strokeDasharray="6 4"
                      filter="url(#beamBlur)"
                      className="flowing-energy-beam"
                    />
                    {/* Secondary Instagram Energy Beam */}
                    <path
                      d="M 570 -10 C 420 -6, 280 -2, 195 8"
                      fill="none"
                      stroke="url(#beamGradInsta)"
                      strokeWidth="1.6"
                      strokeDasharray="4 4"
                      opacity="0.6"
                      filter="url(#beamBlur)"
                      className="flowing-energy-beam"
                    />
                    {/* Pulsing Nodes */}
                    <circle cx="485" cy="-10" r="3.5" fill="#25D366" filter="url(#beamBlur)" />
                    <circle cx="570" cy="-10" r="3" fill="#E1306C" filter="url(#beamBlur)" />
                    <circle cx="180" cy="8" r="3.5" fill="#dfff00" filter="url(#beamBlur)" />
                  </svg>
                )}

                {/* Left Column: Live Chat Conversation & Triage */}
                <div
                  style={{
                    background: "#0A0E12",
                    borderRadius: "12px",
                    border:
                      currentBeat.id === "inbound"
                        ? "1.5px solid #dfff00"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow:
                      currentBeat.id === "inbound"
                        ? "0 0 35px rgba(215, 255, 47, 0.3)"
                        : "none",
                    padding: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Active Inbound Relay Indicator */}
                  {currentBeat.id === "inbound" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(37, 211, 102, 0.08)",
                        border: "1px dashed rgba(37, 211, 102, 0.4)",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "8px",
                        color: "#25D366",
                        fontWeight: 750,
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#25D366", boxShadow: "0 0 6px #25D366" }} />
                        INBOUND STREAM ACTIVE · WHATSAPP WEBHOOK
                      </span>
                      <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "7.5px" }}>Auto-triaged to Lead Desk</span>
                    </div>
                  )}
                  {/* Thread Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#25D366", color: "#000", fontWeight: 800, fontSize: "9.5px", display: "grid", placeItems: "center" }}>
                        UK
                      </div>
                      <div>
                        <strong style={{ fontSize: "11.5px", color: "#FFFFFF", display: "block" }}>UrbanKicks Retail</strong>
                        <span style={{ fontSize: "8px", color: "#25D366", fontWeight: 600 }}>WhatsApp Direct Lead</span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#080C09",
                        background: "#dfff00",
                        fontWeight: 850,
                        padding: "2px 7px",
                        borderRadius: "5px",
                        boxShadow: "0 0 10px rgba(215, 255, 47, 0.4)",
                      }}
                    >
                      ₹18,000 Deal
                    </span>
                  </div>

                  {/* Client Message */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      borderRadius: "8px",
                      padding: "9px",
                      fontSize: "10px",
                      color: "#D1D5DB",
                      lineHeight: 1.45,
                      borderLeft: "2px solid #25D366",
                    }}
                  >
                    <small style={{ display: "block", color: "rgba(255, 255, 255, 0.5)", fontSize: "7.5px", marginBottom: "2px" }}>
                      Client Inbound · 10:24 AM
                    </small>
                    &ldquo;Hi team! We need three 9:16 vertical reels for Friday launch. High-energy whip pans.&rdquo;
                  </div>

                  {/* Manager Qualification Bubble */}
                  <div
                    style={{
                      background:
                        currentBeat.id === "manager"
                          ? "rgba(215, 255, 47, 0.22)"
                          : "rgba(215, 255, 47, 0.10)",
                      border:
                        currentBeat.id === "manager"
                          ? "1.5px solid #dfff00"
                          : "1px solid rgba(215, 255, 47, 0.25)",
                      boxShadow:
                        currentBeat.id === "manager"
                          ? "0 0 28px rgba(215, 255, 47, 0.35)"
                          : "none",
                      borderRadius: "8px",
                      padding: "9px",
                      fontSize: "10px",
                      color: "#FFFFFF",
                      marginLeft: "auto",
                      maxWidth: "90%",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                      <strong style={{ color: "#dfff00", fontSize: "8px" }}>
                        Manager (Operations):
                      </strong>
                      {currentBeat.id === "manager" && (
                        <span style={{ fontSize: "7.5px", background: "#dfff00", color: "#080C09", fontWeight: 800, padding: "1px 5px", borderRadius: "4px" }}>
                          SLA 24H ACTIVE
                        </span>
                      )}
                    </div>
                    &ldquo;Brief qualified. Deal value: ₹18,000. Directly assigned to Sagar (Lead Editor).&rdquo;
                  </div>

                  {/* Internal Lane Indicator */}
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "6px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: "8px",
                      color: "rgba(255, 255, 255, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Lock size={10} color="#f59e0b" />
                    <span>Two-Lane Active · Sagar cannot see raw client WhatsApp</span>
                  </div>
                </div>

                {/* Right Column: Inbound Channels Proof (Beat 1) or Retained Margin (Beat 2) */}
                <div
                  style={{
                    background: "#0A0E12",
                    borderRadius: "12px",
                    border:
                      currentBeat.id === "manager"
                        ? "1.5px solid #dfff00"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow:
                      currentBeat.id === "manager"
                        ? "0 0 40px rgba(215, 255, 47, 0.35)"
                        : "none",
                    padding: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Margin Hero Block */}
                  <div
                    style={{
                      background: "rgba(215, 255, 47, 0.08)",
                      border: "1px solid rgba(215, 255, 47, 0.25)",
                      borderRadius: "9px",
                      padding: "9px",
                    }}
                  >
                    <small style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.06em" }}>
                      Retained Agency Margin
                    </small>
                    <div style={{ fontSize: "19px", fontWeight: 900, color: "#dfff00", margin: "2px 0", letterSpacing: "-0.02em" }}>
                      ₹12,000 <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600 }}>(66.7%)</span>
                    </div>
                    <span style={{ fontSize: "8px", color: "#25D366", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      ✓ 0% platform commission deducted
                    </span>
                  </div>

                  {/* Breakdown Ledger */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Client Value:</span>
                      <strong style={{ color: "#FFFFFF" }}>₹18,000</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Editor Payout:</span>
                      <strong style={{ color: "#FFFFFF" }}>₹6,000</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "3px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>Gigxomi Fee:</span>
                      <strong style={{ color: "#25D366" }}>₹0 (0%)</strong>
                    </div>
                  </div>

                  {/* Status Stamp */}
                  <div
                    style={{
                      marginTop: "auto",
                      background: "rgba(37, 211, 102, 0.12)",
                      border: "1px solid rgba(37, 211, 102, 0.3)",
                      borderRadius: "7px",
                      padding: "6px",
                      textAlign: "center",
                      fontSize: "9px",
                      fontWeight: 750,
                      color: "#25D366",
                    }}
                  >
                    ✓ Delivery Verified & Paid
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW B: SCENE 3 (FIND EDITORS & CAPACITY ROSTER)
                ======================================================== */}
            {currentBeat.stageView === "roster" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0 }}>
                {/* Header Filter Strip */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 750, color: "#FFFFFF" }}>Find Editors Directory</span>
                    <span style={{ fontSize: "8.5px", background: "rgba(215, 255, 47, 0.15)", color: "#dfff00", padding: "1px 6px", borderRadius: "999px", fontWeight: 700 }}>
                      2 Verified Available
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ fontSize: "8px", background: "#dfff00", color: "#080C09", fontWeight: 800, padding: "2px 7px", borderRadius: "4px" }}>All Skills</span>
                    <span style={{ fontSize: "8px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600, padding: "2px 7px", borderRadius: "4px" }}>Premiere Pro</span>
                    <span style={{ fontSize: "8px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.7)", fontWeight: 600, padding: "2px 7px", borderRadius: "4px" }}>DaVinci</span>
                  </div>
                </div>

                {/* Editor Cards Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 }}>
                  {/* Editor 1: Sagar K. (Directly Assigned) */}
                  <div
                    style={{
                      background: "#0A0E12",
                      borderRadius: "11px",
                      border: "1.5px solid #dfff00",
                      boxShadow: "0 0 35px rgba(215, 255, 47, 0.35)",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#dfff00", color: "#080C09", fontWeight: 900, fontSize: "11px", display: "grid", placeItems: "center" }}>
                          SK
                        </div>
                        <div>
                          <strong style={{ fontSize: "11.5px", color: "#FFFFFF", display: "block" }}>Sagar K.</strong>
                          <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.55)" }}>Lead Video Editor · Pacing & Whip Pans</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "8px", background: "rgba(37, 211, 102, 0.15)", color: "#25D366", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>
                        98% SLA
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "7.5px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.8)", padding: "1px 5px", borderRadius: "4px" }}>Premiere Pro</span>
                      <span style={{ fontSize: "7.5px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.8)", padding: "1px 5px", borderRadius: "4px" }}>DaVinci Resolve</span>
                      <span style={{ fontSize: "7.5px", background: "rgba(215, 255, 47, 0.15)", color: "#dfff00", padding: "1px 5px", borderRadius: "4px" }}>Fast Turnaround</span>
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        background: "rgba(215, 255, 47, 0.15)",
                        border: "1px solid rgba(215, 255, 47, 0.4)",
                        borderRadius: "7px",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "5px",
                        color: "#dfff00",
                        fontSize: "9px",
                        fontWeight: 800,
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>Direct Assignment Active (UrbanKicks Brief)</span>
                    </div>
                  </div>

                  {/* Editor 2: Rohan M. (Roster Standby) */}
                  <div
                    style={{
                      background: "#0A0E12",
                      borderRadius: "11px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      opacity: 0.8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#58a6ff", color: "#000", fontWeight: 900, fontSize: "11px", display: "grid", placeItems: "center" }}>
                          RM
                        </div>
                        <div>
                          <strong style={{ fontSize: "11.5px", color: "#FFFFFF", display: "block" }}>Rohan M.</strong>
                          <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.55)" }}>Motion Graphics & 3D Specialist</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "8px", background: "rgba(255, 255, 255, 0.08)", color: "rgba(255, 255, 255, 0.7)", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                        95% Rating
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "7.5px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.8)", padding: "1px 5px", borderRadius: "4px" }}>After Effects</span>
                      <span style={{ fontSize: "7.5px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.8)", padding: "1px 5px", borderRadius: "4px" }}>3D Kinetic Titles</span>
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "7px",
                        padding: "6px",
                        textAlign: "center",
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "8.5px",
                        fontWeight: 700,
                      }}
                    >
                      Available for Overflow Capacity
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW C: SCENE 4 (TWO-LANE ENGINE & MASKED PRIVACY)
                ======================================================== */}
            {currentBeat.stageView === "twolane" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px", flex: 1, minHeight: 0 }}>
                {/* Left Column: Internal Lane Backchannel */}
                <div
                  style={{
                    background: "#0A0E12",
                    borderRadius: "12px",
                    border: "1.5px solid #f59e0b",
                    boxShadow: "0 0 35px rgba(245, 158, 11, 0.35)",
                    padding: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Two Lane Selector Header */}
                  <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px" }}>
                    <span style={{ fontSize: "8.5px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.6)", padding: "2px 7px", borderRadius: "4px", fontWeight: 700 }}>
                      Customer Lane (Masked)
                    </span>
                    <span style={{ fontSize: "8.5px", background: "#f59e0b", color: "#000", padding: "2px 7px", borderRadius: "4px", fontWeight: 800 }}>
                      Internal Lane (Active)
                    </span>
                  </div>

                  {/* Internal Backchannel Messages */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "8px", borderRadius: "7px", fontSize: "9.5px", color: "#D1D5DB" }}>
                      <strong style={{ color: "#58a6ff", display: "block", fontSize: "8px", marginBottom: "2px" }}>
                        Sagar (Lead Editor):
                      </strong>
                      &ldquo;Hey team! Did the client provide the color LUT and raw audio stems?&rdquo;
                    </div>

                    <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "8px", borderRadius: "7px", fontSize: "9.5px", color: "#FFFFFF", marginLeft: "auto", maxWidth: "88%" }}>
                      <strong style={{ color: "#f59e0b", display: "block", fontSize: "8px", marginBottom: "2px" }}>
                        Manager (Operations):
                      </strong>
                      &ldquo;Yes Sagar, synced into Project Drive. Allow Editor Reply is now turned ON.&rdquo;
                    </div>
                  </div>

                  {/* Bottom Guarantee */}
                  <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "8px", color: "rgba(255, 255, 255, 0.7)" }}>
                    <ShieldCheck size={12} color="#f59e0b" />
                    <span>Client Number Encrypted (+91 ***** **842) · Zero Poaching Risk</span>
                  </div>
                </div>

                {/* Right Column: Permission Gate Switch */}
                <div
                  style={{
                    background: "#0A0E12",
                    borderRadius: "12px",
                    border: "1.5px solid #25D366",
                    boxShadow: "0 0 35px rgba(37, 211, 102, 0.3)",
                    padding: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "9px",
                  }}
                >
                  <small style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.06em" }}>
                    Agency Permission Gate
                  </small>

                  <div style={{ background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.3)", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "11px", color: "#FFFFFF" }}>Allow Editor Reply</strong>
                      <span style={{ fontSize: "8.5px", background: "#25D366", color: "#000", padding: "2px 6px", borderRadius: "999px", fontWeight: 900 }}>
                        ON ✓
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "8px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.4 }}>
                      Sagar can now message UrbanKicks Retail directly through the agency relay.
                    </p>
                  </div>

                  <div style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.55)", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>✓ Client sees: Agency WhatsApp brand</div>
                    <div>✓ Editor sees: Encrypted contact token</div>
                    <div>✓ Manager retains: Full chat audit log</div>
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      background: "rgba(215, 255, 47, 0.12)",
                      border: "1px solid rgba(215, 255, 47, 0.3)",
                      borderRadius: "7px",
                      padding: "6px",
                      textAlign: "center",
                      fontSize: "8.5px",
                      fontWeight: 800,
                      color: "#dfff00",
                    }}
                  >
                    Protected Direct Communication Active
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW D: SCENE 5 (REAL 5-STAGE PROJECT TRACKING KANBAN)
                ======================================================== */}
            {currentBeat.stageView === "kanban" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minHeight: 0 }}>
                {/* Kanban Top Action Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 750, color: "#FFFFFF" }}>Project Tracking Kanban</span>
                    <span style={{ fontSize: "8px", background: "rgba(215, 255, 47, 0.15)", color: "#dfff00", padding: "1px 6px", borderRadius: "999px", fontWeight: 800 }}>
                      Live Production Board
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ fontSize: "8px", background: "#dfff00", color: "#080C09", fontWeight: 800, padding: "2px 7px", borderRadius: "4px" }}>Kanban View</span>
                    <span style={{ fontSize: "8px", background: "rgba(255, 255, 255, 0.06)", color: "rgba(255, 255, 255, 0.6)", fontWeight: 600, padding: "2px 7px", borderRadius: "4px" }}>Table View</span>
                  </div>
                </div>

                {/* 5 Real Verified Kanban Columns */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", flex: 1, minHeight: 0 }}>
                  {[
                    { id: "new", name: "New", count: 0 },
                    { id: "assigned", name: "Assigned", count: 0 },
                    { id: "waiting", name: "Waiting", count: 1, isTarget: true },
                    { id: "quote", name: "Quote Sent", count: 1 },
                    { id: "payment", name: "Payment Pending", count: 0 },
                  ].map((col) => {
                    const isWaiting = col.id === "waiting";
                    const isQuote = col.id === "quote";

                    return (
                      <div
                        key={col.id}
                        style={{
                          background: "#090D11",
                          borderRadius: "8px",
                          border: isWaiting ? "1px solid rgba(215, 255, 47, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                          padding: "7px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                          boxShadow: isWaiting ? "0 0 20px rgba(215, 255, 47, 0.15)" : "none",
                        }}
                      >
                        {/* Column Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "4px" }}>
                          <span style={{ fontSize: "8.5px", fontWeight: 750, color: isWaiting ? "#dfff00" : "rgba(255, 255, 255, 0.7)" }}>
                            {col.name}
                          </span>
                          <span style={{ fontSize: "7.5px", background: isWaiting ? "#dfff00" : "rgba(255, 255, 255, 0.08)", color: isWaiting ? "#000" : "rgba(255, 255, 255, 0.6)", padding: "0 4px", borderRadius: "999px", fontWeight: 800 }}>
                            {col.count}
                          </span>
                        </div>

                        {/* Card inside Waiting */}
                        {isWaiting && (
                          <div
                            style={{
                              background: "#0E141B",
                              borderRadius: "7px",
                              border: "1.5px solid #dfff00",
                              boxShadow: "0 0 25px rgba(215, 255, 47, 0.35)",
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "5px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "7px", background: "#25D366", color: "#000", padding: "1px 4px", borderRadius: "3px", fontWeight: 800 }}>
                                WA
                              </span>
                              <span style={{ fontSize: "8.5px", color: "#dfff00", fontWeight: 850 }}>
                                ₹18,000
                              </span>
                            </div>
                            <strong style={{ fontSize: "9.5px", color: "#FFFFFF", lineHeight: 1.2 }}>UrbanKicks Retail</strong>
                            <p style={{ margin: 0, fontSize: "7.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                              3x 9:16 Vertical Reels · Revision 1
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "7px", color: "rgba(255, 255, 255, 0.6)" }}>
                              <span style={{ color: "#dfff00", fontWeight: 700 }}>SK · Sagar K.</span>
                              <span>Due Fri</span>
                            </div>
                          </div>
                        )}

                        {/* Card inside Quote Sent */}
                        {isQuote && (
                          <div
                            style={{
                              background: "#0E141B",
                              borderRadius: "7px",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "5px",
                              opacity: 0.85,
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "7px", background: "#E1306C", color: "#FFF", padding: "1px 4px", borderRadius: "3px", fontWeight: 800 }}>
                                IG
                              </span>
                              <span style={{ fontSize: "8.5px", color: "#FFFFFF", fontWeight: 800 }}>
                                ₹24,000
                              </span>
                            </div>
                            <strong style={{ fontSize: "9.5px", color: "#FFFFFF", lineHeight: 1.2 }}>Apex Fitness</strong>
                            <p style={{ margin: 0, fontSize: "7.5px", color: "rgba(255, 255, 255, 0.6)" }}>
                              Promo Series (6 Reels)
                            </p>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", borderTop: "1px solid rgba(255, 255, 255, 0.06)", fontSize: "7px", color: "rgba(255, 255, 255, 0.6)" }}>
                              <span>RM · Rohan</span>
                              <span>Quote Sent</span>
                            </div>
                          </div>
                        )}

                        {!isWaiting && !isQuote && (
                          <div style={{ padding: "8px 0", textAlign: "center", fontSize: "7.5px", color: "rgba(255, 255, 255, 0.25)" }}>
                            No items
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
                VIEW E: SCENE 6 (CONNECTED STUDIO FINALE & OUTRO CTA)
                ======================================================== */}
            {currentBeat.stageView === "overview" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "14px",
                  flex: 1,
                  minHeight: 0,
                  background: "radial-gradient(circle at 50% 50%, rgba(215, 255, 47, 0.08) 0%, #090D11 75%)",
                  borderRadius: "12px",
                  border: "1.5px solid rgba(215, 255, 47, 0.4)",
                  boxShadow: "0 0 50px rgba(215, 255, 47, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  padding: "20px 24px",
                  textAlign: "center",
                }}
              >
                {/* Brand Badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(215, 255, 47, 0.15)", border: "1px solid rgba(215, 255, 47, 0.4)", padding: "4px 12px", borderRadius: "999px", boxShadow: "0 0 16px rgba(215, 255, 47, 0.25)" }}>
                  <Sparkles size={12} color="#dfff00" />
                  <span style={{ fontSize: "10px", fontWeight: 850, color: "#dfff00", letterSpacing: "0.06em" }}>
                    ZERO OWNER BOTTLENECK · SCALABLE VIDEO OPERATIONS
                  </span>
                </div>

                {/* Main Headline */}
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 850, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.25, maxWidth: "560px" }}>
                  Run Your Video Editing Agency Without Doing Everything Yourself
                </h2>

                {/* 3 Connected Pillars */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", width: "100%", maxWidth: "620px" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(37, 211, 102, 0.3)", borderRadius: "8px", padding: "10px 8px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#25D366", marginBottom: "3px" }}>01. Omnichannel Inbound</div>
                    <div style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.65)" }}>WhatsApp & Instagram relay directly into one clean triage desk.</div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", padding: "10px 8px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#f59e0b", marginBottom: "3px" }}>02. Two-Lane Privacy</div>
                    <div style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.65)" }}>Encrypted client contacts (+91 ***** **842). Zero poaching risk.</div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(215, 255, 47, 0.3)", borderRadius: "8px", padding: "10px 8px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 800, color: "#dfff00", marginBottom: "3px" }}>03. Real 5-Stage Kanban</div>
                    <div style={{ fontSize: "8.5px", color: "rgba(255, 255, 255, 0.65)" }}>Track delivery milestones with 0% platform fee on all deliverables.</div>
                  </div>
                </div>

                {/* Pricing & CTA Lockup */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                  <div style={{ background: "#0B1117", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "999px", padding: "6px 14px", fontSize: "11px", color: "#FFFFFF", fontWeight: 750 }}>
                    ₹2,000 / month <span style={{ color: "rgba(255, 255, 255, 0.5)", fontWeight: 500 }}>(Studio License)</span>
                  </div>
                  <a
                    href="https://gigxomi.com"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#dfff00",
                      color: "#080C09",
                      fontWeight: 850,
                      fontSize: "11.5px",
                      padding: "7px 18px",
                      borderRadius: "999px",
                      boxShadow: "0 0 20px rgba(215, 255, 47, 0.45)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <span>Scale Your Agency at Gigxomi.com</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM TIMELINE HUD (BEAT SELECTOR & SCRUBBER)
          ======================================================== */}
      <div
        className="gx-mg-hud-bottom"
        style={{
          position: "absolute",
          bottom: "10px",
          left: "14px",
          right: "14px",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          pointerEvents: isCleanOverlay ? "none" : "auto",
          opacity: isCleanOverlay ? 0 : 1,
          transition: "opacity 0.25s ease",
        }}
      >
        {/* Beat Selector Chips Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "5px",
            background: "rgba(10, 14, 11, 0.85)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            padding: "4px 8px",
            borderRadius: "10px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Controls: Play/Pause, Replay, Timecode */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                display: "grid",
                placeItems: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "#dfff00",
                color: "#080C09",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 0 10px rgba(215, 255, 47, 0.4)",
              }}
              title={isPlaying ? "Pause" : "Play Continuous Showreel (Space)"}
            >
              {isPlaying ? <Pause size={10} /> : <Play size={10} />}
            </button>

            <button
              type="button"
              onClick={() => {
                setFrame(0);
                setIsPlaying(true);
              }}
              style={{
                display: "grid",
                placeItems: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.08)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
              }}
              title="Replay from Beginning"
            >
              <RotateCcw size={10} />
            </button>

            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", fontFamily: "monospace", marginLeft: "2px" }}>
              {timecode}
            </span>
          </div>

          {/* Beat Jump Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            {BEATS.map((beat) => {
              const isActive = currentBeat.id === beat.id;
              return (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => handleBeatJump(beat)}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "5px",
                    fontSize: "10px",
                    fontWeight: 750,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    border: isActive ? "1px solid #dfff00" : "1px solid rgba(255, 255, 255, 0.08)",
                    background: isActive ? "#dfff00" : "rgba(255, 255, 255, 0.04)",
                    color: isActive ? "#080C09" : "rgba(255, 255, 255, 0.7)",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? "0 0 12px rgba(215, 255, 47, 0.3)" : "none",
                  }}
                >
                  {beat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continuous Scrubber Track */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setFrame(Math.floor(clickPos * TOTAL_CYCLE_FRAMES));
          }}
          style={{
            position: "relative",
            width: "100%",
            height: "3px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "999px",
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${(frame / TOTAL_CYCLE_FRAMES) * 100}%`,
              background: "linear-gradient(90deg, #25D366 0%, #dfff00 50%, #E1306C 100%)",
              boxShadow: "0 0 8px rgba(215, 255, 47, 0.6)",
              transition: "width 0.05s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
