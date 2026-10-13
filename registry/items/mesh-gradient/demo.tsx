// Original — Frictionborn Motion MeshGradient interactive showcase
"use client";

import React, { useState, useEffect } from "react";
import { MeshGradient } from "./mesh-gradient";
import { usePaused, useReducedMotion } from "@frictionborn/runtime";

const PALETTES = [
  {
    name: "Blue Flame",
    colors: ["#0B0E14", "#38BDF8", "#818CF8", "#C084FC"] as [string, string, string, string],
  },
  {
    name: "Open Air",
    colors: ["#080A0E", "#F59E0B", "#10B981", "#3B82F6"] as [string, string, string, string],
  },
  {
    name: "Soft Daylight",
    colors: ["#F8FAFC", "#60A5FA", "#F472B6", "#A78BFA"] as [string, string, string, string],
  },
];

export default function MeshGradientDemo() {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const [speed, setSpeed] = useState(1.15);
  const [distortion, setDistortion] = useState(0.5);
  const [swirl, setSwirl] = useState(0.3);
  const [scrim, setScrim] = useState(true);
  const [colorMode, setColorMode] = useState<"dark" | "light">("dark");
  const isLight = colorMode === "light";
  const [manualReduced, setManualReduced] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const docElem = document.documentElement;
    const updateTheme = () => {
      const lightActive = docElem.classList.contains("light") || docElem.getAttribute("data-theme") === "light";
      setColorMode(lightActive ? "light" : "dark");
      if (lightActive) {
        setSelectedPalette((p) => (p === 0 ? 2 : p));
      }
    };
    updateTheme();
    const mo = new MutationObserver(updateTheme);
    mo.observe(docElem, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => mo.disconnect();
  }, []);

  const isPaused = usePaused();
  const systemReduced = useReducedMotion();
  const effectiveReduced = systemReduced || manualReduced;

  const handleModeSwitch = () => {
    const nextMode = colorMode === "dark" ? "light" : "dark";
    setColorMode(nextMode);
    if (typeof document !== "undefined") {
      if (nextMode === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.setAttribute("data-theme", "light");
        setSelectedPalette((p) => (p === 0 ? 2 : p));
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.removeAttribute("data-theme");
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        padding: "1.5rem",
        backgroundColor: isLight ? "#F8FAFC" : "var(--background, #080A0E)",
        color: isLight ? "#0F172A" : "var(--foreground, #F1F5F9)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        borderRadius: "8px",
        border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.1)" : "var(--border, rgba(255, 255, 255, 0.1))"}`,
      }}
    >
      {/* Brand Header */}
      <header
        style={{
          borderBottom: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "var(--border, rgba(255, 255, 255, 0.1))"}`,
          paddingBottom: "1.25rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: isLight ? "#1D4ED8" : "var(--primary, #38BDF8)",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isPaused
                ? "var(--degraded, #FBBF24)"
                : effectiveReduced
                ? "var(--muted, #64748B)"
                : "var(--primary, #38BDF8)",
            }}
          />
          Frictionborn Motion &bull; Mesh Gradient
        </div>
        <h1
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Slow Colour, Steady Text
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "0.95rem",
            lineHeight: 1.5,
            color: isLight ? "#475569" : "var(--muted, #94A3B8)",
            maxWidth: "680px",
          }}
        >
          A slow WebGL gradient for hero sections. When motion is reduced, a still CSS poster takes its place.
        </p>
      </header>

      {/* Primary Viewport Canvas with Overlaid Product Headline */}
      <div
        style={{
          position: "relative",
          height: "420px",
          borderRadius: "8px",
          border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.12)" : "var(--border, rgba(255, 255, 255, 0.12))"}`,
          overflow: "hidden",
          backgroundColor: isLight ? "#F1F5F9" : "#0B0E14",
        }}
      >
        <MeshGradient
          colors={PALETTES[selectedPalette].colors}
          speed={speed}
          distortion={distortion}
          swirl={swirl}
          scrim={scrim}
          paused={isPaused}
          reducedMotion={effectiveReduced}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Headline Overlaid with Scrim */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "2rem",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                maxWidth: "520px",
                backgroundColor: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(11, 14, 20, 0.78)",
                backdropFilter: "blur(12px)",
                padding: "1.25rem 1.5rem",
                borderRadius: "6px",
                border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)"}`,
                boxShadow: isLight ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "0 4px 20px rgba(0, 0, 0, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isLight ? "#2563EB" : "var(--primary, #38BDF8)",
                  marginBottom: "0.35rem",
                }}
              >
                mesh-gradient &bull; Hero Backdrop
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: isLight ? "#0F172A" : "var(--foreground, #F1F5F9)",
                  letterSpacing: "-0.01em",
                  marginBottom: "0.35rem",
                }}
              >
                Readable Over Moving Colour
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  lineHeight: 1.45,
                  color: isLight ? "#475569" : "var(--muted, #94A3B8)",
                }}
              >
                The scrim sits between the colour and your copy, so the words stay easy to read.
              </p>
            </div>
          </div>
        </MeshGradient>
      </div>

      {/* Control Console (Controls >= 44px) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          padding: "1.25rem",
          borderRadius: "6px",
          backgroundColor: isLight ? "#FFFFFF" : "rgba(255, 255, 255, 0.03)",
          border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "var(--border, rgba(255, 255, 255, 0.08))"}`,
        }}
      >
        {/* Palette Selector and Quick Toggles */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Palette selector pills */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {PALETTES.map((pal, idx) => (
              <button
                key={pal.name}
                type="button"
                aria-pressed={selectedPalette === idx}
                onClick={() => setSelectedPalette(idx)}
                style={{
                  minHeight: "44px",
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: selectedPalette === idx ? 600 : 400,
                  borderRadius: "6px",
                  border: `1px solid ${selectedPalette === idx ? "var(--primary, #38BDF8)" : isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}`,
                  backgroundColor: selectedPalette === idx ? "var(--primary, #38BDF8)" : "transparent",
                  color: selectedPalette === idx ? "#080A0E" : isLight ? "#0F172A" : "var(--foreground, #F1F5F9)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pal.name}
              </button>
            ))}
          </div>

          {/* Action buttons (minHeight 44px) */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={handleModeSwitch}
              style={{
                minHeight: "44px",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1px solid ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}`,
                backgroundColor: "transparent",
                color: isLight ? "#0F172A" : "var(--foreground, #F1F5F9)",
                fontWeight: 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isLight ? "Theme: Light" : "Theme: Dark"}
            </button>

            <button
              type="button"
              aria-pressed={effectiveReduced}
              onClick={() => setManualReduced((r) => !r)}
              style={{
                minHeight: "44px",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1px solid ${effectiveReduced ? "var(--primary, #38BDF8)" : isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}`,
                backgroundColor: effectiveReduced ? "var(--primary, #38BDF8)" : "transparent",
                color: effectiveReduced ? "#080A0E" : isLight ? "#0F172A" : "var(--foreground, #F1F5F9)",
                fontWeight: 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {effectiveReduced ? "Motion: Static" : "Motion: Fluid"}
            </button>

            <button
              type="button"
              onClick={() => setScrim((s) => !s)}
              style={{
                minHeight: "44px",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: `1px solid ${isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}`,
                backgroundColor: scrim ? (isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)") : "transparent",
                color: isLight ? "#0F172A" : "var(--foreground, #F1F5F9)",
                fontWeight: 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {scrim ? "AA Scrim: On" : "AA Scrim: Off"}
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            paddingTop: "0.5rem",
          }}
        >
          {[
            { label: "Drift Speed", val: speed, min: 0, max: 1.5, step: 0.05, suffix: "x", set: setSpeed },
            { label: "Wave Distortion", val: distortion, min: 0, max: 1, step: 0.05, suffix: "", set: setDistortion },
            { label: "Swirl", val: swirl, min: 0, max: 1, step: 0.05, suffix: "", set: setSwirl },
          ].map((ctrl) => (
            <div key={ctrl.label} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: isLight ? "#475569" : "var(--muted, #94A3B8)" }}>
                <span>{ctrl.label}</span>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 600 }}>{ctrl.val.toFixed(2)}{ctrl.suffix}</span>
              </label>
              <input
                type="range"
                aria-label={ctrl.label}
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                value={ctrl.val}
                onChange={(e) => ctrl.set(parseFloat(e.target.value))}
                style={{ width: "100%", height: "44px", accentColor: "var(--primary, #38BDF8)", cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Honest Status Bar (Zero Fabricated Metrics) */}
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          fontSize: "0.8rem",
          color: isLight ? "#64748B" : "var(--muted, #94A3B8)",
          fontFamily: "var(--font-mono, monospace)",
          padding: "0.5rem 0.25rem",
        }}
      >
        <span>Background: MeshGradient</span>
        <span>
          State: {isPaused ? "Frozen" : effectiveReduced ? "Static Poster" : "Live Frame Loop"}
        </span>
      </footer>
    </div>
  );
}
