// Original — Frictionborn Motion ScrollReveal demo
"use client";

import React, { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";

export default function ScrollRevealDemo() {
  const [styleMode, setStyleMode] = useState<"fade-up" | "fade" | "scale-up">("fade-up");

  const cards = [
    { tag: "CLS 0.00", heading: "Zero Cumulative Layout Shift", text: "Posters render identical dimensions before WebGL boots." },
    { tag: "0 rAF Idle", heading: "Suspended Inactive Loops", text: "Instant freeze when scrolled off-screen or tab switches." },
    { tag: "T0 to T3", heading: "Dynamic Capability Tiers", text: "Downgrades gracefully on thermal throttling and low RAM." },
  ];

  return (
    <div style={{ padding: "2rem 1rem", maxWidth: 900, margin: "0 auto" }}>
      <fieldset style={{ border: "none", padding: 0, margin: "0 0 2rem 0", display: "flex", gap: "0.5rem" }}>
        <legend className="sr-only">Scroll reveal transition variant</legend>
        {(["fade-up", "fade", "scale-up"] as const).map((m) => (
          <label
            key={m}
            style={{
              padding: "0.35rem 0.8rem",
              borderRadius: 4,
              border: "1px solid var(--line)",
              background: styleMode === m ? "var(--ink)" : "var(--surface)",
              color: styleMode === m ? "var(--surface)" : "var(--ink)",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
            }}
          >
            <input
              type="radio"
              name="scroll-mode"
              value={m}
              checked={styleMode === m}
              onChange={() => setStyleMode(m)}
              style={{ display: "none" }}
            />
            {m}
          </label>
        ))}
      </fieldset>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {cards.map((c, i) => (
          <ScrollReveal
            key={`${styleMode}-${i}`}
            animation={styleMode}
            distance={24}
            duration={350}
          >
            <aside
              style={{
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "1.5rem",
                background: "var(--surface)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: "var(--ink)",
                  fontWeight: 600,
                  marginBottom: "0.5rem",
                }}
              >
                {c.tag}
              </span>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "var(--ink)" }}>
                {c.heading}
              </h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
                {c.text}
              </p>
              <div style={{ marginTop: "1rem" }}>
                <a
                  href="#verify"
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    textDecoration: "underline",
                    outlineOffset: "2px",
                  }}
                >
                  Verify probe logs &rarr;
                </a>
              </div>
            </aside>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
