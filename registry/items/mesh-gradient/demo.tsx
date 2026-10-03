// Original — Frictionborn Motion MeshGradient interactive showcase
"use client";

import React, { useState } from "react";
import { MeshGradient } from "./mesh-gradient";

export default function MeshGradientDemo() {
  const [speed, setSpeed] = useState(0.35);
  const [distortion, setDistortion] = useState(0.5);
  const [swirl, setSwirl] = useState(0.25);
  const [scrim, setScrim] = useState(true);
  const [paused, setPaused] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        padding: "1.5rem",
        backgroundColor: "var(--background, #080A0E)",
        color: "var(--foreground, #F1F5F9)",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Brand Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
          paddingBottom: "1rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--primary, #38BDF8)",
            marginBottom: "0.35rem",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: paused ? "var(--muted, #64748B)" : "var(--primary, #38BDF8)",
              boxShadow: paused ? "none" : "0 0 8px var(--primary, #38BDF8)",
            }}
          />
          Aetheric Instruments &bull; Spectral Metrology Div.
        </div>
        <h2
          style={{
            margin: "0 0 0.25rem 0",
            fontSize: "1.25rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Dispersive Spectral Field Visualizer &bull; Model 9400
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "0.825rem",
            color: "var(--muted, #94A3B8)",
          }}
        >
          Continuous multi-band chromatic interferometry with organic wavefront distortion
        </p>
      </header>

      {/* Primary Viewport Canvas with HUD */}
      <div
        style={{
          position: "relative",
          height: "380px",
          borderRadius: "8px",
          border: "1px solid var(--border, rgba(255, 255, 255, 0.12))",
          overflow: "hidden",
          backgroundColor: "#0B0E14",
        }}
      >
        <MeshGradient
          speed={speed}
          distortion={distortion}
          swirl={swirl}
          scrim={scrim}
          paused={paused}
          style={{ width: "100%", height: "100%" }}
        >
          {/* Optical Reticle & HUD Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
            }}
          >
            {/* Top Telemetry Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.72rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(11, 14, 20, 0.72)",
                  backdropFilter: "blur(6px)",
                  padding: "0.4rem 0.65rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  lineHeight: 1.4,
                }}
              >
                <div>BAND: 480nm &ndash; 640nm (VIS-NIR)</div>
                <div>COHERENCE: 99.82%</div>
                <div>DRIFT: &lt;0.015 mrad/h</div>
              </div>

              <div
                style={{
                  backgroundColor: "rgba(11, 14, 20, 0.72)",
                  backdropFilter: "blur(6px)",
                  padding: "0.4rem 0.65rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "right",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ color: "var(--primary, #38BDF8)", fontWeight: 600 }}>
                  LOCK STATUS: NOMINAL
                </div>
                <div>APERTURE: f/1.4 EFF</div>
              </div>
            </div>

            {/* Center Dispersion Schematic */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0.28,
              }}
            >
              <svg width="220" height="220" viewBox="0 0 220 220" fill="none">
                <circle cx="110" cy="110" r="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="110" cy="110" r="70" stroke="currentColor" strokeWidth="1" />
                <circle cx="110" cy="110" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
                <line x1="110" y1="0" x2="110" y2="220" stroke="currentColor" strokeWidth="0.75" />
                <line x1="0" y1="110" x2="220" y2="110" stroke="currentColor" strokeWidth="0.75" />
                <polygon points="110,50 162,140 58,140" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </div>

            {/* Bottom Status Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.72rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "rgba(11, 14, 20, 0.72)",
                  backdropFilter: "blur(6px)",
                  padding: "0.35rem 0.6rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                RENDER LEASE: GL2 ACTIVE &bull; CLS 0 POSTER BACKED
              </div>
              <div
                style={{
                  backgroundColor: "rgba(11, 14, 20, 0.72)",
                  backdropFilter: "blur(6px)",
                  padding: "0.35rem 0.6rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                PAPER SHADERS ENGINE
              </div>
            </div>
          </div>
        </MeshGradient>
      </div>

      {/* Control Console */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          padding: "1rem",
          borderRadius: "6px",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--border, rgba(255, 255, 255, 0.08))",
          fontSize: "0.825rem",
        }}
      >
        {[
          { label: "Drift Speed", val: speed, min: 0, max: 1.5, step: 0.05, suffix: "x", set: setSpeed },
          { label: "Wave Distortion", val: distortion, min: 0, max: 1, step: 0.05, suffix: "", set: setDistortion },
          { label: "Vortex Swirl", val: swirl, min: 0, max: 1, step: 0.05, suffix: "", set: setSwirl },
        ].map((ctrl) => (
          <div key={ctrl.label} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <label style={{ display: "flex", justifyContent: "space-between", color: "var(--muted, #94A3B8)" }}>
              <span>{ctrl.label}</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{ctrl.val.toFixed(2)}{ctrl.suffix}</span>
            </label>
            <input
              type="range"
              aria-label={ctrl.label}
              min={ctrl.min}
              max={ctrl.max}
              step={ctrl.step}
              value={ctrl.val}
              onChange={(e) => ctrl.set(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary, #38BDF8)" }}
            />
          </div>
        ))}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setScrim((s) => !s)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.15))",
              backgroundColor: scrim ? "var(--primary, #38BDF8)" : "transparent",
              color: scrim ? "#080A0E" : "var(--foreground, #F1F5F9)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            {scrim ? "AA Scrim: Active" : "AA Scrim: Off"}
          </button>

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.15))",
              backgroundColor: paused ? "#EF4444" : "transparent",
              color: paused ? "#FFFFFF" : "var(--foreground, #F1F5F9)",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            {paused ? "Resume Feed" : "Freeze Field"}
          </button>
        </div>
      </div>
    </div>
  );
}
