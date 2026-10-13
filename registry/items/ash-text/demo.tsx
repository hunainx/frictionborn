// Original — Frictionborn Motion AshText demo
"use client";

import React from "react";
import { AshText } from "./ash-text";

export default function AshTextDemo() {
  return (
    <section aria-label="AshText demo" style={{ display: "grid", placeItems: "center", gap: 36, minHeight: 300, padding: "56px 16px", background: "#0c0b0a", color: "#ECE5DB", borderRadius: 18, overflow: "hidden" }}>
      <AshText as="h2" style={{ fontFamily: "'Archivo', 'Geist', system-ui, sans-serif", fontWeight: 900, fontSize: "clamp(44px, 12vw, 112px)", letterSpacing: "-0.03em", lineHeight: 1 }}>
        Ephemeral
      </AshText>
      <p style={{ margin: 0, fontSize: 14, color: "#a39d97" }}>Click the word, or use the button under it. It gathers itself back together.</p>
    </section>
  );
}
