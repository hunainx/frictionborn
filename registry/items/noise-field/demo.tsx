// Original — Frictionborn Motion
"use client";

import React, { useState, useEffect } from "react";
import { NoiseField } from "./noise-field";
import { pauseAll, resumeAll, usePaused, useReducedMotion } from "@frictionborn/runtime";

const PALETTES = [
  {
    name: "Spectral Core",
    colors: ["var(--background)", "var(--primary)", "var(--accent)"] as [string, string, string],
  },
  {
    name: "Deep Space",
    colors: ["#0B0F19", "#6366F1", "#EC4899"] as [string, string, string],
  },
  {
    name: "Atmospheric",
    colors: ["#06110D", "#10B981", "#06B6D4"] as [string, string, string],
  },
];

export default function NoiseFieldDemo() {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [activeTier, setActiveTier] = useState<number | undefined>(undefined);
  const [isLight, setIsLight] = useState(false);
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
      {/* Engineering Control Bar */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          backgroundColor: "var(--surface, #15181D)",
          borderBottom: "1px solid var(--line, #262B33)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            aria-hidden="true"
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: isPaused
                ? "var(--degraded, #FBBF24)"
                : effectiveReduced
                ? "var(--muted, #9AA1AF)"
                : "var(--pass, #4ADE80)",
            }}
          />
          <strong
            className="mono"
            style={{
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink, #E9EBF0)",
            }}
          >
            NoiseField
          </strong>
        </div>

        {/* Interactive Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
          {/* Palette Selector */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "2px",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
              flexWrap: "wrap",
            }}
          >
            {PALETTES.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                aria-pressed={selectedPalette === idx}
                onClick={() => setSelectedPalette(idx)}
                style={{
                  padding: "0.375rem 0.625rem",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedPalette === idx ? "var(--signal, #FB923C)" : "transparent",
                  color: selectedPalette === idx ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
                  fontWeight: selectedPalette === idx ? 600 : 400,
                  minHeight: "44px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              gap: "4px",
              background: "rgba(0, 0, 0, 0.2)",
              padding: "2px",
              borderRadius: "6px",
              border: "1px solid var(--line, #262B33)",
              flexWrap: "wrap",
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
                  padding: "0.375rem 0.625rem",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  background: activeTier === t.val ? "var(--line, #262B33)" : "transparent",
                  color: activeTier === t.val ? "var(--signal, #FB923C)" : "var(--muted, #9AA1AF)",
                  fontWeight: activeTier === t.val ? 600 : 400,
                  minHeight: "44px",
                  minWidth: "44px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              padding: "0.375rem 0.75rem",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: "transparent",
              color: "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
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
              padding: "0.375rem 0.75rem",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: effectiveReduced ? "var(--signal, #FB923C)" : "transparent",
              color: effectiveReduced ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
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
              padding: "0.375rem 0.75rem",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid var(--line, #262B33)",
              background: isPaused ? "var(--degraded, #FBBF24)" : "transparent",
              color: isPaused ? "var(--bg, #0D0F12)" : "var(--ink, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>

      {/* Main NoiseField Visual Canvas */}
      <div
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
            <span
              className="mono"
              style={{
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--primary, #FB923C)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Precision Acoustic Engineering
            </span>
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
              Kona Acoustics
            </h1>

            <p
              style={{
                fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)",
                lineHeight: 1.6,
                color: "var(--foreground, #E9EBF0)",
                opacity: 0.9,
                maxWidth: "540px",
                marginBottom: "2rem",
              }}
            >
              Near-field acoustic reference monitors and calibrated transducers
              engineered for uncoloured studio listening environments.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              <a
                href="#instruments"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "6px",
                  backgroundColor: "var(--primary, #FB923C)",
                  color: "var(--background, #0D0F12)",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                  minHeight: "44px",
                }}
              >
                Browse Instruments
              </a>
              <a
                href="#specifications"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 500,
                  borderRadius: "6px",
                  backgroundColor: "var(--surface, #15181D)",
                  color: "var(--foreground, #E9EBF0)",
                  border: "1px solid var(--border, #262B33)",
                  cursor: "pointer",
                  textDecoration: "none",
                  minHeight: "44px",
                }}
              >
                View Specifications
              </a>
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
