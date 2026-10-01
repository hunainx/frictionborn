// Original — Frictionborn Motion TextReveal demo
"use client";

import React, { useState } from "react";
import { TextReveal } from "./text-reveal";

export default function TextRevealDemo() {
  const [granularity, setGranularity] = useState<"word" | "character" | "line">("word");
  const [triggerCount, setTriggerCount] = useState(0);

  const sentences = [
    "Engineered Motion for High-Signal Interfaces",
    "Zero Layout Shift Guaranteed via Font-Ready Splitting",
    "Defensive Frame Budgeting That Never Drops Frames",
  ];
  const [sentenceIdx, setSentenceIdx] = useState(0);

  return (
    <section aria-label="Text reveal demo" style={{ padding: "3rem 1.5rem", maxWidth: 860, margin: "0 auto" }}>
      <nav aria-label="Typography controls" style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {(["word", "character", "line"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              setGranularity(mode);
              setTriggerCount((c) => c + 1);
            }}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: granularity === mode ? "var(--ink)" : "var(--surface)",
              color: granularity === mode ? "var(--surface)" : "var(--ink)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Reveal by {mode}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setSentenceIdx((i) => (i + 1) % sentences.length);
            setTriggerCount((c) => c + 1);
          }}
          style={{
            marginLeft: "auto",
            padding: "0.375rem 0.75rem",
            borderRadius: 6,
            border: "1px solid var(--line)",
            background: "var(--surface)",
            color: "var(--ink)",
            cursor: "pointer",
          }}
        >
          Next Quote
        </button>
      </nav>

      <article style={{ minHeight: 180, display: "flex", alignItems: "center" }}>
        <TextReveal
          as="h2"
          by={granularity}
          replayKey={`${sentenceIdx}-${triggerCount}`}
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          {sentences[sentenceIdx]}
        </TextReveal>
      </article>

      <footer style={{ marginTop: "1.5rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--muted)" }}>
          Screen readers read unfragmented headline copy; zero animation frames execute after entrance completes.
        </p>
      </footer>
    </section>
  );
}
