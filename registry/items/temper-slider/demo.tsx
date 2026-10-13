// Original — Frictionborn Motion TemperSlider demo
"use client";

import React, { useState } from "react";
import { TemperSlider } from "./temper-slider";

export default function TemperSliderDemo() {
  const [c, setC] = useState(250);
  return (
    <section aria-label="TemperSlider demo" style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px", color: "#E9E5DF" }}>
      <TemperSlider value={c} onValueChange={setC} />
      <p style={{ margin: "14px 4px 0", fontSize: 14, color: "#a39d97" }}>Steel heated to {c} °C takes this colour as it cools. Drag the knob or use the arrow keys.</p>
    </section>
  );
}
