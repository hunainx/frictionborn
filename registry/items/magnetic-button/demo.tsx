// Original — Frictionborn Motion MagneticButton demo
"use client";

import React, { useState } from "react";
import { MagneticButton } from "./magnetic-button";

export default function MagneticButtonDemo() {
  const [pullPixels, setPullPixels] = useState(16);

  return (
    <section
      style={{
        padding: "4rem 2rem",
        textAlign: "center",
        background: "var(--background)",
      }}
    >
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", color: "var(--ink)", margin: "0 0 0.5rem 0" }}>
          Magnetic Attraction Zone
        </h2>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.95rem" }}>
          Fine pointer cursor tracking with spring physics settling to 0 rAF.
        </p>
      </div>

      <div style={{ display: "inline-flex", gap: "1.25rem", alignItems: "center" }}>
        <MagneticButton strength={pullPixels}>
          <button
            type="button"
            style={{
              padding: "1rem 2rem",
              borderRadius: "2rem",
              background: "var(--ink)",
              color: "var(--surface)",
              fontSize: "1rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              outlineOffset: "4px",
            }}
          >
            Launch Runner
          </button>
        </MagneticButton>

        <MagneticButton strength={Math.round(pullPixels * 0.6)}>
          <a
            href="#docs"
            style={{
              display: "inline-block",
              padding: "1rem 1.75rem",
              borderRadius: "2rem",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
              background: "var(--surface)",
              outlineOffset: "4px",
            }}
          >
            Read Specification
          </a>
        </MagneticButton>
      </div>

      <div style={{ marginTop: "3rem" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginRight: "0.75rem" }}>
          Spring Displacement:
        </span>
        {[10, 18, 28].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setPullPixels(val)}
            style={{
              margin: "0 0.25rem",
              padding: "0.2rem 0.6rem",
              fontSize: "0.8rem",
              borderRadius: 4,
              border: "1px solid var(--line)",
              background: pullPixels === val ? "var(--ink)" : "var(--surface)",
              color: pullPixels === val ? "var(--surface)" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {val}px
          </button>
        ))}
      </div>
    </section>
  );
}
