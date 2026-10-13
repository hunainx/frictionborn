// Original — Frictionborn Motion ParticleField demo
"use client";

import React, { useState } from "react";
import { ParticleField } from "./particle-field";
import { useReducedMotion, usePaused } from "@frictionborn/runtime";

export default function ParticleFieldDemo() {
  const [pointCount, setPointCount] = useState<number>(2000);
  const [driftVelocity, setDriftVelocity] = useState<number>(1.0);
  const [forceStatic, setForceStatic] = useState(false);

  const globalPaused = usePaused();
  const systemReduced = useReducedMotion();
  const isStaticActive = systemReduced || forceStatic;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "680px",
        borderRadius: "8px",
        overflow: "hidden",
        border: "1px solid var(--border, #262B33)",
        backgroundColor: "var(--background, #0D0F12)",
        color: "var(--foreground, #E9EBF0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Particle Configuration Deck */}
      <nav
        aria-label="Particle field configuration"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.875rem 1.25rem",
          backgroundColor: "var(--card, #15181D)",
          borderBottom: "1px solid var(--border, #262B33)",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: globalPaused
                ? "var(--degraded, #FBBF24)"
                : isStaticActive
                ? "var(--muted-foreground, #9AA1AF)"
                : "var(--primary, #FB923C)",
            }}
          />
          <span className="mono" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Frictionborn · ParticleField
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Density Preset Pills */}
          <div style={{ display: "flex", gap: "2px", border: "1px solid var(--border, #262B33)", borderRadius: "4px", padding: "2px" }}>
            {[1000, 2000, 3500].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setPointCount(count)}
                style={{
                  padding: "0.375rem 0.625rem",
                  fontSize: "11px",
                  border: "none",
                  borderRadius: "2px",
                  background: pointCount === count ? "var(--primary, #FB923C)" : "transparent",
                  color: pointCount === count ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
                  cursor: "pointer",
                  minHeight: "44px",
                }}
              >
                {count} pts
              </button>
            ))}
          </div>

          {/* Static/Reduced Toggle */}
          <button
            type="button"
            onClick={() => setForceStatic((s) => !s)}
            style={{
              padding: "0.375rem 0.75rem",
              fontSize: "11px",
              borderRadius: "4px",
              border: "1px solid var(--border, #262B33)",
              background: isStaticActive ? "var(--primary, #FB923C)" : "transparent",
              color: isStaticActive ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            {isStaticActive ? "Poster: Static" : "Stream: Dynamic"}
          </button>
        </div>
      </nav>

      {/* Hero Visual Area */}
      <div style={{ position: "relative", flex: 1, minHeight: "560px" }}>
        <ParticleField
          count={pointCount}
          speed={driftVelocity}
          paused={globalPaused}
          reducedMotion={isStaticActive}
          scrim={true}
          style={{ position: "absolute", inset: 0 }}
        >
          <div
            style={{
              padding: "4rem 2rem",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: "12px",
                color: "var(--primary, #FB923C)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Sparks in the night air
            </div>
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
              Sparks Rising From Heat
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
              Particles drifting upward like sparks above a fire, slow enough to sit quietly behind a headline
              without pulling the eye away.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
              <div style={{ padding: "0.875rem 1rem", borderRadius: "6px", background: "var(--card, #15181D)", border: "1px solid var(--border, #262B33)", textAlign: "left" }}>
                <span className="mono" style={{ fontSize: "11px", color: "var(--muted-foreground, #9AA1AF)", display: "block", textTransform: "uppercase" }}>Reduced Motion</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground, #E9EBF0)" }}>Static Poster</span>
              </div>
              <div style={{ padding: "0.875rem 1rem", borderRadius: "6px", background: "var(--card, #15181D)", border: "1px solid var(--border, #262B33)", textAlign: "left" }}>
                <span className="mono" style={{ fontSize: "11px", color: "var(--muted-foreground, #9AA1AF)", display: "block", textTransform: "uppercase" }}>Installed Through</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground, #E9EBF0)" }}>shadcn CLI as Source</span>
              </div>
            </div>
          </div>
        </ParticleField>
      </div>

      <footer
        className="mono"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          fontSize: "11px",
          color: "var(--muted-foreground, #9AA1AF)",
          borderTop: "1px solid var(--border, #262B33)",
          backgroundColor: "var(--card, #15181D)",
        }}
      >
        <span>Background: ParticleField</span>
        <span>
          Density: {pointCount} particles · Status: {isStaticActive ? "Static Poster" : "Active Feed"}
        </span>
      </footer>
    </div>
  );
}
