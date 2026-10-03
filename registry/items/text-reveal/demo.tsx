// Original — Frictionborn Motion TextReveal demo
"use client";

import React, { useState } from "react";
import { TextReveal } from "./text-reveal";

const TELEMETRY_HEADLINES = [
  "Sub-angstrom laser interferometry reveals transient gravitational wave anomalies across orbital baselines.",
  "Cryogenic optical reference cavities sustain fractional frequency instability below four parts in ten to the seventeenth.",
  "Adaptive phase compensation stabilizes multi-gigawatt coherent beam arrays through severe atmospheric turbulence.",
];

export default function TextRevealDemo() {
  const [granularity, setGranularity] = useState<"word" | "character" | "line">("word");
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  const nextHeadline = () => {
    setHeadlineIdx((prev) => (prev + 1) % TELEMETRY_HEADLINES.length);
    setCycleKey((prev) => prev + 1);
  };

  const setMode = (mode: "word" | "character" | "line") => {
    setGranularity(mode);
    setCycleKey((prev) => prev + 1);
  };

  return (
    <section
      aria-label="Aetheric Instruments Text Reveal"
      style={{
        padding: "2.5rem 1.5rem",
        maxWidth: 900,
        margin: "0 auto",
        color: "var(--foreground, #E9EBF0)",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "1px solid var(--border, #262B33)",
          paddingBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span
            aria-hidden="true"
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--primary, #FB923C)",
              display: "inline-block",
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted-foreground, #9AA1AF)",
            }}
          >
            Aetheric Observatory · Station 04
          </span>
        </div>

        <nav aria-label="Granularity and playback" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["word", "character", "line"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMode(mode)}
              aria-pressed={granularity === mode}
              style={{
                padding: "0.375rem 0.75rem",
                borderRadius: "4px",
                border: "1px solid var(--border, #262B33)",
                background: granularity === mode ? "var(--primary, #FB923C)" : "transparent",
                color: granularity === mode ? "var(--background, #0D0F12)" : "var(--foreground, #E9EBF0)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 500,
                minHeight: "36px",
              }}
            >
              By {mode}
            </button>
          ))}

          <button
            type="button"
            onClick={nextHeadline}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "4px",
              border: "1px solid var(--border, #262B33)",
              background: "transparent",
              color: "var(--foreground, #E9EBF0)",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
              minHeight: "36px",
            }}
          >
            Next Telemetry
          </button>
        </nav>
      </header>

      <article style={{ minHeight: "180px", display: "flex", alignItems: "center" }}>
        <TextReveal
          as="h1"
          by={granularity}
          replayKey={`${headlineIdx}-${cycleKey}`}
          style={{
            fontSize: "clamp(1.75rem, 3.8vw, 2.75rem)",
            fontWeight: 600,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            color: "var(--foreground, #E9EBF0)",
            margin: 0,
          }}
        >
          {TELEMETRY_HEADLINES[headlineIdx]}
        </TextReveal>
      </article>

      <footer
        style={{
          marginTop: "2.5rem",
          paddingTop: "1rem",
          borderTop: "1px solid var(--border, #262B33)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          fontSize: "0.8rem",
          color: "var(--muted-foreground, #9AA1AF)",
        }}
        className="mono"
      >
        <span>Baseline: 4,000 km Orbital Arc</span>
        <span>Carrier: 1064 nm Nd:YAG</span>
        <span>Status: Phase Locked</span>
      </footer>
    </section>
  );
}
