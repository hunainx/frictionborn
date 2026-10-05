// Original — Frictionborn Motion SmoothScroll Demo
"use client";

import React, { useState } from "react";
import { SmoothScroll } from "./smooth-scroll";
import { useReducedMotion, useCapability } from "@frictionborn/runtime";

export default function SmoothScrollDemo() {
  const [enabled, setEnabled] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const capability = useCapability();

  const isCoarse = capability.pointer === "coarse";
  const isEffectivelyActive = enabled && !prefersReduced && !isCoarse;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "800px",
        borderRadius: "8px",
        border: "1px solid var(--border, #262B33)",
        backgroundColor: "var(--background, #0D0F12)",
        color: "var(--foreground, #E9EBF0)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Sticky Telemetry Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          background: "var(--card, #15181D)",
          borderBottom: "1px solid var(--border, #262B33)",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: isEffectivelyActive
                ? "var(--pass, #4ADE80)"
                : "var(--muted-foreground, #9AA1AF)",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "12px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Aetheric Instruments · Monograph 08
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            aria-pressed={enabled}
            onClick={() => setEnabled((e) => !e)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "12px",
              borderRadius: "4px",
              border: "1px solid var(--border, #262B33)",
              background: enabled ? "var(--primary, #FB923C)" : "transparent",
              color: enabled ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
              cursor: "pointer",
              fontWeight: 500,
              minHeight: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {enabled ? "Kinetic Scroll: Enabled" : "Kinetic Scroll: Native"}
          </button>
        </div>
      </header>

      {/* Main Content Area Wrapped with SmoothScroll */}
      <SmoothScroll enabled={enabled}>
        <div
          style={{
            position: "relative",
            padding: "2.5rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "3rem",
            maxWidth: "840px",
            margin: "0 auto",
          }}
        >
          {/* Article Header */}
          <section>
            <span
              className="mono"
              style={{
                fontSize: "0.8rem",
                color: "var(--primary, #FB923C)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Technical Specification · Series 2026
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
                margin: "0 0 1rem 0",
              }}
            >
              Orbit-8 Laser Baseline & Sub-Picometer Gravimetry
            </h1>
            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: 1.6,
                color: "var(--muted-foreground, #9AA1AF)",
                margin: 0,
              }}
            >
              Design architecture for a 4,000-kilometer drag-free laser interferometric
              constellation measuring milliHertz gravitational tensor perturbations.
            </p>

            {/* Quick Section Anchor Nav */}
            <nav
              aria-label="Table of Contents"
              style={{
                marginTop: "1.5rem",
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "1. Baseline", href: "#sec-baseline" },
                { label: "2. Resonator", href: "#sec-resonator" },
                { label: "3. Seismic Attenuation", href: "#sec-seismic" },
                { label: "4. Telemetry Buffer", href: "#sec-buffer" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "0.375rem 0.625rem",
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                    border: "1px solid var(--border, #262B33)",
                    color: "var(--foreground, #E9EBF0)",
                    textDecoration: "none",
                    background: "rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </section>

          {/* Section 1: Optical Baseline */}
          <section id="sec-baseline" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              1. Optical Metrology Baseline
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1rem" }}>
              The Orbit-8 constellation establishes three drag-free spacecraft positioned in an equilateral
              triangular formation orbiting the Sun at 1 AU. Each arm comprises an active bidirectional laser link
              delivering 2 Watts of single-mode 1064 nm light through 30 cm off-axis paraboloid telescopes.
            </p>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)" }}>
              Phase fluctuations resulting from inter-satellite distance variations are tracked using heterodyne
              photodetection with a 25 MHz offset frequency. Time-delay interferometry (TDI) algorithms cancel laser
              frequency noise by twenty orders of magnitude, isolating the differential gravitational strain tensor.
            </p>
          </section>

          {/* Section 2: Cryogenic Optical Resonator */}
          <section id="sec-resonator" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              2. Cryogenic Optical Resonator Dynamics
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1.25rem" }}>
              Laser pre-stabilization utilizes a 30 cm monocrystalline silicon cavity cooled to 124 Kelvin,
              where silicon’s thermal expansion coefficient passes through a zero-crossing.
            </p>

            {/* SVG Frequency Stability Curve */}
            <div
              style={{
                padding: "1.25rem",
                backgroundColor: "var(--card, #15181D)",
                borderRadius: "8px",
                border: "1px solid var(--border, #262B33)",
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--primary, #FB923C)",
                  marginBottom: "0.75rem",
                }}
              >
                Figure 2.1 · Allan Deviation σ_y(τ) vs Integration Time (s)
              </div>
              <svg viewBox="0 0 600 160" width="100%" height="160" aria-label="Allan deviation frequency curve">
                <line x1="40" y1="20" x2="40" y2="130" stroke="var(--border, #262B33)" strokeWidth="1" />
                <line x1="40" y1="130" x2="580" y2="130" stroke="var(--border, #262B33)" strokeWidth="1" />
                <path
                  d="M 50 40 Q 150 90, 280 115 T 570 95"
                  fill="none"
                  stroke="var(--primary, #FB923C)"
                  strokeWidth="2"
                />
                <circle cx="280" cy="115" r="4" fill="var(--primary, #FB923C)" />
                <text x="290" y="110" fill="var(--foreground, #E9EBF0)" fontSize="10" fontFamily="monospace">
                  Min: 4e-17 @ 1.2s
                </text>
                <text x="40" y="145" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
                  10^-3
                </text>
                <text x="280" y="145" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
                  10^0
                </text>
                <text x="540" y="145" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
                  10^3 s
                </text>
              </svg>
            </div>
          </section>

          {/* Section 3: Seismic Rejection & Inertial Decoupling */}
          <section id="sec-seismic" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              3. Seismic Rejection & Test Mass Drag-Free Control
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1rem" }}>
              Each satellite houses a 46 mm gold-platinum cubical test mass floating in free fall within an electrode
              housing. Electrostatic capacitive sensors measure relative displacement with a resolution of 1 picometer
              per root Hertz.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid var(--border, #262B33)",
                background: "transparent",
                color: "var(--foreground, #E9EBF0)",
                fontSize: "0.85rem",
                cursor: "pointer",
                minHeight: "40px",
              }}
            >
              Inspect Calibration Certificate (Modal Test)
            </button>
          </section>

          {/* Section 4: Nested Telemetry Log Buffer */}
          <section id="sec-buffer" style={{ scrollMarginTop: "80px" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                borderBottom: "1px solid var(--border, #262B33)",
                paddingBottom: "0.5rem",
              }}
            >
              4. Deep Space Telemetry Log Buffer
            </h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted-foreground, #9AA1AF)", marginBottom: "1rem" }}>
              Real-time ring buffer streaming optical phase lock telemetry. This nested container maintains
              independent native scroll without interference from the page-level SmoothScroll provider.
            </p>

            <div
              data-lenis-prevent="true"
              tabIndex={0}
              aria-label="Nested Telemetry Log Stream"
              style={{
                height: "220px",
                overflowY: "auto",
                backgroundColor: "var(--card, #15181D)",
                borderRadius: "6px",
                border: "1px solid var(--border, #262B33)",
                padding: "1rem",
                fontFamily: "monospace",
                fontSize: "11px",
                lineHeight: "1.8",
                color: "var(--foreground, #E9EBF0)",
              }}
            >
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ color: "var(--primary, #FB923C)", marginRight: "1rem" }}>
                    [+{(i * 12.5).toFixed(1)}ms]
                  </span>
                  <span>NODE-{(i % 3) + 1} HETERODYNE BEAT: LOCKED · RESIDUAL PHASE ERROR: 0.{((i * 17) % 89 + 10)} μrad</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SmoothScroll>

      {/* Modal Dialog (proving allowNestedScroll & modal native handling) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-dialog-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--card, #15181D)",
              border: "1px solid var(--border, #262B33)",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h2 id="cert-dialog-title" style={{ fontSize: "1.25rem", margin: "0 0 1rem 0" }}>
              NIST Traceable Calibration Certificate
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--muted-foreground, #9AA1AF)", lineHeight: 1.6 }}>
              Aetheric Instruments confirms that optical frequency synthesizers deployed under Series 2026
              were verified against the primary Cesium fountain standard NIST-F2 with an uncertainty of 1.1 × 10⁻¹⁶.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: "1.5rem",
                padding: "0.5rem 1rem",
                minHeight: "44px",
                minWidth: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "var(--primary, #FB923C)",
                color: "var(--background, #0D0F12)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
