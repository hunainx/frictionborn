// Original — Frictionborn Motion FlameSwitch demo
"use client";

import React, { useState } from "react";
import { FlameSwitch } from "./flame-switch";

export default function FlameSwitchDemo() {
  const [on, setOn] = useState(false);
  return (
    <section
      aria-label="FlameSwitch demo"
      style={{ position: "relative", display: "grid", placeItems: "center", minHeight: 250, padding: "48px 16px 24px", background: "#0c0b0a", color: "#E9E5DF", borderRadius: 18, overflow: "hidden" }}
    >
      <FlameSwitch label="Pilot flame" checked={on} onCheckedChange={setOn} />
      <p style={{ margin: "18px 0 0", fontSize: 14, color: "#a39d97", maxWidth: "36ch", textAlign: "center" }}>
        {on ? "The pilot is lit. Move your pointer past the flame to blow on it." : "A real switch: click it, or press Space when it has focus."}
      </p>
    </section>
  );
}
