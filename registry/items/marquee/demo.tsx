// Original — Frictionborn Motion Marquee demo
"use client";

import React, { useState } from "react";
import { Marquee } from "./marquee";

interface InstrumentEntry {
  model: string;
  name: string;
  material: string;
  category: string;
}

const INSTRUMENTS: InstrumentEntry[] = [
  { model: "noise-field", name: "Drifting noise background", material: "WebGL with CSS poster", category: "Backdrop" },
  { model: "mesh-gradient", name: "Slow-moving colour gradient", material: "WebGL and CSS poster", category: "Backdrop" },
  { model: "particle-field", name: "Field of drifting sparks", material: "WebGL with a CSS poster", category: "Backdrop" },
  { model: "distortion-image", name: "Image that bends on hover", material: "Hover effect on any still image", category: "Imagery" },
  { model: "text-reveal", name: "Headline revealed by word", material: "Word, character or line", category: "Headlines" },
  { model: "scroll-reveal", name: "Content that rises on scroll", material: "Fade, fade-up or scale-up", category: "Scroll" },
  { model: "magnetic-button", name: "Button that leans to pointer", material: "Pull distance in px", category: "Controls" },
];

export default function MarqueeDemo() {
  const [velocity, setVelocity] = useState(40);
  const [flowDirection, setFlowDirection] = useState<"left" | "right">("left");

  return (
    <section
      aria-label="Frictionborn Motion Component Catalog Ticker"
      style={{
        padding: "3rem 1rem",
        color: "var(--foreground, #E9EBF0)",
        maxWidth: 1000,
        margin: "0 auto",
      }}
    >
      <header
        style={{
          padding: "0 0.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
              marginBottom: "0.25rem",
            }}
          >
            Frictionborn Motion · Components
          </span>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
            Motion components you own as code
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setFlowDirection((d) => (d === "left" ? "right" : "left"))}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border: "1px solid var(--border, #262B33)",
            background: "transparent",
            color: "var(--foreground, #E9EBF0)",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 500,
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Direction: {flowDirection === "left" ? "Leftward" : "Rightward"}
        </button>
      </header>

      <div
        style={{
          borderTop: "1px solid var(--border, #262B33)",
          borderBottom: "1px solid var(--border, #262B33)",
          padding: "1rem 0",
          backgroundColor: "rgba(0, 0, 0, 0.15)",
        }}
      >
        <Marquee pixelsPerSecond={velocity} direction={flowDirection} gap="1.5rem" showPauseButton={true}>
          {INSTRUMENTS.map((inst) => (
            <div
              key={inst.model}
              style={{
                display: "inline-flex",
                flexDirection: "column",
                gap: "0.25rem",
                padding: "0.625rem 1rem",
                borderRadius: "6px",
                backgroundColor: "var(--card, rgba(21, 24, 29, 0.7))",
                border: "1px solid var(--border, #262B33)",
                minWidth: "220px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--primary, #FB923C)",
                  }}
                >
                  {inst.model}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--muted-foreground, #9AA1AF)",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {inst.category}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--foreground, #E9EBF0)",
                }}
              >
                {inst.name}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground, #9AA1AF)",
                }}
              >
                {inst.material}
              </span>
            </div>
          ))}
        </Marquee>
      </div>

      <footer
        style={{
          marginTop: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          fontSize: "0.8rem",
          color: "var(--muted-foreground, #9AA1AF)",
          padding: "0 0.5rem",
        }}
        className="mono"
      >
        <span>Drift speed: {velocity} px/s</span>
        <span>Hover, focus, or toggle button to pause ticker</span>
      </footer>
    </section>
  );
}
