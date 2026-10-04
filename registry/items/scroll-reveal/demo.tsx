// Original — Frictionborn Motion ScrollReveal demo
"use client";

import React, { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

interface InstrumentCard {
  serial: string;
  subsystem: string;
  summary: string;
  specs: string;
}

const INSTRUMENTS: InstrumentCard[] = [
  {
    serial: "AE-840",
    subsystem: "Interferometric Cavity Stabilization",
    summary:
      "Ultra-low expansion cryogenic Fabry-Pérot cavity operating at 4 Kelvin with residual frequency drift suppressed below 0.1 Hz per diurnal cycle.",
    specs: "Finesse: 240,000 · Spacer: Monocrystalline Si · Drift: <0.1 Hz/day",
  },
  {
    serial: "QD-120",
    subsystem: "Phase-Sensitive Homodyne Detection",
    summary:
      "Balanced optical receivers resolving single-photon quadrature fluctuations at 1064 nm with 98.4% quantum efficiency and 85 dB common-mode rejection.",
    specs: "Bandwidth: DC–2.5 GHz · NEP: 3.2 pW/√Hz · CMRR: >85 dB",
  },
  {
    serial: "SP-400",
    subsystem: "Active Inertial Suspension Matrix",
    summary:
      "Six-degree-of-freedom inverted pendulum array decoupling micro-seismic ground motion and thermal expansion from subterranean optical test benches.",
    specs: "Attenuation: 140 dB @ 10 Hz · Payload: 850 kg · Sensors: LVDT + Geophone",
  },
];

export default function ScrollRevealDemo() {
  const [animationMode, setAnimationMode] = useState<"fade-up" | "fade" | "scale-up">("fade-up");

  return (
    <div
      style={{
        padding: "2.5rem 1.25rem",
        maxWidth: 900,
        margin: "0 auto",
        color: "var(--foreground, #E9EBF0)",
      }}
    >
      <header
        style={{
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border, #262B33)",
          paddingBottom: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span
            className="mono"
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--primary, #FB923C)",
              display: "block",
              marginBottom: "0.35rem",
            }}
          >
            Aetheric Instruments · Catalog 2026
          </span>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Core Optical Subsystems
          </h1>
        </div>

        <fieldset
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            gap: "0.375rem",
          }}
        >
          <legend className="sr-only">Scroll reveal transition variant</legend>
          {(["fade-up", "fade", "scale-up"] as const).map((m) => (
            <label
              key={m}
              style={{
                padding: "0.5rem 0.875rem",
                borderRadius: "4px",
                border: "1px solid var(--border, #262B33)",
                background: animationMode === m ? "var(--primary, #FB923C)" : "transparent",
                color: animationMode === m ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 500,
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                type="radio"
                name="scroll-mode"
                value={m}
                checked={animationMode === m}
                onChange={() => setAnimationMode(m)}
                style={{ display: "none" }}
              />
              {m}
            </label>
          ))}
        </fieldset>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {INSTRUMENTS.map((inst, idx) => (
          <ScrollReveal
            key={`${animationMode}-${inst.serial}`}
            animation={animationMode}
            distance={20}
            duration={400}
          >
            <article
              style={{
                border: "1px solid var(--border, #262B33)",
                borderRadius: "8px",
                padding: "1.5rem",
                backgroundColor: "var(--card, rgba(21, 24, 29, 0.6))",
                color: "var(--card-foreground, #E9EBF0)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--primary, #FB923C)",
                  }}
                >
                  {inst.serial}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--muted-foreground, #9AA1AF)",
                  }}
                >
                  Unit {idx + 1} of {INSTRUMENTS.length}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  margin: "0 0 0.5rem 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {inst.subsystem}
              </h2>

              <p
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  color: "var(--muted-foreground, #9AA1AF)",
                }}
              >
                {inst.summary}
              </p>

              <div
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "4px",
                  border: "1px solid var(--border, #262B33)",
                  color: "var(--foreground, #E9EBF0)",
                }}
              >
                {inst.specs}
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
