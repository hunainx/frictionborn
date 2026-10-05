// Original — Frictionborn Motion Marquee demo
"use client";

import React, { useState } from "react";
import { Marquee } from "./marquee";

interface StationNode {
  code: string;
  facility: string;
  telemetry: string;
  metric: string;
}

const STATIONS: StationNode[] = [
  { code: "APEX-8", facility: "Atacama Submillimeter Array", telemetry: "Carrier Lock", metric: "5000m Elevation" },
  { code: "LIGO-H", facility: "Hanford 4km Interferometer", telemetry: "99.8% Coherence", metric: "1064nm Nd:YAG" },
  { code: "VIRGO-C", facility: "Cascina Gravitational Antenna", telemetry: "Frequency Locked", metric: "3km Baseline" },
  { code: "GEO-600", facility: "Ruthe Squeezed Vacuum Core", telemetry: "Quantum Enhanced", metric: "6dB Noise Squeeze" },
  { code: "KAGRA-O", facility: "Kamioka Cryogenic Detector", telemetry: "20K Nominal", metric: "Sapphire Test Masses" },
  { code: "LISA-PF", facility: "Drag-Free Orbital Sensor", telemetry: "Active Tracking", metric: "1.2 fN/√Hz" },
  { code: "ALMA-OSF", facility: "High-Altitude Phased Array", telemetry: "Phase Aligned", metric: "66 Antennas Synced" },
];

export default function MarqueeDemo() {
  const [velocity, setVelocity] = useState(40);
  const [flowDirection, setFlowDirection] = useState<"left" | "right">("left");

  return (
    <section
      aria-label="Aetheric Instruments Global Telemetry Feed"
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
            Aetheric Instruments · Global Telemetry Network
          </span>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
            Active Laser Observatory Links
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
          Reverse: {flowDirection === "left" ? "Westward" : "Eastward"}
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
          {STATIONS.map((station) => (
            <div
              key={station.code}
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
                  {station.code}
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
                  {station.telemetry}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--foreground, #E9EBF0)",
                }}
              >
                {station.facility}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground, #9AA1AF)",
                }}
              >
                {station.metric}
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
        <span>Telemetry Velocity: {velocity} px/s</span>
        <span>Hover, focus, or toggle button to hold feed</span>
      </footer>
    </section>
  );
}
