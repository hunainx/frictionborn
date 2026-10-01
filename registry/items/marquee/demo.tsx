// Original — Frictionborn Motion Marquee demo
"use client";

import React, { useState } from "react";
import { Marquee } from "./marquee";

export default function MarqueeDemo() {
  const [velocity, setVelocity] = useState(45);
  const [flowDirection, setFlowDirection] = useState<"left" | "right">("left");

  const ecosystem = [
    { name: "Next.js 16", type: "Framework" },
    { name: "React 19", type: "Core" },
    { name: "Turborepo", type: "Monorepo" },
    { name: "Playwright", type: "E2E Bench" },
    { name: "Vitest", type: "Unit Tests" },
    { name: "Axe-Core", type: "WCAG A11y" },
  ];

  return (
    <section style={{ padding: "3rem 0", background: "var(--surface)" }}>
      <header style={{ padding: "0 1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)" }}>Verified Ecosystem Stack</h3>
        <div>
          <button
            type="button"
            onClick={() => setFlowDirection((d) => (d === "left" ? "right" : "left"))}
            style={{
              padding: "0.25rem 0.65rem",
              borderRadius: 4,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              color: "var(--ink)",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Flip: {flowDirection}
          </button>
        </div>
      </header>

      <div style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "1rem 0" }}>
        <Marquee speed={velocity} direction={flowDirection} gap="2rem" showPauseButton={true}>
          {ecosystem.map((pkg) => (
            <div
              key={pkg.name}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.6rem 1.2rem",
                borderRadius: 8,
                background: "var(--background)",
                border: "1px solid var(--line)",
              }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--ink)" }}>{pkg.name}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>{pkg.type}</span>
            </div>
          ))}
        </Marquee>
      </div>

      <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--muted)" }}>
        Speed: {velocity}px/s. Hover or focus any chip to freeze transit.
      </p>
    </section>
  );
}
