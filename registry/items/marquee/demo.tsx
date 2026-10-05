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
  { model: "KA-100", name: "Near-field studio monitor", material: "Milled billet aluminum", category: "Reference" },
  { model: "KA-200", name: "Three-way active field monitor", material: "Solid birch baffle", category: "Mastering" },
  { model: "KA-300", name: "Sealed acoustic subwoofer", material: "Internal brace matrix", category: "Sub-bass" },
  { model: "KA-400", name: "Analog monitor controller", material: "Stepped gold-contact attenuator", category: "Console" },
  { model: "KA-500", name: "Open-back planar headphone", material: "Machined magnesium frame", category: "Listening" },
  { model: "KA-600", name: "Beryllium ribbon transducer", material: "Neodymium motor assembly", category: "Driver" },
  { model: "KA-700", name: "Diffraction horn waveguide", material: "Solid walnut throat", category: "Acoustics" },
];

export default function MarqueeDemo() {
  const [velocity, setVelocity] = useState(40);
  const [flowDirection, setFlowDirection] = useState<"left" | "right">("left");

  return (
    <section
      aria-label="Kona Acoustics Reference Instrument Catalog"
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
            Kona Acoustics · Reference Catalog
          </span>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
            Hand-assembled studio instruments
          </h1>
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
