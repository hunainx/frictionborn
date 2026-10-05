// Original — Frictionborn Motion StickyScrollStory Demo
"use client";

import React, { useState } from "react";
import { StickyScrollStory, StoryStep } from "./sticky-scroll-story";

function DiagramCard({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <figure
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        padding: "1.25rem",
        backgroundColor: "var(--card, #15181D)",
        border: "1px solid var(--border, #262B33)",
        borderRadius: "8px",
        boxSizing: "border-box",
        margin: 0,
      }}
    >
      <figcaption
        className="mono"
        style={{
          fontSize: "11px",
          color: "var(--primary, #FB923C)",
          marginBottom: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {caption}
      </figcaption>
      {children}
    </figure>
  );
}

const CHRONOS_STEPS: StoryStep[] = [
  {
    id: "step-lattice",
    badge: "Subsystem 01 · Vacuum Matrix",
    title: "Strontium Lattice Confinement",
    description:
      "Neutral strontium-87 atoms are captured in a magic-wavelength 1D optical lattice at 813 nm, eliminating first-order Doppler shifts while preserving atomic coherence times beyond 10 seconds.",
    media: {
      type: "custom",
      content: (
        <DiagramCard caption="Schematic · Optical Lattice Trap (813 nm)">
          <svg viewBox="0 0 260 160" width="100%" height="160" aria-label="Optical lattice diagram">
            <rect x="20" y="20" width="220" height="120" rx="8" fill="none" stroke="var(--border, #262B33)" strokeWidth="1.5" />
            <line x1="5" y1="80" x2="255" y2="80" stroke="var(--primary, #FB923C)" strokeWidth="2" strokeDasharray="3 3" />
            <rect x="35" y="55" width="8" height="50" rx="2" fill="var(--muted-foreground, #9AA1AF)" />
            <rect x="217" y="55" width="8" height="50" rx="2" fill="var(--muted-foreground, #9AA1AF)" />
            {Array.from({ length: 9 }).map((_, i) => (
              <circle
                key={i}
                cx={70 + i * 15}
                cy={80}
                r="4"
                fill="var(--primary, #FB923C)"
                opacity={i % 2 === 0 ? "0.9" : "0.5"}
              />
            ))}
            <text x="75" y="115" fill="var(--foreground, #E9EBF0)" fontSize="10" fontFamily="monospace">
              Trapped 87Sr Ensemble
            </text>
          </svg>
        </DiagramCard>
      ),
    },
  },
  {
    id: "step-cavity",
    badge: "Subsystem 02 · Reference Cavity",
    title: "Sub-Hertz Cryogenic Resonator",
    description:
      "A diode laser locked to a 30 cm monocrystalline silicon cavity at 124 Kelvin achieves fractional frequency instability below 4 × 10⁻¹⁷ at one-second integration, insulated by dual gold-coated radiation shields.",
    media: {
      type: "custom",
      content: (
        <DiagramCard caption="Schematic · Cryogenic Si Cavity (124 K)">
          <svg viewBox="0 0 260 160" width="100%" height="160" aria-label="Cryogenic cavity diagram">
            <rect x="25" y="25" width="210" height="110" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1" />
            <rect x="40" y="40" width="180" height="80" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1" strokeDasharray="4 2" />
            <rect x="65" y="60" width="130" height="40" rx="3" fill="rgba(251, 146, 60, 0.15)" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <line x1="50" y1="80" x2="210" y2="80" stroke="var(--foreground, #E9EBF0)" strokeWidth="1.5" />
            <circle cx="65" cy="80" r="3" fill="var(--primary, #FB923C)" />
            <circle cx="195" cy="80" r="3" fill="var(--primary, #FB923C)" />
            <text x="80" y="84" fill="var(--foreground, #E9EBF0)" fontSize="10" fontFamily="monospace">
              Finesse: 240,000
            </text>
          </svg>
        </DiagramCard>
      ),
    },
  },
  {
    id: "step-comb",
    badge: "Subsystem 03 · Frequency Comb",
    title: "Octave-Spanning Optical Synthesizer",
    description:
      "An erbium-doped fiber femtosecond comb transfers clock stability across optical, near-infrared, and microwave regimes with negligible phase noise degradation.",
    media: {
      type: "custom",
      content: (
        <DiagramCard caption="Schematic · f-to-2f Self-Referencing Comb">
          <svg viewBox="0 0 260 160" width="100%" height="160" aria-label="Frequency comb diagram">
            <rect x="25" y="55" width="55" height="50" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1.5" />
            <text x="32" y="83" fill="var(--foreground, #E9EBF0)" fontSize="9" fontFamily="monospace">
              Er:Fiber
            </text>
            <line x1="80" y1="80" x2="115" y2="80" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <rect x="115" y="65" width="40" height="30" rx="3" fill="rgba(251, 146, 60, 0.2)" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <text x="123" y="83" fill="var(--foreground, #E9EBF0)" fontSize="9" fontFamily="monospace">
              PCF
            </text>
            <line x1="155" y1="80" x2="190" y2="80" stroke="var(--primary, #FB923C)" strokeWidth="1.5" />
            <rect x="190" y="55" width="50" height="50" rx="4" fill="none" stroke="var(--border, #262B33)" strokeWidth="1.5" />
            <text x="198" y="83" fill="var(--foreground, #E9EBF0)" fontSize="9" fontFamily="monospace">
              f-to-2f
            </text>
            <text x="65" y="130" fill="var(--muted-foreground, #9AA1AF)" fontSize="10" fontFamily="monospace">
              f_ceo Beat Lock: 20 MHz
            </text>
          </svg>
        </DiagramCard>
      ),
    },
  },
];

export default function StickyScrollStoryDemo() {
  const [activeStepId, setActiveStepId] = useState("step-lattice");

  return (
    <section
      aria-label="Aetheric Instruments Chronos-4 Story"
      style={{
        padding: "1rem",
        color: "var(--foreground, #E9EBF0)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "1.25rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border, #262B33)",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "var(--primary, #FB923C)",
              display: "inline-block",
            }}
          />
          <span className="mono" style={{ fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Aetheric Instruments · Chronos-4 System
          </span>
        </div>
        <div className="mono" style={{ fontSize: "11px", color: "var(--muted-foreground, #9AA1AF)" }}>
          Active Stage: <strong style={{ color: "var(--primary, #FB923C)" }}>{activeStepId}</strong>
        </div>
      </header>

      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
          <span
            className="mono"
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--primary, #FB923C)",
              display: "block",
              marginBottom: "0.35rem",
            }}
          >
            Instrumentation Narrative
          </span>
          <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Chronos-4 Cryogenic Optical Clock
          </h1>
        </div>

        <StickyScrollStory
          steps={CHRONOS_STEPS}
          mediaPosition="right"
          onStepChange={(id) => setActiveStepId(id)}
        />
      </div>
    </section>
  );
}
