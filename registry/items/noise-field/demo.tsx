// Original — Frictionborn Motion
"use client";

import React, { useState } from "react";
import { NoiseField } from "./noise-field";
import { pauseAll, resumeAll, usePaused, useReducedMotion } from "@frictionborn/runtime";

const PALETTES = [
  {
    name: "Ember Dark",
    colors: ["#0D0F12", "#FB923C", "#2563EB"] as [string, string, string],
  },
  {
    name: "Obsidian Violet",
    colors: ["#0A0B0E", "#8B5CF6", "#EC4899"] as [string, string, string],
  },
  {
    name: "Deep Emerald",
    colors: ["#06110D", "#10B981", "#065F46"] as [string, string, string],
  },
];

export default function NoiseFieldDemo() {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [activeTier, setActiveTier] = useState<number | undefined>(undefined);
  const isPaused = usePaused();
  const systemReduced = useReducedMotion();
  const [manualReduced, setManualReduced] = useState(false);

  const effectiveReduced = systemReduced || manualReduced;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "680px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--line, #262B33)",
        backgroundColor: "var(--bg, #0D0F12)",
        color: "var(--ink, #E9EBF0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Engineering Control Bar */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1rem 1.5rem",
          backgroundColor: "rgba(21, 24, 29, 0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--line, #262B33)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor: isPaused ? "var(--degraded, #FBBF24)" : "var(--pass, #4ADE80)",
              display: "inline-block",
            }}
          />
          <span
            className="mono"
            style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted, #9AA1AF)" }}
          >
            NoiseField · Specimen Preview
          </span>
        </div>

        {/* Live Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
          {/* Palette Selector */}
          <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.4)", padding: "2px", borderRadius: "6px" }}>
            {PALETTES.map((p, idx) => (
              <button
                key={p.name}
                onClick={() => setSelectedPalette(idx)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedPalette === idx ? "var(--signal, #FB923C)" : "transparent",
                  color: selectedPalette === idx ? "#000" : "var(--ink, #E9EBF0)",
                  fontWeight: selectedPalette === idx ? 600 : 400,
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Tier Overrides */}
          <div style={{ display: "flex", gap: "0.25rem", background: "rgba(0,0,0,0.4)", padding: "2px", borderRadius: "6px" }}>
            {[
              { label: "Auto", val: undefined },
              { label: "T0", val: 0 },
              { label: "T1", val: 1 },
              { label: "T2", val: 2 },
              { label: "T3", val: 3 },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => setActiveTier(t.val)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: activeTier === t.val ? "var(--line, #262B33)" : "transparent",
                  color: activeTier === t.val ? "var(--signal, #FB923C)" : "var(--muted, #9AA1AF)",
                  fontWeight: activeTier === t.val ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Reduced Motion Toggle */}
          <button
            onClick={() => setManualReduced((r) => !r)}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: effectiveReduced ? "var(--signal, #FB923C)" : "rgba(0,0,0,0.4)",
              color: effectiveReduced ? "#000" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {effectiveReduced ? "Reduced Motion: ON" : "Reduced Motion: OFF"}
          </button>

          {/* Global Pause Control (WCAG 2.2.2) */}
          <button
            onClick={() => (isPaused ? resumeAll() : pauseAll())}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: isPaused ? "var(--degraded, #FBBF24)" : "rgba(0,0,0,0.4)",
              color: isPaused ? "#000" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isPaused ? "Resume (WCAG)" : "Pause (WCAG)"}
          </button>
        </div>
      </div>

      {/* Main NoiseField Visual Canvas */}
      <div style={{ position: "relative", flex: 1, minHeight: "560px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <NoiseField
          colors={PALETTES[selectedPalette].colors}
          maxTier={activeTier}
          paused={isPaused}
          scrim={true}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Overlaid Hero Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "2rem",
              textAlign: "center",
              maxWidth: "760px",
              margin: "0 auto",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--signal, #FB923C)",
                marginBottom: "1rem",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(251, 146, 60, 0.1)",
                border: "1px solid rgba(251, 146, 60, 0.25)",
              }}
            >
              Verified Background Shader · T{activeTier ?? 3}
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#FFFFFF",
                textShadow: "0 2px 20px rgba(0, 0, 0, 0.6)",
                marginBottom: "1.25rem",
              }}
            >
              Calculated Atmosphere
            </h1>

            <p
              style={{
                fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
                lineHeight: 1.6,
                color: "var(--ink, #E9EBF0)",
                maxWidth: "580px",
                marginBottom: "2rem",
                textShadow: "0 1px 8px rgba(0, 0, 0, 0.8)",
              }}
            >
              Procedural WebGL2 domain-warped noise calibrated for continuous
              low-contrast ambient flow, zero idle frames when offscreen, and immediate
              CSS poster fallbacks.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                style={{
                  padding: "10px 22px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  backgroundColor: "var(--signal, #FB923C)",
                  color: "#0D0F12",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(251, 146, 60, 0.35)",
                }}
              >
                Inspect Spec Sheet
              </button>
              <button
                style={{
                  padding: "10px 22px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "6px",
                  backgroundColor: "rgba(21, 24, 29, 0.8)",
                  color: "#FFFFFF",
                  border: "1px solid var(--line, #262B33)",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
              >
                Copy shadcn Snippet
              </button>
            </div>
          </div>
        </NoiseField>
      </div>

      {/* Footer Diagnostic Bar */}
      <div
        className="mono"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          padding: "0.6rem 1.5rem",
          fontSize: "11px",
          color: "var(--muted, #9AA1AF)",
          borderTop: "1px solid var(--line, #262B33)",
          backgroundColor: "rgba(13, 15, 18, 0.8)",
        }}
      >
        <span>Engine: WebGL2 · GLSL 3.00 ES</span>
        <span>Loop: while-visible · Target: 60 FPS</span>
        <span>Contexts: 1 / 4 Leases</span>
      </div>
    </div>
  );
}
