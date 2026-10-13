// Original — Frictionborn Motion LightLeakTabs demo
"use client";

import React from "react";
import { LightLeakTabs } from "./light-leak-tabs";

const TABS = [
  { id: "heat", label: "Heat", content: <p style={{ margin: 0 }}><b style={{ display: "block", color: "#fff1e2", fontSize: 16, marginBottom: 4 }}>Heat</b>Every component is measured in a real browser before it ships.</p> },
  { id: "light", label: "Light", content: <p style={{ margin: 0 }}><b style={{ display: "block", color: "#fff1e2", fontSize: 16, marginBottom: 4 }}>Light</b>The effect draws only while something moves, then rests.</p> },
  { id: "ash", label: "Ash", content: <p style={{ margin: 0 }}><b style={{ display: "block", color: "#fff1e2", fontSize: 16, marginBottom: 4 }}>Ash</b>With reduced motion, the tabs work the same with a plain underline.</p> },
];

export default function LightLeakTabsDemo() {
  return (
    <section aria-label="LightLeakTabs demo" style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <LightLeakTabs label="How Frictionborn works" tabs={TABS} />
    </section>
  );
}
