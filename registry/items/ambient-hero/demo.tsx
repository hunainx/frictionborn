// Original — Frictionborn Motion AmbientHero demo
"use client";

import React, { useState } from "react";
import { AmbientHero, type AmbientHeroVariant } from "./ambient-hero";

export default function AmbientHeroDemo() {
  const [variant, setVariant] = useState<AmbientHeroVariant>("mesh");

  return (
    <div style={{ width: "100%", background: "#0d0f12", minHeight: "600px", position: "relative" }}>
      {/* Demo Controls */}
      <div
        style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.25rem",
          zIndex: 20,
          display: "flex",
          gap: "0.5rem",
          background: "rgba(13, 15, 18, 0.75)",
          padding: "0.35rem 0.6rem",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        {(["mesh", "noise", "particles"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            style={{
              padding: "0.25rem 0.6rem",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono, monospace)",
              textTransform: "capitalize",
              background: variant === v ? "rgba(251, 146, 60, 0.25)" : "transparent",
              color: variant === v ? "#fb923c" : "rgba(255, 255, 255, 0.7)",
              border: variant === v ? "1px solid #fb923c" : "1px solid transparent",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      <AmbientHero
        variant={variant}
        eyebrow="Frictionborn Motion"
        headline="Calm motion, struck from a single spark."
        body="Open-source motion components for React and Next.js. Installed with the shadcn CLI, measured in real browsers, and calm when motion is reduced."
        primaryCta={{ label: "Browse components", href: "#engineering" }}
        secondaryCta={{ label: "Read how it is tested", href: "#specifications" }}
        showPauseButton={true}
      />
    </div>
  );
}
