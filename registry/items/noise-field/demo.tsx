// Original — Frictionborn Motion
"use client";

import React, { useState, useEffect } from "react";
import { NoiseField } from "./noise-field";
import { pauseAll, resumeAll, usePaused, useReducedMotion } from "@frictionborn/runtime";

const PALETTES = [
  {
    name: "Host Theme",
    colors: ["var(--background)", "var(--primary)", "var(--accent)"] as [string, string, string],
  },
  {
    name: "Indigo / Rose",
    colors: ["#0B0F19", "#6366F1", "#EC4899"] as [string, string, string],
  },
  {
    name: "Emerald / Cyan",
    colors: ["#06110D", "#10B981", "#06B6D4"] as [string, string, string],
  },
];

export default function NoiseFieldDemo() {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [activeTier, setActiveTier] = useState<number | undefined>(undefined);
  const [isLight, setIsLight] = useState(false);
  const [copied, setCopied] = useState(false);
  const isPaused = usePaused();
  const systemReduced = useReducedMotion();
  const [manualReduced, setManualReduced] = useState(false);

  const effectiveReduced = systemReduced || manualReduced;

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsLight(document.documentElement.classList.contains("light"));
    }
  }, []);

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("npx shadcn@latest add @frictionborn/noise-field");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      {/* Engineering Control Bar (<= 120px on mobile) */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          backgroundColor: "var(--surface, #15181D)",
          borderBottom: "1px solid var(--line, #262B33)",
          maxHeight: "120px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor: isPaused
                ? "var(--degraded, #FBBF24)"
                : effectiveReduced
                ? "var(--muted, #9AA1AF)"
                : "var(--pass, #4ADE80)",
              display: "inline-block",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--ink, #E9EBF0)",
            }}
          >
            NoiseField
          </span>
        </div>

        {/* Interactive Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
          {/* Palette Selector */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "2px",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
            }}
          >
            {PALETTES.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                aria-pressed={selectedPalette === idx}
                onClick={() => setSelectedPalette(idx)}
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedPalette === idx ? "var(--signal, #FB923C)" : "transparent",
                  color: selectedPalette === idx ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
                  fontWeight: selectedPalette === idx ? 600 : 400,
                  minHeight: "28px",
                }}
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Tier Selector */}
          <div
            style={{
              display: "flex",
              gap: "2px",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "2px",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
            }}
          >
            {[
              { label: "Auto", val: undefined },
              { label: "T0", val: 0 },
              { label: "T1", val: 1 },
              { label: "T2", val: 2 },
              { label: "T3", val: 3 },
            ].map((t) => (
              <button
                key={t.label}
                type="button"
                aria-pressed={activeTier === t.val}
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
                  minHeight: "28px",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: "transparent",
              color: "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "28px",
            }}
          >
            {isLight ? "Theme: Light" : "Theme: Dark"}
          </button>

          {/* Reduced Motion Toggle */}
          <button
            type="button"
            aria-pressed={effectiveReduced}
            onClick={() => setManualReduced((r) => !r)}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: effectiveReduced ? "var(--signal, #FB923C)" : "transparent",
              color: effectiveReduced ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "28px",
            }}
          >
            {effectiveReduced ? "Motion: Static" : "Motion: Fluid"}
          </button>

          {/* Pause / Resume */}
          <button
            type="button"
            aria-pressed={isPaused}
            onClick={() => (isPaused ? resumeAll() : pauseAll())}
            style={{
              padding: "4px 10px",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: isPaused ? "var(--degraded, #FBBF24)" : "transparent",
              color: isPaused ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "28px",
            }}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Main NoiseField Visual Canvas */}
      <div
        id="demo-mount-point"
        style={{
          position: "relative",
          flex: 1,
          minHeight: "560px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NoiseField
          colors={PALETTES[selectedPalette].colors}
          maxTier={activeTier}
          paused={isPaused}
          reducedMotion={effectiveReduced}
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
              maxWidth: "680px",
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                color: "var(--foreground, #E9EBF0)",
                marginBottom: "1rem",
              }}
            >
              Engineered Motion for High-Signal Interfaces
            </h1>

            <p
              style={{
                fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
                lineHeight: 1.6,
                color: "var(--foreground, #E9EBF0)",
                opacity: 0.9,
                maxWidth: "520px",
                marginBottom: "2rem",
              }}
            >
              Calibrated kinetic backdrops built for zero layout shift and automated tier scaling.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href="#docs"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "6px",
                  backgroundColor: "var(--signal, #FB923C)",
                  color: "var(--bg, #0D0F12)",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Explore Components
              </a>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "6px",
                  backgroundColor: "var(--surface, #15181D)",
                  color: "var(--ink, #E9EBF0)",
                  border: "1px solid var(--line, #262B33)",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied Command!" : "Copy shadcn Command"}
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
          padding: "0.6rem 1rem",
          fontSize: "11px",
          color: "var(--muted, #9AA1AF)",
          borderTop: "1px solid var(--line, #262B33)",
          backgroundColor: "var(--surface, #15181D)",
        }}
      >
        <span>Engine: WebGL2 (GLSL 300 es) · 2D Simplex</span>
        <span>
          Status:{" "}
          {isPaused
            ? "Paused"
            : effectiveReduced
            ? "Static Poster (Reduced Motion)"
            : "Active Loop"}
        </span>
      </div>
    </div>
  );
}
