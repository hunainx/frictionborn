// Original — Frictionborn Motion ScrollShowcase demo
"use client";

import React, { useState } from "react";
import { ScrollShowcase } from "./scroll-showcase";

export default function ScrollShowcaseDemo() {
  const [showMarquee, setShowMarquee] = useState(true);

  return (
    <div style={{ width: "100%", background: "#0d0f12", position: "relative" }}>
      {/* ScrollShowcase starts at an h2 (the host page owns the h1): give the demo page its own */}
      <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
        Scroll showcase demo
      </h1>

      {/* Demo Controls */}
      <div
        style={{
          position: "sticky",
          top: "1rem",
          zIndex: 40,
          display: "flex",
          justifyContent: "flex-end",
          padding: "0 1.5rem",
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          onClick={() => setShowMarquee((m) => !m)}
          style={{
            pointerEvents: "auto",
            padding: "0.35rem 0.75rem",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono, monospace)",
            background: "rgba(21, 24, 29, 0.85)",
            color: "#fb923c",
            border: "1px solid #262b33",
            borderRadius: "6px",
            backdropFilter: "blur(8px)",
            cursor: "pointer",
          }}
        >
          {showMarquee ? "Hide Marquee" : "Show Marquee"}
        </button>
      </div>

      <ScrollShowcase showMarquee={showMarquee} smoothScroll={false} />
    </div>
  );
}
