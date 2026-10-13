// Original — Frictionborn Motion FlintButton demo
"use client";

import React, { useState } from "react";
import { FlintButton } from "./flint-button";

export default function FlintButtonDemo() {
  const [n, setN] = useState(0);
  return (
    <section aria-label="FlintButton demo" style={{ display: "grid", placeItems: "center", gap: 18, minHeight: 250, padding: "64px 16px 24px", background: "#0c0b0a", color: "#E9E5DF", borderRadius: 18 }}>
      <FlintButton litLabel="Lit" onClick={() => setN((v) => v + 1)}>Strike</FlintButton>
      <p style={{ margin: 0, fontSize: 14, color: "#a39d97" }}>{n === 0 ? "Click it, or rub across the stone fast." : `${n} ${n === 1 ? "strike" : "strikes"}. Friction makes heat.`}</p>
    </section>
  );
}
